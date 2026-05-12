import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TrendingUp, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useAnalysisStore } from "../store";
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
const getTrafficLightColor = (value, threshold, isHigherBetter = true) => {
  if (!threshold || threshold === 'NA' || threshold === null || threshold === undefined) {
    return '#6b7280';
  }
  const numValue = parsePercentageValue(value);
  const numThreshold = parsePercentageValue(threshold);
  if (isNaN(numValue) || isNaN(numThreshold)) {
    return '#6b7280';
  }
  if (isHigherBetter) {
    if (numValue >= numThreshold * 1.1) return '#10b981';
    if (numValue >= numThreshold * 0.9) return '#f59e0b';
    return '#ef4444';
  } else {
    if (numValue <= numThreshold * 0.9) return '#10b981';
    if (numValue <= numThreshold * 1.1) return '#f59e0b';
    return '#ef4444';
  }
};
const parsePercentageValue = value => {
  if (value === null || value === undefined || value === '' || value === 'NA') return 0;
  if (typeof value === 'string') {
    const numValue = parseFloat(value.replace(/[,$%]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  }
  return typeof value === 'number' ? value : 0;
};
const getDisplayName = key => {
  const displayNames = {
    'roa': 'ROA (Return on Assets)',
    'roe': 'ROE (Return on Equity)',
    'roic': 'ROIC (Return on Invested Capital)'
  };
  return displayNames[key] || key.replace('_', ' ').toUpperCase();
};
const getNormalizedData = data => {
  if (!data) return null;
  if (data.investment) return data.investment;
  if (data.roa || data.roe || data.roic) return data;
  const wrapper = data.investmentPerformance || data.investment_performance || data.InvestmentPerformance;
  if (wrapper) return wrapper.investment || wrapper;
  return null;
};
const getCitationUrl = (metricKey, citations) => {
  if (!citations) return null;
  const searchKey = metricKey.toLowerCase().replace(/\s*\(.*\)/, '').replace(/ /g, '_').trim();
  return citations[searchKey] || citations[metricKey] || null;
};
const extractInvestmentMetrics = data => {
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
const PairedBarChart = React.memo(({
  metrics,
  thresholds,
  citations
}) => {
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef(null);
  const chartData = useMemo(() => {
    return Object.entries(metrics).filter(([key, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => ({
      metric: key,
      actualValue: parsePercentageValue(value),
      benchmarkValue: parsePercentageValue(thresholds[key]),
      color: getTrafficLightColor(value, thresholds[key], true),
      hasData: value !== null && value !== undefined && value !== '',
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
  return <div ref={containerRef} className="investment-performance--s1">
      <div className="investment-performance--s2">
        <h3 className="investment-performance--s3">
          Investment Performance vs Benchmark
        </h3>

        <div className="investment-performance--s4">
          <div className="investment-performance--s5">
            <div className="investment-performance--s6"></div>
            <span className="investment-performance--s7">Business</span>
          </div>
          <div className="investment-performance--s5">
            <div className="investment-performance--s8"></div>
            <span className="investment-performance--s7">Benchmark</span>
          </div>
        </div>
      </div>

      <div className="investment-performance--s9">
        <svg width={chartWidth} height={chartHeight} className="investment-performance--s10">
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
                  {data.actualValue.toFixed(1)}%
                </text>

                <text x={leftMargin + benchmarkBarLength + 6} y={y + barHeight + 19} fontSize="11" fontWeight="500" fill="#6b7280" fontFamily="Inter, system-ui, sans-serif">
                  {data.benchmarkValue.toFixed(1)}%
                </text>

                <CitationSource url={data.citationUrl} x={leftMargin} y={y + barHeight * 2 + 15} />

                {index < chartData.length - 1 && <line x1={0} y1={y + barHeight * 2 + 32} x2={chartWidth} y2={y + barHeight * 2 + 32} stroke="#f3f4f6" strokeWidth="1" />}
              </g>;
        })}
        </svg>
      </div>
    </div>;
});
const isInvestmentDataIncomplete = data => {
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
const InvestmentPerformance = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  investmentData = null,
  investmentPerformanceData = null,
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
    investmentPerformanceData: storeInvestmentData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('investmentPerformance');
  const analysisData = useMemo(() => {
    const rawData = investmentData || investmentPerformanceData || storeInvestmentData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      investment: normalized
    } : null;
  }, [investmentData, investmentPerformanceData, storeInvestmentData]);
  const [error, setError] = useState(null);
  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);
  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.investmentPerformance || {
      displayName: 'Investment Performance',
      customMessage: 'Answer more questions to unlock detailed investment analysis'
    };
    await checkMissingQuestionsAndRedirect('investmentPerformance', selectedBusinessId, handleRedirectToBrief, {
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
        await regenerateIndividualAnalysis('investmentPerformance', questions, userAnswers, selectedBusinessId);
      } catch (error) {
        setError('Failed to regenerate analysis. Please try again.');
        console.error('Error during regeneration:', error);
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);
  const renderContent = () => {
    if (error) {
      return <div className="investment-warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="investment-warning-title">Analysis Error</h4>
            <p className="investment-warning-text">{error}</p>
          </div>
        </div>;
    }
    if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
      return <FinancialEmptyState analysisType="investmentPerformance" analysisDisplayName="Investment Performance Analysis" icon={TrendingUp} onImproveAnswers={handleMissingQuestionsCheck} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} canRegenerate={canRegenerate} userAnswers={userAnswers} minimumAnswersRequired={3} showFileUpload={true} onFileUpload={f => {}} uploadedFile={uploadedFile} onRemoveFile={() => {}} onRedirectToChat={onRedirectToChat} isMobile={isMobile} setActiveTab={setActiveTab} hasUploadedDocument={hasUploadedDocument} readOnly={readOnly} fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis" acceptedFileTypes=".xlsx,.xls,.csv" documentInfo={documentInfo} />;
    }
    const {
      metrics,
      thresholds,
      citations
    } = extractInvestmentMetrics(analysisData);
    return <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          {Object.values(metrics).every(v => v === null) && <div className="investment-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="investment-warning-title">No Investment Data Available</h4>
                <p className="investment-warning-text">Upload an Excel file or ensure your spreadsheet contains required investment metrics.</p>
              </div>
            </div>}
          <PairedBarChart metrics={metrics} thresholds={thresholds} citations={citations} />
        </div>
      </div>;
  };
  const memoizedContent = renderContent();
  if (isRegenerating) {
    return <div className="investment-container">
        <div className="investment-loading-state">
          <Loader size={24} className="investment-loading-spinner" />
          <span>Generating investment performance analysis...</span>
        </div>
      </div>;
  }
  return <div className="investment-performance" data-analysis-type="investment-performance" data-analysis-name="Investment Performance" data-analysis-order="4">
      {memoizedContent}
    </div>;
};
export default React.memo(InvestmentPerformance);