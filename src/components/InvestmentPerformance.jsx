import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const InvestmentPerformance = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  investmentData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null
}) => {
  const [analysisData, setAnalysisData] = useState(investmentData);
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
    const analysisConfig = ANALYSIS_TYPES.investmentPerformance || {
      displayName: 'Investment Performance',
      customMessage: 'Answer more questions to unlock detailed investment analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'investmentPerformance',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isInvestmentDataIncomplete = (data) => {
    if (!data || !data.investment) {
      return true;
    }
    
    const investmentMetrics = data.investment;
    
    if (!investmentMetrics || typeof investmentMetrics !== 'object') {
      return true;
    }
     
    const hasValidMetric = Object.entries(investmentMetrics).some(([key, value]) => {
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
  const getTrafficLightColor = (value, threshold, isHigherBetter = true) => {
    if (!threshold || threshold === 'NA' || threshold === null || threshold === undefined) {
      return '#6b7280'; // Gray for NA
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[,$%]/g, '')) : value;
    const numThreshold = typeof threshold === 'string' ? parseFloat(threshold.replace(/[,$%]/g, '')) : threshold;
    
    if (isNaN(numValue) || isNaN(numThreshold)) {
      return '#6b7280'; // Gray for invalid values
    }
    
    if (isHigherBetter) {
      if (numValue >= numThreshold * 1.1) return '#10b981'; // Green - 10% above threshold
      if (numValue >= numThreshold * 0.9) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - below threshold
    } else {
      if (numValue <= numThreshold * 0.9) return '#10b981'; // Green - 10% below threshold
      if (numValue <= numThreshold * 1.1) return '#f59e0b'; // Yellow - within 10% of threshold
      return '#ef4444'; // Red - above threshold
    }
  };

  // Helper function to render traffic light indicator with text
  const TrafficLightIndicator = ({ value, threshold, isHigherBetter = true, displayValue }) => {
    const color = getTrafficLightColor(value, threshold, isHigherBetter);
    
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
    if (investmentData && investmentData !== analysisData) {      
      setAnalysisData(investmentData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(investmentData);
      }
    }
  }, [investmentData, analysisData, onDataGenerated]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (investmentData) {
      setAnalysisData(investmentData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [investmentData]);

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

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'string') {
      if (value.includes('%')) return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      return `${(numValue).toFixed(3)}%`;
    }
    
    if (typeof value === 'number') {
      return `${(value).toFixed(3)}%`;
    }
    
    return null;
  };

  const formatThreshold = (threshold) => {
    if (!threshold || threshold === 'NA') return 'NA';
    
    if (typeof threshold === 'string') {
      if (threshold.includes('%')) return threshold;
      const numValue = parseFloat(threshold);
      if (isNaN(numValue)) return 'NA';
      return `${(numValue).toFixed(1)}%`;
    }
    
    if (typeof threshold === 'number') {
      return `${(threshold).toFixed(1)}%`;
    }
    
    return 'NA';
  };

  const getDisplayName = (key) => {
    const displayNames = {
      'roa': 'ROA (Return on Assets)',
      'roe': 'ROE (Return on Equity)', 
      'roic': 'ROIC (Return on Invested Capital)'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

  const extractInvestmentMetrics = (data) => {
    if (!data || !data.investment) {
      return { metrics: {}, thresholds: {} };
    }

    const investmentData = data.investment;
    const metrics = {};
    const thresholds = {};

    Object.entries(investmentData).forEach(([key, value]) => {
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
      <div className="investment-container">
        <div className="investment-loading-state">
          <Loader size={24} className="investment-loading-spinner" />
          <span>Generating investment performance analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Show error message within the normal structure if there's an error
    if (error) {
      return (
        <div className="investment-warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="investment-warning-title">Analysis Error</h4>
            <p className="investment-warning-text">{error}</p>
          </div>
        </div>
      );
    }

    // Show empty state if no data
    if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="investmentPerformance"
          analysisDisplayName="Investment Performance Analysis"
          icon={TrendingUp}
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
          fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          customMessage="No investment performance analysis results found. The uploaded financial document doesn't contain the required investment metrics (Total Assets, Shareholder Equity, Net Income, Operating Income) or proper values for analysis."
        />
      );
    }

    const { metrics, thresholds } = extractInvestmentMetrics(analysisData);
    
    if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) { 
      return (
        <FinancialEmptyState
          analysisType="investmentPerformance"
          analysisDisplayName="Investment Performance Analysis"
          icon={TrendingUp}
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
          fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      );
    }

    // Show normal analysis content
    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {Object.values(metrics).every(value => value === null) && (
            <div className="investment-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="investment-warning-title">
                  No Investment Data Available
                </h4>
                <p className="investment-warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required investment metrics.
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
                const formattedValue = formatPercentage(value);
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
                          isHigherBetter={true}
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
      className="investment-performance" 
      data-analysis-type="investment-performance"
      data-analysis-name="Investment Performance"
      data-analysis-order="4"
    >
      {renderContent()}
    </div>
  );
};

export default InvestmentPerformance;