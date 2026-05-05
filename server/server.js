const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const scanRoutes = require("./routes/scanRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const extensionRoutes = require("./routes/extensionRoutes");

const app = express();

// ✅ CREATE HTTP SERVER
const server = http.createServer(app);

// ✅ INIT SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// 🔥🔥🔥 THIS LINE WAS MISSING (ROOT CAUSE)
app.set("io", io);

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ ROUTES
app.use("/api/scan", scanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/extension", extensionRoutes);

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running...");
});

// ✅ DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// ✅ START SERVER (IMPORTANT)
server.listen(5001, () => {
  console.log("✅ Server running on port 5001");
});
