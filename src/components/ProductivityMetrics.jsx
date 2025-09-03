import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
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
  // LOCAL STATE
  const [data, setData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [error, setError] = useState(null);

  // PREVENT MULTIPLE INITIALIZATIONS
  const hasInitialized = useRef(false);

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

  // HANDLE REGENERATE
  const handleRegenerate = async () => {
    console.log('ProductivityMetrics handleRegenerate called', { onRegenerate: !!onRegenerate });
    
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in ProductivityMetrics regeneration:', error);
        setError(error.message || 'Failed to regenerate analysis');
      }
    } else {
      console.warn('No onRegenerate prop provided to ProductivityMetrics');
      setError('Regeneration not available');
    }
  };

  // Check if the productivity data is empty/incomplete
  const isProductivityDataIncomplete = (data) => {
    if (!data) return true;
    
    // Handle both wrapped and direct response structures
    const productivityMetrics = data?.productivityMetrics || data;
    
    // Check if essential productivity data exists
    if (!productivityMetrics) return true;
    
    // Check employee productivity - if all values are 0 or null, it's incomplete
    const employeeProductivity = productivityMetrics.employeeProductivity;
    const hasValidEmployeeData = employeeProductivity && (
      (employeeProductivity.totalEmployees > 0) ||
      (employeeProductivity.averageValuePerEmployee > 0) ||
      (employeeProductivity.totalValueGenerated > 0) ||
      (employeeProductivity.productivityIndex > 0)
    );
    
    // Check cost structure - if all values are 0 or empty, it's incomplete
    const costStructure = productivityMetrics.costStructure;
    const hasValidCostData = costStructure && (
      (costStructure.employeeCosts > 0) ||
      (costStructure.otherCosts > 0) ||
      (costStructure.costEfficiency && costStructure.costEfficiency !== 'unknown' && costStructure.costEfficiency !== '')
    );
    
    // Check if arrays have meaningful data
    const hasValueDrivers = productivityMetrics.valueDrivers && productivityMetrics.valueDrivers.length > 0;
    const hasImprovementOpportunities = productivityMetrics.improvementOpportunities && productivityMetrics.improvementOpportunities.length > 0;
    
    // At least 2 sections should have data for meaningful analysis
    const sectionsWithData = [hasValidEmployeeData, hasValidCostData, hasValueDrivers, hasImprovementOpportunities].filter(Boolean).length;
    
    return sectionsWithData < 2;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // INITIALIZE COMPONENT
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (productivityData) {
      setData(productivityData);
      setHasGenerated(true);
      setError(null);
    }
  }, [productivityData]);

  // UPDATE DATA WHEN PROP CHANGES
  useEffect(() => {
    if (productivityData) {
      setData(productivityData);
      setHasGenerated(true);
      setError(null);
    } else if (productivityData === null) {
      // Only reset if explicitly set to null (during regeneration)
      setData(null);
      setHasGenerated(false);
    }
  }, [productivityData]);

  // LOADING STATE
  if (isRegenerating) {
    return (
      <div className="porters-container productivity-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating Productivity Metrics...</span>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="porters-container productivity-container"> 
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // CHECK IF DATA IS INCOMPLETE
  if (!hasGenerated || !data?.productivityMetrics || isProductivityDataIncomplete(data)) {
    return (
      <div className="porters-container productivity-container"> 
        <AnalysisEmptyState
          analysisType="productivityMetrics"
          analysisDisplayName="Productivity and Efficiency Metrics Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate && !!onRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        /> 
      </div>
    );
  }

  // Handle both wrapped and direct response structures
  const productivityMetrics = data?.productivityMetrics || data;

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
                    <td><strong>{formatFieldName(key)}</strong></td>
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