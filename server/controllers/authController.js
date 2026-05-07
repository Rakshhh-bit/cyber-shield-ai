const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ─── TEMP STORAGE ─────────────────────────────────────────────
let otpStore = {};
let resetStore = {};

// ─── HELPERS ─────────────────────────────────────────────────
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (pwd) => {
  if (!pwd || typeof pwd !== "string")
    return false;

  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    pwd
  );
};

// ─── NODEMAILER ─────────────────────────────────────────────
const transporter =
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── REGISTER ───────────────────────────────────────────────
const register = async (req, res) => {
  try {

    console.log("REGISTER STARTED");

    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
    } = req.body;

    // REQUIRED VALIDATION
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobile ||
      !password
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // EMAIL VALIDATION
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // MOBILE VALIDATION
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        error:
          "Mobile number must be 10 digits",
      });
    }

    // PASSWORD VALIDATION
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must contain uppercase, lowercase, number and special character",
      });
    }

    // CHECK EMAIL EXISTS
    const existingEmail =
      await User.findOne({
        email: email.toLowerCase(),
      });

    if (existingEmail) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    // CHECK MOBILE EXISTS
    const existingMobile =
      await User.findOne({
        mobile,
      });

    if (existingMobile) {
      return res.status(400).json({
        error:
          "Mobile number already registered",
      });
    }

    // GENERATE OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    );

    console.log("OTP GENERATED");

    // HASH PASSWORD
    const hashedPassword =
      await bcrypt.hash(password, 12);

    // STORE OTP
    otpStore[email.toLowerCase()] = {
      otp,
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        mobile,
        password: hashedPassword,
      },
      expiresAt:
        Date.now() + 10 * 60 * 1000,
    };

    // SEND EMAIL WITH TIMEOUT
    await Promise.race([

      transporter.sendMail({
        from: `"CyberShield" <${process.env.EMAIL_USER}>`,
        to: email,
        subject:
          "CyberShield — Your OTP Code",
        text: `Your OTP is: ${otp}\n\nThis code expires in 10 minutes.`,
      }),

      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Email timeout"
              )
            ),
          15000
        )
      ),

    ]);

    console.log("EMAIL SENT");

    res.json({
      message:
        "OTP sent to your email",
    });

  } catch (err) {

    console.error(
      "Register error:",
      err.message
    );

    res.status(500).json({
      error:
        err.message ||
        "Registration failed",
    });
  }
};

// ─── VERIFY OTP ─────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error:
          "Email and OTP are required",
      });
    }

    const record =
      otpStore[email.toLowerCase()];

    if (!record) {
      return res.status(400).json({
        error:
          "No OTP found for this email",
      });
    }

    // OTP EXPIRED
    if (
      Date.now() >
      record.expiresAt
    ) {

      delete otpStore[
        email.toLowerCase()
      ];

      return res.status(400).json({
        error:
          "OTP has expired. Please register again.",
      });
    }

    // WRONG OTP
    if (
      parseInt(record.otp) !==
      parseInt(otp)
    ) {
      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    // CREATE USER
    const user = new User({
      ...record.data,
      role: "user",
    });

    await user.save();

    delete otpStore[
      email.toLowerCase()
    ];

    res.json({
      message:
        "Account created successfully",
    });

  } catch (err) {

    console.error(
      "OTP error:",
      err.message
    );

    res.status(500).json({
      error:
        "Verification failed",
    });
  }
};

