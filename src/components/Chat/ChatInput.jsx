import React from 'react';
import { Send, Loader } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const ChatInput = ({ 
  currentInput, 
  setCurrentInput, 
  onSubmit, 
  isInputDisabled, 
  isSubmitDisabled, 
  isArchived,
  isProcessing,
  pendingValidation,
  nextQuestion
}) => {
  const { t } = useTranslation();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  if (isArchived) {
    return (
      <div className="input-area">
        <div className="input-wrapper archived-notice">
          <span>Chat is disabled because this workspace is Archived (Read-Only).</span>
        </div>
      </div>
    );
  }

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={pendingValidation ? "Please provide more details..." : nextQuestion ? t("typeYourAnswer") : t("All_questions_completed!")}
          disabled={isInputDisabled}
          className="message-input"
          rows="2"
        />
        <button 
          onClick={onSubmit} 
          disabled={isSubmitDisabled} 
          className={`send-button ${isSubmitDisabled ? 'disabled' : ''}`}
        >
          {isProcessing ? <Loader size={16} className="spinner" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
