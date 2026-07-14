require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
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

connectDB();

// CLIENT_URL can be a single URL or a comma-separated list, e.g.
// "http://localhost:5173,https://your-app.vercel.app"
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
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Generic error handler (catches anything unhandled)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
