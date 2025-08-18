import React, { useRef } from 'react';
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
      
      {/* File Upload Section - Show only if enabled and has enough answers */}
      {showFileUpload && hasEnoughAnswers && (
        <div style={{ 
          marginTop: '20px', 
          marginBottom: '20px',
          padding: '20px',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Upload size={32} style={{ color: '#6b7280', marginBottom: '8px' }} />
            <p style={{ 
              margin: '0 0 8px 0', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              Upload Document for Enhanced Analysis
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>
              {fileUploadMessage}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!uploadedFile ? (
            <button
              onClick={handleFileUploadClick}
              disabled={isUploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isUploading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            >
              {isUploading ? (
                <>
                  <Loader size={16} className="spinning" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Choose File
                </>
              )}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #d1fae5',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: '#065f46',
                  fontSize: '14px'
                }}>
                  {uploadedFile.name}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#059669' 
                }}>
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                onClick={handleRemoveFile}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* File Upload Action Buttons */}
          {uploadedFile && onGenerateWithFile && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={onGenerateWithFile}
                disabled={isUploading}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isUploading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isUploading) {
                    e.target.style.backgroundColor = '#059669';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploading) {
                    e.target.style.backgroundColor = '#10b981';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isUploading ? 'Analyzing...' : 'Generate with File'}
              </button>
              
              {onGenerateWithoutFile && (
                <button
                  onClick={onGenerateWithoutFile}
                  disabled={isUploading}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isUploading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      e.target.style.backgroundColor = '#4b5563';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUploading) {
                      e.target.style.backgroundColor = '#6b7280';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  Generate without File
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
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