const express = require("express");
const mongoose = require("mongoose");
const Shop = require("../models/Shop");
const Route = require("../models/Route");
const Distribution = require("../models/Distribution");
const Stock = require("../models/Stock");
const StockRequirement = require("../models/StockRequirement");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

const todayStr = () => new Date().toISOString().slice(0, 10);
const BOTTLE_TYPES = ["190ml", "250ml"];

// Reduces the shop's outstanding stock requirement(s) for a bottle type by the amount just
// distributed, oldest planned date first. If the shop needed 10 and only 5 were given, the
// requirement stays open with 5 still remaining. Fully-met requirements stop showing up as "needed".
const applyToRequirements = async (shopId, bottleType, distributedQty) => {
  if (!distributedQty || distributedQty <= 0) return;
  let remainingToApply = distributedQty;

  const openRequirements = await StockRequirement.find({
    shop: shopId,
    bottleType,
    $expr: { $lt: ["$fulfilledQuantity", "$requiredQuantity"] },
  }).sort({ plannedDate: 1, createdAt: 1 });

  for (const req of openRequirements) {
    if (remainingToApply <= 0) break;
    const stillNeeded = req.requiredQuantity - req.fulfilledQuantity;
    const applied = Math.min(stillNeeded, remainingToApply);
    req.fulfilledQuantity += applied;
    remainingToApply -= applied;
    await req.save();
  }
};

// GET /api/distributions/route/:routeId?date=YYYY-MM-DD
// Returns every shop on the route plus today's visit status (pending=red, completed=green)
router.get("/route/:routeId", protect, async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const route = await Route.findById(req.params.routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const shops = await Shop.find({ route: req.params.routeId, active: true }).sort({ order: 1, createdAt: 1 });
    const visits = await Distribution.find({ route: req.params.routeId, visitDate: date });
    const visitByShop = {};
    visits.forEach((v) => (visitByShop[v.shop.toString()] = v));

    const result = shops.map((shop) => {
      const visit = visitByShop[shop._id.toString()];
      return {
        shop,
        status: visit ? visit.status : "pending",
        visit: visit || null,
      };
    });

    res.json({ route, date, shops: result });
  } catch (err) {
    res.status(500).json({ message: "Could not load route", error: err.message });
  }
});

// GET /api/distributions/shop/:shopId?date=YYYY-MM-DD
// Returns the shop's current outstanding balance and today's visit (if any) for the entry form
router.get("/shop/:shopId", protect, async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const shop = await Shop.findById(req.params.shopId).populate("route", "name");
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    const visit = await Distribution.findOne({ shop: shop._id, visitDate: date });
    res.json({ shop, visit: visit || null, date });
  } catch (err) {
    res.status(500).json({ message: "Could not load shop", error: err.message });
  }
});

