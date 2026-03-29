/**
 * components/Sidebar.jsx — Right sidebar with presence, settings, versions
 */
import { useState } from "react";
import { Users, Settings, Clock, Hash, Zap } from "lucide-react";
import { getInitials, withAlpha } from "../utils/colors";

const LANGUAGES = [
  { id: "javascript",  label: "JavaScript",  icon: "JS" },
  { id: "typescript",  label: "TypeScript",  icon: "TS" },
  { id: "python",      label: "Python",      icon: "PY" },
  { id: "cpp",         label: "C++",         icon: "C+" },
  { id: "java",        label: "Java",        icon: "JV" },
  { id: "go",          label: "Go",          icon: "GO" },
  { id: "rust",        label: "Rust",        icon: "RS" },
  { id: "html",        label: "HTML",        icon: "HT" },
  { id: "css",         label: "CSS",         icon: "CS" },
  { id: "json",        label: "JSON",        icon: "{}" },
  { id: "markdown",    label: "Markdown",    icon: "MD" },
];

export default function Sidebar({
  users = [],
  language,
  onLanguageChange,
  roomId,
  connected,
  versions = [],
}) {
  const [activeTab, setActiveTab] = useState("users"); // "users" | "settings" | "history"

  return (
    <aside className="flex flex-col h-full bg-editor-sidebar border-l border-editor-border">
      {/* Tab bar */}
      <div className="flex border-b border-editor-border">
        {[
          { id: "users",    icon: Users,    title: "Users" },
          { id: "settings", icon: Settings, title: "Settings" },
          { id: "history",  icon: Clock,    title: "History" },
        ].map(({ id, icon: Icon, title }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={title}
            className={`flex-1 flex items-center justify-center py-3 text-xs transition-colors
              ${activeTab === id
                ? "text-editor-accent border-b-2 border-editor-accent"
                : "text-editor-muted hover:text-editor-text"}`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* ── Users tab ─────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-3 animate-fade-in">
            {/* Connection status */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-editor-hover">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-editor-green animate-pulse" : "bg-editor-red"}`} />
              <span className="text-xs text-editor-muted">
                {connected ? "Connected" : "Reconnecting…"}
              </span>
            </div>

            {/* Room ID */}
            <div className="flex items-center gap-2 text-xs text-editor-muted px-1">
              <Hash size={12} />
              <span className="font-mono truncate">{roomId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // toast handled in parent
                }}
                className="ml-auto text-editor-accent hover:underline shrink-0"
              >
                Copy link
              </button>
            </div>

            {/* User list */}
            <div>
              <p className="text-xs text-editor-muted mb-2 px-1">
                {users.length} online
              </p>
              <ul className="space-y-1.5">
                {users.length === 0 && (
                  <li className="text-xs text-editor-muted px-2 py-3 text-center italic">
                    No other users yet
                  </li>
                )}
                {users.map((u) => (
                  <li
                    key={u.clientId || u.socketId || u.name}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-editor-hover transition-colors border border-transparent shadow-sm"
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                      style={{
                        background: withAlpha(u.color || "#888", 0.25),
                        color: u.color,
                        border: `1px solid ${u.color || "#888"}`,
                      }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate">{u.name}</p>
                      
                      {/* Telemetry output */}
                      <p className={`text-[10px] truncate ${u.activity && u.activity !== 'idle' ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
                        {u.activity && u.activity !== 'idle' 
                          ? u.activity 
                          : `in ${u.activeFile || 'files'}`
                        }
                      </p>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_5px_currentColor] ${u.activity && u.activity !== 'idle' ? 'animate-pulse scale-125' : 'opacity-70'}`}
                      style={{ background: u.color || "#3fb950", color: u.color || "#3fb950" }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Settings tab ──────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs text-editor-muted block mb-2">Language</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => onLanguageChange?.(lang.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                      ${language === lang.id
                        ? "bg-editor-accent/20 text-editor-accent border border-editor-accent/30"
                        : "text-editor-muted hover:text-editor-text hover:bg-editor-hover border border-transparent"}`}
                  >
                    <span className="font-mono text-[10px] opacity-60">{lang.icon}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── History tab ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-editor-muted px-1">Version History</p>
            {versions.length === 0 ? (
              <div className="text-center py-6 text-xs text-editor-muted italic">
                No saved versions yet
              </div>
            ) : (
              <ul className="space-y-1.5">
                {[...versions].reverse().map((v, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-editor-hover
                               cursor-pointer transition-colors group"
                  >
                    <Zap size={12} className="mt-0.5 text-editor-yellow shrink-0" />
                    <div>
                      <p className="text-xs text-editor-text">{v.label}</p>
                      <p className="text-[10px] text-editor-muted">
                        {new Date(v.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
