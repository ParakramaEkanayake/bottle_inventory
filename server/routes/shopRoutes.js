const express = require("express");
const Shop = require("../models/Shop");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/shops?route=<routeId> — list shops, optionally filtered by route
router.get("/", protect, async (req, res) => {
  const filter = { active: true };
  if (req.query.route) filter.route = req.query.route;
  const shops = await Shop.find(filter).populate("route", "name").sort({ name: 1 });
  res.json(shops);
});

// POST /api/shops  (owner + second_owner)
router.post("/", protect, allowRoles("owner", "second_owner"), async (req, res) => {
  try {
    const { name, route, address, contactNumber, ownerName } = req.body;
    if (!name || !route) return res.status(400).json({ message: "Shop name and route are required" });
    const shop = await Shop.create({ name, route, address, contactNumber, ownerName });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: "Could not create shop", error: err.message });
  }
});

// PATCH /api/shops/:id  (owner + second_owner)
router.patch("/:id", protect, allowRoles("owner", "second_owner"), async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  res.json(shop);
});

// DELETE /api/shops/:id  (owner only) — soft delete
router.delete("/:id", protect, allowRoles("owner"), async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  res.json({ message: "Shop deactivated" });
});

module.exports = router;
