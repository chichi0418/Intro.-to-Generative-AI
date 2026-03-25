const { getDbPool } = require('./db');

const SERVER_KEY_FREE_LIMIT = parseInt(process.env.SERVER_KEY_FREE_LIMIT ?? '20', 10);
const SERVER_KEY_FREE_WINDOW_MS = parseInt(
  process.env.SERVER_KEY_FREE_WINDOW_MS ?? String(24 * 60 * 60 * 1000),
  10,
);

const usageByIp = new Map();
let tableInitPromise;

async function ensureTable() {
  const pool = getDbPool();
  if (!pool) return false;
  if (!tableInitPromise) {
    tableInitPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS server_key_usage (
        ip TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        window_start_ms BIGINT NOT NULL,
        last_seen_at_ms BIGINT NOT NULL
      )
    `).catch((err) => {
      tableInitPromise = undefined;
      throw err;
    });
  }
  await tableInitPromise;
  return true;
}

function clearExpiredUsage(now = Date.now()) {
  for (const [ip, record] of usageByIp.entries()) {
    if (now - record.windowStart >= SERVER_KEY_FREE_WINDOW_MS) {
      usageByIp.delete(ip);
    }
  }
}

function consumeInMemory(ip) {
  const now = Date.now();
  clearExpiredUsage(now);

  const record = usageByIp.get(ip);
  if (!record) {
    usageByIp.set(ip, { count: 1, windowStart: now, lastSeenAt: now });
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - 1),
      resetAt: now + SERVER_KEY_FREE_WINDOW_MS,
    };
  }

  record.lastSeenAt = now;
  if (record.count >= SERVER_KEY_FREE_LIMIT) {
    usageByIp.set(ip, record);
    return {
      allowed: false,
      count: record.count,
      remaining: 0,
      resetAt: record.windowStart + SERVER_KEY_FREE_WINDOW_MS,
    };
  }

  record.count += 1;
  usageByIp.set(ip, record);
  return {
    allowed: true,
    count: record.count,
    remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - record.count),
    resetAt: record.windowStart + SERVER_KEY_FREE_WINDOW_MS,
  };
}

async function consumeInDb(ip) {
  const pool = getDbPool();
  const now = Date.now();
  const cutoff = now - SERVER_KEY_FREE_WINDOW_MS;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM server_key_usage WHERE window_start_ms < $1', [cutoff]);

    const { rows } = await client.query(
      'SELECT count, window_start_ms FROM server_key_usage WHERE ip = $1 FOR UPDATE',
      [ip],
    );

    if (rows.length === 0) {
      await client.query(
        'INSERT INTO server_key_usage (ip, count, window_start_ms, last_seen_at_ms) VALUES ($1, $2, $3, $4)',
        [ip, 1, now, now],
      );
      await client.query('COMMIT');
      return {
        allowed: true,
        count: 1,
        remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - 1),
        resetAt: now + SERVER_KEY_FREE_WINDOW_MS,
      };
    }

    const row = rows[0];
    const windowStartMs = Number(row.window_start_ms);
    const count = Number(row.count);

    if (count >= SERVER_KEY_FREE_LIMIT) {
      await client.query(
        'UPDATE server_key_usage SET last_seen_at_ms = $2 WHERE ip = $1',
        [ip, now],
      );
      await client.query('COMMIT');
      return {
        allowed: false,
        count,
        remaining: 0,
        resetAt: windowStartMs + SERVER_KEY_FREE_WINDOW_MS,
      };
    }

    const nextCount = count + 1;
    await client.query(
      'UPDATE server_key_usage SET count = $2, last_seen_at_ms = $3 WHERE ip = $1',
      [ip, nextCount, now],
    );
    await client.query('COMMIT');
    return {
      allowed: true,
      count: nextCount,
      remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - nextCount),
      resetAt: windowStartMs + SERVER_KEY_FREE_WINDOW_MS,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function consumeServerKeyQuota(ip) {
  try {
    const dbReady = await ensureTable();
    if (!dbReady) return consumeInMemory(ip);
    return await consumeInDb(ip);
  } catch (err) {
    console.error('Quota DB error, fallback to memory:', err.message);
    return consumeInMemory(ip);
  }
}

function getInMemorySnapshot() {
  const now = Date.now();
  clearExpiredUsage(now);

  const records = [];
  for (const [ip, record] of usageByIp.entries()) {
    const resetAt = record.windowStart + SERVER_KEY_FREE_WINDOW_MS;
    records.push({
      ip,
      count: record.count,
      remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - record.count),
      windowStart: record.windowStart,
      resetAt,
      lastSeenAt: record.lastSeenAt,
      blocked: record.count >= SERVER_KEY_FREE_LIMIT,
    });
  }

  records.sort((a, b) => b.count - a.count || b.lastSeenAt - a.lastSeenAt);

  return {
    storage: 'memory',
    now,
    limit: SERVER_KEY_FREE_LIMIT,
    windowMs: SERVER_KEY_FREE_WINDOW_MS,
    totalIps: records.length,
    records,
  };
}

async function getDbSnapshot() {
  const pool = getDbPool();
  const now = Date.now();
  const cutoff = now - SERVER_KEY_FREE_WINDOW_MS;

  await pool.query('DELETE FROM server_key_usage WHERE window_start_ms < $1', [cutoff]);
  const { rows } = await pool.query(
    'SELECT ip, count, window_start_ms, last_seen_at_ms FROM server_key_usage ORDER BY count DESC, last_seen_at_ms DESC',
  );

  const records = rows.map((row) => {
    const count = Number(row.count);
    const windowStart = Number(row.window_start_ms);
    return {
      ip: row.ip,
      count,
      remaining: Math.max(0, SERVER_KEY_FREE_LIMIT - count),
      windowStart,
      resetAt: windowStart + SERVER_KEY_FREE_WINDOW_MS,
      lastSeenAt: Number(row.last_seen_at_ms),
      blocked: count >= SERVER_KEY_FREE_LIMIT,
    };
  });

  return {
    storage: 'supabase-postgres',
    now,
    limit: SERVER_KEY_FREE_LIMIT,
    windowMs: SERVER_KEY_FREE_WINDOW_MS,
    totalIps: records.length,
    records,
  };
}

async function getServerKeyUsageSnapshot() {
  try {
    const dbReady = await ensureTable();
    if (!dbReady) return getInMemorySnapshot();
    return await getDbSnapshot();
  } catch (err) {
    console.error('Usage snapshot DB error, fallback to memory:', err.message);
    return getInMemorySnapshot();
  }
}

module.exports = {
  SERVER_KEY_FREE_LIMIT,
  SERVER_KEY_FREE_WINDOW_MS,
  consumeServerKeyQuota,
  getServerKeyUsageSnapshot,
};
