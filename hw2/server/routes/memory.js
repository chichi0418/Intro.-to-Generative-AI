const express = require('express');
const router = express.Router();
const { getDbPool, getDbDisableReason } = require('../lib/db');
const { getMemories, addMemory, deleteMemory } = require('../lib/memoryHelper');
const { optionalAuth } = require('../lib/authMiddleware');

router.use(optionalAuth);

function getEffectiveClientId(req) {
  if (req.user) return `user:${req.user.userId}`;
  return req.query.clientId?.toString().trim() || req.body?.clientId?.toString().trim() || '';
}

function requireDb(req, res, next) {
  if (!getDbPool()) {
    const reason = getDbDisableReason();
    const detail = reason ? ` DB disabled: ${reason}` : '';
    return res.status(503).json({ error: `Memory storage not available. Check SUPABASE credentials/config.${detail}` });
  }
  next();
}

// GET /api/memory
router.get('/', requireDb, async (req, res) => {
  const clientId = getEffectiveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });
  const memories = await getMemories(clientId);
  res.json({ memories });
});

// POST /api/memory  { content }
router.post('/', requireDb, async (req, res) => {
  const clientId = getEffectiveClientId(req);
  const { content } = req.body;
  if (!clientId || !content?.trim()) return res.status(400).json({ error: 'clientId and content are required' });
  const memory = await addMemory(clientId, content);
  if (!memory) return res.status(500).json({ error: 'Failed to save memory' });
  res.status(201).json({ memory });
});

// DELETE /api/memory/:id
router.delete('/:id', requireDb, async (req, res) => {
  const { id } = req.params;
  const clientId = getEffectiveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });
  const ok = await deleteMemory(id, clientId);
  if (!ok) return res.status(404).json({ error: 'Memory not found' });
  res.json({ success: true });
});

module.exports = router;
