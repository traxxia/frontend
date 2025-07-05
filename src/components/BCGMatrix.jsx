import React, { useMemo } from 'react';
import '../styles/dashboard.css';
import { detectLanguage, analysisPatterns } from '../utils/translations';

const BCGMatrix = ({ analysisResult }) => {
  const lang = detectLanguage(analysisResult);
  const t = analysisPatterns[lang]?.bcg || analysisPatterns['en'].bcg;
  
  const matrixData = useMemo(() => {
    if (!analysisResult) return {
      [t.quadrants.agileLeaders]: [],
      [t.quadrants.establishedPerformers]: [],
      [t.quadrants.emergingInnovators]: [],
      [t.quadrants.strategicDrifters]: []
    };

    const quadrantLabels = [
      t.quadrants.agileLeaders,
      t.quadrants.establishedPerformers,
      t.quadrants.emergingInnovators,
      t.quadrants.strategicDrifters
    ];

    let cleanText = analysisResult;
    
    // Remove conclusion and recommendations sections first to avoid interference
    const conclusionPatterns = [
      /\*{2,}\s*Conclusión\s*y\s*Recomendaciones\s*\*{2,}[\s\S]*$/i,
      /\*{2,}\s*Conclusión\s*\*{2,}[\s\S]*$/i,
      /\*\*\s*Conclusión\s*:\s*\*\*[\s\S]*$/i,
      /\*\*Conclusión:\*\*[\s\S]*$/i,
      /En resumen[\s\S]*$/i,
      /\*{2,}\s*Conclusion\s*and\s*Recommendations\s*\*{2,}[\s\S]*$/i,
      /\*{2,}\s*Conclusion\s*\*{2,}[\s\S]*$/i,
      /\*\*\s*Conclusion\s*:\s*\*\*[\s\S]*$/i,
      /\*\*Conclusion:\*\*[\s\S]*$/i,
      /In summary[\s\S]*$/i
    ];

    conclusionPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });

    const extractedData = {};

    quadrantLabels.forEach(label => {
      // Create more flexible patterns to capture content
      const patterns = [
        // Pattern 1: **Label (description):** content
        new RegExp(`\\*\\*\\s*${escapeRegex(label)}\\s*(?:\\([^)]*\\))?\\s*:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*\\s*(?:${quadrantLabels.map(escapeRegex).join('|')})\\s*(?:\\([^)]*\\))?\\s*:|$)`, 'i'),
        
        // Pattern 2: **Label:** content
        new RegExp(`\\*\\*\\s*${escapeRegex(label)}\\s*:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*\\s*(?:${quadrantLabels.map(escapeRegex).join('|')})\\s*:|$)`, 'i'),
        
        // Pattern 3: Label (description): content (without ** markers)
        new RegExp(`${escapeRegex(label)}\\s*(?:\\([^)]*\\))?\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${quadrantLabels.map(escapeRegex).join('|')})\\s*(?:\\([^)]*\\))?\\s*:|$)`, 'i'),
        
        // Pattern 4: Simple label: content
        new RegExp(`${escapeRegex(label)}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${quadrantLabels.map(escapeRegex).join('|')})\\s*:|$)`, 'i')
      ];

      let content = '';
      let matched = false;

      // Try each pattern until we find a match
      for (const pattern of patterns) {
        const match = pattern.exec(cleanText);
        if (match && match[1]) {
          content = match[1].trim();
          matched = true;
          break;
        }
      }

      if (matched && content) {
        // Clean up the extracted content
        content = content
          .replace(/^\*+\s*/, '') // Remove leading asterisks
          .replace(/\s*\*+$/, '') // Remove trailing asterisks
          .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
          .trim();

        // Split content into meaningful segments
        const segments = content
          .split(/\n+/)
          .map(segment => segment.trim())
          .filter(segment => 
            segment.length > 10 && // Minimum meaningful length
            !segment.match(/^\*+$/) && // Not just asterisks
            !segment.toLowerCase().includes('conclusión') &&
            !segment.toLowerCase().includes('conclusion') &&
            !segment.toLowerCase().includes('recomendaciones') &&
            !segment.toLowerCase().includes('recommendations')
          );

        // If we have segments, use them; otherwise use the full content
        extractedData[label] = segments.length > 0 ? segments : [content];
      } else {
        // Fallback: try to find any mention of the quadrant name
        const fallbackPattern = new RegExp(`${escapeRegex(label)}[\\s\\S]{0,500}?([\\s\\S]{50,}?)(?=(?:${quadrantLabels.map(escapeRegex).join('|')})|$)`, 'i');
        const fallbackMatch = fallbackPattern.exec(cleanText);
        
        if (fallbackMatch && fallbackMatch[1]) {
          const fallbackContent = fallbackMatch[1].trim();
          if (fallbackContent.length > 20) {
            extractedData[label] = [fallbackContent];
          } else {
            extractedData[label] = [];
          }
        } else {
          extractedData[label] = [];
        }
      }
    });

    return extractedData;
  }, [analysisResult, lang, t]);

  // Helper function to escape special regex characters
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const getConclusionText = () => {
    if (!analysisResult) return "";

    const patterns = [
      /\*{2,}\s*Conclusión\s*y\s*Recomendaciones\s*\*{2,}\s*([\s\S]*?)$/i,
      /\*{2,}\s*Conclusión\s*\*{2,}\s*([\s\S]*?)(?=\*\*.*?Recomendaciones|$)/i,
      /\*\*\s*Conclusión\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*.*?Recomendaciones|$)/i,
      /\*\*Conclusión:\*\*\s*([\s\S]*?)(?=\*\*.*?Recomendaciones|$)/i,
      /En resumen[,:]\s*([\s\S]*?)(?=Algunas recomendaciones|$)/i,
      /\*{2,}\s*Conclusion\s*and\s*Recommendations\s*\*{2,}\s*([\s\S]*?)$/i,
      /\*{2,}\s*Conclusion\s*\*{2,}\s*([\s\S]*?)(?=\*\*.*?Recommendations|$)/i,
      /\*\*\s*Conclusion\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*.*?Recommendations|$)/i,
      /\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*.*?Recommendations|$)/i,
      /In summary[,:]\s*([\s\S]*?)(?=Some recommendations|$)/i
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(analysisResult);
      if (match && match[1]) {
        let conclusion = match[1].trim();
        conclusion = conclusion
          .replace(/^\*+\s*/, '')
          .replace(/\s*\*+$/, '')
          .replace(/Algunas recomendaciones[\s\S]*$/i, '')
          .replace(/Some recommendations[\s\S]*$/i, '');
        
        if (conclusion.length > 20) {
          return conclusion.trim();
        }
      }
    }
    return "";
  };

  const getActionableRecommendations = () => {
    if (!analysisResult) return "";
    
    const patterns = [
      /Algunas recomendaciones específicas para la empresa son:\s*([\s\S]*?)$/i,
      /\*\*Recomendaciones Accionables:\*\*\s*([\s\S]*?)$/i,
      /Recomendaciones:\s*([\s\S]*?)$/i,
      /Some specific recommendations[\s\S]*?:\s*([\s\S]*?)$/i,
      /\*\*Actionable Recommendations:\*\*\s*([\s\S]*?)$/i,
      /Recommendations:\s*([\s\S]*?)$/i
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(analysisResult);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  };

  return (
    <div className="bcg-matrix-container">
      <h4 className="text-center"><strong>{t.title}</strong></h4> 
      <div className="bcg-matrix-template">
        <div className="bcg-matrix-header">
          <div className="matrix-label-y">{t.high}</div>
          <div className="matrix-label-center">{t.marketGrowthRate}</div>
          <div className="matrix-label-y">{t.low}</div>
        </div>

        <div className="bcg-matrix-grid">
          <div className="bcg-box stars-bg">
            <h6>{t.quadrants.agileLeaders}</h6>
            <p className="matrix-description">{t.descriptions.agileLeaders}</p>
            {matrixData[t.quadrants.agileLeaders] && matrixData[t.quadrants.agileLeaders].map((item, i) => (
              <div key={`agile-${i}`} className="analysis-box">
                <div dangerouslySetInnerHTML={{ 
                  __html: String(item).replace(/\n/g, "<br/>") 
                }} />
              </div>
            ))}
            {(!matrixData[t.quadrants.agileLeaders] || matrixData[t.quadrants.agileLeaders].length === 0) && (
              <div className="analysis-box">
                <em>No se proporcionaron datos suficientes para identificar unidades de negocio específicas en este cuadrante.</em>
              </div>
            )}
          </div>

          <div className="bcg-box question-marks-bg">
            <h6>{t.quadrants.emergingInnovators}</h6>
            <p className="matrix-description">{t.descriptions.emergingInnovators}</p>
            {matrixData[t.quadrants.emergingInnovators] && matrixData[t.quadrants.emergingInnovators].map((item, i) => (
              <div key={`emerging-${i}`} className="analysis-box">
                <div dangerouslySetInnerHTML={{ 
                  __html: String(item).replace(/\n/g, "<br/>") 
                }} />
              </div>
            ))}
          </div>

          <div className="bcg-box cash-cows-bg">
            <h6>{t.quadrants.establishedPerformers}</h6>
            <p className="matrix-description">{t.descriptions.establishedPerformers}</p>
            {matrixData[t.quadrants.establishedPerformers] && matrixData[t.quadrants.establishedPerformers].map((item, i) => (
              <div key={`established-${i}`} className="analysis-box">
                <div dangerouslySetInnerHTML={{ 
                  __html: String(item).replace(/\n/g, "<br/>") 
                }} />
              </div>
            ))}
          </div>

          <div className="bcg-box dogs-bg">
            <h6>{t.quadrants.strategicDrifters}</h6>
            <p className="matrix-description">{t.descriptions.strategicDrifters}</p>
            {matrixData[t.quadrants.strategicDrifters] && matrixData[t.quadrants.strategicDrifters].map((item, i) => (
              <div key={`drifters-${i}`} className="analysis-box">
                <div dangerouslySetInnerHTML={{ 
                  __html: String(item).replace(/\n/g, "<br/>") 
                }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bcg-matrix-footer">
          <div className="matrix-label-x">{t.high}</div>
          <div className="matrix-label-center">{t.relativeMarketShare}</div>
          <div className="matrix-label-x">{t.low}</div>
        </div>
      </div><br/>

      {getConclusionText() && (
        <div className="mt-4 conclusion-section">
          <h5><strong>{t.conclusion}</strong></h5>
          <div className="conclusion-text">
            <div dangerouslySetInnerHTML={{ 
              __html: String(getConclusionText()).replace(/\n/g, "<br/>") 
            }} />
          </div>
        </div>
      )}

      {getActionableRecommendations() && (
        <div className="mt-4 recommendations-section">
          <h5><strong>{t.recommendations}</strong></h5>
          <div className="recommendations-text">
            <div dangerouslySetInnerHTML={{ 
              __html: String(getActionableRecommendations()).replace(/\n/g, "<br/>") 
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BCGMatrix;