/**
 * models/Room.js — Mongoose schema for a collaborative room (document)
 */
const mongoose = require("mongoose");

const versionSnapshotSchema = new mongoose.Schema({
  savedAt: { type: Date, default: Date.now },
  ydocState: { type: Buffer }, // Yjs encoded state
  label: { type: String, default: "auto-save" },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: function () {
        return this.roomId ? `Room ${this.roomId.slice(0, 6)}` : "Untitled Room";
      },
    },
    language: {
      type: String,
      default: "javascript",
      enum: [
        "javascript", "typescript", "python", "cpp", "c",
        "java", "go", "rust", "html", "css", "json", "markdown",
      ],
    },
    // Latest Yjs CRDT state (binary blob)
    ydocState: {
      type: Buffer,
      default: null,
    },
    // Version history — last 10 snapshots
    versions: {
      type: [versionSnapshotSchema],
      default: [],
    },
    // Owner (optional — links to User)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Keep only last 10 version snapshots
roomSchema.pre("save", function (next) {
  if (this.versions.length > 10) {
    this.versions = this.versions.slice(-10);
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);
