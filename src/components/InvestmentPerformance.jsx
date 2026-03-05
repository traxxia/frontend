import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const InvestmentPerformance = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  investmentData = null,
  investmentPerformanceData = null, // Unified prop support
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

  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.investmentPerformance || {
      displayName: 'Investment Performance',
      customMessage: 'Answer more questions to unlock detailed investment analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'investmentPerformance',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isInvestmentDataIncomplete = (data) => {
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
  const getTrafficLightColor = (value, threshold, isHigherBetter = true) => {
    if (!threshold || threshold === 'NA' || threshold === null || threshold === undefined) {
      return '#6b7280'; // Gray for NA
    }

    const numValue = parsePercentageValue(value);
    const numThreshold = parsePercentageValue(threshold);

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
  };

  // Helper function to get citation URL for a metric
  const getCitationUrl = (metricKey, citations) => {
    if (!citations) return null;
    const searchKey = metricKey.toLowerCase().replace(/\s*\(.*\)/, '').replace(/ /g, '_').trim();
    return citations[searchKey] || citations[metricKey] || null;
  };

  const parsePercentageValue = (value) => {
    if (value === null || value === undefined || value === '' || value === 'NA') return 0;
    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[,$%]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }
    return typeof value === 'number' ? value : 0;
  };

  const getDisplayName = (key) => {
    const displayNames = {
      'roa': 'ROA (Return on Assets)',
      'roe': 'ROE (Return on Equity)',
      'roic': 'ROIC (Return on Invested Capital)'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

  const getNormalizedData = (data) => {
    if (!data) return null;
    if (data.investment) return data.investment;
    if (data.roa || data.roe || data.roic) return data;
    const wrapper = data.investmentPerformance || data.investment_performance || data.InvestmentPerformance;
    if (wrapper) return wrapper.investment || wrapper;
    return null;
  };

  useEffect(() => {
    const rawData = investmentData || investmentPerformanceData;
    if (rawData) {
      const normalized = getNormalizedData(rawData);
      if (normalized) {
        setAnalysisData({ investment: normalized });
        setError(null);
        if (onDataGenerated) {
          onDataGenerated({ investment: normalized });
        }
      }
    }
  }, [investmentData, investmentPerformanceData, onDataGenerated]);

  const extractInvestmentMetrics = (data) => {
    const normalized = getNormalizedData(data);
    if (!normalized) return { metrics: {}, thresholds: {}, citations: {} };

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

    return { metrics, thresholds, citations };
  };

  // Paired Bar Chart Component
  const PairedBarChart = ({ metrics, thresholds, citations }) => {
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef(null);

    const chartData = Object.entries(metrics)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        metric: key,
        actualValue: parsePercentageValue(value),
        benchmarkValue: parsePercentageValue(thresholds[key]),
        color: getTrafficLightColor(value, thresholds[key], true),
        hasData: value !== null && value !== undefined && value !== '',
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
          Investment Performance vs Industry Benchmarks
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
                    {data.actualValue.toFixed(1)}%
                  </text>
                  <text x={leftMargin + benchmarkBarLength + 5} y={y + barHeight + 22} style={{ fontSize: '12px', fill: '#64748b' }}>
                    {data.benchmarkValue.toFixed(1)}%
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

  if (isRegenerating) {
    return (
      <div className="investment-container">
        <div className="investment-loading-state">
          <Loader size={24} className="investment-loading-spinner" />
          <span>Generating investment performance analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="investment-warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="investment-warning-title">Analysis Error</h4>
            <p className="investment-warning-text">{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="investmentPerformance"
          analysisDisplayName="Investment Performance Analysis"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={(f) => { }}
          uploadedFile={uploadedFile}
          onRemoveFile={() => { }}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          readOnly={readOnly}
          fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          documentInfo={documentInfo}
        />
      );
    }

    const { metrics, thresholds, citations } = extractInvestmentMetrics(analysisData);

    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          {Object.values(metrics).every(v => v === null) && (
            <div className="investment-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="investment-warning-title">No Investment Data Available</h4>
                <p className="investment-warning-text">Upload an Excel file or ensure your spreadsheet contains required investment metrics.</p>
              </div>
            </div>
          )}
          <PairedBarChart metrics={metrics} thresholds={thresholds} citations={citations} />
        </div>
      </div>
    );
  };

  return (
    <div className="investment-performance" data-analysis-type="investment-performance" data-analysis-name="Investment Performance" data-analysis-order="4">
      {renderContent()}
    </div>
  );
};

export default InvestmentPerformance;