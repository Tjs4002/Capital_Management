const crypto = require('crypto');

// Map: token -> { email, expiresAt }
const tokens = new Map();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, {
    email,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

function verifyToken(token) {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token);
    return null; // expired
  }
  tokens.delete(token); // one-time use
  return entry.email;
}

module.exports = { generateToken, verifyToken };