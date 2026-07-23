const express = require("express");
const Shop = require("../models/Shop");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/shops?route=<routeId> — list shops, optionally filtered by route
router.get("/", protect, async (req, res) => {
  const filter = { active: true };
  if (req.query.route) filter.route = req.query.route;
  const shops = await Shop.find(filter)
    .populate("route", "name")
    .sort({ route: 1, order: 1, name: 1 });
  res.json(shops);
});

// POST /api/shops  (owner + second_owner + permitted salesman)
router.post("/", protect, async (req, res, next) => {
  const canAddShop =
    req.user.role === "owner" ||
    req.user.role === "second_owner" ||
    (req.user.role === "salesman" && req.user.canAddRoutesShops);
  if (!canAddShop) return res.status(403).json({ message: "You do not have permission to create shops" });
  next();
}, async (req, res) => {
  try {
    const { name, route, address, contactNumber, ownerName } = req.body;
    if (!name || !route) return res.status(400).json({ message: "Shop name and route are required" });
    const lastShop = await Shop.findOne({ route }).sort({ order: -1 });
    const order = lastShop ? lastShop.order + 1 : 1;
    const shop = await Shop.create({ name, route, address, contactNumber, ownerName, order });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: "Could not create shop", error: err.message });
  }
});

// PATCH /api/shops/:id  (owner only)
router.patch("/:id", protect, allowRoles("owner"), async (req, res) => {
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
