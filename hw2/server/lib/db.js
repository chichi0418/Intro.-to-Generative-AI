const { Pool } = require('pg');

let pool;
let dbDisabled = false;
let disableReason = '';

function isFatalDbError(err) {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('tenant or user not found') ||
    msg.includes('password authentication failed') ||
    msg.includes('no pg_hba.conf entry') ||
    msg.includes('role does not exist') ||
    msg.includes('database does not exist')
  );
}

function disableDb(reason) {
  if (dbDisabled) return;
  dbDisabled = true;
  disableReason = reason || 'unknown';
  if (pool) {
    pool.end().catch(() => {});
    pool = undefined;
  }
  console.error(`DB disabled, fallback to memory mode. Reason: ${disableReason}`);
}

function handleDbError(err, context = 'db') {
  if (isFatalDbError(err)) {
    disableDb(`${context}: ${err.message}`);
    return true;
  }
  return false;
}

function getDbDisableReason() {
  return disableReason;
}

function getConnectionString() {
  return process.env.SUPABASE_POOLER_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
}

function getDbPool() {
  if (dbDisabled) return null;
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      family: 4,
    });
  }
  return pool;
}

let usersTableReady = null;

async function ensureUsersTable() {
  const pool = getDbPool();
  if (!pool) return false;
  if (usersTableReady) return usersTableReady;
  usersTableReady = pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `).then(() => true).catch(err => {
    handleDbError(err, 'ensureUsersTable');
    console.error('ensureUsersTable error:', err.message);
    return false;
  });
  return usersTableReady;
}

let memoriesTableReady = null;

async function ensureMemoriesTable() {
  const pool = getDbPool();
  if (!pool) return false;
  if (memoriesTableReady) return memoriesTableReady;
  memoriesTableReady = pool.query(`
    CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS memories_client_id_idx ON memories(client_id);
  `).then(() => true).catch(err => {
    handleDbError(err, 'ensureMemoriesTable');
    console.error('ensureMemoriesTable error:', err.message);
    return false;
  });
  return memoriesTableReady;
}

module.exports = { getDbPool, ensureUsersTable, ensureMemoriesTable, handleDbError, getDbDisableReason };
