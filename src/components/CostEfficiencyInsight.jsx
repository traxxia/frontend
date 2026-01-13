import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingDown, DollarSign, Users, Target, Loader, Upload, X } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import AnalysisError from './AnalysisError';

const CostEfficiencyInsight = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  costEfficiencyData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(costEfficiencyData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.costEfficiency || {
      displayName: 'Cost Efficiency Insight',
      customMessage: 'Answer more questions to unlock detailed cost efficiency analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'costEfficiency',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };
  const isCostEfficiencyDataIncomplete = (data) => {
    if (!data) return true;

    if (!data.costEfficiencyInsight) return true;
    if (!data.costEfficiencyInsight.unitEconomics) return true;
    if (!data.costEfficiencyInsight.costBreakdown) return true;
    if (!data.costEfficiencyInsight.employeeProductivity) return true;

    return false;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (costEfficiencyData && costEfficiencyData !== analysisData) {
      setAnalysisData(costEfficiencyData);
      if (onDataGenerated) {
        onDataGenerated(costEfficiencyData);
      }
    }
  }, [costEfficiencyData]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (costEfficiencyData) {
      setAnalysisData(costEfficiencyData);
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

  const handleFileUpload = (file) => {
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
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateCostEfficiencyAnalysis = async (withFile = false) => {
    setIsLoading(true);
    setError(null);

    try {
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
        throw new Error('Please answer some questions first to generate cost efficiency analysis.');
      }
      const formData = new FormData();
      if (withFile && uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
        const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
        formData.append('file', dummyFile, 'business_data.txt');
      }

      formData.append('questions', questionsArray.join(','));
      formData.append('answers', answersArray.join('\n'));

      const response = await fetch(`${ML_API_BASE_URL}/cost-efficiency-competitive-position`, {
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
      let costEfficiencyContent = null;
      if (result.costEfficiencyInsight) {
        costEfficiencyContent = result;
      } else if (result.cost_efficiency_insight) {
        costEfficiencyContent = { costEfficiencyInsight: result.cost_efficiency_insight };
      } else {
        costEfficiencyContent = { costEfficiencyInsight: result };
      }

      setAnalysisData(costEfficiencyContent);
      await saveAnalysisToBackend(costEfficiencyContent);

      if (onDataGenerated) {
        onDataGenerated(costEfficiencyContent);
      }

    } catch (error) {
      console.error('Error generating cost efficiency analysis:', error);
      setError(`Failed to generate analysis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
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
          analysis_type: 'costEfficiency',
          analysis_name: 'Cost Efficiency Insight',
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
        throw new Error(errorData.error || 'Failed to save Cost Efficiency analysis');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving Cost Efficiency analysis to backend:', error);
      throw error;
    }
  };
  const prepareWaterfallData = (data) => {
    if (!data?.costEfficiencyInsight?.unitEconomics?.historicalCosts) return [];

    const costs = data.costEfficiencyInsight.unitEconomics.historicalCosts;
    const waterfallData = [];

    costs.forEach((cost, index) => {
      if (index === 0) {
        waterfallData.push({
          year: cost.year,
          value: cost.cost,
          cumulative: cost.cost,
          type: 'start'
        });
      } else {
        const previous = costs[index - 1];
        const change = cost.cost - previous.cost;
        waterfallData.push({
          year: cost.year,
          value: Math.abs(change),
          cumulative: cost.cost,
          change: change,
          type: change < 0 ? 'decrease' : 'increase'
        });
      }
    });

    return waterfallData;
  };

  const prepareBenchmarkData = (data) => {
    if (!data?.costEfficiencyInsight?.unitEconomics) return [];

    const { currentUnitCost, competitorAvgCost } = data.costEfficiencyInsight.unitEconomics;

    return [
      {
        category: 'Your Cost',
        value: currentUnitCost,
        type: 'current'
      },
      {
        category: 'Competitor Avg',
        value: competitorAvgCost,
        type: 'benchmark'
      }
    ];
  };
  const WaterfallTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{`Year: ${label}`}</div>
          <div className="ch-tooltip-content">
            {data.type === 'start' ? (
              <div>{`Starting Cost: ${data.value}`}</div>
            ) : (
              <>
                <div>{`Change: ${data.change > 0 ? '+' : ''}${data.change}`}</div>
                <div>{`Cumulative: ${data.cumulative}`}</div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  const BenchmarkTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{label}</div>
          <div className="ch-tooltip-content">
            <div>{`Cost: ${value}`}</div>
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
              ? t("Regenerating cost efficiency analysis...")
              : t("Generating cost efficiency analysis...")
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
          title="Cost Efficiency Analysis Error"
        />
      </div>
    );
  }
  if (!analysisData || isCostEfficiencyDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="costEfficiency"
          analysisDisplayName="Cost Efficiency Insight"
          icon={TrendingDown}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => generateCostEfficiencyAnalysis(true)}
          onGenerateWithoutFile={() => generateCostEfficiencyAnalysis(false)}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={isLoading}
          fileUploadMessage="Upload financial documents (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      </div>
    );
  }

  const { unitEconomics, costBreakdown, employeeProductivity } = analysisData.costEfficiencyInsight;
  const waterfallData = prepareWaterfallData(analysisData);
  const benchmarkData = prepareBenchmarkData(analysisData);

  const costSavings = unitEconomics.competitorAvgCost - unitEconomics.currentUnitCost;
  const savingsPercentage = ((costSavings / unitEconomics.competitorAvgCost) * 100).toFixed(1);

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="cost-efficiency"
      data-analysis-name="Cost Efficiency Insight"
      data-analysis-order="1">
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <DollarSign size={20} />
            <span>Current Unit Cost</span>
          </div>
          <p className="ch-metric-value">{unitEconomics.currentUnitCost}</p>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <Target size={20} />
            <span>Industry Average</span>
          </div>
          <p className="ch-metric-value">{unitEconomics.competitorAvgCost}</p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingDown size={20} />
            <span>{costSavings > 0 ? 'Cost Advantage' : 'Cost Gap'}</span>
          </div>
          <p className="ch-metric-value">
            {costSavings > 0 ? '-' : '+'}{Math.abs(costSavings)} ({savingsPercentage}%)
          </p>
        </div>

        <div className="ch-metric-card ch-metric-orange">
          <div className="ch-metric-header">
            <Users size={20} />
            <span>Value per Employee</span>
          </div>
          <p className="ch-metric-value">{employeeProductivity.valuePerEmployee?.toLocaleString()}</p>
        </div>
      </div>
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Cost Analysis Charts</h3>
          </div>

          <div className="ch-charts-grid">
            <div className="ch-chart-section">
              <h4>Historical Cost Trend</h4>
              <div className="ch-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<WaterfallTooltip />} />
                    <Bar dataKey="cumulative">
                      {waterfallData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.type === 'start' ? '#8884d8' :
                              entry.type === 'decrease' ? '#82ca9d' : '#ff7c7c'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-chart-section">
              <h4>Cost Benchmark Comparison</h4>
              <div className="ch-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={benchmarkData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip content={<BenchmarkTooltip />} />
                    <ReferenceLine y={unitEconomics.competitorAvgCost} stroke="#ff7300" strokeDasharray="5 5" />
                    <Bar dataKey="value">
                      {benchmarkData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.type === 'current' ? '#8884d8' : '#82ca9d'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ch-breakdown-section">
        <h3 className="ch-section-title">Cost Structure Analysis</h3>
        <div className="ch-breakdown-grid">
          <div className="ch-breakdown-card">
            <h4>Fixed Costs</h4>
            <div className="ch-cost-item">
              <span>Monthly:</span>
              <span>{costBreakdown.fixedCosts.monthly.toLocaleString()}</span>
            </div>
            <div className="ch-cost-item">
              <span>Annual:</span>
              <span>{costBreakdown.fixedCosts.annualized.toLocaleString()}</span>
            </div>
            <div className="ch-cost-components">
              <strong>Components:</strong>
              <ul>
                {costBreakdown.fixedCosts.components.map((component, index) => (
                  <li key={index}>{component}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Variable Costs</h4>
            <div className="ch-cost-item">
              <span>Per Unit:</span>
              <span>{costBreakdown.variableCosts.perUnit}</span>
            </div>
            <div className="ch-cost-components">
              <strong>Components:</strong>
              <ul>
                {costBreakdown.variableCosts.components.map((component, index) => (
                  <li key={index}>{component}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Employee Metrics</h4>
            <div className="ch-cost-item">
              <span>Headcount:</span>
              <span>{employeeProductivity.headcount}</span>
            </div>
            <div className="ch-cost-item">
              <span>Cost %:</span>
              <span>{employeeProductivity.costPercentage}%</span>
            </div>
            <div className="ch-cost-item">
              <span>Value/Employee:</span>
              <span>{employeeProductivity.valuePerEmployee.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEfficiencyInsight;