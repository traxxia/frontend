import React from 'react';
import { FileX, Upload, AlertCircle, TrendingUp, MessageCircle, Edit } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const FinancialEmptyState = ({
  analysisType = "financial",
  analysisDisplayName = "Financial Analysis",
  icon: IconComponent = TrendingUp,
  onFileUpload,
  onRegenerate,
  onImproveAnswers,
  isRegenerating = false,
  canRegenerate = true,
  showFileUpload = true,
  uploadedFile = null,
  onRemoveFile,
  isUploading = false,
  fileUploadMessage = "Upload Excel or CSV files for detailed financial analysis",
  acceptedFileTypes = ".xlsx,.xls,.csv",
  customMessage = null,
  showImproveAnswersButton = true,
  minimumAnswersRequired = 3,
  userAnswers = {},
  onRedirectToChat,
  isMobile = false,
  setActiveTab,
  hasUploadedDocument = false
}) => {
  const { t } = useTranslation();

  const answeredCount = Object.keys(userAnswers || {}).length;
  const hasMinimumAnswers = answeredCount >= minimumAnswersRequired;

  const defaultMessage = `No ${analysisDisplayName.toLowerCase()} results found. The uploaded financial document doesn't contain the required data or proper values for analysis.`;

  const handleRedirectToFileManagement = () => {
    if (isMobile && setActiveTab) {
      setActiveTab('chat');
    }

    if (onRedirectToChat) {
      onRedirectToChat({ scrollToUploadCard: true }); 
    } else { 
      const chatSection = document.querySelector('.chat-section');
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="financial-empty-state">
      <div className="financial-empty-content">
        {/* Icon */}
        <div className="financial-empty-icon">
          <FileX size={48} color="#6b7280" />
        </div>

        {/* Title */}
        <h3 className="financial-empty-title">
          No Data Available
        </h3>

        {/* Message */}
        <p className="financial-empty-message">
          {customMessage || defaultMessage}
        </p>

        {/* File Management Redirect Button - Show if document exists */}
        {(uploadedFile || hasUploadedDocument) && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleRedirectToFileManagement}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0284c7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0ea5e9'}
            >
              <Edit size={16} />
              Change Financial Document
            </button>
            <br></br>
          </div>
        )}

        {/* Show file upload option if no document exists */}
        {!uploadedFile && !hasUploadedDocument && showFileUpload && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleRedirectToFileManagement}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              <Upload size={16} />
              Upload Financial Document
            </button>
            <br></br>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialEmptyState;