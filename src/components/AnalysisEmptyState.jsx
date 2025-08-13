import React from 'react';
import { useTranslation } from "../hooks/useTranslation";

const AnalysisEmptyState = ({
  // Required props
  analysisType,
  analysisDisplayName,
  icon: IconComponent,
  onImproveAnswers,
  onRegenerate,
  
  // Optional props
  isRegenerating = false,
  canRegenerate = true,
  userAnswers = {},
  minimumAnswersRequired = 3,
  customMessage = null,
  showRegenerateButton = true,
  showImproveButton = true,
  
  // Styling props
  iconSize = 48,
  buttonGap = '12px',
  marginTop = '16px'
}) => {
  const { t } = useTranslation();
  
  const answeredCount = Object.keys(userAnswers).length;
  const hasEnoughAnswers = answeredCount >= minimumAnswersRequired;
  
  // Determine what message and buttons to show
  const getMessage = () => {
    if (customMessage) {
      return customMessage;
    }
    
    if (!hasEnoughAnswers) {
      return `Answer more questions to generate ${analysisDisplayName.toLowerCase()} insights.`;
    }
    
    return `You answered the required questions, but the responses need more detail to generate meaningful ${analysisDisplayName.toLowerCase()}.`;
  };

  const shouldShowButtons = hasEnoughAnswers && (showImproveButton || showRegenerateButton);

  return (
    <div className="empty-state">
      <IconComponent size={iconSize} className="empty-icon" />
      <h3>{analysisDisplayName}</h3>
      <p>{getMessage()}</p>
      
      {shouldShowButtons && (
        <div style={{ 
          display: 'flex', 
          gap: buttonGap, 
          marginTop: marginTop,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {showImproveButton && (
            <button 
              onClick={onImproveAnswers}
              className="redirect-button"
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d97706';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Improve Your Answers
            </button>
          )}
          
          {showRegenerateButton && (
            <button 
              onClick={onRegenerate}
              disabled={isRegenerating || !canRegenerate}
              className="regenerate-button-alt"
              style={{
                backgroundColor: isRegenerating ? '#9CA3AF' : '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isRegenerating || !canRegenerate ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isRegenerating || !canRegenerate ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isRegenerating && canRegenerate) {
                  e.target.style.backgroundColor = '#4F46E5';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRegenerating && canRegenerate) {
                  e.target.style.backgroundColor = '#6366F1';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isRegenerating ? 'Regenerating...' : 'Try Regenerating'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisEmptyState;