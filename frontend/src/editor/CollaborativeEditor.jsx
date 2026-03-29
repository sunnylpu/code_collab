import React, { useRef, useEffect, useCallback, useState } from "react";
import * as Y from "yjs";
import * as monaco from "monaco-editor";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import { Play, Share2, MessageCircle, Settings, Users, History, Sun, Moon, TerminalSquare, X, FolderGit2, Plus, Trash2, FileCode } from "lucide-react";
import toast from "react-hot-toast";

export default function CollaborativeEditor({
  ydoc,
  awareness,
  roomId,
  user,
  connected,
  users,
  chatMessages,
  sendChatMessage,
  isExecuting,
  output,
  outputError,
  language,
  onLanguageChange,
  versions,
  onRestoreVersion,
  onLogout,
}) {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const [theme, setTheme] = useState("vs-dark");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("files");
  const [awarenessUsers, setAwarenessUsers] = useState([]);
  
  // Multi-File System States
  const [editorReady, setEditorReady] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [activeFile, setActiveFile] = useState("main.js");
  const [newFileName, setNewFileName] = useState("");
  const [currentYText, setCurrentYText] = useState(null); // Track underlying Y.Text instance
  
  const filesMap = ydoc.getMap("files");
  const prevUsersRef = useRef([]);

  // Notify when users join or leave
  useEffect(() => {
    // Skip firing notifications on the very first render when the initial user list loads
    if (prevUsersRef.current.length === 0 && users.length > 0) {
      prevUsersRef.current = users;
      return;
    }

    const prevIds = prevUsersRef.current.map((u) => u.socketId);
    const currIds = users.map((u) => u.socketId);

    // Alert new joins
    users.forEach((u) => {
      if (!prevIds.includes(u.socketId)) {
        toast.success(`${u.username || "A developer"} joined`, {
          icon: "👋",
          id: `join-${u.socketId}`,
          style: { background: "#1e1e24", color: "#fff", fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)" },
        });
      }
    });

    // Alert disconnects
    prevUsersRef.current.forEach((u) => {
      if (!currIds.includes(u.socketId)) {
        toast.error(`${u.username || "A developer"} left`, {
          icon: "🏃‍♂️",
          id: `leave-${u.socketId}`,
          style: { background: "#1e1e24", color: "#9ca3af", fontSize: "12px", border: "1px solid rgba(255,255,255,0.05)" },
        });
      }
    });

    prevUsersRef.current = users;
  }, [users]);

  const handleEditorDidMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
    setEditorReady(true);
  }, []);

  // 1. Observe File Map Changes
  useEffect(() => {
    const updateFileList = () => {
      const files = Array.from(filesMap.keys());
      setFileList(files);

      // Manage active file fallback if deleted
      let currentActive = activeFile;
      if (!files.includes(activeFile) && files.length > 0) {
        setActiveFile(files[0]);
        currentActive = files[0];
      }

      // Re-trigger React's useEffect to rebind Monaco if the Y.Text memory reference changes
      const updatedText = filesMap.get(currentActive);
      setCurrentYText(updatedText || null);
    };
    
    filesMap.observe(updateFileList);
    updateFileList();
    return () => filesMap.unobserve(updateFileList);
  }, [filesMap, activeFile, ydoc]);

  // 2. Bind Monaco to ACTIVE file
  useEffect(() => {
    if (!editorReady || !editorRef.current || !currentYText) return;

    // Unbind previous file
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const model = editorRef.current.getModel();
    if (!model) return;

    // Safely clear model before rebinding to prevent layout cache bugs
    model.setValue(currentYText.toString());

    bindingRef.current = new MonacoBinding(
      currentYText,
      model,
      new Set([editorRef.current]),
      awareness
    );

    // Derive language from extension mapping
    const ext = activeFile.split('.').pop() || '';
    const extToLang = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 
      'py': 'python', 'cpp': 'cpp', 'c': 'c', 
      'java': 'java', 'go': 'go', 'rs': 'rust',
      'html': 'html', 'css': 'css', 'json': 'json'
    };
    const newLang = extToLang[ext] || 'javascript';
    monaco.editor.setModelLanguage(model, newLang);
    onLanguageChange?.(newLang); // Inform parent for execution

    // ── Attach Monaco Telemetry Hooks ──
    const editor = editorRef.current;
    
    // Typing detection
    const modelContentDisposable = editor.onDidChangeModelContent(() => {
      updateTelemetry({ activity: "typing..." });
      clearTimeout(telemetryTimeoutRef.current);
      telemetryTimeoutRef.current = setTimeout(() => updateTelemetry({ activity: "idle" }), 2000);
    });

    // Selection detection
    const cursorSelectionDisposable = editor.onDidChangeCursorSelection((e) => {
      const { startLineNumber, endLineNumber } = e.selection;
      if (startLineNumber !== endLineNumber) {
        updateTelemetry({ activity: `selecting lines ${startLineNumber}-${endLineNumber}` });
        clearTimeout(telemetryTimeoutRef.current);
        telemetryTimeoutRef.current = setTimeout(() => updateTelemetry({ activity: "idle" }), 3000);
      }
    });

    return () => {
      modelContentDisposable.dispose();
      cursorSelectionDisposable.dispose();
    };

  }, [currentYText, activeFile, awareness, editorReady, onLanguageChange, updateTelemetry]);

  // ── Smart Presence (Operational Awareness) ───────────────────────────
  const telemetryTimeoutRef = useRef(null);

  const updateTelemetry = useCallback((update) => {
    if (!awareness || !user) return;
    const currentState = awareness.getLocalState()?.user || {};
    awareness.setLocalStateField("user", {
      ...currentState,
      name: user.username || user.name || "Anonymous",
      color: user.color,
      ...update
    });
  }, [awareness, user]);

  // Sync active file on change
  useEffect(() => {
    updateTelemetry({ activeFile, activity: "idle" });
  }, [activeFile, updateTelemetry]);

  // Track all awareness states to inject dynamic CSS for cursor names and Sidebar telemetry
  useEffect(() => {
    if (!awareness) return;
    const updateUsers = () => setAwarenessUsers(Array.from(awareness.getStates().entries()));
    awareness.on("change", updateUsers);
    updateUsers();
    return () => awareness.off("change", updateUsers);
  }, [awareness]);

  return (
    <div className="flex h-screen w-full bg-[#0f0f11] text-gray-300 overflow-hidden font-sans">
      {/* ── Dynamic Cursor Styles ─────────────────────────────────────────── */}
      <style>
        {awarenessUsers.map(([clientId, state]) => {
          if (!state.user || !state.user.name) return "";
          return `
            .yRemoteSelectionHead-${clientId}::after {
              content: "${state.user.name}" !important;
              position: absolute !important;
              top: -20px !important;
              left: -2px !important;
              background-color: ${state.user.color || '#818cf8'} !important;
              color: #000 !important;
              padding: 2px 8px !important;
              border-radius: 4px !important;
              font-size: 10px !important;
              font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
              font-weight: 800 !important;
              letter-spacing: 0.05em !important;
              text-transform: uppercase !important;
              white-space: nowrap !important;
              z-index: 50 !important;
              border: none !important;
              pointer-events: none !important;
            }
          `;
        }).join("\n")}
      </style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 h-14 border-b border-white/5 bg-[#0f0f11]/80 backdrop-blur-xl z-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">CodeCollab</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2 group cursor-default">
            <span className="text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
              {roomId} /
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              {activeFile}
            </span>
            <div className={`w-2 h-2 ml-1 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsTerminalOpen(true);
              onRunCode?.(editorRef.current?.getValue());
            }}
            disabled={isExecuting}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100`}
          >
            <Play size={16} fill="currentColor" />
            <span className="text-sm font-bold">{isExecuting ? "Running..." : "Run"}</span>
          </button>
          
          <button 
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`p-2 rounded-lg transition-colors ${isTerminalOpen ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
            title="Toggle Output Terminal"
          >
            <TerminalSquare size={18} />
          </button>

          <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-lg transition-colors relative ${isChatOpen ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
          >
            <MessageCircle size={18} />
            {chatMessages.length > 0 && !isChatOpen && (
              <span className="absolute -top-0 at -right-0 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f0f11]" />
            )}
          </button>
          
          <button 
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors font-medium border border-transparent hover:border-white/10"
          >
            {theme === "vs-dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={onLogout}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-white/5 px-3 py-1.5 rounded-lg hover:bg-white/5 ml-2"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="flex w-full h-full pt-14 relative">
        {/* Editor Area */}
        <main className="flex-1 min-w-0 bg-[#0f0f11] flex flex-col">
          <div className="flex-1 min-h-0 relative">
            {currentYText ? (
              <Editor
                height="100%"
                defaultLanguage="javascript"
                language={language}
                theme={theme}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: true, scale: 0.75, renderCharacters: false },
                  scrollbar: { vertical: "visible", horizontal: "visible", useShadows: false, verticalHasArrows: false, horizontalHasArrows: false, verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  padding: { top: 20, bottom: 20 },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  renderLineHighlight: "all",
                  mouseWheelZoom: true,
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-40 select-none">
                <FileCode size={48} className="mb-4 text-gray-500" strokeWidth={1} />
                <h3 className="text-lg font-bold text-gray-400 mb-2">No File Open</h3>
                <p className="text-sm text-gray-500 font-mono">Create a new file in the Explorer to get started</p>
              </div>
            )}
          </div>

          {/* Terminal / Output Panel */}
          <div className={`border-t border-white/5 bg-[#09090b] transition-all duration-300 ease-in-out flex flex-col ${isTerminalOpen ? "h-64" : "h-0 border-transparent overflow-hidden"}`}>
            {isTerminalOpen && (
              <>
                <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-black/40 shrink-0">
                  <div className="flex items-center gap-2 text-gray-400">
                    <TerminalSquare size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Output Console</span>
                  </div>
                  <button onClick={() => setIsTerminalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  {isExecuting ? (
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-mono animate-pulse">
                      <span className="w-2 h-4 bg-indigo-400 block" /> Compiling & Executing {language}...
                    </div>
                  ) : (
                    <pre className={`font-mono text-[13px] leading-relaxed whitespace-pre-wrap ${outputError ? "text-red-400" : "text-gray-300"}`}>
                      {output || "Ready to execute code."}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        {/* Right Sidebar (Tabs + Presence + Chat) */}
        <aside className="w-80 flex flex-col border-l border-white/5 bg-[#0f0f11]">
          {/* Tab Headers */}
          <div className="flex h-12 border-b border-white/5 bg-black/20">
            <button 
              onClick={() => setActiveTab("files")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === "files" ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-gray-500 border-transparent hover:text-gray-300"}`}
            >
              <FolderGit2 size={14} />
              Files
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === "users" ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-gray-500 border-transparent hover:text-gray-300"}`}
            >
              <Users size={14} />
              Collab
            </button>
            <button 
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === "settings" ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-gray-500 border-transparent hover:text-gray-300"}`}
            >
              <Settings size={14} />
              Setup
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === "history" ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-gray-500 border-transparent hover:text-gray-300"}`}
            >
              <History size={14} />
              Log
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {activeTab === "files" && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-white/5 flex gap-2">
                  <input 
                    type="text" 
                    value={newFileName} 
                    onChange={e => setNewFileName(e.target.value.replace(/\s+/g, '-'))}
                    placeholder="new_file.js"
                    className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newFileName) {
                        if (!filesMap.has(newFileName)) {
                          filesMap.set(newFileName, new Y.Text("// new file\n"));
                          setActiveFile(newFileName);
                        }
                        setNewFileName("");
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newFileName && !filesMap.has(newFileName)) {
                        filesMap.set(newFileName, new Y.Text("// new file\n"));
                        setActiveFile(newFileName);
                        setNewFileName("");
                      }
                    }}
                    className="p-1 px-2.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {fileList.map(f => (
                    <div 
                      key={f} 
                      onClick={() => setActiveFile(f)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${activeFile === f ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "hover:bg-white/5 text-gray-400 border border-transparent"}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileCode size={14} className="shrink-0" />
                        <span className="text-xs font-medium truncate">{f}</span>
                      </div>
                      {fileList.length > 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete ${f}? This cannot be undone.`)) {
                              filesMap.delete(f);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                          title="Delete File"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "users" && (
              <Sidebar 
                roomId={roomId} 
                connected={connected} 
                users={awarenessUsers.map(([clientId, state]) => ({
                  clientId,
                  name: state.user?.name || "Anonymous",
                  color: state.user?.color || "#555",
                  activeFile: state.user?.activeFile || "unknown",
                  activity: state.user?.activity || "idle",
                }))} 
              />
            )}
            {activeTab === "settings" && (
              <div className="p-4 flex flex-col gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Language Selection</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["javascript", "python", "cpp", "java", "go", "rust"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => onLanguageChange?.(lang)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${language === lang ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Environment Status</h4>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-400">Node.js</span>
                      <span className="text-xs font-mono text-emerald-400">v20.x</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-400">Judge0 API</span>
                      <span className="text-xs font-mono text-indigo-400 italic">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "history" && (
              <div className="p-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Commit History</h4>
                {versions?.length > 0 ? (
                  <div className="space-y-3">
                    {versions.map((v, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all group relative">
                        <div>
                          <p className="text-xs font-bold text-gray-300">{v.label || `Version ${i+1}`}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{new Date(v.savedAt).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => onRestoreVersion?.(i)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded bg-indigo-500 text-white text-[10px] items-center gap-1 font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <History size={32} strokeWidth={1} />
                    <p className="text-[10px] mt-2 font-bold uppercase tracking-[0.1em]">No history yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className={`transition-all duration-300 ease-in-out border-t border-white/5 bg-black/40 ${isChatOpen ? "h-[450px]" : "h-0 overflow-hidden"}`}>
            <Chat 
              messages={chatMessages} 
              onSendMessage={sendChatMessage} 
              user={user}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
