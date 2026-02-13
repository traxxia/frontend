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
    internet: false,
    traxxia: false,
    qa: false,
    financials: false,
    other: false,
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

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:4111/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": "698ab3fb36154464bbd4a6ce",
        },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI assistant");
      }

      const data = await response.json();

      // Look for response or text field in the API reply
      const assistantText = data.response || data.text || "I'm sorry, I couldn't process that request.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: assistantText },
      ]);
    } catch (error) {
      console.error("AI Assistant API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I encountered an error. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
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

          {/* Context */}
        <div
          style={{
            background: "#E9F5FF",
            borderBottom: "1px solid #90c5e4ff",
            padding: "10px 14px 12px 14px",
            margin: 0,      
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Context: Analyzing</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{context}</div>
        </div>
          <div className="ai-content">
            {/* Chat Window */}
            <div className="chat-wrapper">
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
                      background: m.role === "user" ? "#6f3cff" : "#f3f4f6",
                      color: m.role === "user" ? "#ffffff" : "#050505ff",
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
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                Suggested questions
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="ai-suggestion"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Data Sources - Accordion */}
          <div className="datasource-wrapper">
          <div className="datasource-title">Data Sources</div>

          <div className="datasource-list">
            {[
              { key: "internet", label: "Internet Search (Perplexity)" },
              { key: "traxxia", label: "Traxxia Insights" },
              { key: "qa", label: "Historical Q&A" },
              { key: "financials", label: "Company Financials" },
              { key: "other", label: "Other Projects" },
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
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
            disabled={!query.trim() || isLoading}
            style={{ opacity: (!query.trim() || isLoading) ? 0.5 : 1 }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Aiassistant;
