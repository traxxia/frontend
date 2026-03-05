import React, { useState, useEffect, useRef } from 'react';
import { Activity, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
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
  liquidityEfficiencyData = null, // Unified prop support
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument = false,
  readOnly = false,
  documentInfo = null,
}) => {
  const [analysisData, setAnalysisData] = useState(null);
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
    const normalized = getNormalizedData(data);
    if (!normalized) return true;

    const hasValidRatio = Object.entries(normalized).some(([key, value]) => {
      if (key.includes('_threshold') || key.includes('threshold') || key === 'citations') {
        return false;
      }
      return value !== null && value !== undefined && !isNaN(parseFloat(value));
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

  // Helper function to parse ratio values
  const parseRatioValue = (value, type) => {
    if (value === null || value === undefined || value === '' || value === 'NA') return 0;

    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[,$%days ]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }

    if (typeof value === 'number') {
      return value;
    }

    return 0;
  };

  // Helper function to get citation URL for a metric
  const getCitationUrl = (metricKey, citations) => {
    if (!citations) return null;
    const searchKey = metricKey.toLowerCase().replace(/ /g, '_');
    return citations[searchKey] || citations[metricKey] || null;
  };

  // Paired Bar Chart Component
  const PairedBarChart = ({ metrics, thresholds, citations }) => {
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef(null);

    const chartData = Object.entries(metrics)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        metric: key,
        actualValue: parseRatioValue(value, key),
        benchmarkValue: parseRatioValue(thresholds[key], key),
        color: getTrafficLightColor(value, thresholds[key], key),
        hasData: value !== null && value !== undefined && value !== '',
        type: key,
        citationUrl: getCitationUrl(key, citations)
      }));

    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth - 40;
          setContainerWidth(Math.max(width, 500));
        }
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    if (chartData.length === 0) return null;

    const maxValue = Math.max(...chartData.map(d => Math.max(d.actualValue, d.benchmarkValue)), 10);
    const chartHeight = chartData.length * 120 + 60;
    const chartWidth = containerWidth;
    const leftMargin = 120;
    const rightMargin = 60;
    const barHeight = 25;
    const groupSpacing = 120;

    const formatDisplayValue = (value, type) => {
      if (type === 'Cash Conversion Cycle') {
        return `${value.toFixed(0)} days`;
      }
      return value.toFixed(2);
    };

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
        <h3 style={{ marginBottom: '20px', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
          Liquidity & Efficiency Metrics vs Industry Benchmarks
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} style={{ minWidth: '500px', width: '100%' }}>
            <rect width={chartWidth} height={chartHeight} fill="#fafafa" stroke="#e5e7eb" strokeWidth="1" />

            {chartData.map((data, index) => {
              const y = index * groupSpacing + 30;
              const barWidth = (chartWidth - leftMargin - rightMargin);
              const actualBarLength = (data.actualValue / maxValue) * barWidth;
              const benchmarkBarLength = (data.benchmarkValue / maxValue) * barWidth;

              return (
                <g key={data.metric}>
                  <text x={leftMargin - 10} y={y + 15} textAnchor="end" style={{ fontSize: '14px', fontWeight: '500', fill: '#374151' }}>
                    {data.metric}
                  </text>
                  <rect x={leftMargin} y={y} width={actualBarLength} height={barHeight} fill={data.color} opacity={0.8} />
                  <rect x={leftMargin} y={y + barHeight + 5} width={benchmarkBarLength} height={barHeight} fill="#94a3b8" opacity={0.6} />
                  <text x={leftMargin + actualBarLength + 5} y={y + 17} style={{ fontSize: '12px', fontWeight: '500', fill: data.color }}>
                    {formatDisplayValue(data.actualValue, data.type)}
                  </text>
                  <text x={leftMargin + benchmarkBarLength + 5} y={y + barHeight + 22} style={{ fontSize: '12px', fill: '#64748b' }}>
                    {formatDisplayValue(data.benchmarkValue, data.type)}
                  </text>
                  <CitationSource url={data.citationUrl} x={leftMargin} y={y + barHeight * 2 + 20} />
                  <line x1={leftMargin} y1={y + barHeight * 2 + 40} x2={chartWidth - rightMargin} y2={y + barHeight * 2 + 40} stroke="#e5e7eb" strokeWidth="1" opacity={0.3} />
                </g>
              );
            })}

            <g transform={`translate(${leftMargin}, ${chartHeight - 30})`}>
              <rect x="0" y="0" width="15" height="15" fill="#10b981" opacity={0.8} />
              <text x="20" y="12" style={{ fontSize: '12px', fill: '#374151' }}>Your Business</text>
              <rect x="120" y="0" width="15" height="15" fill="#94a3b8" opacity={0.6} />
              <text x="140" y="12" style={{ fontSize: '12px', fill: '#374151' }}>Industry Average</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  const getNormalizedData = (data) => {
    if (!data) return null;
    if (data.liquidity) return data.liquidity;
    if (data.current_ratio && data.quick_ratio) return data;
    const wrapper = data.liquidityEfficiency || data.liquidity_efficiency || data.LiquidityEfficiency;
    if (wrapper) return wrapper.liquidity || wrapper;
    return null;
  };

  useEffect(() => {
    const rawData = liquidityData || liquidityEfficiencyData;
    if (rawData) {
      const normalized = getNormalizedData(rawData);
      if (normalized) {
        setAnalysisData({ liquidity: normalized });
        setError(null);
        if (onDataGenerated) {
          onDataGenerated({ liquidity: normalized });
        }
      }
    }
  }, [liquidityData, liquidityEfficiencyData, onDataGenerated]);

  const handleFileUpload = (file) => {
    if (file) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (allowedTypes.includes(file.type)) {
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractLiquidityMetrics = (data) => {
    const normalized = getNormalizedData(data);
    if (!normalized) return { metrics: {}, thresholds: {}, citations: {} };

    const transformedMetrics = {};
    const thresholds = {};
    const citations = normalized.citations || {};

    const keyMappings = {
      'current_ratio': 'Current Ratio',
      'quick_ratio': 'Quick Ratio',
      'cash_conversion_cycle': 'Cash Conversion Cycle'
    };

    Object.entries(normalized).forEach(([key, value]) => {
      if (key === 'citations') return;

      if (key.includes('_threshold') || key.includes('threshold')) {
        const baseKey = key.replace('_threshold', '').replace('threshold', '');
        const displayKey = keyMappings[baseKey] || baseKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        thresholds[displayKey] = value;
      } else {
        const displayKey = keyMappings[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        transformedMetrics[displayKey] = value;
      }
    });

    return { metrics: transformedMetrics, thresholds, citations };
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

  const renderContent = () => {
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
          readOnly={readOnly}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          fileUploadMessage="Upload Excel or CSV files with financial data for liquidity & efficiency analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          documentInfo={documentInfo}
        />
      );
    }

    const { metrics: liquidityMetrics, thresholds, citations } = extractLiquidityMetrics(analysisData);

    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          {Object.values(liquidityMetrics).every(value => value === null) && (
            <div className="liquidity-efficiency__warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="liquidity-efficiency__warning-title">No Liquidity Data Available</h4>
                <p className="liquidity-efficiency__warning-text">Upload an Excel file or ensure your spreadsheet contains required ratios.</p>
              </div>
            </div>
          )}
          <PairedBarChart metrics={liquidityMetrics} thresholds={thresholds} citations={citations} />
        </div>
      </div>
    );
  };

  return (
    <div className="liquidity-efficiency" data-analysis-type="liquidity-efficiency" data-analysis-name="Liquidity & Efficiency" data-analysis-order="3">
      {renderContent()}
    </div>
  );
};

export default LiquidityEfficiency;