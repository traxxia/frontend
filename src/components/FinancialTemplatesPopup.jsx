import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileText } from 'lucide-react';

const FinancialTemplatesPopup = ({ 
  isOpen, 
  onClose, 
  onFileUploaded,
  isFileUploading = false 
}) => {
  const fileInputRef = useRef(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);

  const templates = [
    {
      id: 'simplified',
      name: 'Simplified Template',
      description: 'Quick inputs - Revenue, Direct Costs, Profit, and Cash Flow',
      fileName: 'traxxia_simplified_template.xlsx',
      icon: '⚡'
    },
    {
      id: 'standard',
      name: 'Standard Template',
      description: 'Income Statement, Cash Flow, and Balance Sheet basics',
      fileName: 'traxxia_standard_template.xlsx',
      icon: '📊',
      recommended: true
    },
    {
      id: 'detailed',
      name: 'Detailed Template', 
      description: 'Full breakdowns for board-level reporting and investor analysis',
      fileName: 'traxxia_detailed_template.xlsx',
      icon: '📈'
    }
  ];

  const handleDownload = (template) => {
    const link = document.createElement('a');
    link.href = `/templates/${template.fileName}`;
    link.download = template.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload Excel (.xlsx, .xls) or CSV files only.');
      return;
    }

    if (onFileUploaded) {
      // Pass the selected template type for validation
      onFileUploaded(file, selectedTemplateType);
    }

    // Reset selection
    setSelectedTemplateType(null);
    onClose();
  };

  const triggerFileUpload = (templateType = null) => {
    setSelectedTemplateType(templateType);
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '672px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div>
            <h2 
              className="text-xl font-bold text-gray-900"
              style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}
            >
              Financial Data Upload
            </h2>
            <p 
              className="text-gray-600 text-sm mt-1"
              style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px', margin: 0 }}
            >
              Download templates or upload your data
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.color = '#4b5563'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div style={{ padding: '24px' }}>
          {/* Download Templates Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 
              style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={20} />
              Download Sample Templates
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>{template.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontWeight: '500', color: '#111827', margin: 0 }}>
                          {template.name}
                        </h4>
                        {template.recommended && (
                          <span 
                            style={{
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
                        {template.description}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleDownload(template)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button> 
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '14px' }}>
              <span style={{ padding: '0 16px', backgroundColor: 'white', color: '#6b7280' }}>OR</span>
            </div>
          </div>

          {/* General Upload Section */}
          <div>
            <h3 
              style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={20} />
              Upload Any Template File
            </h3>
            
            <div 
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = '#9ca3af'}
              onMouseLeave={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <FileText 
                size={48} 
                style={{ 
                  margin: '0 auto 16px auto', 
                  color: '#9ca3af',
                  display: 'block'
                }} 
              />
              <h4 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                Auto-Detect Template Type
              </h4>
              <p style={{ color: '#4b5563', marginBottom: '24px' }}>
                Upload any template and we'll detect the type automatically
              </p>
              
              <button
                onClick={() => triggerFileUpload()}
                disabled={isFileUploading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#059669',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isFileUploading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  opacity: isFileUploading ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isFileUploading) e.target.style.backgroundColor = '#047857';
                }}
                onMouseLeave={(e) => {
                  if (!isFileUploading) e.target.style.backgroundColor = '#059669';
                }}
              >
                {isFileUploading ? (
                  <>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Choose File to Upload</span>
                  </>
                )}
              </button>
              
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
                Supported formats: Excel (.xlsx, .xls) and CSV files
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div 
            style={{
              marginTop: '32px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '8px' }}>
              How it works:
            </h4>
            <ol style={{ fontSize: '14px', color: '#1e40af', margin: 0, paddingLeft: '16px' }}>
              <li style={{ marginBottom: '4px' }}>Download a template that fits your needs</li>
              <li style={{ marginBottom: '4px' }}>Fill out the template with your financial data</li>
              <li style={{ marginBottom: '4px' }}>Upload using "Upload This" for exact validation or general upload for auto-detection</li>
              <li>Get AI-powered insights with validated data</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Add keyframe animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FinancialTemplatesPopup;