/**
 * controllers/authController.js — Register & Login handlers
 */
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    // passwordHash field triggers bcrypt pre-save hook
    const user = await User.create({ username, email, passwordHash: password });
    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, color: user.color },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, color: user.color },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/auth/me  (protected)
async function me(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user._id, username: user.username, email: user.email, color: user.color });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login, me };
