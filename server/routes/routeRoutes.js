const express = require("express");
const Route = require("../models/Route");
const Shop = require("../models/Shop");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/routes — list all delivery routes
router.get("/", protect, async (req, res) => {
  const routes = await Route.find({ active: true }).sort({ order: 1, name: 1 });
  res.json(routes);
});

// POST /api/routes  (owner + second_owner + permitted salesman)
router.post("/", protect, async (req, res, next) => {
  const canAddRoute =
    req.user.role === "owner" ||
    req.user.role === "second_owner" ||
    (req.user.role === "salesman" && req.user.canAddRoutesShops);
  if (!canAddRoute) return res.status(403).json({ message: "You do not have permission to create routes" });
  next();
}, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Route name is required" });
    const lastRoute = await Route.findOne({}).sort({ order: -1 });
    const order = lastRoute ? lastRoute.order + 1 : 1;
    const route = await Route.create({ name, description, order });
    res.status(201).json(route);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "A route with this name already exists" });
    res.status(500).json({ message: "Could not create route", error: err.message });
  }
});

// PATCH /api/routes/:id  (owner only)
router.patch("/:id", protect, allowRoles("owner"), async (req, res) => {
  const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!route) return res.status(404).json({ message: "Route not found" });
  res.json(route);
});

// DELETE /api/routes/:id  (owner only) — soft delete
router.delete("/:id", protect, allowRoles("owner"), async (req, res) => {
  const route = await Route.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!route) return res.status(404).json({ message: "Route not found" });
  res.json({ message: "Route deactivated" });
});

module.exports = router;
