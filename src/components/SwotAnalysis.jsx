import React from 'react';
import '../styles/dashboard.css';
import { detectLanguage, analysisPatterns } from '../utils/translations';

const SwotAnalysis = ({ analysisResult }) => {
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

  return (
    <>
      <h4 className="text-center"><strong>{t.title}</strong></h4>
      
      {introText && <div className="mb-3 intro-text">{introText}</div>}
      
      {labels.length > 0 && (
        <>
          <br/>
          <div className="table-responsive mb-4">
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
    </>
  );
};

// Helper functions (same as before)
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