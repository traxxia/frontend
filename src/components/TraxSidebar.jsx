import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';

import { useAnalysisStore } from '../store/analysisStore';
import AiMessageRenderer from './AiMessageRenderer';

const TraxSidebar = ({
  selectedBusinessId,
  selectedBusinessName,
  userName,
  userAnswers,
  questions,
  currentPageContext = 'Business Setup Onboarding',
  pageDescriptionContext = 'User is filling out the 5-step PMF onboarding form to generate insights.'
}) => {
  const { t, currentLanguage } = useTranslation();
  const answersDetails = useAnalysisStore(state => state.answersDetails);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [analyzedDocs, setAnalyzedDocs] = useState([]);
  const chatEndRef = useRef(null);
  const historyFetchedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const fetchStrategicDocs = async () => {
      if (!selectedBusinessId) return;
      const token = useAuthStore.getState().token;
      if (!token) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/businesses/${selectedBusinessId}/strategic-documents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (active && response.data && response.data.documents) {
          setAnalyzedDocs(response.data.documents.filter(doc => doc.is_analyzed === true));
        }
      } catch (err) {
        console.error("Error fetching strategic documents for TraxSidebar:", err);
      }
    };

    fetchStrategicDocs();

    const handleDocsUpdate = () => {
      fetchStrategicDocs();
    };

    window.addEventListener('strategicDocumentsAnalyzed', handleDocsUpdate);
    return () => {
      active = false;
      window.removeEventListener('strategicDocumentsAnalyzed', handleDocsUpdate);
    };
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!historyFetchedRef.current && selectedBusinessId) {
      historyFetchedRef.current = true;
      const fetchHistory = async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history/${selectedBusinessId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.history && response.data.history.length > 0) {
            setChatMessages(response.data.history.map((msg) => ({ role: msg.role, content: msg.text })));
          }
        } catch (error) {
          console.error("Error fetching AI chat history:", error);
        }
      };
      fetchHistory();
    }
  }, [selectedBusinessId]);

  const saveMessageToHistory = async (role, text) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history`,
        { role, text, project_id: selectedBusinessId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving AI chat message:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);
    await saveMessageToHistory('user', userMessage);
    
    try {
      const response = await fetch(import.meta.env.VITE_AI_CHAT_URL || 'http://localhost:4111/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': selectedBusinessId || 'unknown'
        },
        body: JSON.stringify({
          message: userMessage,
          current_page: currentPageContext,
          page_description: pageDescriptionContext,
          page_content: userAnswers || {},
          language: currentLanguage || 'en'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.response) {
        setChatMessages(prev => [...prev, { role: 'trax', content: data.response }]);
        await saveMessageToHistory('assistant', data.response);
      } else {
        setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I encountered an error connecting to the AI assistant." }]);
        console.error("Chat API error:", data);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I couldn't reach the AI assistant." }]);
      console.error("Chat API fetch error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderDocumentMessages = () => {
    if (!analyzedDocs || analyzedDocs.length === 0) return null;
    
    const totalAIFilled = Object.values(answersDetails || {}).filter(d => d?.ai_answer).length;
    const countStr = totalAIFilled > 0 ? ` ${Math.max(1, Math.floor(totalAIFilled / analyzedDocs.length))} answers` : ' answers';
    
    return analyzedDocs.map((doc, idx) => (
      <div key={`doc-msg-${idx}`} className="onboarding-chat-message notranslate">
        <div className="bubble-avatar notranslate" translate="no">TX</div>
        <div className="bubble-content" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          Read <strong>{doc.original_name || doc.filename || 'Document'}</strong>. I auto-filled{countStr} across the sections below — please review.
        </div>
      </div>
    ));
  };

  return (
    <div className="docked-onboarding-chat">
      <div className="onboarding-chat-header">
        <div className="avatar-wrapper">
          <div className="avatar-circle notranslate" translate="no">TX</div>
        </div>
        <div className="header-info">
          <h3 className="header-title notranslate" translate="no">Trax</h3>
        </div>
      </div>
      <div className="docked-chat-body">
        {currentPageContext === 'Advanced Insights' ? (
          <>
            <div className="onboarding-chat-message notranslate">
              <div className="bubble-avatar notranslate" translate="no">TX</div>
              <div className="bubble-content">
                Advanced is unlocked. A few more questions and I'll build the full picture — the 6 C's and the S.T.R.A.T.E.G.I.C. scorecard.
              </div>
            </div>
            <div className="onboarding-chat-message notranslate">
              <div className="bubble-avatar notranslate" translate="no">TX</div>
              <div className="bubble-content">
                Answer in any order. Initial and Essential set the context; Advanced and Financial Data add the depth.
              </div>
            </div>
            <div className="onboarding-chat-highlight-card notranslate" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              <strong>This is what your Bets are built from.</strong> The sharper your inputs, the sharper the diagnosis.
            </div>
            {renderDocumentMessages()}
          </>
        ) : (
          <>
            <div className="onboarding-chat-message notranslate">
              <div className="bubble-avatar notranslate" translate="no">TX</div>
              <div className="bubble-content">
                Hi {userName} — I'm Trax, your strategy consultant. To draft a real diagnosis for <strong>{selectedBusinessName}</strong>, I'll need a feel for the business.
              </div>
            </div>
            <div className="onboarding-chat-message notranslate">
              <div className="bubble-avatar notranslate" translate="no">TX</div>
              <div className="bubble-content">
                You can fill out the questions yourself — or add documents (annual plan, board deck, financials) and I'll read them and auto-fill what I can.
              </div>
            </div>
            <div className="onboarding-chat-highlight-card">
              <strong>I value context.</strong> The more you share, the sharper the diagnosis. Upload anything you have.
            </div>
            <div className="onboarding-chat-message">
              <div className="bubble-avatar notranslate" translate="no">TX</div>
              <div className="bubble-content">
                Great. Here are the {questions?.length || 6} questions I need to draft your diagnosis. Answer in any order — or add documents and I'll auto-fill what I can.
              </div>
            </div>
            {renderDocumentMessages()}
          </>
        )}
        {chatMessages.map((msg, idx) => (
            <div key={idx} className={`onboarding-chat-message notranslate ${msg.role === 'user' ? 'user-message' : ''}`}>
              <div className="bubble-avatar notranslate" translate="no">
                {msg.role === 'user' ? (userName?.charAt(0)?.toUpperCase() || 'U') : 'TX'}
              </div>
              <div className="bubble-content">
                {msg.role === 'trax' || msg.role === 'assistant' ? (
                  <AiMessageRenderer text={msg.content} role={msg.role} isBare={true} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
        ))}
        {isChatLoading && (
          <div className="onboarding-chat-message">
            <div className="bubble-avatar notranslate" translate="no">TX</div>
            <div className="bubble-content">
              <div className="typing-indicator" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%', padding: '4px 0' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0s' }}></span>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {/* Input bar */}
      <div className="onboarding-chat-input-bar">
        <form onSubmit={handleSendMessage} className="onboarding-chat-input-wrapper">
          <textarea
            className="onboarding-chat-input-field ai-textarea"
            placeholder={t("Type a message to Trax...") || "Type a message to Trax..."}
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
            style={{
              resize: 'none',
              overflowY: 'auto'
            }}
          />
          <button type="submit" className="onboarding-chat-send-btn" aria-label="Send">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TraxSidebar;
