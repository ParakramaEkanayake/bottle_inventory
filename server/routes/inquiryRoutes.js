const express = require("express");
const path = require("path");
const multer = require("multer");
const Inquiry = require("../models/Inquiry");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/inquiries - salesmen and owners can view inquiries
router.get("/", protect, allowRoles("salesman", "owner", "second_owner"), async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("salesman", "name role")
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch inquiries", error: err.message });
  }
});

// POST /api/inquiries - salesman can create an inquiry
router.post("/", protect, allowRoles("salesman", "owner", "second_owner"), upload.single("image"), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !description || price === undefined || price === null) {
      return res.status(400).json({ message: "Name, description and price are required" });
    }

    const inquiry = await Inquiry.create({
      name,
      description,
      price: Number(price),
      image: req.file ? `/uploads/${req.file.filename}` : "",
      salesman: req.user._id,
    });

    res.status(201).json(inquiry);
  } catch (err) {
    res.status(500).json({ message: "Could not create inquiry", error: err.message });
  }
});

module.exports = router;
