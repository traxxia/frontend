import React from 'react';
import { FileX, Upload, AlertCircle, TrendingUp } from 'lucide-react';
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
  userAnswers = {}
}) => {
  const { t } = useTranslation();
  
  const answeredCount = Object.keys(userAnswers || {}).length;
  const hasMinimumAnswers = answeredCount >= minimumAnswersRequired;

  const defaultMessage = `No ${analysisDisplayName.toLowerCase()} results found. The uploaded financial document doesn't contain the required data or proper values for analysis.`;

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
 
      </div>
    </div>
  );
};

export default FinancialEmptyState;