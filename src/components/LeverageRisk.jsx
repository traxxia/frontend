import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader, Shield, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const LeverageRisk = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  leverageData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null
}) => {
  const [analysisData, setAnalysisData] = useState(leverageData);
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
    const analysisConfig = ANALYSIS_TYPES.leverageRisk || {
      displayName: 'Leverage & Risk',
      customMessage: 'Answer more questions to unlock detailed leverage analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'leverageRisk',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isLeverageDataIncomplete = (data) => {
    if (!data || !data.leverage) {
      return true;
    }
    
    const leverageMetrics = data.leverage;
    
    if (!leverageMetrics || typeof leverageMetrics !== 'object') {
      return true;
    }
     
    const hasValidMetric = Object.entries(leverageMetrics).some(([key, value]) => {
      if (key.includes('_threshold') || key.includes('threshold')) {
        return false;
      }
      const isValid = value !== null && 
        value !== undefined &&
        value !== '' &&
        !isNaN(parseFloat(value)); 
      return isValid;
    });
     
    return !hasValidMetric;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        console.error('Error during regeneration:', error);
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
    
    // Interest Coverage - higher is better
    if (metricType === 'Interest Coverage') {
      if (numValue >= numThreshold * 1.1) return '#10b981'; // Green - 10% above threshold
      if (numValue >= numThreshold * 0.9) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - below threshold
    } else {
      // Debt-to-Equity - lower is better
      if (numValue <= numThreshold * 0.9) return '#10b981'; // Green - 10% below threshold
      if (numValue <= numThreshold * 1.1) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - above threshold
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
    if (leverageData && leverageData !== analysisData) {
      setAnalysisData(leverageData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(leverageData);
      }
    }
  }, [leverageData, analysisData, onDataGenerated]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (leverageData) {
      setAnalysisData(leverageData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [leverageData]);

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
    
    return numValue.toFixed(3);
  };

  const formatThreshold = (threshold) => {
    if (!threshold || threshold === 'NA') return 'NA';
    
    if (typeof threshold === 'string') {
      const numValue = parseFloat(threshold);
      if (isNaN(numValue)) return 'NA';
      return numValue.toFixed(1);
    }
    
    if (typeof threshold === 'number') {
      return threshold.toFixed(1);
    }
    
    return 'NA';
  };

  const getDisplayName = (key) => {
    const displayNames = {
      'debt_to_equity': 'Debt-to-Equity',
      'interest_coverage': 'Interest Coverage'
    };
    return displayNames[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const extractLeverageMetrics = (data) => {
    if (!data || !data.leverage) {
      return { metrics: {}, thresholds: {} };
    }

    const leverageData = data.leverage;
    const metrics = {};
    const thresholds = {};

    Object.entries(leverageData).forEach(([key, value]) => {
      if (key.includes('_threshold') || key.includes('threshold')) {
        const baseKey = key.replace('_threshold', '').replace('threshold', '');
        const displayKey = getDisplayName(baseKey);
        thresholds[displayKey] = value;
      } else {
        const displayKey = getDisplayName(key);
        metrics[displayKey] = value;
      }
    });

    return { metrics, thresholds };
  };

  // Show loading state
  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating leverage & risk analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Show error message within the normal structure if there's an error
    if (error) {
      return (
        <div className="leverage-risk__warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="leverage-risk__warning-title">Analysis Error</h4>
            <p className="leverage-risk__warning-text">{error}</p>
          </div>
        </div>
      );
    }

    // Show empty state if no data
    if (!analysisData || isLeverageDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="leverageRisk"
          analysisDisplayName="Leverage & Risk Analysis"
          icon={AlertTriangle}
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
          fileUploadMessage="Upload Excel or CSV files with financial data for leverage & risk analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          customMessage="No leverage & risk analysis results found. The uploaded financial document doesn't contain the required leverage ratios (debt-to-equity, interest coverage) or proper values for analysis."
        />
      );
    }

    const { metrics, thresholds } = extractLeverageMetrics(analysisData);

    if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) {
      return (
        <FinancialEmptyState
          analysisType="leverageRisk"
          analysisDisplayName="Leverage & Risk Analysis"
          icon={AlertTriangle}
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
          fileUploadMessage="Upload Excel or CSV files with financial data for leverage & risk analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      );
    }

    const allMetricsNull = Object.values(metrics).every(value => value === null);

    // Show normal analysis content
    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {allMetricsNull && (
            <div className="leverage-risk__warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="leverage-risk__warning-title">
                  No Risk Data Available
                </h4>
                <p className="leverage-risk__warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required leverage ratios.
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
              {Object.entries(metrics).map(([key, value]) => {
                const formattedValue = formatRatio(value, key);
                const isNull = value === null || value === undefined || value === '';
                const threshold = thresholds[key];
                const formattedThreshold = formatThreshold(threshold);
                
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
      className="leverage-risk" 
      data-analysis-type="leverage-risk"
      data-analysis-name="Leverage & Risk"
      data-analysis-order="5"
    >
      {renderContent()}
    </div>
  );
};

export default LeverageRisk;