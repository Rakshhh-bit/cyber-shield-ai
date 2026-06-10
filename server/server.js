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
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
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
  // Allow non-browser requests (curl, server-to-server)
  if (!origin) return callback(null, true);

  const cleaned = origin.replace(/\/+$/, "");

  // Allow any localhost or 127.0.0.1 origin on any port
  try {
    const url = new URL(cleaned);
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return callback(null, true);
    }
  } catch (e) {
    // fall through to allowedOrigins check
  }

  if (allowedOrigins.has(cleaned)) {
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

// ✅ BODY PARSER - with increased limits
// Capture raw body for debugging/fallback parsing when content-type is unexpected
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf && buf.toString();
    } catch (e) {
      req.rawBody = undefined;
    }
  },
}));

app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ DEBUG MIDDLEWARE - Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  next();
});

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
let PORT = process.env.PORT || 5001;

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    PORT = PORT + 1;
    startServer();
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

startServer();
