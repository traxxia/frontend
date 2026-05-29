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
  readOnly = false
}) => {
  const {
    t
  } = useTranslation();
  const fileInputRef = useRef(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const templates = [{
    id: 'simplified',
    name: 'Simplified Template',
    description: 'Quick inputs - Revenue, Direct Costs, Profit, and Cash Flow',
    fileName: 'traxxia_simplified_template.xlsx',
    icon: '⚡'
  }, {
    id: 'standard',
    name: 'Standard Template',
    description: 'Income Statement, Cash Flow, and Balance Sheet basics',
    fileName: 'traxxia_standard_template.xlsx',
    icon: '📊',
    recommended: true
  }, {
    id: 'detailed',
    name: 'Detailed Template',
    description: 'Full breakdowns for board-level reporting and investor analysis',
    fileName: 'traxxia_detailed_template.xlsx',
    icon: '📈'
  }];
  const TEMPLATE_METRICS = {
    simplified: {
      name: "Simplified",
      metrics: [{
        key: "revenue",
        name: "Revenue",
        required: true
      }, {
        key: "net_income",
        name: "Net Income",
        required: true
      }, {
        key: "operating_expenses",
        name: "Operating Expenses",
        required: true
      }, {
        key: "gross_profit",
        name: "Gross Profit",
        required: true
      }, {
        key: "revenue_trends",
        name: "Revenue Trends",
        required: true
      }]
    },
    standard: {
      name: "Standard",
      metrics: [{
        key: "revenue",
        name: "Revenue",
        required: true
      }, {
        key: "cogs",
        name: "Cost Of Goods",
        required: true
      }, {
        key: "ebitda",
        name: "EBITDA",
        required: true
      }, {
        key: "net_income",
        name: "Net Income",
        required: true
      }, {
        key: "operating_income",
        name: "Operating Income",
        required: true
      }, {
        key: "operating_expenses",
        name: "Operating Expenses",
        required: true
      }, {
        key: "gross_profit",
        name: "Gross Profit",
        required: true
      }, {
        key: "revenue_trends",
        name: "Revenue Trends",
        required: true
      }, {
        key: "total_assets",
        name: "Total Assets",
        required: true
      }, {
        key: "shareholder_equity",
        name: "Shareholder Equity",
        required: true
      }, {
        key: "total_debt",
        name: "Total Debt",
        required: true
      }]
    },
    detailed: {
      name: "Detailed",
      metrics: [{
        key: "revenue",
        name: "Revenue",
        required: true
      }, {
        key: "cogs",
        name: "Cost Of Goods",
        required: true
      }, {
        key: "ebitda",
        name: "EBITDA",
        required: true
      }, {
        key: "net_income",
        name: "Net Income",
        required: true
      }, {
        key: "operating_income",
        name: "Operating Income",
        required: true
      }, {
        key: "operating_expenses",
        name: "Operating Expenses",
        required: true
      }, {
        key: "gross_profit",
        name: "Gross Profit",
        required: true
      }, {
        key: "revenue_trends",
        name: "Revenue Trends",
        required: true
      }, {
        key: "current_assets",
        name: "Current Assets",
        required: true
      }, {
        key: "current_liabilities",
        name: "Current Liabilities",
        required: true
      }, {
        key: "cash",
        name: "Cash",
        required: true
      }, {
        key: "inventory",
        name: "Inventory",
        required: true
      }, {
        key: "total_assets",
        name: "Total Assets",
        required: true
      }, {
        key: "shareholder_equity",
        name: "Shareholder Equity",
        required: true
      }, {
        key: "total_debt",
        name: "Total Debt",
        required: true
      }]
    }
  };
  const handleDownload = template => {
    const link = document.createElement('a');
    link.href = `/templates/${template.fileName}`;
    link.download = template.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload Excel (.xlsx, .xls) files only.');
      return;
    }
    if (onFileUploaded) {
      onFileUploaded(file, selectedTemplateType);
    }
    setSelectedTemplateType(null);
    onClose();
  };
  const triggerFileUpload = (templateType = null) => {
    setSelectedTemplateType(templateType);
    fileInputRef.current?.click();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 financial-templates-popup--s1">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto financial-templates-popup--s2">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 financial-templates-popup--s3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 financial-templates-popup--s4">
              {readOnly ? t("financial_data_templates") : t("financial_data_upload")}
            </h2>
            <p className="text-gray-600 text-sm mt-1 financial-templates-popup--s5">
              {readOnly ? t("download_sample_templates") : t("download_templates_upload_data")}
            </p>
          </div>
          <button onClick={onClose} onMouseEnter={e => e.target.style.color = '#4b5563'} onMouseLeave={e => e.target.style.color = '#9ca3af'} className="financial-templates-popup--s6">
            <X size={24} />
          </button>
        </div>

        {}
        {!readOnly && <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="financial-templates-popup--s7" />}

        <div className="financial-templates-popup--s8">
          {}
          <div className="financial-templates-popup--s9">
            <Accordion defaultActiveKey={null}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <div className="financial-templates-popup--s10">
              <Download size={20} />
                    <span className="financial-templates-popup--s11">
              {t("download_sample_templates")}
                    </span>
                  </div>
                </Accordion.Header>

                <Accordion.Body>
            <div className="financial-templates-popup--s12">
              {templates.map(template => <div key={template.id} onMouseEnter={e => e.target.style.borderColor = '#d1d5db'} onMouseLeave={e => e.target.style.borderColor = '#e5e7eb'} className="financial-templates-popup--s13">
                  <div className="financial-templates-popup--s14">
                    <span className="financial-templates-popup--s15">{template.icon}</span>
                    <div>
                      <div className="financial-templates-popup--s16">
                        <h4 className="financial-templates-popup--s17">
                          {template.name}
                        </h4>
                        {template.recommended && <span className="financial-templates-popup--s18">
                            Recommended
                          </span>}
                      </div>
                      <p className="financial-templates-popup--s19">
                        {template.description}
                      </p>
                    </div>
                  </div>

                    <button onClick={() => handleDownload(template)} onMouseEnter={e => e.target.style.backgroundColor = '#1d4ed8'} onMouseLeave={e => e.target.style.backgroundColor = '#2563eb'} className="financial-templates-popup--s20">
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>)}
                </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>

          {}
          <div className="financial-templates-popup--s9">
            <div className="financial-templates-popup--s21">
              <h3 className="financial-templates-popup--s22">
                📋 {t("all_template_comparison")}
              </h3>
              <button onClick={() => setShowComparison(!showComparison)} className="financial-templates-popup--s23">
                {showComparison ? <>
                    <span>Hide Comparison</span>
                    <ChevronUp size={16} />
                  </> : <>
                    <span>{t("view_comparison")}</span>
                    <ChevronDown size={16} />
                  </>}
              </button>
            </div>

            {showComparison && <div className="financial-templates-popup--s24">
                <table className="financial-templates-popup--s25">
                  <thead>
                    <tr className="financial-templates-popup--s26">
                      <th className="financial-templates-popup--s27">
                        Metric
                      </th>
                      <th className="financial-templates-popup--s28">
                        Simplified
                      </th>
                      <th className="financial-templates-popup--s28">
                        Standard
                      </th>
                      <th className="financial-templates-popup--s28">
                        Detailed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
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
                  const isMetricRequired = (metricKey, templateKey) => {
                    const template = TEMPLATE_METRICS[templateKey];
                    return template.metrics.some(m => m.key === metricKey && m.required);
                  };
                  return allMetrics.map((metric, index) => <tr key={metric.key} style={{
                    borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                          <td className="financial-templates-popup--s29">
                            {metric.name}
                          </td>
                          <td className="financial-templates-popup--s30">
                            {isMetricRequired(metric.key, 'simplified') ? <Check size={16} className="financial-templates-popup--s31" /> : <X size={16} className="financial-templates-popup--s32" />}
                          </td>
                          <td className="financial-templates-popup--s30">
                            {isMetricRequired(metric.key, 'standard') ? <Check size={16} className="financial-templates-popup--s31" /> : <X size={16} className="financial-templates-popup--s32" />}
                          </td>
                          <td className="financial-templates-popup--s30">
                            {isMetricRequired(metric.key, 'detailed') ? <Check size={16} className="financial-templates-popup--s31" /> : <X size={16} className="financial-templates-popup--s32" />}
                          </td>
                        </tr>);
                })()}
                  </tbody>
                </table>
              </div>}
          </div>

          {}
          {!readOnly && <>
              {}
              <div className="financial-templates-popup--s33">
                <div className="financial-templates-popup--s34">
                  <div className="financial-templates-popup--s35" />
                </div>
                <div className="financial-templates-popup--s36">
                  <span className="financial-templates-popup--s37">OR</span>
                </div>
              </div>

              {}
              <div>
                <h3 className="financial-templates-popup--s38">
                  <Upload size={20} />
                  {t("upload_any_template_file")}
                </h3>

                <div onMouseEnter={e => e.target.style.borderColor = '#9ca3af'} onMouseLeave={e => e.target.style.borderColor = '#d1d5db'} className="financial-templates-popup--s39">
                  <FileText size={48} className="financial-templates-popup--s40" />
                  <h4 className="financial-templates-popup--s41">
                    {t("auto_detect_template_type")}
                  </h4>
                  <p className="financial-templates-popup--s42">
                    {t("upload_any_template_auto_detect")}
                  </p>

                  <button onClick={() => triggerFileUpload()} disabled={isFileUploading} style={{
                cursor: isFileUploading ? 'not-allowed' : 'pointer',
                opacity: isFileUploading ? 0.5 : 1
              }} onMouseEnter={e => {
                if (!isFileUploading) e.target.style.backgroundColor = '#047857';
              }} onMouseLeave={e => {
                if (!isFileUploading) e.target.style.backgroundColor = '#059669';
              }} className="financial-templates-popup--s43">
                    {isFileUploading ? <>
                        <div className="financial-templates-popup--s44" />
                        <span>Processing...</span>
                      </> : <>
                        <Upload size={20} />
                        <span>{t("choose_file_to_upload")}</span>
                      </>}
                  </button>

                  <p className="financial-templates-popup--s45">
                    {t("supported_formats_excel_csv")}
                  </p>
                </div>
              </div>
            </>}

          {}
          <div className="financial-templates-popup--s46">
           <h4 className="financial-templates-popup--s47">
  {readOnly ? t("template_information") : t("how_it_works")}
          </h4>

          {readOnly ? <ul className="financial-templates-popup--s48">
    <li className="financial-templates-popup--s49">{t("templates_used_financial_analysis")}</li>
    <li className="financial-templates-popup--s49">{t("download_structure_format_requirements")}</li>
    <li className="financial-templates-popup--s49">{t("use_reference_future_uploads")}</li>
    <li>{t("contact_support_template_help")}</li>
  </ul> : <ol className="financial-templates-popup--s48">
    <li className="financial-templates-popup--s49">{t("download_template_that_fits")}</li>
    <li className="financial-templates-popup--s49">{t("fill_template_financial_data")}</li>
    <li className="financial-templates-popup--s49">{t("upload_this_exact_validation")}</li>
    <li>{t("get_ai_powered_insights")}</li>
  </ol>}
          </div>
        </div>
      </div>

      {}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>;
};
export default FinancialTemplatesPopup;
