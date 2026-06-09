import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Loader, AlertCircle, Info } from 'lucide-react';
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

const getRatioStatus = (key, value) => {
  if (value === null || value === undefined) return { label: 'N/A', colorClass: 'null' };
  
  if (key === 'current_ratio') {
    if (value >= 1.5) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 1.0) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'quick_ratio') {
    if (value >= 1.0) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.8) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'cash_ratio') {
    if (value >= 0.5) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.2) return { label: 'Adequate', colorClass: 'yellow' };
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

const getNormalizedData = data => {
  if (!data) return null;
  if (data.liquidity) return data.liquidity;
  if (data.current_ratio && data.quick_ratio) return data;
  const wrapper = data.liquidityEfficiency || data.liquidity_efficiency || data.LiquidityEfficiency;
  if (wrapper) return wrapper.liquidity || wrapper;
  return null;
};

const isLiquidityDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  
  // Check if at least one ratio has a valid value. If all 3 ratios are empty, treat as incomplete/empty state.
  const ratioMetrics = ['current_ratio', 'quick_ratio', 'cash_ratio'];
  const hasValidRatio = ratioMetrics.some(key => {
    const parsed = parseMetric(normalized[key]);
    return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
  });
  
  if (!hasValidRatio) return true;

  const metricsToCheck = [
    'current_ratio',
    'quick_ratio',
    'cash_ratio',
    'operating_cash_flow',
    'working_capital',
    'cash_and_equivalents'
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
    <div className="liquidity-efficiency__citation-badge" title={citation.text || ''}>
      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
      <span>{displaySource}</span>
    </div>
  );
};

const ReserveCard = ({ label, metric }) => {
  const { t } = useTranslation();
  const { value, currency, period, citation } = metric;
  
  return (
    <div className="liquidity-efficiency__reserve-card">
      <div className="liquidity-efficiency__reserve-header">
        <div className="liquidity-efficiency__reserve-title">{label}</div>
        {period && (
          <div className="liquidity-efficiency__reserve-period">
            {t('period', 'Period')}: {period}
          </div>
        )}
      </div>
      <div className="liquidity-efficiency__reserve-body">
        <div className="liquidity-efficiency__reserve-value">
          {formatCurrencyValue(value, currency)}
        </div>
        <MetricCitation citation={citation} />
      </div>
    </div>
  );
};

