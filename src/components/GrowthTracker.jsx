import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Loader } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const GrowthTracker = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  growthData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(growthData);
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
    const analysisConfig = ANALYSIS_TYPES.growthTracker || {
      displayName: 'Growth Tracker',
      customMessage: 'Answer more questions to unlock detailed growth analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'growthTracker',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isGrowthDataIncomplete = (data) => {
    if (!data) return true;
    
    // Check for new structure
    const hasRevenueData = data.growth_trends?.revenue?.values;
    const hasProfitabilityData = data.profitability;
    
    return !hasRevenueData && !hasProfitabilityData;
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
    if (growthData && growthData !== analysisData) {
      setAnalysisData(growthData);
      if (onDataGenerated) {
        onDataGenerated(growthData);
      }
    }
  }, [growthData]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (growthData) {
      setAnalysisData(growthData);
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

  const prepareChartData = (revenueData) => {
    if (!revenueData || !revenueData.values) return [];
    
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return monthOrder.map(month => {
      const revenue = revenueData.values[month] || 0;
      return {
        month: month.substr(0, 3), // Convert to 3-letter abbreviation
        revenue: revenue,
        netIncome: 0, // Net income data structure is empty in the new format
        period: monthOrder.indexOf(month) + 1
      };
    }).filter(item => item.revenue > 0); // Only show months with data
  };

  const formatCurrency = (value) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getGrowthColor = (value) => {
    if (value === null || value === undefined) return '#6b7280';
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{label}</div>
          <div className="ch-tooltip-content">
            <div style={{ color: '#8884d8' }}>
              Revenue: {formatCurrency(payload[0]?.value || 0)}
            </div>
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
          <span>Generating growth tracker analysis...</span>
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

  if (!analysisData || isGrowthDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="growthTracker"
          analysisDisplayName="Growth Tracker"
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
          fileUploadMessage="Upload Excel files for detailed growth analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  const { profitability, growth_trends, threshold } = analysisData;
  const chartData = prepareChartData(growth_trends?.revenue);

  // Calculate totals from new structure
  const revenueValues = Object.values(growth_trends?.revenue?.values || {});
  const totalRevenue = revenueValues.reduce((sum, val) => sum + val, 0);
  const avgMonthlyRevenue = totalRevenue / (revenueValues.length || 1);

  return (
    <div className="channel-heatmap channel-heatmap-container" 
         data-analysis-type="growth-tracker"
         data-analysis-name="Growth Tracker"
         data-analysis-order="2">

      {/* Profitability Metrics */}
      {profitability && (
        <div className="profitability-metrics">
          <div className="profitability-card">
            <h5>Gross Margin</h5>
            <div className="value">{formatPercentage(profitability.gross_margin)}</div>
          </div>
          <div className="profitability-card">
            <h5>Operating Margin</h5>
            <div className="value">{formatPercentage(profitability.operating_margin)}</div>
            {threshold?.operating_margin && (
              <div className="threshold">Target: {threshold.operating_margin}</div>
            )}
          </div>
          <div className="profitability-card">
            <h5>Net Margin</h5>
            <div className="value">{formatPercentage(profitability.net_margin)}</div>
            {threshold?.net_margin && (
              <div className="threshold">Target: {threshold.net_margin}</div>
            )}
          </div>
          <div className="profitability-card">
            <h5>EBITDA Margin</h5>
            <div className="value">{formatPercentage(profitability.ebitda_margin)}</div>
            {threshold?.ebitda && (
              <div className="threshold">Target: {threshold.ebitda}</div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Total Revenue</span>
          </div>
          <p className="ch-metric-value">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Avg Monthly Revenue</span>
          </div>
          <p className="ch-metric-value">{formatCurrency(avgMonthlyRevenue)}</p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Operating Margin</span>
          </div>
          <p className="ch-metric-value">{formatPercentage(profitability?.operating_margin)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Revenue Trends</h3>
            <p className="ch-section-subtitle">
              Monthly performance tracking with growth patterns
            </p>
          </div>

          <div className="ch-charts-grid">
            {/* Revenue Chart */}
            <div className="ch-chart-section ch-chart-section-full">
              <h4>Monthly Revenue Trend</h4>
              <div className="ch-chart-wrapper ch-chart-wrapper-large">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* QoQ Growth Indicators */}
              {growth_trends?.revenue?.qoq_growth && (
                <div className="qoq-indicators">
                  {Object.entries(growth_trends.revenue.qoq_growth).map(([quarter, growth]) => (
                    <div 
                      key={quarter} 
                      className={`qoq-badge ${growth === null ? 'neutral' : growth >= 0 ? 'positive' : 'negative'}`}
                    >
                      {quarter}: {growth === null ? 'N/A' : formatPercentage(growth)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Growth Insights */}
          <div className="growth-insights">
            <h4>Growth Insights</h4>
            
            <div className="growth-insights-grid">
              <div className="growth-insight-item">
                <strong>Revenue Performance:</strong>
                <span className="growth-insight-value neutral">
                  {totalRevenue > 0 ? 'Positive revenue generation' : 'Revenue challenges'}
                </span>
              </div>
              <div className="growth-insight-item">
                <strong>Profitability:</strong>
                <span className={`growth-insight-value ${profitability?.net_margin >= 0 ? 'positive' : 'negative'}`}>
                  {profitability?.net_margin >= 0 ? 'Profitable operations' : 'Margin improvement needed'}
                </span>
              </div>
              <div className="growth-insight-item">
                <strong>Data Points:</strong>
                <span className="growth-insight-value neutral">
                  {revenueValues.length} months of data
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthTracker;