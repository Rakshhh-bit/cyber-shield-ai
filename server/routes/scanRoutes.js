const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  scanEmail,
  scanLink,
  scanMessage,
  getScans,
} = require("../controllers/scanController");

router.post("/email", authMiddleware, scanEmail);
router.post("/link", authMiddleware, scanLink);
router.post("/message", authMiddleware, scanMessage);
router.get("/", authMiddleware, getScans);

module.exports = router;