import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Target, Loader, AlertCircle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from "../store";
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

// Custom normalizer for both old and new response formats
const parseMetric = (rawVal) => {
  if (rawVal === null || rawVal === undefined) {
    return { value: null, currency: null, period: null, citation: null };
  }
  if (typeof rawVal === 'object') {
    return {
      value: rawVal.value !== undefined ? rawVal.value : null,
      currency: rawVal.currency || null,
      period: rawVal.period || null,
      citation: rawVal.citation || null
    };
  }
  return {
    value: rawVal,
    currency: null,
    period: null,
    citation: null
  };
};

const getGrowthStatus = (key, value) => {
  if (value === null || value === undefined) return { label: 'N/A', colorClass: 'null' };
  
  if (key === 'revenue_growth_yoy') {
    if (value >= 0.10) return { label: 'High Growth', colorClass: 'green' };
    if (value >= 0.0) return { label: 'Positive Growth', colorClass: 'yellow' };
    return { label: 'Negative Growth', colorClass: 'red' };
  }
  
  if (key === 'gross_margin') {
    if (value >= 0.30) return { label: 'High Margin', colorClass: 'green' };
    if (value >= 0.15) return { label: 'Healthy Margin', colorClass: 'yellow' };
    return { label: 'Low Margin', colorClass: 'red' };
  }
  
  if (key === 'net_margin') {
    if (value >= 0.10) return { label: 'High Margin', colorClass: 'green' };
    if (value >= 0.05) return { label: 'Healthy Margin', colorClass: 'yellow' };
    return { label: 'Low Margin', colorClass: 'red' };
  }
  
  return { label: 'N/A', colorClass: 'null' };
};

const formatCurrencyValue = (val, currency) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  
  let validCurrency = 'USD';
  let suffix = '';
  if (currency && typeof currency === 'string') {
    const trimmed = currency.trim();
    const match = trimmed.match(/^([A-Za-z]{3})(.*)$/);
    if (match) {
      validCurrency = match[1].toUpperCase();
      suffix = match[2];
    } else {
      suffix = ' ' + trimmed;
    }
  }

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      maximumFractionDigits: 0
    });
    return formatter.format(num) + suffix;
  } catch (e) {
    return `${currency || '$'} ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
};

const formatPercentageValue = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  return `${(num * 100).toFixed(2)}%`;
};

const getNormalizedData = data => {
  if (!data) return null;
  // New timeline format: { timeline: [{period, growth_trends: {...}}, ...] }
  if (data.timeline && Array.isArray(data.timeline) && data.timeline.length > 0) {
    const sorted = [...data.timeline].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
    
    for (let i = sorted.length - 1; i >= 0; i--) {
      const gt = sorted[i].growth_trends || sorted[i].growth;
      if (!gt) continue;
      
      const hasValid = Object.keys(gt).some(k => {
        if (k === 'period') return false;
        const parsed = parseMetric(gt[k]);
        return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
      });
      
      if (hasValid) return gt;
    }
    
    const latest = sorted[sorted.length - 1];
    return latest?.growth_trends || latest?.growth || null;
  }
  if (data.growth) return data.growth;
  if (data.revenue_growth && data.gross_profit_growth) return data;
  const wrapper = data.growthTracker || data.growth_tracker || data.GrowthTracker;
  if (wrapper) return wrapper.growth || wrapper;
  return null;
};

/** Extract multi-period growth trend */
const getTimelineChartData = data => {
  if (!data?.timeline || !Array.isArray(data.timeline) || data.timeline.length < 2) return null;
  const sorted = [...data.timeline].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
  return sorted.map(p => {
    const gt = p.growth_trends || p.growth || {};
    return {
      period: p.period,
      revenue_growth: gt.revenue_growth_yoy?.value != null ? +(gt.revenue_growth_yoy.value * 100).toFixed(2) : null,
      user_growth: gt.user_growth?.value != null ? +(gt.user_growth.value * 100).toFixed(2) : null,
      revenue: gt.revenue?.value != null ? +(gt.revenue.value / 1e6).toFixed(2) : null,
      net_margin: gt.net_margin?.value != null ? +(gt.net_margin.value * 100).toFixed(2) : null,
    };
  });
};

/** Trend arrow: compare latest vs previous period metric value */
const TrendArrow = ({ latest, prev }) => {
  if (latest == null || prev == null) return null;
  if (latest > prev) return <TrendingUp size={14} style={{ color: '#10b981', display: 'inline', marginLeft: 4 }} />;
  if (latest < prev) return <TrendingDown size={14} style={{ color: '#ef4444', display: 'inline', marginLeft: 4 }} />;
  return <Minus size={14} style={{ color: '#6b7280', display: 'inline', marginLeft: 4 }} />;
};

const isGrowthDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  
  // If the percentage ratios and base revenue are all empty, treat as incomplete/empty state
  const ratioMetrics = ['revenue_growth_yoy', 'gross_margin', 'net_margin', 'revenue', 'net_income'];
  const hasValidRatio = ratioMetrics.some(key => {
    const parsed = parseMetric(normalized[key]);
    return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
  });
  
  if (!hasValidRatio) return true;

  const metricsToCheck = [
    'revenue_growth_yoy',
    'revenue',
    'gross_profit',
    'net_income',
    'gross_margin',
    'net_margin'
  ];
  
  const hasValidValue = metricsToCheck.some(key => {
    const parsed = parseMetric(normalized[key]);
    return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
  });
  
  return !hasValidValue;
};

const MetricCitation = ({ citation }) => {
  if (!citation || (!citation.filename && !citation.text)) return null;
  const sourceName = citation.filename || 'Source Document';
  const pageInfo = citation._metadata?.page ? `Page ${citation._metadata.page}` : '';
  const sheetInfo = citation._metadata?.sheet ? `Sheet: ${citation._metadata.sheet}` : '';
  const location = [pageInfo, sheetInfo].filter(Boolean).join(', ');
  const displaySource = location ? `${sourceName} (${location})` : sourceName;

  return (
    <div className="growth-tracker__citation-badge" title={citation.text || ''}>
      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
      <span>{displaySource}</span>
    </div>
  );
};

const ReserveCard = ({ label, metric }) => {
  const { t } = useTranslation();
  const { value, currency, period, citation } = metric;
  
  return (
    <div className="growth-tracker__reserve-card">
      <div className="growth-tracker__reserve-header">
        <div className="growth-tracker__reserve-title">{label}</div>
        {period && (
          <div className="growth-tracker__reserve-period">
            {t('period', 'Period')}: {period}
          </div>
        )}
      </div>
      <div className="growth-tracker__reserve-body">
        <div className="growth-tracker__reserve-value">
          {formatCurrencyValue(value, currency)}
        </div>
        <MetricCitation citation={citation} />
      </div>
    </div>
  );
};

const GrowthTracker = ({
  questions = [],
  userAnswers = {},
  businessName,
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  growthData = null,
  growthTrackerData = null,
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
  const { t } = useTranslation();
  const {
    growthTrackerData: storeGrowthData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('growthTracker');
  
  const analysisData = useMemo(() => {
    const rawData = growthData || growthTrackerData || storeGrowthData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      growth: normalized,
      _raw: rawData
    } : null;
  }, [growthData, growthTrackerData, storeGrowthData]);

  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.growthTracker || {
      displayName: t('growth_analysis_display_name', 'Growth Trends Analysis'),
      customMessage: t('growth_efficiency_unlock_msg', 'Answer more questions to unlock detailed growth analysis')
    };
    await checkMissingQuestionsAndRedirect('growthTracker', selectedBusinessId, handleRedirectToBrief, {
      displayName: analysisConfig.displayName,
      customMessage: analysisConfig.customMessage
    });
  }, [selectedBusinessId, handleRedirectToBrief, t]);

  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        setError(t('failed_to_generate', 'Failed to generate analysis'));
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('growthTracker', questions, userAnswers, selectedBusinessId);
      } catch (error) {
        setError(t('failed_to_generate', 'Failed to generate analysis'));
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId, t]);

  const handleFileUpload = useCallback(file => {
    if (file) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (allowedTypes.includes(file.type)) {
        setError(null);
      } else {
        setError(t('upload_excel_csv_error', 'Please upload an Excel or CSV file.'));
      }
    }
  }, [t]);

  const removeFile = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  if (isRegenerating) {
    return (
      <div className="channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>{t('generating_growth_analysis', 'Generating growth trends analysis...')}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="growth-warning" style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c' }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <h4 className="growth-warning-title" style={{ margin: 0, fontWeight: 600 }}>{t('analysis_error', 'Analysis Error')}</h4>
            <p className="growth-warning-text" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isGrowthDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState 
          analysisType="growthTracker" 
          analysisDisplayName={t('growth_analysis_display_name', 'Growth Trends Analysis')} 
          icon={TrendingUp} 
          onImproveAnswers={handleMissingQuestionsCheck} 
          onRegenerate={handleRegenerate} 
          isRegenerating={isRegenerating} 
          canRegenerate={canRegenerate} 
          readOnly={readOnly} 
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
          fileUploadMessage={t('growth_upload_msg', 'Upload Excel or CSV files with financial data for growth trends analysis')} 
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const normalized = getNormalizedData(analysisData);
    
    // Parse all metric fields safely using the unified parseMetric normalizer
    const revenueGrowthYoY = parseMetric(normalized.revenue_growth_yoy);
    const revenue = parseMetric(normalized.revenue);
    const grossProfit = parseMetric(normalized.gross_profit);
    const netIncome = parseMetric(normalized.net_income);
    const grossMargin = parseMetric(normalized.gross_margin);
    const netMargin = parseMetric(normalized.net_margin);

    const chartRows = [
      {
        key: 'revenue_growth_yoy',
        label: t('revenue_growth_yoy', 'YoY Revenue Growth'),
        actualValue: revenueGrowthYoY.value,
        colorClass: getGrowthStatus('revenue_growth_yoy', revenueGrowthYoY.value).colorClass,
        period: revenueGrowthYoY.period,
        citation: revenueGrowthYoY.citation
      },
      {
        key: 'gross_margin',
        label: t('gross_margin', 'Gross Margin'),
        actualValue: grossMargin.value,
        colorClass: getGrowthStatus('gross_margin', grossMargin.value).colorClass,
        period: grossMargin.period,
        citation: grossMargin.citation
      },
      {
        key: 'net_margin',
        label: t('net_margin', 'Net Margin'),
        actualValue: netMargin.value,
        colorClass: getGrowthStatus('net_margin', netMargin.value).colorClass,
        period: netMargin.period,
        citation: netMargin.citation
      }
    ];

    // Calculate maximum absolute value for chart scaling (cap minimum at 1.0 i.e. 100%)
    const maxValue = Math.max(
      ...chartRows.map(r => Math.abs(r.actualValue) || 0),
      1.0
    );

    // Extract timeline chart data if multiple periods available
    const timelineData = getTimelineChartData(analysisData._raw || growthData || growthTrackerData || storeGrowthData);
    const hasTimeline = timelineData && timelineData.length >= 2;
    const prevPeriodData = hasTimeline ? timelineData[timelineData.length - 2] : null;

    return (
      <div className="ch-heatmap-container" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .growth-tracker__chart-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 16px;
            width: 100%;
          }
          [data-theme="dark"] .growth-tracker__chart-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .growth-tracker__chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .growth-tracker__chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          [data-theme="dark"] .growth-tracker__chart-title {
            color: #f3f4f6;
          }
          .growth-tracker__chart-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .growth-tracker__chart-row {
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: center;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
          }
          .growth-tracker__chart-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          [data-theme="dark"] .growth-tracker__chart-row {
            border-bottom-color: #374151;
          }
          .growth-tracker__row-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .growth-tracker__label-citation {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .growth-tracker__row-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
          }
          [data-theme="dark"] .growth-tracker__row-label {
            color: #e5e7eb;
          }
          .growth-tracker__row-period {
            font-size: 11px;
            color: #6b7280;
            line-height: 1;
            margin-top: 2px;
          }
          [data-theme="dark"] .growth-tracker__row-period {
            color: #9ca3af;
          }
          .growth-tracker__bar-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .growth-tracker__bar {
            height: 14px;
            border-radius: 4px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
          }
          .growth-tracker__bar--actual-green {
            background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
          }
          .growth-tracker__bar--actual-yellow {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          }
          .growth-tracker__bar--actual-red {
            background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
          }
          .growth-tracker__bar-value {
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            width: 50px;
            flex-shrink: 0;
          }
          .growth-tracker__bar-value--actual-green {
            color: #10b981;
          }
          .growth-tracker__bar-value--actual-yellow {
            color: #d97706;
          }
          [data-theme="dark"] .growth-tracker__bar-value--actual-yellow {
            color: #f59e0b;
          }
          .growth-tracker__bar-value--actual-red {
            color: #ef4444;
          }
          .growth-tracker__bar-value--actual-null {
            color: #374151;
            font-size: 14px;
            font-weight: 700;
          }
          [data-theme="dark"] .growth-tracker__bar-value--actual-null {
            color: #e5e7eb;
          }
          .growth-tracker__section-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin: 20px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }
          [data-theme="dark"] .growth-tracker__section-title {
            color: #e5e7eb;
            border-bottom-color: #374151;
          }
          .growth-tracker__reserves-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }
          .growth-tracker__reserve-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .growth-tracker__reserve-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          [data-theme="dark"] .growth-tracker__reserve-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .growth-tracker__reserve-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .growth-tracker__reserve-title {
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
          }
          [data-theme="dark"] .growth-tracker__reserve-title {
            color: #9ca3af;
          }
          .growth-tracker__reserve-period {
            font-size: 11px;
            color: #9ca3af;
          }
          .growth-tracker__reserve-body {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .growth-tracker__reserve-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }
          [data-theme="dark"] .growth-tracker__reserve-value {
            color: #f3f4f6;
          }
          .growth-tracker__citation-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #3b82f6;
            background-color: #eff6ff;
            padding: 4px 8px;
            border-radius: 4px;
            width: fit-content;
            max-width: 100%;
            cursor: help;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          [data-theme="dark"] .growth-tracker__citation-badge {
            background-color: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
          }
          @media (max-width: 768px) {
            .growth-tracker__chart-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding-bottom: 12px;
            }
            .growth-tracker__reserves-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}} />
        <div className="ch-heatmap-scroll" style={{ padding: '4px', width: '100%' }}>
          
          {/* Multi-period Growth Line Chart */}
          {hasTimeline && (
            <div className="growth-tracker__chart-card" style={{ marginBottom: 16 }}>
              <div className="growth-tracker__chart-header">
                <h3 className="growth-tracker__chart-title">
                  {t('growth_trends', 'Growth Trends — Multi-Period')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={v => `$${v}M`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [v != null ? (n === 'Revenue' ? `$${v}M` : `${v}%`) : '–', n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue_growth" name="Revenue Growth" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line yAxisId="right" type="monotone" dataKey="net_margin" name="Net Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="growth-tracker__chart-card">
            <div className="growth-tracker__chart-header">
              <h3 className="growth-tracker__chart-title">
                {t('growth_ratios', 'Growth & Margin Ratios')}
              </h3>
            </div>

            <div className="growth-tracker__chart-rows">
              {chartRows.map((row) => (
                <div className="growth-tracker__chart-row" key={row.key}>
                  <div className="growth-tracker__row-info">
                    <div className="growth-tracker__label-citation">
                      <span className="growth-tracker__row-label">{row.label}</span>
                      <MetricCitation citation={row.citation} />
                    </div>
                    {row.period && (
                      <span className="growth-tracker__row-period">
                        {t('period', 'Period')}: {row.period}
                      </span>
                    )}
                  </div>
                  
                  <div className="growth-tracker__bar-wrapper">
                    {row.actualValue !== null && (
                      <div 
                        className={`growth-tracker__bar growth-tracker__bar--actual-${row.colorClass}`}
                        style={{ width: `${(Math.abs(row.actualValue) / maxValue) * 100}%` }}
                      />
                    )}
                    <span className={`growth-tracker__bar-value growth-tracker__bar-value--actual-${row.colorClass}`}>
                      {row.actualValue !== null ? formatPercentageValue(row.actualValue) : '-'}
                      {hasTimeline && prevPeriodData && (
                        <TrendArrow latest={row.actualValue} prev={prevPeriodData[row.key]} />
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="growth-tracker__section-title">
            {t('revenue_and_profits', 'Revenue & Profits')}
          </div>

          <div className="growth-tracker__reserves-grid">
            <ReserveCard 
              label={t('revenue', 'Revenue')} 
              metric={revenue} 
            />
            <ReserveCard 
              label={t('gross_profit', 'Gross Profit')} 
              metric={grossProfit} 
            />
            <ReserveCard 
              label={t('net_income', 'Net Income')} 
              metric={netIncome} 
            />
          </div>
          
        </div>
      </div>
    );
  };

  const memoizedContent = renderContent();

  return (
    <div className="channel-heatmap-container" data-analysis-type="growth-tracker" data-analysis-name="Growth Tracker" data-analysis-order="2" style={{ width: '100%' }}>
      {memoizedContent}
    </div>
  );
};

export default React.memo(GrowthTracker);
