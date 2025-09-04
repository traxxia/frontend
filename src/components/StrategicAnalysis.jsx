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
  onRedirectToBrief
}) => {
  const [localStrategicData, setLocalStrategicData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent multiple initializations and API calls
  const hasInitialized = useRef(false);
  const isGenerating = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';

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
    console.log('Strategic handleRegenerate called', { onRegenerate: !!onRegenerate });

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

  // Check if the strategic data is empty/incomplete
  const isStrategicDataIncomplete = (data) => {
    if (!data) return true;

    // Check if strategic_analysis exists
    const analysisData = data.strategic_analysis || data;
    if (!analysisData) return true;

    // Check for key sections
    const hasStrategicPillars = analysisData.strategic_pillars_analysis &&
      Object.keys(analysisData.strategic_pillars_analysis).length > 0;

    const hasRoadmap = analysisData.implementation_roadmap &&
      Object.keys(analysisData.implementation_roadmap).length > 0;

    const hasRiskAssessment = analysisData.risk_assessment &&
      (analysisData.risk_assessment.strategic_risks?.length > 0 ||
        analysisData.risk_assessment.contingency_plans?.length > 0);

    // At least 2 main sections should have data for meaningful analysis
    const sectionsWithData = [hasStrategicPillars, hasRoadmap, hasRiskAssessment].filter(Boolean).length;

    return sectionsWithData < 2;
  };

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (strategicData) {
      setLocalStrategicData(strategicData);
      setHasGenerated(true);
      setErrorMessage('');
    }
  }, [strategicData]);

  // Update data when prop changes
  useEffect(() => {
    if (strategicData) {
      setLocalStrategicData(strategicData);
      setHasGenerated(true);
      setErrorMessage('');
    } else if (strategicData === null) {
      // Only reset if explicitly set to null (during regeneration)
      setLocalStrategicData(null);
      setHasGenerated(false);
    }
  }, [strategicData]);
  // Add this function to your StrategicAnalysis component
  const renderCompetitiveLandscapeTable = (data) => {
    const competitiveLandscape = data?.competitive_landscape;
    if (!competitiveLandscape) return null;

    const getThreatLevelColor = (level) => {
      switch (level?.toLowerCase()) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#6b7280';
      }
    };

    const getLikelihoodColor = (likelihood) => {
      switch (likelihood?.toLowerCase()) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#6b7280';
      }
    };

    return (
      <section className="strategic-page-section">
        <div className="section-headers" style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderBottom: 'none', 
          gap: '8px',
          marginBottom:'10px',
          background: '#fff'
        }}>
          <Target size={24} style={{ color: 'blue' }} />
          <h4  style={{marginTop:'5px'}} >Competitive Landscape Analysis</h4>
        </div>

        {/* Direct Competitors */}
        {competitiveLandscape.direct_competitors && competitiveLandscape.direct_competitors.length > 0 && (
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1f2937'
            }}>
              <Users size={20} />
              Direct Competitors
            </h3>

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'15px', marginBottom:'20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Market Share</th>
                    <th>Strengths</th>
                    <th>Weaknesses</th>
                  </tr>
                </thead>
                <tbody>
                  {competitiveLandscape.direct_competitors.map((competitor, index) => (
                    <tr key={index}>
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {competitor.name}
                        </div>
                      </td>
                      <td className="table-value text-center">
                        <div style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {competitor.market_share}
                        </div>
                      </td>
                      <td className="table-value">
                        {competitor.strengths && competitor.strengths.length > 0 && (
                          <ul className="table-list">
                            {competitor.strengths.map((strength, idx) => (
                              <li key={idx} style={{
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#059669'
                              }}>
                                <CheckCircle size={12} />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="table-value">
                        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                          <ul className="table-list">
                            {competitor.weaknesses.map((weakness, idx) => (
                              <li key={idx} style={{
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#dc2626'
                              }}>
                                <Target size={12} />
                                {weakness}
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
        )}

        {/* Indirect Competitors */}
        {competitiveLandscape.indirect_competitors && competitiveLandscape.indirect_competitors.length > 0 && (
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1f2937'
            }}>
              <Eye size={20} />
              Indirect Competitors
            </h3>

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'15px', marginBottom:'20px'  }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Threat Level</th>
                    <th>Competitive Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {competitiveLandscape.indirect_competitors.map((competitor, index) => (
                    <tr key={index}>
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {competitor.name}
                        </div>
                      </td>
                      <td className="table-value text-center">
                        <div style={{
                          backgroundColor: getThreatLevelColor(competitor.threat_level),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'inline-block',
                          textTransform: 'capitalize'
                        }}>
                          {competitor.threat_level}
                        </div>
                      </td>
                      <td className="table-value">
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          {competitor.competitive_advantage}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Potential Entrants */}
        {competitiveLandscape.potential_entrants && competitiveLandscape.potential_entrants.length > 0 && (
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1f2937',
              marginBottom:'20px'
            }}>
              <TrendingUp size={20} />
              Potential Market Entrants
            </h3>

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'15px'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Entry Likelihood</th>
                    <th>Market Barriers</th>
                  </tr>
                </thead>
                <tbody>
                  {competitiveLandscape.potential_entrants.map((entrant, index) => (
                    <tr key={index}>
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {entrant.category}
                        </div>
                      </td>
                      <td className="table-value text-center">
                        <div style={{
                          backgroundColor: getLikelihoodColor(entrant.likelihood),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'inline-block',
                          textTransform: 'capitalize'
                        }}>
                          {entrant.likelihood}
                        </div>
                      </td>
                      <td className="table-value">
                        <div style={{
                          fontSize: '13px',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Shield size={14} />
                          {entrant.barriers}
                        </div>
                      </td>
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

      <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'15px'}}>
        <table className="data-table">
          <tbody>
            {improvements.map((improvement, index) => (
              <tr key={index}>
                <td className="table-value">
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 0'
                  }}> 
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}> 
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        lineHeight: '1.4',
                        color: '#1f2937'
                      }}>
                        {improvement}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <h4 style={{marginTop:'5px' }}>Strategic Pillars Analysis</h4>
        </div>

        {/* Add the Strategic Wheel */}
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
          <h4 style={{ marginTop:'5px' }}>Strategic Goals ({goals.year})</h4>
        </div>

        {/* Overall Progress Summary */}
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

          {/* Progress Bar */}
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

          {/* Strategic Themes */}
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

        {/* Objectives Table */}
        <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'25px' }}>
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

        {/* Quarterly Milestones */}
        {goals.quarterly_milestones && goals.quarterly_milestones.length > 0 && (
          <div style={{ marginTop: '30px' }}>
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

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'15px'}}>
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
                  {goals.quarterly_milestones.map((milestone, index) => (
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
      </section>
    );
  };

  const renderImplementationRoadmapTable = (data) => {
    const roadmap = data?.implementation_roadmap;
    if (!roadmap) return null;

    // Extract duration in months for Gantt visualization
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

    // Calculate cumulative timeline for Gantt
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
          marginBottom:'10px',
          background: '#fff'
        }}>
          <Calendar size={24} style={{ color: 'blue' }} />
          <h4 style={{ marginTop:'5px' }} >Implementation Roadmap</h4>
        </div>

        {/* Gantt Chart Visualization */}
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
</div>



        {/* Detailed Table */}
        <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'25px' }}>
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

        {/* Dashboard Requirements */}
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

        {/* Review Cycles Table */}
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

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'25px', marginBottom:'20px' }}>
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

        {/* Feedback Loops Table */}
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

            <div className="table-container" style={{ margin: 0, padding: 0, marginTop:'25px' }}>
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
    // Extract strategic_analysis from the response
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;

    return (
      <div className="strategic-content">
        {renderStrategicPillarsTable(analysisData)}
        {renderStrategicGoalsTable(analysisData)}
        {/* {renderCrossPillarSynthesisTable(analysisData)} */}
        {/* {renderAgileFrameworksTable(analysisData)} */}
        {/* {renderRiskAssessmentTable(analysisData)}
        {renderSuccessBenchmarksTable(analysisData)} */}
        {renderImplementationRoadmapTable(analysisData)}
        {renderCompetitiveLandscapeTable(analysisData)}
        {renderKeyImprovementsTable(analysisData)}
        {renderMonitoringDashboardTable(analysisData)}
      </div>
    );
  };

  // Loading state
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

  // Error state
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

  // Check if data is incomplete and show missing questions checker
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