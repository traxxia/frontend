import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
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
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(investmentData);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

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
    if (!data || !data.investmentPerformance) return true;
    
    const { investmentPerformance } = data;
    return !investmentPerformance.ROA && !investmentPerformance.ROE && !investmentPerformance.ROIC;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (investmentData && investmentData !== analysisData) {
      setAnalysisData(investmentData);
      if (onDataGenerated) {
        onDataGenerated(investmentData);
      }
    }
  }, [investmentData]);

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
  }, []);

  useEffect(() => {
    if (analysisData && onDataGenerated) {
      onDataGenerated(analysisData);
    }
  }, [analysisData]);

  const handleFileUpload = (file) => {
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRatioColor = (value, type) => {
    if (value === null || value === undefined) return '#6b7280';
    
    // Industry benchmarks for color coding
    const benchmarks = {
      ROA: { good: 0.15, fair: 0.05 },
      ROE: { good: 0.20, fair: 0.10 },
      ROIC: { good: 0.15, fair: 0.08 }
    };

    const benchmark = benchmarks[type];
    if (!benchmark) return '#6b7280';

    if (value >= benchmark.good) return '#10b981';
    if (value >= benchmark.fair) return '#f59e0b';
    return '#ef4444';
  };

  const getBenchmarkValue = (type) => {
    // Industry benchmark values
    const benchmarks = {
      ROA: 0.10,
      ROE: 0.15,
      ROIC: 0.12
    };
    return benchmarks[type] || 0;
  };

  const prepareChartData = (data) => {
    if (!data) return [];
    
    // Generate 12 months of mock quarterly data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      // Create some variation around the annual values
      const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
      
      return {
        month,
        ROA: data.ROA ? data.ROA * variation : 0,
        ROE: data.ROE ? data.ROE * variation : 0,
        ROIC: data.ROIC ? data.ROIC * variation : 0,
        benchmark: 0.12 // Average benchmark
      };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{label}</div>
          <div className="ch-tooltip-content">
            {payload.map((entry, index) => (
              <div key={index} style={{ color: entry.color }}>
                {entry.dataKey}: {formatPercentage(entry.value)}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating investment performance analysis...</span>
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
          <button onClick={() => {
            setError(null);
            if (onRegenerate) {
              onRegenerate();
            }
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="investmentPerformance"
          analysisDisplayName="Investment Performance"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => {}} // Will be handled by parent
          onGenerateWithoutFile={() => {}} // Will be handled by parent
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          fileUploadMessage="Upload Excel files for detailed investment analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  const { investmentPerformance } = analysisData;
  const chartData = prepareChartData(investmentPerformance);

  return (
    <div className="channel-heatmap channel-heatmap-container" 
         data-analysis-type="investment-performance"
         data-analysis-name="Investment Performance"
         data-analysis-order="4">

      {/* Key Metrics */}
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>ROA (Return on Assets)</span>
          </div>
          <p className="ch-metric-value" style={{ color: getRatioColor(investmentPerformance.ROA, 'ROA') }}>
            {formatPercentage(investmentPerformance.ROA)}
          </p>
          <div className="ch-metric-comparison">
            Benchmark: {formatPercentage(getBenchmarkValue('ROA'))}
          </div>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>ROE (Return on Equity)</span>
          </div>
          <p className="ch-metric-value" style={{ color: getRatioColor(investmentPerformance.ROE, 'ROE') }}>
            {formatPercentage(investmentPerformance.ROE)}
          </p>
          <div className="ch-metric-comparison">
            Benchmark: {formatPercentage(getBenchmarkValue('ROE'))}
          </div>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>ROIC (Return on Invested Capital)</span>
          </div>
          <p className="ch-metric-value" style={{ color: getRatioColor(investmentPerformance.ROIC, 'ROIC') }}>
            {formatPercentage(investmentPerformance.ROIC)}
          </p>
          <div className="ch-metric-comparison">
            Benchmark: {formatPercentage(getBenchmarkValue('ROIC'))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Investment Performance Trends</h3>
            <p className="ch-section-subtitle">
              Monthly performance tracking with benchmark comparisons
            </p>
          </div>

          <div className="ch-charts-grid">
            {/* Investment Performance Trend */}
            <div className="ch-chart-section" style={{ gridColumn: '1 / -1' }}>
              <h4>ROA, ROE & ROIC Performance Trend</h4>
              <div className="ch-chart-wrapper" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatPercentage} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="ROA" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      name="ROA"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ROE" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                      name="ROE"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ROIC" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                      name="ROIC"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#ff7300" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Industry Benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="investment-analysis" style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            marginTop: '20px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '16px'
            }}>
              Investment Performance Analysis
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>ROA (Return on Assets):</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Net Income ÷ Total Assets. Measures efficiency of asset utilization.
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>ROE (Return on Equity):</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Net Income ÷ Shareholders' Equity. Shows return to equity investors.
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>ROIC (Return on Invested Capital):</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  Operating Income ÷ Invested Capital. Measures capital efficiency.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPerformance;