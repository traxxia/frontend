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
  Eye,
  Settings,
  BarChart3,
  Activity,
  Star,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import StrategicWheel from './StrategicWheel';

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
        await onRegenerate();
      } catch (error) {
        console.error('Error in Strategic regeneration:', error);
        setErrorMessage(error.message || 'Failed to regenerate strategic analysis');
      }
    } else {
      console.warn('No onRegenerate prop provided to StrategicAnalysis');
      setErrorMessage('Regeneration not available');
    }
  };

  const isStrategicDataIncomplete = (data) => {
    if (!data) return true;
    const analysisData = data.strategic_analysis || data;
    if (!analysisData) return true;
    const hasStrategicPillars = analysisData.strategic_pillars_analysis &&
      Object.keys(analysisData.strategic_pillars_analysis).length > 0;

    const hasRoadmap = analysisData.implementation_roadmap &&
      Object.keys(analysisData.implementation_roadmap).length > 0;

    const hasRiskAssessment = analysisData.risk_assessment &&
      (analysisData.risk_assessment.strategic_risks?.length > 0 ||
        analysisData.risk_assessment.contingency_plans?.length > 0);

    const sectionsWithData = [hasStrategicPillars, hasRoadmap, hasRiskAssessment].filter(Boolean).length;
    return sectionsWithData < 2;
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
    } else if (strategicData === null) {
      setLocalStrategicData(null);
      setHasGenerated(false);
    }
  }, [strategicData]);

  const renderStrategicRecommendationsFromAnalyses = () => {
    const pestelAnalysis = phaseAnalysisArray.find(analysis =>
      analysis.analysis_type === 'pestel'
    );

    const portersAnalysis = phaseAnalysisArray.find(analysis =>
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
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          gap: '8px',
          marginBottom: '20px',
          background: '#fff'
        }}>
          <Settings size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop: '5px' }}>Strategic Recommendations</h4>
        </div>
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
  const renderKeyImprovementsTable = (data) => {
    const improvements = data?.key_improvements;
    if (!improvements || !Array.isArray(improvements) || improvements.length === 0) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          gap: '8px',
          background: '#fff'
        }}>
          <TrendingUp size={24} style={{ color: 'blue' }} />
          <h4>Key Improvements</h4>
        </div>

        <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '15px' }}>

          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {improvements.map((improvement, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '8px 0',
                borderBottom: index < improvements.length - 1 ? '1px dotted #d1d5db' : 'none'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  marginTop: '8px',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.4',
                  color: '#1f2937',
                  flex: 1
                }}>
                  {improvement}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  };

  const renderStrategicPillarsTable = (data) => {
    const pillars = data?.strategic_pillars_analysis;
    if (!pillars) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          marginBottom: '10px',
          gap: '8px',
          background: '#fff'
        }}>
          <BarChart3 size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop: '5px' }}>Strategic Pillars Analysis</h4>
        </div>
        <StrategicWheel
          pillarsData={pillars}
          className="strategic-wheel-section"
        />
      </section>
    );
  };

  const renderStrategicGoalsTable = (data) => {
    const goals = data?.strategic_goals;
    if (!goals) return null;

    const getPriorityColor = (priority) => {
      switch (priority) {
        case '1': return '#ef4444'; // High priority - red
        case '2': return '#f59e0b'; // Medium priority - orange  
        case '3': return '#10b981'; // Lower priority - green
        default: return '#6b7280';
      }
    };

    const getAlignmentColor = (alignment) => {
      switch (alignment?.toLowerCase()) {
        case 'growth': return '#3b82f6';
        case 'retention': return '#10b981';
        case 'market expansion': return '#8b5cf6';
        case 'efficiency': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    const getProgressWidth = (progress) => {
      const numericProgress = parseFloat(progress?.replace('%', '') || 0);
      return Math.max(2, numericProgress); // Minimum 2% for visibility
    };

    const getProgressColor = (progress) => {
      const numericProgress = parseFloat(progress?.replace('%', '') || 0);
      if (numericProgress >= 80) return '#10b981';
      if (numericProgress >= 60) return '#3b82f6';
      if (numericProgress >= 40) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          marginBottom: '10px',
          gap: '8px',
          background: '#fff'
        }}>
          <Target size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop: '5px' }}>Strategic Goals ({goals.year})</h4>
        </div>

        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>
              Overall Strategic Progress
            </h3>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getProgressColor(goals.overall_progress)
            }}>
              {goals.overall_progress}
            </div>
          </div>

          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e5e7eb',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              width: `${getProgressWidth(goals.overall_progress)}%`,
              height: '100%',
              backgroundColor: getProgressColor(goals.overall_progress),
              transition: 'width 0.3s ease'
            }} />
          </div>

          {goals.strategic_themes && goals.strategic_themes.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>
                Key Strategic Themes:
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {goals.strategic_themes.map((theme, index) => (
                  <span key={index} style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '25px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Objective</th>
                <th>Priority</th>
                <th>Owner</th>
                <th>Timeline</th>
                <th>Alignment</th>
                <th>Key Results</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {goals.objectives && goals.objectives.map((objective, index) => (
                <tr key={index}>
                  <td className="table-value">
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {objective.objective}
                    </div>
                  </td>
                  <td className="table-value text-center">
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: getPriorityColor(objective.priority),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {objective.priority}
                    </div>
                  </td>
                  <td className="table-value">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} />
                      {objective.owner}
                    </div>
                  </td>
                  <td className="table-value">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      <span style={{ fontSize: '12px' }}>{objective.timeline}</span>
                    </div>
                  </td>
                  <td className="table-value">
                    <span style={{
                      backgroundColor: getAlignmentColor(objective.alignment),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {objective.alignment}
                    </span>
                  </td>
                  <td className="table-value">
                    {objective.keyResults && objective.keyResults.length > 0 && (
                      <ul className="table-list">
                        {objective.keyResults.map((result, idx) => (
                          <li key={idx} style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: '500' }}>{result.metric}</div>
                            <div style={{ color: '#6b7280' }}>
                              Target: {result.target}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="table-value text-center">
                    {objective.keyResults && objective.keyResults[0] && (
                      <div style={{ minWidth: '80px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: getProgressColor(objective.keyResults[0].progress),
                          marginBottom: '4px'
                        }}>
                          {objective.keyResults[0].progress}
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${getProgressWidth(objective.keyResults[0].progress)}%`,
                            height: '100%',
                            backgroundColor: getProgressColor(objective.keyResults[0].progress),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderImplementationRoadmapTable = (data) => {
    const roadmap = data?.implementation_roadmap;
    if (!roadmap) return null;
    const parseDuration = (duration) => {
      if (!duration) return 1;
      const match = duration.toLowerCase().match(/(\d+)\s*(month|week|day)/);
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

    const phases = Object.entries(roadmap);
    const maxDuration = Math.max(...phases.map(([_, phase]) => parseDuration(phase.duration)));

    let cumulativeMonths = 0;
    const phasesWithTimeline = phases.map(([phaseKey, phase]) => {
      const duration = parseDuration(phase.duration);
      const startMonth = cumulativeMonths;
      cumulativeMonths += duration;

      return {
        key: phaseKey,
        phase,
        duration,
        startMonth,
        endMonth: cumulativeMonths
      };
    });

    const totalTimeline = cumulativeMonths;

    const renderGanttBar = (startMonth, duration, index) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      const color = colors[index % colors.length];

      const leftPercent = (startMonth / totalTimeline) * 100;
      const widthPercent = (duration / totalTimeline) * 100;

      return (
        <div
          className="gantt-bar"
          style={{
            position: 'absolute',
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            height: '20px',
            backgroundColor: color,
            borderRadius: '4px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {Math.round(duration)}m
        </div>
      );
    };

    const renderTimelineHeader = () => {
      const months = Math.ceil(totalTimeline);
      return (
        <div style={{ display: 'flex', marginBottom: '10px', fontSize: '12px', color: '#000' }}>
          {Array.from({ length: months }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                padding: '4px 2px'
              }}
            >
              M{i + 1}
            </div>
          ))}
        </div>
      );
    };

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none',
          gap: '8px',
          marginBottom: '10px',
          background: '#fff'
        }}>
          <Calendar size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop: '5px' }} >Implementation Roadmap</h4>
        </div>

        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
            Timeline Overview ({Math.ceil(totalTimeline)} months)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '700px' }}>
              {renderTimelineHeader()}
              <div style={{ position: 'relative', minHeight: `${phasesWithTimeline.length * 35}px` }}>
                {phasesWithTimeline.map(({ key, phase, startMonth, duration }, index) => (
                  <div key={key} style={{
                    position: 'relative',
                    height: '30px',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '120px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginRight: '10px',
                      textAlign: 'right'
                    }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{
                      flex: 1,
                      position: 'relative',
                      height: '25px',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      minWidth: '600px'
                    }}>
                      {renderGanttBar(startMonth, duration, index)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {data?.strategic_goals?.quarterly_milestones && data.strategic_goals.quarterly_milestones.length > 0 && (
            <div style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={20} />
                Quarterly Milestones
              </h3>

              <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '15px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Quarter</th>
                      <th>Milestone</th>
                      <th>Success Criteria</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.strategic_goals.quarterly_milestones.map((milestone, index) => (
                      <tr key={index}>
                        <td className="table-value text-center">
                          <div style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {milestone.quarter}
                          </div>
                        </td>
                        <td className="table-value">
                          <div style={{ fontWeight: '600' }}>
                            {milestone.milestone}
                          </div>
                        </td>
                        <td className="table-value">
                          <div style={{ fontSize: '13px', color: '#374151' }}>
                            {milestone.success_criteria}
                          </div>
                        </td>
                        <td className="table-value text-center">
                          <div style={{
                            backgroundColor: milestone.status ?
                              (milestone.status.toLowerCase() === 'completed' ? '#10b981' :
                                milestone.status.toLowerCase() === 'in progress' ? '#f59e0b' :
                                  milestone.status.toLowerCase() === 'pending' ? '#6b7280' : '#3b82f6') : '#3b82f6',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                            display: 'inline-block'
                          }}>
                            {milestone.status || 'Planned'}
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
        <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '25px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Duration</th>
                <th>Budget</th>
                <th>Focus</th>
                <th>Key Initiatives</th>
                <th>Success Criteria</th>
              </tr>
            </thead>
            <tbody>
              {phasesWithTimeline.map(({ key, phase }, index) => (
                <tr key={key}>
                  <td className="table-value">
                    <div className="phase-name">
                      <div className="phase-number">{index + 1}</div>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                    </div>
                  </td>
                  <td className="table-value text-center">
                    {phase.duration && (
                      <div className="duration-info">
                        <Clock size={12} />
                        {phase.duration}
                      </div>
                    )}
                  </td>
                  <td className="table-value text-center">
                    {phase.budget && (
                      <div className="budget-info">
                        {phase.budget}
                      </div>
                    )}
                  </td>
                  <td className="table-value">{phase.focus}</td>
                  <td className="table-value">
                    {phase.key_initiatives && phase.key_initiatives.length > 0 && (
                      <ul className="table-list">
                        {phase.key_initiatives.map((initiative, idx) => (
                          <li key={idx}>
                            <ArrowRight size={10} />
                            {initiative}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="table-value">
                    {phase.success_criteria && phase.success_criteria.length > 0 && (
                      <ul className="table-list">
                        {phase.success_criteria.map((criteria, idx) => (
                          <li key={idx}>
                            <CheckCircle size={10} />
                            {criteria}
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
      </section>
    );
  };

  const renderMonitoringDashboardTable = (data) => {
    const monitoring = data?.monitoring_and_feedback;
    if (!monitoring) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none',
          marginBottom: '10px',
          gap: '8px',
          background: '#fff'
        }}>
          <Activity size={24} style={{ color: 'blue' }} />
          <h4>Monitoring & Performance Dashboard</h4>
        </div>

        {monitoring.dashboard_requirements && monitoring.dashboard_requirements.length > 0 && (
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BarChart3 size={20} />
              Dashboard Requirements
            </h3>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {monitoring.dashboard_requirements.map((requirement, index) => (
                <span key={index} style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={12} />
                  {requirement}
                </span>
              ))}
            </div>
          </div>
        )}

        {monitoring.review_cycles && (
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={20} />
              Review Cycles
            </h3>

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '25px', marginBottom: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Frequency</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monitoring.review_cycles).map(([frequency, description]) => (
                    <tr key={frequency}>
                      <td className="table-value" style={{ textTransform: 'capitalize' }}>
                        {frequency}
                      </td>
                      <td className="table-value">
                        {description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {monitoring.feedback_loops && monitoring.feedback_loops.length > 0 && (
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ArrowRight size={20} />
              Feedback Loops
            </h3>

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop: '25px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Frequency</th>
                    <th>Integration Point</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoring.feedback_loops.map((loop, index) => (
                    <tr key={index}>
                      <td className="table-value">{loop.source}</td>
                      <td className="table-value">{loop.frequency}</td>
                      <td className="table-value">{loop.integration_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderStrategicContent = () => {
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    return (
      <div className="strategic-content">
        {renderStrategicPillarsTable(analysisData)}
        {renderStrategicGoalsTable(analysisData)}
        {renderStrategicRecommendationsFromAnalyses()}
        {renderImplementationRoadmapTable(analysisData)}
        {renderKeyImprovementsTable(analysisData)}
        {renderMonitoringDashboardTable(analysisData)}
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
      <div className="strategic-analysis-container"
        data-analysis-type="strategic"
        data-analysis-name="Strategic Analysis"
        data-analysis-order="10">
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
          customMessage="Complete essential phase questions to unlock comprehensive strategic analysis with implementation roadmaps and risk assessments."
        />
      </div>
    );
  }

  return (
    <div className="strategic-analysis-container"
      data-analysis-type="strategic"
      data-analysis-name="Strategic Analysis"
      data-analysis-order="10">
      <div className="dashboard-container">
        {renderStrategicContent()}
      </div>
    </div>
  );
};

export default StrategicAnalysis;