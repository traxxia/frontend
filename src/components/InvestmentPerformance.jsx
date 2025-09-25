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
  const [analysisData, setAnalysisData] = useState(investmentData);
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
    if (!data || !data.investment) {
      return true;
    }

    const investmentMetrics = data.investment;

    if (!investmentMetrics || typeof investmentMetrics !== 'object') {
      return true;
    }

    const hasValidMetric = Object.entries(investmentMetrics).some(([key, value]) => {
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

  // Helper function to get traffic light color based on value vs threshold
  const getTrafficLightColor = (value, threshold, isHigherBetter = true) => {
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
  };

  // Helper function to get citation URL for a metric
  const getCitationUrl = (metricKey, citations) => {
    if (!citations) return null;

    // Check for exact match first
    if (citations[metricKey]) return citations[metricKey];

    // Check for alternative keys for investment metrics
    const alternativeKeys = {
      'roa': ['roa'],
      'roe': ['roe'],
      'roic': ['roic']
    };

    const possibleKeys = alternativeKeys[metricKey] || [metricKey];
    for (const key of possibleKeys) {
      if (citations[key]) return citations[key];
    }

    return null;
  };

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

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'string') {
      if (value.includes('%')) return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      return `${(numValue).toFixed(3)}%`;
    }

    if (typeof value === 'number') {
      return `${(value).toFixed(3)}%`;
    }

    return null;
  };

  const formatThreshold = (threshold) => {
    if (!threshold || threshold === 'NA') return 'NA';

    if (typeof threshold === 'string') {
      if (threshold.includes('%')) return threshold;
      const numValue = parseFloat(threshold);
      if (isNaN(numValue)) return 'NA';
      return `${(numValue).toFixed(1)}%`;
    }

    if (typeof threshold === 'number') {
      return `${(threshold).toFixed(1)}%`;
    }

    return 'NA';
  };

  const getDisplayName = (key) => {
    const displayNames = {
      'roa': 'ROA (Return on Assets)',
      'roe': 'ROE (Return on Equity)',
      'roic': 'ROIC (Return on Invested Capital)'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

  const extractInvestmentMetrics = (data) => {
    if (!data || !data.investment) {
      return { metrics: {}, thresholds: {}, citations: {} };
    }

    const investmentData = data.investment;
    const metrics = {};
    const thresholds = {};
    const citations = investmentData.citations || {};

    Object.entries(investmentData).forEach(([key, value]) => {
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
  };

  // Helper function to parse percentage values
  const parsePercentageValue = (value) => {
    if (value === null || value === undefined || value === '' || value === 'NA') return 0;
    
    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[,$%]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    return 0;
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
        citationUrl: getCitationUrl(key.toLowerCase().replace(/\s*\(.*\)/, '').replace(' ', '_'), citations)
      }));

    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth - 40; // Account for padding
          setContainerWidth(Math.max(width, 500)); // Minimum width of 500px
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
    const chartHeight = chartData.length * 120 + 60; // Increased height for citations
    const chartWidth = containerWidth;
    const leftMargin = 120;
    const rightMargin = 60;
    const barHeight = 25;
    const groupSpacing = 120; // Increased spacing for citations

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
        <h3 style={{ 
          marginBottom: '20px', 
          color: '#1f2937',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Investment Performance vs Industry Benchmarks
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} style={{ minWidth: '500px', width: '100%' }}>
          {/* Chart background */}
          <rect width={chartWidth} height={chartHeight} fill="#fafafa" stroke="#e5e7eb" strokeWidth="1" />
          
          {/* Y-axis labels and bars */}
          {chartData.map((data, index) => {
            const y = index * groupSpacing + 30;
            const barWidth = (chartWidth - leftMargin - rightMargin);
            
            // Calculate bar lengths as percentages of max value
            const actualBarLength = (data.actualValue / maxValue) * barWidth;
            const benchmarkBarLength = (data.benchmarkValue / maxValue) * barWidth;
            
            return (
              <g key={data.metric}>
                {/* Metric label */}
                <text
                  x={leftMargin - 10}
                  y={y + 15}
                  textAnchor="end"
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    fill: '#374151'
                  }}
                >
                  {data.metric}
                </text>
                
                {/* Actual value bar */}
                <rect
                  x={leftMargin}
                  y={y}
                  width={actualBarLength}
                  height={barHeight}
                  fill={data.color}
                  opacity={0.8}
                />
                
                {/* Benchmark value bar */}
                <rect
                  x={leftMargin}
                  y={y + barHeight + 5}
                  width={benchmarkBarLength}
                  height={barHeight}
                  fill="#94a3b8"
                  opacity={0.6}
                />
                
                {/* Value labels */}
                <text
                  x={leftMargin + actualBarLength + 5}
                  y={y + 17}
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    fill: data.color
                  }}
                >
                  {data.actualValue.toFixed(1)}%
                </text>
                
                <text
                  x={leftMargin + benchmarkBarLength + 5}
                  y={y + barHeight + 22}
                  style={{
                    fontSize: '12px',
                    fill: '#64748b'
                  }}
                >
                  {data.benchmarkValue.toFixed(1)}%
                </text>
                
                {/* Citation using CitationSource component */}
                <CitationSource
                  url={data.citationUrl}
                  x={leftMargin}
                  y={y + barHeight * 2 + 20}
                />
                
                {/* Grid lines */}
                <line
                  x1={leftMargin}
                  y1={y + barHeight * 2 + 40}
                  x2={chartWidth - rightMargin}
                  y2={y + barHeight * 2 + 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity={0.3}
                />
              </g>
            );
          })}
          
          {/* Legend */}
          <g transform={`translate(${leftMargin}, ${chartHeight - 30})`}>
            <rect x="0" y="0" width="15" height="15" fill="#10b981" opacity={0.8} />
            <text x="20" y="12" style={{ fontSize: '12px', fill: '#374151' }}>
              Your Business
            </text>
            
            <rect x="120" y="0" width="15" height="15" fill="#94a3b8" opacity={0.6} />
            <text x="140" y="12" style={{ fontSize: '12px', fill: '#374151' }}>
              Industry Average
            </text>
          </g>
          </svg>
        </div> 
      </div>
    );
  };

  useEffect(() => {
    if (investmentData && investmentData !== analysisData) {
      setAnalysisData(investmentData);
      setError(null);

      if (onDataGenerated) {
        onDataGenerated(investmentData);
      }
    }
  }, [investmentData, analysisData, onDataGenerated]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (investmentData) {
      setAnalysisData(investmentData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [investmentData]);

  // Show loading state
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
    // Show error message within the normal structure if there's an error
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

    // Show empty state if no data
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
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          isUploading={false}
          readOnly ={readOnly}
          fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis"
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const { metrics, thresholds, citations } = extractInvestmentMetrics(analysisData);

    if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) {
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
          onFileUpload={handleFileUpload}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          readOnly ={readOnly}
          hasUploadedDocument={hasUploadedDocument}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          fileUploadMessage="Upload Excel or CSV files with financial data for investment performance analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          documentInfo={documentInfo} 
        />
      );
    }

    // Show normal analysis content - paired bar chart with citations
    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">

          {Object.values(metrics).every(value => value === null) && (
            <div className="investment-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="investment-warning-title">
                  No Investment Data Available
                </h4>
                <p className="investment-warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required investment metrics.
                </p>
              </div>
            </div>
          )}

          <PairedBarChart metrics={metrics} thresholds={thresholds} citations={citations} />

        </div>
      </div>
    );
  };

  // Main component structure
  return (
    <div
      className="investment-performance"
      data-analysis-type="investment-performance"
      data-analysis-name="Investment Performance"
      data-analysis-order="4"
    >
      {renderContent()}
    </div>
  );
};

export default InvestmentPerformance;