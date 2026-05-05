const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

// FIX: Tighter limiter for login (5 attempts per 15 min, not 10 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// FIX: OTP endpoints also rate limited to prevent OTP brute-force
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many OTP attempts. Try again later." },
});

const {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} = require("../controllers/authController");

const authMiddleware = require('../middleware/authMiddleware');

// Simple request logger for /me endpoints to help debug client requests
const logReq = (req, res, next) => {
  try {
    console.log(`[AUTH-LOG] ${req.method} ${req.originalUrl} headers=${JSON.stringify(req.headers)} body=${JSON.stringify(req.body)}`);
  } catch (e) { /* ignore logging errors */ }
  next();
};

router.post("/register", register);
router.post("/verify", otpLimiter, verifyOTP);

// FIX: Duplicate route removed — original had two router.post("/login") entries
router.post("/login", loginLimiter, login);

router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);

// Profile endpoints
router.get('/me', authMiddleware, logReq, getProfile);
router.patch('/me', authMiddleware, logReq, updateProfile);

// Avatar upload (memory storage so controller can process/resize)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post('/avatar', authMiddleware, upload.single('avatar'), logReq, uploadAvatar);

// Change password
router.post('/change-password', authMiddleware, logReq, changePassword);

module.exports = router;