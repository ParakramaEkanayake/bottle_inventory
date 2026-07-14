const express = require("express");
const StockRequirement = require("../models/StockRequirement");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

const todayStr = () => new Date().toISOString().slice(0, 10);

// Adds a "remainingQuantity" field to each requirement (requiredQuantity - fulfilledQuantity)
// so the frontend never has to do this math itself.
const withRemaining = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, remainingQuantity: Math.max(0, obj.requiredQuantity - obj.fulfilledQuantity) };
};

// GET /api/stock-requirements/route/:routeId
// Only returns requirements that are still outstanding (not yet fully given).
router.get("/route/:routeId", protect, allowRoles("salesman", "owner", "second_owner"), async (req, res) => {
  try {
    const requirements = await StockRequirement.find({
      route: req.params.routeId,
      $expr: { $lt: ["$fulfilledQuantity", "$requiredQuantity"] },
    })
      .populate("shop", "name")
      .sort({ plannedDate: 1, createdAt: -1 });
    res.json(requirements.map(withRemaining));
  } catch (err) {
    res.status(500).json({ message: "Could not fetch stock requirements", error: err.message });
  }
});

// GET /api/stock-requirements/shop/:shopId
// Only returns requirements that are still outstanding for this shop.
router.get("/shop/:shopId", protect, allowRoles("salesman", "owner", "second_owner"), async (req, res) => {
  try {
    const requirements = await StockRequirement.find({
      shop: req.params.shopId,
      $expr: { $lt: ["$fulfilledQuantity", "$requiredQuantity"] },
    })
      .populate("shop", "name route")
      .populate("route", "name")
      .sort({ plannedDate: 1, createdAt: -1 });
    res.json(requirements.map(withRemaining));
  } catch (err) {
    res.status(500).json({ message: "Could not fetch shop requirements", error: err.message });
  }
});

// POST /api/stock-requirements
// The entry date is always "today" (server decides this, not the client).
// plannedDate must be today or in the future — a salesman can't log a requirement for a past visit.
router.post("/", protect, allowRoles("salesman", "owner", "second_owner"), async (req, res) => {
  try {
    const { route, shop, bottleType, requiredQuantity, plannedDate } = req.body;

    if (!route || !shop || !bottleType || requiredQuantity === undefined || !plannedDate) {
      return res.status(400).json({ message: "Route, shop, bottle type, required quantity and planned date are required" });
    }

    const today = todayStr();
    if (plannedDate < today) {
      return res.status(400).json({ message: "Planned date can't be in the past — choose today or a future date" });
    }

    const requirement = await StockRequirement.create({
      route,
      shop,
      salesman: req.user._id,
      bottleType,
      requiredQuantity: Number(requiredQuantity),
      fulfilledQuantity: 0,
      date: today,
      plannedDate,
    });

    res.status(201).json(withRemaining(requirement));
  } catch (err) {
    res.status(500).json({ message: "Could not create stock requirement", error: err.message });
  }
});

module.exports = router;
