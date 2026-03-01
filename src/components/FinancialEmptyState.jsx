import React from 'react';
import { FileX, Upload, AlertCircle, TrendingUp, MessageCircle, Edit } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import MissingMetricsDisplay from './MissingMetricsDisplay';

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
  hasUploadedDocument = false,
  readOnly = false,
  documentInfo = null // New prop for document information
}) => {
  const { t } = useTranslation();

  const answeredCount = Object.keys(userAnswers || {}).length;
  const hasMinimumAnswers = answeredCount >= minimumAnswersRequired;

  const defaultMessage = `No ${analysisDisplayName.toLowerCase()} results found. The uploaded financial document doesn't contain the required data or proper values for analysis.`;

  const handleRedirectToFileManagement = () => {
    // Don't redirect in read-only mode
    if (readOnly) return;

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

  // Enhanced document detection - check multiple sources
  const hasDocumentUploaded = uploadedFile || hasUploadedDocument || (documentInfo && documentInfo.has_document);
  
  // Create documentInfo object if it doesn't exist but we know a document is uploaded
  const effectiveDocumentInfo = documentInfo || (hasDocumentUploaded ? {
    has_document: true,
    filename: uploadedFile?.name || 'Financial Document',
    template_name: 'Standard', // Default template type
    upload_date: new Date().toISOString()
  } : null);

  return (
    <div className="financial-empty-state">
      <div className="financial-empty-content">
        {/* Icon */} 

        {/* Missing Metrics Display - Show when ANY document exists */}
        {hasDocumentUploaded && (
          <MissingMetricsDisplay
            documentInfo={effectiveDocumentInfo}
            analysisType={analysisType}
            className="missing-metrics-section"
          />
        )}
        {/* Only show upload/change buttons if not in read-only mode */}
        {!readOnly && (
          <>
            {/* File Management Redirect Button - Show if document exists */}
            {hasDocumentUploaded && (
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
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
                >
                  <Edit size={16} />
                  Change Financial Document
                </button>
                <br />
              </div>
            )}

            {/* Show file upload option if no document exists */}
            {!hasDocumentUploaded && showFileUpload && (
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
                <br />
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default FinancialEmptyState;