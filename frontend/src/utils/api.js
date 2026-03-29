/**
 * utils/api.js — Typed fetch helpers for REST API calls
 */

const BASE = import.meta.env.VITE_BACKEND_URL || "";

async function request(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Rooms
  listRooms:    (token)              => request("/api/rooms",               {}, token),
  getRoom:      (roomId)             => request(`/api/rooms/${roomId}`),
  createRoom:   (body, token)        => request("/api/rooms",               { method: "POST", body: JSON.stringify(body) }, token),
  updateRoom:   (roomId, body, tok)  => request(`/api/rooms/${roomId}`,     { method: "PATCH", body: JSON.stringify(body) }, tok),
  deleteRoom:   (roomId, token)      => request(`/api/rooms/${roomId}`,     { method: "DELETE" }, token),
  getRoomVersions: (roomId)          => request(`/api/rooms/${roomId}/versions`),
  getRoomVersionText: (roomId, idx)  => request(`/api/rooms/${roomId}/versions/${idx}/text`),

  // Auth
  register:     (body)     => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:        (body)     => request("/api/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  me:           (token)    => request("/api/auth/me",       {}, token),
};
