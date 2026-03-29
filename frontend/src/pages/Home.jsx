/**
 * pages/Home.jsx — Landing page + room dashboard
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Code2, Plus, Users, Clock, ArrowRight, Zap, Shield, Globe,
  LogIn, UserPlus, Search
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth.jsx";
import { api }     from "../utils/api.js";

const FEATURES = [
  { icon: Zap,    color: "#F7DC6F", title: "CRDT Sync",   desc: "Conflict-free real-time edits powered by Yjs" },
  { icon: Users,  color: "#4ECDC4", title: "Live Cursors", desc: "See exactly what everyone is editing" },
  { icon: Shield, color: "#96CEB4", title: "Persistent",   desc: "Documents autosave to MongoDB" },
  { icon: Globe,  color: "#DDA0DD", title: "Multi-lang",   desc: "JS, Python, C++, Go, Rust & more" },
];

export default function Home() {
  const { user, token, logout } = useAuth();
  const navigate        = useNavigate();

  const [rooms,       setRooms]       = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [joinId,      setJoinId]      = useState("");
  const [newName,     setNewName]     = useState("");
  const [newLang,     setNewLang]     = useState("javascript");
  const [creating,    setCreating]    = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const data = await api.listRooms();
      setRooms(data);
    } catch (err) {
      console.warn("Failed to fetch rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!user) { toast.error("Please login to create a room"); navigate("/login"); return; }
    setCreating(true);
    const createToast = toast.loading("Launching your workspace...");
    try {
      const room = await api.createRoom({ name: newName || undefined, language: newLang }, token);
      toast.success(`Room "${room.name}" ready!`, { id: createToast });
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      toast.error(err.message, { id: createToast });
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) { toast.error("Enter a room ID or paste a link"); return; }
    const match = id.match(/\/room\/([^/?#]+)/);
    navigate(`/room/${match ? match[1] : id}`);
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-gray-300 font-sans">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0f0f11]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Code2 size={20} className="text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight uppercase">CodeCollab</span>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: user.color || "#818cf8", color: "#000" }}
                >
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-bold text-gray-300">{user.username}</span>
              </div>
              <button 
                onClick={logout}
                className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign in</Link>
              <Link to="/register" className="px-5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-all active:scale-95">Get Started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Real-time Engine · Stable v1.0
        </div>
        <h1 className="text-6xl sm:text-7xl font-black text-white mb-6 leading-none tracking-tighter">
          Code like you're <br/>
          <span className="text-indigo-500">in the same room.</span>
        </h1>
        <p className="text-gray-500 text-lg mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
          The ultimate collaborative IDE experience. Conflict-free synchronization, 
          live awareness, and ultra-low latency — straight from the web.
        </p>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <form onSubmit={handleJoin} className="p-6 rounded-2xl bg-white/5 border border-white/5 text-left space-y-4 hover:border-white/10 transition-colors">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Connect to Workspace</h3>
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Paste Room ID or full Link"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
            <button type="submit" className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2">
              Join Session <ArrowRight size={16} />
            </button>
          </form>

          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-left space-y-4">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Create Environment</h3>
            {showCreate ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project Name"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  {["javascript","typescript","python","cpp","java","go","rust","html"].map((l) => (
                    <option key={l} value={l} className="bg-[#0f0f11]">{l}</option>
                  ))}
                </select>
                <button type="submit" disabled={creating} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                  {creating ? "Processing..." : "Spin Up Server"}
                </button>
              </form>
            ) : (
              <button
                onClick={() => user ? setShowCreate(true) : navigate("/login")}
                className="w-full py-12 rounded-xl bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Plus size={20} strokeWidth={3} /> New Room
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Room List Section ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 pb-32 border-t border-white/5 pt-20">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock size={16} />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Recent Workspaces</h2>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <span className="text-xs font-bold text-gray-600">{rooms.length} active</span>
          </div>
          <button 
            onClick={fetchRooms}
            disabled={isLoading}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
          >
            {isLoading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.slice(0, 12).map((room) => (
              <button
                key={room.roomId}
                onClick={() => navigate(`/room/${room.roomId}`)}
                className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate pr-4">{room.name}</h4>
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-gray-600 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shrink-0">
                    <ArrowRight size={14} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-tighter">
                    {room.language}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    {new Date(room.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-white/5 opacity-50">
            <Search size={40} strokeWidth={1.5} className="text-gray-700 mb-4" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No workspaces found</p>
            <p className="text-[10px] text-gray-700 mt-2 uppercase tracking-wide">Create your first room to get started</p>
          </div>
        )}
      </section>
    </div>
  );
}
