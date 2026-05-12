import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from "../store";
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
const getTrafficLightColor = (value, threshold, metricType) => {
  if (!threshold || threshold === 'NA' || threshold === null || threshold === undefined) {
    return '#6b7280';
  }
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[,$%]/g, '')) : value;
  const numThreshold = typeof threshold === 'string' ? parseFloat(threshold.replace(/[,$%]/g, '')) : threshold;
  if (isNaN(numValue) || isNaN(numThreshold)) {
    return '#6b7280';
  }
  if (metricType === 'Interest Coverage') {
    if (numValue >= numThreshold * 1.1) return '#10b981';
    if (numValue >= numThreshold * 0.9) return '#f59e0b';
    return '#ef4444';
  } else {
    if (numValue <= numThreshold * 0.9) return '#10b981';
    if (numValue <= numThreshold * 1.1) return '#f59e0b';
    return '#ef4444';
  }
};
const getCitationUrl = (metricKey, citations) => {
  if (!citations) return null;
  const searchKey = metricKey.toLowerCase().replace(/-/g, '_').replace(/ /g, '_').trim();
  return citations[searchKey] || citations[metricKey] || null;
};
const getDisplayName = key => {
  const displayNames = {
    'debt_to_equity': 'Debt-to-Equity',
    'interest_coverage': 'Interest Coverage'
  };
  return displayNames[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
const getNormalizedData = data => {
  if (!data) return null;
  if (data.leverage) return data.leverage;
  if (data.debt_to_equity && data.interest_coverage) return data;
  const wrapper = data.leverageRisk || data.leverage_risk || data.LeverageRisk;
  if (wrapper) return wrapper.leverage || wrapper;
  return null;
};
const parseRatioValue = val => {
  if (val === null || val === undefined || val === '' || val === 'NA') return 0;
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[,$%]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return typeof val === 'number' ? val : 0;
};
const extractLeverageMetrics = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return {
    metrics: {},
    thresholds: {},
    citations: {}
  };
  const metrics = {};
  const thresholds = {};
  const citations = normalized.citations || {};
  Object.entries(normalized).forEach(([key, value]) => {
    if (key === 'citations') return;
    if (key.includes('_threshold') || key.includes('threshold')) {
      const baseKey = key.replace('_threshold', '').replace('threshold', '');
      const displayKey = getDisplayName(baseKey);
      thresholds[displayKey] = value;
    } else {
      const displayKey = getDisplayName(key);
      metrics[displayKey] = value;
    }
  });
  return {
    metrics,
    thresholds,
    citations
  };
};
const isLeverageDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  const hasValidMetric = Object.entries(normalized).some(([key, value]) => {
    if (key.includes('_threshold') || key.includes('threshold') || key === 'citations') {
      return false;
    }
    return value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value));
  });
  return !hasValidMetric;
};
const PairedBarChart = React.memo(({
  metrics,
  thresholds,
  citations,
  activeBusinessName
}) => {
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef(null);
  const chartData = useMemo(() => {
    return Object.entries(metrics).filter(([key, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => ({
      metric: key,
      actualValue: parseRatioValue(value),
      benchmarkValue: parseRatioValue(thresholds[key]),
      color: getTrafficLightColor(value, thresholds[key], key),
      hasData: value !== null && value !== undefined && value !== '',
      type: key,
      citationUrl: getCitationUrl(key, citations)
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
  if (chartData.length === 0) return null;
  const maxValue = Math.max(...chartData.map(d => Math.max(d.actualValue, d.benchmarkValue)), 10);
  const chartHeight = chartData.length * 100 + 20;
  const chartWidth = containerWidth;
  const leftMargin = 140;
  const rightMargin = 60;
  const barHeight = 22;
  const groupSpacing = 100;
  return <div ref={containerRef} className="leverage-risk--s1">
      <div className="leverage-risk--s2">
        <h3 className="leverage-risk--s3">
          Leverage & Risk Metrics vs Benchmark
        </h3>

        <div className="leverage-risk--s4">
          <div className="leverage-risk--s5">
            <div className="leverage-risk--s6"></div>
            <span className="leverage-risk--s7">{activeBusinessName}</span>
          </div>
          <div className="leverage-risk--s5">
            <div className="leverage-risk--s8"></div>
            <span className="leverage-risk--s7">Benchmark</span>
          </div>
        </div>
      </div>

      <div className="leverage-risk--s9">
        <svg width={chartWidth} height={chartHeight} className="leverage-risk--s10">
          <rect width={chartWidth} height={chartHeight} fill="#ffffff" />

          {chartData.map((data, index) => {
          const y = index * groupSpacing + 10;
          const barWidth = chartWidth - leftMargin - rightMargin;
          const actualBarLength = data.actualValue / maxValue * barWidth;
          const benchmarkBarLength = data.benchmarkValue / maxValue * barWidth;
          return <g key={data.metric}>
                <text x={leftMargin - 12} y={y + 13} textAnchor="end" fontSize="12" fontWeight="500" fill="#374151" fontFamily="Inter, system-ui, sans-serif">
                  {data.metric}
                </text>

                <rect x={leftMargin} y={y} width={actualBarLength} height={barHeight} fill={data.color} rx="3" fillOpacity="0.9" />

                <rect x={leftMargin} y={y + barHeight + 4} width={benchmarkBarLength} height={barHeight} fill="#94a3b8" rx="3" fillOpacity="0.35" />

                <text x={leftMargin + actualBarLength + 6} y={y + 15} fontSize="11" fontWeight="600" fill={data.color} fontFamily="Inter, system-ui, sans-serif">
                  {data.actualValue.toFixed(2)}
                </text>

                <text x={leftMargin + benchmarkBarLength + 6} y={y + barHeight + 19} fontSize="11" fontWeight="500" fill="#6b7280" fontFamily="Inter, system-ui, sans-serif">
                  {data.benchmarkValue.toFixed(2)}
                </text>

                <CitationSource url={data.citationUrl} x={leftMargin} y={y + barHeight * 2 + 15} />

                {index < chartData.length - 1 && <line x1={0} y1={y + barHeight * 2 + 32} x2={chartWidth} y2={y + barHeight * 2 + 32} stroke="#f3f4f6" strokeWidth="1" />}
              </g>;
        })}
        </svg>
      </div>
    </div>;
});
const LeverageRisk = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  leverageData = null,
  leverageRiskData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument = false,
  readOnly = false,
  documentInfo = null
}) => {
  const {
    t
  } = useTranslation();
  const {
    leverageRiskData: storeLeverageData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('leverageRisk');
  const analysisData = useMemo(() => {
    const rawData = leverageData || leverageRiskData || storeLeverageData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      leverage: normalized
    } : null;
  }, [leverageData, leverageRiskData, storeLeverageData]);
  const [error, setError] = useState(null);
  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);
  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.leverageRisk || {
      displayName: 'Leverage & Risk',
      customMessage: 'Answer more questions to unlock detailed leverage analysis'
    };
    await checkMissingQuestionsAndRedirect('leverageRisk', selectedBusinessId, handleRedirectToBrief, {
      displayName: analysisConfig.displayName,
      customMessage: analysisConfig.customMessage
    });
  }, [selectedBusinessId, handleRedirectToBrief]);
  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        setError('Failed to regenerate analysis. Please try again.');
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('leverageRisk', questions, userAnswers, selectedBusinessId);
      } catch (error) {
        setError('Failed to regenerate analysis. Please try again.');
        console.error('Error during regeneration:', error);
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);
  if (isRegenerating) {
    return <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating leverage & risk analysis...</span>
        </div>
      </div>;
  }
  const renderContent = () => {
    if (error) {
      return <div className="leverage-risk__warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="leverage-risk__warning-title">Analysis Error</h4>
            <p className="leverage-risk__warning-text">{error}</p>
          </div>
        </div>;
    }
    if (!analysisData || isLeverageDataIncomplete(analysisData)) {
      return <FinancialEmptyState analysisType="leverageRisk" analysisDisplayName="Leverage & Risk Analysis" icon={AlertTriangle} onImproveAnswers={handleMissingQuestionsCheck} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} readOnly={readOnly} canRegenerate={canRegenerate} userAnswers={userAnswers} minimumAnswersRequired={3} showFileUpload={true} onFileUpload={f => {}} uploadedFile={uploadedFile} onRemoveFile={() => {}} onRedirectToChat={onRedirectToChat} isMobile={isMobile} setActiveTab={setActiveTab} hasUploadedDocument={hasUploadedDocument} fileUploadMessage="Upload Excel or CSV files with financial data for leverage & risk analysis" acceptedFileTypes=".xlsx,.xls,.csv" documentInfo={documentInfo} />;
    }
    const {
      metrics,
      thresholds,
      citations
    } = extractLeverageMetrics(analysisData);
    return <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          {Object.values(metrics).every(v => v === null) && <div className="leverage-risk__warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="leverage-risk__warning-title">No Risk Data Available</h4>
                <p className="leverage-risk__warning-text">Upload an Excel file or ensure your spreadsheet contains required leverage ratios.</p>
              </div>
            </div>}
          <PairedBarChart metrics={metrics} thresholds={thresholds} citations={citations} activeBusinessName={businessName || t('yourBusiness')} />
        </div>
      </div>;
  };
  const memoizedContent = renderContent();
  return <div className="leverage-risk" data-analysis-type="leverage-risk" data-analysis-name="Leverage & Risk" data-analysis-order="5">
      {memoizedContent}
    </div>;
};
export default React.memo(LeverageRisk);