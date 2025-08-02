import React from 'react';
import RegenerateButton from './RegenerateButton';
import '../styles/dashboard.css';
import '../styles/analysis-components.css';
import { Heart, TrendingUp, Users, Calendar, Loader, Target, Award, BarChart3 } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const SwotAnalysis = ({
  analysisResult,
  businessName,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}) => {
  const { t } = useTranslation();

  // Enhanced parsing with better error handling
  let swotData = null;
  let errorMessage = '';

  // Show loading state during regeneration - Use consistent table structure
  if (isRegenerating) {
    return (
      <div className="swot-analysis-container">
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

        {/* Always maintain the same table structure with loading overlay */}
        <div style={{ position: 'relative' }}>
          <div className="table-responsive">
            <table className="table table-bordered table-striped swot-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th className="swot-header strengths-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>S</strong>trengths
                    </div>
                  </th>
                  <th className="swot-header weaknesses-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>W</strong>eaknesses
                    </div>
                  </th>
                  <th className="swot-header opportunities-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>O</strong>pportunities
                    </div>
                  </th>
                  <th className="swot-header threats-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>T</strong>hreats
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: analysisResult ? 0.3 : 0.1 }}>
                    {analysisResult ? renderSwotContent(swotData?.strengths, 'strengths') : (
                      <div className="analysis-box strengths-bg">Analyzing strengths...</div>
                    )}
                  </td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: analysisResult ? 0.3 : 0.1 }}>
                    {analysisResult ? renderSwotContent(swotData?.weaknesses, 'weaknesses') : (
                      <div className="analysis-box weaknesses-bg">Analyzing weaknesses...</div>
                    )}
                  </td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: analysisResult ? 0.3 : 0.1 }}>
                    {analysisResult ? renderSwotContent(swotData?.opportunities, 'opportunities') : (
                      <div className="analysis-box opportunities-bg">Analyzing opportunities...</div>
                    )}
                  </td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: analysisResult ? 0.3 : 0.1 }}>
                    {analysisResult ? renderSwotContent(swotData?.threats, 'threats') : (
                      <div className="analysis-box threats-bg">Analyzing threats...</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Loading overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 10,
            minWidth: '300px'
          }}>
            <Loader size={24} className="loading-spinner" style={{
              animation: 'spin 1s linear infinite',
              color: '#4F46E5'
            }} />
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {t("Regenerating SWOT analysis...")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Simplified JSON parsing function for the specific API format
  const parseAnalysisResult = (result) => {
    if (!result) {
      throw new Error('No analysis result provided');
    }

    // If already an object, return it
    if (typeof result === 'object' && result !== null) {
      return result;
    }

    if (typeof result !== 'string') {
      throw new Error('Analysis result must be a string or object');
    }

    try {
      // First attempt: Direct JSON parse
      let parsed = JSON.parse(result);
      // If the result is a string, it means we have double-encoded JSON
      // Parse it again to get the actual object
      if (typeof parsed === 'string') {

        parsed = JSON.parse(parsed);

      }

      // Check if it's an object (and not null or array)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {


        const hasSwotField = parsed.strengths || parsed.weaknesses || parsed.opportunities || parsed.threats;
        if (hasSwotField) {

          return parsed;
        } else {

          throw new Error('No SWOT fields found in parsed object');
        }
      } else {

        throw new Error(`Parsed result is not an object (type: ${typeof parsed})`);
      }
    } catch (parseError) {
      console.error('JSON parse failed, trying fallback method:', parseError.message);

      // Fallback: Manual extraction using regex
      try {
        const extractedResult = {};

        // Extract each SWOT component using more flexible regex that handles multiline values
        const patterns = {
          strengths: /"strengths":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          weaknesses: /"weaknesses":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          opportunities: /"opportunities":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          threats: /"threats":\s*"([^"]*(?:\\.[^"]*)*?)"/s
        };

        for (const [key, pattern] of Object.entries(patterns)) {
          const match = result.match(pattern);
          if (match) {
            // Clean up the extracted value
            extractedResult[key] = match[1]
              .replace(/\\"/g, '"') // Unescape quotes
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          }
        }

        if (Object.keys(extractedResult).length > 0) {

          return extractedResult;
        } else {
          throw new Error('Fallback extraction failed - no SWOT data found');
        }
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError.message);
        throw new Error(`Failed to parse SWOT analysis: ${parseError.message}`);
      }
    }
  };

  // Only try to parse if we have actual analysis result
  if (analysisResult) {
    try {
      swotData = parseAnalysisResult(analysisResult);
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      console.error('Raw analysisResult:', analysisResult);
      errorMessage = `Failed to parse analysis data: ${error.message}`;
    }
  }

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

  // Show error message if there was a parsing error
  if (errorMessage) {
    return (
      <div className="swot-analysis-container">
        {/* Header with regenerate button */}
        <div className="ln-header">
          <div className="ln-title-section">
            <Target className="ln-icon" size={24} />
            <h2 className="ln-title">{t("SWOT Analysis")}</h2>
          </div>
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

        <div className="alert alert-danger" style={{ margin: '1rem', padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '8px' }}>
          <h6>Error Parsing SWOT Data</h6>
          <p>{errorMessage}</p>
          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ cursor: 'pointer' }}>Show raw data</summary>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto',
              marginTop: '0.5rem'
            }}>
              {typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  // Default empty state when no analysis result is available yet
  return (
    <div className="swot-analysis-container">
      {/* Header with regenerate button */}
      <div className="ln-header">
        <div className="ln-title-section">
          <Target className="ln-icon" size={24} />
          <h2 className="ln-title">{t("SWOT Analysis")}</h2>
        </div>
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

      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
        <Target size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
          SWOT Analysis
        </h3>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Complete the initial questions to generate your SWOT analysis.
        </p>
      </div>
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

  // Handle string content by splitting on sentence endings
  const contentStr = String(content).trim();

  // Split on sentence endings but keep meaningful content
  const items = contentStr
    .split(/(?<=[.!?])\s+/)
    .filter(item => item.trim().length > 10) // Filter out very short fragments
    .map(item => item.trim());

  if (items.length <= 1) {
    // Single item or short content
    return (
      <div className={`analysis-box ${category}-bg`}>
        {contentStr}
      </div>
    );
  }

  // Multiple sentences - render as separate boxes
  return items.map((item, index) => (
    <div key={index} className={`analysis-box ${category}-bg`} style={{ marginBottom: '0.5rem' }}>
      {item}
    </div>
  ));
};

export default SwotAnalysis;