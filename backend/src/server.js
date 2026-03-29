/**
 * server.js — Entry point for the collaborative editor backend
 * Sets up Express, HTTP server, Socket.io, MongoDB connection, and REST routes
 */
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const roomRoutes = require("./routes/rooms");
const authRoutes = require("./routes/auth");
const { initSocketHandlers } = require("./socket");

const app = express();
const httpServer = http.createServer(app);

// ── CORS config ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

// ── REST routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

// ── Socket.io setup ────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Use WebSocket transport first for lowest latency
  transports: ["websocket", "polling"],
});

// Register all socket event handlers
initSocketHandlers(io);

// ── MongoDB connection ─────────────────────────────────────────────────────────
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/collab-editor";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");
  await mongoose.connection.close();
  httpServer.close(() => process.exit(0));
});
