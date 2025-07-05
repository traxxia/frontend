// AnalysisRenderer.jsx - Final Fixed Version
import React, { useEffect, useState } from 'react';
import SwotAnalysis from './SwotAnalysis';
import PorterMatrix from './PorterMatrix';
import BCGMatrix from './BCGMatrix';
import ValueChainMatrix from './ValueChainMatrix';
import StrategicAcronym from './StrategicAcronym';

const AnalysisRenderer = ({
  selectedAnalysisType,
  analysisItem,
  analysisResult,
  isLoading,
  t // Translation function passed from parent (only used for UI elements)
}) => {
  const [translations, setTranslations] = useState({});

  // Safe translation function for UI elements only
  const translate = (key) => {
    try {
      if (t && typeof t === 'function') {
        const result = t(key);
        return typeof result === 'string' ? result : String(result);
      }
      if (window.getTranslation && typeof window.getTranslation === 'function') {
        const result = window.getTranslation(key);
        return typeof result === 'string' ? result : String(result);
      }
      const result = translations[key] || key;
      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return String(key);
    }
  };

  // Update translations when language changes
  useEffect(() => {
    if (!t) {
      const updateTranslations = () => {
        try {
          const currentLang = window.currentAppLanguage || 'en';
          const currentTranslations = window.appTranslations?.[currentLang] || {};
          setTranslations(currentTranslations);
        } catch (error) {
          console.error('Error updating translations:', error);
          setTranslations({});
        }
      };

      updateTranslations();
      window.addEventListener('languageChanged', updateTranslations);

      return () => {
        window.removeEventListener('languageChanged', updateTranslations);
      };
    }
  }, [t]);

  // Safe analysis display name function
  const getAnalysisDisplayName = (analysisType) => {
    try {
      const names = {
        swot: 'SWOT',
        porter: "Porter's Five Forces",
        bcg: 'BCG Matrix',
        valuechain: 'Value Chain',
        strategic: 'STRATEGIC'
      };
      return names[analysisType] || String(analysisType);
    } catch (error) {
      console.error('Error getting analysis display name:', error);
      return String(analysisType);
    }
  };

  if (!selectedAnalysisType) {
    return (
      <div className="analysis-content-workspace">
        <div className="analysis-content-header centered">
          <h4>{translate('select_analysis_type') || 'Select an Analysis Type'}</h4>
          <p>{translate('choose_analysis_instruction') || 'Choose from the options above to begin your analysis'}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    const analysisDisplayName = getAnalysisDisplayName(selectedAnalysisType);
    
    return (
      <div className="analysis-loading">
        <div className="quantum-loader-container mb-3">
          <div className="quantum-loader">
            <div className="quantum-dot"></div>
            <div className="quantum-dot"></div>
            <div className="quantum-dot"></div>
            <div className="quantum-dot"></div>
            <div className="quantum-dot"></div>
          </div>
          <p>
            {translate('generating_analysis_text') || 'Generating'} {String(analysisDisplayName)} {translate('analysis_text') || 'analysis'}...
          </p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    const analysisDisplayName = getAnalysisDisplayName(selectedAnalysisType);
    
    return (
      <div className="analysis-content-workspace">
        <div className="analysis-content-header centered">
          <h4>{translate('no_analysis_data') || 'No Analysis Data'}</h4>
          <p>
            {translate('no_analysis_available') || 'No analysis data available for'} {String(analysisDisplayName)}
          </p>
        </div>
      </div>
    );
  }

  const renderAnalysisComponent = () => {
    try {
      console.log('Rendering analysis component for type:', selectedAnalysisType);
      
      switch (selectedAnalysisType) {
        case 'swot':
          console.log('Rendering SwotAnalysis');
          // DON'T pass t prop - component handles translations internally
          return <SwotAnalysis analysisResult={analysisResult} />;
          
        case 'porter':
          console.log('Rendering PorterMatrix');
          // DON'T pass t prop - component handles translations internally
          return <PorterMatrix porterText={analysisResult} />;
          
        case 'bcg':
          console.log('Rendering BCGMatrix');
          // DON'T pass t prop - component handles translations internally
          return <BCGMatrix analysisResult={analysisResult} />;
          
        case 'valuechain':
          console.log('Rendering ValueChainMatrix');
          // DON'T pass t prop - component handles translations internally
          return <ValueChainMatrix analysisResult={analysisResult} />;
          
        case 'strategic':
          console.log('Rendering StrategicAcronym');
          // DON'T pass t prop - component handles translations internally
          return <StrategicAcronym analysisResult={analysisResult} />;
          
        default:
          console.log('Rendering default analysis view');
          const analysisDisplayName = getAnalysisDisplayName(selectedAnalysisType);
          
          return (
            <div className="analysis-content-workspace">
              <div className="analysis-content-header">
                <div className="analysis-content-icon">
                  {analysisItem?.icon}
                </div>
                <div>
                  <h2>{String(analysisDisplayName)} {translate('analysis_text') || 'analysis'}</h2>
                  <p className="analysis-content-subtitle">
                    {String(analysisDisplayName)} {translate('analysis_results_text') || 'analysis results'}
                  </p>
                </div>
              </div>
              <div className="analysis-content-body">
                <div
                  className="analysis-result-content"
                  dangerouslySetInnerHTML={{ 
                    __html: String(analysisResult || '').replace(/\n/g, '<br/>') 
                  }}
                />
              </div>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering analysis component:', error);
      return (
        <div className="analysis-content-workspace">
          <div className="analysis-content-header centered">
            <h4>Error Rendering Analysis</h4>
            <p>An error occurred while rendering the {selectedAnalysisType} analysis.</p>
            <details>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '12px', color: 'red' }}>
                {error.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }
  };

  return renderAnalysisComponent();
};

export default AnalysisRenderer;