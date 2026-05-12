import React from 'react';
import { Loader, Sparkles } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import '../styles/AnalysisEmptyState.css';

import { useAuthStore } from '../store/authStore';

const AnalysisEmptyState = ({
  analysisType,
  analysisDisplayName,
  icon: IconComponent,
  onImproveAnswers,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  userAnswers = {},
  minimumAnswersRequired = 3,
  customMessage = null,
  showRegenerateButton = true,
  showImproveButton = true,
  showFileUpload = false,
  onFileUpload = null,
  onGenerateWithFile = null,
  onGenerateWithoutFile = null,
  uploadedFile = null,
  onRemoveFile = null,
  isUploading = false,
  fileUploadMessage = "Upload documents for detailed analysis",
  acceptedFileTypes = ".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png",
  iconSize = 40,
  buttonGap = '16px',
  marginTop = '0px'
}) => {
  const { t } = useTranslation();

  const userRole = useAuthStore(state => state.userRole);
  const isViewer = userRole === "viewer";

  const answeredCount = Object.keys(userAnswers).length;
  const hasEnoughAnswers = answeredCount >= minimumAnswersRequired;
  const effectiveShowImproveButton = isViewer ? false : showImproveButton;
  const effectiveShowRegenerateButton = isViewer ? false : showRegenerateButton;
  const getMessage = () => {
    if (customMessage) {
      return customMessage;
    }

    return t("insufficient_analysis_depth", {
    analysis: analysisDisplayName.toLowerCase()
    });

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

      {}
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
