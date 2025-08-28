import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader, Shield, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
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
    
    // Check if data has "Leverage & Risk" key (direct from API)
    if (data['Leverage & Risk']) {
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

  const getRiskColor = (value, type) => {
    if (value === null || value === undefined) return '#e5e7eb';
    
    // Risk-based color coding - traffic light system
    const riskLevels = {
      'Debt-to-Equity': { 
        low: 0.3,    // Green - Low risk
        medium: 1.0  // Yellow - Medium risk, above is Red - High risk
      },
      'Interest Coverage': { 
        low: 5.0,    // Green - Low risk (higher is better)
        medium: 2.5  // Yellow - Medium risk, below is Red - High risk
      }
    };

    const levels = riskLevels[type];
    if (!levels) return '#6b7280';

    if (type === 'Interest Coverage') {
      // For Interest Coverage, higher values are better (less risky)
      if (value >= levels.low) return '#10b981';      // Green
      if (value >= levels.medium) return '#f59e0b';   // Yellow
      return '#ef4444';                               // Red
    } else {
      // For Debt-to-Equity, lower values are better (less risky)
      if (value <= levels.low) return '#10b981';      // Green
      if (value <= levels.medium) return '#f59e0b';   // Yellow
      return '#ef4444';                               // Red
    }
  };

  const getRiskLevel = (value, type) => {
    if (value === null || value === undefined) return 'No Data';
    
    const color = getRiskColor(value, type);
    if (color === '#10b981') return 'Low Risk';
    if (color === '#f59e0b') return 'Medium Risk';
    return 'High Risk';
  };

  const formatRatio = (value, type) => {
    if (value === null || value === undefined) return null;
    
    if (type === 'Interest Coverage') {
      return `${value.toFixed(1)}x`;
    }
    return value.toFixed(2);
  };

  const TrafficLightIndicator = ({ color, label }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: `2px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}40`
      }}></div>
      <span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151'
      }}>
        {label}
      </span>
    </div>
  );

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
        <AnalysisEmptyState
          analysisType="leverageRisk"
          analysisDisplayName="Leverage & Risk"
          icon={AlertTriangle}
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
          fileUploadMessage="Upload Excel files for detailed leverage analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  // Extract leverage data with proper structure handling
  let leverageMetrics = null;
  
  // Handle different data structures from API
  if (analysisData['Leverage & Risk']) {
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
        <AnalysisEmptyState
          analysisType="leverageRisk"
          analysisDisplayName="Leverage & Risk"
          icon={AlertTriangle}
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
      data-analysis-type="leverage-risk"
      data-analysis-name="Leverage & Risk"
      data-analysis-order="5"
    >
      {/* Header */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Leverage & Risk Overview</h3>
            <p className="ch-section-subtitle">
              Financial risk assessment with traffic-light risk indicators
            </p>
          </div>

          {/* Check if all values are null and show warning */}
          {Object.values(leverageMetrics).every(value => value === null) && (
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
                  No Risk Data Available
                </h4>
                <p style={{ color: '#92400e', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required leverage ratios.
                </p>
              </div>
            </div>
          )}

          {/* Risk Metrics Grid */}
          <div className="leverage-risk-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {Object.entries(leverageMetrics).map(([key, value]) => {
              const color = getRiskColor(value, key);
              const riskLevel = getRiskLevel(value, key);
              const isNull = value === null || value === undefined;
              
              return (
                <div key={key} className="leverage-risk-card" style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  opacity: isNull ? 0.6 : 1
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#374151',
                      margin: 0
                    }}>
                      {key}
                    </h4>
                    {!isNull && (color === '#ef4444' ? <AlertTriangle size={20} color={color} /> : <Shield size={20} color={color} />)}
                  </div>
                  
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: isNull ? '#9ca3af' : color,
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    {isNull ? 'No Data' : formatRatio(value, key)}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    {!isNull ? (
                      <TrafficLightIndicator color={color} label={riskLevel} />
                    ) : (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        border: '2px dashed #d1d5db',
                        color: '#9ca3af',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Data not available
                      </div>
                    )}
                  </div>

                  {/* Risk explanation */}
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    {isNull ? 'Data not available in uploaded file' : (
                      key === 'Debt-to-Equity' 
                        ? 'Lower ratios indicate less financial risk'
                        : 'Higher ratios indicate better debt servicing ability'
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk Assessment Summary */}
          <div className="risk-summary" style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Shield size={20} />
              Overall Risk Assessment
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  margin: '0 auto 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  L
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Low Risk</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  margin: '0 auto 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  M
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Medium Risk</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  margin: '0 auto 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  H
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>High Risk</div>
              </div>
            </div>
          </div>

          {/* Risk Explanations */}
          <div className="leverage-explanations" style={{
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
              Risk Ratio Explanations
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>Debt-to-Equity Ratio:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Total Debt ÷ Total Equity. Low: &lt;0.3, Medium: 0.3-1.0, High: &gt;1.0
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Interest Coverage Ratio:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  EBIT ÷ Interest Expense. Low Risk: &gt;5x, Medium: 2.5-5x, High Risk: &lt;2.5x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeverageRisk;