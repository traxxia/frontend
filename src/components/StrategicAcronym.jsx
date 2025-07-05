// StrategicAcronym.jsx - Updated Version with H5 Header Support
import React from 'react';
import { detectLanguage } from '../utils/translations';

const StrategicAcronym = ({ analysisResult }) => {
  const lang = detectLanguage(analysisResult);
  
  // Hard-coded safe translations - no object dependencies
  const getTranslation = (key) => {
    const translations = {
      en: {
        title: 'STRATEGIC Analysis',
        conclusion: 'Conclusion',
        noData: 'No data available for',
        keyActions: 'Key actions:',
        theory: 'Theory:',
        example: 'Example:',
        recommendations: 'Specific Recommendations'
      },
      es: {
        title: 'Análisis ESTRATÉGICO',
        conclusion: 'Conclusión',
        noData: 'Sin datos disponibles para',
        keyActions: 'Acciones clave:',
        theory: 'Teoría:',
        example: 'Ejemplo:',
        recommendations: 'Recomendaciones Específicas'
      }
    };
    
    const langTranslations = translations[lang] || translations['en'];
    return langTranslations[key] || key;
  };
  
  const strategicItems = extractStrategicItemsWithH5(analysisResult, lang);
  const conclusion = getStrategicConclusion(analysisResult, lang);
  const recommendations = getRecommendations(analysisResult, lang);
  
  // Debug logging
  console.log('Strategic Analysis Result:', analysisResult);
  console.log('Extracted Strategic Items:', strategicItems);
  console.log('Language detected:', lang);
  
  if (!strategicItems || strategicItems.length === 0 || strategicItems.every(item => item === null)) {
    return (
      <div className="alert alert-info">
        <p><strong>Debug Information:</strong></p>
        <p>No STRATEGIC items found in the analysis result.</p>
        <p>Language detected: {lang}</p>
        <details>
          <summary>Raw Analysis Text (first 1000 chars)</summary>
          <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {analysisResult ? String(analysisResult).substring(0, 1000) + '...' : 'No content'}
          </pre>
        </details>
      </div>
    );
  }

  const acronymLetters = lang === 'es' ? 
    ['S', 'T', 'R', 'A', 'T', 'E', 'G', 'I', 'C'] : 
    ['S', 'T', 'R', 'A', 'T', 'E', 'G', 'I', 'C'];

  return (
    <>
      <h5 className="mt-4 mb-3">
        <strong>{getTranslation('title')}</strong>
      </h5>
      <div className="table-responsive mb-4">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th width="10%" className="text-center">Letter</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {acronymLetters.map((letter, index) => {
              const item = strategicItems[index];
              const styleClass = STRATEGIC_COLUMN_STYLES[index] || 'neutral-bg';
              
              return (
                <tr key={`${letter}-${index}`}>
                  <td className="text-center align-middle">
                    <strong>{String(letter)}</strong>
                  </td>
                  <td className="p-2">
                    {item ? (
                      <div className={`strategic-item ${styleClass}`}>
                        {/* Display the H5 header if available */}
                        {item.header && (
                          <div>
                            <h5 className="strategic-header" style={{ 
                              color: '#2c3e50',  
                              paddingBottom: '8px',
                              marginBottom: '1px'
                            }}>
                              {item.header}
                            </h5>
                          </div>
                        )}
                        
                        {/* Display theory if available */}
                        {item.theory && (
                          <div className="mb-2">
                            <strong>{getTranslation('theory')}</strong> {String(item.theory)}
                          </div>
                        )}
                        
                        {/* Display example if available */}
                        {item.example && (
                          <div className="mb-2">
                            <strong>{getTranslation('example')}</strong> {String(item.example)}
                          </div>
                        )}
                        
                        {/* Display recommendation if available */}
                        {item.recommendation && (
                          <div className="mb-2">
                            <strong>{lang === 'es' ? 'Recomendación:' : 'Recommendation:'}</strong> {String(item.recommendation)}
                          </div>
                        )}
                        
                        {/* Display main content */}
                        {item.content && (
                          <div className="mb-2">
                            <div dangerouslySetInnerHTML={{ 
                              __html: String(item.content).replace(/\n/g, "<br/>") 
                            }} />
                          </div>
                        )}
                        
                        {/* Display bullet points if available */}
                        {item.bulletPoints && Array.isArray(item.bulletPoints) && item.bulletPoints.length > 0 && (
                          <div className="mt-2">
                            <strong>{getTranslation('keyActions')}</strong>
                            <ul className="mb-0 mt-1">
                              {item.bulletPoints.map((bullet, bulletIndex) => (
                                <li key={bulletIndex} className="mb-1">{String(bullet)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted">
                        {getTranslation('noData')} {String(letter)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Display recommendations if available */}
      {recommendations && (
        <div className="mt-4 recommendations-section">
          <h5><strong>{getTranslation('recommendations')}</strong></h5>
          <div className="recommendations-text">
            <div dangerouslySetInnerHTML={{ 
              __html: String(recommendations).replace(/\n/g, "<br/>") 
            }} />
          </div>
        </div>
      )}
      
      {/* Display conclusion if available */}
      {conclusion && (
        <div className="mt-4 conclusion-section">
          <h5><strong>{getTranslation('conclusion')}</strong></h5>
          <div className="conclusion-text">
            <div dangerouslySetInnerHTML={{ 
              __html: String(conclusion).replace(/\n/g, "<br/>") 
            }} />
          </div>
        </div>
      )}
    </>
  );
};

// Updated helper function to extract strategic items with H5 header support
const extractStrategicItemsWithH5 = (strategicContent, lang) => {
  if (!strategicContent) return [];

  const acronymSequence = lang === 'es' ? 
    ['S', 'T', 'R', 'A', 'T', 'E', 'G', 'I', 'C'] : 
    ['S', 'T', 'R', 'A', 'T', 'E', 'G', 'I', 'C'];
    
  const parsedItems = [];

  // Extract H5 sections from the content
  const h5Pattern = /<h5>(.*?)<\/h5>([\s\S]*?)(?=<h5>|$)/gi;
  const h5Sections = [];
  let match;
  
  while ((match = h5Pattern.exec(strategicContent)) !== null) {
    h5Sections.push({
      header: match[1],
      content: match[2]
    });
  }

  console.log('Found H5 sections:', h5Sections);

  // For each letter in the acronym, find the corresponding H5 section
  acronymSequence.forEach((letter, index) => {
    let foundSection = null;
    
    // Look for a section that starts with this letter
    for (const section of h5Sections) {
      const headerText = section.header.toLowerCase();
      const letterLower = letter.toLowerCase();
      
      // Check if header starts with the letter we're looking for
      if (headerText.startsWith(letterLower + ' =') || 
          headerText.startsWith(letterLower + ':') ||
          headerText.startsWith(letterLower + ' -')) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      // Parse the content of this section
      const content = foundSection.content.trim();
      
      // Extract theory, example, and recommendation for both English and Spanish
      let theoryMatch, exampleMatch, recommendationMatch;
      
      if (lang === 'es') {
        // Spanish patterns
        theoryMatch = /\*\s*Teoría:(.*?)(?=\*\s*Ejemplo|\*\s*Recomendación|$)/is.exec(content);
        exampleMatch = /\*\s*Ejemplo:(.*?)(?=\*\s*Teoría|\*\s*Recomendación|$)/is.exec(content);
        recommendationMatch = /\*\s*Recomendación:(.*?)(?=\*\s*Teoría|\*\s*Ejemplo|$)/is.exec(content);
      } else {
        // English patterns
        theoryMatch = /\*\s*Theory:(.*?)(?=\*\s*Example|\*\s*Recommendation|$)/is.exec(content);
        exampleMatch = /\*\s*Example:(.*?)(?=\*\s*Theory|\*\s*Recommendation|$)/is.exec(content);
        recommendationMatch = /\*\s*Recommendation:(.*?)(?=\*\s*Theory|\*\s*Example|$)/is.exec(content);
      }
      
      const theory = theoryMatch ? theoryMatch[1].trim() : '';
      const example = exampleMatch ? exampleMatch[1].trim() : '';
      const recommendation = recommendationMatch ? recommendationMatch[1].trim() : '';
      
      // Remove the extracted parts from content
      let remainingContent = content;
      
      if (lang === 'es') {
        remainingContent = content
          .replace(/\*\s*Teoría:.*?(?=\*\s*Ejemplo|\*\s*Recomendación|$)/is, '')
          .replace(/\*\s*Ejemplo:.*?(?=\*\s*Teoría|\*\s*Recomendación|$)/is, '')
          .replace(/\*\s*Recomendación:.*?(?=\*\s*Teoría|\*\s*Ejemplo|$)/is, '')
          .trim();
      } else {
        remainingContent = content
          .replace(/\*\s*Theory:.*?(?=\*\s*Example|\*\s*Recommendation|$)/is, '')
          .replace(/\*\s*Example:.*?(?=\*\s*Theory|\*\s*Recommendation|$)/is, '')
          .replace(/\*\s*Recommendation:.*?(?=\*\s*Theory|\*\s*Example|$)/is, '')
          .trim();
      }
      
      parsedItems.push({
        acronym: letter,
        header: foundSection.header,
        theory: theory,
        example: example,
        recommendation: recommendation,
        content: remainingContent,
        bulletPoints: null
      });
    } else {
      // Fallback to the old method if no H5 section found
      const fallbackItem = extractLegacyFormat(strategicContent, letter, lang);
      parsedItems.push(fallbackItem);
    }
  });

  return parsedItems;
};

// Fallback function for legacy format extraction
const extractLegacyFormat = (strategicContent, letter, lang) => {
  const spanishMapping = {
    'E': 'Estrategia',      
    'S': 'Situación',       
    'T': 'Tácticas',        
    'R': 'Recursos',        
    'A': 'Análisis',        
    'É': 'Ejecución',       
    'G': 'Gobernanza',      
    'I': 'Innovación',      
    'C': 'Cultura',         
    'O': 'Organización'     
  };

  const englishMapping = {
    'S': 'Strategy',
    'T': 'Tactics',
    'R': 'Resources',
    'A': 'Analysis',
    'E': 'Execution',
    'G': 'Governance',
    'I': 'Innovation',
    'C': 'Culture'
  };

  const searchTerm = lang === 'es' ? spanishMapping[letter] : englishMapping[letter];
  
  if (!searchTerm) return null;
  
  // Try to find the content using various patterns
  const patterns = [
    new RegExp(`\\*\\*${letter}\\s*=\\s*${searchTerm}[^*]*?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]\\s*=|$)`, 'i'),
    new RegExp(`${letter}\\s*=\\s*${searchTerm}[:\n]([\\s\\S]*?)(?=[A-Z]\\s*=|$)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(strategicContent);
    if (match) {
      return {
        acronym: letter,
        header: `${letter} = ${searchTerm}`,
        content: match[1].trim(),
        theory: '',
        example: '',
        recommendation: '',
        bulletPoints: null
      };
    }
  }
  
  return null;
};

// Helper function to get conclusion from strategic analysis
const getStrategicConclusion = (strategicContent, lang) => {
  if (!strategicContent) return "";
  
  const conclusionPatterns = [
    // Spanish patterns
    /\*\*Conclusión\*\*\s*([\s\S]*?)$/i,
    /En resumen[,:]\s*([\s\S]*?)$/i,
    /Conclusión\s*([\s\S]*?)$/i,
    // English patterns
    /\*\*Conclusion\*\*\s*([\s\S]*?)$/i,
    /In conclusion[,:]\s*([\s\S]*?)$/i,
    /Conclusion\s*([\s\S]*?)$/i
  ];
  
  for (const pattern of conclusionPatterns) {
    const match = pattern.exec(strategicContent);
    if (match) {
      let conclusion = String(match[1] || '').trim();
      conclusion = conclusion.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
      
      // Remove recommendations section if it's included
      conclusion = conclusion.replace(/\*\*Recomendaciones[\s\S]*$/i, '');
      conclusion = conclusion.replace(/\*\*Recommendations[\s\S]*$/i, '');
      
      if (conclusion.length > 20) {
        return conclusion.trim();
      }
    }
  }
  
  return "";
};

// Helper function to get recommendations
const getRecommendations = (strategicContent, lang) => {
  if (!strategicContent) return "";
  
  const recommendationPatterns = [
    // Spanish patterns
    /\*\*Recomendaciones específicas\*\*\s*([\s\S]*?)(?=\*\*Conclusión|$)/i,
    /Recomendaciones específicas[:\s]*([\s\S]*?)(?=\*\*Conclusión|$)/i,
    // English patterns
    /\*\*Specific Recommendations\*\*\s*([\s\S]*?)(?=\*\*Conclusion|$)/i,
    /Specific Recommendations[:\s]*([\s\S]*?)(?=\*\*Conclusion|$)/i
  ];
  
  for (const pattern of recommendationPatterns) {
    const match = pattern.exec(strategicContent);
    if (match) {
      let recommendations = String(match[1] || '').trim();
      recommendations = recommendations.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
      
      if (recommendations.length > 20) {
        return recommendations.trim();
      }
    }
  }
  
  return "";
};

// Define the style classes for STRATEGIC table columns
const STRATEGIC_COLUMN_STYLES = [
  'political-bg',      // E - red
  'economic-bg',       // S - blue
  'social-bg',         // T - purple
  'technological-bg',  // R - orange
  'legal-bg',          // A - green
  'environmental-bg',  // T - yellow
  'strengths-bg',      // É - red
  'weaknesses-bg',     // G - blue
  'opportunities-bg',  // I - purple
  'threats-bg',        // C - gray
  'neutral-bg'         // O - light gray
];

export default StrategicAcronym;