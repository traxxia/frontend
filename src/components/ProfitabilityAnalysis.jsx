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

  const isProfitabilityDataIncomplete = (data) => {
    if (!data) return true;
    
    // UPDATED: Handle the nested structure from API response
    let profitabilityMetrics = null;
    
    // Check if data has the "Profitability" key (direct from API)
    if (data.Profitability) {
      profitabilityMetrics = data.Profitability;
    } 
    // Check if data has the "profitability" key (processed)
    else if (data.profitability) {
      profitabilityMetrics = data.profitability;
    }
    // Check if data has "metrics" key (alternative structure)
    else if (data.metrics) {
      profitabilityMetrics = data.metrics;
    }
    // If data is directly the metrics object
    else if (data && typeof data === 'object') {
      profitabilityMetrics = data;
    }
    
    if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') {
      return true;
    }
    
    // UPDATED: Check if at least one profitability metric has non-null value
    const hasValidMetric = Object.entries(profitabilityMetrics).some(([key, value]) => 
      value !== null && 
      value !== undefined &&
      value !== '' &&
      !isNaN(parseFloat(value))
    );
    
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

  // UPDATED: Handle null values and percentage formatting
  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') return null;
    
    // Handle string values that might be percentages already
    if (typeof value === 'string') {
      if (value.includes('%')) return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      return `${numValue.toFixed(2)}%`;
    }
    
    if (typeof value === 'number') {
      // If value is already a percentage (> 1), don't multiply by 100
      if (value > 1) {
        return `${value.toFixed(2)}%`;
      }
      return `${(value * 100).toFixed(2)}%`;
    }
    
    return null;
  };

  // UPDATED: Handle null values in color determination
  const getMarginColor = (value, type) => {
    if (value === null || value === undefined || value === '') return '#e5e7eb';
    
    // Convert string percentages to numbers
    let numValue = value;
    if (typeof value === 'string') {
      numValue = parseFloat(value.replace('%', ''));
      if (isNaN(numValue)) return '#e5e7eb';
      // Convert percentage to decimal if it was a string percentage
      if (value.includes('%')) {
        numValue = numValue / 100;
      }
    }
    
    // Industry benchmarks for color coding (as decimals)
    const benchmarks = {
      'Gross Margin': { good: 0.4, fair: 0.2 },
      'Operating Margin': { good: 0.15, fair: 0.05 },
      'EBITDA Margin': { good: 0.2, fair: 0.1 },
      'Net Margin': { good: 0.1, fair: 0.05 }
    };

    const benchmark = benchmarks[type];
    if (!benchmark) return '#6b7280';

    if (numValue >= benchmark.good) return '#10b981';
    if (numValue >= benchmark.fair) return '#f59e0b';
    return '#ef4444';
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

  // UPDATED: Extract profitability data with proper structure handling
  let profitabilityMetrics = null;
  
  // Handle different data structures from API
  if (analysisData.Profitability) {
    profitabilityMetrics = analysisData.Profitability;
  } else if (analysisData.profitability) {
    profitabilityMetrics = analysisData.profitability;
  } else if (analysisData.metrics) {
    profitabilityMetrics = analysisData.metrics;
  } else {
    profitabilityMetrics = analysisData;
  }
  
  // If still no valid data, show empty state
  if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') {
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

          {/* UPDATED: Check if all values are null and show warning */}
          {Object.values(profitabilityMetrics).every(value => value === null) && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 style={{ color: '#92400e', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  No Financial Data Available
                </h4>
                <p style={{ color: '#92400e', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required profitability metrics.
                </p>
              </div>
            </div>
          )}

          {/* Profitability Metrics Grid */}
          <div className="profitability-metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {Object.entries(profitabilityMetrics).map(([key, value]) => {
              const formattedValue = formatPercentage(value);
              const isNull = value === null || value === undefined || value === '';
              
              return (
                <div key={key} className="profitability-metric-card" style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  opacity: isNull ? 0.6 : 1
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#374151',
                      margin: 0
                    }}>
                      {key}
                    </h4>
                    <Info size={16} color="#6b7280" title="Industry benchmark comparison" />
                  </div>
                  
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: isNull ? '#9ca3af' : getMarginColor(value, key),
                    marginBottom: '8px'
                  }}>
                    {isNull ? 'No Data' : formattedValue}
                  </div>
                  
                  {!isNull && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getMarginColor(value, key)
                      }}></span>
                      {(() => {
                        let numValue = value;
                        if (typeof value === 'string') {
                          numValue = parseFloat(value.replace('%', ''));
                          if (value.includes('%')) numValue = numValue / 100;
                        }
                        return numValue >= 0.15 ? 'Excellent' : 
                               numValue >= 0.05 ? 'Good' : 'Needs Improvement';
                      })()}
                    </div>
                  )}

                  {isNull && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontStyle: 'italic'
                    }}>
                      Data not available in uploaded file
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanations */}
          <div className="profitability-explanations" style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px'
            }}>
              Margin Explanations
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>Gross Margin:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Revenue minus cost of goods sold, showing basic profitability
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Operating Margin:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Profit after operating expenses, indicating operational efficiency
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>EBITDA Margin:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Earnings before interest, taxes, depreciation & amortization
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Net Margin:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
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