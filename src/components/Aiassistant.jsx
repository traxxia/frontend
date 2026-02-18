import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot } from "lucide-react";
import axios from "axios";
import "../styles/Ai.css";

const Aiassistant = ({ businessId: propBusinessId, projectId }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! How can I help you today? 👋" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "Help me refine the project description",
    "What risks should I consider?",
    "Suggest success metrics",
    "How to improve strategic justification?",
  ];

  const getBusinessId = () =>
    propBusinessId || sessionStorage.getItem("activeBusinessId");

  const getToken = () => sessionStorage.getItem("token");

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, isLoading]);

  // Fetch history when projectId changes.
  // Uses 'global' scope when no projectId is provided (non-project pages).
  useEffect(() => {
    const fetchHistory = async () => {
      const token = getToken();
      if (!token) return;

      // Use 'global' as the key when not in a project context
      const historyKey = projectId || 'global';

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/ai-chat/history/${historyKey}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.history && response.data.history.length > 0) {
          setMessages(response.data.history.map((msg) => ({ role: msg.role, text: msg.text })));
        } else {
          setMessages([{ role: "assistant", text: "Hi! How can I help you today? 👋" }]);
        }
      } catch (error) {
        console.error("Error fetching AI chat history:", error);
        setMessages([{ role: "assistant", text: "Hi! How can I help you today? 👋" }]);
      }
    };
    fetchHistory();
  }, [projectId]);

  const saveMessageToHistory = async (role, text) => {
    const token = getToken();
    if (!token) return;
    try {
      // Only include project_id if we are in a project context
      const body = { role, text };
      if (projectId) body.project_id = projectId;

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/ai-chat/history`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving AI chat message:", error);
    }
  };

  const handleSend = async (text) => {
    const userText = text || query;
    if (!userText.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setQuery("");
    setIsLoading(true);
    await saveMessageToHistory("user", userText);

    let assistantText = "";

    try {
      const response = await fetch(process.env.REACT_APP_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": getBusinessId(),
        },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit or other API errors gracefully
        if (data?.error && data.error.toLowerCase().includes("rate limit")) {
          assistantText = "⚠️ The AI is temporarily unavailable due to rate limits. Please try again in a few minutes.";
        } else {
          assistantText = data?.error || "Sorry, I couldn't process that request. Please try again.";
        }
      } else {
        assistantText = data.response || data.text || "I'm sorry, I couldn't process that request.";
      }
    } catch (error) {
      console.error("AI Assistant API Error:", error);
      assistantText = "Sorry, I encountered a network error. Please check your connection and try again.";
    } finally {
      // Always show and save the assistant reply — even error messages
      setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
      await saveMessageToHistory("assistant", assistantText);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button — hidden when panel is open */}
      <button
        className={`ai-fab${open ? " ai-fab--hidden" : ""}`}
        onClick={() => setOpen(true)}
        title="AI Assistant"
      >
        <Sparkles size={22} color="#fff" />
      </button>

      {/* Backdrop */}
      {open && <div className="ai-backdrop" onClick={() => setOpen(false)} />}

      {/* Panel — slides up from bottom */}
      <div className={`ai-panel ${open ? "ai-panel--open" : ""}`}>
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header__left">
            <div className="ai-header__icon">
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <div className="ai-header__title">AI Assistant</div>
              <div className="ai-header__subtitle">Powered by Traxxia</div>
            </div>
          </div>
          <button className="ai-header__close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="ai-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ai-msg--${m.role}`}>
              {m.role === "assistant" && (
                <div className="ai-msg__avatar">
                  <Bot size={14} color="#6f3cff" />
                </div>
              )}
              <div className="ai-msg__bubble">{m.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-msg ai-msg--assistant">
              <div className="ai-msg__avatar">
                <Bot size={14} color="#6f3cff" />
              </div>
              <div className="ai-msg__bubble ai-msg__bubble--typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="ai-suggestions">
          <p className="ai-suggestions__label">Suggestions</p>
          <div className="ai-suggestions__list">
            {suggestedQuestions.map((q, i) => (
              <button key={i} className="ai-suggestion-chip" onClick={() => handleSend(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="ai-input-row">
          <input
            className="ai-input"
            type="text"
            placeholder="Ask anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="ai-send-btn"
            onClick={() => handleSend()}
            disabled={!query.trim() || isLoading}
          >
            <Send size={15} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Aiassistant;
