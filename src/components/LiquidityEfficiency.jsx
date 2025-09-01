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

  const getRatioColor = (value, type) => {
    if (value === null || value === undefined) return 'gray-light';
    
    const benchmarks = {
      'Current Ratio': { good: 2.0, fair: 1.2 },
      'Quick Ratio': { good: 1.0, fair: 0.8 },
      'Cash Conversion Cycle': { good: 30, fair: 60 }
    };

    const benchmark = benchmarks[type];
    if (!benchmark) return 'gray-default';

    if (type === 'Cash Conversion Cycle') {
      if (value <= benchmark.good) return 'green';
      if (value <= benchmark.fair) return 'yellow';
      return 'red';
    } else {
      if (value >= benchmark.good) return 'green';
      if (value >= benchmark.fair) return 'yellow';
      return 'red';
    }
  };

  const getRatioStatus = (value, type) => {
    if (value === null || value === undefined) return 'No Data';
    
    const color = getRatioColor(value, type);
    if (color === 'green') return 'Excellent';
    if (color === 'yellow') return 'Good';
    return 'Needs Improvement';
  };

  const formatRatio = (value, type) => {
    if (value === null || value === undefined) return null;
    
    if (type === 'Cash Conversion Cycle') {
      return `${value.toFixed(0)} days`;
    }
    return value.toFixed(2);
  };

  const GaugeChart = ({ value, max, colorClass, title }) => {
    if (value === null || value === undefined) {
      return (
        <div className="gauge-chart gauge-chart--no-data">
          No Data
        </div>
      );
    }

    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="gauge-chart">
        <svg width="120" height="120" className="gauge-chart__svg">
          <circle
            cx="60"
            cy="60"
            r="45"
            className="gauge-chart__background"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            className={`gauge-chart__progress gauge-chart__progress--${colorClass}`}
            strokeDasharray={strokeDasharray}
          />
        </svg>
        <div className={`gauge-chart__value gauge-chart__value--${colorClass}`}>
          {title === 'Cash Conversion Cycle' ? `${value.toFixed(0)}d` : value.toFixed(1)}
        </div>
      </div>
    );
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
      const keyMappings = {
        'current_ratio': 'Current Ratio',
        'quick_ratio': 'Quick Ratio',
        'cash_conversion_cycle': 'Cash Conversion Cycle',
        'Current Ratio': 'Current Ratio',
        'Quick Ratio': 'Quick Ratio',
        'Cash Conversion Cycle': 'Cash Conversion Cycle'
      };

      Object.entries(liquidityMetrics).forEach(([key, value]) => {
        const displayKey = keyMappings[key] || key;
        transformedMetrics[displayKey] = value;
      });

      return transformedMetrics;
    }

    return liquidityMetrics;
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

  const liquidityMetrics = extractLiquidityMetrics(analysisData);

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

  const allMetricsNull = Object.values(liquidityMetrics).every(value => value === null);

  return (
    <div 
      className="channel-heatmap channel-heatmap-container liquidity-efficiency" 
      data-analysis-type="liquidity-efficiency"
      data-analysis-name="Liquidity & Efficiency"
      data-analysis-order="3"
    >
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {allMetricsNull && (
            <div className="liquidity-efficiency__warning">
              <AlertCircle size={20} />
              <div>
                <h4>No Liquidity Data Available</h4>
                <p>Upload an Excel file with financial data or ensure your spreadsheet contains the required liquidity ratios.</p>
              </div>
            </div>
          )}

          <div className="liquidity-efficiency__ratios-grid">
            {Object.entries(liquidityMetrics).map(([key, value]) => {
              const colorClass = getRatioColor(value, key);
              const maxValue = key === 'Cash Conversion Cycle' ? 120 : 3;
              const isNull = value === null || value === undefined;
              
              return (
                <div 
                  key={key} 
                  className={`liquidity-efficiency__ratio-card ${isNull ? 'liquidity-efficiency__ratio-card--null' : ''}`}
                >
                  <h4 className="liquidity-efficiency__ratio-title">{key}</h4>
                  
                  <GaugeChart 
                    value={value} 
                    max={maxValue} 
                    colorClass={colorClass}
                    title={key}
                  />
                  
                  <div className="liquidity-efficiency__ratio-details">
                    <div className={`liquidity-efficiency__ratio-value ${isNull ? 'liquidity-efficiency__ratio-value--null' : `liquidity-efficiency__ratio-value--${colorClass}`}`}>
                      {isNull ? 'No Data' : formatRatio(value, key)}
                    </div>
                    
                    {!isNull ? (
                      <div className="liquidity-efficiency__ratio-status">
                        <span className={`liquidity-efficiency__status-indicator liquidity-efficiency__status-indicator--${colorClass}`}></span>
                        {getRatioStatus(value, key)}
                      </div>
                    ) : (
                      <div className="liquidity-efficiency__ratio-message">
                        Data not available in uploaded file
                      </div>
                    )}
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

export default LiquidityEfficiency;