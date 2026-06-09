import React, { useState, useRef, useCallback, useMemo } from 'react';
import { TrendingUp, Loader, AlertCircle, Info } from 'lucide-react';
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

const getProfitabilityStatus = (key, value) => {
  if (value === null || value === undefined) return { label: 'N/A', colorClass: 'null' };
  
  if (key === 'roe') {
    if (value >= 0.15) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.08) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'roa') {
    if (value >= 0.05) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.02) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  return { label: 'N/A', colorClass: 'null' };
};

const formatCurrencyValue = (val, currency) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0
  });
  return formatter.format(num);
};

const formatPercentageValue = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  return `${(num * 100).toFixed(2)}%`;
};

const formatCardValue = (metricKey, val, currency) => {
  if (val === null || val === undefined || val === '') return '-';
  if (metricKey === 'eps') {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
    if (isNaN(num)) return val;
    return currency ? formatCurrencyValue(num, currency) : num.toFixed(2);
  }
  return formatCurrencyValue(val, currency);
};

const getNormalizedData = data => {
  if (!data) return null;
  if (data.investment) return data.investment;
  if (data.roa || data.roe || data.capex) return data;
  const wrapper = data.investmentPerformance || data.investment_performance || data.InvestmentPerformance;
  if (wrapper) return wrapper.investment || wrapper;
  return null;
};

const isInvestmentDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  
  // If roe and roa are both missing, treat as incomplete/empty state
  const ratioMetrics = ['roe', 'roa'];
  const hasValidRatio = ratioMetrics.some(key => {
    const parsed = parseMetric(normalized[key]);
    return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
  });
  
  if (!hasValidRatio) return true;

  const metricsToCheck = [
    'capex',
    'free_cash_flow',
    'dividends_paid',
    'eps',
    'research_and_development',
    'roe',
    'roa'
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
    <div className="investment-performance__citation-badge" title={citation.text || ''}>
      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
      <span>{displaySource}</span>
    </div>
  );
};

const ReserveCard = ({ label, metricKey, metric }) => {
  const { t } = useTranslation();
  const { value, currency, period, citation } = metric;
  
  return (
    <div className="investment-performance__reserve-card">
      <div className="investment-performance__reserve-header">
        <div className="investment-performance__reserve-title">{label}</div>
        {period && (
          <div className="investment-performance__reserve-period">
            {t('period', 'Period')}: {period}
          </div>
        )}
      </div>
      <div className="investment-performance__reserve-body">
        <div className="investment-performance__reserve-value">
          {formatCardValue(metricKey, value, currency)}
        </div>
        <MetricCitation citation={citation} />
      </div>
    </div>
  );
};

