import React, { useState, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Loader, AlertCircle, Info } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from "../store";
import FinancialEmptyState from './FinancialEmptyState';

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

const getLeverageStatus = (key, value) => {
  if (value === null || value === undefined) return { label: 'N/A', colorClass: 'null' };
  
  if (key === 'debt_to_equity') {
    if (value <= 1.0) return { label: 'Optimal', colorClass: 'green' };
    if (value <= 2.0) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'High Risk', colorClass: 'red' };
  }
  
  if (key === 'debt_to_assets') {
    if (value <= 0.4) return { label: 'Optimal', colorClass: 'green' };
    if (value <= 0.6) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'High Risk', colorClass: 'red' };
  }
  
  if (key === 'interest_coverage') {
    if (value >= 3.0) return { label: 'Optimal', colorClass: 'green' };
    if (value >= 1.5) return { label: 'Adequate', colorClass: 'yellow' };
    return { label: 'High Risk', colorClass: 'red' };
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

const formatRatioValue = (metricKey, val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[,$%]/g, '')) : val;
  if (isNaN(num)) return val;
  if (metricKey === 'interest_coverage') {
    return `${num.toFixed(2)}x`;
  }
  return num.toFixed(2);
};

const getNormalizedData = data => {
  if (!data) return null;
  if (data.leverage) return data.leverage;
  if (data.debt_to_equity && data.interest_coverage) return data;
  const wrapper = data.leverageRisk || data.leverage_risk || data.LeverageRisk;
  if (wrapper) return wrapper.leverage || wrapper;
  return null;
};

const isLeverageDataIncomplete = data => {
  const normalized = getNormalizedData(data);
  if (!normalized) return true;
  
  // If the three leverage ratios are all empty, treat as incomplete/empty state
  const ratioMetrics = ['debt_to_equity', 'debt_to_assets', 'interest_coverage'];
  const hasValidRatio = ratioMetrics.some(key => {
    const parsed = parseMetric(normalized[key]);
    return parsed.value !== null && parsed.value !== undefined && parsed.value !== '' && !isNaN(parseFloat(parsed.value));
  });
  
  if (!hasValidRatio) return true;

  const metricsToCheck = [
    'debt_to_equity',
    'debt_to_assets',
    'net_debt',
    'interest_coverage',
    'total_debt'
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
    <div className="leverage-risk__citation-badge" title={citation.text || ''}>
      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
      <span>{displaySource}</span>
    </div>
  );
};

const ReserveCard = ({ label, metric }) => {
  const { t } = useTranslation();
  const { value, currency, period, citation } = metric;
  
  return (
    <div className="leverage-risk__reserve-card">
      <div className="leverage-risk__reserve-header">
        <div className="leverage-risk__reserve-title">{label}</div>
        {period && (
          <div className="leverage-risk__reserve-period">
            {t('period', 'Period')}: {period}
          </div>
        )}
      </div>
      <div className="leverage-risk__reserve-body">
        <div className="leverage-risk__reserve-value">
          {formatCurrencyValue(value, currency)}
        </div>
        <MetricCitation citation={citation} />
      </div>
    </div>
  );
};

