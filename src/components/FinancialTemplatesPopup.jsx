import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Accordion } from 'react-bootstrap';
import { useTranslation } from "../hooks/useTranslation";
import '../styles/FinancialTemplatesPopup.css';

const FinancialTemplatesPopup = ({
  isOpen,
  onClose,
  onFileUploaded,
  isFileUploading = false,
  readOnly = false // Add this prop to control upload functionality
}) => {
  const { t } = useTranslation();
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
    <div className="ftp-backdrop">
      <div className="ftp-modal">
        {/* Header */}
        <div className="ftp-header">
          <div>
            <h2 className="ftp-title">
              {readOnly ? t("financial_data_templates") : t("financial_data_upload")}
            </h2>
            <p className="ftp-subtitle">
              {readOnly ? t("download_sample_templates") : t("download_templates_upload_data")}
            </p>
          </div>
          <button onClick={onClose} className="ftp-close-btn">
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

        <div className="ftp-body">
          {/* Download Templates Section */}
          <div className="ftp-section">
            <Accordion defaultActiveKey={null}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <div className="ftp-accordion-header-content">
                    <Download size={20} />
                    <span className="ftp-accordion-title">
                      {t("download_sample_templates")}
                    </span>
                  </div>
                </Accordion.Header>

                <Accordion.Body>
                  <div className="ftp-template-list">
                    {templates.map((template) => (
                      <div key={template.id} className="ftp-template-item">
                        <div className="ftp-template-info">
                          <span className="ftp-template-icon">{template.icon}</span>
                          <div>
                            <div className="ftp-template-name-row">
                              <h4 className="ftp-template-name">
                                {template.name}
                              </h4>
                              {template.recommended && (
                                <span className="ftp-recommended-badge">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="ftp-template-desc">
                              {template.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(template)}
                          className="ftp-download-btn"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>

          {/* Template Comparison Section */}
          <div className="ftp-section">
            <div className="ftp-comp-header">
              <h3 className="ftp-comp-title">
                📋 {t("all_template_comparison")}
              </h3>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="ftp-view-comp-btn"
              >
                {showComparison ? (
                  <>
                    <span>Hide Comparison</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>{t("view_comparison")}</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>

            {showComparison && (
              <div className="ftp-table-container">
                <table className="ftp-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th className="center">Simplified</th>
                      <th className="center">Standard</th>
                      <th className="center">Detailed</th>
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
                        <tr key={metric.key} className={index % 2 === 0 ? 'even' : 'odd'}>
                          <td>
                            {metric.name}
                          </td>
                          <td className="center">
                            {isMetricRequired(metric.key, 'simplified') ? (
                              <Check size={16} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                            ) : (
                              <X size={16} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                            )}
                          </td>
                          <td className="center">
                            {isMetricRequired(metric.key, 'standard') ? (
                              <Check size={16} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                            ) : (
                              <X size={16} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                            )}
                          </td>
                          <td className="center">
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
              <div className="ftp-divider">
                <div className="ftp-divider-line-container">
                  <div className="ftp-divider-line" />
                </div>
                <div className="ftp-divider-text-container">
                  <span className="ftp-divider-text">OR</span>
                </div>
              </div>

              {/* General Upload Section */}
              <div className="ftp-section">
                <h3 className="ftp-upload-section-title">
                  <Upload size={20} />
                  {t("upload_any_template_file")}
                </h3>

                <div className="ftp-dropzone">
                  <FileText size={48} className="ftp-dropzone-icon" />
                  <h4 className="ftp-dropzone-title">
                    {t("auto_detect_template_type")}
                  </h4>
                  <p className="ftp-dropzone-text">
                    {t("upload_any_template_auto_detect")}
                  </p>

                  <button
                    onClick={() => triggerFileUpload()}
                    disabled={isFileUploading}
                    className="ftp-upload-btn"
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
                        <span>{t("choose_file_to_upload")}</span>
                      </>
                    )}
                  </button>

                  <p className="ftp-supported-formats">
                    {t("supported_formats_excel_csv")}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Instructions */}
          <div className="ftp-info-banner">
            <h4 className="ftp-info-title">
              {readOnly ? t("template_information") : t("how_it_works")}
            </h4>

            {readOnly ? (
              <ul className="ftp-info-list">
                <li>{t("templates_used_financial_analysis")}</li>
                <li>{t("download_structure_format_requirements")}</li>
                <li>{t("use_reference_future_uploads")}</li>
                <li>{t("contact_support_template_help")}</li>
              </ul>
            ) : (
              <ol className="ftp-info-list">
                <li>{t("download_template_that_fits")}</li>
                <li>{t("fill_template_financial_data")}</li>
                <li>{t("upload_this_exact_validation")}</li>
                <li>{t("get_ai_powered_insights")}</li>
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default FinancialTemplatesPopup;