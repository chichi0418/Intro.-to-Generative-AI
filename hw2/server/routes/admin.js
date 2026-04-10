const express = require('express');
const { getServerKeyUsageSnapshot, resetServerKeyUsageByIp } = require('../lib/serverKeyQuota');
const { getDbPool } = require('../lib/db');

const router = express.Router();

async function enrichWithUsernames(snapshot) {
  const pool = getDbPool();
  if (!pool) return snapshot;

  // Collect userIds from records with identifier like "user:{uuid}"
  const userIds = snapshot.records
    .map(r => r.identifier)
    .filter(id => id.startsWith('user:'))
    .map(id => id.slice(5));

  if (userIds.length === 0) return snapshot;

  try {
    const { rows } = await pool.query(
      'SELECT id, username FROM users WHERE id = ANY($1::uuid[])',
      [userIds]
    );
    const idToUsername = Object.fromEntries(rows.map(r => [r.id, r.username]));

    const records = snapshot.records.map(r => {
      if (!r.identifier.startsWith('user:')) return r;
      const userId = r.identifier.slice(5);
      return { ...r, username: idToUsername[userId] ?? null };
    });

    return { ...snapshot, records };
  } catch {
    return snapshot;
  }
}

function readAdminToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return String(req.headers['x-admin-token'] || '').trim();
}

function ensureAdminAuth(req, res, next) {
  const expected = String(process.env.ADMIN_API_TOKEN || '').trim();
  if (!expected) {
    return res.status(503).json({ error: 'Admin endpoint is not configured.', code: 'ADMIN_NOT_CONFIGURED' });
  }

  const got = readAdminToken(req);
  if (!got || got !== expected) {
    return res.status(401).json({ error: 'Unauthorized', code: 'ADMIN_UNAUTHORIZED' });
  }

  next();
}

router.get('/usage', ensureAdminAuth, async (req, res) => {
  const snapshot = await getServerKeyUsageSnapshot();
  res.json(await enrichWithUsernames(snapshot));
});

router.post('/usage/reset', ensureAdminAuth, async (req, res) => {
  const key = String(req.body?.key || req.body?.ip || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'key is required' });
  }
  const removed = await resetServerKeyUsageByIp(key);
  return res.json({ ok: true, removed });
});

module.exports = router;
