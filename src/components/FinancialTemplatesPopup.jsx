import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react';

const FinancialTemplatesPopup = ({
  isOpen,
  onClose,
  onFileUploaded,
  isFileUploading = false,
  readOnly = false // Add this prop to control upload functionality
}) => {
  const fileInputRef = useRef(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

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

  const TEMPLATE_METRICS = {
    simplified: {
      name: "Simplified",
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true }
      ]
    },
    standard: {
      name: "Standard",
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "cogs", name: "Cost Of Goods", required: true },
        { key: "ebitda", name: "EBITDA", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_income", name: "Operating Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true },
        { key: "total_assets", name: "Total Assets", required: true },
        { key: "shareholder_equity", name: "Shareholder Equity", required: true },
        { key: "total_debt", name: "Total Debt", required: true }
      ]
    },
    detailed: {
      name: "Detailed",
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "cogs", name: "Cost Of Goods", required: true },
        { key: "ebitda", name: "EBITDA", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_income", name: "Operating Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true },
        { key: "current_assets", name: "Current Assets", required: true },
        { key: "current_liabilities", name: "Current Liabilities", required: true },
        { key: "cash", name: "Cash", required: true },
        { key: "inventory", name: "Inventory", required: true },
        { key: "total_assets", name: "Total Assets", required: true },
        { key: "shareholder_equity", name: "Shareholder Equity", required: true },
        { key: "total_debt", name: "Total Debt", required: true }
      ]
    }
  };

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
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '896px',
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
              {readOnly ? 'Financial Data Templates' : 'Financial Data Upload'}
            </h2>
            <p
              className="text-gray-600 text-sm mt-1"
              style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px', margin: 0 }}
            >
              {readOnly ? 'Download sample templates' : 'Download templates or upload your data'}
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

        {/* Hidden file input - only if not readOnly */}
        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        )}

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

          {/* Template Comparison Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📋 All Template Comparison
              </h3>
              <button
                onClick={() => setShowComparison(!showComparison)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {showComparison ? (
                  <>
                    <span>Hide Comparison</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>View Comparison</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>

            {showComparison && (

              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Metric
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                        Simplified
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                        Standard
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                        Detailed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Get all unique metrics
                      const allMetrics = [];
                      const metricSet = new Set();

                      Object.values(TEMPLATE_METRICS).forEach(template => {
                        template.metrics.forEach(metric => {
                          if (!metricSet.has(metric.key)) {
                            metricSet.add(metric.key);
                            allMetrics.push(metric);
                          }
                        });
                      });

                      // Check if a metric is required for a specific template
                      const isMetricRequired = (metricKey, templateKey) => {
                        const template = TEMPLATE_METRICS[templateKey];
                        return template.metrics.some(m => m.key === metricKey && m.required);
                      };

                      return allMetrics.map((metric, index) => (
                        <tr key={metric.key} style={{
                          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                        }}>
                          <td style={{ padding: '10px 12px', fontWeight: '500', color: '#374151' }}>
                            {metric.name}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {isMetricRequired(metric.key, 'simplified') ? (
                              <Check size={16} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                            ) : (
                              <X size={16} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {isMetricRequired(metric.key, 'standard') ? (
                              <Check size={16} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                            ) : (
                              <X size={16} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {isMetricRequired(metric.key, 'detailed') ? (
                              <Check size={16} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                            ) : (
                              <X size={16} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Only show upload section if not readOnly */}
          {!readOnly && (
            <>
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
            </>
          )}

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
              {readOnly ? 'Template Information:' : 'How it works:'}
            </h4>
            {readOnly ? (
              <ul style={{ fontSize: '14px', color: '#1e40af', margin: 0, paddingLeft: '16px' }}>
                <li style={{ marginBottom: '4px' }}>These templates were used for the financial analysis</li>
                <li style={{ marginBottom: '4px' }}>Download to see the structure and format requirements</li>
                <li style={{ marginBottom: '4px' }}>Use as reference for future financial data uploads</li>
                <li>Contact support if you need help understanding the template format</li>
              </ul>
            ) : (
              <ol style={{ fontSize: '14px', color: '#1e40af', margin: 0, paddingLeft: '16px' }}>
                <li style={{ marginBottom: '4px' }}>Download a template that fits your needs</li>
                <li style={{ marginBottom: '4px' }}>Fill out the template with your financial data</li>
                <li style={{ marginBottom: '4px' }}>Upload using "Upload This" for exact validation or general upload for auto-detection</li>
                <li>Get AI-powered insights with validated data</li>
              </ol>
            )}
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