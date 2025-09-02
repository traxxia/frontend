import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader, Shield, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState'; // Import the new component
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
    if (!data) return true;
    
    // Handle different data structures from API
    let leverageMetrics = null;
    
    // Check if data has "leverage" key (new API structure)
    if (data.leverage) {
      leverageMetrics = data.leverage;
    }
    // Check if data has "Leverage & Risk" key (legacy structure)
    else if (data['Leverage & Risk']) {
      leverageMetrics = data['Leverage & Risk'];
    }
    // Check if data has nested leverageRisk key (processed)
    else if (data.leverageRisk) {
      leverageMetrics = data.leverageRisk;
    }
    // If data is directly the metrics object
    else if (data && typeof data === 'object') {
      leverageMetrics = data;
    }
    
    if (!leverageMetrics || typeof leverageMetrics !== 'object') {
      return true;
    }
    
    // Check if at least one ratio has non-null value
    const hasValidRatio = Object.entries(leverageMetrics).some(([key, value]) => 
      value !== null && 
      value !== undefined &&
      !isNaN(parseFloat(value))
    );
    
    return !hasValidRatio;
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

  // Dynamic field mapping for different API response formats
  const getFieldDisplayName = (fieldKey) => {
    const fieldMapping = {
      'debt_to_equity': 'Debt-to-Equity',
      'interest_coverage': 'Interest Coverage',
      'Debt-to-Equity': 'Debt-to-Equity',
      'Interest Coverage': 'Interest Coverage'
    };
    return fieldMapping[fieldKey] || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRiskThresholds = (fieldName) => {
    const thresholds = {
      'Debt-to-Equity': { 
        low: 0.3,    // Green - Low risk
        medium: 1.0  // Yellow - Medium risk, above is Red - High risk
      },
      'Interest Coverage': { 
        low: 5.0,    // Green - Low risk (higher is better)
        medium: 2.5  // Yellow - Medium risk, below is Red - High risk
      }
    };
    return thresholds[fieldName];
  };
  const getRiskColor = (value, fieldName) => {
    if (value === null || value === undefined) return '#e5e7eb';
    
    const thresholds = getRiskThresholds(fieldName);
    if (!thresholds) return '#6b7280';

    if (fieldName === 'Interest Coverage') {
      // For Interest Coverage, higher values are better (less risky)
      if (value >= thresholds.low) return '#10b981';      // Green
      if (value >= thresholds.medium) return '#f59e0b';   // Yellow
      return '#ef4444';                               // Red
    } else {
      // For Debt-to-Equity, lower values are better (less risky)
      if (value <= thresholds.low) return '#10b981';      // Green
      if (value <= thresholds.medium) return '#f59e0b';   // Yellow
      return '#ef4444';                               // Red
    }
  };

  const getRiskLevel = (value, fieldName) => {
    if (value === null || value === undefined) return 'No Data';
    
    const color = getRiskColor(value, fieldName);
    if (color === '#10b981') return 'Low Risk';
    if (color === '#f59e0b') return 'Medium Risk';
    return 'High Risk';
  };

  const formatRatio = (value, fieldName) => {
    if (value === null || value === undefined) return null;
    
    if (fieldName === 'Interest Coverage') {
      return `${value.toFixed(3)}`;
    }
    return value.toFixed(3);
  };  

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

  if (error) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
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

  if (!analysisData || isLeverageDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
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
      </div>
    );
  }

  // Extract leverage data with proper structure handling
  let leverageMetrics = null;
  
  // Handle different data structures from API
  if (analysisData.leverage) {
    leverageMetrics = analysisData.leverage;
  } else if (analysisData['Leverage & Risk']) {
    leverageMetrics = analysisData['Leverage & Risk'];
  } else if (analysisData.leverageRisk) {
    leverageMetrics = analysisData.leverageRisk;
  } else {
    leverageMetrics = analysisData;
  }

  // If still no valid data, show empty state
  if (!leverageMetrics || typeof leverageMetrics !== 'object') {
    return (
      <div className="channel-heatmap channel-heatmap-container">
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
      </div>
    );
  }

  const allValuesNull = Object.values(leverageMetrics).every(value => value === null);

  return (
    <div 
      className="channel-heatmap channel-heatmap-container" 
      data-analysis-type="leverage-risk"
      data-analysis-name="Leverage & Risk"
      data-analysis-order="5"
    >
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">

          {/* Warning for no data */}
          {allValuesNull && (
            <div className="no-data-warning">
              <AlertCircle size={20} />
              <div>
                <h4 className="warning-title">
                  No Risk Data Available
                </h4>
                <p className="warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required leverage ratios.
                </p>
              </div>
            </div>
          )}

          {/* Risk Metrics Grid */}
          <div className="leverage-risk-grid">
            {Object.entries(leverageMetrics).map(([key, value]) => {
              const displayName = getFieldDisplayName(key);
              const color = getRiskColor(value, displayName); 
              const isNull = value === null || value === undefined;
              
              return (
                <div 
                  key={key} 
                  className={`leverage-risk-card ${isNull ? 'no-data' : ''}`}
                >
                  <div className="card-header">
                    <h4 className="card-title">
                      {displayName}
                    </h4>
                    {!isNull && (color === '#ef4444' ? 
                      <AlertTriangle size={20} color={color} /> : 
                      <Shield size={20} color={color} />
                    )}
                  </div>
                  
                  <div 
                    className="metric-value"
                    style={{ color: isNull ? '#9ca3af' : color }}
                  >
                    {isNull ? 'No Data' : formatRatio(value, displayName)}
                  </div> 
                </div>
              );
            })}
          </div> 
        </div>
      </div>
    </div>
  );
};

export default LeverageRisk;