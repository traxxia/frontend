import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Target, Users, Loader, Upload, X, AlertTriangle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FinancialBalanceInsight = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  financialBalanceData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(financialBalanceData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add refs to track component mount
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const handleMissingQuestionsCheck = async () => {
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
  };

  // Check if the financial balance data is empty/incomplete
  const isFinancialBalanceDataIncomplete = (data) => {
    if (!data) return true;

    // Check if essential data is empty or null
    if (!data.financialBalanceInsight) return true;
    if (!data.financialBalanceInsight.balanceSheet) return true;
    if (!data.financialBalanceInsight.ratios) return true;

    return false;
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  // Update analysis data when prop changes
  useEffect(() => {
    if (financialBalanceData && financialBalanceData !== analysisData) {
      setAnalysisData(financialBalanceData);
      if (onDataGenerated) {
        onDataGenerated(financialBalanceData);
      }
    }
  }, [financialBalanceData]);

  // Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (financialBalanceData) {
      setAnalysisData(financialBalanceData);
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

  // File upload handlers
  const handleFileUpload = (file) => {
    if (file) {
      // Validate file type (PDF, images, Excel, etc.)
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
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateFinancialBalanceAnalysis = async (withFile = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id] && userAnswers[q._id].trim())
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('Please answer some questions first to generate financial balance analysis.');
      }

      // Create FormData
      const formData = new FormData();

      // Add file if provided and withFile is true
      if (withFile && uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        // Create a dummy text file with business information
        const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
        const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
        formData.append('file', dummyFile, 'business_data.txt');
      }

      formData.append('questions', questionsArray.join(','));
      formData.append('answers', answersArray.join('\n'));

      const response = await fetch(`${ML_API_BASE_URL}/financial-health`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Process the result
      let financialBalanceContent = null;
      if (result.financialBalanceInsight) {
        financialBalanceContent = result;
      } else if (result.financial_balance_insight) {
        financialBalanceContent = { financialBalanceInsight: result.financial_balance_insight };
      } else {
        financialBalanceContent = { financialBalanceInsight: result };
      }

      setAnalysisData(financialBalanceContent);

      // Save to backend
      await saveAnalysisToBackend(financialBalanceContent);

      if (onDataGenerated) {
        onDataGenerated(financialBalanceContent);
      }

    } catch (error) {
      console.error('Error generating financial balance analysis:', error);
      setError(`Failed to generate analysis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save analysis to backend using the API endpoint
  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: 'good',
          analysis_type: 'financialBalance',
          analysis_name: 'Financial Balance Insight',
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            business_name: businessName,
            has_uploaded_file: !!uploadedFile
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save Financial Balance analysis');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving Financial Balance analysis to backend:', error);
      throw error;
    }
  };

  // Prepare balance sheet chart data
  const prepareBalanceSheetData = (data) => {
    if (!data?.financialBalanceInsight?.balanceSheet) return [];

    const { assets, liabilities, equity } = data.financialBalanceInsight.balanceSheet;
    
    return [
      {
        category: 'Assets',
        value: assets.total,
        breakdown: assets.breakdown,
        type: 'assets'
      },
      {
        category: 'Liabilities',
        value: liabilities.total,
        breakdown: liabilities.breakdown,
        type: 'liabilities'
      },
      {
        category: 'Equity',
        value: equity,
        type: 'equity'
      }
    ];
  };

  // Prepare assets breakdown data
  const prepareAssetsBreakdownData = (data) => {
    if (!data?.financialBalanceInsight?.balanceSheet?.assets?.breakdown) return [];

    const breakdown = data.financialBalanceInsight.balanceSheet.assets.breakdown;
    return Object.entries(breakdown).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      fill: key === 'cash' ? '#10b981' : key === 'receivables' ? '#3b82f6' : '#f59e0b'
    }));
  };

  // Prepare ratios data
  const prepareRatiosData = (data) => {
    if (!data?.financialBalanceInsight?.ratios) return [];

    const ratios = data.financialBalanceInsight.ratios;
    return [
      {
        name: 'Debt to Equity',
        value: ratios.debtToEquity,
        target: 0.4,
        status: ratios.debtToEquity <= 0.6 ? 'good' : 'warning'
      },
      {
        name: 'Current Ratio',
        value: ratios.currentRatio,
        target: 2.0,
        status: ratios.currentRatio >= 1.5 ? 'good' : 'warning'
      },
      {
        name: 'Quick Ratio',
        value: ratios.quickRatio,
        target: 1.5,
        status: ratios.quickRatio >= 1.0 ? 'good' : 'warning'
      }
    ];
  };

  // Custom tooltip for balance sheet chart
  const BalanceSheetTooltip = ({ active, payload, label }) => {
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
                  <div key={key}>{`${key}: $${value.toLocaleString()}`}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating financial balance analysis...")
              : t("Generating financial balance analysis...")
            }
          </span>
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

  // Check if data is incomplete and show missing questions checker or file upload
  if (!analysisData || isFinancialBalanceDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="financialBalance"
          analysisDisplayName="Financial Balance Insight"
          icon={DollarSign}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          
          // File upload props
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => generateFinancialBalanceAnalysis(true)}
          onGenerateWithoutFile={() => generateFinancialBalanceAnalysis(false)}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={isLoading}
          fileUploadMessage="Upload financial statements (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      </div>
    );
  }

  const { balanceSheet, ratios, innovationInvestment } = analysisData.financialBalanceInsight;
  const balanceSheetData = prepareBalanceSheetData(analysisData);
  const assetsBreakdownData = prepareAssetsBreakdownData(analysisData);
  const ratiosData = prepareRatiosData(analysisData);

  const totalAssets = balanceSheet.assets.total;
  const totalLiabilities = balanceSheet.liabilities.total;
  const netWorth = balanceSheet.equity;
  const innovationROI = ((innovationInvestment.annual / totalAssets) * 100).toFixed(1);

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="financial-health"
      data-analysis-name="Financial Health"
      data-analysis-order="3">

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
            <span>Debt-to-Equity</span>
          </div>
          <p className="ch-metric-value">{ratios.debtToEquity}</p>
        </div>

        <div className="ch-metric-card ch-metric-orange">
          <div className="ch-metric-header">
            <Users size={20} />
            <span>Innovation Investment</span>
          </div>
          <p className="ch-metric-value">{innovationInvestment.percentOfRevenue}% of revenue</p>
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
                  <BarChart data={balanceSheetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip content={<BalanceSheetTooltip />} />
                    <Bar dataKey="value">
                      {balanceSheetData.map((entry, index) => (
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
          </div>
        </div>
      </div>

      {/* Financial Ratios */}
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

      {/* Innovation Investment */}
      <div className="ch-breakdown-section">
        <h3 className="ch-section-title">Innovation Investment</h3>
        <div className="ch-breakdown-grid">
          <div className="ch-breakdown-card">
            <h4>Annual Investment</h4>
            <div className="ch-cost-item">
              <span>Amount:</span>
              <span>${innovationInvestment.annual.toLocaleString()}</span>
            </div>
            <div className="ch-cost-item">
              <span>% of Revenue:</span>
              <span>{innovationInvestment.percentOfRevenue}%</span>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Focus Areas</h4>
            <div className="ch-cost-components">
              <ul>
                {innovationInvestment.focusAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Investment ROI</h4>
            <div className="ch-cost-item">
              <span>ROI on Assets:</span>
              <span>{innovationROI}%</span>
            </div>
            <div className="ch-cost-item">
              <span>Status:</span>
              <span className={innovationInvestment.percentOfRevenue > 5 ? 'text-green-600' : 'text-yellow-600'}>
                {innovationInvestment.percentOfRevenue > 5 ? 'Above Average' : 'Below Average'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialBalanceInsight;