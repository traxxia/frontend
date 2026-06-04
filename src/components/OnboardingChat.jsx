import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const OnboardingChat = ({ userName, businessName, onBack, onStart }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e) => {
    if (e) e.preventDefault();
    onStart();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="onboarding-chat-wrapper">
      <div className="onboarding-chat-breadcrumb-bar">
        <button className="back-button" onClick={onBack} aria-label="Back to Dashboard">
          <ArrowLeft size={16} />
          <span>{t("backToDashboard_B3") || "Back to Dashboard"}</span>
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="business-badge">{businessName}</span>
      </div>

      <div className="onboarding-chat-card">
        <div className="onboarding-chat-header">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              TX
            </div>
            <div className="status-dot"></div>
          </div>
          <div className="header-info">
            <h3 className="header-title">Trax</h3>
            <span className="header-subtitle">{t("Strategy Consultant") || "Strategy Consultant"}</span>
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

          <div className="onboarding-chat-cta-container">
            <button className="onboarding-chat-btn-begin" onClick={onStart}>
              Let's begin &rarr;
            </button>
          </div>
        </div>

        <div className="onboarding-chat-input-bar">
          <form onSubmit={handleSend} className="onboarding-chat-input-wrapper">
            <input
              type="text"
              className="onboarding-chat-input-field"
              placeholder={t("Type a message to Trax...") || "Type a message to Trax..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button type="submit" className="onboarding-chat-send-btn" aria-label="Send">
              <Send />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingChat;
