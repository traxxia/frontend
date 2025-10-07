import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      setError(null);
      onRegenerate();
    }
  };

  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const isProductivityDataIncomplete = (data) => {
    if (!data) return true;

    let normalizedData;
    if (data.productivityMetrics) {
      normalizedData = data;
    } else if (data.employeeProductivity || data.costStructure) {
      normalizedData = { productivityMetrics: data };
    } else {
      return true;
    }

    if (!normalizedData.productivityMetrics) {
      return true;
    }

    const metrics = normalizedData.productivityMetrics;
    const hasEmployeeData = metrics.employeeProductivity && Object.keys(metrics.employeeProductivity).length > 0;
    const hasCostData = metrics.costStructure && Object.keys(metrics.costStructure).length > 0;
    const hasValueDrivers = metrics.valueDrivers && metrics.valueDrivers.length > 0;
    const hasImprovements = metrics.improvementOpportunities && metrics.improvementOpportunities.length > 0;

    const sectionsWithData = [hasEmployeeData, hasCostData, hasValueDrivers, hasImprovements].filter(Boolean).length;
    return sectionsWithData === 0;
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  useEffect(() => {
    if (productivityData) {
      let normalizedData;
      if (productivityData.productivityMetrics) {
        normalizedData = productivityData;
      } else if (productivityData.employeeProductivity || productivityData.costStructure) {
        normalizedData = { productivityMetrics: productivityData };
      } else {
        normalizedData = null;
      }

      if (normalizedData) {
        setData(normalizedData);
        setHasGenerated(true);
        setError(null);
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

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A';

    if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('costs')) {
      return `${value}`;
    }

    if (key.toLowerCase().includes('value') && typeof value === 'number' && value > 1000) {
      return `${value.toLocaleString()}`;
    }

    if (typeof value === 'number' && value > 1000) {
      return value.toLocaleString();
    }

    return value;
  };

  // Convert object to chart data
  const convertObjectToChartData = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    
    return Object.keys(obj).map(key => ({
      name: formatFieldName(key),
      value: typeof obj[key] === 'number' ? obj[key] : parseFloat(obj[key]) || 0
    }));
  };

  // Convert array to chart data
  const convertArrayToChartData = (array) => {
    if (!array || !Array.isArray(array) || array.length === 0) return [];

    if (typeof array[0] === 'string') {
      return array.map((item, index) => ({
        name: `Item ${index + 1}`,
        value: 1
      }));
    }

    if (typeof array[0] === 'object' && array[0] !== null) {
      const keys = Object.keys(array[0]);
      const nameKey = keys[0];
      const valueKey = keys.find(k => typeof array[0][k] === 'number') || keys[1];

      return array.map(item => ({
        name: String(item[nameKey] || ''),
        value: typeof item[valueKey] === 'number' ? item[valueKey] : parseFloat(item[valueKey]) || 0
      }));
    }

    return [];
  };

  // Render bar chart for objects
  const renderObjectChart = (obj, sectionKey, sectionTitle) => {
    if (!obj || typeof obj !== 'object') return null;

    const keys = Object.keys(obj);
    if (keys.length === 0) return null;

    const chartData = convertObjectToChartData(obj);

    return (
      <div className="section-container" key={sectionKey}>
        <div className="section-header" onClick={() => toggleSection(sectionKey)}>
          <h3>{sectionTitle}</h3>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections[sectionKey] !== false && (
          <div style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // Render bar chart for arrays
  const renderArrayChart = (array, sectionKey, sectionTitle) => {
    if (!array || !Array.isArray(array) || array.length === 0) return null;

    // For string arrays, show as table with same styling
    if (typeof array[0] === 'string') {
      return (
        <div className="section-container" key={sectionKey}>
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

    const chartData = convertArrayToChartData(array);

    return (
      <div className="section-container" key={sectionKey}>
        <div className="section-header" onClick={() => toggleSection(sectionKey)}>
          <h3>{sectionTitle}</h3>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections[sectionKey] !== false && (
          <div style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

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

  const productivityMetrics = data.productivityMetrics;

  return (
    <div className="porters-container productivity-container"
      data-analysis-type="productivityMetrics"
      data-analysis-name="Productivity Metrics"
      data-analysis-order="14">

      {Object.keys(productivityMetrics).map((sectionKey) => {
        const sectionData = productivityMetrics[sectionKey];
        const sectionTitle = formatFieldName(sectionKey);

        if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
          return renderObjectChart(sectionData, sectionKey, sectionTitle);
        }

        if (Array.isArray(sectionData) && sectionData.length > 0) {
          return renderArrayChart(sectionData, sectionKey, sectionTitle);
        }

        return null;
      })}

    </div>
  );
};

export default ProductivityMetrics;