// ─── LOGIN ─────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const login = async (req, res) => {
  try {

    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error:
          "Email/mobile and password are required",
      });
    }

    // EMAIL OR MOBILE LOGIN
    const user = await User.findOne({
      $or: [
        {
          email:
            identifier.toLowerCase(),
        },
        {
          mobile: identifier,
        },
      ],
    });

    if (!user) {
      return res.status(400).json({
        error:
          "Invalid credentials",
      });
    }

    // LOCK CHECK
    if (
      user.lockUntil &&
      user.lockUntil > Date.now()
    ) {

      const minutesLeft =
        Math.ceil(
          (user.lockUntil -
            Date.now()) /
            60000
        );

      return res.status(403).json({
        error: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // PASSWORD CHECK
    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      user.loginAttempts += 1;

      if (
        user.loginAttempts >=
        MAX_ATTEMPTS
      ) {

        user.lockUntil =
          new Date(
            Date.now() + LOCK_TIME
          );

        user.loginAttempts = 0;

        await user.save();

        return res.status(403).json({
          error:
            "Too many attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();

      const remaining =
        MAX_ATTEMPTS -
        user.loginAttempts;

      return res.status(400).json({
        error: `Invalid credentials. ${remaining} attempt(s) left.`,
      });
    }

    // RESET COUNTERS
    user.loginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    // JWT TOKEN
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      role: user.role,
    });

  } catch (err) {

    console.error(
      "Login error:",
      err.message
    );

    res.status(500).json({
      error:
        "Login failed",
    });
  }
};

// ─── GET PROFILE ───────────────────────────────────────────
const getProfile = async (
  req,
  res
) => {
  try {

    const user =
      await User.findById(
        req.user.id
      ).select(
        "firstName lastName email mobile role createdAt avatarUrl"
      );

    if (!user) {
      return res.status(404).json({
        error:
          "User not found",
      });
    }

    res.json({
      firstName:
        user.firstName,
      lastName:
        user.lastName,
      email: user.email,
      mobile:
        user.mobile,
      role: user.role,
      createdAt:
        user.createdAt,
      avatarUrl:
        user.avatarUrl ||
        null,
    });

  } catch (err) {

    console.error(
      "Get profile error:",
      err.message
    );

    res.status(500).json({
      error:
        "Failed to fetch profile",
    });
  }
};

// ─── UPDATE PROFILE ────────────────────────────────────────
const updateProfile = async (
  req,
  res
) => {
  try {

    const {
      firstName,
      lastName,
      mobile,
    } = req.body;

    if (!firstName) {
      return res.status(400).json({
        error:
          "First name is required",
      });
    }

    const updated =
      await User.findByIdAndUpdate(
        req.user.id,
        {
          firstName:
            firstName.trim(),
          lastName:
            (lastName || "").trim(),
          mobile,
        },
        {
          returnDocument:
            "after",
        }
      ).select(
        "firstName lastName email mobile role createdAt avatarUrl"
      );

    res.json({
      firstName:
        updated.firstName,
      lastName:
        updated.lastName,
      email:
        updated.email,
      mobile:
        updated.mobile,
      role:
        updated.role,
      createdAt:
        updated.createdAt,
      avatarUrl:
        updated.avatarUrl ||
        null,
    });

  } catch (err) {

    console.error(
      "Update profile error:",
      err.message
    );

    res.status(500).json({
      error:
        "Failed to update profile",
    });
  }
};

// ─── FORGOT PASSWORD ───────────────────────────────────────
const forgotPassword = async (
  req,
  res
) => {
  try {

    const { email } = req.body;

    if (
      !email ||
      !isValidEmail(email)
    ) {
      return res.status(400).json({
        error:
          "Valid email is required",
      });
    }

    const user =
      await User.findOne({
        email:
          email.toLowerCase(),
      });

    if (!user) {
      return res.json({
        message:
          "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken =
      crypto.randomBytes(32)
        .toString("hex");

    resetStore[resetToken] = {
      email:
        email.toLowerCase(),
      expiresAt:
        Date.now() +
        60 * 60 * 1000,
    };

    const clientUrl = (
      process.env.CLIENT_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const link =
      `${clientUrl}/reset/${resetToken}`;

    await transporter.sendMail({
      from: `"CyberShield" <${process.env.EMAIL_USER}>`,
      to: email,
      subject:
        "CyberShield - Reset Your Password",
      text: `Reset your CyberShield password using this link:\n\n${link}`,
    });

    res.json({
      message:
        "If that email exists, a reset link has been sent.",
    });

  } catch (err) {

    console.error(
      "Forgot error:",
      err.message
    );

    res.status(500).json({
      error:
        "Failed to send reset email",
    });
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────
const resetPassword = async (
  req,
  res
) => {
  try {

    const {
      token,
      password,
    } = req.body;

    if (
      !token ||
      !password
    ) {
      return res.status(400).json({
        error:
          "Token and new password are required",
      });
    }

    if (
      !isStrongPassword(
        password
      )
    ) {
      return res.status(400).json({
        error:
          "Password must be strong",
      });
    }

    const record =
      resetStore[token];

    if (!record) {
      return res.status(400).json({
        error:
          "Invalid or expired reset token",
      });
    }

    if (
      Date.now() >
      record.expiresAt
    ) {

      delete resetStore[token];

      return res.status(400).json({
        error:
          "Reset link expired",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    await User.updateOne(
      {
        email:
          record.email,
      },
      {
        password:
          hashedPassword,
      }
    );

    delete resetStore[token];

    res.json({
      message:
        "Password updated successfully",
    });

  } catch (err) {

    console.error(
      "Reset error:",
      err.message
    );

    res.status(500).json({
      error:
        "Password reset failed",
    });
  }
};

// ─── UPLOAD AVATAR ─────────────────────────────────────────
const uploadAvatar = async (
  req,
  res
) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        error:
          "No file uploaded",
      });
    }

    const uploadDir =
      path.join(
        __dirname,
        "..",
        "uploads",
        "avatars"
      );

    fs.mkdirSync(uploadDir, {
      recursive: true,
    });

    const filename =
      `${req.user.id}-${Date.now()}.jpg`;

    const outPath =
      path.join(
        uploadDir,
        filename
      );

    await sharp(req.file.buffer)
      .resize(256, 256, {
        fit: "cover",
      })
      .jpeg({
        quality: 90,
      })
      .toFile(outPath);

    const serverUrl =
      process.env.SERVER_URL ||
      "http://localhost:5001";

    const avatarUrl =
      `${serverUrl}/uploads/avatars/${filename}`;

    const updated =
      await User.findByIdAndUpdate(
        req.user.id,
        { avatarUrl },
        {
          returnDocument:
            "after",
        }
      ).select(
        "firstName lastName email mobile role avatarUrl createdAt"
      );

    res.json({
      avatarUrl:
        updated.avatarUrl,
    });

  } catch (err) {

    console.error(
      "Avatar upload error:",
      err.message || err
    );

    res.status(500).json({
      error:
        "Failed to upload avatar",
    });
  }
};

// ─── CHANGE PASSWORD ───────────────────────────────────────
const changePassword = async (
  req,
  res
) => {
  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        error:
          "Current and new passwords required",
      });
    }

    if (
      !isStrongPassword(
        newPassword
      )
    ) {
      return res.status(400).json({
        error:
          "New password must be strong",
      });
    }

    const user =
      await User.findById(
        req.user.id
      );

    if (!user) {
      return res.status(404).json({
        error:
          "User not found",
      });
    }

    const match =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        error:
          "Current password is incorrect",
      });
    }

    const hashed =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password = hashed;

    await user.save();

    res.json({
      message:
        "Password changed successfully",
    });

  } catch (err) {

    console.error(
      "Change password error:",
      err.message || err
    );

    res.status(500).json({
      error:
        "Failed to change password",
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};