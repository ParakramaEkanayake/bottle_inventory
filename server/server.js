require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const routeRoutes = require("./routes/routeRoutes");
const shopRoutes = require("./routes/shopRoutes");
const distributionRoutes = require("./routes/distributionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const stockRequirementRoutes = require("./routes/stockRequirementRoutes");

const app = express();

// ---------- MongoDB Connection (Serverless-safe) ----------
// Cache connection across function invocations to avoid reconnecting on every request
let isConnected = false;
const ensureDBConnection = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await connectDB();
    isConnected = true;
  } catch (err) {
    console.error("DB connection error:", err);
    throw err;
  }
};

// In local dev, connect immediately. In production (Vercel), connect per-request.
if (process.env.NODE_ENV !== "production") {
  connectDB();
}

// ---------- CORS ----------
// CLIENT_URL can be a single URL or a comma-separated list, e.g.
// "http://localhost:5173,https://your-app.vercel.app"
// For same-domain deployment on Vercel, "*" or your Vercel URL is fine.
const allowedOrigins = (process.env.CLIENT_URL || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl/Postman (no origin header) and any listed origin
      if (allowedOrigins.includes("*") || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ---------- Static Uploads ----------
// ⚠️ NOTE: On Vercel serverless, the filesystem is READ-ONLY except /tmp,
// and files don't persist between requests. This static route only works
// locally. For production, use Cloudinary/S3 for file uploads.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- DB Middleware (Serverless) ----------
// Ensure DB is connected before handling any /api request in production
app.use(async (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    try {
      await ensureDBConnection();
    } catch (err) {
      return res.status(500).json({ message: "Database connection failed" });
    }
  }
  next();
});

// ---------- Routes ----------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/distributions", distributionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/stock-requirements", stockRequirementRoutes);

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

// ---------- Start Server (Local Only) ----------
// Vercel does NOT use app.listen() — it uses the exported app as a handler.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// ---------- Export for Vercel ----------
module.exports = app;