// Seeds the database with an initial owner account, the two bottle stock items,
// and a couple of sample routes/shops so the app is usable immediately after setup.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Stock = require("./models/Stock");
const Route = require("./models/Route");
const Shop = require("./models/Shop");

const run = async () => {
  await connectDB();

  // --- Stock (190ml and 250ml bottle prices as given) ---
  await Stock.findOneAndUpdate(
    { bottleType: "190ml" },
    { $setOnInsert: { quantity: 0, costPrice: 115, sellPrice: 130 } },
    { upsert: true }
  );
  await Stock.findOneAndUpdate(
    { bottleType: "250ml" },
    { $setOnInsert: { quantity: 0, costPrice: 145, sellPrice: 180 } },
    { upsert: true }
  );
  console.log("Stock items ready: 190ml (cost 115 / sell 130), 250ml (cost 145 / sell 180)");

  // --- Default owner login ---
  const ownerEmail = "owner@bottlesupplier.lk";
  const existingOwner = await User.findOne({ email: ownerEmail });
  if (!existingOwner) {
    await User.create({
      name: "System Owner",
      email: ownerEmail,
      password: "Owner@123",
      role: "owner",
    });
    console.log(`Owner account created -> email: ${ownerEmail} / password: Owner@123`);
  } else {
    console.log("Owner account already exists, skipping.");
  }

  // --- Sample route + shops around Kandy ---
  let route = await Route.findOne({ name: "Kandy Town Route" });
  if (!route) {
    route = await Route.create({ name: "Kandy Town Route", description: "Kandy city centre and surrounding shops" });
    const shopNames = [
      "Lake View Grocery",
      "Dalada Super Market",
      "Peradeniya Road Stores",
      "Katugastota Mini Mart",
      "Hill Street Shop",
    ];
    for (const name of shopNames) {
      await Shop.create({ name, route: route._id, address: "Kandy" });
    }
    console.log("Sample route 'Kandy Town Route' created with 5 shops.");
  } else {
    console.log("Sample route already exists, skipping.");
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
