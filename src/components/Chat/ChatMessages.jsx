import React from 'react';
import { BotMessageSquare, Database } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

const ChatMessages = ({ messages, isViewer, isFileUploading, hasUploadedDocument, onUploadDecision, onShowTemplates, UploadedFileCard }) => {
  return (
    <div className="messages-container">
      {messages.filter(message => message.type !== 'system').map((message, index) => (
        <React.Fragment key={message.id}>
          <div className={`message-wrapper ${message.type}`}>
            {message.type === 'bot' && (
              <div className="bot-avatar">
                <BotMessageSquare size={18} color="white" />
              </div>
            )}

            <div className={`message-bubble ${message.type} ${message.isFollowUp ? 'follow-up' : ''} ${message.isSkipped ? 'skipped' : ''}`}>
              <div className="message-text">
                {message.text}
              </div>

              {!isViewer && message.showUploadButtons && !hasUploadedDocument && (
                <div className="upload-decision-buttons">
                  <button onClick={() => onUploadDecision('upload')} disabled={isFileUploading} className="upload-btn">
                    <Database size={16} /> Upload Financial Data
                  </button>
                  <button onClick={() => onUploadDecision('skip')} disabled={isFileUploading} className="skip-btn">
                    Skip & Continue
                  </button>
                </div>
              )}

              {!isViewer && message.showUploadButton && !hasUploadedDocument && (
                <div className="upload-decision-buttons">
                  <button onClick={onShowTemplates} disabled={isFileUploading} className="upload-btn">
                    <Database size={16} /> Upload Financial Data
                  </button>
                </div>
              )}

              <div className="message-timestamp">
                {formatDate(message.timestamp)}
                {message.type === 'bot' && message.phase && (
                  <span className="phase-indicator"> - {message.phase} phase</span>
                )}
              </div>
            </div>
          </div>
          {/* File Card Logic can be passed in or handled here */}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ChatMessages;
