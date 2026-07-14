const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    address: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    active: { type: Boolean, default: true },
    // Running balance of bottles currently out at this shop (given but not yet returned as empty/written off).
    outstanding: {
      "190ml": { type: Number, default: 0 },
      "250ml": { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", ShopSchema);