const InvestmentPerformance = ({
  questions = [],
  userAnswers = {},
  businessName,
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  investmentData = null,
  investmentPerformanceData = null,
  selectedBusinessId,
  onRedirectToBrief,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument = false,
  uploadedFile = null,
  readOnly = false,
  documentInfo = null
}) => {
  const { t } = useTranslation();
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
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.investmentPerformance || {
      displayName: t('investment_analysis_display_name', 'Investment Performance Analysis'),
      customMessage: t('investment_efficiency_unlock_msg', 'Answer more questions to unlock detailed investment performance analysis')
    };
    await checkMissingQuestionsAndRedirect('investmentPerformance', selectedBusinessId, handleRedirectToBrief, {
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
        await regenerateIndividualAnalysis('investmentPerformance', questions, userAnswers, selectedBusinessId);
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
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>{t('generating_investment_analysis', 'Generating investment performance analysis...')}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="investment-warning" style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c' }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <h4 className="investment-warning-title" style={{ margin: 0, fontWeight: 600 }}>{t('analysis_error', 'Analysis Error')}</h4>
            <p className="investment-warning-text" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState 
          analysisType="investmentPerformance" 
          analysisDisplayName={t('investment_analysis_display_name', 'Investment Performance Analysis')} 
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
          fileUploadMessage={t('investment_upload_msg', 'Upload Excel or CSV files with financial data for investment performance analysis')} 
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const normalized = getNormalizedData(analysisData);
    
    // Parse all metric fields safely using the unified parseMetric normalizer
    const capex = parseMetric(normalized.capex);
    const freeCashFlow = parseMetric(normalized.free_cash_flow);
    const dividendsPaid = parseMetric(normalized.dividends_paid);
    const eps = parseMetric(normalized.eps);
    const researchAndDevelopment = parseMetric(normalized.research_and_development);
    const roe = parseMetric(normalized.roe);
    const roa = parseMetric(normalized.roa);

    const chartRows = [
      {
        key: 'roe',
        label: t('roe', 'ROE (Return on Equity)'),
        actualValue: roe.value,
        colorClass: getProfitabilityStatus('roe', roe.value).colorClass,
        period: roe.period,
        citation: roe.citation
      },
      {
        key: 'roa',
        label: t('roa', 'ROA (Return on Assets)'),
        actualValue: roa.value,
        colorClass: getProfitabilityStatus('roa', roa.value).colorClass,
        period: roa.period,
        citation: roa.citation
      }
    ];

    // Calculate maximum absolute value for chart scaling (cap minimum at 1.0 i.e. 100%)
    const maxValue = Math.max(
      ...chartRows.map(r => Math.abs(r.actualValue) || 0),
      1.0
    );

    return (
      <div className="ch-heatmap-container" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .investment-performance__chart-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 16px;
            width: 100%;
          }
          [data-theme="dark"] .investment-performance__chart-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .investment-performance__chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .investment-performance__chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          [data-theme="dark"] .investment-performance__chart-title {
            color: #f3f4f6;
          }
          .investment-performance__chart-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .investment-performance__chart-row {
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: center;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
          }
          .investment-performance__chart-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          [data-theme="dark"] .investment-performance__chart-row {
            border-bottom-color: #374151;
          }
          .investment-performance__row-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .investment-performance__label-citation {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .investment-performance__row-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
          }
          [data-theme="dark"] .investment-performance__row-label {
            color: #e5e7eb;
          }
          .investment-performance__row-period {
            font-size: 11px;
            color: #6b7280;
            line-height: 1;
            margin-top: 2px;
          }
          [data-theme="dark"] .investment-performance__row-period {
            color: #9ca3af;
          }
          .investment-performance__bar-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .investment-performance__bar {
            height: 14px;
            border-radius: 4px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
          }
          .investment-performance__bar--actual-green {
            background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
          }
          .investment-performance__bar--actual-yellow {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          }
          .investment-performance__bar--actual-red {
            background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
          }
          .investment-performance__bar-value {
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            width: 50px;
            flex-shrink: 0;
          }
          .investment-performance__bar-value--actual-green {
            color: #10b981;
          }
          .investment-performance__bar-value--actual-yellow {
            color: #d97706;
          }
          [data-theme="dark"] .investment-performance__bar-value--actual-yellow {
            color: #f59e0b;
          }
          .investment-performance__bar-value--actual-red {
            color: #ef4444;
          }
          .investment-performance__bar-value--actual-null {
            color: #374151;
            font-size: 14px;
            font-weight: 700;
          }
          [data-theme="dark"] .investment-performance__bar-value--actual-null {
            color: #e5e7eb;
          }
          .investment-performance__section-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin: 20px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }
          [data-theme="dark"] .investment-performance__section-title {
            color: #e5e7eb;
            border-bottom-color: #374151;
          }
          .investment-performance__reserves-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }
          .investment-performance__reserve-card {
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
          .investment-performance__reserve-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          [data-theme="dark"] .investment-performance__reserve-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .investment-performance__reserve-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .investment-performance__reserve-title {
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
          }
          [data-theme="dark"] .investment-performance__reserve-title {
            color: #9ca3af;
          }
          .investment-performance__reserve-period {
            font-size: 11px;
            color: #9ca3af;
          }
          .investment-performance__reserve-body {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .investment-performance__reserve-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }
          [data-theme="dark"] .investment-performance__reserve-value {
            color: #f3f4f6;
          }
          .investment-performance__citation-badge {
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
          [data-theme="dark"] .investment-performance__citation-badge {
            background-color: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
          }
          @media (max-width: 768px) {
            .investment-performance__chart-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding-bottom: 12px;
            }
            .investment-performance__reserves-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}} />
        <div className="ch-heatmap-scroll" style={{ padding: '4px', width: '100%' }}>
          
          <div className="investment-performance__chart-card">
            <div className="investment-performance__chart-header">
              <h3 className="investment-performance__chart-title">
                {t('investment_ratios', 'Investment Ratios')}
              </h3>
            </div>

            <div className="investment-performance__chart-rows">
              {chartRows.map((row) => (
                <div className="investment-performance__chart-row" key={row.key}>
                  <div className="investment-performance__row-info">
                    <div className="investment-performance__label-citation">
                      <span className="investment-performance__row-label">{row.label}</span>
                      <MetricCitation citation={row.citation} />
                    </div>
                    {row.period && (
                      <span className="investment-performance__row-period">
                        {t('period', 'Period')}: {row.period}
                      </span>
                    )}
                  </div>
                  
                  <div className="investment-performance__bar-wrapper">
                    {row.actualValue !== null && (
                      <div 
                        className={`investment-performance__bar investment-performance__bar--actual-${row.colorClass}`}
                        style={{ width: `${(Math.abs(row.actualValue) / maxValue) * 100}%` }}
                      />
                    )}
                    <span className={`investment-performance__bar-value investment-performance__bar-value--actual-${row.colorClass}`}>
                      {row.actualValue !== null ? formatPercentageValue(row.actualValue) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="investment-performance__section-title">
            {t('investment_funding_and_returns', 'Funding & Returns')}
          </div>

          <div className="investment-performance__reserves-grid">
            <ReserveCard 
              label={t('capex', 'Capital Expenditure (CapEx)')} 
              metricKey="capex"
              metric={capex} 
            />
            <ReserveCard 
              label={t('free_cash_flow', 'Free Cash Flow')} 
              metricKey="free_cash_flow"
              metric={freeCashFlow} 
            />
            <ReserveCard 
              label={t('dividends_paid', 'Dividends Paid')} 
              metricKey="dividends_paid"
              metric={dividendsPaid} 
            />
            <ReserveCard 
              label={t('research_and_development', 'Research & Development (R&D)')} 
              metricKey="research_and_development"
              metric={researchAndDevelopment} 
            />
            <ReserveCard 
              label={t('eps', 'Earnings Per Share (EPS)')} 
              metricKey="eps"
              metric={eps} 
            />
          </div>
          
        </div>
      </div>
    );
  };

  const memoizedContent = renderContent();

  return (
    <div className="investment-performance" data-analysis-type="investment-performance" data-analysis-name="Investment Performance" data-analysis-order="4" style={{ width: '100%' }}>
      {memoizedContent}
    </div>
  );
};

export default React.memo(InvestmentPerformance);
