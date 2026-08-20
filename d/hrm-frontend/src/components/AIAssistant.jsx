import { useState, useRef, useEffect } from "react";
import api from "../services/api";

const SUGGESTIONS = [
  "How many employees do we have?",
  "Explain leave types",
  "How do I check in?",
  "What can my role access?"
];

function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi — I'm your HR assistant. Ask about leave, attendance, payroll, or how to use the system."
    }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: msg });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply, provider: data.provider }
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "I couldn't reach the assistant service. Check that the backend is running and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-assistant ${open ? "open" : ""}`}>
      {open && (
        <div className="ai-panel glass-panel">
          <div className="ai-panel-header">
            <div>
              <strong>HR Assistant</strong>
              <span className="ai-badge">AI</span>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div className="ai-bubble">
                  {m.text.split("\n").map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                  {m.provider === "openai" && (
                    <small className="ai-provider">Powered by GPT</small>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-bubble ai-typing">Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="ai-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about HR…"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
      >
        {open ? "×" : "✦"}
      </button>
    </div>
  );
}

export default AIAssistant;
