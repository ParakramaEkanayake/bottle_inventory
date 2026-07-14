const mongoose = require("mongoose");

// One document per bottle type holding the current live stock level and pricing
const StockSchema = new mongoose.Schema(
  {
    bottleType: { type: String, enum: ["190ml", "250ml"], required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 }, // full bottles currently in the warehouse
    costPrice: { type: Number, required: true }, // price paid to the bottle company agent, per bottle
    sellPrice: { type: Number, required: true }, // price charged to shops, per bottle
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
