const mongoose = require("mongoose");

// A record every time stock is added (purchased from the bottle company agent).
// Total cost is auto-calculated and logged as a company expense.
const StockTransactionSchema = new mongoose.Schema(
  {
    bottleType: { type: String, enum: ["190ml", "250ml"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    noOfCases: { type: Number, default: 0 },
    costPricePerUnit: { type: Number, required: true },
    totalCost: { type: Number, required: true }, // quantity * costPricePerUnit, auto-computed
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransaction", StockTransactionSchema);
