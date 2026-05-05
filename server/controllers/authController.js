const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // FIX: Use crypto for secure random tokens

// ─── TEMP STORAGE WITH EXPIRY ─────────────────────────────────────────────────
// FIX: OTPs now have 10-minute expiry; reset tokens have 1-hour expiry
// NOTE: For production, move these to Redis for persistence across restarts
let otpStore   = {}; // { email: { otp, data, expiresAt } }
let resetStore = {}; // { token: { email, expiresAt } }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password must be at least 8 chars, include upper, lower, digit, special
const isStrongPassword = (pwd) => {
  if (!pwd || typeof pwd !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
};

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // FIX: Input validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
      if (!isStrongPassword(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character" });
      }

    // FIX: Check if email already registered BEFORE sending OTP
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(password, 12); // FIX: Rounds bumped from 10 to 12

    // FIX: Store OTP with 10-minute expiry
    otpStore[email.toLowerCase()] = {
      otp,
      data: { firstName, lastName, email: email.toLowerCase(), password: hashedPassword },
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    await transporter.sendMail({
      from: `"CyberShield" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CyberShield — Your OTP Code",
      text: `Your OTP is: ${otp}\n\nThis code expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const record = otpStore[email.toLowerCase()];

    if (!record) {
      return res.status(400).json({ error: "No OTP found for this email" });
    }

    // FIX: Check expiry
    if (Date.now() > record.expiresAt) {
      delete otpStore[email.toLowerCase()];
      return res.status(400).json({ error: "OTP has expired. Please register again." });
    }

    // FIX: Use strict equality with parseInt to prevent type coercion bypass
    if (parseInt(record.otp) !== parseInt(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = new User({ ...record.data, role: "user" });
    await user.save();
    delete otpStore[email.toLowerCase()];

    res.json({ message: "Account created successfully" });

  } catch (err) {
    console.error("OTP error:", err.message);
    res.status(500).json({ error: "Verification failed" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIX: Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // FIX: Use same generic error to prevent user enumeration attacks
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        error: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        user.loginAttempts = 0;
        await user.save();
        return res.status(403).json({ error: "Too many attempts. Account locked for 15 minutes." });
      }

      await user.save();
      const remaining = MAX_ATTEMPTS - user.loginAttempts;
      return res.status(400).json({ error: `Invalid credentials. ${remaining} attempt(s) left.` });
    }

    // Success — reset counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// ─── GET PROFILE ────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    console.log(`[AUTH] getProfile called for user=${req.user?.id}`);
    const user = await User.findById(req.user.id).select('firstName lastName email role createdAt avatarUrl');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl || null,
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── UPDATE PROFILE ─────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    console.log(`[AUTH] updateProfile called for user=${req.user?.id} body=${JSON.stringify(req.body)}`);
    const { firstName, lastName } = req.body;
    // Require at least a first name; last name may be empty
    if (!firstName) return res.status(400).json({ error: 'First name is required' });
    const sanitizedFirst = firstName.trim();
    const sanitizedLast = (lastName || '').trim();
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { firstName: sanitizedFirst, lastName: sanitizedLast },
      { returnDocument: 'after' }
    ).select('firstName lastName email role createdAt avatarUrl');
    res.json({
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt,
      avatarUrl: updated.avatarUrl || null,
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // FIX: Don't reveal whether email exists (prevents user enumeration)
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // FIX: Use crypto.randomBytes instead of Math.random() for secure token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // FIX: Store with 1-hour expiry, keyed by token (not email) for O(1) lookup
    resetStore[resetToken] = {
      email: email.toLowerCase(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
    const link = `${clientUrl}/reset/${resetToken}`;

    await transporter.sendMail({
      from: `"CyberShield" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CyberShield - Reset Your Password",
      text: `Reset your CyberShield password using this link:\n\n${link}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          Your CyberShield password reset link expires in 1 hour.
        </div>
        <div style="margin:0;padding:34px 16px;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dfe7f0;border-radius:18px;overflow:hidden;box-shadow:0 22px 60px rgba(15,23,42,0.14);">
            <div style="padding:26px 30px;background:#06111f;color:#ffffff;">
              <div style="display:inline-block;padding:7px 10px;border-radius:10px;background:#0b7cff;color:#ffffff;font-size:18px;font-weight:800;line-height:1;">C</div>
              <div style="display:inline-block;margin-left:10px;vertical-align:middle;">
                <div style="font-size:19px;font-weight:800;letter-spacing:0.03em;">CyberShield</div>
                <div style="margin-top:4px;font-size:11px;color:#7dd3fc;letter-spacing:0.16em;text-transform:uppercase;">AI Security Reset</div>
              </div>
            </div>

            <div style="padding:28px 30px;background:#0b1728;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7dd3fc;font-weight:700;">Password Recovery</div>
              <h1 style="margin:10px 0 10px;font-size:28px;line-height:1.2;color:#ffffff;">Secure password reset requested</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Use the button below to create a new CyberShield password. This secure session is valid for the next 1 hour.
              </p>
            </div>

            <div style="padding:30px;">
              <div style="margin-bottom:24px;padding:16px;border-radius:14px;background:#f8fbff;border:1px solid #dbeafe;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 10px 0 0;width:42px;vertical-align:top;">
                      <div style="width:36px;height:36px;border-radius:10px;background:#dbeafe;color:#0b7cff;text-align:center;line-height:36px;font-size:18px;font-weight:800;">!</div>
                    </td>
                    <td style="padding:0;vertical-align:top;">
                      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:4px;">Reset link information</div>
                      <div style="font-size:13px;line-height:1.6;color:#526179;">
                        This link works once, expires in 1 hour, and should only be used by you.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align:center;margin:26px 0;">
                <a href="${link}" style="display:inline-block;padding:15px 28px;border-radius:12px;background:#0b7cff;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;box-shadow:0 12px 26px rgba(11,124,255,0.26);">
                Reset Password
                </a>
              </div>

              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#526179;text-align:center;">
                After updating your password, return to CyberShield and sign in with the new credentials.
              </p>

              <div style="margin-top:22px;padding:15px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:700;">Button not working? Paste this secure link into your browser:</p>
                <a href="${link}" style="font-size:12px;line-height:1.55;color:#2563eb;word-break:break-all;text-decoration:none;">${link}</a>
              </div>

              <div style="margin-top:20px;padding-top:18px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#7b8794;">
                  If you did not request a password reset, ignore this email. Your current password will stay unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });

  } catch (err) {
    console.error("Forgot error:", err.message);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
      if (!isStrongPassword(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character" });
      }

    // FIX: Direct O(1) lookup by token instead of scanning all keys
    const record = resetStore[token];

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // FIX: Check expiry
    if (Date.now() > record.expiresAt) {
      delete resetStore[token];
      return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.updateOne({ email: record.email }, { password: hashedPassword });

    delete resetStore[token];

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Reset error:", err.message);
    res.status(500).json({ error: "Password reset failed" });
  }
};

// ─── UPLOAD AVATAR ───────────────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Ensure upload dir exists
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${req.user.id}-${Date.now()}.jpg`;
    const outPath = path.join(uploadDir, filename);

    // Resize to 256x256 and save as jpeg
    await sharp(req.file.buffer).resize(256, 256, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(outPath);

    const serverUrl = process.env.SERVER_URL || `http://localhost:5001`;
    const avatarUrl = `${serverUrl}/uploads/avatars/${filename}`;

    // persist to user
    const updated = await User.findByIdAndUpdate(req.user.id, { avatarUrl }, { returnDocument: 'after' }).select('firstName lastName email role avatarUrl createdAt');

    res.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err.message || err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// ─── CHANGE PASSWORD ────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords required' });
      if (!isStrongPassword(newPassword)) return res.status(400).json({ error: 'New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message || err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = { register, verifyOTP, login, forgotPassword, resetPassword, getProfile, updateProfile, uploadAvatar, changePassword };
