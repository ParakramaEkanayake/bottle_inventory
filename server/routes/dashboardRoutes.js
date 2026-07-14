const express = require("express");
const Stock = require("../models/Stock");
const StockTransaction = require("../models/StockTransaction");
const Distribution = require("../models/Distribution");
const Shop = require("../models/Shop");
const Route = require("../models/Route");
const { protect } = require("../middleware/auth");

const router = express.Router();
const todayStr = () => new Date().toISOString().slice(0, 10);

// GET /api/dashboard/summary — high level numbers for the owner/second-owner dashboard
router.get("/summary", protect, async (req, res) => {
  try {
    const stock = await Stock.find();

    const totalExpenseAgg = await StockTransaction.aggregate([
      { $group: { _id: null, total: { $sum: "$totalCost" } } },
    ]);
    const totalExpense = totalExpenseAgg[0]?.total || 0;

    const totalRevenueAgg = await Distribution.aggregate([
      { $group: { _id: null, total: { $sum: "$revenue" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const profitAgg = await Distribution.aggregate([
      {
        $group: {
          _id: null,
          total190ml: { $sum: "$distributed.190ml" },
          total250ml: { $sum: "$distributed.250ml" },
        },
      },
    ]);
    const profit190ml = (profitAgg[0]?.total190ml || 0) * 15;
    const profit250ml = (profitAgg[0]?.total250ml || 0) * 35;
    const profit = profit190ml + profit250ml;

    const today = todayStr();
    const todaysVisits = await Distribution.countDocuments({ visitDate: today });
    const totalShops = await Shop.countDocuments({ active: true });
    const totalRoutes = await Route.countDocuments({ active: true });

    const outstandingAgg = await Shop.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          out190: { $sum: "$outstanding.190ml" },
          out250: { $sum: "$outstanding.250ml" },
        },
      },
    ]);
    const outstanding = outstandingAgg[0] || { out190: 0, out250: 0 };

    res.json({
      stock,
      totalExpense,
      totalRevenue,
      profit,
      todaysVisits,
      totalShops,
      totalRoutes,
      outstandingBottles: { "190ml": outstanding.out190, "250ml": outstanding.out250 },
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load dashboard", error: err.message });
  }
});

module.exports = router;
