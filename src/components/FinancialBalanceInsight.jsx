import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, TrendingUp, Target, Users, Loader, AlertTriangle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import FinancialEmptyState from './FinancialEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FinancialBalanceInsight = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  financialBalanceData: propFinancialBalanceData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    financialBalanceData: storeFinancialBalanceData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('financialBalance');

  // Helper function to get financial data from either structure
  const getFinancialData = useCallback((data) => {
    if (!data) return null;
    return data.financialHealth || data.financialBalanceInsight || (Object.keys(data).length > 0 && !data.financialHealth ? data : null);
  }, []);

  // Normalize data from store or props
  const analysisData = useMemo(() => {
    const rawData = propFinancialBalanceData || storeFinancialBalanceData;
    if (!rawData) return null;
    const financialData = getFinancialData(rawData);
    return financialData ? { financialHealth: financialData } : null;
  }, [propFinancialBalanceData, storeFinancialBalanceData, getFinancialData]);

  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.financialBalance || {
      displayName: 'Financial Balance Insight',
      customMessage: 'Answer more financial questions to unlock detailed balance sheet and ratio analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'financialBalance',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isFinancialBalanceDataIncomplete = useCallback((data) => {
    if (!data) return true;
    const financialData = getFinancialData(data);
    if (!financialData) return true;

    const { balanceSheet, innovationInvestment } = financialData;
    if (!balanceSheet || !balanceSheet.assets || !balanceSheet.liabilities) return true;
    if (!innovationInvestment) return true;
    
    return false;
  }, [getFinancialData]);

  const parseCurrency = useCallback((value) => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    
    const cleaned = value.toString().replace(/[$,KkMm\s]/g, '');
    const number = parseFloat(cleaned);
    
    if (value.includes('K') || value.includes('k')) return number * 1000;
    if (value.includes('M') || value.includes('m')) return number * 1000000;
    
    return number || 0;
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (err) {
        setError(`Failed to generate analysis: ${err.message}`);
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('financialBalance', questions, userAnswers, selectedBusinessId);
      } catch (err) {
        setError(`Failed to generate analysis: ${err.message}`);
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

  const handleFileUpload = useCallback((file) => {
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF, image, Excel, or CSV file.');
      }
    }
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const prepareBalanceSheetData = useMemo(() => {
    if (!analysisData) return [];
    const financialData = getFinancialData(analysisData);
    if (!financialData?.balanceSheet) return [];

    const { assets, liabilities, equity } = financialData.balanceSheet;
    
    return [
      {
        category: 'Assets',
        value: parseCurrency(assets.total),
        breakdown: assets.breakdown,
        type: 'assets'
      },
      {
        category: 'Liabilities',
        value: parseCurrency(liabilities.total),
        breakdown: liabilities.breakdown,
        type: 'liabilities'
      },
      {
        category: 'Equity',
        value: parseCurrency(equity),
        type: 'equity'
      }
    ];
  }, [analysisData, getFinancialData, parseCurrency]);

  const assetsBreakdownData = useMemo(() => {
    if (!analysisData) return [];
    const financialData = getFinancialData(analysisData);
    if (!financialData?.balanceSheet?.assets?.breakdown) return [];

    const breakdown = financialData.balanceSheet.assets.breakdown;
    const result = [];
    
    Object.entries(breakdown).forEach(([key, value]) => {
      if (value && value !== '') {
        result.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: parseCurrency(value),
          fill: key === 'cash' ? '#10b981' : key === 'receivables' ? '#3b82f6' : '#f59e0b'
        });
      }
    });
    
    return result;
  }, [analysisData, getFinancialData, parseCurrency]);

  const ratiosData = useMemo(() => {
    if (!analysisData) return [];
    const financialData = getFinancialData(analysisData);
    if (!financialData?.ratios) return [];

    const ratios = financialData.ratios;
    const result = [];
    
    if (ratios.debtToEquity !== '' && ratios.debtToEquity !== undefined) {
      result.push({
        name: 'Debt to Equity',
        value: parseFloat(ratios.debtToEquity) || 0,
        target: 0.4,
        status: (parseFloat(ratios.debtToEquity) || 0) <= 0.6 ? 'good' : 'warning'
      });
    }
    
    if (ratios.currentRatio !== '' && ratios.currentRatio !== undefined) {
      result.push({
        name: 'Current Ratio',
        value: parseFloat(ratios.currentRatio) || 0,
        target: 2.0,
        status: (parseFloat(ratios.currentRatio) || 0) >= 1.5 ? 'good' : 'warning'
      });
    }
    
    if (ratios.quickRatio !== '' && ratios.quickRatio !== undefined) {
      result.push({
        name: 'Quick Ratio',
        value: parseFloat(ratios.quickRatio) || 0,
        target: 1.5,
        status: (parseFloat(ratios.quickRatio) || 0) >= 1.0 ? 'good' : 'warning'
      });
    }
    
    return result;
  }, [analysisData, getFinancialData]);

  const BalanceSheetTooltip = React.memo(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{label}</div>
          <div className="ch-tooltip-content">
            <div>{`Total: $${data.value.toLocaleString()}`}</div>
            {data.breakdown && (
              <div className="breakdown-items">
                {Object.entries(data.breakdown).map(([key, value]) => (
                  value && value !== '' && (
                    <div key={key}>{`${key}: ${value}`}</div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  });

  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating financial balance analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <AnalysisError 
          error={error}
          onRetry={handleRegenerate}
          title="Financial Balance Analysis Error"
        />
      );
    }

    if (!analysisData || isFinancialBalanceDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="financialBalance"
          analysisDisplayName="Financial Balance Insight"
          icon={DollarSign}
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
          fileUploadMessage="Upload financial statements (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      );
    }

    const financialData = getFinancialData(analysisData);
    const { balanceSheet, ratios, innovationInvestment } = financialData;
    const totalAssets = parseCurrency(balanceSheet.assets.total);
    const totalLiabilities = parseCurrency(balanceSheet.liabilities.total);
    const netWorth = parseCurrency(balanceSheet.equity);
    const annualInvestment = parseCurrency(innovationInvestment.annual);
    const percentOfRevenue = innovationInvestment.percentOfRevenue || 'N/A';
    const innovationROI = totalAssets > 0 ? ((annualInvestment / totalAssets) * 100).toFixed(1) : '0';

    return (
      <>
        {/* Key Metrics */}
        <div className="ch-metrics">
          <div className="ch-metric-card ch-metric-blue">
            <div className="ch-metric-header">
              <DollarSign size={20} />
              <span>Total Assets</span>
            </div>
            <p className="ch-metric-value">${totalAssets.toLocaleString()}</p>
          </div>

          <div className="ch-metric-card ch-metric-green">
            <div className="ch-metric-header">
              <Target size={20} />
              <span>Net Worth</span>
            </div>
            <p className="ch-metric-value">${netWorth.toLocaleString()}</p>
          </div>

          <div className="ch-metric-card ch-metric-purple">
            <div className="ch-metric-header">
              <TrendingUp size={20} />
              <span>Total Liabilities</span>
            </div>
            <p className="ch-metric-value">${totalLiabilities.toLocaleString()}</p>
          </div>

          <div className="ch-metric-card ch-metric-orange">
            <div className="ch-metric-header">
              <Users size={20} />
              <span>Innovation Investment</span>
            </div>
            <p className="ch-metric-value">${annualInvestment.toLocaleString()}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="ch-heatmap-container">
          <div className="ch-heatmap-scroll">
            <div className="ch-heatmap-header-section">
              <h3 className="ch-section-title">Financial Balance Analysis</h3>
            </div>

            <div className="ch-charts-grid">
              {/* Balance Sheet Overview */}
              <div className="ch-chart-section">
                <h4>Balance Sheet Overview</h4>
                <div className="ch-chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareBalanceSheetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip content={<BalanceSheetTooltip />} />
                      <Bar dataKey="value">
                        {prepareBalanceSheetData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.type === 'assets' ? '#10b981' :
                                entry.type === 'liabilities' ? '#ef4444' : '#3b82f6'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assets Breakdown */}
              {assetsBreakdownData.length > 0 && (
                <div className="ch-chart-section">
                  <h4>Assets Breakdown</h4>
                  <div className="ch-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={assetsBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetsBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Ratios */}
        {ratiosData.length > 0 && (
          <div className="ch-breakdown-section">
            <h3 className="ch-section-title">Financial Ratios & Health</h3>
            <div className="ch-breakdown-grid">
              {ratiosData.map((ratio, index) => (
                <div key={index} className="ch-breakdown-card">
                  <h4>{ratio.name}</h4>
                  <div className="ch-cost-item">
                    <span>Current:</span>
                    <span className={ratio.status === 'good' ? 'text-green-600' : 'text-yellow-600'}>
                      {ratio.value}
                    </span>
                  </div>
                  <div className="ch-cost-item">
                    <span>Target:</span>
                    <span>{ratio.target}</span>
                  </div>
                  <div className="ratio-status">
                    <span className={`status-badge ${ratio.status}`}>
                      {ratio.status === 'good' ? '✓ Good' : '⚠ Monitor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Balance Sheet Details */}
        <div className="ch-breakdown-section">
          <h3 className="ch-section-title">Balance Sheet Details</h3>
          <div className="ch-breakdown-grid">
            <div className="ch-breakdown-card">
              <h4>Assets</h4>
              <div className="ch-cost-item">
                <span>Total:</span>
                <span>${totalAssets.toLocaleString()}</span>
              </div>
              {balanceSheet.assets.breakdown && Object.entries(balanceSheet.assets.breakdown).map(([key, value]) => (
                value && value !== '' && (
                  <div key={key} className="ch-cost-item">
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                    <span>{value}</span>
                  </div>
                )
              ))}
            </div>

            <div className="ch-breakdown-card">
              <h4>Liabilities</h4>
              <div className="ch-cost-item">
                <span>Total:</span>
                <span>${totalLiabilities.toLocaleString()}</span>
              </div>
              {balanceSheet.liabilities.breakdown && Object.entries(balanceSheet.liabilities.breakdown).map(([key, value]) => (
                value && value !== '' && (
                  <div key={key} className="ch-cost-item">
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                    <span>{value}</span>
                  </div>
                )
              ))}
            </div>

            <div className="ch-breakdown-card">
              <h4>Owner's Equity</h4>
              <div className="ch-cost-item">
                <span>Net Worth:</span>
                <span className="text-green-600">${netWorth.toLocaleString()}</span>
              </div>
              <div className="ch-cost-item">
                <span>Assets - Liabilities:</span>
                <span>${(totalAssets - totalLiabilities).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Innovation Investment */}
        <div className="ch-breakdown-section">
          <h3 className="ch-section-title">Innovation Investment</h3>
          <div className="ch-breakdown-grid">
            <div className="ch-breakdown-card">
              <h4>Annual Investment</h4>
              <div className="ch-cost-item">
                <span>Amount:</span>
                <span>${annualInvestment.toLocaleString()}</span>
              </div>
              {percentOfRevenue !== 'N/A' && percentOfRevenue !== '' && (
                <div className="ch-cost-item">
                  <span>% of Revenue:</span>
                  <span>{percentOfRevenue}%</span>
                </div>
              )}
            </div>

            <div className="ch-breakdown-card">
              <h4>Focus Areas</h4>
              <div className="ch-cost-components">
                <ul>
                  {innovationInvestment.focusAreas && innovationInvestment.focusAreas.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="ch-breakdown-card">
              <h4>Investment Analysis</h4>
              <div className="ch-cost-item">
                <span>ROI on Assets:</span>
                <span>{innovationROI}%</span>
              </div>
              <div className="ch-cost-item">
                <span>Status:</span>
                <span className={parseFloat(percentOfRevenue) > 5 ? 'text-green-600' : 'text-yellow-600'}>
                  {parseFloat(percentOfRevenue) > 5 ? 'Above Average' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="channel-heatmap channel-heatmap-container" 
      data-analysis-type="financial-health"
      data-analysis-name="Financial Health"
      data-analysis-order="3">
      {renderContent()}
    </div>
  );
};

export default React.memo(FinancialBalanceInsight);