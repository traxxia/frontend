import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, Zap, Trash2, AlertTriangle, CornerDownLeft } from "lucide-react";
import axios from "axios";
import "../styles/Ai.css";
import { useTranslation } from "../hooks/useTranslation";
import AiMessageRenderer from "./AiMessageRenderer";

import { useAuthStore, useBusinessStore } from '../store';

const Aiassistant = ({ businessId: propBusinessId, projectId, pageContext, isDisabled }) => {
  const { selectedBusinessId } = useBusinessStore();
  const userName = useAuthStore((state) => state.userName);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! 👋 I can help you using your business data, current page insights, and strategy analysis. Ask me anything about risks, strategy, or recommendations."
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState({ exceeded: false, resetAt: null, usedTokens: 0, limit: 3000000 });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedQuestions = [
    "Help me refine the project description",
    "What risks should I consider?",
    "Suggest success metrics",
    "How to improve strategic justification?",
  ];

  const getBusinessId = () => propBusinessId || selectedBusinessId;

  const getToken = () => useAuthStore.getState().token;
  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, isLoading]);

  const historyFetchedRef = useRef(false);
  useEffect(() => {
    historyFetchedRef.current = false;
  }, [projectId]);
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleOpenAssistant = () => {
      if (!isDisabled) {
        setOpen(true);
      }
    };
    window.addEventListener('open_ai_assistant', handleOpenAssistant);
    return () => window.removeEventListener('open_ai_assistant', handleOpenAssistant);
  }, [isDisabled]);

  const checkQuota = React.useCallback(async () => {
    const businessId = propBusinessId || selectedBusinessId;
    const token = getToken();
    if (!token || !businessId) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/companies/ai-usage/${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data) {
        setQuotaStatus({
          exceeded: response.data.quotaExceed,
          resetAt: response.data.quotaResetAt,
          usedTokens: response.data.ai_token_usage || 0,
          limit: response.data.ai_limit || 3000000
        });
      }
    } catch (error) {
      console.error("Error checking AI quota:", error);
    }
  }, [propBusinessId, selectedBusinessId]);
  useEffect(() => {
    if (!open) {
      return;
    }

    if (!historyFetchedRef.current) {
      historyFetchedRef.current = true;
      const fetchHistory = async () => {
        const token = getToken();
        if (!token) return;
        try {
          const resolvedProjectId = projectId || 'global';
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history/${resolvedProjectId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const introMessage = {
            role: "assistant",
            text: "Hi! 👋 I can help you using your business data, current page insights, and strategy analysis. Ask me anything about risks, strategy, or recommendations."
          };

          if (response.data.history && response.data.history.length > 0) {
            setMessages([
              introMessage,
              ...response.data.history.map((msg) => ({ role: msg.role, text: msg.text }))
            ]);
          } else {
            setMessages([introMessage]);
          }
        } catch (error) {
          console.error("Error fetching AI chat history:", error);
          setMessages([{ role: "assistant", text: "Hi! 👋 I can help you using your business data, current page insights, and strategy analysis. Ask me anything about risks, strategy, or recommendations." }]);
        }
      };
      fetchHistory();
    }

    checkQuota();
  }, [open, projectId, checkQuota]);

  const saveMessageToHistory = async (role, text) => {
    const token = getToken();
    if (!token) return;
    try {
      const body = { role, text };
      if (projectId) body.project_id = projectId;

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving AI chat message:", error);
    }
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const resolvedProjectId = projectId || 'global';
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history/${resolvedProjectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([{ role: "assistant", text: "Hi! How can I help you today? 👋" }]);
    } catch (error) {
      console.error("Error clearing AI chat history:", error);
    } finally {
      setShowClearConfirm(false);
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
    const startTime = Date.now();
    let responseData = null;

    try {
      const usageResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/companies/ai-usage/${businessId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usageData = usageResponse.data;
      setQuotaStatus({
        exceeded: usageData?.quotaExceed || false,
        resetAt: usageData?.quotaResetAt || null,
        usedTokens: usageData?.ai_token_usage || 0,
        limit: usageData?.ai_limit || 3000000
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
      const requestBody = { message: userText };
      if (projectId) {
        requestBody.projectId = projectId;
      }
      if (pageContext) {
        requestBody.current_page = pageContext.current_page;
        requestBody.page_description = pageContext.page_description;
        if (pageContext.page_content) {
          requestBody.page_content = pageContext.page_content;
        }
      }

      const response = await fetch(import.meta.env.VITE_AI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": businessId,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      responseData = data;

      if (!response.ok) {
        if (data?.error && data.error.toLowerCase().includes("rate limit")) {
          assistantText = "⚠️ The AI is temporarily unavailable due to rate limits. Please try again in a few minutes.";
        } else {
          assistantText = data?.error || "Sorry, I couldn't process that request. Please try again.";
        }
      } else {
        assistantText = data.response || data.text || "I'm sorry, I couldn't process that request.";
        const tokensUsed = data.usage?.totalTokens || data.usage?.total_tokens || data.tokensUsed || 0;

        if (tokensUsed > 0) {
          try {
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/companies/update-ai-usage`,
              { business_id: businessId, tokens_used: tokensUsed },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedUsageResp = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/companies/ai-usage/${businessId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (updatedUsageResp.data) {
              setQuotaStatus(prev => ({
                ...prev,
                usedTokens: updatedUsageResp.data.ai_token_usage || 0,
                exceeded: updatedUsageResp.data.quotaExceed || false,
                limit: updatedUsageResp.data.ai_limit || 3000000
              }));
            }
          } catch (updateError) {
            console.error("Failed to update AI token usage:", updateError);
          }
        }
      }
    } catch (error) {
      console.error("AI Assistant API Error:", error);
      assistantText = "Sorry, I encountered a network error. Please check your connection and try again.";
    } finally {
      if (assistantText) {
        setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
        await saveMessageToHistory("assistant", assistantText);
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/ai-chat/log-turn`,
          {
            user_input: userText,
            system_prompt: responseData?.systemPrompt || null,
            assistant_response: assistantText,
            business_id: businessId,
            project_id: projectId || null,
            page_context: pageContext || null,
            token_usage: {
              prompt_tokens: responseData?.usage?.promptTokens || responseData?.usage?.prompt_tokens || 0,
              completion_tokens: responseData?.usage?.completionTokens || responseData?.usage?.completion_tokens || 0,
              total_tokens: responseData?.usage?.totalTokens || responseData?.usage?.total_tokens || 0
            },
            model: responseData?.model,
            status: assistantText.startsWith('\u26a0\ufe0f') ? 'quota_exceeded' : 'success',
            latency_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
          },
          { headers: { Authorization: `Bearer ${token}`, 'x-business-id': businessId } }
        ).catch(() => { });
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
      { }
      <button
        className={`ai-fab${open ? " ai-fab--hidden" : ""}`}
        onClick={() => !isDisabled && setOpen(true)}
        disabled={isDisabled}
        title={isDisabled ? "Complete onboarding to use AI Assistant" : "AI Assistant"}
      >
        <span className="ai-fab-text">TX</span>
        <span className="ai-fab-dot-green"></span>
        <span className="ai-fab-dot-orange">!</span>
      </button>

      { }
      {open && <div className="ai-backdrop" onClick={() => setOpen(false)} />}

      { }
      <div className={`ai-panel ${open ? "ai-panel--open" : ""}`}>
        { }
        <div className="ai-header">
          <div className="ai-header__left">
            <div className="ai-header__icon">
              <span className="ai-header-icon-text">TX</span>
              <span className="ai-header-dot-green"></span>
            </div>
            <div className="ai-header__content">
              <div className="ai-header__title">Trax</div>
              <div className="ai-header__subtitle">1 thing flagged</div>
            </div>
          </div>
          <div className="ai-header__actions">
            <button
              className="ai-header__clear"
              onClick={handleClearHistory}
              title="Clear History"
            >
              <Trash2 size={16} />
            </button>
            <button className="ai-header__close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        { }
        <div className="ai-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ai-msg--${m.role}`}>
              <div className={`ai-msg__avatar ai-msg__avatar--${m.role}`}>
                {m.role === "assistant" ? "TX" : (userName?.charAt(0)?.toUpperCase() || "U")}
              </div>
              <AiMessageRenderer text={m.text} role={m.role} />
            </div>
          ))}

          {isLoading && (
            <div className="ai-msg ai-msg--assistant">
              <div className="ai-msg__avatar">
                <Bot size={14} color="#6f3cff" />
              </div>
              <AiMessageRenderer text="" role="assistant" isTyping={true} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="ai-suggestions">
            <p className="ai-suggestions__label">Try asking</p>
            <div className="ai-suggestions__list">
              {suggestedQuestions.map((q, i) => (
                <button key={i} className="ai-suggestion-chip" onClick={() => handleSend(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-panel, #fff)' }}>
          <div className="ai-input-row">
            {quotaStatus.exceeded ? (
              <div className="ai-limit-reached">
                <Zap size={14} className="ai-limit-icon" />
                <span>Limit Reached. Quota Resets At : {quotaStatus.resetAt ? new Date(quotaStatus.resetAt).toLocaleDateString() : 'soon'}</span>
              </div>
            ) : (
              <>
                <textarea
                  className="ai-textarea"
                  placeholder="Ask, push back, or correct..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                      e.target.style.height = 'auto';
                    }
                  }}
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  className="ai-send-btn"
                  onClick={() => {
                    handleSend();
                    const ta = document.querySelector('.ai-textarea');
                    if(ta) ta.style.height = 'auto';
                  }}
                  disabled={!query.trim() || isLoading}
                >
                  <CornerDownLeft size={16} color="#fff" strokeWidth={3} />
                </button>
              </>
            )}
          </div>
          {!quotaStatus.exceeded && (
            <div className="ai-input-hint">
              Press <strong>Shift + Enter</strong> for a new line
            </div>
          )}
        </div>
      </div>

      { }
      {showClearConfirm && (
        <div className="ai-modal-overlay">
          <div className="ai-modal">
            <div className="ai-modal__icon">
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <h3 className="ai-modal__title">Clear History?</h3>
            <p className="ai-modal__text">
              This will permanently delete your chat conversation. This action cannot be undone.
            </p>
            <div className="ai-modal__actions">
              <button
                className="ai-modal__btn ai-modal__btn--cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="ai-modal__btn ai-modal__btn--delete"
                onClick={confirmClear}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Aiassistant;
