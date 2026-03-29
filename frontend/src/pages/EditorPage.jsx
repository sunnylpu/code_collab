import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as Y from "yjs";

import { useAuth }          from "../hooks/useAuth.jsx";
import { useYjs }           from "../hooks/useYjs.js";
import CollaborativeEditor  from "../editor/CollaborativeEditor.jsx";
import { api }              from "../utils/api.js";
import { executeCode }      from "../utils/execute.js";

export default function EditorPage() {
  const { roomId }    = useParams();
  const { user, logout } = useAuth();
  const navigate      = useNavigate();

  const [room, setRoom] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [versions, setVersions] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState("");
  const [outputError, setOutputError] = useState(false);

  // Yjs + Socket.io
  const { 
    ydoc, 
    awareness, 
    connected, 
    users, 
    chatMessages, 
    sendChatMessage 
  } = useYjs(roomId, user);

  // ── Fetch room metadata ────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    api.getRoom(roomId)
      .then((r) => {
        setRoom(r);
        setLanguage(r.language || "javascript");
      })
      .catch(() => {
        toast.error("Room not found");
        navigate("/dashboard");
      });

    api.getRoomVersions(roomId)
      .then(setVersions)
      .catch(() => {});
  }, [roomId, navigate]);

  if (!roomId) return null;

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    try {
      await api.updateRoom(roomId, { language: lang });
    } catch {
      // Non-critical
    }
  };

  const handleRunCode = async (code) => {
    if (!code?.trim()) {
      toast.error("Editor is empty");
      return;
    }
    
    setIsExecuting(true);
    setOutput("Executing...\n");
    setOutputError(false);
    toast.loading("Running code...", { id: "run-code" });
    
    try {
      const result = await executeCode(language, code);
      const resRun = result.run;
      
      if (resRun.code !== 0 || resRun.stderr) {
        setOutputError(true);
        setOutput(resRun.stderr || resRun.output || "Unknown error occurred.");
        toast.error("Execution failed", { id: "run-code" });
      } else {
        setOutputError(false);
        setOutput(resRun.stdout || "Execution successful (no output).");
        toast.success("Done!", { id: "run-code" });
      }
    } catch (err) {
      setOutputError(true);
      setOutput(err.message || "Failed to contact execution engine.");
      toast.error("Network error", { id: "run-code" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRestoreVersion = async (index) => {
    const confirmRestore = window.confirm("Are you sure you want to restore this version? This will replace the current code for everyone.");
    if (!confirmRestore) return;

    toast.loading("Restoring version...", { id: "restore-version" });
    try {
      const data = await api.getRoomVersionText(roomId, index);
      if (data.files && ydoc) {
        ydoc.transact(() => {
          const filesMap = ydoc.getMap("files");
          
          // Delete keys that don't exist in the old version
          for (const key of filesMap.keys()) {
            if (!data.files[key]) filesMap.delete(key);
          }

          // Insert or update keys from old version
          Object.keys(data.files).forEach((filename) => {
            let yText = filesMap.get(filename);
            if (!yText) {
              yText = new Y.Text();
              filesMap.set(filename, yText);
            }
            yText.delete(0, yText.length);
            yText.insert(0, data.files[filename]);
          });
        });
        toast.success("Version restored successfully!", { id: "restore-version" });
      } else {
        throw new Error("Invalid version data");
      }
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error("Failed to restore version", { id: "restore-version" });
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0f0f11]">
      <CollaborativeEditor
        ydoc={ydoc}
        awareness={awareness}
        roomId={roomId}
        user={user}
        connected={connected}
        users={users}
        chatMessages={chatMessages}
        sendChatMessage={sendChatMessage}
        onRunCode={handleRunCode}
        isExecuting={isExecuting}
        output={output}
        outputError={outputError}
        language={language}
        onLanguageChange={handleLanguageChange}
        versions={versions}
        onRestoreVersion={handleRestoreVersion}
        onLogout={logout}
      />
    </div>
  );
}
