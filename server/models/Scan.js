const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    // FIX: Original schema had "input" field but controller was saving to "content" — unified to "content"
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // FIX: ObjectId reference, not plain String
    type:    { type: String, enum: ["link", "message", "email"], required: true },
    content: { type: String, required: true },
    risk:    { type: String, enum: ["LOW", "MEDIUM", "HIGH", "ERROR", "UNKNOWN"], required: true },
    score:   { type: Number },
    explanation: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);