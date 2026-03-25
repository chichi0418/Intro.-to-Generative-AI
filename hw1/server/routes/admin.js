const express = require('express');
const { getServerKeyUsageSnapshot, resetServerKeyUsageByIp } = require('../lib/serverKeyQuota');

const router = express.Router();

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
  res.json(snapshot);
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
