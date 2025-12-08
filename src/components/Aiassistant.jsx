import React, { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import "../styles/Ai.css";

const Aiassistant = () => {

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [context] = useState("Enhance digital product offerings");
  const [credits] = useState(25);
  const [sources, setSources] = useState({
    internet: true,
    traxxia: true,
    qa: true,
    financials: true,
    other: true,
  });

  const suggestedQuestions = [
    "Help me refine the project description",
    "What risks should I consider?",
    "Suggest success metrics for this project",
    "How can I improve the strategic justification?",
  ];

  const toggleSource = (key) => {
    setSources((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleSend = () => {
    if (!query.trim()) return;
    // Placeholder: integrate with backend/LLM later
    console.log("AI Query:", { query, context, sources });
    setQuery("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="Ai-button"
        onClick={() => setOpen(true)}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Sparkles size={28} color="#ffffff" strokeWidth={2.3} />
      </button>

      {/* Slide-Out AI Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "380px",
          background: "#fff",
          boxShadow: "-4px 0px 20px rgba(0,0,0,0.1)",
          transition: "0.35s ease",
          transform: open ? "translateX(0)" : "translateX(100%)",
          zIndex: 999,
          padding: "20px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            background: "#6f3cff",
            color: "#fff",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} color="#fff" />
            <strong>AI Assistant</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              background: "rgba(255,255,255,0.15)",
              padding: "6px 10px",
              borderRadius: 20,
              fontSize: 12,
            }}>
              {credits} credits
            </span>
            <span style={{ fontSize: 12, opacity: 0.9 }}>• 1 credit per query</span>
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
              }}
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Context */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Context: Analyzing</div>
          <div style={{ fontWeight: 500 }}>{context}</div>
        </div>

        {/* Suggested Questions */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Suggested questions:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestedQuestions.map((q, i) => (
              <button
              className="ai-suggestion"
                key={i}
                onClick={() => setQuery(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Data Sources:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {[
              { key: "internet", label: "Internet Search (Perplexity)" },
              { key: "traxxia", label: "Traxxia Insights" },
              { key: "qa", label: "Historical Q&A" },
              { key: "financials", label: "Company Financials" },
              { key: "other", label: "Other Projects" },
            ].map((item) => (
              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!sources[item.key]}
                  onChange={() => toggleSource(item.key)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div
          className="ai-input-area"
        >
          <input
            className="ai-input"
            type="text"
            placeholder="Ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="ai-send-button"
            onClick={handleSend}
            disabled={!query.trim()}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Aiassistant;
