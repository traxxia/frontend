import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TrendingUp, Loader, Info, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useAnalysisStore } from "../store";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ProfitabilityAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  profitabilityData: propProfitabilityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument = false,
  uploadedFile = null,
  readOnly = false,
  documentInfo = null,
}) => {
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    profitabilityData: storeProfitabilityData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('profitabilityAnalysis');

  // Normalize data from store or props
  const analysisData = useMemo(() => {
    const rawData = propProfitabilityData || storeProfitabilityData;
    if (!rawData) return null;

    const normalized = rawData.profitability || 
                       rawData.profitability_analysis || 
                       rawData.profitabilityAnalysis || 
                       rawData.ProfitabilityAnalysis || 
                       (Object.keys(rawData).length > 0 && !rawData.profitability ? rawData : null);

    return normalized ? { profitability: normalized } : null;
  }, [propProfitabilityData, storeProfitabilityData]);

  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
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
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isProfitabilityDataIncomplete = useCallback((data) => {
    if (!data) return true;

    const profitabilityMetrics = data.profitability;

    if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') {
      return true;
    }

    const hasValidMetric = Object.entries(profitabilityMetrics).some(([key, value]) => {
      if (key.includes('_threshold') || key.includes('threshold') || key === 'citations') {
        return false;
      }
      const isValid = value !== null &&
        value !== undefined &&
        value !== '' &&
        !isNaN(parseFloat(value));
      return isValid;
    });

    return !hasValidMetric;
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        console.error('Error during regeneration:', error);
        setError('Failed to regenerate analysis. Please try again.');
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('profitabilityAnalysis', questions, userAnswers, selectedBusinessId);
      } catch (error) {
        console.error('Error during regeneration:', error);
        setError('Failed to regenerate analysis. Please try again.');
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

  // Helper function to get traffic light color based on value vs threshold
  const getTrafficLightColor = useCallback((value, threshold, isHigherBetter = true) => {
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
  }, []);

  // Helper function to parse percentage values
  const parsePercentageValue = useCallback((value) => {
    if (value === null || value === undefined || value === '' || value === 'NA') return 0;

    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[,$%]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }

    if (typeof value === 'number') {
      return value;
    }

    return 0;
  }, []);

  // Helper function to get citation URL for a metric
  const getCitationUrl = useCallback((metricKey, citations) => {
    if (!citations) return null;

    // Check for exact match first
    if (citations[metricKey]) return citations[metricKey];

    // Check for alternative keys
    const alternativeKeys = {
      'gross_margin': ['gross_margin'],
      'operating_margin': ['operating_margin'],
      'ebitda_margin': ['ebitda_margin', 'ebitda'],
      'net_margin': ['net_margin']
    };

    const possibleKeys = alternativeKeys[metricKey] || [metricKey];
    for (const key of possibleKeys) {
      if (citations[key]) return citations[key];
    }

    return null;
  }, []);

  // Paired Bar Chart Component
  const PairedBarChart = React.memo(({ metrics, thresholds, citations }) => {
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef(null);

    const chartData = useMemo(() => {
      return Object.entries(metrics)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => ({
          metric: key,
          actualValue: parsePercentageValue(value),
          benchmarkValue: parsePercentageValue(thresholds[key]),
          color: getTrafficLightColor(value, thresholds[key], true),
          hasData: value !== null && value !== undefined && value !== '',
          citationUrl: getCitationUrl(key.toLowerCase().replace(' ', '_'), citations)
        }));
    }, [metrics, thresholds, citations]);

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

    if (chartData.length === 0) {
      return null;
    }

    const maxValue = Math.max(
      ...chartData.map(d => Math.max(d.actualValue, d.benchmarkValue)),
      10
    );
    const chartHeight = chartData.length * 100 + 20;
    const chartWidth = containerWidth;
    const leftMargin = 140;
    const rightMargin = 60;
    const barHeight = 22;
    const groupSpacing = 100;

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          padding: '20px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{
            margin: 0,
            color: '#111827',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '-0.01em'
          }}>
            Profitability Metrics vs Benchmark
          </h3>

          <div style={{
            display: 'flex',
            gap: '12px',
            background: '#f9fafb',
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563' }}>Business</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '500', color: '#4b5563' }}>Benchmark</span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} style={{ minWidth: '500px', width: '100%' }}>
            <rect width={chartWidth} height={chartHeight} fill="#ffffff" />

            {chartData.map((data, index) => {
              const y = index * groupSpacing + 10;
              const barWidth = (chartWidth - leftMargin - rightMargin);

              const actualBarLength = (data.actualValue / maxValue) * barWidth;
              const benchmarkBarLength = (data.benchmarkValue / maxValue) * barWidth;

              return (
                <g key={data.metric}>
                  <text
                    x={leftMargin - 12}
                    y={y + 13}
                    textAnchor="end"
                    style={{
                      fontSize: '12px',
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
                    rx="3"
                    opacity={0.9}
                  />

                  <rect
                    x={leftMargin}
                    y={y + barHeight + 4}
                    width={benchmarkBarLength}
                    height={barHeight}
                    fill="#94a3b8"
                    rx="3"
                    opacity={0.35}
                  />

                  <text
                    x={leftMargin + actualBarLength + 6}
                    y={y + 15}
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      fill: data.color
                    }}
                  >
                    {data.actualValue.toFixed(1)}%
                  </text>

                  <text
                    x={leftMargin + benchmarkBarLength + 6}
                    y={y + barHeight + 19}
                    style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      fill: '#6b7280'
                    }}
                  >
                    {data.benchmarkValue.toFixed(1)}%
                  </text>

                  <CitationSource
                    url={data.citationUrl}
                    x={leftMargin}
                    y={y + barHeight * 2 + 15}
                  />

                  {index < chartData.length - 1 && (
                    <line
                      x1={0}
                      y1={y + barHeight * 2 + 32}
                      x2={chartWidth}
                      y2={y + barHeight * 2 + 32}
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
  });

  const handleFileUpload = useCallback((file) => {
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
  }, []);

  const removeFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getDisplayName = useCallback((key) => {
    const displayNames = {
      'gross_margin': 'Gross Margin',
      'operating_margin': 'Operating Margin',
      'ebitda_margin': 'EBITDA Margin',
      'ebitda': 'EBITDA Margin',
      'net_margin': 'Net Margin'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  }, []);

  const extractProfitabilityMetrics = useCallback((data) => {
    if (!data) {
      return { metrics: {}, thresholds: {}, citations: {} };
    }

    const profitabilityData = data.profitability;
    if (!profitabilityData) {
      return { metrics: {}, thresholds: {}, citations: {} };
    }
    const metrics = {};
    const thresholds = {};
    const citations = profitabilityData.citations || {};

    Object.entries(profitabilityData).forEach(([key, value]) => {
      if (key === 'citations') {
        return; // Skip citations object in this loop
      } else if (key.includes('_threshold') || key.includes('threshold')) {
        const baseKey = key.replace('_threshold', '').replace('threshold', '');
        const displayKey = getDisplayName(baseKey);
        thresholds[displayKey] = value;
      } else {
        const displayKey = getDisplayName(key);
        metrics[displayKey] = value;
      }
    });

    return { metrics, thresholds, citations };
  }, [getDisplayName]);

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
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          isUploading={false}
          documentInfo={documentInfo}
          readOnly={readOnly}
          fileUploadMessage="Upload Excel or CSV files with financial data for profitability analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          customMessage=" ."
        />
      );
    }

    const { metrics, thresholds, citations } = extractProfitabilityMetrics(analysisData);

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
          readOnly={readOnly}
          onFileUpload={handleFileUpload}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          fileUploadMessage="Upload Excel or CSV files with financial data for profitability analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          documentInfo={documentInfo}
        />
      );
    }

    // Show normal analysis content with paired bar chart and citations
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

          <PairedBarChart metrics={metrics} thresholds={thresholds} citations={citations} />

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

export default React.memo(ProfitabilityAnalysis);