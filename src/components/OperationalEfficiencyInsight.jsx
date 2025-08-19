import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Zap, TrendingUp, Users, Target, Loader, X, Activity } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
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
  isRegenerating = false,
  canRegenerate = true,
  operationalEfficiencyData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const hasInitialized = useRef(false);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    // Use the same pattern as FullSWOT
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
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    console.log('OperationalEfficiency handleRegenerate called', { onRegenerate: !!onRegenerate });
    
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in OperationalEfficiency regeneration:', error);
        setError(error.message || 'Failed to regenerate analysis');
      }
    } else {
      console.warn('No onRegenerate prop provided to OperationalEfficiencyInsight');
      setError('Regeneration not available');
    }
  };

  // Check if the operational efficiency data is empty/incomplete
  const isOperationalDataIncomplete = (data) => {
    if (!data) return true;

    if (!data.operationalEfficiencyInsight) return true;

    const insight = data.operationalEfficiencyInsight;

    // Check if main sections have meaningful data
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

    // Need at least 2 sections with data for meaningful analysis
    const sectionsWithData = [hasResourceUtilization, hasEfficiencyTrends, hasCapabilityData].filter(Boolean).length;

    return sectionsWithData < 2;
  };

  // API call to fetch operational efficiency data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/operational-efficiency');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysisData(data);
      setHasGenerated(true);
    } catch (err) {
      setError('Failed to fetch operational efficiency data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (operationalEfficiencyData) {
      setAnalysisData(operationalEfficiencyData);
      setHasGenerated(true);
      setError(null);
    }
  }, [operationalEfficiencyData]);

  // Update data when prop changes
  useEffect(() => {
    if (operationalEfficiencyData) {
      setAnalysisData(operationalEfficiencyData);
      setHasGenerated(true);
      setError(null);
    } else if (operationalEfficiencyData === null) {
      // Only reset if explicitly set to null (during regeneration)
      setAnalysisData(null);
      setHasGenerated(false);
    }
  }, [operationalEfficiencyData]);

  // Prepare efficiency trends data with fallbacks
  const prepareEfficiencyTrendsData = (data) => {
    if (!data?.operationalEfficiencyInsight?.efficiencyTrends) return [];

    const trends = data.operationalEfficiencyInsight.efficiencyTrends;
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
  };

  // Prepare capability performance radar data with fallbacks
  const prepareCapabilityRadarData = (data) => {
    if (!data?.operationalEfficiencyInsight?.capabilityPerformance) return [];

    const capabilities = data.operationalEfficiencyInsight.capabilityPerformance;
    
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
  };

  // Custom tooltip for efficiency trends
  const EfficiencyTooltip = ({ active, payload, label }) => {
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
  };

  // Loading state during regeneration
  if (isRegenerating) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px'
        }}>
          <Loader className="animate-spin" style={{ marginRight: '8px' }} />
          Regenerating Operational Efficiency Analysis...
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px'
        }}>
          <Loader className="animate-spin" style={{ marginRight: '8px' }} />
          Loading operational efficiency data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ 
          padding: '20px', 
          textAlign: 'center'
        }}>
          <div style={{ color: '#ef4444', marginBottom: '16px' }}>
            <X size={48} style={{ margin: '0 auto 8px' }} />
            <div>{error}</div>
          </div>
          <button 
            onClick={handleRegenerate}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no data or incomplete data
  if (!hasGenerated || !analysisData?.operationalEfficiencyInsight || isOperationalDataIncomplete(analysisData)) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <AnalysisEmptyState
          analysisType="operationalEfficiency"
          analysisDisplayName="Operational Efficiency Analysis"
          icon={Activity}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate && !!onRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={5}
          customMessage="Complete operational questions to unlock efficiency insights, resource optimization recommendations, and performance analytics."
        />
      </div>
    );
  }

  const { resourceUtilization, efficiencyTrends, capabilityPerformance } = analysisData.operationalEfficiencyInsight;
  const efficiencyTrendsData = prepareEfficiencyTrendsData(analysisData);
  const capabilityRadarData = prepareCapabilityRadarData(analysisData);

  // Apply formatValue to all metrics
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
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={20} />
            <span>Employee ROI</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{employeeROI}</p>
        </div>

        <div style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={20} />
            <span>Cost per Revenue $</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{costPerRevenueDollar}</p>
        </div>

        <div style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} />
            <span>Productivity Gain</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {formatValue(efficiencyTrends?.productivityGain, 'percentage')}
          </p>
        </div>

        <div style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
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
          {/* Efficiency Trends Chart */}
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

          {/* Capability Performance Radar */}
          <div>
            <h4 style={{ marginBottom: '16px' }}>Capability Performance Radar</h4>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={capabilityRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="capability" />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={false}
                  />
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
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
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
              <span style={{ 
                color: employeeROI !== '-' && Number(employeeROI.replace('%', '')) > 50 ? '#10b981' : '#f59e0b' 
              }}>
                {employeeROI}
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
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

          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
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
              <strong>Missing Data:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {Object.entries(capabilityPerformance || {})
                  .filter(([key, value]) => value === '' || value === null || value === undefined)
                  .map(([key, value], index) => (
                    <li key={index} style={{ color: '#9ca3af', marginBottom: '4px' }}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: -
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

export default OperationalEfficiencyInsight;