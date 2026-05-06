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

const parseOrigins = (...values) =>
  values
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://cybershieldai-secure.netlify.app",
  ...parseOrigins(
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    process.env.CORS_ORIGIN,
    process.env.CORS_ORIGINS,
    process.env.ALLOWED_ORIGINS
  ),
]);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// ✅ CREATE HTTP SERVER
const server = http.createServer(app);

// ✅ SOCKET.IO INIT
const io = new Server(server, {
  cors: corsOptions,
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
  cors(corsOptions)
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
