import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingDown, DollarSign, Users, Target, Loader } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import FinancialEmptyState from './FinancialEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import AnalysisError from './AnalysisError';

const CostEfficiencyInsight = ({
  questions = [],
  userAnswers = {},
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  costEfficiencyData: propCostEfficiencyData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    costEfficiencyData: storeCostEfficiencyData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('costEfficiency');

  // Normalize data from store or props
  const analysisData = useMemo(() => {
    const rawData = propCostEfficiencyData || storeCostEfficiencyData;
    if (!rawData) return null;
    
    // Normalize structure
    if (rawData.costEfficiencyInsight) return rawData;
    if (rawData.cost_efficiency_insight) return { costEfficiencyInsight: rawData.cost_efficiency_insight };
    if (rawData.unitEconomics && rawData.costBreakdown) return { costEfficiencyInsight: rawData };
    
    return null;
  }, [propCostEfficiencyData, storeCostEfficiencyData]);

  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
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
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isCostEfficiencyDataIncomplete = useCallback((data) => {
    if (!data || !data.costEfficiencyInsight) return true;
    const { unitEconomics, costBreakdown, employeeProductivity } = data.costEfficiencyInsight;
    return !unitEconomics || !costBreakdown || !employeeProductivity;
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
        await regenerateIndividualAnalysis('costEfficiency', questions, userAnswers, selectedBusinessId);
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

  const waterfallData = useMemo(() => {
    if (!analysisData?.costEfficiencyInsight?.unitEconomics?.historicalCosts) return [];

    const costs = analysisData.costEfficiencyInsight.unitEconomics.historicalCosts;
    const result = [];

    costs.forEach((cost, index) => {
      if (index === 0) {
        result.push({
          year: cost.year,
          value: cost.cost,
          cumulative: cost.cost,
          type: 'start'
        });
      } else {
        const previous = costs[index - 1];
        const change = cost.cost - previous.cost;
        result.push({
          year: cost.year,
          value: Math.abs(change),
          cumulative: cost.cost,
          change: change,
          type: change < 0 ? 'decrease' : 'increase'
        });
      }
    });

    return result;
  }, [analysisData]);

  const benchmarkData = useMemo(() => {
    if (!analysisData?.costEfficiencyInsight?.unitEconomics) return [];

    const { currentUnitCost, competitorAvgCost } = analysisData.costEfficiencyInsight.unitEconomics;

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
  }, [analysisData]);

  const WaterfallTooltip = React.memo(({ active, payload, label }) => {
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
  });

  const BenchmarkTooltip = React.memo(({ active, payload, label }) => {
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
  });

  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating cost efficiency analysis...</span>
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
          title="Cost Efficiency Analysis Error"
        />
      );
    }

    if (!analysisData || isCostEfficiencyDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
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
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          fileUploadMessage="Upload financial documents (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      );
    }

    const { unitEconomics, costBreakdown, employeeProductivity } = analysisData.costEfficiencyInsight;
    const costSavings = unitEconomics.competitorAvgCost - unitEconomics.currentUnitCost;
    const savingsPercentage = ((costSavings / unitEconomics.competitorAvgCost) * 100).toFixed(1);

    return (
      <>
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
      </>
    );
  };

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="cost-efficiency"
      data-analysis-name="Cost Efficiency Insight"
      data-analysis-order="1">
      {renderContent()}
    </div>
  );
};

export default React.memo(CostEfficiencyInsight);