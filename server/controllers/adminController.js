const User = require("../models/User");
const Scan = require("../models/Scan");

// ─── USERS ────────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    // FIX: Exclude password field from response
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX: Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // FIX: Also delete all scans associated with this user
    await Scan.deleteMany({ userId: id });

    res.json({ message: "User and their scans deleted" });

  } catch (err) {
    console.error("deleteUser error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ─── SCANS ────────────────────────────────────────────────────────────────────
const getAllScans = async (req, res) => {
  try {
    const scans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(500) // FIX: Prevent returning millions of records
      .populate("userId", "firstName lastName email"); // FIX: Populate user info
    res.json(scans);
  } catch (err) {
    console.error("getAllScans error:", err.message);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
};

const deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findByIdAndDelete(req.params.id);

    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    res.json({ message: "Scan deleted" });

  } catch (err) {
    console.error("deleteScan error:", err.message);
    res.status(500).json({ error: "Failed to delete scan" });
  }
};

module.exports = { getUsers, deleteUser, getAllScans, deleteScan };