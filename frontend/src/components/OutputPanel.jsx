/**
 * components/OutputPanel.jsx — Code execution output panel (Judge0)
 */
import { useState } from "react";
import { X, Terminal, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Judge0 language IDs (most common)
const JUDGE0_LANG_IDS = {
  javascript: 63,
  typescript: 74,
  python:     71,
  cpp:        54,
  c:          50,
  java:       62,
  go:         60,
  rust:       73,
};

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";

export default function OutputPanel({ code, language, onClose }) {
  const [output,  setOutput]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function runCode() {
    const langId = JUDGE0_LANG_IDS[language];
    if (!langId) {
      setError(`Code execution not supported for ${language}`);
      return;
    }

    const apiKey = import.meta.env.VITE_JUDGE0_API_KEY;
    if (!apiKey) {
      // Demo mode — show a mock output
      setOutput({
        stdout: `[Demo mode] Code execution requires VITE_JUDGE0_API_KEY.\nAdd your RapidAPI Judge0 key to frontend/.env\n\nYour ${language} code (${code.length} chars) would run here.`,
        status: { description: "Demo" },
        time: "–",
        memory: "–",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      // Submit
      const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: "",
        }),
      });

      const result = await submitRes.json();
      setOutput(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const statusOk = output?.status?.id <= 3;

  return (
    <div className="flex flex-col h-full bg-editor-bg border-t border-editor-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-editor-border bg-editor-sidebar">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-editor-muted" />
          <span className="text-xs font-semibold text-editor-text">Output</span>
          {output && (
            <span className={`badge ml-1 ${statusOk ? "text-editor-green border-editor-green/30" : "text-editor-red border-editor-red/30"}`}>
              {statusOk ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {output.status?.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCode}
            disabled={loading}
            className="btn-primary py-1 px-3 text-xs"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : "▶ Run"}
          </button>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto font-mono text-xs">
        {!output && !error && !loading && (
          <p className="text-editor-muted italic">Click ▶ Run to execute your code…</p>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-editor-muted">
            <Loader2 size={14} className="animate-spin" />
            Executing…
          </div>
        )}
        {error && (
          <p className="text-editor-red">{error}</p>
        )}
        {output && (
          <div className="space-y-3">
            {output.stdout && (
              <div>
                <p className="text-editor-green mb-1 text-[10px] uppercase tracking-wider">stdout</p>
                <pre className="text-editor-text whitespace-pre-wrap">{output.stdout}</pre>
              </div>
            )}
            {output.stderr && (
              <div>
                <p className="text-editor-red mb-1 text-[10px] uppercase tracking-wider">stderr</p>
                <pre className="text-editor-red whitespace-pre-wrap">{output.stderr}</pre>
              </div>
            )}
            {output.compile_output && (
              <div>
                <p className="text-editor-yellow mb-1 text-[10px] uppercase tracking-wider">compile</p>
                <pre className="text-editor-yellow whitespace-pre-wrap">{output.compile_output}</pre>
              </div>
            )}
            <div className="flex gap-4 text-editor-muted text-[10px] border-t border-editor-border pt-2">
              <span>Time: {output.time || "–"}s</span>
              <span>Memory: {output.memory ? `${output.memory}KB` : "–"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
