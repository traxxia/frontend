import React, { useState, useEffect, useRef } from 'react';
import {
  Loader,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Zap,
  Settings,
  BarChart3,
  Activity,
  Star,
  ArrowRight,
  Calendar,
  Database,
  Lightbulb,
  Heart,
  DollarSign,
  Download,
  Link2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import '../styles/StrategicAnalysis.css';

const StrategicAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  strategicData = null,
  phaseManager,
  saveAnalysisToBackend,
  selectedBusinessId,
  hideDownload = false,
  onRedirectToBrief,
  phaseAnalysisArray = []
}) => {
  const [localStrategicData, setLocalStrategicData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedGovernanceModel, setSelectedGovernanceModel] = useState('RACI');

  const [collapsedCategories, setCollapsedCategories] = useState(
    new Set(['strategy-block', 'execution-block', 'sustainability-block'])
  );

  const hasInitialized = useRef(false);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.strategic;

    await checkMissingQuestionsAndRedirect(
      'strategic',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig?.displayName || 'Strategic Analysis',
        customMessage: analysisConfig?.customMessage || 'Complete essential phase questions to unlock strategic analysis.'
      }
    );
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        setIsLoading(true); // Add this line
        await onRegenerate();
      } catch (error) {
        console.error('Error in Strategic regeneration:', error);
        setErrorMessage(error.message || 'Failed to regenerate strategic analysis');
      } finally {
        setIsLoading(false); // Add this line
      }
    } else {
      console.warn('No onRegenerate prop provided to StrategicAnalysis');
      setErrorMessage('Regeneration not available');
    }
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isStrategicDataIncomplete = (data) => {
    if (!data) return true;
    const analysisData = data.strategic_analysis || data;
    if (!analysisData) return true;

    const recommendations = analysisData.strategic_recommendations;
    if (!recommendations) return true;

    const hasStrategyBlock = recommendations.strategy_block &&
      (recommendations.strategy_block.S_strategy ||
        recommendations.strategy_block.T_tactics ||
        recommendations.strategy_block.R_resources);

    const hasExecutionBlock = recommendations.execution_block;
    const hasSustainabilityBlock = recommendations.sustainability_block;

    return !hasStrategyBlock && !hasExecutionBlock && !hasSustainabilityBlock;
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (strategicData) {
      setLocalStrategicData(strategicData);
      setHasGenerated(true);
      setErrorMessage('');
    }
  }, [strategicData]);

  useEffect(() => {
    if (strategicData) {
      setLocalStrategicData(strategicData);
      setHasGenerated(true);
      setErrorMessage('');
      setIsLoading(false);
    } else if (strategicData === null) {
      setLocalStrategicData(null);
      setHasGenerated(false);
    }
  }, [strategicData]);

  const CategorySection = ({ id, title, icon: IconComponent, children, description }) => {
    const isCollapsed = collapsedCategories.has(id);

    return (
      <div className="analysis-category">
        <div className="category-header" onClick={() => toggleCategory(id)}>
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <div>
              <h2 className="category-title">{title}</h2>
              {description && (
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '4px 0 0 0',
                  fontWeight: '500'
                }}>
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="category-toggle">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="category-grid">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const DiagnosticBox = ({ diagnostic }) => {
    if (!diagnostic || diagnostic === 'N/A') return null;

    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f0f9ff',
        marginBottom: '5px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Info size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} /> Diagnostic :
        <div style={{
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#1e40af',
          lineHeight: '1.5'
        }}>
          {diagnostic}
        </div>
      </div>
    );
  };

  const renderStrategyPillar = (strategy) => {
    if (!strategy) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card strategy-card">
          <div className="pillar-header strategy-header">
            <Target size={22} className="strategy-icon" />
            <h3 className="pillar-title">
              S – Strategy: Where to Compete
            </h3>
          </div>

          <DiagnosticBox diagnostic={strategy.diagnostic} />

          {strategy.where_to_compete && strategy.where_to_compete.length > 0 &&
            strategy.where_to_compete[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <ArrowRight size={16} className="strategy-icon" />
                  Where to Compete
                </h4>
                <ul className="subsection-list">
                  {strategy.where_to_compete.map((item, idx) => (
                    <li key={idx} className="subsection-list-item">
                      <strong>{item.position}:</strong> {item.description}
                    </li>
                ))}
                </ul>
              </div>
            )} 
        </div>
      </div>
    );
  };

  const renderTacticsPillar = (tactics) => {
    if (!tactics) return null;
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    const horizons = [
      {
        key: 'immediate_90_days',
        label: 'Immediate Actions',
        subtitle: '90 Days',
        className: 'immediate'
      },
      {
        key: 'short_term_1_year',
        label: 'Short-term Initiatives',
        subtitle: '1 Year',
        className: 'short-term'
      },
      {
        key: 'long_term_3_5_years',
        label: 'Long-term Strategic Shifts',
        subtitle: '3-5 Years',
        className: 'long-term'
      }
    ];

    return (
      <div className="pillar-container">
        <div className="pillar-card tactics-card">
          <div className="pillar-header tactics-header">
            <Zap size={22} className="tactics-icon" />
            <h3 className="pillar-title">
              T – Tactics: Action Horizons
            </h3>
          </div>

          <DiagnosticBox diagnostic={tactics.diagnostic} />
          {renderStrategicLinkages(analysisData?.strategic_linkages)}<br></br>
          {renderStrategicRecommendationsFromAnalyses()}
          {/* {horizons.map((horizon, idx) => {
            const items = tactics[horizon.key];
            if (!items || items.length === 0 || items[0] === 'N/A') return null;

            return (
              <div key={horizon.key} className="horizon-container">
                <div className={`horizon-card ${horizon.className}`}>
                  <div className="horizon-header">
                    <div className={`horizon-indicator ${horizon.className}`} />
                    <div>
                      <h4 className={`horizon-label ${horizon.className}`}>
                        {horizon.label}
                      </h4>
                      <span className="horizon-subtitle">
                        {horizon.subtitle}
                      </span>
                    </div>
                  </div>
                  <ul className="horizon-list">
                    {items.map((item, itemIdx) => (
                      <li key={itemIdx} className="horizon-list-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })} */}
        </div>
      </div>
    );
  };

  const renderResourcesPillar = (resources) => {
    if (!resources) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card resources-card">
          <div className="pillar-header resources-header">
            <DollarSign size={22} className="resources-icon" />
            <h3 className="pillar-title">
              R – Resources: Allocation & Priorities
            </h3>
          </div>

          <DiagnosticBox diagnostic={resources.diagnostic} />

          {resources.capital_allocation && resources.capital_allocation !== 'N/A' && (
            <div className="info-box resources">
              <h4 className="info-box-title resources">
                <DollarSign size={14} />
                Capital Allocation
              </h4>
              <p className="info-box-text resources">
                {resources.capital_allocation}
              </p>
            </div>
          )}

          {resources.capital_priorities && resources.capital_priorities.length > 0 &&
            resources.capital_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Star size={16} className="resources-icon" />
                  Capital Priorities
                </h4>
                <ul className="subsection-list">
                  {resources.capital_priorities.map((priority, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {resources.talent_priorities && resources.talent_priorities.length > 0 &&
            resources.talent_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Users size={16} className="resources-icon" />
                  Talent Priorities
                </h4>
                <ul className="subsection-list">
                  {resources.talent_priorities.map((talent, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {talent}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {resources.technology_investments && resources.technology_investments.length > 0 &&
            resources.technology_investments[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Settings size={16} className="resources-icon" />
                  Technology Investments
                </h4>
                <ul className="subsection-list">
                  {resources.technology_investments.map((tech, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderAnalysisDataPillar = (analysisData) => {
    if (!analysisData) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card analysis-data-card">
          <div className="pillar-header analysis-data-header">
            <Database size={22} className="analysis-data-icon" />
            <h3 className="pillar-title">
              A – Analysis & Data Strategy
            </h3>
          </div>

          <DiagnosticBox diagnostic={analysisData.diagnostic} />

          {analysisData.recommendations && analysisData.recommendations.length > 0 &&
            analysisData.recommendations[0] !== 'N/A' && (
              <div>
                <ul className="subsection-list">
                  {analysisData.recommendations.map((rec, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderTechnologyPillar = (tech) => {
    if (!tech) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card technology-card">
          <div className="pillar-header technology-header">
            <Settings size={22} className="technology-icon" />
            <h3 className="pillar-title">
              T – Technology & Digitalization
            </h3>
          </div>

          <DiagnosticBox diagnostic={tech.diagnostic} />

          {tech.infrastructure_initiatives && tech.infrastructure_initiatives.length > 0 &&
            tech.infrastructure_initiatives[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Activity size={16} className="technology-icon" />
                  Infrastructure Initiatives
                </h4>
                <ul className="subsection-list">
                  {tech.infrastructure_initiatives.map((initiative, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {initiative}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {tech.platform_priorities && tech.platform_priorities.length > 0 &&
            tech.platform_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <BarChart3 size={16} className="technology-icon" />
                  Platform Priorities
                </h4>
                <ul className="subsection-list">
                  {tech.platform_priorities.map((priority, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderExecutionPillar = (execution) => {
    if (!execution) return null;

    const parseDuration = (duration) => {
      if (!duration) return 1;
      const match = duration?.toString().toLowerCase().match(/(\d+)\s*(month|week|day)/);
      if (!match) return 1;

      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'week': return Math.max(0.25, value / 4);
        case 'day': return Math.max(0.1, value / 30);
        case 'month':
        default: return Math.max(1, value);
      }
    };

    const renderGanttChart = (roadmap) => {
      if (!roadmap || roadmap.length === 0) return null;

      // Calculate cumulative timeline
      let cumulativeMonths = 0;
      const initiativesWithTimeline = roadmap.map((item, index) => {
        const duration = parseDuration(item.milestone || '1 month');
        const startMonth = cumulativeMonths;
        cumulativeMonths += duration;

        return {
          ...item,
          duration,
          startMonth,
          endMonth: cumulativeMonths,
          index
        };
      });

      const totalTimeline = cumulativeMonths;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

      const renderGanttBar = (startMonth, duration, index) => {
        const color = colors[index % colors.length];
        const leftPercent = (startMonth / totalTimeline) * 100;
        const widthPercent = (duration / totalTimeline) * 100;

        return (
          <div
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: '20px',
              backgroundColor: color,
              borderRadius: '4px',
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {Math.round(duration)}m
          </div>
        );
      };

      const renderTimelineHeader = () => {
        const months = Math.ceil(totalTimeline);
        return (
          <div style={{
            display: 'flex',
            marginBottom: '15px',
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: '600',
            borderBottom: '2px solid #d1d5db',
            paddingBottom: '8px'
          }}>
            {Array.from({ length: months }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                  padding: '4px 2px',
                  minWidth: '40px'
                }}
              >
                M{i + 1}
              </div>
            ))}
          </div>
        );
      };

      return (
        <div style={{ marginTop: '20px', marginBottom: '30px' }}>
          <h4 className="subsection-title" style={{ marginBottom: '20px' }}>
            <BarChart3 size={18} className="execution-icon" />
            Initiative Timeline
          </h4>

          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
              Timeline Overview ({Math.ceil(totalTimeline)} months)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '700px' }}>
                {renderTimelineHeader()}

                <div style={{ position: 'relative' }}>
                  {initiativesWithTimeline.map(({ initiative, startMonth, duration, index }) => (
                    <div key={index} style={{
                      position: 'relative',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: colors[index % colors.length],
                          flexShrink: 0
                        }} />
                        {initiative}
                      </div>
                      <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '28px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        minWidth: '520px'
                      }}>
                        {renderGanttBar(startMonth, duration, index)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="pillar-container">
        <div className="pillar-card execution-card">
          <div className="pillar-header execution-header">
            <CheckCircle size={22} className="execution-icon" />
            <h3 className="pillar-title">
              E – Execution: Roadmap & Monitoring
            </h3>
          </div>

          <DiagnosticBox diagnostic={execution.diagnostic} />

          {execution.implementation_roadmap && execution.implementation_roadmap.length > 0 && (
            <>
              {renderGanttChart(execution.implementation_roadmap)}

              <div className="subsection">
                <h4 className="subsection-title">
                  <Calendar size={18} className="execution-icon" />
                  Implementation Roadmap Details
                </h4>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Initiative</th>
                        <th>Milestone</th>
                        <th>Target Date</th>
                        <th>Owner</th>
                        <th>Success Metrics</th>
                        <th>Resources Required</th>
                        <th>Dependencies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {execution.implementation_roadmap.map((item, idx) => (
                        <tr key={idx}>
                          <td className="table-value">
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {item.initiative}
                            </div>
                          </td>
                          <td className="table-value">
                            {item.milestone}
                          </td>
                          <td className="table-value text-center">
                            <div className="flex-center" style={{ justifyContent: 'center' }}>
                              <Calendar size={12} />
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                {item.target_date}
                              </span>
                            </div>
                          </td>
                          <td className="table-value">
                            <div className="flex-center">
                              <Users size={12} />
                              {item.owner}
                            </div>
                          </td>
                          <td className="table-value">
                            {item.success_metrics && item.success_metrics.length > 0 && (
                              <ul className="table-list">
                                {item.success_metrics.map((metric, metricIdx) => (
                                  <li key={metricIdx} className="flex-center" style={{
                                    fontSize: '12px',
                                    color: '#059669',
                                    fontWeight: '600'
                                  }}>
                                    <Target size={10} />
                                    {metric}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="table-value">
                            {item.resources_required && (
                              <div style={{ fontSize: '12px' }}>
                                {item.resources_required.budget && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Budget:</strong> {item.resources_required.budget}
                                  </div>
                                )}
                                {item.resources_required.headcount && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Headcount:</strong> {item.resources_required.headcount}
                                  </div>
                                )}
                                {item.resources_required.technology && item.resources_required.technology.length > 0 && (
                                  <div>
                                    <strong>Technology:</strong>
                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                      {item.resources_required.technology.map((tech, techIdx) => (
                                        <li key={techIdx}>{tech}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="table-value">
                            {item.dependencies && item.dependencies.length > 0 && (
                              <ul className="table-list">
                                {item.dependencies.map((dep, depIdx) => (
                                  <li key={depIdx} className="flex-center" style={{ fontSize: '12px' }}>
                                    <Link2 size={10} />
                                    {dep}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {execution.kpi_dashboard && (
            <div className="subsection">
              <h4 className="subsection-title">
                <BarChart3 size={18} className="execution-icon" />
                KPI Dashboard
              </h4>

              {execution.kpi_dashboard.review_cadence && (
                <div className="info-box execution">
                  <Clock size={16} className="execution-icon" />
                  <span className="info-box-text execution">
                    Review Cadence: {execution.kpi_dashboard.review_cadence}
                  </span>
                </div>
              )}

              {execution.kpi_dashboard.adoption_metrics && execution.kpi_dashboard.adoption_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <TrendingUp size={14} style={{ color: '#3b82f6' }} />
                    Adoption Metrics
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Target</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.adoption_metrics.map((metric, idx) => (
                          <tr key={idx}>
                            <td className="table-value">{metric.metric}</td>
                            <td className="table-value">
                              <span className="badge adoption">
                                {metric.target}
                              </span>
                            </td>
                            <td className="table-value">
                              <div className="flex-center">
                                <Users size={12} />
                                {metric.owner}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.network_metrics && execution.kpi_dashboard.network_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <Link2 size={14} style={{ color: '#8b5cf6' }} />
                    Network Metrics
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Target</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.network_metrics.map((metric, idx) => (
                          <tr key={idx}>
                            <td className="table-value">{metric.metric}</td>
                            <td className="table-value">
                              <span className="badge network">
                                {metric.target}
                              </span>
                            </td>
                            <td className="table-value">
                              <div className="flex-center">
                                <Users size={12} />
                                {metric.owner}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.operational_metrics && execution.kpi_dashboard.operational_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <Activity size={14} style={{ color: '#f59e0b' }} />
                    Operational Metrics
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Target</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.operational_metrics.map((metric, idx) => (
                          <tr key={idx}>
                            <td className="table-value">{metric.metric}</td>
                            <td className="table-value">
                              <span className="badge operational">
                                {metric.target}
                              </span>
                            </td>
                            <td className="table-value">
                              <div className="flex-center">
                                <Users size={12} />
                                {metric.owner}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.financial_metrics && execution.kpi_dashboard.financial_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <DollarSign size={14} style={{ color: '#10b981' }} />
                    Financial Metrics
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Target</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.financial_metrics.map((metric, idx) => (
                          <tr key={idx}>
                            <td className="table-value">{metric.metric}</td>
                            <td className="table-value">
                              <span className="badge financial">
                                {metric.target}
                              </span>
                            </td>
                            <td className="table-value">
                              <div className="flex-center">
                                <Users size={12} />
                                {metric.owner}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGovernancePillar = (governance) => {
    if (!governance) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card governance-card">
          <div className="pillar-header governance-header">
            <Shield size={22} className="governance-icon" />
            <h3 className="pillar-title">
              G – Governance: Decision Rights & Accountability
            </h3>
          </div>

          <DiagnosticBox diagnostic={governance.diagnostic} />

          {governance.decision_delegation && governance.decision_delegation.length > 0 &&
            governance.decision_delegation[0].decision_type !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <ArrowRight size={16} className="governance-icon" />
                  Decision Delegation
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Decision Type</th>
                        <th>Delegated To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {governance.decision_delegation.map((delegation, idx) => (
                        <tr key={idx}>
                          <td className="table-value">
                            <div style={{ fontWeight: '600' }}>{delegation.decision_type}</div>
                          </td>
                          <td className="table-value">
                            <div className="flex-center">
                              <Users size={12} />
                              {delegation.delegate_to}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {governance.accountability_framework && governance.accountability_framework.length > 0 &&
            governance.accountability_framework[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <CheckCircle size={16} className="governance-icon" />
                  Accountability Framework
                </h4>
                <ul className="subsection-list">
                  {governance.accountability_framework.map((item, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderInnovationPillar = (innovation) => {
    if (!innovation) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card innovation-card">
          <div className="pillar-header innovation-header">
            <Lightbulb size={22} className="innovation-icon" />
            <h3 className="pillar-title">
              I – Innovation: Pipeline & Portfolio
            </h3>
          </div>

          <DiagnosticBox diagnostic={innovation.diagnostic} />

          {innovation.target_portfolio_mix && innovation.target_portfolio_mix.core !== 'N/A' && (
            <div className="subsection">
              <h4 className="subsection-title">
                <BarChart3 size={16} className="innovation-icon" />
                Target Portfolio Mix
              </h4>
              <div className="portfolio-mix-container">
                {innovation.target_portfolio_mix.core && innovation.target_portfolio_mix.core !== 'N/A' && (
                  <div className="portfolio-mix-card core">
                    <div className="portfolio-mix-label core">
                      Core
                    </div>
                    <div className="portfolio-mix-value core">
                      {innovation.target_portfolio_mix.core}
                    </div>
                  </div>
                )}
                {innovation.target_portfolio_mix.adjacent && innovation.target_portfolio_mix.adjacent !== 'N/A' && (
                  <div className="portfolio-mix-card adjacent">
                    <div className="portfolio-mix-label adjacent">
                      Adjacent
                    </div>
                    <div className="portfolio-mix-value adjacent">
                      {innovation.target_portfolio_mix.adjacent}
                    </div>
                  </div>
                )}
                {innovation.target_portfolio_mix.transformational && innovation.target_portfolio_mix.transformational !== 'N/A' && (
                  <div className="portfolio-mix-card transformational">
                    <div className="portfolio-mix-label transformational">
                      Transformational
                    </div>
                    <div className="portfolio-mix-value transformational">
                      {innovation.target_portfolio_mix.transformational}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )} {innovation.priority_innovation_bets && innovation.priority_innovation_bets.length > 0 &&
            innovation.priority_innovation_bets[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Star size={16} className="innovation-icon" />
                  Priority Innovation Bets
                </h4>
                <ul className="subsection-list">
                  {innovation.priority_innovation_bets.map((bet, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {bet}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };
  const renderCulturePillar = (culture) => {
    if (!culture) return null; return (
      <div className="pillar-container">
        <div className="pillar-card culture-card">
          <div className="pillar-header culture-header">
            <Heart size={22} className="culture-icon" />
            <h3 className="pillar-title">
              C – Culture: Alignment & Transformation
            </h3>
          </div>

          <DiagnosticBox diagnostic={culture.diagnostic} />

          {culture.cultural_shifts && culture.cultural_shifts.length > 0 &&
            culture.cultural_shifts[0].from !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <TrendingUp size={16} className="culture-icon" />
                  Cultural Shifts
                </h4>
                <div className="cultural-shifts-container">
                  {culture.cultural_shifts.map((shift, idx) => (
                    <div key={idx} className="cultural-shift-card">
                      <div className="cultural-shift-content">
                        <div className="cultural-shift-from">
                          <span className="cultural-shift-label">From: </span>
                          <span className="cultural-shift-value">{shift.from}</span>
                        </div>
                        <ArrowRight size={16} className="cultural-shift-arrow" />
                        <div className="cultural-shift-to">
                          <span className="cultural-shift-label">To: </span>
                          <span className="cultural-shift-value to">{shift.to}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {culture.change_approach && culture.change_approach.length > 0 &&
            culture.change_approach[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <CheckCircle size={16} className="culture-icon" />
                  Change Approach
                </h4>
                <ul className="subsection-list">
                  {culture.change_approach.map((approach, idx) => (
                    <li key={idx} className="subsection-list-item">
                      {approach}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };
  const renderStrategicLinkages = (linkages) => {
    if (!linkages || !linkages.objective_to_initiative_map || linkages.objective_to_initiative_map.length === 0) {
      return null;
    } return (
      <section className="strategic-page-section">
        <div className="section-headers">
          <Link2 size={24} style={{ color: 'blue' }} />
          <div><h2 className="category-title">Strategic Objective</h2></div>

        </div>

        <div className="strategic-linkages-container">

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Strategic Objective</th>
                  <th>Linked Initiatives</th>
                  <th>Success Criteria</th>
                </tr>
              </thead>
              <tbody>
                {linkages.objective_to_initiative_map.map((link, idx) => (
                  <tr key={idx}>
                    <td className="table-value">
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                        {link.strategic_objective}
                      </div>
                    </td>
                    <td className="table-value">
                      {link.linked_initiatives && link.linked_initiatives.length > 0 && (
                        <ul className="table-list">
                          {link.linked_initiatives.map((initiative, initIdx) => (
                            <li key={initIdx} className="flex-center" style={{ fontSize: '13px' }}>
                              <ArrowRight size={10} style={{ color: '#3b82f6' }} />
                              {initiative}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="table-value">
                      <div className="flex-center" style={{
                        fontSize: '13px',
                        color: '#059669',
                        fontWeight: '500'
                      }}>
                        <Target size={12} />
                        {link.success_criteria}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };
  const renderStrategicRecommendationsFromAnalyses = () => {
    const pestelAnalysis = phaseAnalysisArray.find(analysis =>
      analysis.analysis_type === 'pestel'
    ); const portersAnalysis = phaseAnalysisArray.find(analysis =>
      analysis.analysis_type === 'porters'
    );

    const pestelRecommendations = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
    const portersRecommendations = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

    const hasPestelRecommendations = pestelRecommendations && (
      (pestelRecommendations.immediate_actions && pestelRecommendations.immediate_actions.length > 0) ||
      (pestelRecommendations.short_term_initiatives && pestelRecommendations.short_term_initiatives.length > 0) ||
      (pestelRecommendations.long_term_strategic_shifts && pestelRecommendations.long_term_strategic_shifts.length > 0)
    );

    const hasPortersRecommendations = portersRecommendations && (
      (portersRecommendations.immediate_actions && portersRecommendations.immediate_actions.length > 0) ||
      (portersRecommendations.short_term_initiatives && portersRecommendations.short_term_initiatives.length > 0) ||
      (portersRecommendations.long_term_strategic_shifts && portersRecommendations.long_term_strategic_shifts.length > 0)
    );

    if (!hasPestelRecommendations && !hasPortersRecommendations) {
      return null;
    }

    const renderRecommendationActions = (actions, title, icon) => {
      if (!actions || actions.length === 0) return null;

      return (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Rationale</th>
                  <th>Timeline</th>
                  <th>Resources Required</th>
                  <th>Success Metrics</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, index) => (
                  <tr key={index}>
                    <td className="table-value">
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {action.action}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        {action.rationale}
                      </div>
                    </td>
                    <td className="table-value text-center">
                      <div style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        {action.timeline}
                      </div>
                    </td>
                    <td className="table-value">
                      {action.resources_required && (
                        <ul className="table-list">
                          {(Array.isArray(action.resources_required) ? action.resources_required : [action.resources_required]).map((resource, idx) => (
                            <li key={idx} style={{
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6'
                              }} />
                              {resource}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="table-value">
                      {action.success_metrics && action.success_metrics.length > 0 && (
                        <ul className="table-list">
                          {action.success_metrics.map((metric, idx) => (
                            <li key={idx} style={{
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '600',
                              color: '#059669'
                            }}>
                              <Target size={10} />
                              {metric}
                            </li>
                          ))}
                        </ul>
                      )}
                      {action.expected_impact && (
                        <div style={{
                          fontSize: '12px',
                          color: '#059669',
                          display: 'flex',
                          fontWeight: '600',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Target size={10} />
                          {action.expected_impact}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderInitiatives = (initiatives, title, icon) => {
      if (!initiatives || initiatives.length === 0) return null;

      return (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Initiative</th>
                  <th>Strategic Pillar</th>
                  <th>Expected Outcome</th>
                  <th>Risk Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {initiatives.map((initiative, index) => (
                  <tr key={index}>
                    <td className="table-value">
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {initiative.initiative}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        {initiative.strategic_pillar}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        {initiative.expected_outcome}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{ fontSize: '13px', color: '#dc2626' }}>
                        {initiative.risk_mitigation}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderLongTermShifts = (shifts, title, icon) => {
      if (!shifts || shifts.length === 0) return null;

      return (
        <div style={{ marginBottom: '5px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Strategic Shift</th>
                  <th>Transformation Required</th>
                  <th>Competitive Advantage</th>
                  <th>Sustainability</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, index) => (
                  <tr key={index}>
                    <td className="table-value">
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {shift.shift}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        {shift.transformation_required}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{
                        fontSize: '13px',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <TrendingUp size={12} />
                        {shift.competitive_advantage}
                      </div>
                    </td>
                    <td className="table-value">
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        {shift.sustainability}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const combinedImmediateActions = [
      ...(pestelRecommendations?.immediate_actions || []),
      ...(portersRecommendations?.immediate_actions || [])
    ];

    const combinedShortTermInitiatives = [
      ...(pestelRecommendations?.short_term_initiatives || []),
      ...(portersRecommendations?.short_term_initiatives || [])
    ];

    const combinedLongTermShifts = [
      ...(pestelRecommendations?.long_term_strategic_shifts || []),
      ...(portersRecommendations?.long_term_strategic_shifts || [])
    ];

    return (
      <section className="strategic-page-section">
        {/* <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          gap: '8px',
          marginBottom: '20px',
          background: '#fff'
        }}>
          <Settings size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop: '5px' }}>Strategic Recommendations</h4>
        </div> */}
        {renderRecommendationActions(
          combinedImmediateActions,
          'Immediate Actions',
          <Zap size={20} style={{ color: '#ef4444' }} />
        )}

        {renderInitiatives(
          combinedShortTermInitiatives,
          'Short-term Initiatives',
          <Activity size={20} style={{ color: '#f59e0b' }} />
        )}

        {renderLongTermShifts(
          combinedLongTermShifts,
          'Long-term Strategic Shifts',
          <TrendingUp size={20} style={{ color: '#10b981' }} />
        )}
      </section>
    );
  };
  const renderStrategicContent = () => {
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    const recommendations = analysisData?.strategic_recommendations;

    if (!recommendations) return null;

    return (
      <div className="strategic-content">
        {recommendations.strategy_block && (
          <div className="block-wrapper">
            <CategorySection
              id="strategy-block"
              title="Strategy Block: Direction & Positioning  (S.T.R.)"
              icon={Target}
              description="Forward-looking recommendations for where and how to compete, tactical initiatives, and resource allocation."
            >
              {renderStrategyPillar(recommendations.strategy_block.S_strategy)}
              {renderTacticsPillar(recommendations.strategy_block.T_tactics)}
              {renderResourcesPillar(recommendations.strategy_block.R_resources)}
            </CategorySection>
          </div>
        )}

        {recommendations.execution_block && (
          <div className="block-wrapper">
            <CategorySection
              id="execution-block"
              title="Execution Block: Implementation & Monitoring (A.T.E.)"
              icon={CheckCircle}
              description="Data strategy, technology priorities, implementation roadmap, and KPI dashboard for tracking progress."
            >
              {renderAnalysisDataPillar(recommendations.execution_block.A_analysis_data)}
              {renderTechnologyPillar(recommendations.execution_block.T_technology_digitalization)}
              {renderExecutionPillar(recommendations.execution_block.E_execution)}
            </CategorySection>
          </div>
        )}

        {recommendations.sustainability_block && (
          <div className="block-wrapper">
            <CategorySection
              id="sustainability-block"
              title="Sustainability Block: Long-term Reinforcement (G.I.C)"
              icon={Shield}
              description="Governance frameworks, innovation pipeline, and cultural alignment to sustain strategic momentum."
            >
              {renderGovernancePillar(recommendations.sustainability_block.G_governance)}
              {renderInnovationPillar(recommendations.sustainability_block.I_innovation)}
              {renderCulturePillar(recommendations.sustainability_block.C_culture)}
            </CategorySection>
          </div>
        )}

        {/* {renderStrategicLinkages(analysisData?.strategic_linkages)} */}
        {/* {renderStrategicRecommendationsFromAnalyses()} */}

      </div>
    );
  };
  if (isRegenerating || isLoading) {
    return (
      <div className="strategic-analysis-container">
        <div className="loading-state">
          <Loader className="loading-spinner spin-animation" size={40} />
          <h3 className="loading-title">Generating Strategic Analysis</h3>
          <p className="loading-text">Building comprehensive strategic insights...</p>
        </div>
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div className="strategic-analysis-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{errorMessage}</p>
          <button onClick={handleRegenerate} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }
  if (!hasGenerated || !localStrategicData || isStrategicDataIncomplete(localStrategicData)) {
    return (
      <div
        className="strategic-analysis-container"
        data-analysis-type="strategic"
        data-analysis-name="Strategic Analysis"
        data-analysis-order="10"
      >
        <AnalysisEmptyState
          analysisType="strategic"
          analysisDisplayName="Strategic Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate && !!onRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={5}
          customMessage="Complete essential phase questions to unlock comprehensive strategic analysis with implementation roadmaps and accountability frameworks."
        />
      </div>
    );
  }
  return (
    <div
      className="strategic-analysis-container"
      data-analysis-type="strategic"
      data-analysis-name="Strategic Analysis"
      data-analysis-order="10"
    >
      <div className="dashboard-container">
        {renderStrategicContent()}
      </div>
    </div>
  );
};
export default StrategicAnalysis;