import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import '../styles/dashboard.css';
import { detectLanguage, analysisPatterns } from '../utils/translations';
import { exportAnalysisToPDF } from '../utils/pdfExport';

const SwotAnalysis = ({ analysisResult, businessName = 'Your Business' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  const lang = detectLanguage(analysisResult);
  const t = analysisPatterns[lang]?.swot || analysisPatterns['en'].swot;

  const introRegex = new RegExp(`^(.*?)(?=\\*\\*\\s*${t.title.replace('SWOT Analysis', 'SWOT Analysis|Análisis FODA')})`, 's');
  const introMatch = introRegex.exec(analysisResult);
  const introText = introMatch ? introMatch[1].trim() : "";

  const swotMatch = t.patterns.analysisHeader.exec(analysisResult);
  const swotContent = swotMatch ? swotMatch[1].trim() : "";

  const conclusionMatch = t.patterns.conclusion.exec(analysisResult);
  const conclusionText = conclusionMatch ? conclusionMatch[0] : "";

  const swotData = extractAnalysisSections(swotContent, t.patterns.sections);
  const labels = Object.keys(swotData);

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      showToastMessage('Generating PDF report...', 'info');
      
      await exportAnalysisToPDF(businessName);
      showToastMessage('📄 SWOT Analysis PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToastMessage('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`} style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 16px',
          borderRadius: '6px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: showToast.type === 'success' ? '#28a745' : 
                          showToast.type === 'error' ? '#dc3545' : 
                          showToast.type === 'warning' ? '#ffc107' : '#007bff'
        }}>
          {showToast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 className="text-center" style={{ margin: 0 }}>
          <strong>{t.title}</strong>
        </h4>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="download-pdf-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.target.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.target.style.backgroundColor = '#007bff';
            }
          }}
        >
          {isExporting ? (
            <>
              <Loader size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* PDF Content Container - This will be captured for PDF export */}
      <div id="analysis-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
        {introText && <div className="mb-3 intro-text">{introText}</div>}

        {labels.length > 0 && (
          <>
            <br/>
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    {labels.map(label => <th key={label}>{String(label)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {labels.map(label => (
                      <td key={label}>
                        {renderAnalysisBoxes(swotData[label], label, 'swot')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {conclusionText && (
          <div className="mt-4 conclusion-section">
            <h5><strong>{t.conclusion}</strong></h5>
            <div className="conclusion-text">
              <div dangerouslySetInnerHTML={{
                __html: String(conclusionText).replace(/\n/g, "<br/>")
              }} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .simple-toast {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// Helper functions
const extractAnalysisSections = (analysisBlock, sectionPattern) => {
  if (!sectionPattern || !analysisBlock) return {};

  const analysisData = {};
  let m;
  sectionPattern.lastIndex = 0;

  while ((m = sectionPattern.exec(analysisBlock)) !== null) {
    const key = String(m[1] || '').trim();
    const value = String(m[2] || '')
      .split(/\n(?=\*\*|\d+\.\s)/)[0]
      .trim()
      .replace(/\n/g, "<br/>");

    if (key) {
      analysisData[key] = value;
    }

    if (!sectionPattern.global) break;
  }

  return analysisData;
};

const renderAnalysisBoxes = (content, label) => {
  if (!content) return null;

  const normalizedLabel = String(label).toLowerCase().replace(/\s+/g, '-');
  const bgClass = `${normalizedLabel}-bg`;

  return String(content)
    .split(/<br\s*\/?>\s*(?=<br\s*\/?>|[^<])/i)
    .map((para) => String(para).trim())
    .filter((para) =>
      para !== "" &&
      para !== "*" &&
      para !== "<br/>*" &&
      para !== "<br />*" &&
      !/^\*+$/.test(para)
    )
    .map((para, idx) => {
      return (
        <div
          key={idx}
          className={`analysis-box ${bgClass}`}
          dangerouslySetInnerHTML={{ __html: para }}
        />
      );
    });
};

export default SwotAnalysis;