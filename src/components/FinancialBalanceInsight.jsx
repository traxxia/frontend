import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Target, Users, Loader, Upload, X, AlertTriangle } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
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

  // Updated function to check if the financial balance data is empty/incomplete
  const isFinancialBalanceDataIncomplete = (data) => {
    if (!data) return true;

    // Check for new structure: financialHealth
    if (data.financialHealth) {
      const { balanceSheet, ratios, innovationInvestment } = data.financialHealth;
      
      // Check if essential data exists
      if (!balanceSheet || !balanceSheet.assets || !balanceSheet.liabilities) return true;
      if (!innovationInvestment) return true;
      
      return false;
    }

    // Check for old structure: financialBalanceInsight (for backwards compatibility)
    if (data.financialBalanceInsight) {
      if (!data.financialBalanceInsight.balanceSheet) return true;
      if (!data.financialBalanceInsight.ratios) return true;
      return false;
    }

    return true;
  };

  // Helper function to get financial data from either structure
  const getFinancialData = (data) => {
    if (!data) return null;
    
    // New structure
    if (data.financialHealth) {
      return data.financialHealth;
    }
    
    // Old structure (backwards compatibility)
    if (data.financialBalanceInsight) {
      return data.financialBalanceInsight;
    }
    
    return null;
  };

  // Helper function to parse currency strings to numbers
  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    
    // Remove currency symbols and convert to number
    const cleaned = value.toString().replace(/[$,KkMm\s]/g, '');
    const number = parseFloat(cleaned);
    
    // Handle K and M suffixes
    if (value.includes('K') || value.includes('k')) {
      return number * 1000;
    }
    if (value.includes('M') || value.includes('m')) {
      return number * 1000000;
    }
    
    return number || 0;
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

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
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

      // The result should already have the correct structure
      setAnalysisData(result);

      // Save to backend
      await saveAnalysisToBackend(result);

      if (onDataGenerated) {
        onDataGenerated(result);
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

  // Updated prepare balance sheet chart data
  const prepareBalanceSheetData = (data) => {
    const financialData = getFinancialData(data);
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
  };

  // Updated prepare assets breakdown data
  const prepareAssetsBreakdownData = (data) => {
    const financialData = getFinancialData(data);
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
  };

  // Updated prepare ratios data
  const prepareRatiosData = (data) => {
    const financialData = getFinancialData(data);
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
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Financial Balance Analysis Error"
        />
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

  // Get the financial data using helper function
  const financialData = getFinancialData(analysisData);
  if (!financialData) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisError 
          error="The financial data structure is not recognized."
          onRetry={handleRetry}
          title="Invalid Data Structure"
        />
      </div>
    );
  }

  const { balanceSheet, ratios, innovationInvestment } = financialData;
  const balanceSheetData = prepareBalanceSheetData(analysisData);
  const assetsBreakdownData = prepareAssetsBreakdownData(analysisData);
  const ratiosData = prepareRatiosData(analysisData);

  const totalAssets = parseCurrency(balanceSheet.assets.total);
  const totalLiabilities = parseCurrency(balanceSheet.liabilities.total);
  const netWorth = parseCurrency(balanceSheet.equity);
  const annualInvestment = parseCurrency(innovationInvestment.annual);
  const percentOfRevenue = innovationInvestment.percentOfRevenue || 'N/A';
  const innovationROI = totalAssets > 0 ? ((annualInvestment / totalAssets) * 100).toFixed(1) : '0';

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
          {/* Assets Breakdown */}
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

          {/* Liabilities Breakdown */}
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

          {/* Equity */}
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
    </div>
  );
};

export default FinancialBalanceInsight;