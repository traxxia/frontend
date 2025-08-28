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
    if (!data || !data.growthTracker) return true;
    
    const { growthTracker } = data;
    return !growthTracker['Revenue Trend'] && !growthTracker['Net Income Trend'];
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

  const prepareChartData = (revenueTrend, netIncomeTrend) => {
    if (!revenueTrend || !netIncomeTrend) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return revenueTrend.map((revenue, index) => ({
      month: months[index] || `M${index + 1}`,
      revenue: revenue,
      netIncome: netIncomeTrend[index] || 0,
      period: index + 1
    }));
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{label}</div>
          <div className="ch-tooltip-content">
            <div style={{ color: '#8884d8' }}>
              Revenue: {formatCurrency(payload[0]?.value || 0)}
            </div>
            <div style={{ color: '#82ca9d' }}>
              Net Income: {formatCurrency(payload[1]?.value || 0)}
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

  const { growthTracker } = analysisData;
  const chartData = prepareChartData(growthTracker['Revenue Trend'], growthTracker['Net Income Trend']);

  // Calculate totals
  const totalRevenue = growthTracker['Revenue Trend']?.reduce((sum, val) => sum + val, 0) || 0;
  const totalNetIncome = growthTracker['Net Income Trend']?.reduce((sum, val) => sum + val, 0) || 0;

  return (
    <div className="channel-heatmap channel-heatmap-container" 
         data-analysis-type="growth-tracker"
         data-analysis-name="Growth Tracker"
         data-analysis-order="2">

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
            <span>Total Net Income</span>
          </div>
          <p className="ch-metric-value" style={{
            color: totalNetIncome >= 0 ? '#10b981' : '#ef4444'
          }}>
            {formatCurrency(totalNetIncome)}
          </p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Avg Monthly Revenue</span>
          </div>
          <p className="ch-metric-value">
            {formatCurrency(totalRevenue / (growthTracker['Revenue Trend']?.length || 1))}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Revenue & Net Income Trends</h3>
            <p className="ch-section-subtitle">
              Monthly performance tracking with growth patterns
            </p>
          </div>

          <div className="ch-charts-grid">
            {/* Combined Growth Chart */}
            <div className="ch-chart-section" style={{ gridColumn: '1 / -1' }}>
              <h4>Revenue vs Net Income Trend</h4>
              <div className="ch-chart-wrapper" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="netIncome" name="Net Income">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.netIncome >= 0 ? '#82ca9d' : '#ff7c7c'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="growth-insights" style={{
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
              Growth Insights
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>Revenue Performance:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  {totalRevenue > 0 ? 'Positive revenue generation' : 'Revenue challenges'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Profitability:</strong>
                <span style={{ color: totalNetIncome >= 0 ? '#10b981' : '#ef4444', marginLeft: '8px' }}>
                  {totalNetIncome >= 0 ? 'Profitable operations' : 'Loss-making periods'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Data Points:</strong>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  {growthTracker['Revenue Trend']?.length || 0} months of data
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