const LeverageRisk = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  leverageData = null,
  leverageRiskData = null,
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
    leverageRiskData: storeLeverageData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('leverageRisk');
  
  const analysisData = useMemo(() => {
    const rawData = leverageData || leverageRiskData || storeLeverageData;
    if (!rawData) return null;
    const normalized = getNormalizedData(rawData);
    return normalized ? {
      leverage: normalized
    } : null;
  }, [leverageData, leverageRiskData, storeLeverageData]);

  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.leverageRisk || {
      displayName: t('leverage_analysis_display_name', 'Leverage & Risk Analysis'),
      customMessage: t('leverage_efficiency_unlock_msg', 'Answer more questions to unlock detailed leverage & risk analysis')
    };
    await checkMissingQuestionsAndRedirect('leverageRisk', selectedBusinessId, handleRedirectToBrief, {
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
        await regenerateIndividualAnalysis('leverageRisk', questions, userAnswers, selectedBusinessId);
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
          <span>{t('generating_leverage_analysis', 'Generating leverage & risk analysis...')}</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="leverage-risk__warning" style={{ display: 'flex', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c' }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <h4 className="leverage-risk__warning-title" style={{ margin: 0, fontWeight: 600 }}>{t('analysis_error', 'Analysis Error')}</h4>
            <p className="leverage-risk__warning-text" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{error}</p>
          </div>
        </div>
      );
    }

    if (!analysisData || isLeverageDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState 
          analysisType="leverageRisk" 
          analysisDisplayName={t('leverage_analysis_display_name', 'Leverage & Risk Analysis')} 
          icon={AlertTriangle} 
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
          fileUploadMessage={t('leverage_upload_msg', 'Upload Excel or CSV files with financial data for leverage & risk analysis')} 
          acceptedFileTypes=".xlsx,.xls,.csv" 
          documentInfo={documentInfo} 
        />
      );
    }

    const normalized = getNormalizedData(analysisData);
    
    // Parse all metric fields safely using the unified parseMetric normalizer
    const debtToEquity = parseMetric(normalized.debt_to_equity);
    const debtToAssets = parseMetric(normalized.debt_to_assets);
    const netDebt = parseMetric(normalized.net_debt);
    const interestCoverage = parseMetric(normalized.interest_coverage);
    const totalDebt = parseMetric(normalized.total_debt);

    const chartRows = [
      {
        key: 'debt_to_equity',
        label: t('debt_to_equity', 'Debt-to-Equity Ratio'),
        actualValue: debtToEquity.value,
        colorClass: getLeverageStatus('debt_to_equity', debtToEquity.value).colorClass,
        period: debtToEquity.period,
        citation: debtToEquity.citation
      },
      {
        key: 'debt_to_assets',
        label: t('debt_to_assets', 'Debt-to-Assets Ratio'),
        actualValue: debtToAssets.value,
        colorClass: getLeverageStatus('debt_to_assets', debtToAssets.value).colorClass,
        period: debtToAssets.period,
        citation: debtToAssets.citation
      },
      {
        key: 'interest_coverage',
        label: t('interest_coverage', 'Interest Coverage Ratio'),
        actualValue: interestCoverage.value,
        colorClass: getLeverageStatus('interest_coverage', interestCoverage.value).colorClass,
        period: interestCoverage.period,
        citation: interestCoverage.citation
      }
    ];


    return (
      <div className="ch-heatmap-container" style={{ width: '100%' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .leverage-risk__chart-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 16px;
            width: 100%;
          }
          [data-theme="dark"] .leverage-risk__chart-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .leverage-risk__chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .leverage-risk__chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          [data-theme="dark"] .leverage-risk__chart-title {
            color: #f3f4f6;
          }
          .leverage-risk__chart-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .leverage-risk__chart-row {
            display: grid;
            grid-template-columns: 180px 1fr;
            align-items: center;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
          }
          .leverage-risk__chart-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          [data-theme="dark"] .leverage-risk__chart-row {
            border-bottom-color: #374151;
          }
          .leverage-risk__row-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .leverage-risk__label-citation {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .leverage-risk__row-label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
          }
          [data-theme="dark"] .leverage-risk__row-label {
            color: #e5e7eb;
          }
          .leverage-risk__row-period {
            font-size: 11px;
            color: #6b7280;
            line-height: 1;
            margin-top: 2px;
          }
          [data-theme="dark"] .leverage-risk__row-period {
            color: #9ca3af;
          }
          .leverage-risk__bar-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .leverage-risk__bar {
            height: 14px;
            border-radius: 4px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4px;
          }
          .leverage-risk__bar--actual-green {
            background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
          }
          .leverage-risk__bar--actual-yellow {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          }
          .leverage-risk__bar--actual-red {
            background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
          }
          .leverage-risk__bar-value {
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            width: 50px;
            flex-shrink: 0;
          }
          .leverage-risk__bar-value--actual-green {
            color: #10b981;
          }
          .leverage-risk__bar-value--actual-yellow {
            color: #d97706;
          }
          [data-theme="dark"] .leverage-risk__bar-value--actual-yellow {
            color: #f59e0b;
          }
          .leverage-risk__bar-value--actual-red {
            color: #ef4444;
          }
          .leverage-risk__bar-value--actual-null {
            color: #374151;
            font-size: 14px;
            font-weight: 700;
          }
          [data-theme="dark"] .leverage-risk__bar-value--actual-null {
            color: #e5e7eb;
          }
          .leverage-risk__section-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin: 20px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }
          [data-theme="dark"] .leverage-risk__section-title {
            color: #e5e7eb;
            border-bottom-color: #374151;
          }
          .leverage-risk__reserves-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }
          .leverage-risk__reserve-card {
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
          .leverage-risk__reserve-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          [data-theme="dark"] .leverage-risk__reserve-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          .leverage-risk__reserve-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .leverage-risk__reserve-title {
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
          }
          [data-theme="dark"] .leverage-risk__reserve-title {
            color: #9ca3af;
          }
          .leverage-risk__reserve-period {
            font-size: 11px;
            color: #9ca3af;
          }
          .leverage-risk__reserve-body {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .leverage-risk__reserve-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }
          [data-theme="dark"] .leverage-risk__reserve-value {
            color: #f3f4f6;
          }
          .leverage-risk__citation-badge {
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
          [data-theme="dark"] .leverage-risk__citation-badge {
            background-color: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
          }
          @media (max-width: 768px) {
            .leverage-risk__chart-row {
              grid-template-columns: 1fr;
              gap: 8px;
              padding-bottom: 12px;
            }
            .leverage-risk__reserves-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}} />
        <div className="ch-heatmap-scroll" style={{ padding: '4px', width: '100%' }}>
          
          <div className="leverage-risk__chart-card">
            <div className="leverage-risk__chart-header">
              <h3 className="leverage-risk__chart-title">
                {t('leverage_ratios', 'Leverage Ratios')}
              </h3>
            </div>

            <div className="leverage-risk__chart-rows">
              {chartRows.map((row) => {
                const absVal = row.actualValue !== null ? Math.abs(row.actualValue) : 0;
                let scaleMax = 3.0;
                if (row.key === 'debt_to_equity') {
                  scaleMax = 2.0;
                } else if (row.key === 'debt_to_assets') {
                  scaleMax = 1.0;
                } else if (row.key === 'interest_coverage') {
                  scaleMax = 5.0;
                }
                const barWidth = row.actualValue !== null 
                  ? Math.min((absVal / Math.max(absVal, scaleMax)) * 100, 100)
                  : 0;

                return (
                  <div className="leverage-risk__chart-row" key={row.key}>
                    <div className="leverage-risk__row-info">
                      <div className="leverage-risk__label-citation">
                        <span className="leverage-risk__row-label">{row.label}</span>
                        <MetricCitation citation={row.citation} />
                      </div>
                      {row.period && (
                        <span className="leverage-risk__row-period">
                          {t('period', 'Period')}: {row.period}
                        </span>
                      )}
                    </div>
                    
                    <div className="leverage-risk__bar-wrapper">
                      {row.actualValue !== null && (
                        <div 
                          className={`leverage-risk__bar leverage-risk__bar--actual-${row.colorClass}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                      <span className={`leverage-risk__bar-value leverage-risk__bar-value--actual-${row.colorClass}`}>
                        {row.actualValue !== null ? formatRatioValue(row.key, row.actualValue) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="leverage-risk__section-title">
            {t('leverage_reserves_and_debt', 'Debt & Liabilities')}
          </div>

          <div className="leverage-risk__reserves-grid">
            <ReserveCard 
              label={t('total_debt', 'Total Debt')} 
              metric={totalDebt} 
            />
            <ReserveCard 
              label={t('net_debt', 'Net Debt')} 
              metric={netDebt} 
            />
          </div>
          
        </div>
      </div>
    );
  };

  const memoizedContent = renderContent();

  return (
    <div className="leverage-risk" data-analysis-type="leverage-risk" data-analysis-name="Leverage & Risk" data-analysis-order="5" style={{ width: '100%' }}>
      {memoizedContent}
    </div>
  );
};

export default React.memo(LeverageRisk);
