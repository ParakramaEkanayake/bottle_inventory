const mongoose = require("mongoose");

const StockRequirementSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bottleType: {
      type: String,
      enum: ["190ml", "250ml"],
      required: true,
    },
    requiredQuantity: { type: Number, required: true, min: 0 },
    // How much of requiredQuantity has been given so far, applied automatically whenever a
    // matching distribution is recorded for this shop/bottleType. Once fulfilledQuantity
    // reaches requiredQuantity, the requirement is considered closed and stops showing as "needed".
    fulfilledQuantity: { type: Number, required: true, min: 0, default: 0 },
    date: { type: String, required: true }, // the day the requirement was entered (always set to "today" server-side)
    plannedDate: { type: String, required: true }, // the day the shop expects/needs the stock — must be today or later
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockRequirement", StockRequirementSchema);
