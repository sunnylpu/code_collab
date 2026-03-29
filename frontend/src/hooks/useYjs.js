import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { io } from "socket.io-client";
import * as awareness from "y-protocols/awareness";
import { getColorForUser } from "../utils/colors";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5050";

export function useYjs(roomId, user) {
  const ydocRef    = useRef(null);
  const socketRef  = useRef(null);
  const awarenessRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Initialize Refs immediately (not in useEffect) to avoid null on first render
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  if (!awarenessRef.current) {
    awarenessRef.current = new awareness.Awareness(ydocRef.current);
  }

  useEffect(() => {
    if (!roomId) return;

    // Reset state for new room
    setChatMessages([]);
    
    const ydoc = ydocRef.current;
    const awarenessInstance = awarenessRef.current;

    // Connect to Socket.io
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Socket connected, joining room:", roomId);
      socket.emit("join-room", { roomId, user });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // ── Document Synchronization ───────────────────────────────────────────
    
    socket.on("sync-state", ({ update }) => {
      console.log(`📡 [YJS] RECEIVED sync-state: ${update.byteLength || update.length} bytes`);
      Y.applyUpdate(ydoc, new Uint8Array(update), socket);
    });

    socket.on("doc-update", ({ update }) => {
      console.log(`📡 [YJS] RECEIVED delta: ${update.byteLength || update.length} bytes`);
      Y.applyUpdate(ydoc, new Uint8Array(update), socket);
    });

    const handleLocalUpdate = (update, origin) => {
      if (origin === socket) return;
      socket.emit("doc-update", { roomId, update }); // Directly send Uint8Array
    };
    ydoc.on("update", handleLocalUpdate);

    // ── Awareness / Presence ───────────────────────────────────────────────

    socket.on("presence-update", ({ users }) => {
      setUsers(users);
    });

    socket.on("awareness-update", ({ socketId, state }) => {
      // We could use this to update a local awareness copy if needed, 
      // but y-monaco usually wants the awarenessInstance synced.
    });

    // ── Chat ───────────────────────────────────────────────────────────────

    socket.on("chat-message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      ydoc.off("update", handleLocalUpdate);
      socket.disconnect();
      setConnected(false);
    };
  }, [roomId, user]);

  const sendChatMessage = (text) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit("chat-message", { roomId, message: text });
    }
  };

  return {
    ydoc: ydocRef.current,
    awareness: awarenessRef.current,
    connected,
    users,
    chatMessages,
    sendChatMessage,
  };
}