// POST /api/distributions  (salesman, second_owner, owner)
// Records ONE delivery action for a shop. If a salesman already logged a delivery to this
// shop earlier today, this ADDS onto that day's running totals rather than replacing them —
// so multiple partial deliveries in the same day (e.g. give 3, then later give 2 more) stack
// up correctly instead of overwriting each other.
// Body: { shopId, date, distributed: {190ml, 250ml}, emptyCollected: {...}, missing: {...}, notes }
router.post("/", protect, allowRoles("salesman", "second_owner", "owner"), async (req, res) => {
  // Note: sequential (non-transactional) updates, so this works against a plain
  // standalone MongoDB instance too, not just a replica set.
  try {
    const {
      shopId,
      date,
      distributed = {},
      emptyCollected = {},
      missing = {},
      agentPrice = {},
      shopPrice = {},
      notes = "",
    } = req.body;
    if (!shopId) return res.status(400).json({ message: "shopId is required" });
    const visitDate = date || todayStr();

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const stocks = await Stock.find();
    const stockByType = {};
    stocks.forEach((s) => (stockByType[s.bottleType] = s));

    let existing = await Distribution.findOne({ shop: shopId, visitDate });

    // These are the amounts for THIS delivery only (not the day's total).
    const incDist = {};
    const incEmpty = {};
    const incMiss = {};
    const incAgentPrice = {};
    const incShopPrice = {};
    for (const t of BOTTLE_TYPES) {
      incDist[t] = Math.max(0, Number(distributed[t] || 0));
      incEmpty[t] = Math.max(0, Number(emptyCollected[t] || 0));
      incMiss[t] = Math.max(0, Number(missing[t] || 0));
      incAgentPrice[t] = Number(agentPrice[t] || 0);
      incShopPrice[t] = Number(shopPrice[t] || 0);
      if (incDist[t] > 0 && (incAgentPrice[t] <= 0 || incShopPrice[t] <= 0)) {
        return res.status(400).json({
          message: `Please provide agentPrice and shopPrice for ${t} when distributing bottles.`,
        });
      }
    }

    let revenueDelta = 0;
    let profitDelta = 0;
    const remainingAfter = {};
    for (const t of BOTTLE_TYPES) {
      const stockDoc = stockByType[t];
      if (stockDoc) {
        if (stockDoc.quantity < incDist[t]) {
          return res
            .status(400)
            .json({ message: `Not enough ${t} stock in the warehouse (have ${stockDoc.quantity}, tried to give ${incDist[t]})` });
        }
        stockDoc.quantity -= incDist[t];
      }

      const revenueForType = incDist[t] * incShopPrice[t];
      const costForType = incDist[t] * incAgentPrice[t];
      revenueDelta += revenueForType;
      profitDelta += revenueForType - costForType;

      const before = shop.outstanding[t] || 0;
      const after = before + incDist[t] - incEmpty[t] - incMiss[t];
      remainingAfter[t] = Math.max(0, after);
      shop.outstanding[t] = remainingAfter[t];
    }

    for (const s of stocks) await s.save();
    await shop.save();

    let responseBody;
    if (existing) {
      existing.agentPrice = existing.agentPrice || { "190ml": 0, "250ml": 0 };
      existing.shopPrice = existing.shopPrice || { "190ml": 0, "250ml": 0 };
      existing.profit = existing.profit || 0;

      BOTTLE_TYPES.forEach((t) => {
        const previousQty = existing.distributed[t] || 0;
        const newQty = previousQty + incDist[t];
        existing.distributed[t] = newQty;
        existing.emptyCollected[t] = (existing.emptyCollected[t] || 0) + incEmpty[t];
        existing.missing[t] = (existing.missing[t] || 0) + incMiss[t];
        existing.remainingAfter[t] = remainingAfter[t];

        if (incDist[t] > 0) {
          existing.agentPrice[t] = incAgentPrice[t] || existing.agentPrice[t];
          existing.shopPrice[t] = incShopPrice[t] || existing.shopPrice[t];
        }
      });
      existing.revenue = (existing.revenue || 0) + revenueDelta;
      existing.profit = existing.profit + profitDelta;
      existing.status = "completed";
      if (notes) existing.notes = notes;
      await existing.save();
      responseBody = existing;
    } else {
      responseBody = await Distribution.create({
        route: shop.route,
        shop: shop._id,
        salesman: req.user._id,
        visitDate,
        distributed: incDist,
        emptyCollected: incEmpty,
        missing: incMiss,
        remainingAfter,
        revenue: revenueDelta,
        agentPrice: incAgentPrice,
        shopPrice: incShopPrice,
        profit: profitDelta,
        status: "completed",
        notes,
      });
    }

    // Reduce any open "planned requirement" for this shop by exactly what was given
    // in THIS delivery — straightforward now, since incDist is always just this action's amount.
    for (const t of BOTTLE_TYPES) {
      await applyToRequirements(shop._id, t, incDist[t]);
    }

    res.status(201).json(responseBody);
  } catch (err) {
    res.status(400).json({ message: err.message || "Could not save the visit" });
  }
});

// GET /api/distributions/history?shopId=&routeId=&from=&to=
router.get("/history", protect, async (req, res) => {
  const filter = {};
  if (req.query.shopId) filter.shop = req.query.shopId;
  if (req.query.routeId) filter.route = req.query.routeId;
  if (req.query.from || req.query.to) {
    filter.visitDate = {};
    if (req.query.from) filter.visitDate.$gte = req.query.from;
    if (req.query.to) filter.visitDate.$lte = req.query.to;
  }
  const history = await Distribution.find(filter)
    .populate("shop", "name")
    .populate("route", "name")
    .populate("salesman", "name")
    .sort({ visitDate: -1, createdAt: -1 })
    .limit(500);

  const isOwner = req.user.email?.toLowerCase() === "owner@bottlesupplier.lk";
  const sanitized = history.map((record) => {
    if (isOwner) return record;
    const safe = record.toObject();
    delete safe.distributed;
    delete safe.emptyCollected;
    delete safe.missing;
    delete safe.agentPrice;
    delete safe.shopPrice;
    delete safe.profit;
    delete safe.salesman;
    return safe;
  });

  res.json(sanitized);
});

module.exports = router;
