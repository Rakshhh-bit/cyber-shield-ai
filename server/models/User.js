const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  // FIX: Added unique index and lowercase normalization to prevent duplicate accounts
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["user", "admin"], default: "user" },

  loginAttempts: { type: Number, default: 0 },
  lockUntil:     { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);