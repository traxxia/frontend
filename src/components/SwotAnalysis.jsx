import React from 'react';
import RegenerateButton from './RegenerateButton';
import '../styles/dashboard.css';
import { Heart, TrendingUp, Users, Calendar, Loader, Target, Award, BarChart3 } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const SwotAnalysis = ({ 
  analysisResult, 
  businessName, 
  onRegenerate, 
  isRegenerating = false,
  canRegenerate = true 
}) => {
  // Parse the analysis result
  let swotData = null;
  let errorMessage = '';

  try {
    if (typeof analysisResult === 'string') {
      // Parse JSON string from API
      swotData = JSON.parse(analysisResult);
    } else if (typeof analysisResult === 'object') {
      // Already an object
      swotData = analysisResult;
    }

    console.log('Parsed SWOT data:', swotData);
  } catch (error) {
    console.error('Error parsing analysis result:', error);
    errorMessage = 'Failed to parse analysis data';
  }

    const { t } = useTranslation();

  // Render SWOT table if we have the correct data structure
  if (swotData && (swotData.strengths || swotData.weaknesses || swotData.opportunities || swotData.threats)) {
    return (
      <div className="swot-analysis-container">
        {/* Header with regenerate button */}

        <div className="ln-header">
          <div className="ln-title-section">
            <Target className="ln-icon" size={24} />
            <h2 className="ln-title">{t("SWOT Analysis")}</h2>
          </div>
          <RegenerateButton
              onRegenerate={onRegenerate}
              isRegenerating={isRegenerating}
              canRegenerate={canRegenerate}
              sectionName="SWOT Analysis"
              size="medium"
            />
        </div>

         

        <div className="table-responsive">
          <table className="table table-bordered table-striped swot-table">
            {/* Header Row with all 4 SWOT categories */}
            <thead className="table-light">
              <tr>
                <th className="swot-header strengths-bg">
                  <div className="swot-title">
                    <strong>S</strong>trengths
                  </div> 
                </th>
                <th className="swot-header weaknesses-bg">
                  <div className="swot-title">
                    <strong>W</strong>eaknesses
                  </div> 
                </th>
                <th className="swot-header opportunities-bg">
                  <div className="swot-title">
                    <strong>O</strong>pportunities
                  </div> 
                </th>
                <th className="swot-header threats-bg">
                  <div className="swot-title">
                    <strong>T</strong>hreats
                  </div> 
                </th>
              </tr>
            </thead>
            {/* Content Row with all 4 SWOT results */}
            <tbody>
              <tr>
                <td className="swot-cell">
                  {renderSwotContent(swotData.strengths, 'strengths')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.weaknesses, 'weaknesses')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.opportunities, 'opportunities')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.threats, 'threats')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>          
      </div>
    );
  }

  // Fallback for unexpected data format
  return (
    <div className="swot-analysis-container">
      {/* Header with regenerate button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 1rem' }}>
        <h4 className="text-center" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
          <strong>Business Analysis</strong>
        </h4>
        {onRegenerate && (
          <RegenerateButton
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="SWOT Analysis"
            size="medium"
          />
        )}
      </div>
      
      {errorMessage ? (
        <div className="alert alert-danger">
          <h6>Error</h6>
          <p>{errorMessage}</p>
        </div>
      ) : (
        <div className="alert alert-info">
          <h6>Raw Analysis Data</h6>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Helper function to render SWOT content
const renderSwotContent = (content, category) => {
  if (!content) {
    return (
      <div className={`analysis-box ${category}-bg`}>
        <em>No {category} identified</em>
      </div>
    );
  }

  // Handle string content by splitting on common delimiters
  const items = String(content)
    .split(/[.,;]\s+/)
    .filter(item => item.trim().length > 0)
    .map(item => item.trim().replace(/[.,;]+$/, ''));

  if (items.length <= 1) {
    // Single item or short content
    return (
      <div className={`analysis-box ${category}-bg`}>
        {String(content)}
      </div>
    );
  }

  // Multiple items
  return items.map((item, index) => (
    <div key={index} className={`analysis-box ${category}-bg`}>
      {item}
    </div>
  ));
};

export default SwotAnalysis;