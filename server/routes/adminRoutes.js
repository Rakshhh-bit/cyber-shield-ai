const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Scan = require("../models/Scan");

const authMiddleware = require("../middleware/authMiddleware");
const { deleteUser, deleteScan } = require("../controllers/adminController");

// ================= ADMIN CHECK =================
const adminOnly = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Admin access denied",
      });
    }

    next();

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Admin middleware error",
    });
  }
};

// ================= GET USERS =================
router.get(
  "/users",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {

      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        error: "Failed to fetch users",
      });
    }
  }
);

// ================= GET SCANS =================
router.get(
  "/scans",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {

      const scans = await Scan.find()
        .sort({ createdAt: -1 })
        .limit(100);

      res.json(scans);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        error: "Failed to fetch scans",
      });
    }
  }
);

// ================= DELETE USER =================
router.delete(
  "/user/:id",
  authMiddleware,
  adminOnly,
  deleteUser
);

// ================= DELETE SCAN =================
router.delete(
  "/scan/:id",
  authMiddleware,
  adminOnly,
  deleteScan
);

module.exports = router;
