/**
 * hooks/useAuth.jsx — Authentication context + JWT helpers
 *
 * Provides: user, token, login(), register(), logout()
 * Persists token to localStorage so sessions survive refresh.
 */
import { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cc_token") || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("cc_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const persist = useCallback((tok, usr) => {
    setToken(tok);
    setUser(usr);
    if (tok) {
      localStorage.setItem("cc_token", tok);
      localStorage.setItem("cc_user", JSON.stringify(usr));
    } else {
      localStorage.removeItem("cc_token");
      localStorage.removeItem("cc_user");
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    persist(null, null);
    toast.success("Logged out");
  }, [persist]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
