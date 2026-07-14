const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.active) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register  (owner only — creates second owners / salesmen)
router.post("/register", protect, allowRoles("owner"), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (!["owner", "second_owner", "salesman"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "A user with this email already exists" });

    const user = await User.create({ name, email, password, role, phone });
    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Could not create user", error: err.message });
  }
});

module.exports = router;
