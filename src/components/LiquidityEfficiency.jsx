import React, { useState, useEffect, useRef } from 'react';
import { Activity, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const LiquidityEfficiency = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  liquidityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null
}) => {
  const [analysisData, setAnalysisData] = useState(liquidityData);
  const [error, setError] = useState(null);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.liquidityEfficiency || {
      displayName: 'Liquidity & Efficiency',
      customMessage: 'Answer more questions to unlock detailed liquidity analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'liquidityEfficiency',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isLiquidityDataIncomplete = (data) => {
    if (!data) return true;
    
    let liquidityMetrics = null;
    
    if (data.liquidity) {
      liquidityMetrics = data.liquidity;
    } else if (data['Liquidity & Efficiency']) {
      liquidityMetrics = data['Liquidity & Efficiency'];
    } else if (data.liquidityEfficiency) {
      liquidityMetrics = data.liquidityEfficiency;
    } else if (data.liquidity_efficiency) {
      liquidityMetrics = data.liquidity_efficiency;
    } else if (data.LiquidityEfficiency) {
      liquidityMetrics = data.LiquidityEfficiency;
    } else if (data && typeof data === 'object') {
      liquidityMetrics = data;
    }
    
    if (!liquidityMetrics || typeof liquidityMetrics !== 'object') {
      return true;
    }
    
    const hasValidRatio = Object.entries(liquidityMetrics).some(([key, value]) => {
      if (key.includes('_threshold') || key.includes('threshold')) {
        return false;
      }
      return value !== null && 
             value !== undefined &&
             !isNaN(parseFloat(value));
    });
    
    return !hasValidRatio;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        setError('Failed to regenerate analysis. Please try again.');
      }
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  // Helper function to get traffic light color based on value vs threshold
  const getTrafficLightColor = (value, threshold, metricType) => {
    if (!threshold || threshold === 'NA' || threshold === null || threshold === undefined) {
      return '#6b7280'; // Gray for NA
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[,$%]/g, '')) : value;
    const numThreshold = typeof threshold === 'string' ? parseFloat(threshold.replace(/[,$%]/g, '')) : threshold;
    
    if (isNaN(numValue) || isNaN(numThreshold)) {
      return '#6b7280'; // Gray for invalid values
    }
    
    // Cash Conversion Cycle - lower is better
    if (metricType === 'Cash Conversion Cycle') {
      if (numValue <= numThreshold * 0.9) return '#10b981'; // Green - 10% below threshold
      if (numValue <= numThreshold * 1.1) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - above threshold
    } else {
      // Current Ratio and Quick Ratio - higher is better
      if (numValue >= numThreshold * 1.1) return '#10b981'; // Green - 10% above threshold
      if (numValue >= numThreshold * 0.9) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - below threshold
    }
  };

  // Helper function to render traffic light indicator with text
  const TrafficLightIndicator = ({ value, threshold, metricType, displayValue }) => {
    const color = getTrafficLightColor(value, threshold, metricType);
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color,
          border: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0
        }} />
        <span style={{
          color: color,
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}>
          {displayValue}
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (liquidityData && liquidityData !== analysisData) {
      setAnalysisData(liquidityData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(liquidityData);
      }
    }
  }, [liquidityData, analysisData, onDataGenerated]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (liquidityData) {
      setAnalysisData(liquidityData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [liquidityData]);

  const handleFileUpload = (file) => {
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatRatio = (value, type) => {
    if (value === null || value === undefined || value === '') return null;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return null;
    
    if (type === 'Cash Conversion Cycle') {
      return `${numValue.toFixed(0)} days`;
    }
    return numValue.toFixed(2);
  };

  const formatThreshold = (threshold, type) => {
    if (!threshold || threshold === 'NA') return 'NA';
    
    if (typeof threshold === 'string') {
      const numValue = parseFloat(threshold);
      if (isNaN(numValue)) return 'NA';
      if (type === 'Cash Conversion Cycle') {
        return `${numValue.toFixed(0)} days`;
      }
      return numValue.toFixed(1);
    }
    
    if (typeof threshold === 'number') {
      if (type === 'Cash Conversion Cycle') {
        return `${threshold.toFixed(0)} days`;
      }
      return threshold.toFixed(1);
    }
    
    return 'NA';
  };

  const extractLiquidityMetrics = (data) => {
    let liquidityMetrics = null;
    
    const possiblePaths = [
      { path: 'liquidity', data: data.liquidity },
      { path: 'Liquidity & Efficiency', data: data['Liquidity & Efficiency'] },
      { path: 'liquidityEfficiency', data: data.liquidityEfficiency },
      { path: 'liquidity_efficiency', data: data.liquidity_efficiency },
      { path: 'LiquidityEfficiency', data: data.LiquidityEfficiency },
      { path: 'direct', data: data }
    ];

    for (const { path, data: pathData } of possiblePaths) {
      if (pathData && typeof pathData === 'object') {
        liquidityMetrics = pathData;
        break;
      }
    }

    if (liquidityMetrics) {
      const transformedMetrics = {};
      const thresholds = {};
      
      const keyMappings = {
        'current_ratio': 'Current Ratio',
        'quick_ratio': 'Quick Ratio',
        'cash_conversion_cycle': 'Cash Conversion Cycle',
        'Current Ratio': 'Current Ratio',
        'Quick Ratio': 'Quick Ratio',
        'Cash Conversion Cycle': 'Cash Conversion Cycle'
      };

      Object.entries(liquidityMetrics).forEach(([key, value]) => {
        if (key.includes('_threshold') || key.includes('threshold')) {
          const baseKey = key.replace('_threshold', '').replace('threshold', '');
          const displayKey = keyMappings[baseKey] || baseKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          thresholds[displayKey] = value;
        } else {
          const displayKey = keyMappings[key] || key;
          transformedMetrics[displayKey] = value;
        }
      });

      return { metrics: transformedMetrics, thresholds };
    }

    return { metrics: liquidityMetrics, thresholds: {} };
  };

  // Show loading state
  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating liquidity & efficiency analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Show error message within the normal structure if there's an error
    if (error) {
      return (
        <div className="liquidity-efficiency__warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="liquidity-efficiency__warning-title">Analysis Error</h4>
            <p className="liquidity-efficiency__warning-text">{error}</p>
          </div>
        </div>
      );
    }

    // Show empty state if no data
    if (!analysisData || isLiquidityDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="liquidityEfficiency"
          analysisDisplayName="Liquidity & Efficiency Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          fileUploadMessage="Upload Excel or CSV files with financial data for liquidity & efficiency analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          customMessage="No liquidity & efficiency analysis results found. The uploaded financial document doesn't contain the required liquidity ratios (Current Assets, Current Liabilities, Cash, Inventory) or proper values for analysis."
        />
      );
    }

    const { metrics: liquidityMetrics, thresholds } = extractLiquidityMetrics(analysisData);

    if (!liquidityMetrics || typeof liquidityMetrics !== 'object' || Object.keys(liquidityMetrics).length === 0) {
      return (
        <FinancialEmptyState
          analysisType="liquidityEfficiency"
          analysisDisplayName="Liquidity & Efficiency Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          fileUploadMessage="Upload Excel or CSV files with financial data for liquidity & efficiency analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      );
    }

    const allMetricsNull = Object.values(liquidityMetrics).every(value => value === null);

    // Show normal analysis content
    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {allMetricsNull && (
            <div className="liquidity-efficiency__warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="liquidity-efficiency__warning-title">
                  No Liquidity Data Available
                </h4>
                <p className="liquidity-efficiency__warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required liquidity ratios.
                </p>
              </div>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Industry Average</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(liquidityMetrics).map(([key, value]) => {
                const formattedValue = formatRatio(value, key);
                const isNull = value === null || value === undefined || value === '';
                const threshold = thresholds[key];
                const formattedThreshold = formatThreshold(threshold, key);
                
                return (
                  <tr key={key}>
                    <td><strong>{key}</strong></td>
                    <td>
                      {isNull ? (
                        <span style={{ color: '#6b7280' }}>No Data</span>
                      ) : (
                        <TrafficLightIndicator 
                          value={value} 
                          threshold={threshold} 
                          metricType={key}
                          displayValue={formattedValue}
                        />
                      )}
                    </td>
                    <td>
                      {formattedThreshold}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Main component structure
  return (
    <div 
      className="liquidity-efficiency" 
      data-analysis-type="liquidity-efficiency"
      data-analysis-name="Liquidity & Efficiency"
      data-analysis-order="3"
    >
      {renderContent()}
    </div>
  );
};

export default LiquidityEfficiency;