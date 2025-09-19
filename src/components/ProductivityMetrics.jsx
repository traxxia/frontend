import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import "../styles/EssentialPhase.css";
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ProductivityMetrics = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  productivityData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [data, setData] = useState(productivityData);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.productivityMetrics;

    await checkMissingQuestionsAndRedirect(
      'productivityMetrics',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      setError(null); // Clear any existing errors
      onRegenerate();
    }
  };

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Simplified validation - EXACTLY like other components
  const isProductivityDataIncomplete = (data) => {
    if (!data) return true;

    // Handle both wrapped and direct API response formats
    let normalizedData;
    if (data.productivityMetrics) {
      normalizedData = data;
    } else if (data.employeeProductivity || data.costStructure) {
      normalizedData = { productivityMetrics: data };
    } else {
      return true;
    }

    // Check if productivityMetrics exists
    if (!normalizedData.productivityMetrics) {
      return true;
    }

    const metrics = normalizedData.productivityMetrics;
    const hasEmployeeData = metrics.employeeProductivity && Object.keys(metrics.employeeProductivity).length > 0;
    const hasCostData = metrics.costStructure && Object.keys(metrics.costStructure).length > 0;
    const hasValueDrivers = metrics.valueDrivers && metrics.valueDrivers.length > 0;
    const hasImprovements = metrics.improvementOpportunities && metrics.improvementOpportunities.length > 0;

    // Need at least some data to show something meaningful
    const sectionsWithData = [hasEmployeeData, hasCostData, hasValueDrivers, hasImprovements].filter(Boolean).length;
    return sectionsWithData === 0;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // EXACTLY the same useEffect pattern as other components
  useEffect(() => {
    if (productivityData) {
      // Handle both wrapped and direct API response formats
      let normalizedData;
      if (productivityData.productivityMetrics) {
        // Data is already wrapped
        normalizedData = productivityData;
      } else if (productivityData.employeeProductivity || productivityData.costStructure) {
        // Data is direct from API, needs wrapping
        normalizedData = { productivityMetrics: productivityData };
      } else {
        normalizedData = null;
      }

      if (normalizedData) {
        setData(normalizedData);
        setHasGenerated(true);
        setError(null); // Clear errors when new data comes in
      } else {
        setData(null);
        setHasGenerated(false);
        setError('Invalid productivity metrics data received');
      }
    } else {
      setData(null);
      setHasGenerated(false);
    }
  }, [productivityData]);

  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Helper function to format values for display
  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A';

    // Format percentage fields
    if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('costs')) {
      return `${value}`;
    }

    // Format currency fields
    if (key.toLowerCase().includes('value') && typeof value === 'number' && value > 1000) {
      return `${value.toLocaleString()}`;
    }

    // Format numbers
    if (typeof value === 'number' && value > 1000) {
      return value.toLocaleString();
    }

    return value;
  };

  // Helper function to render dynamic table for objects
  const renderObjectTable = (obj, sectionKey, sectionTitle) => {
    if (!obj || typeof obj !== 'object') return null;

    const keys = Object.keys(obj);
    if (keys.length === 0) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection(sectionKey)}>
          <h3>{sectionTitle}</h3>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections[sectionKey] !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key, index) => (
                  <tr key={index}>
                    <td><div className="force-name"> {formatFieldName(key)}</div></td>
                    <td>{formatValue(obj[key], key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render dynamic table for arrays
  const renderArrayTable = (array, sectionKey, sectionTitle) => {
    if (!array || !Array.isArray(array) || array.length === 0) return null;

    // Handle array of strings (like improvementOpportunities)
    if (typeof array[0] === 'string') {
      return (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection(sectionKey)}>
            <h3>{sectionTitle}</h3>
            {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections[sectionKey] !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {array.map((item, index) => (
                    <tr key={index}>
                      <td>{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Handle array of objects (like valueDrivers)
    if (typeof array[0] === 'object' && array[0] !== null) {
      const keys = Object.keys(array[0]);

      return (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection(sectionKey)}>
            <h3>{sectionTitle}</h3>
            {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections[sectionKey] !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {keys.map((key, index) => (
                      <th key={index}>{formatFieldName(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {array.map((item, rowIndex) => (
                    <tr key={rowIndex}>
                      {keys.map((key, colIndex) => (
                        <td key={colIndex}>
                          {colIndex === 0 ? <strong>{formatValue(item[key], key)}</strong> : formatValue(item[key], key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Loading state
  if (isRegenerating) {
    return (
      <div className="porters-container productivity-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating productivity metrics analysis..."
              : "Generating productivity metrics analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  // Error state - UPDATED: Using AnalysisError component
  if (error) {
    return (
      <div className="porters-container productivity-container">
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Productivity Metrics Analysis Error"
        />
      </div>
    );
  }

  // Error state for generation failure with user answers - UPDATED: Using AnalysisError component
  if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
    return (
      <div className="porters-container productivity-container">
        <AnalysisError 
          error="Unable to generate productivity metrics analysis. Please try regenerating or check your inputs."
          onRetry={handleRetry}
          title="Analysis Generation Error"
        />
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!productivityData || isProductivityDataIncomplete(productivityData)) {
    return (
      <div className="porters-container productivity-container">
        <AnalysisEmptyState
          analysisType="productivityMetrics"
          analysisDisplayName="Productivity and Efficiency Metrics Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />
      </div>
    );
  }

  // Check if data structure is valid - UPDATED: Using AnalysisError component
  if (!data?.productivityMetrics) {
    return (
      <div className="porters-container productivity-container">
        <AnalysisError 
          error="The productivity metrics data received is not in the expected format. Please regenerate the analysis."
          onRetry={handleRetry}
          title="Invalid Data Structure"
        />
      </div>
    );
  }

  // Handle both wrapped and direct response structures
  const productivityMetrics = data.productivityMetrics;

  return (
    <div className="porters-container productivity-container"
      data-analysis-type="productivityMetrics"
      data-analysis-name="Productivity Metrics"
      data-analysis-order="14">

      {/* Dynamically render all sections from API response */}
      {Object.keys(productivityMetrics).map((sectionKey) => {
        const sectionData = productivityMetrics[sectionKey];
        const sectionTitle = formatFieldName(sectionKey);

        // Handle objects
        if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
          return renderObjectTable(sectionData, sectionKey, sectionTitle);
        }

        // Handle arrays
        if (Array.isArray(sectionData) && sectionData.length > 0) {
          return renderArrayTable(sectionData, sectionKey, sectionTitle);
        }

        return null;
      })}

    </div>
  );
};

export default ProductivityMetrics;