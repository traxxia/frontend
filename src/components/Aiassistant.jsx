import React, { useState, useEffect } from "react";
import { Sparkles, Send, ChevronDown } from "lucide-react";
import axios from "axios";
import "../styles/Ai.css";

const Aiassistant = ({ businessId: propBusinessId, projectId }) => {

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

  // Derive business ID from prop or session storage
  const getBusinessId = () => {
    return propBusinessId || sessionStorage.getItem("activeBusinessId"); // Fallback to hardcoded ID if none found
  };

  const getToken = () => sessionStorage.getItem("token");

  // Fetch history when projectId changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!projectId) {
        setMessages([{ role: "assistant", text: "Hi! How can I help with your project?" }]);
        return;
      }

      const token = getToken();
      if (!token) return;

      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/ai-chat/history/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.history && response.data.history.length > 0) {
          setMessages(response.data.history.map(msg => ({
            role: msg.role,
            text: msg.text
          })));
        } else {
          setMessages([{ role: "assistant", text: "Hi! How can I help with your project?" }]);
        }
      } catch (error) {
        console.error("Error fetching AI chat history:", error);
      }
    };

    fetchHistory();
  }, [projectId]);

  const saveMessageToHistory = async (role, text) => {
    if (!projectId) return;

    const token = getToken();
    if (!token) return;

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai-chat/history`, {
        project_id: projectId,
        role,
        text
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error saving AI chat message to history:", error);
    }
  };

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userText = query;
    const userMessage = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    // Save user message to history
    await saveMessageToHistory("user", userText);

    try {
      const response = await fetch(process.env.REACT_APP_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": getBusinessId(),
        },
        body: JSON.stringify({ message: userText }),
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

      // Save assistant message to history
      await saveMessageToHistory("assistant", assistantText);

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
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div className="thinking-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
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
        {/*
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
        */}
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
