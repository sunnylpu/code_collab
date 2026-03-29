import { useState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import { withAlpha, getInitials } from "../utils/colors";

export default function Chat({ messages = [], onSendMessage, onClose, user }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Room Chat</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <p className="text-[10px] text-gray-500 text-center italic pt-6 px-4">
            No messages yet. Say hello to your collaborators! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === user?.name;
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} animate-fade-in`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  background: withAlpha(msg.color || "#888", 0.1),
                  color: msg.color,
                  border: `1px solid ${withAlpha(msg.color || "#888", 0.3)}`,
                }}
              >
                {getInitials(msg.sender)}
              </div>
              
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <span className="text-[9px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-tighter">
                    {msg.sender}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm
                    ${isMe
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-tr-sm"
                      : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-sm"}`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-600 mt-1 uppercase font-medium tracking-widest">
                  {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-black/20 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          maxLength={500}
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
