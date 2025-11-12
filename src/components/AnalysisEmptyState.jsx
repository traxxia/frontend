import React, { useRef, useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
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
  iconSize = 48,
  buttonGap = '12px',
  marginTop = '16px'
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
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

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    if (onRemoveFile) {
      onRemoveFile();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="empty-state"> 
      <p>{getMessage()}</p> 
      
      {/* Regular Action Buttons */}
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
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d97706';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f59e0b';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              Improve Your Answers
            </button>
          )}
          

        </div>
      )}
    </div>
  );
};

export default AnalysisEmptyState;