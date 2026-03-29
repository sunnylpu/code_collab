/**
 * controllers/roomController.js — CRUD operations for rooms/documents
 */
const crypto = require("crypto");
const Y = require("yjs");
const Room = require("../models/Room");

// Generate a short random room ID (URL-safe base64, 10 chars)
function generateRoomId() {
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
}

// POST /api/rooms — Create a new room
async function createRoom(req, res) {
  try {
    const { name, language, isPublic } = req.body;
    const roomId = generateRoomId();

    const room = await Room.create({
      roomId,
      name: name || `Room ${roomId.slice(0, 6)}`,
      language: language || "javascript",
      isPublic: isPublic !== false,
      owner: req.user?.userId || null,
    });

    res.status(201).json(formatRoom(room));
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
}

// GET /api/rooms — List public rooms
async function listRooms(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const page = parseInt(req.query.page || "1", 10);
    const skip = (page - 1) * limit;

    const rooms = await Room.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-ydocState -versions"); // Don't send binary blobs in list

    res.json(rooms.map(formatRoom));
  } catch (err) {
    res.status(500).json({ error: "Failed to list rooms" });
  }
}

// GET /api/rooms/:roomId — Get a single room (creates if not found)
async function getRoom(req, res) {
  try {
    const { roomId } = req.params;
    let room = await Room.findOne({ roomId }).select("-ydocState");
    if (!room) {
      // Auto-create the room when someone navigates directly to a URL
      room = await Room.create({ roomId, name: `Room ${roomId.slice(0, 6)}` });
    }
    res.json(formatRoom(room));
  } catch (err) {
    res.status(500).json({ error: "Failed to get room" });
  }
}

// PATCH /api/rooms/:roomId — Update room metadata
async function updateRoom(req, res) {
  try {
    const { roomId } = req.params;
    const { name, language, isPublic } = req.body;

    const room = await Room.findOneAndUpdate(
      { roomId },
      { $set: { name, language, isPublic } },
      { new: true, runValidators: true }
    ).select("-ydocState");

    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(formatRoom(room));
  } catch (err) {
    res.status(500).json({ error: "Failed to update room" });
  }
}

// DELETE /api/rooms/:roomId
async function deleteRoom(req, res) {
  try {
    const room = await Room.findOneAndDelete({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete room" });
  }
}

// GET /api/rooms/:roomId/versions — Get version history
async function getRoomVersions(req, res) {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).select("versions roomId");
    if (!room) return res.status(404).json({ error: "Room not found" });
    // Return metadata only (not the binary state)
    const versions = (room.versions || []).map((v, i) => ({
      index: i,
      savedAt: v.savedAt,
      label: v.label,
    }));
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch versions" });
  }
}

// GET /api/rooms/:roomId/versions/:index/text — Get raw text of a version to restore
async function getRoomVersionText(req, res) {
  try {
    const { roomId, index } = req.params;
    const room = await Room.findOne({ roomId }).select("versions");
    
    if (!room || !room.versions || !room.versions[index]) {
      return res.status(404).json({ error: "Version not found" });
    }
    
    const version = room.versions[index];
    if (!version.ydocState) return res.json({ text: "" });

    // Load binary state into temporary Y.Doc
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, new Uint8Array(version.ydocState));
    
    // Extract text (Support both old single-doc and new multi-file formats)
    const filesMap = tempDoc.getMap("files");
    const files = {};
    
    if (Array.from(filesMap.keys()).length > 0) {
      for (const key of filesMap.keys()) {
        files[key] = filesMap.get(key).toString();
      }
    } else {
      files["main.js"] = tempDoc.getText("monaco").toString();
    }
    
    res.json({ files });
  } catch (err) {
    console.error("Failed to parse version:", err);
    res.status(500).json({ error: "Failed to extract version text" });
  }
}

// Helper: strip internal fields
function formatRoom(room) {
  return {
    id: room._id,
    roomId: room.roomId,
    name: room.name,
    language: room.language,
    isPublic: room.isPublic,
    owner: room.owner,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

module.exports = { createRoom, listRooms, getRoom, updateRoom, deleteRoom, getRoomVersions, getRoomVersionText };
