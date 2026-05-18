import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Zap, TrendingUp, Users, Target, Loader, Activity } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import FinancialEmptyState from './FinancialEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
const formatValue = (value, type = 'text', fallback = '-') => {
  if (value === null || value === undefined || value === '' || typeof value === 'string' && value.trim() === '') {
    return fallback;
  }
  switch (type) {
    case 'currency':
      return isNaN(value) ? fallback : `$${Number(value).toLocaleString()}`;
    case 'percentage':
      return isNaN(value) ? fallback : `${Number(value)}%`;
    case 'number':
      return isNaN(value) ? fallback : Number(value).toLocaleString();
    default:
      return value;
  }
};
const OperationalEfficiencyInsight = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  operationalEfficiencyData: propOperationalEfficiencyData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const {
    t
  } = useTranslation();
  const {
    operationalEfficiencyData: storeOperationalEfficiencyData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const isRegenerating = propIsRegenerating || isTypeRegenerating('operationalEfficiency');
  const analysisData = useMemo(() => {
    const rawData = propOperationalEfficiencyData || storeOperationalEfficiencyData;
    if (!rawData) return null;
    if (rawData.operationalEfficiencyInsight) return rawData;
    if (rawData.operational_efficiency_insight) return {
      operationalEfficiencyInsight: rawData.operational_efficiency_insight
    };
    return {
      operationalEfficiencyInsight: rawData
    };
  }, [propOperationalEfficiencyData, storeOperationalEfficiencyData]);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);
  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.operationalEfficiency || {
      displayName: 'Operational Efficiency Analysis',
      customMessage: 'Complete operational questions to unlock efficiency insights, resource optimization recommendations, and performance analytics.'
    };
    await checkMissingQuestionsAndRedirect('operationalEfficiency', selectedBusinessId, handleRedirectToBrief, {
      displayName: analysisConfig.displayName,
      customMessage: analysisConfig.customMessage
    });
  }, [selectedBusinessId, handleRedirectToBrief]);
  const isOperationalDataIncomplete = useCallback(data => {
    if (!data || !data.operationalEfficiencyInsight) return true;
    const insight = data.operationalEfficiencyInsight;
    const hasResourceUtilization = insight.resourceUtilization && (insight.resourceUtilization.employeeROI?.totalValueGenerated || insight.resourceUtilization.costPerRevenueDollar);
    const hasEfficiencyTrends = insight.efficiencyTrends && (insight.efficiencyTrends.costReductionRate || insight.efficiencyTrends.productivityGain || insight.efficiencyTrends.automationImpact);
    const hasCapabilityData = insight.capabilityPerformance && Object.values(insight.capabilityPerformance).some(value => value !== '' && value !== null && value !== undefined);
    const sectionsWithData = [hasResourceUtilization, hasEfficiencyTrends, hasCapabilityData].filter(Boolean).length;
    return sectionsWithData < 2;
  }, []);
  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (err) {
        setError(err.message || 'Failed to regenerate analysis');
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('operationalEfficiency', questions, userAnswers, selectedBusinessId);
      } catch (err) {
        setError(err.message || 'Failed to generate analysis');
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);
  const handleFileUpload = useCallback(file => {
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
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
  const efficiencyTrendsData = useMemo(() => {
    if (!analysisData?.operationalEfficiencyInsight?.efficiencyTrends) return [];
    const trends = analysisData.operationalEfficiencyInsight.efficiencyTrends;
    return [{
      metric: 'Cost Reduction',
      value: trends.costReductionRate === '' ? 0 : Number(trends.costReductionRate) || 0,
      target: trends.costReductionTarget || 25,
      unit: '%',
      hasValue: trends.costReductionRate !== '' && trends.costReductionRate !== null && trends.costReductionRate !== undefined
    }, {
      metric: 'Productivity Gain',
      value: trends.productivityGain === '' ? 0 : Number(trends.productivityGain) || 0,
      target: trends.productivityTarget || 20,
      unit: '%',
      hasValue: trends.productivityGain !== '' && trends.productivityGain !== null && trends.productivityGain !== undefined
    }, {
      metric: 'Automation Impact',
      value: trends.automationImpact === '' ? 0 : Number(trends.automationImpact) || 0,
      target: trends.automationTarget || 10,
      unit: '%',
      hasValue: trends.automationImpact !== '' && trends.automationImpact !== null && trends.automationImpact !== undefined
    }];
  }, [analysisData]);
  const capabilityRadarData = useMemo(() => {
    if (!analysisData?.operationalEfficiencyInsight?.capabilityPerformance) return [];
    const capabilities = analysisData.operationalEfficiencyInsight.capabilityPerformance;
    return Object.entries(capabilities).map(([key, value]) => {
      let score = 0;
      let hasValue = false;
      if (value !== '' && value !== null && value !== undefined) {
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (lowerValue === 'low') score = 1;else if (lowerValue === 'medium') score = 2;else if (lowerValue === 'high') score = 3;else score = Number(value) || 0;
        } else {
          score = Number(value) || 0;
        }
        hasValue = true;
      }
      return {
        capability: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        score: Math.min(score, 10),
        fullMark: 10,
        hasValue
      };
    });
  }, [analysisData]);
  const EfficiencyTooltip = React.memo(({
    active,
    payload,
    label
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="operational-efficiency-insight--s1">
          <div className="operational-efficiency-insight--s2">{data.metric}</div>
          <div>
            {data.hasValue ? <>
                <div>{`Current: ${data.value}${data.unit}`}</div>
                <div>{`Target: ${data.target}${data.unit}`}</div>
                <div style={{
              color: data.value >= data.target ? '#10b981' : '#f59e0b'
            }}>
                  {data.value >= data.target ? '✓ Above Target' : '⚠ Below Target'}
                </div>
              </> : <div className="operational-efficiency-insight--s3">No data available</div>}
          </div>
        </div>;
    }
    return null;
  });
  if (isRegenerating) {
    return <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating operational efficiency analysis...</span>
        </div>
      </div>;
  }
  const renderContent = () => {
    if (error) {
      return <AnalysisError error={error} onRetry={handleRegenerate} title="Operational Efficiency Analysis Error" />;
    }
    if (!analysisData || isOperationalDataIncomplete(analysisData)) {
      return <FinancialEmptyState analysisType="operationalEfficiency" analysisDisplayName="Operational Efficiency Analysis" icon={Activity} onImproveAnswers={handleMissingQuestionsCheck} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} canRegenerate={canRegenerate} userAnswers={userAnswers} minimumAnswersRequired={5} showFileUpload={true} onFileUpload={handleFileUpload} uploadedFile={uploadedFile} onRemoveFile={removeFile} fileUploadMessage="Upload operational documents (PDF, Excel, CSV, or images)" acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png" />;
    }
    const {
      resourceUtilization,
      efficiencyTrends,
      capabilityPerformance
    } = analysisData.operationalEfficiencyInsight;
    const employeeROI = formatValue(resourceUtilization?.employeeROI?.roi, 'percentage');
    const costPerRevenueDollar = formatValue(resourceUtilization?.costPerRevenueDollar, 'currency');
    const totalValueGenerated = formatValue(resourceUtilization?.employeeROI?.totalValueGenerated, 'currency');
    const totalEmployeeCost = formatValue(resourceUtilization?.employeeROI?.totalEmployeeCost, 'currency');
    return <div className="operational-efficiency-insight--s4">
        {}
        <div className="operational-efficiency-insight--s5">
          <div className="operational-efficiency-insight--s6">
            <div className="operational-efficiency-insight--s7">
              <Users size={20} />
              <span>Employee ROI</span>
            </div>
            <p className="operational-efficiency-insight--s8">{employeeROI}</p>
          </div>

          <div className="operational-efficiency-insight--s9">
            <div className="operational-efficiency-insight--s7">
              <Target size={20} />
              <span>Cost per Revenue $</span>
            </div>
            <p className="operational-efficiency-insight--s8">{costPerRevenueDollar}</p>
          </div>

          <div className="operational-efficiency-insight--s10">
            <div className="operational-efficiency-insight--s7">
              <TrendingUp size={20} />
              <span>Productivity Gain</span>
            </div>
            <p className="operational-efficiency-insight--s8">
              {formatValue(efficiencyTrends?.productivityGain, 'percentage')}
            </p>
          </div>

          <div className="operational-efficiency-insight--s11">
            <div className="operational-efficiency-insight--s7">
              <Zap size={20} />
              <span>Automation Impact</span>
            </div>
            <p className="operational-efficiency-insight--s8">
              {formatValue(efficiencyTrends?.automationImpact, 'percentage')}
            </p>
          </div>
        </div>

        {}
        <div className="operational-efficiency-insight--s12">
          <h3 className="operational-efficiency-insight--s13">Operational Efficiency Analysis</h3>
          <div className="operational-efficiency-insight--s14">
            <div>
              <h4 className="operational-efficiency-insight--s15">Efficiency Trends vs Targets</h4>
              <div className="operational-efficiency-insight--s16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyTrendsData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip content={<EfficiencyTooltip />} />
                    <Bar dataKey="value">
                      {efficiencyTrendsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.hasValue ? entry.value >= entry.target ? '#10b981' : '#f59e0b' : '#d1d5db'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="operational-efficiency-insight--s15">Capability Performance Radar</h4>
              <div className="operational-efficiency-insight--s16">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={capabilityRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="capability" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
                    <Radar name="Performance" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {}
        <div>
          <h3 className="operational-efficiency-insight--s13">Resource Utilization Analysis</h3>
          <div className="operational-efficiency-insight--s17">
            <div className="operational-efficiency-insight--s18">
              <h4 className="operational-efficiency-insight--s19">Employee Economics</h4>
              <div className="operational-efficiency-insight--s20">
                <span>Total Employee Cost:</span>
                <span>{totalEmployeeCost}</span>
              </div>
              <div className="operational-efficiency-insight--s20">
                <span>Value Generated:</span>
                <span>{totalValueGenerated}</span>
              </div>
              <div className="operational-efficiency-insight--s21">
                <span>ROI:</span>
                <span style={{
                color: employeeROI !== '-' && Number(employeeROI.replace('%', '')) > 50 ? '#10b981' : '#f59e0b'
              }}>
                  {employeeROI}
                </span>
              </div>
            </div>

            <div className="operational-efficiency-insight--s18">
              <h4 className="operational-efficiency-insight--s19">Efficiency Metrics</h4>
              <div className="operational-efficiency-insight--s20">
                <span>Cost Reduction Rate:</span>
                <span>{formatValue(efficiencyTrends?.costReductionRate, 'percentage')}</span>
              </div>
              <div className="operational-efficiency-insight--s20">
                <span>Productivity Gain:</span>
                <span>{formatValue(efficiencyTrends?.productivityGain, 'percentage')}</span>
              </div>
              <div className="operational-efficiency-insight--s21">
                <span>Automation Impact:</span>
                <span>{formatValue(efficiencyTrends?.automationImpact, 'percentage')}</span>
              </div>
            </div>

            <div className="operational-efficiency-insight--s18">
              <h4 className="operational-efficiency-insight--s19">Capability Performance</h4>
              <div>
                <strong>Capabilities with Data:</strong>
                <ul className="operational-efficiency-insight--s22">
                  {Object.entries(capabilityPerformance || {}).filter(([key, value]) => value !== '' && value !== null && value !== undefined).map(([key, value], index) => <li key={index} className="operational-efficiency-insight--s23">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                      </li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  return <div className="channel-heatmap channel-heatmap-container" data-analysis-type="operational-efficiency" data-analysis-name="Operational Efficiency Analysis" data-analysis-order="3">
      {renderContent()}
    </div>;
};
export default React.memo(OperationalEfficiencyInsight);
