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

// ✅ SOCKET.IO INIT
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://cybershieldai-secure.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// ✅ SAVE SOCKET INSTANCE
app.set("io", io);

// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`✅ User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ CORS MIDDLEWARE
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://cybershieldai-secure.netlify.app",
    ],
    credentials: true,
  })
);

// ✅ BODY PARSER
app.use(express.json());

// ✅ ROUTES
app.use("/api/scan", scanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/extension", extensionRoutes);

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("🚀 CyberShield API Running...");
});

// ✅ DATABASE CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// ✅ START SERVER
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});