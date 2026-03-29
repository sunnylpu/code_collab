/**
 * utils/colors.js — Deterministic user colors for cursors/avatars
 */

const PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F0B27A", "#76D7C4",
  "#F1948A", "#82E0AA", "#F8C471", "#AED6F1",
];

/**
 * Given any string (socket ID, username) return a consistent color.
 */
export function getColorForUser(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/**
 * Get initials from a display name (up to 2 chars)
 */
export function getInitials(name = "?") {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Lighten a hex color by a given percentage (for backgrounds)
 */
export function withAlpha(hex, alpha = 0.2) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
