import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, Zap } from "lucide-react";
import axios from "axios";
import "../styles/Ai.css";

const Aiassistant = ({ businessId: propBusinessId, projectId }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! How can I help you today? 👋" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState({ exceeded: false, resetAt: null });
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

  // Fetch unified history on mount.
  // We use 'all' to get the continuous thread across the entire session.
  useEffect(() => {
    const fetchHistory = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/ai-chat/history/all`,
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
  }, []); // Only fetch on mount to retain history during navigation

  // Check quota status when panel is opened
  useEffect(() => {
    if (open) {
      checkQuota();
    }
  }, [open]);

  const checkQuota = async () => {
    const businessId = getBusinessId();
    const token = getToken();
    if (!token || !businessId) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/companies/ai-usage/${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data) {
        setQuotaStatus({
          exceeded: response.data.quotaExceed,
          resetAt: response.data.quotaResetAt
        });
      }
    } catch (error) {
      console.error("Error checking AI quota:", error);
    }
  };

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
    const businessId = getBusinessId();
    const token = getToken();

    try {
      // 1. Pre-check: Verify AI token status before calling AI Assistant API
      const usageResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/companies/ai-usage/${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usageData = usageResponse.data;

      // Update local state to sync UI
      setQuotaStatus({
        exceeded: usageData?.quotaExceed || false,
        resetAt: usageData?.quotaResetAt || null
      });

      if (usageData?.quotaExceed) {
        const resetDate = usageData.quotaResetAt
          ? new Date(usageData.quotaResetAt).toLocaleDateString()
          : "soon";
        assistantText = `⚠️ You have reached the AI token limit for your plan. Your quota will reset on ${resetDate}.`;
        setIsLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
        await saveMessageToHistory("assistant", assistantText);
        return;
      }

      // 2. Call AI Assistant API
      const requestBody = { message: userText };
      if (projectId) {
        requestBody.projectId = projectId;
      }

      const response = await fetch(process.env.REACT_APP_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": businessId,
        },
        body: JSON.stringify(requestBody),
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

        // 3. Post-update: Log the tokens consumed
        // Extracting tokens_used from the AI service response
        const tokensUsed = data.usage?.totalTokens || data.usage?.total_tokens || data.tokensUsed || 0;

        if (tokensUsed > 0) {
          try {
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URL}/api/companies/update-ai-usage`,
              { business_id: businessId, tokens_used: tokensUsed },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (updateError) {
            console.error("Failed to update AI token usage:", updateError);
          }
        }
      }
    } catch (error) {
      console.error("AI Assistant API Error:", error);
      assistantText = "Sorry, I encountered a network error. Please check your connection and try again.";
    } finally {
      // Always show and save the assistant reply — even error messages
      if (assistantText) {
        setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
        await saveMessageToHistory("assistant", assistantText);
      }
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
          {quotaStatus.exceeded ? (
            <div className="ai-limit-reached">
              <Zap size={14} className="ai-limit-icon" />
              <span>Limit Reached. Quota Resets At : {quotaStatus.resetAt ? new Date(quotaStatus.resetAt).toLocaleDateString() : 'soon'}</span>
            </div>
          ) : (
            <>
              <input
                className="ai-input"
                type="text"
                placeholder="Ask anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="ai-send-btn"
                onClick={() => handleSend()}
                disabled={!query.trim() || isLoading}
              >
                <Send size={15} color="#fff" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Aiassistant;
