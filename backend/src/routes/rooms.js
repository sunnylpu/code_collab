/**
 * routes/rooms.js — Room REST endpoints
 */
const router = require("express").Router();
const {
  createRoom,
  listRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomVersions,
  getRoomVersionText,
} = require("../controllers/roomController");
const { requireAuth } = require("../middleware/auth");

// Public routes
router.get("/", listRooms);
router.get("/:roomId", getRoom);
router.get("/:roomId/versions", getRoomVersions);
router.get("/:roomId/versions/:index/text", getRoomVersionText);

// Protected routes (JWT required)
router.post("/", requireAuth, createRoom);
router.patch("/:roomId", requireAuth, updateRoom);
router.delete("/:roomId", requireAuth, deleteRoom);

module.exports = router;
