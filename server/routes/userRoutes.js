const express = require("express");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/users  (owner only)
router.get("/", protect, allowRoles("owner"), async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

// PATCH /api/users/:id/status  (owner only) — activate/deactivate an employee
router.patch("/:id/status", protect, allowRoles("owner"), async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { active }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

module.exports = router;
