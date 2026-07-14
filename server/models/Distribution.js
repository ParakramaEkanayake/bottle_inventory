const mongoose = require("mongoose");

// One record per salesman visit to a shop on a given day.
const DistributionSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    visitDate: { type: String, required: true }, // YYYY-MM-DD, so "today's route" is easy to query
    distributed: {
      "190ml": { type: Number, default: 0 },
      "250ml": { type: Number, default: 0 },
    },
    emptyCollected: {
      "190ml": { type: Number, default: 0 },
      "250ml": { type: Number, default: 0 },
    },
    missing: {
      "190ml": { type: Number, default: 0 },
      "250ml": { type: Number, default: 0 },
    },
    // Outstanding bottle balance at the shop AFTER this visit was recorded (auto-calculated)
    remainingAfter: {
      "190ml": { type: Number, default: 0 },
      "250ml": { type: Number, default: 0 },
    },
    revenue: { type: Number, default: 0 }, // distributed bottles * sell price, this visit
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

DistributionSchema.index({ shop: 1, visitDate: 1 }, { unique: true });

module.exports = mongoose.model("Distribution", DistributionSchema);
