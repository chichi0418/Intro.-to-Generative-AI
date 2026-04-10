const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getDbPool, ensureUsersTable } = require('../lib/db');
const { signToken, requireAuth } = require('../lib/authMiddleware');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (username.trim().length < 2 || username.trim().length > 32) {
    return res.status(400).json({ error: 'Username must be 2–32 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  try {
    await ensureUsersTable();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username.trim().toLowerCase(), passwordHash]
    );
    const user = result.rows[0];
    const token = signToken({ userId: user.id, username: user.username });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  try {
    await ensureUsersTable();
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username.trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = signToken({ userId: user.id, username: user.username });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — verify token and return user info
router.get('/me', requireAuth, (req, res) => {
  res.json({ userId: req.user.userId, username: req.user.username });
});

module.exports = router;
