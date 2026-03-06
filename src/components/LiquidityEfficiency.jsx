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
  businessName,
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

  const activeBusinessName = businessName || t('yourBusiness');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.liquidityEfficiency || {
      displayName: t('Liquidity_Efficiency'),
      customMessage: t('liquidity_efficiency_unlock_msg')
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
        setError(t('failed_to_generate'));
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
    if (metricType === 'Cash Conversion Cycle' || metricType === t('cash_conversion_cycle')) {
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
    const chartHeight = chartData.length * 120 + 40;
    const chartWidth = containerWidth;
    const leftMargin = 160; // Increased to prevent overlap
    const rightMargin = 60;
    const barHeight = 25;
    const groupSpacing = 120;

    const formatDisplayValue = (value, type) => {
      if (type === 'Cash Conversion Cycle' || type === t('cash_conversion_cycle')) {
        return `${value.toFixed(0)} ${t('days_label')}`;
      }
      return value.toFixed(2);
    };

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          padding: '24px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h3 style={{
            margin: 0,
            color: '#111827',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '-0.025em'
          }}>
            {t('liquidity_metrics_vs_benchmarks')}
          </h3>

          <div style={{
            display: 'flex',
            gap: '16px',
            background: '#f9fafb',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#4b5563' }}>{activeBusinessName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#4b5563' }}>{t('Industry_Average')}</span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} style={{ minWidth: '500px', width: '100%' }}>
            <rect width={chartWidth} height={chartHeight} fill="#ffffff" />

            {chartData.map((data, index) => {
              const y = index * groupSpacing + 20;
              const barWidth = (chartWidth - leftMargin - rightMargin);
              const actualBarLength = (data.actualValue / maxValue) * barWidth;
              const benchmarkBarLength = (data.benchmarkValue / maxValue) * barWidth;

              return (
                <g key={data.metric}>
                  <text
                    x={leftMargin - 15}
                    y={y + 15}
                    textAnchor="end"
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      fill: '#374151',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                  >
                    {data.metric}
                  </text>

                  <rect
                    x={leftMargin}
                    y={y}
                    width={actualBarLength}
                    height={barHeight}
                    fill={data.color}
                    rx="4"
                    opacity={0.9}
                  />

                  <rect
                    x={leftMargin}
                    y={y + barHeight + 4}
                    width={benchmarkBarLength}
                    height={barHeight}
                    fill="#94a3b8"
                    rx="4"
                    opacity={0.4}
                  />

                  <text
                    x={leftMargin + actualBarLength + 8}
                    y={y + 17}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      fill: data.color
                    }}
                  >
                    {formatDisplayValue(data.actualValue, data.type)}
                  </text>

                  <text
                    x={leftMargin + benchmarkBarLength + 8}
                    y={y + barHeight + 23}
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      fill: '#6b7280'
                    }}
                  >
                    {formatDisplayValue(data.benchmarkValue, data.type)}
                  </text>

                  <CitationSource
                    url={data.citationUrl}
                    x={leftMargin}
                    y={y + barHeight * 2 + 22}
                  />

                  {index < chartData.length - 1 && (
                    <line
                      x1={0}
                      y1={y + barHeight * 2 + 45}
                      x2={chartWidth}
                      y2={y + barHeight * 2 + 45}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
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
        setError(t('upload_excel_csv_error') || 'Please upload an Excel or CSV file.');
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
      'current_ratio': t('current_ratio'),
      'quick_ratio': t('quick_ratio'),
      'cash_conversion_cycle': t('cash_conversion_cycle')
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
          <span>{t('generating_liquidity_analysis')}</span>
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
            <h4 className="liquidity-efficiency__warning-title">{t('analysis_error')}</h4>
            <p className="liquidity-efficiency__warning-text">{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isLiquidityDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="liquidityEfficiency"
          analysisDisplayName={t('liquidity_analysis_display_name')}
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
          fileUploadMessage={t('liquidity_upload_msg')}
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
                <h4 className="liquidity-efficiency__warning-title">{t('no_liquidity_data_available')}</h4>
                <p className="liquidity-efficiency__warning-text">{t('upload_excel_required_ratios')}</p>
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