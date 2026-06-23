import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import AiMessageRenderer from './AiMessageRenderer';

const OnboardingChat = ({ userName, businessName, onBack, onStart }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    setInputValue('');
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'trax', content: t("Thanks for the context! I'll keep this in mind. Please continue filling out the questions so I can generate your insights.") || "Thanks for the context! I'll keep this in mind. Please continue filling out the questions so I can generate your insights." }]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend(e);
    }
  };

  return (
    <div className="onboarding-chat-wrapper">
      <div className="business-header-container mb-4" style={{width: '-webkit-fill-available', margin: '0 auto', position: 'fixed'}}>
        <button className="back-button" onClick={onBack} aria-label="Back to Dashboard" style={{ position: 'static', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>{t("backToDashboard_B3") || "Back to Dashboard"}</span>
        </button>
        <div className="business-breadcrumb">
          <span className="breadcrumb-separator">/</span>
          <span className="business-header-name">{businessName}</span>
        </div>
      </div>

      <div className="onboarding-chat-card">
        <div className="onboarding-chat-header">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              TX
            </div>
          </div>
          <div className="header-info">
            <h3 className="header-title">Trax</h3>
          </div>
        </div>

        <div className="onboarding-chat-body">
          <div className="onboarding-chat-message">
            <div className="bubble-avatar">
              TX
            </div>
            <div className="bubble-content">
              Hi {userName} — I'm Trax, your strategy consultant. To draft a real diagnosis for <strong>{businessName}</strong>, I'll need a feel for the business.
            </div>
          </div>

          <div className="onboarding-chat-message">
            <div className="bubble-avatar">
              TX
            </div>
            <div className="bubble-content">
              You can fill out the questions yourself — or add documents (annual plan, board deck, financials) and I'll read them and auto-fill what I can.
            </div>
          </div>

          <div className="onboarding-chat-highlight-card">
            <strong>I value context.</strong> The more you share, the sharper the diagnosis. Upload anything you have.
          </div>

          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`onboarding-chat-message ${msg.role === 'user' ? 'user-message' : ''}`}>
              <div className="bubble-avatar">
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

          <div className="onboarding-chat-cta-container">
            <button className="onboarding-chat-btn-begin" onClick={onStart}>
              Let's begin &rarr;
            </button>
          </div>
        </div>

        <div className="onboarding-chat-input-bar">
          <form onSubmit={handleSend} className="onboarding-chat-input-wrapper">
            <textarea
              className="onboarding-chat-input-field ai-textarea"
              placeholder={t("Type a message to Trax...") || "Type a message to Trax..."}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={1}
              style={{
                resize: 'none',
                overflowY: 'auto'
              }}
            />
            <button type="submit" className="onboarding-chat-send-btn" aria-label="Send">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingChat;
