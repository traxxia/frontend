import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import { detectLanguage, analysisPatterns } from '../utils/translations';

const PorterMatrix = ({ porterText }) => {
  const lang = detectLanguage(porterText);
  const t = analysisPatterns[lang]?.porter || analysisPatterns['en'].porter;
  
  const [forces, setForces] = useState({
    [t.forces.supplierPower]: { items: [], summary: '' },
    [t.forces.buyerPower]: { items: [], summary: '' },
    [t.forces.competitiveRivalry]: { items: [], summary: '' },
    [t.forces.threatOfSubstitution]: { items: [], summary: '' },
    [t.forces.threatOfNewEntry]: { items: [], summary: '' }
  });

  useEffect(() => {
    if (porterText) {
      const parsedData = parsePorterText(porterText, t, lang);
      setForces(parsedData);
    }
  }, [porterText, lang]);

  const parsePorterText = (text, t, language) => {
    const result = {
      [t.forces.supplierPower]: { items: [], summary: '' },
      [t.forces.buyerPower]: { items: [], summary: '' },
      [t.forces.competitiveRivalry]: { items: [], summary: '' },
      [t.forces.threatOfSubstitution]: { items: [], summary: '' },
      [t.forces.threatOfNewEntry]: { items: [], summary: '' }
    };

    // Spanish-specific patterns based on the actual response structure
    if (language === 'es') {
      // First try to find structured sections with headers
      const spanishPatterns = {
        'Poder de los Proveedores': /\*\*Poder del Proveedor:\*\*([\s\S]*?)(?=\*\*Poder del Comprador:|$)/i,
        'Poder de los Compradores': /\*\*Poder del Comprador:\*\*([\s\S]*?)(?=\*\*Rivalidad Competitiva:|$)/i,
        'Rivalidad Competitiva': /\*\*Rivalidad Competitiva:\*\*([\s\S]*?)(?=\*\*Amenaza de Sustitución:|$)/i,
        'Amenaza de Sustitución': /\*\*Amenaza de Sustitución:\*\*([\s\S]*?)(?=\*\*Amenaza de Nueva Entrada:|$)/i,
        'Amenaza de Nuevos Entrantes': /\*\*Amenaza de Nueva Entrada:\*\*([\s\S]*?)(?=\*\*Conclusión|$)/i
      };

      // Check if any structured patterns match
      let hasStructuredData = false;
      Object.values(spanishPatterns).forEach(pattern => {
        if (pattern.test(text)) hasStructuredData = true;
      });

      if (hasStructuredData) {
        // Use structured parsing (original logic)
        const forceMapping = {
          'Poder del Proveedor': t.forces.supplierPower,
          'Poder del Comprador': t.forces.buyerPower,
          'Rivalidad Competitiva': t.forces.competitiveRivalry,
          'Amenaza de Sustitución': t.forces.threatOfSubstitution,
          'Amenaza de Nueva Entrada': t.forces.threatOfNewEntry
        };

        Object.keys(spanishPatterns).forEach(spanishKey => {
          const pattern = spanishPatterns[spanishKey];
          const match = pattern.exec(text);
          
          if (match) {
            let content = match[1].trim();
            content = content.replace(/\*+\s*$/, '').trim();
            content = content.replace(/^\*+\s*/, '').trim();
            
            const conclusionIndex = content.toLowerCase().search(/conclusión|en resumen|para abordar/i);
            if (conclusionIndex > -1 && conclusionIndex < content.length - 15) {
              content = content.substring(0, conclusionIndex).trim();
            }
            
            const firstParagraphEnd = content.search(/\n\s*\n|\.(?=\s+[A-Z])/);
            const summary = firstParagraphEnd > -1 
              ? content.substring(0, firstParagraphEnd).trim() 
              : content.trim();
            
            let items = [];
            if (firstParagraphEnd > -1) {
              const restOfContent = content.substring(firstParagraphEnd).trim();
              items = restOfContent
                .split(/[.!?]\s+/)
                .map(sentence => sentence.trim())
                .filter(sentence => 
                  sentence.length > 20 && 
                  !sentence.toLowerCase().includes('conclusión') &&
                  !sentence.toLowerCase().includes('en resumen')
                )
                .slice(0, 3);
            }

            const mappedForceName = Object.keys(forceMapping).find(key => 
              spanishKey.includes(key.replace('del ', 'de los ').replace('de ', 'de '))
            );
            
            if (mappedForceName) {
              const forceKey = forceMapping[mappedForceName];
              result[forceKey] = { summary, items };
            }
          }
        });
      } else {
        // Fallback: Extract content from flowing paragraphs
        // Get the main analysis section (before Conclusión)
        const analysisMatch = /\*\*Análisis de las Cinco Fuerzas de Porter\*\*([\s\S]*?)(?=\*\*Conclusión|$)/i.exec(text);
        
        if (analysisMatch) {
          const analysisContent = analysisMatch[1];
          
          // Extract paragraphs that mention each force
          const forceKeywords = {
            [t.forces.supplierPower]: /poder del proveedor|proveedores|cadena de suministro/i,
            [t.forces.buyerPower]: /poder del comprador|compradores|clientes/i,
            [t.forces.competitiveRivalry]: /rivalidad competitiva|competidores|competencia/i,
            [t.forces.threatOfSubstitution]: /amenaza de sustitución|sustitutos|sustitución/i,
            [t.forces.threatOfNewEntry]: /amenaza de nueva entrada|nuevos entrantes|nueva entrada/i
          };

          // Split the analysis into paragraphs
          const paragraphs = analysisContent.split(/\n\s*\n/).filter(p => p.trim().length > 50);
          
          Object.keys(forceKeywords).forEach(forceKey => {
            const keyword = forceKeywords[forceKey];
            
            // Find paragraphs that mention this force
            const relevantParagraphs = paragraphs.filter(paragraph => keyword.test(paragraph));
            
            if (relevantParagraphs.length > 0) {
              // Use the first relevant paragraph as summary
              let summary = relevantParagraphs[0].trim();
              summary = summary.replace(/^\*+\s*/, '').replace(/\*+\s*$/, '');
              
              // Extract key points from the paragraph
              const sentences = summary.split(/[.!?]/).filter(s => s.trim().length > 10);
              const items = sentences.slice(1, 4).map(s => s.trim()).filter(s => s.length > 0);
              
              result[forceKey] = { 
                summary: sentences[0] + '.' || summary, 
                items: items 
              };
            }
          });
        }
      }

      return result;
    }

    // Original English parsing logic
    let cleanText = text;
    t.patterns.cleanupPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    Object.keys(result).forEach(force => {
      const pattern = new RegExp(
        `\\*\\*\\s*${force}\\s*:\\*\\*([\\s\\S]*?)(?=\\*\\*\\s*(?:${
          Object.keys(result).filter(f => f !== force).join('|')
        })\\s*:\\*\\*|\\*{2,}\\s*${t.conclusion}\\s*\\*{2,}|\\*\\*\\s*${t.conclusion}\\s*:\\s*\\*\\*|\\*\\*${t.conclusion}:\\*\\*|\\*\\*${t.recommendations}:\\*\\*|${t.conclusion}:|$)`,
        'i'
      );

      const match = pattern.exec(cleanText);
      
      if (match) {
        let content = match[1].trim();
        
        t.patterns.cleanupPatterns.forEach(pattern => {
          content = content.replace(pattern, '');
        });
        
        const conclusionIndex = content.toLowerCase().search(new RegExp(`\\*{0,}\\s*${t.conclusion.toLowerCase()}`, 'i'));
        if (conclusionIndex > -1 && conclusionIndex < content.length - 15) {
          content = content.substring(0, conclusionIndex).trim();
        }
        
        content = content.replace(/\*+\s*$/, '').trim();
        
        const firstParagraphEnd = content.indexOf('\n\n');
        const summary = firstParagraphEnd > -1 
          ? content.substring(0, firstParagraphEnd).trim() 
          : content.trim();
        
        let items = [];
        if (firstParagraphEnd > -1) {
          const restOfContent = content.substring(firstParagraphEnd).trim();
          items = restOfContent
            .split(/\n+/)
            .map(line => line.replace(/^[\s•\-\d.]+/, '').trim())
            .filter(item => item.length > 0 && 
                    !item.toLowerCase().includes(t.conclusion.toLowerCase()));
        }

        result[force] = { summary, items };
      }
    });

    return result;
  };

  const getConclusionText = () => {
    if (!porterText) return "";
    
    // Spanish-specific conclusion pattern
    if (lang === 'es') {
      // Try multiple Spanish conclusion patterns
      const spanishPatterns = [
        /\*\*Conclusión\*\*([\s\S]*?)(?=\*\*Recomendaciones\*\*|$)/i,
        /\*\*Conclusión y Recomendaciones\*\*([\s\S]*?)$/i,
        /En resumen,([\s\S]*?)(?=\*\*Recomendaciones\*\*|Se recomienda|$)/i,
        /En resumen([\s\S]*?)(?=\*\*Recomendaciones\*\*|Se recomienda|$)/i
      ];
      
      for (const pattern of spanishPatterns) {
        const match = pattern.exec(porterText);
        if (match) {
          let conclusion = match[1].trim();
          conclusion = conclusion.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
          // Stop at recommendations section if it appears
          const recIndex = conclusion.toLowerCase().search(/\*\*recomendaciones\*\*|se recomienda/i);
          if (recIndex > -1) {
            conclusion = conclusion.substring(0, recIndex).trim();
          }
          return conclusion.trim();
        }
      }
    }
    
    // Original conclusion patterns
    for (const pattern of t.patterns.conclusion) {
      const match = pattern.exec(porterText);
      if (match) {
        let conclusion = match[1] || match[0];
        conclusion = conclusion.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
        return conclusion.trim();
      }
    }
    return "";
  };

  const getActionableRecommendations = () => {
    if (!porterText) return "";
    
    // For Spanish, look for separate recommendations section
    if (lang === 'es') {
      const spanishRecommendationPatterns = [
        /\*\*Recomendaciones\*\*([\s\S]*?)$/i,
        /Se recomienda:([\s\S]*?)$/i,
        /Recomendaciones:([\s\S]*?)$/i
      ];
      
      for (const pattern of spanishRecommendationPatterns) {
        const match = pattern.exec(porterText);
        if (match) {
          let recommendations = match[1].trim();
          recommendations = recommendations.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
          return recommendations.trim();
        }
      }
      
      // Fallback: look for recommendations in conclusion
      const conclusionText = getConclusionText();
      const recommendationsStart = conclusionText.search(/se recomienda|recomendaciones|pasos:|siguientes pasos/i);
      if (recommendationsStart > -1) {
        return conclusionText.substring(recommendationsStart).trim();
      }
      return "";
    }
    
    const match = t.patterns.recommendations.exec(porterText);
    return match ? match[1].trim() : "";
  };

  return (
    <div className="porter-container">
      <h4 className="text-center mb-4"><strong>{t.title}</strong></h4>

      <div className="porter-forces">
        <div className="force top">
          <p className='top-center'>{t.forces.threatOfNewEntry}</p> 
          <span>{String(forces[t.forces.threatOfNewEntry]?.summary || '')}</span>
          {forces[t.forces.threatOfNewEntry]?.items && forces[t.forces.threatOfNewEntry].items.map((item, i) => (
            <div key={`entry-${i}`} className="analysis-box">{String(item)}</div>
          ))}
        </div>

        <div className="force left">
          <p className='top-center'>{t.forces.supplierPower}</p> 
          <span>{String(forces[t.forces.supplierPower]?.summary || '')}</span>
          {forces[t.forces.supplierPower]?.items && forces[t.forces.supplierPower].items.map((item, i) => (
            <div key={`supplier-${i}`} className="analysis-box">{String(item)}</div>
          ))}
        </div>

        <div className="force center"> 
          <p className='top-center'>{t.forces.competitiveRivalry}</p> 
          <span>{String(forces[t.forces.competitiveRivalry]?.summary || '')}</span>
          {forces[t.forces.competitiveRivalry]?.items && forces[t.forces.competitiveRivalry].items.map((item, i) => (
            <div key={`rivalry-${i}`} className="analysis-box">{String(item)}</div>
          ))}
        </div>

        <div className="force right"> 
          <p className='top-center'>{t.forces.buyerPower}</p> 
          <span>{String(forces[t.forces.buyerPower]?.summary || '')}</span>
          {forces[t.forces.buyerPower]?.items && forces[t.forces.buyerPower].items.map((item, i) => (
            <div key={`buyer-${i}`} className="analysis-box">{String(item)}</div>
          ))}
        </div>

        <div className="force bottom"> 
          <p className='top-center'>{t.forces.threatOfSubstitution}</p>           
          <span>{String(forces[t.forces.threatOfSubstitution]?.summary || '')}</span>
          {forces[t.forces.threatOfSubstitution]?.items && forces[t.forces.threatOfSubstitution].items.map((item, i) => (
            <div key={`sub-${i}`} className="analysis-box">{String(item)}</div>
          ))}
        </div>
      </div>

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

export default PorterMatrix;