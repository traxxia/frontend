import React, { useState } from "react";
import { Sparkles, Send, ChevronDown } from "lucide-react";
import "../styles/Ai.css";

const Aiassistant = () => {

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [context] = useState("Enhance digital product offerings");
  const [credits] = useState(25);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! How can I help with your project?" },
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSources, setShowSources] = useState(true);
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
    setMessages((prev) => [
      ...prev,
      { role: "user", text: query },
      // Placeholder assistant reply; replace with real LLM response
      { role: "assistant", text: "Got it! I'll analyze and respond shortly." },
    ]);
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
      <div className="ai-panel" style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}>
        {/* Top bar */}
        <div className="ai-tool-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} color="#fff" />
            <strong>AI Assistant</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="credits-pill">{credits} credits</span>
            <span style={{ fontSize: 12, opacity: 0.9 }}>• 1 credit per query</span>
            <button className="ai-close-btn" onClick={() => setOpen(false)} aria-label="Close" title="Close">✕</button>
          </div>
        </div>

        {/* Scrollable content area to prevent overlap with input */}
        <div className="ai-content">
          {/* Context */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Context: Analyzing</div>
            <div style={{ fontWeight: 500 }}>{context}</div>
          </div>

          {/* Chat Window */}
          <div
            style={{
              marginTop: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#0f172a",
              padding: 12,
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: m.role === "user" ? "#1f2937" : "#111827",
                    color: "#fff",
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Questions - Accordion */}
          <div className="ai-accordion">
            <button
              className="ai-accordion-header"
              onClick={() => setShowSuggestions((v) => !v)}
              aria-expanded={showSuggestions}
            >
              <span className="ai-accordion-title">Suggested questions</span>
              <ChevronDown
                size={18}
                className={`ai-accordion-icon ${showSuggestions ? "open" : ""}`}
              />
            </button>
            {showSuggestions && (
              <div className="ai-accordion-content">
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
            )}
          </div>

          {/* Data Sources - Accordion */}
          <div className="ai-accordion">
            <button
              className="ai-accordion-header"
              onClick={() => setShowSources((v) => !v)}
              aria-expanded={showSources}
            >
              <span className="ai-accordion-title">Data Sources</span>
              <ChevronDown
                size={18}
                className={`ai-accordion-icon ${showSources ? "open" : ""}`}
              />
            </button>
            {showSources && (
              <div className="ai-accordion-content">
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                  {[
                    { key: "internet", label: "Internet Search (Perplexity)" },
                    { key: "traxxia", label: "Traxxia Insights" },
                    { key: "qa", label: "Historical Q&A" },
                    { key: "financials", label: "Company Financials" },
                    { key: "other", label: "Other Projects" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    >
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
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="ai-input-area">
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
