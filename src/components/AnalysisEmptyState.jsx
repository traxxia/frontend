import React, { useRef, useState } from 'react';
import { Upload, X, Loader, MessageSquareQuote, Sparkles } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import '../styles/AnalysisEmptyState.css';

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

  // File upload props
  showFileUpload = false,
  onFileUpload = null,
  onGenerateWithFile = null,
  onGenerateWithoutFile = null,
  uploadedFile = null,
  onRemoveFile = null,
  isUploading = false,
  fileUploadMessage = "Upload documents for detailed analysis",
  acceptedFileTypes = ".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png",

  // Styling props
  iconSize = 40,
  buttonGap = '16px',
  marginTop = '0px'
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const userRole = sessionStorage.getItem("userRole");
  const isViewer = userRole === "viewer";

  const answeredCount = Object.keys(userAnswers).length;
  const hasEnoughAnswers = answeredCount >= minimumAnswersRequired;

  // Override visibility flags if user is a viewer
  const effectiveShowImproveButton = isViewer ? false : showImproveButton;
  const effectiveShowRegenerateButton = isViewer ? false : showRegenerateButton;
  const effectiveShowFileUpload = isViewer ? false : showFileUpload;

  // Determine what message and buttons to show
  const getMessage = () => {
    if (customMessage) {
      return customMessage;
    }

    if (!hasEnoughAnswers) {
      return `Start providing more specific details in the business brief to unlock your ${analysisDisplayName.toLowerCase()} and strategic insights.`;
    }

    return `You've provided some great initial information, but we need more strategic depth to generate a high-quality ${analysisDisplayName.toLowerCase()}.`;
  };

  const shouldShowButtons = (hasEnoughAnswers && (effectiveShowImproveButton || effectiveShowRegenerateButton)) || (customMessage && (onRegenerate || onImproveAnswers));

  return (
    <div className="empty-state-container"> 

      <h3 className="empty-state-title">
        {isRegenerating ? 'Generating Insights...' : `${analysisDisplayName}`}
      </h3>

      <p className="empty-state-message">
        {getMessage()}
      </p>

      {/* Regular Action Buttons */}
      {shouldShowButtons && (
        <div className="empty-state-actions" style={{ marginTop: marginTop }}>
          {effectiveShowImproveButton && (
            <button
              onClick={onImproveAnswers}
              className="empty-state-btn empty-state-btn-secondary"
            >
              <Sparkles size={18} />
              Improve Answers
            </button>
          )}

          {effectiveShowRegenerateButton && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="empty-state-btn empty-state-btn-primary"
            >
              <Loader size={18} className={isRegenerating ? 'spin-animation' : ''} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Analysis'}
            </button>
          )}
        </div>
      )}

      {isRegenerating && (
        <div className="empty-state-regenerating">
          <Loader size={24} className="spin-animation" />
          <span>Building your strategy...</span>
        </div>
      )}
    </div>
  );
};

export default AnalysisEmptyState;
