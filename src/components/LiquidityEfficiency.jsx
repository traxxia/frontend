import React, { useState, useEffect, useRef } from 'react';
import { Activity, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
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

  // UPDATED: Handle the new API structure
  const isLiquidityDataIncomplete = (data) => {
    if (!data) return true;
    
    // Handle different data structures from API
    let liquidityMetrics = null;
    
    // Check if data has "Liquidity & Efficiency" key (direct from API)
    if (data['Liquidity & Efficiency']) {
      liquidityMetrics = data['Liquidity & Efficiency'];
    }
    // Check if data has nested liquidityEfficiency key (processed)
    else if (data.liquidityEfficiency) {
      liquidityMetrics = data.liquidityEfficiency;
    }
    // If data is directly the metrics object
    else if (data && typeof data === 'object') {
      liquidityMetrics = data;
    }
    
    if (!liquidityMetrics || typeof liquidityMetrics !== 'object') {
      return true;
    }
    
    // Check if at least one ratio has non-null value
    const hasValidRatio = Object.entries(liquidityMetrics).some(([key, value]) => 
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

  // UPDATED: Handle null values in color determination
  const getRatioColor = (value, type) => {
    if (value === null || value === undefined) return '#e5e7eb';
    
    // Industry benchmarks for color coding
    const benchmarks = {
      'Current Ratio': { good: 2.0, fair: 1.2 },
      'Quick Ratio': { good: 1.0, fair: 0.8 },
      'Cash Conversion Cycle': { good: 30, fair: 60 } // Lower is better for CCC
    };

    const benchmark = benchmarks[type];
    if (!benchmark) return '#6b7280';

    if (type === 'Cash Conversion Cycle') {
      // For CCC, lower values are better
      if (value <= benchmark.good) return '#10b981';
      if (value <= benchmark.fair) return '#f59e0b';
      return '#ef4444';
    } else {
      // For other ratios, higher values are better
      if (value >= benchmark.good) return '#10b981';
      if (value >= benchmark.fair) return '#f59e0b';
      return '#ef4444';
    }
  };

  const getRatioStatus = (value, type) => {
    if (value === null || value === undefined) return 'No Data';
    
    const color = getRatioColor(value, type);
    if (color === '#10b981') return 'Excellent';
    if (color === '#f59e0b') return 'Good';
    return 'Needs Improvement';
  };

  const formatRatio = (value, type) => {
    if (value === null || value === undefined) return null;
    
    if (type === 'Cash Conversion Cycle') {
      return `${value.toFixed(0)} days`;
    }
    return value.toFixed(2);
  };

  // UPDATED: Enhanced gauge chart with null handling
  const GaugeChart = ({ value, max, color, title }) => {
    if (value === null || value === undefined) {
      return (
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: '#f3f4f6',
          border: '2px dashed #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          No Data
        </div>
      );
    }

    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 600,
          color: color
        }}>
          {title === 'Cash Conversion Cycle' ? `${value.toFixed(0)}d` : value.toFixed(1)}
        </div>
      </div>
    );
  };

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

  if (!analysisData || isLiquidityDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="liquidityEfficiency"
          analysisDisplayName="Liquidity & Efficiency"
          icon={Activity}
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
          fileUploadMessage="Upload Excel files for detailed liquidity analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  // UPDATED: Extract liquidity data with proper structure handling
  let liquidityMetrics = null;
  
  // Handle different data structures from API
  if (analysisData['Liquidity & Efficiency']) {
    liquidityMetrics = analysisData['Liquidity & Efficiency'];
  } else if (analysisData.liquidityEfficiency) {
    liquidityMetrics = analysisData.liquidityEfficiency;
  } else {
    liquidityMetrics = analysisData;
  }

  // If still no valid data, show empty state
  if (!liquidityMetrics || typeof liquidityMetrics !== 'object') {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="liquidityEfficiency"
          analysisDisplayName="Liquidity & Efficiency"
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

  return (
    <div 
      className="channel-heatmap channel-heatmap-container" 
      data-analysis-type="liquidity-efficiency"
      data-analysis-name="Liquidity & Efficiency"
      data-analysis-order="3"
    >
      {/* Header */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Liquidity & Operational Efficiency</h3>
            <p className="ch-section-subtitle">
              Key ratios with industry benchmarks and color-coded performance indicators
            </p>
          </div>

          {/* UPDATED: Check if all values are null and show warning */}
          {Object.values(liquidityMetrics).every(value => value === null) && (
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
                  No Liquidity Data Available
                </h4>
                <p style={{ color: '#92400e', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required liquidity ratios.
                </p>
              </div>
            </div>
          )}

          {/* Ratio Gauges */}
          <div className="liquidity-ratios-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {Object.entries(liquidityMetrics).map(([key, value]) => {
              const color = getRatioColor(value, key);
              const maxValue = key === 'Cash Conversion Cycle' ? 120 : 3;
              const isNull = value === null || value === undefined;
              
              return (
                <div key={key} className="liquidity-ratio-card" style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: isNull ? 0.6 : 1
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#374151',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    {key}
                  </h4>
                  
                  <GaugeChart 
                    value={value} 
                    max={maxValue} 
                    color={color}
                    title={key}
                  />
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: isNull ? '#9ca3af' : color,
                      marginBottom: '4px'
                    }}>
                      {isNull ? 'No Data' : formatRatio(value, key)}
                    </div>
                    
                    {!isNull ? (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color
                        }}></span>
                        {getRatioStatus(value, key)}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        Data not available in uploaded file
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ratio Explanations */}
          <div className="liquidity-explanations" style={{
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
              Ratio Explanations & Benchmarks
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>Current Ratio:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Current Assets ÷ Current Liabilities. Target: &gt;2.0 (Excellent), &gt;1.2 (Good)
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Quick Ratio:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  (Current Assets - Inventory) ÷ Current Liabilities. Target: &gt;1.0 (Excellent), &gt;0.8 (Good)
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Cash Conversion Cycle:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Days to convert investments back to cash. Target: &lt;30 days (Excellent), &lt;60 days (Good)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityEfficiency;