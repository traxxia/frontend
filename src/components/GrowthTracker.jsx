import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import FinancialEmptyState from './FinancialEmptyState';
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
  onRedirectToBrief,
  uploadedFile = null,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument = false,
  readOnly = false,
  documentInfo = null,
}) => {
  const [analysisData, setAnalysisData] = useState(growthData);
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
    try {
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
    } catch (error) {
      console.error('Error checking missing questions:', error);
    }
  };

  const isGrowthDataIncomplete = (data) => {
    if (!data) return true;
    // Check if revenue data exists - actual API structure: growth_trends.revenue.values
    const hasRevenueData = data.growth_trends?.revenue?.values && Object.keys(data.growth_trends.revenue.values).length > 0;

    return !hasRevenueData;
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

  // Fixed useEffect pattern - same as ProfitabilityAnalysis
  useEffect(() => {
    if (growthData && growthData !== analysisData) {
      setAnalysisData(growthData);
      setError(null);

      if (onDataGenerated) {
        onDataGenerated(growthData);
      }
    }
  }, [growthData, analysisData, onDataGenerated]);

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
  }, [growthData]);

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

  const prepareChartData = (revenueData) => {
    if (!revenueData || !revenueData.values) return [];

    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const chartData = monthOrder.map(month => {
      const revenue = revenueData.values[month] || 0;
      return {
        month: month.substr(0, 3),
        revenue: revenue,
        period: monthOrder.indexOf(month) + 1
      };
    }).filter(item => item.revenue > 0);
    return chartData;
  };

  const extractGrowthMetrics = (data) => {
    if (!data || !data.growth_trends?.revenue?.values) {
      return { chartData: [], metrics: {} };
    }

    const chartData = prepareChartData(data.growth_trends.revenue);
    const revenueValues = Object.values(data.growth_trends.revenue.values);
    const totalRevenue = revenueValues.reduce((sum, val) => sum + val, 0);
    const avgMonthlyRevenue = totalRevenue / revenueValues.length;

    const bestMonth = Object.entries(data.growth_trends.revenue.values)
      .reduce((max, [month, revenue]) => revenue > max.revenue ? { month, revenue } : max, { month: 'N/A', revenue: 0 });

    const metrics = {
      totalRevenue,
      avgMonthlyRevenue,
      bestMonth,
      dataCount: revenueValues.length
    };

    return { chartData, metrics };
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '14px',
          zIndex: 1000,
          position: 'relative'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{label}</div>
          <div style={{ color: '#8884d8' }}>
            Revenue: {formatCurrency(payload[0]?.value || 0)}
          </div>
        </div>
      );
    }
    return null;
  };

  // Show loading state
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

  // Main render function following ProfitabilityAnalysis pattern
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
    if (!analysisData || isGrowthDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="growthTracker"
          analysisDisplayName="Growth Tracker Analysis"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          readOnly ={readOnly}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          fileUploadMessage="Upload Excel or CSV files with historical revenue data for growth tracking analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"          
          documentInfo={documentInfo} 
         />
      );
    }

    // Show normal analysis content
    const { chartData, metrics } = extractGrowthMetrics(analysisData);

    if (!chartData || chartData.length === 0) {
      return (
        <FinancialEmptyState
          analysisType="growthTracker"
          analysisDisplayName="Growth Tracker Analysis"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          readOnly ={readOnly}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          onRedirectToChat={onRedirectToChat}
          isMobile={isMobile}
          setActiveTab={setActiveTab}
          hasUploadedDocument={hasUploadedDocument}
          documentInfo={documentInfo} 
          fileUploadMessage="Upload Excel or CSV files with historical revenue data for growth tracking analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      );
    }

    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">

          {chartData.length === 0 && (
            <div className="profitability-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="profitability-warning-title">
                  No Revenue Data Available
                </h4>
                <p className="profitability-warning-text">
                  Upload an Excel file with historical revenue data or ensure your spreadsheet contains monthly/quarterly revenue information.
                </p>
              </div>
            </div>
          )}

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
              {analysisData?.growth_trends?.revenue?.qoq_growth && (
                <div className="qoq-indicators">
                  {Object.entries(analysisData.growth_trends.revenue.qoq_growth).map(([quarter, growth]) => (
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

          {/* Simple Revenue Insights */}
          <div className="growth-insights">
            <h4>Revenue Insights</h4>

            <div className="growth-insights-grid">
              <div className="growth-insight-item">
                <strong>Total Revenue:</strong>
                <span className="growth-insight-value positive">
                  {formatCurrency(metrics.totalRevenue)}
                </span>
              </div>
              <div className="growth-insight-item">
                <strong>Best Month:</strong>
                <span className="growth-insight-value positive">
                  {metrics.bestMonth.month} ({formatCurrency(metrics.bestMonth.revenue)})
                </span>
              </div>
              <div className="growth-insight-item">
                <strong>Data Coverage:</strong>
                <span className="growth-insight-value neutral">
                  {metrics.dataCount} months tracked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="channel-heatmap channel-heatmap-container"
      data-analysis-type="growth-tracker"
      data-analysis-name="Growth Tracker"
      data-analysis-order="2">

      {renderContent()}
    </div>
  );
};

export default GrowthTracker;