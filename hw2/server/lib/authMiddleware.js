const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod';
}

// Attach user to req if token present; does NOT block unauthenticated requests
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) return next();
  try {
    req.user = jwt.verify(header.slice(7), getJwtSecret());
  } catch {
    // Invalid token — treat as guest
  }
  next();
}

// Block if not authenticated
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(header.slice(7), getJwtSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

module.exports = { optionalAuth, requireAuth, signToken };
