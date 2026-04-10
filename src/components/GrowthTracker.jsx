import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useAnalysisStore } from "../store";
import FinancialEmptyState from './FinancialEmptyState';
import CitationSource from './CitationSource';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

// Helper to normalize growth data structure
const getNormalizedData = (data) => {
  if (!data) return null;

  // 1. Direct growth_trends access
  if (data.growth_trends) return data.growth_trends;

  // 2. Handle cases where the whole object IS the growth_trends content
  if (data.revenue && data.revenue.values) return data;

  // 3. Handle various wrapper keys
  const wrapper = data.growthTracker || data.growth_tracker || data.GrowthTracker;
  if (wrapper) {
    return wrapper.growth_trends || wrapper;
  }

  return null;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absValue >= 1000000) return `${sign}${(absValue / 1000000).toFixed(1)}M`;
  if (absValue >= 1000) return `${sign}${(absValue / 1000).toFixed(1)}K`;
  return `${sign}$${absValue.toFixed(0)}`;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

const prepareChartData = (dataValues) => {
  if (!dataValues) return [];

  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return monthOrder.map(month => {
    const value = dataValues[month] || 0;
    return {
      month: month.substr(0, 3),
      value: value,
      fullMonth: month
    };
  }).filter(item => item.value !== 0);
};

const extractGrowthMetrics = (data) => {
  const target = data?.growth_trends || data;
  if (!target) return { revenueChartData: [], netIncomeChartData: [], metrics: {}, citations: {} };

  const revenueChartData = prepareChartData(target.revenue?.values);
  const netIncomeChartData = prepareChartData(target.net_income?.values);
  const citations = target.citations || {};

  const revValues = Object.values(target.revenue?.values || {});
  const totalRevenue = revValues.reduce((sum, val) => sum + (val || 0), 0);

  const niValues = Object.values(target.net_income?.values || {});
  const totalNetIncome = niValues.reduce((sum, val) => sum + (val || 0), 0);

  const bestMonth = Object.entries(target.revenue?.values || {})
    .reduce((max, [month, revenue]) => (revenue || 0) > max.revenue ? { month, revenue } : max, { month: 'N/A', revenue: 0 });

  const metrics = {
    totalRevenue,
    totalNetIncome,
    avgMonthlyRevenue: revValues.length > 0 ? totalRevenue / revValues.length : 0,
    bestMonth,
    dataCount: Math.max(revValues.length, niValues.length)
  };

  return { revenueChartData, netIncomeChartData, metrics, citations };
};

const isGrowthDataIncomplete = (data) => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;

  const hasRevenueData = normalized.revenue?.values && Object.keys(normalized.revenue.values).length > 0;
  const hasNetIncomeData = normalized.net_income?.values && Object.keys(normalized.net_income.values).length > 0;

  return !hasRevenueData && !hasNetIncomeData;
};

const CustomTooltip = React.memo(({ active, payload, prefix = "Value" }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>{payload[0].payload.fullMonth}</div>
        <div style={{ color: payload[0].fill, fontWeight: '600' }}>
          {prefix}: {formatCurrency(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
});

const GrowthTracker = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  growthData = null,
  growthTrackerData = null, // Support for naming variants
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
  const { 
    growthTrackerData: storeGrowthTrackerData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('growthTracker');

  const analysisData = useMemo(() => {
    const rawData = growthData || growthTrackerData || storeGrowthTrackerData;
    if (!rawData) return null;

    const normalized = getNormalizedData(rawData);
    return normalized ? { growth_trends: normalized } : null;
  }, [growthData, growthTrackerData, storeGrowthTrackerData]);

  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
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
  }, [selectedBusinessId, handleRedirectToBrief]);

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
        await regenerateIndividualAnalysis('growthTracker', questions, userAnswers, selectedBusinessId);
      } catch (error) {
        console.error('Error during regeneration:', error);
        setError('Failed to regenerate analysis. Please try again.');
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

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

  const renderContent = () => {
    if (error) {
      return (
        <div className="growth-warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="growth-warning-title">Analysis Error</h4>
            <p className="growth-warning-text">{error}</p>
          </div>
        </div>
      );
    }

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
          readOnly={readOnly}
          fileUploadMessage="Upload Excel or CSV files with financial data for growth tracker analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
          documentInfo={documentInfo}
        />
      );
    }

    const { revenueChartData, netIncomeChartData, metrics, citations } = extractGrowthMetrics(analysisData);
    const trends = analysisData?.growth_trends || analysisData;

    return (
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-charts-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '16px'
          }}>
            {/* Revenue Chart */}
            <div className="ch-chart-section" style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h4 style={{ margin: 0, color: '#111827', fontSize: '15px', fontWeight: '600' }}>Monthly Revenue Trend</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></div>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Revenue</span>
                  </div>
                </div>
                <CitationSource url={citations.revenue} />
              </div>
              <div className="ch-chart-wrapper" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip prefix="Revenue" />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* QoQ Revenue Growth */}
              {trends.revenue?.qoq_growth && (
                <div className="qoq-indicators" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(trends.revenue.qoq_growth).map(([quarter, growth]) => (
                    <div key={quarter} className={`qoq-badge ${growth === null ? 'neutral' : growth >= 0 ? 'positive' : 'negative'}`}>
                      {quarter}: {formatPercentage(growth)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Net Income Chart */}
            <div className="ch-chart-section" style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h4 style={{ margin: 0, color: '#111827', fontSize: '15px', fontWeight: '600' }}>Monthly Net Income Trend</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Net Income</span>
                  </div>
                </div>
                <CitationSource url={citations.net_income} />
              </div>
              <div className="ch-chart-wrapper" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={netIncomeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip prefix="Net Income" />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* QoQ Net Income Growth */}
              {trends.net_income?.qoq_growth && (
                <div className="qoq-indicators" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(trends.net_income.qoq_growth).map(([quarter, growth]) => (
                    <div key={quarter} className={`qoq-badge ${growth === null ? 'neutral' : growth >= 0 ? 'positive' : 'negative'}`}>
                      {quarter}: {formatPercentage(growth)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Growth Insights */}
          <div className="growth-insights" style={{ marginTop: '32px' }}>
            <h4 style={{ marginBottom: '16px' }}>Growth Performance Insights</h4>
            <div className="growth-insights-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="growth-insight-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Total Period Revenue</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(metrics.totalRevenue)}</div>
              </div>
              <div className="growth-insight-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Total Period Net Income</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: metrics.totalNetIncome >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(metrics.totalNetIncome)}
                </div>
              </div>
              <div className="growth-insight-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Best Performance Month</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                  {metrics.bestMonth.month}
                  <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>
                    ({formatCurrency(metrics.bestMonth.revenue)})
                  </span>
                </div>
              </div>
              <div className="growth-insight-item" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Data Coverage</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{metrics.dataCount} Months</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const memoizedContent = renderContent();

  return (
    <div
      className="channel-heatmap channel-heatmap-container"
      data-analysis-type="growth-tracker"
      data-analysis-name="Growth Tracker"
      data-analysis-order="2"
    >
      {memoizedContent}
    </div>
  );
};

export default React.memo(GrowthTracker);