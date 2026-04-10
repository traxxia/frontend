import React, { useCallback, useMemo } from 'react';
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

  const handleRedirectToFileManagement = useCallback(() => {
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
  }, [readOnly, isMobile, setActiveTab, onRedirectToChat]);

  // Enhanced document detection - check multiple sources
  const hasDocumentUploaded = uploadedFile || hasUploadedDocument || (documentInfo && documentInfo.has_document);

  // Create documentInfo object if it doesn't exist but we know a document is uploaded
  const effectiveDocumentInfo = useMemo(() => documentInfo || (hasDocumentUploaded ? {
    has_document: true,
    filename: uploadedFile?.name || 'Financial Document',
    template_name: 'Standard', // Default template type
    upload_date: new Date().toISOString()
  } : null), [documentInfo, hasDocumentUploaded, uploadedFile?.name]);

  return (
    <div className="financial-empty-state">
      <div className="financial-empty-content"> 
         <MissingMetricsDisplay
            documentInfo={effectiveDocumentInfo}
            analysisType={analysisType}
            className="missing-metrics-section"
          />
      </div>
    </div>
  );
};

export default FinancialEmptyState;