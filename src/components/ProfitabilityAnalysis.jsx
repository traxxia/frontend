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
  
  if (key === 'ebitda_margin') {
    if (value >= 0.15) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.08) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'net_profit_margin') {
    if (value >= 0.10) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.05) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'roe') {
    if (value >= 0.15) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.08) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'roce') {
    if (value >= 0.12) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.06) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  if (key === 'roa') {
    if (value >= 0.05) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 0.02) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'Low', colorClass: 'red' };
  }
  
  return { label: 'N/A', colorClass: 'null' };
};

const formatPercentageValue = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  return `${(num * 100).toFixed(2)}%`;
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

const getNormalizedData = data => {
  if (!data) return null;
  if (data.profitability) return data.profitability;
  if (data.ebitda_margin && data.ebitda_margin.value !== undefined) return data;
  const wrapper = data.profitabilityAnalysis || data.profitability_analysis || data.ProfitabilityAnalysis;
  if (wrapper) return wrapper.profitability || wrapper;
  return null;
};

const isProfitabilityDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  
  const metricsToCheck = [
    'ebitda_margin',
    'net_profit_margin',
    'roe',
    'roce',
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
    <div className="profitability-analysis__citation-badge" title={citation.text || ''}>
      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
      <span>{displaySource}</span>
    </div>
  );
};

const ProfitabilityAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName,
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  profitabilityData = null,
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
    profitabilityData: storeProfitabilityData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('profitabilityAnalysis');
  
  const analysisData = useMemo(() => {
    const rawData = profitabilityData || storeProfitabilityData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      profitability: normalized
    } : null;
  }, [profitabilityData, storeProfitabilityData]);

  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.profitability || {
      displayName: t('profitability_analysis_display_name', 'Profitability Analysis'),
      customMessage: t('profitability_efficiency_unlock_msg', 'Answer more questions to unlock detailed profitability analysis')
    };
    await checkMissingQuestionsAndRedirect('profitability', selectedBusinessId, handleRedirectToBrief, {
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
        await regenerateIndividualAnalysis('profitabilityAnalysis', questions, userAnswers, selectedBusinessId);
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
          <span>{t('generating_profitability_analysis', 'Generating profitability analysis...')}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="profitability-warning" style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c' }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <h4 className="profitability-warning-title" style={{ margin: 0, fontWeight: 600 }}>{t('analysis_error', 'Analysis Error')}</h4>
            <p className="profitability-warning-text" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isProfitabilityDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState 
          analysisType="profitability" 
          analysisDisplayName={t('profitability_analysis_display_name', 'Profitability Analysis')} 
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
          fileUploadMessage={t('profitability_upload_msg', 'Upload Excel or CSV files with financial data for profitability analysis')} 
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const normalized = getNormalizedData(analysisData);
    
    // Parse all metric fields safely using the unified parseMetric normalizer
    const ebitdaMargin = parseMetric(normalized.ebitda_margin);
    const netProfitMargin = parseMetric(normalized.net_profit_margin);
    const roe = parseMetric(normalized.roe);
    const roce = parseMetric(normalized.roce);
    const roa = parseMetric(normalized.roa);

    const chartRows = [
      {
        key: 'ebitda_margin',
        label: t('ebitda_margin', 'EBITDA Margin'),
        actualValue: ebitdaMargin.value,
        colorClass: getProfitabilityStatus('ebitda_margin', ebitdaMargin.value).colorClass,
        period: ebitdaMargin.period,
        citation: ebitdaMargin.citation
      },
      {
        key: 'net_profit_margin',
        label: t('net_profit_margin', 'Net Profit Margin'),
        actualValue: netProfitMargin.value,
        colorClass: getProfitabilityStatus('net_profit_margin', netProfitMargin.value).colorClass,
        period: netProfitMargin.period,
        citation: netProfitMargin.citation
      },
      {
        key: 'roe',
        label: t('roe', 'ROE (Return on Equity)'),
        actualValue: roe.value,
        colorClass: getProfitabilityStatus('roe', roe.value).colorClass,
        period: roe.period,
        citation: roe.citation
      },
      {
        key: 'roce',
        label: t('roce', 'ROCE (Return on Capital Employed)'),
        actualValue: roce.value,
        colorClass: getProfitabilityStatus('roce', roce.value).colorClass,
        period: roce.period,
        citation: roce.citation
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
          .profitability-analysis__chart-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            width: 100%;
          }
          [data-theme="dark"] .profitability-analysis__chart-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .profitability-analysis__chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .profitability-analysis__chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          [data-theme="dark"] .profitability-analysis__chart-title {
            color: #f3f4f6;
          }
          .profitability-analysis__chart-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .profitability-analysis__chart-row {
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: center;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
          }
          .profitability-analysis__chart-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          [data-theme="dark"] .profitability-analysis__chart-row {
            border-bottom-color: #374151;
          }
          .profitability-analysis__row-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .profitability-analysis__label-citation {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .profitability-analysis__row-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
          }
          [data-theme="dark"] .profitability-analysis__row-label {
            color: #e5e7eb;
          }
          .profitability-analysis__row-period {
            font-size: 11px;
            color: #6b7280;
            line-height: 1;
            margin-top: 2px;
          }
          [data-theme="dark"] .profitability-analysis__row-period {
            color: #9ca3af;
          }
          .profitability-analysis__bar-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .profitability-analysis__bar {
            height: 14px;
            border-radius: 4px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
          }
          .profitability-analysis__bar--actual-green {
            background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
          }
          .profitability-analysis__bar--actual-yellow {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          }
          .profitability-analysis__bar--actual-red {
            background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
          }
          .profitability-analysis__bar-value {
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            width: 50px;
            flex-shrink: 0;
          }
          .profitability-analysis__bar-value--actual-green {
            color: #10b981;
          }
          .profitability-analysis__bar-value--actual-yellow {
            color: #d97706;
          }
          [data-theme="dark"] .profitability-analysis__bar-value--actual-yellow {
            color: #f59e0b;
          }
          .profitability-analysis__bar-value--actual-red {
            color: #ef4444;
          }
          .profitability-analysis__bar-value--actual-null {
            color: #374151;
            font-size: 14px;
            font-weight: 700;
          }
          [data-theme="dark"] .profitability-analysis__bar-value--actual-null {
            color: #e5e7eb;
          }
          .profitability-analysis__citation-badge {
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
          [data-theme="dark"] .profitability-analysis__citation-badge {
            background-color: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
          }
          @media (max-width: 768px) {
            .profitability-analysis__chart-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding-bottom: 12px;
            }
          }
        `}} />
        <div className="ch-heatmap-scroll" style={{ padding: '4px', width: '100%' }}>
          
          <div className="profitability-analysis__chart-card">
            <div className="profitability-analysis__chart-header">
              <h3 className="profitability-analysis__chart-title">
                {t('profitability_ratios', 'Profitability Ratios')}
              </h3>
            </div>

            <div className="profitability-analysis__chart-rows">
              {chartRows.map((row) => (
                <div className="profitability-analysis__chart-row" key={row.key}>
                  <div className="profitability-efficiency__row-info">
                    <div className="profitability-analysis__label-citation">
                      <span className="profitability-analysis__row-label">{row.label}</span>
                      <MetricCitation citation={row.citation} />
                    </div>
                    {row.period && (
                      <span className="profitability-analysis__row-period">
                        {t('period', 'Period')}: {row.period}
                      </span>
                    )}
                  </div>
                  
                  <div className="profitability-analysis__bar-wrapper">
                    {row.actualValue !== null && (
                      <div 
                        className={`profitability-analysis__bar profitability-analysis__bar--actual-${row.colorClass}`}
                        style={{ width: `${(Math.abs(row.actualValue) / maxValue) * 100}%` }}
                      />
                    )}
                    <span className={`profitability-analysis__bar-value profitability-analysis__bar-value--actual-${row.colorClass}`}>
                      {row.actualValue !== null ? formatPercentageValue(row.actualValue) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    );
  };

  return (
    <div className="profitability-analysis" data-analysis-type="profitability" data-analysis-name="Profitability Analysis" data-analysis-order="1" style={{ width: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default React.memo(ProfitabilityAnalysis);
