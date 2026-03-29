/**
 * components/Navbar.jsx — Top navigation bar for the editor page
 */
import { Link } from "react-router-dom";
import { Code2, Share2, Play, MessageSquare, Moon, Sun, LogOut, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Navbar({
  roomName,
  roomId,
  language,
  theme,
  onThemeToggle,
  onRunCode,
  onChatToggle,
  chatOpen,
  connected,
  onSave,
}) {
  const { user, logout } = useAuth();

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  }

  return (
    <header className="flex items-center gap-2 px-4 h-12 bg-editor-sidebar border-b border-editor-border shrink-0">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <Code2 size={14} className="text-white" />
        </div>
        <span className="hidden sm:block text-sm font-semibold text-editor-text tracking-tight">
          CodeCollab
        </span>
      </Link>

      {/* Room name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-editor-muted text-sm">/</span>
        <span className="text-sm font-medium text-editor-text truncate">
          {roomName || roomId}
        </span>
        {/* Connection indicator */}
        <span
          className={`ml-1 w-1.5 h-1.5 rounded-full shrink-0 ${
            connected ? "bg-editor-green animate-pulse" : "bg-editor-yellow"
          }`}
          title={connected ? "Live" : "Reconnecting…"}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Run code */}
        <button
          id="run-code-btn"
          onClick={onRunCode}
          title="Run code (Judge0)"
          className="btn-ghost text-editor-green hover:text-editor-green flex items-center gap-1.5 border border-editor-green/20 hover:border-editor-green/40"
        >
          <Play size={13} />
          <span className="hidden sm:inline text-xs">Run</span>
        </button>

        {/* Share */}
        <button
          id="copy-link-btn"
          onClick={copyLink}
          title="Copy room link"
          className="btn-ghost"
        >
          <Share2 size={14} />
        </button>

        {/* Chat toggle */}
        <button
          id="chat-toggle-btn"
          onClick={onChatToggle}
          title="Toggle chat"
          className={`btn-ghost ${chatOpen ? "text-editor-accent" : ""}`}
        >
          <MessageSquare size={14} />
        </button>

        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onThemeToggle}
          title="Toggle theme"
          className="btn-ghost"
        >
          {theme === "vs-dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Auth */}
        {user ? (
          <button
            id="logout-btn"
            onClick={logout}
            title="Logout"
            className="btn-ghost"
          >
            <LogOut size={14} />
          </button>
        ) : (
          <Link to="/login" className="btn-ghost" title="Login">
            <LogIn size={14} />
          </Link>
        )}
      </div>
    </header>
  );
}
