import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader, Info, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ProfitabilityAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  profitabilityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null,
}) => {
  const [analysisData, setAnalysisData] = useState(profitabilityData);
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
    try {
      const analysisConfig = ANALYSIS_TYPES.profitability || {
        displayName: 'Profitability Analysis',
        customMessage: 'Answer more questions to unlock detailed profitability analysis'
      };

      await checkMissingQuestionsAndRedirect(
        'profitability',
        selectedBusinessId,
        handleRedirectToBrief,
        {
          displayName: analysisConfig.displayName,
          customMessage: analysisConfig.customMessage
        }
      );
    } catch (error) {
      console.error('Error checking missing questions:', error);
    }
  };

  const isProfitabilityDataIncomplete = (data) => { 
    if (!data || !data.profitability) { 
      return true;
    }
    
    const profitabilityMetrics = data.profitability; 
    
    if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') { 
      return true;
    }
     
    const hasValidMetric = Object.entries(profitabilityMetrics).some(([key, value]) => {
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
    if (profitabilityData && profitabilityData !== analysisData) { 
      setAnalysisData(profitabilityData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(profitabilityData);
      }
    }
  }, [profitabilityData, analysisData, onDataGenerated]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (profitabilityData) {
      setAnalysisData(profitabilityData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [profitabilityData]);

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
      'gross_margin': 'Gross Margin',
      'operating_margin': 'Operating Margin', 
      'ebitda_margin': 'EBITDA Margin',
      'ebitda': 'EBITDA Margin', // Handle ebitda_threshold -> ebitda -> EBITDA Margin
      'net_margin': 'Net Margin'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

  const extractProfitabilityMetrics = (data) => {
    if (!data || !data.profitability) {
      return { metrics: {}, thresholds: {} };
    }

    const profitabilityData = data.profitability;
    const metrics = {};
    const thresholds = {};

    Object.entries(profitabilityData).forEach(([key, value]) => {
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
          <span>Generating profitability analysis...</span>
        </div>
      </div>
    );
  }

  // REMOVED THE ERROR STATE RETURN - now error will be shown within the normal component structure
  
  const renderContent = () => {
    // Show error message within the normal structure if there's an error
    if (error) {
      return (
        <div className="profitability-warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="profitability-warning-title">Analysis Error</h4>
            <p className="profitability-warning-text">{error}</p>
          </div>
        </div>
      );
    }

    // Show empty state if no data
    if (!analysisData || isProfitabilityDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="profitability"
          analysisDisplayName="Profitability Analysis"
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
          fileUploadMessage="Upload Excel or CSV files with financial data for profitability analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          customMessage="No profitability analysis results found. The uploaded financial document doesn't contain the required profitability metrics or proper values for analysis."
        />
      );
    }

    const { metrics, thresholds } = extractProfitabilityMetrics(analysisData);
    
    if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) { 
      return (
        <FinancialEmptyState
          analysisType="profitability"
          analysisDisplayName="Profitability Analysis"
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
          fileUploadMessage="Upload Excel or CSV files with financial data for profitability analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      );
    }

    // Show normal analysis content
    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {Object.values(metrics).every(value => value === null) && (
            <div className="profitability-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="profitability-warning-title">
                  No Financial Data Available
                </h4>
                <p className="profitability-warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required profitability metrics.
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
 
  return (
    <div className="profitability-analysis" 
         data-analysis-type="profitability"
         data-analysis-name="Profitability Analysis"
         data-analysis-order="1">
 
      {renderContent()}
    </div>
  );
};

export default ProfitabilityAnalysis;