const LiquidityEfficiency = ({
  questions = [],
  userAnswers = {},
  businessName,
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  liquidityData = null,
  liquidityEfficiencyData = null,
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
    liquidityEfficiencyData: storeLiquidityData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('liquidityEfficiency');
  
  const analysisData = useMemo(() => {
    const rawData = liquidityData || liquidityEfficiencyData || storeLiquidityData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      liquidity: normalized
    } : null;
  }, [liquidityData, liquidityEfficiencyData, storeLiquidityData]);

  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const activeBusinessName = businessName || t('yourBusiness', 'Your Business');

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.liquidityEfficiency || {
      displayName: t('Liquidity_Efficiency', 'Liquidity & Efficiency'),
      customMessage: t('liquidity_efficiency_unlock_msg', 'Answer more questions to unlock detailed liquidity analysis')
    };
    await checkMissingQuestionsAndRedirect('liquidityEfficiency', selectedBusinessId, handleRedirectToBrief, {
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
        await regenerateIndividualAnalysis('liquidityEfficiency', questions, userAnswers, selectedBusinessId);
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
          <span>{t('generating_liquidity_analysis', 'Generating liquidity & efficiency analysis...')}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="liquidity-efficiency__warning">
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <h4 className="liquidity-efficiency__warning-title">{t('analysis_error', 'Analysis Error')}</h4>
            <p className="liquidity-efficiency__warning-text">{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isLiquidityDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState 
          analysisType="liquidityEfficiency" 
          analysisDisplayName={t('liquidity_analysis_display_name', 'Liquidity & Efficiency Analysis')} 
          icon={Activity} 
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
          fileUploadMessage={t('liquidity_upload_msg', 'Upload Excel or CSV files with financial data for liquidity & efficiency analysis')} 
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const normalized = getNormalizedData(analysisData);
    
    // Parse all metric fields safely using the unified parseMetric normalizer
    const currentRatio = parseMetric(normalized.current_ratio);
    const quickRatio = parseMetric(normalized.quick_ratio);
    const cashRatio = parseMetric(normalized.cash_ratio);
    const operatingCashFlow = parseMetric(normalized.operating_cash_flow);
    const workingCapital = parseMetric(normalized.working_capital);
    const cashAndEquivalents = parseMetric(normalized.cash_and_equivalents);

    const chartRows = [
      {
        key: 'current_ratio',
        label: t('current_ratio', 'Current Ratio'),
        actualValue: currentRatio.value,
        colorClass: getRatioStatus('current_ratio', currentRatio.value).colorClass,
        period: currentRatio.period,
        citation: currentRatio.citation
      },
      {
        key: 'quick_ratio',
        label: t('quick_ratio', 'Quick Ratio'),
        actualValue: quickRatio.value,
        colorClass: getRatioStatus('quick_ratio', quickRatio.value).colorClass,
        period: quickRatio.period,
        citation: quickRatio.citation
      },
      {
        key: 'cash_ratio',
        label: t('cash_ratio', 'Cash Ratio'),
        actualValue: cashRatio.value,
        colorClass: getRatioStatus('cash_ratio', cashRatio.value).colorClass,
        period: cashRatio.period,
        citation: cashRatio.citation
      }
    ];

    // Calculate maximum value for chart scaling (cap minimum at 3.0)
    const maxValue = Math.max(
      ...chartRows.map(r => r.actualValue || 0),
      3.0
    );

    return (
      <div className="ch-heatmap-container" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .liquidity-efficiency__chart-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 16px;
            width: 100%;
          }
          [data-theme="dark"] .liquidity-efficiency__chart-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .liquidity-efficiency__chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .liquidity-efficiency__chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          [data-theme="dark"] .liquidity-efficiency__chart-title {
            color: #f3f4f6;
          }
          .liquidity-efficiency__chart-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .liquidity-efficiency__chart-row {
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: center;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
          }
          .liquidity-efficiency__chart-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          [data-theme="dark"] .liquidity-efficiency__chart-row {
            border-bottom-color: #374151;
          }
          .liquidity-efficiency__row-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .liquidity-efficiency__label-citation {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .liquidity-efficiency__row-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
          }
          [data-theme="dark"] .liquidity-efficiency__row-label {
            color: #e5e7eb;
          }
          .liquidity-efficiency__row-period {
            font-size: 11px;
            color: #6b7280;
            line-height: 1;
            margin-top: 2px;
          }
          [data-theme="dark"] .liquidity-efficiency__row-period {
            color: #9ca3af;
          }
          .liquidity-efficiency__bar-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .liquidity-efficiency__bar {
            height: 14px;
            border-radius: 4px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
          }
          .liquidity-efficiency__bar--actual-green {
            background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
          }
          .liquidity-efficiency__bar--actual-yellow {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          }
          .liquidity-efficiency__bar--actual-red {
            background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
          }
          .liquidity-efficiency__bar--actual-null {
            background-color: #e5e7eb;
            border: 1px dashed #9ca3af;
          }
          [data-theme="dark"] .liquidity-efficiency__bar--actual-null {
            background-color: #374151;
            border-color: #4b5563;
          }
          .liquidity-efficiency__bar-value {
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            width: 36px;
            flex-shrink: 0;
          }
          .liquidity-efficiency__bar-value--actual-green {
            color: #10b981;
          }
          .liquidity-efficiency__bar-value--actual-yellow {
            color: #d97706;
          }
          [data-theme="dark"] .liquidity-efficiency__bar-value--actual-yellow {
            color: #f59e0b;
          }
          .liquidity-efficiency__bar-value--actual-red {
            color: #ef4444;
          }
          .liquidity-efficiency__bar-value--actual-null {
            color: #374151;
            font-size: 14px;
            font-weight: 700;
          }
          [data-theme="dark"] .liquidity-efficiency__bar-value--actual-null {
            color: #e5e7eb;
          }
          .liquidity-efficiency__section-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin: 20px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }
          [data-theme="dark"] .liquidity-efficiency__section-title {
            color: #e5e7eb;
            border-bottom-color: #374151;
          }
          .liquidity-efficiency__reserves-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }
          .liquidity-efficiency__reserve-card {
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
          .liquidity-efficiency__reserve-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          [data-theme="dark"] .liquidity-efficiency__reserve-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .liquidity-efficiency__reserve-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .liquidity-efficiency__reserve-title {
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
          }
          [data-theme="dark"] .liquidity-efficiency__reserve-title {
            color: #9ca3af;
          }
          .liquidity-efficiency__reserve-period {
            font-size: 11px;
            color: #9ca3af;
          }
          .liquidity-efficiency__reserve-body {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .liquidity-efficiency__reserve-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }
          [data-theme="dark"] .liquidity-efficiency__reserve-value {
            color: #f3f4f6;
          }
          .liquidity-efficiency__citation-badge {
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
          [data-theme="dark"] .liquidity-efficiency__citation-badge {
            background-color: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
          }
          @media (max-width: 768px) {
            .liquidity-efficiency__chart-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding-bottom: 12px;
            }
            .liquidity-efficiency__reserves-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}} />
        <div className="ch-heatmap-scroll" style={{ padding: '4px', width: '100%' }}>
          
          <div className="liquidity-efficiency__chart-card">
            <div className="liquidity-efficiency__chart-header">
              <h3 className="liquidity-efficiency__chart-title">
                {t('liquidity_ratios', 'Liquidity Ratios')}
              </h3>
            </div>

            <div className="liquidity-efficiency__chart-rows">
              {chartRows.map((row) => (
                <div className="liquidity-efficiency__chart-row" key={row.key}>
                  <div className="liquidity-efficiency__row-info">
                    <div className="liquidity-efficiency__label-citation">
                      <span className="liquidity-efficiency__row-label">{row.label}</span>
                      <MetricCitation citation={row.citation} />
                    </div>
                    {row.period && (
                      <span className="liquidity-efficiency__row-period">
                        {t('period', 'Period')}: {row.period}
                      </span>
                    )}
                  </div>
                  
                  <div className="liquidity-efficiency__bar-wrapper">
                    {row.actualValue !== null && (
                      <div 
                        className={`liquidity-efficiency__bar liquidity-efficiency__bar--actual-${row.colorClass}`}
                        style={{ width: `${(row.actualValue / maxValue) * 100}%` }}
                      />
                    )}
                    <span className={`liquidity-efficiency__bar-value liquidity-efficiency__bar-value--actual-${row.colorClass}`}>
                      {row.actualValue !== null ? row.actualValue.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="liquidity-efficiency__section-title">
            {t('cash_reserves_and_flows', 'Cash Reserves & Flows')}
          </div>

          <div className="liquidity-efficiency__reserves-grid">
            <ReserveCard 
              label={t('cash_and_equivalents', 'Cash & Equivalents')} 
              metric={cashAndEquivalents} 
            />
            <ReserveCard 
              label={t('working_capital', 'Working Capital')} 
              metric={workingCapital} 
            />
            <ReserveCard 
              label={t('operating_cash_flow', 'Operating Cash Flow')} 
              metric={operatingCashFlow} 
            />
          </div>
          
        </div>
      </div>
    );
  };

  return (
    <div className="liquidity-efficiency" data-analysis-type="liquidity-efficiency" data-analysis-name="Liquidity & Efficiency" data-analysis-order="3" style={{ width: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default React.memo(LiquidityEfficiency);
