const express = require("express");
const Stock = require("../models/Stock");
const StockTransaction = require("../models/StockTransaction");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/stock — current stock levels for both bottle types
router.get("/", protect, async (req, res) => {
  const stock = await Stock.find();
  res.json(stock);
});

// GET /api/stock/transactions — expense history (stock added from the agent)
router.get("/transactions", protect, async (req, res) => {
  const transactions = await StockTransaction.find()
    .populate("addedBy", "name role")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(transactions);
});

// POST /api/stock/add  (owner + second_owner) — add stock received from the bottle company agent.
// Automatically computes and logs the company expense for this purchase.
router.post("/add", protect, allowRoles("owner", "second_owner"), async (req, res) => {
  try {
    const { bottleType, quantity, noOfCases } = req.body;
    if (!["190ml", "250ml"].includes(bottleType)) {
      return res.status(400).json({ message: "bottleType must be 190ml or 250ml" });
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive number" });
    }

    const parsedCases = Number(noOfCases);
    const calculatedCases = Number.isFinite(parsedCases) && parsedCases > 0 ? parsedCases : qty / 30;

    const stock = await Stock.findOne({ bottleType });
    if (!stock) return res.status(404).json({ message: "Stock item not configured" });

    stock.quantity += qty;
    await stock.save();

    const totalCost = qty * stock.costPrice;
    const transaction = await StockTransaction.create({
      bottleType,
      quantity: qty,
      noOfCases: calculatedCases,
      costPricePerUnit: stock.costPrice,
      totalCost,
      addedBy: req.user._id,
      note: req.body.note || "",
    });

    res.status(201).json({ stock, transaction });
  } catch (err) {
    res.status(500).json({ message: "Could not add stock", error: err.message });
  }
});

// PATCH /api/stock/:bottleType/price  (owner only) — update cost/sell price
router.patch("/:bottleType/price", protect, allowRoles("owner"), async (req, res) => {
  try {
    const { costPrice, sellPrice } = req.body;
    const update = {};
    if (costPrice !== undefined) update.costPrice = costPrice;
    if (sellPrice !== undefined) update.sellPrice = sellPrice;
    const stock = await Stock.findOneAndUpdate({ bottleType: req.params.bottleType }, update, { new: true });
    if (!stock) return res.status(404).json({ message: "Stock item not found" });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

module.exports = router;
