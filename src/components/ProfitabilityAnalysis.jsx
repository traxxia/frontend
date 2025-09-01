import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader, Info, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
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

  // UPDATED: Handle the new backend response structure
  const isProfitabilityDataIncomplete = (data) => {
    console.log('Checking profitability data:', data);
    
    if (!data || !data.profitability) {
      console.log('No profitability data found');
      return true;
    }
    
    const profitabilityMetrics = data.profitability;
    console.log('Profitability metrics:', profitabilityMetrics);
    
    if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') {
      console.log('Invalid profitability metrics object');
      return true;
    }
    
    // Check if at least one profitability metric has non-null value
    const hasValidMetric = Object.entries(profitabilityMetrics).some(([key, value]) => {
      const isValid = value !== null && 
        value !== undefined &&
        value !== '' &&
        !isNaN(parseFloat(value));
      console.log(`Checking ${key}: ${value} -> ${isValid}`);
      return isValid;
    });
    
    console.log('Has valid metric:', hasValidMetric);
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

  // Update analysis data when profitabilityData prop changes
  useEffect(() => {
    console.log('useEffect triggered with profitabilityData:', profitabilityData);
    console.log('Current analysisData:', analysisData);
    
    if (profitabilityData && profitabilityData !== analysisData) {
      console.log('Profitability data updated:', profitabilityData);
      setAnalysisData(profitabilityData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(profitabilityData);
      }
    }
  }, [profitabilityData, analysisData, onDataGenerated]);

  // Initial setup
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
    console.log('File upload requested:', file);
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

  // Handle percentage formatting with proper null checks
  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'string') {
      if (value.includes('%')) return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      return `${(numValue * 100).toFixed(2)}%`;
    }
    
    if (typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    return null;
  };

  // UPDATED: Get thresholds from backend response
  const getThreshold = (metricKey, thresholds) => {
    if (!thresholds) return null;
    
    const thresholdMap = {
      'gross_margin': 'gross_margin',
      'operating_margin': 'operating_margin', 
      'ebitda_margin': 'ebitda',
      'net_margin': 'net_margin'
    };
    
    const thresholdKey = thresholdMap[metricKey];
    return thresholds[thresholdKey] || null;
  };

  // UPDATED: Color determination with threshold support
  const getMarginColor = (value, metricKey, thresholds) => {
    if (value === null || value === undefined || value === '') return '#e5e7eb';
    
    let numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '#e5e7eb';
    
    // Get threshold from backend or use default benchmarks
    const threshold = getThreshold(metricKey, thresholds);
    let benchmarkValue = null;
    
    if (threshold) {
      benchmarkValue = parseFloat(threshold.replace('%', '')) / 100;
    } else {
      // Fallback to default benchmarks
      const defaultBenchmarks = {
        'gross_margin': 0.4,
        'operating_margin': 0.15,
        'ebitda_margin': 0.2,
        'net_margin': 0.1
      };
      benchmarkValue = defaultBenchmarks[metricKey] || 0.1;
    }

    if (numValue >= benchmarkValue) return '#10b981'; // Good - Green
    if (numValue >= benchmarkValue * 0.7) return '#f59e0b'; // Fair - Orange
    return '#ef4444'; // Poor - Red
  };

  // UPDATED: Get status text with threshold support
  const getStatusText = (value, metricKey, thresholds) => {
    if (value === null || value === undefined || value === '') return null;
    
    let numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return null;
    
    const threshold = getThreshold(metricKey, thresholds);
    let benchmarkValue = null;
    
    if (threshold) {
      benchmarkValue = parseFloat(threshold.replace('%', '')) / 100;
    } else {
      const defaultBenchmarks = {
        'gross_margin': 0.4,
        'operating_margin': 0.15,
        'ebitda_margin': 0.2,
        'net_margin': 0.1
      };
      benchmarkValue = defaultBenchmarks[metricKey] || 0.1;
    }

    if (numValue >= benchmarkValue) return 'Excellent';
    if (numValue >= benchmarkValue * 0.7) return 'Good';
    return 'Needs Improvement';
  };

  // UPDATED: Convert snake_case to display names
  const getDisplayName = (key) => {
    const displayNames = {
      'gross_margin': 'Gross Margin',
      'operating_margin': 'Operating Margin', 
      'ebitda_margin': 'EBITDA Margin',
      'net_margin': 'Net Margin'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

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

  if (!analysisData || isProfitabilityDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
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
          onGenerateWithFile={() => handleRegenerate()} 
          onGenerateWithoutFile={() => handleRegenerate()} 
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          fileUploadMessage="Upload Excel files for detailed financial analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  // UPDATED: Extract data from new backend structure
  const profitabilityMetrics = analysisData.profitability;
  const thresholds = analysisData.threshold;
  
  console.log('Analysis data:', analysisData);
  console.log('Profitability metrics:', profitabilityMetrics);
  console.log('Thresholds:', thresholds);
  
  if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') {
    console.log('No valid profitability metrics found');
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="profitability"
          analysisDisplayName="Profitability Analysis"
          icon={TrendingUp}
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

  return (
    <div className="profitability-analysis" 
         data-analysis-type="profitability"
         data-analysis-name="Profitability Analysis"
         data-analysis-order="1">

      {/* Header */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Profitability Margins</h3>
            <p className="ch-section-subtitle">
              Key profitability metrics with industry benchmark comparisons
            </p>
          </div>

          {/* Check if all values are null and show warning */}
          {Object.values(profitabilityMetrics).every(value => value === null) && (
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

          {/* Profitability Metrics Grid */}
          <div className="profitability-metrics-grid">
            {Object.entries(profitabilityMetrics).map(([key, value]) => {
              const formattedValue = formatPercentage(value);
              const isNull = value === null || value === undefined || value === '';
              const displayName = getDisplayName(key);
              const color = getMarginColor(value, key, thresholds);
              const statusText = getStatusText(value, key, thresholds);
              
              return (
                <div key={key} className={`profitability-metric-card ${isNull ? 'no-data' : ''}`}>
                  <div className="profitability-metric-header">
                    <h4 className="profitability-metric-title">
                      {displayName}
                    </h4>
                    <Info size={16} color="#6b7280" title="Industry benchmark comparison" />
                  </div>
                  
                  <div 
                    className={`profitability-metric-value ${isNull ? 'no-data' : ''}`}
                    style={{ color: isNull ? '#9ca3af' : color }}
                  >
                    {isNull ? 'No Data' : formattedValue}
                  </div>
                  
                  {!isNull && statusText && (
                    <div className="profitability-metric-status">
                      <span 
                        className="profitability-status-indicator"
                        style={{ backgroundColor: color }}
                      ></span>
                      {statusText}
                    </div>
                  )}

                  {isNull && (
                    <div className="profitability-no-data-text">
                      Data not available in uploaded file
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanations */}
          <div className="profitability-explanations">
            <h4 className="profitability-explanations-title">
              Margin Explanations
            </h4>
            
            <div className="profitability-explanations-grid">
              <div className="profitability-explanation-item">
                <span className="profitability-explanation-label">Gross Margin:</span>
                <span className="profitability-explanation-text">
                  Revenue minus cost of goods sold, showing basic profitability
                </span>
              </div>
              <div className="profitability-explanation-item">
                <span className="profitability-explanation-label">Operating Margin:</span>
                <span className="profitability-explanation-text">
                  Profit after operating expenses, indicating operational efficiency
                </span>
              </div>
              <div className="profitability-explanation-item">
                <span className="profitability-explanation-label">EBITDA Margin:</span>
                <span className="profitability-explanation-text">
                  Earnings before interest, taxes, depreciation & amortization
                </span>
              </div>
              <div className="profitability-explanation-item">
                <span className="profitability-explanation-label">Net Margin:</span>
                <span className="profitability-explanation-text">
                  Final profit margin after all expenses and taxes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityAnalysis;