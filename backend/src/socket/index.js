/**
 * socket/index.js — Socket.io + Yjs CRDT engine
 */
const Y = require("yjs");
const Room = require("../models/Room");

// In-memory store: roomId → { ydoc, clients: Set, persistTimer }
const rooms = new Map();
// Lock to prevent concurrent loads per roomId
const roomLoading = new Map();

// How often to persist Yjs state (ms)
const PERSIST_INTERVAL = parseInt(process.env.PERSIST_INTERVAL_MS || "5000", 10);

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getOrCreateRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (roomLoading.has(roomId)) return roomLoading.get(roomId);

  const loadPromise = (async () => {
    const ydoc = new Y.Doc();
    try {
      const dbRoom = await Room.findOne({ roomId });
      if (dbRoom?.ydocState?.length) {
        Y.applyUpdate(ydoc, new Uint8Array(dbRoom.ydocState));
        console.log(`📄 Loaded room "${roomId}" [${dbRoom.ydocState.length} bytes]`);
      }
    } catch (err) {
      console.error(`Failed to load room "${roomId}":`, err.message);
    }

    const entry = { ydoc, clients: new Set(), awareness: new Map() };
    rooms.set(roomId, entry);
    roomLoading.delete(roomId);
    return entry;
  })();

  roomLoading.set(roomId, loadPromise);
  return loadPromise;
}

async function persistRoom(roomId, ydoc) {
  try {
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    await Room.findOneAndUpdate(
      { roomId },
      { $set: { ydocState: state, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Failed to persist room "${roomId}":`, err.message);
  }
}

function initSocketHandlers(io) {
  io.on("connection", (socket) => {
    let currentRoomId = null;
    let username = "Anonymous";
    let userColor = "#888888";

    socket.on("join-room", async ({ roomId, user }) => {
      if (!roomId) return;
      
      if (currentRoomId && currentRoomId !== roomId) {
        leaveRoom(socket, currentRoomId, io);
      }

      currentRoomId = roomId;
      username = user?.name || "Anonymous";
      userColor = user?.color || "#888888";

      socket.join(roomId);
      const room = await getOrCreateRoom(roomId);
      room.clients.add(socket.id);

      room.awareness.set(socket.id, {
        socketId: socket.id,
        name: username,
        color: userColor,
        cursor: null,
      });

      const stateUpdate = Y.encodeStateAsUpdate(room.ydoc);
      socket.emit("sync-state", { update: stateUpdate });

      broadcastPresence(io, roomId, room);

      if (!room.persistTimer) {
        room.persistTimer = setInterval(() => persistRoom(roomId, room.ydoc), PERSIST_INTERVAL);
      }
      console.log(`👤 ${username} joined "${roomId}" [Total: ${room.clients.size}]`);
    });

    socket.on("doc-update", async ({ roomId, update }) => {
      if (!roomId || !update) return;
      const uint8Update = (update instanceof Uint8Array) ? update : new Uint8Array(update);
      const room = rooms.get(roomId) || await getOrCreateRoom(roomId);
      
      Y.applyUpdate(room.ydoc, uint8Update);
      socket.to(roomId).emit("doc-update", { update: uint8Update });
    });

    socket.on("awareness-update", ({ roomId, state }) => {
      if (!roomId || !state) return;
      const room = rooms.get(roomId);
      if (!room) return;

      room.awareness.set(socket.id, {
        ...state,
        socketId: socket.id,
        name: username,
        color: userColor,
      });

      socket.to(roomId).emit("awareness-update", {
        socketId: socket.id,
        state: room.awareness.get(socket.id),
      });
    });

    socket.on("chat-message", ({ roomId, message }) => {
      if (!roomId || !message) return;
      io.to(roomId).emit("chat-message", {
        id: `${socket.id}-${Date.now()}`,
        sender: username,
        color: userColor,
        text: message,
        ts: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      if (currentRoomId) {
        leaveRoom(socket, currentRoomId, io);
        console.log(`👋 ${username} disconnected`);
      }
    });
  });
}

function leaveRoom(socket, roomId, io) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.clients.delete(socket.id);
  room.awareness.delete(socket.id);
  socket.leave(roomId);

  if (room.clients.size === 0) {
    persistRoom(roomId, room.ydoc).then(() => {
      clearInterval(room.persistTimer);
      rooms.delete(roomId);
    });
  } else {
    broadcastPresence(io, roomId, room);
  }
}

function broadcastPresence(io, roomId, room) {
  const users = [];
  for (const [sid, state] of room.awareness.entries()) {
    users.push({ socketId: sid, ...state });
  }
  io.to(roomId).emit("presence-update", { users });
}

module.exports = { initSocketHandlers };
