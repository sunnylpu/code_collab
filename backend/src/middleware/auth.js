/**
 * middleware/auth.js — JWT authentication middleware
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

/**
 * Express middleware: validates Bearer JWT token on protected routes.
 * Attaches decoded payload as req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, username, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Create a signed JWT for a given user document
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, email: user.email, color: user.color },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { requireAuth, signToken };
