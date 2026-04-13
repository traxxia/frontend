import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Zap, TrendingUp, Users, Target, Loader, Activity } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import FinancialEmptyState from './FinancialEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

// Utility function to handle empty values
const formatValue = (value, type = 'text', fallback = '-') => {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
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
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    operationalEfficiencyData: storeOperationalEfficiencyData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('operationalEfficiency');

  // Normalize data from store or props
  const analysisData = useMemo(() => {
    const rawData = propOperationalEfficiencyData || storeOperationalEfficiencyData;
    if (!rawData) return null;
    
    // Normalize structure
    if (rawData.operationalEfficiencyInsight) return rawData;
    if (rawData.operational_efficiency_insight) return { operationalEfficiencyInsight: rawData.operational_efficiency_insight };
    
    return { operationalEfficiencyInsight: rawData };
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
    
    await checkMissingQuestionsAndRedirect(
      'operationalEfficiency', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isOperationalDataIncomplete = useCallback((data) => {
    if (!data || !data.operationalEfficiencyInsight) return true;

    const insight = data.operationalEfficiencyInsight;

    const hasResourceUtilization = insight.resourceUtilization && 
      (insight.resourceUtilization.employeeROI?.totalValueGenerated || 
       insight.resourceUtilization.costPerRevenueDollar);

    const hasEfficiencyTrends = insight.efficiencyTrends &&
      (insight.efficiencyTrends.costReductionRate || 
       insight.efficiencyTrends.productivityGain || 
       insight.efficiencyTrends.automationImpact);

    const hasCapabilityData = insight.capabilityPerformance &&
      Object.values(insight.capabilityPerformance).some(value => 
        value !== '' && value !== null && value !== undefined
      );

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

  const efficiencyTrendsData = useMemo(() => {
    if (!analysisData?.operationalEfficiencyInsight?.efficiencyTrends) return [];

    const trends = analysisData.operationalEfficiencyInsight.efficiencyTrends;
    return [
      {
        metric: 'Cost Reduction',
        value: trends.costReductionRate === '' ? 0 : Number(trends.costReductionRate) || 0,
        target: trends.costReductionTarget || 25,
        unit: '%',
        hasValue: trends.costReductionRate !== '' && trends.costReductionRate !== null && trends.costReductionRate !== undefined
      },
      {
        metric: 'Productivity Gain',
        value: trends.productivityGain === '' ? 0 : Number(trends.productivityGain) || 0,
        target: trends.productivityTarget || 20,
        unit: '%',
        hasValue: trends.productivityGain !== '' && trends.productivityGain !== null && trends.productivityGain !== undefined
      },
      {
        metric: 'Automation Impact',
        value: trends.automationImpact === '' ? 0 : Number(trends.automationImpact) || 0,
        target: trends.automationTarget || 10,
        unit: '%',
        hasValue: trends.automationImpact !== '' && trends.automationImpact !== null && trends.automationImpact !== undefined
      }
    ];
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
          if (lowerValue === 'low') score = 1;
          else if (lowerValue === 'medium') score = 2;
          else if (lowerValue === 'high') score = 3;
          else score = Number(value) || 0;
        } else {
          score = Number(value) || 0;
        }
        hasValue = true;
      }

      return {
        capability: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        score: Math.min(score, 10), // Cap at 10 for display
        fullMark: 10,
        hasValue
      };
    });
  }, [analysisData]);

  const EfficiencyTooltip = React.memo(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.metric}</div>
          <div>
            {data.hasValue ? (
              <>
                <div>{`Current: ${data.value}${data.unit}`}</div>
                <div>{`Target: ${data.target}${data.unit}`}</div>
                <div style={{ color: data.value >= data.target ? '#10b981' : '#f59e0b' }}>
                  {data.value >= data.target ? '✓ Above Target' : '⚠ Below Target'}
                </div>
              </>
            ) : (
              <div style={{ color: '#9ca3af' }}>No data available</div>
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
          <span>Generating operational efficiency analysis...</span>
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
          title="Operational Efficiency Analysis Error"
        />
      );
    }

    if (!analysisData || isOperationalDataIncomplete(analysisData)) {
      return (
        <FinancialEmptyState
          analysisType="operationalEfficiency"
          analysisDisplayName="Operational Efficiency Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={5}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          fileUploadMessage="Upload operational documents (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      );
    }

    const { resourceUtilization, efficiencyTrends, capabilityPerformance } = analysisData.operationalEfficiencyInsight;
    const employeeROI = formatValue(resourceUtilization?.employeeROI?.roi, 'percentage');
    const costPerRevenueDollar = formatValue(resourceUtilization?.costPerRevenueDollar, 'currency');
    const totalValueGenerated = formatValue(resourceUtilization?.employeeROI?.totalValueGenerated, 'currency');
    const totalEmployeeCost = formatValue(resourceUtilization?.employeeROI?.totalEmployeeCost, 'currency');

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={20} />
              <span>Employee ROI</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{employeeROI}</p>
          </div>

          <div style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={20} />
              <span>Cost per Revenue $</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{costPerRevenueDollar}</p>
          </div>

          <div style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp size={20} />
              <span>Productivity Gain</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {formatValue(efficiencyTrends?.productivityGain, 'percentage')}
            </p>
          </div>

          <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={20} />
              <span>Automation Impact</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {formatValue(efficiencyTrends?.automationImpact, 'percentage')}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Operational Efficiency Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <div>
              <h4 style={{ marginBottom: '16px' }}>Efficiency Trends vs Targets</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip content={<EfficiencyTooltip />} />
                    <Bar dataKey="value">
                      {efficiencyTrendsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.hasValue ? 
                            (entry.value >= entry.target ? '#10b981' : '#f59e0b') : 
                            '#d1d5db'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '16px' }}>Capability Performance Radar</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={capabilityRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="capability" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
                    <Radar
                      name="Performance"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Utilization Details */}
        <div>
          <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Resource Utilization Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '12px' }}>Employee Economics</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Employee Cost:</span>
                <span>{totalEmployeeCost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Value Generated:</span>
                <span>{totalValueGenerated}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ROI:</span>
                <span style={{ color: employeeROI !== '-' && Number(employeeROI.replace('%', '')) > 50 ? '#10b981' : '#f59e0b' }}>
                  {employeeROI}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '12px' }}>Efficiency Metrics</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Cost Reduction Rate:</span>
                <span>{formatValue(efficiencyTrends?.costReductionRate, 'percentage')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Productivity Gain:</span>
                <span>{formatValue(efficiencyTrends?.productivityGain, 'percentage')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Automation Impact:</span>
                <span>{formatValue(efficiencyTrends?.automationImpact, 'percentage')}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '12px' }}>Capability Performance</h4>
              <div>
                <strong>Capabilities with Data:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {Object.entries(capabilityPerformance || {})
                    .filter(([key, value]) => value !== '' && value !== null && value !== undefined)
                    .map(([key, value], index) => (
                      <li key={index} style={{ color: '#10b981', marginBottom: '4px' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="operational-efficiency"
      data-analysis-name="Operational Efficiency Analysis"
      data-analysis-order="3">
      {renderContent()}
    </div>
  );
};

export default React.memo(OperationalEfficiencyInsight);