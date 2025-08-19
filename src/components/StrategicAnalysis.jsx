import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Loader,
  Target,
  TrendingUp,
  AlertTriangle,
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
  DollarSign,
  Award,
  PlayCircle,
  Monitor,
  MessageCircle,
  Building
} from 'lucide-react'; 
import DownloadStrategicAnalysis from './DownloadStrategicAnalysis';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

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

  const generateStrategicAnalysis = async () => {
    // Prevent multiple simultaneous calls
    if (isGenerating.current || isLoading) {
      console.log('Strategic analysis already generating, skipping...');
      return;
    }

    try {
      isGenerating.current = true;
      setIsLoading(true);
      setErrorMessage('');

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
        throw new Error('No questions available for strategic analysis');
      }

      console.log('Generating strategic analysis with', questionsArray.length, 'questions');

      const requestPayload = {
        questions: questionsArray,
        answers: answersArray
      };

      const response = await fetch(`${ML_API_BASE_URL}/strategic-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.detail || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorText = await response.text();
        }
        throw new Error(`Strategic Analysis API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Strategic analysis result received:', !!result);

      // Validate the result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format received from strategic analysis API');
      }

      // Save to backend (overwrite existing result)
      if (saveAnalysisToBackend && typeof saveAnalysisToBackend === 'function') {
        try {
          await saveAnalysisToBackend(result, 'strategic');
        } catch (saveError) {
          console.error('Error saving strategic analysis:', saveError);
          // Don't throw - continue with setting local data even if save fails
        }
      }

      setLocalStrategicData(result);
      setHasGenerated(true);
      return result;

    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      setErrorMessage(error.message || 'Failed to generate strategic analysis');
      throw error;
    } finally {
      setIsLoading(false);
      isGenerating.current = false;
    }
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

  const getPillarIcon = (pillarKey) => {
    const icons = {
      strategy: Target,
      tactics: BarChart3,
      resources: Users,
      analysis_and_data: Activity,
      technology_and_digitization: Zap,
      execution: TrendingUp,
      governance: Shield,
      innovation: Star,
      culture: Eye
    };
    return icons[pillarKey] || Settings;
  };

  const getScoreColor = (score) => {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#ef4444';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatPillarName = (pillarKey) => {
    return pillarKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPhaseName = (phaseKey) => {
    return phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
 
  const renderStrategicPillarsTable = (data) => {
    const pillars = data?.strategic_pillars_analysis;
    if (!pillars) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none', marginBottom: '0px',
          gap: '8px',
          background: '#fff'
        }}>
          <BarChart3 size={24} style={{ color: 'blue' }} />
          <h2>Strategic Pillars Analysis</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pillar</th>
                <th>Assessment Score</th>
                <th>Relevance Score</th>
                <th>Strengths</th>
                <th>Weaknesses</th>
                <th>Recommendations</th>
                <th>Success Metrics</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pillars).map(([pillarKey, pillar]) => {
                const IconComponent = getPillarIcon(pillarKey);

                return (
                  <tr key={pillarKey}>
                    <td className="table-value">
                      <div className="pillar-name">
                        <IconComponent size={16} />
                        {formatPillarName(pillarKey)}
                      </div>
                    </td>
                    <td className="table-value text-center">
                      <span
                        className="score-badge"
                        style={{ color: getScoreColor(pillar.current_state?.assessment_score || 0) }}
                      >
                        {pillar.current_state?.assessment_score || 0}/10
                      </span>
                    </td>
                    <td className="table-value text-center">
                      <span className="score-badge">{pillar.relevance_score || 0}/10</span>
                    </td>
                    <td className="table-value">
                      {pillar.current_state?.strengths && pillar.current_state.strengths.length > 0 && (
                        <ul className="table-list">
                          {pillar.current_state.strengths.map((strength, idx) => (
                            <li key={idx} className="strength-item">
                              <CheckCircle size={12} />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="table-value">
                      {pillar.current_state?.weaknesses && pillar.current_state.weaknesses.length > 0 && (
                        <ul className="table-list">
                          {pillar.current_state.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="weakness-item">
                              <AlertTriangle size={12} />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="table-value">
                      {pillar.recommendations && pillar.recommendations.length > 0 && (
                        <div className="recommendations-list">
                          {pillar.recommendations.map((rec, idx) => (
                            <div key={idx} className="recommendation-item">
                              <div className="rec-header">
                                <span className="rec-text">{rec.action}</span>
                                <span
                                  className="priority-badge"
                                  style={{ backgroundColor: getPriorityColor(rec.priority) }}
                                >
                                  {rec.priority}
                                </span>
                              </div>

                              <div className="rec-details">
                                {rec.timeline && (
                                  <div className="detail-item">
                                    <Clock size={10} />
                                    {rec.timeline}
                                  </div>
                                )}

                                {rec.expected_impact && (
                                  <div className="detail-item">
                                    <TrendingUp size={10} />
                                    {rec.expected_impact}
                                  </div>
                                )}

                                {rec.resources_required && rec.resources_required.length > 0 && (
                                  <div className="detail-item">
                                    <Users size={10} />
                                    {rec.resources_required.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="table-value">
                      {pillar.success_metrics && pillar.success_metrics.length > 0 && (
                        <div className="metrics-list">
                          {pillar.success_metrics.map((metric, idx) => (
                            <div key={idx} className="metric-item">
                              <div className="metric-name">{metric.metric}</div>
                              <div className="metric-target">Target: {metric.target}</div>
                              <div className="metric-frequency">Frequency: {metric.measurement_frequency}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderCrossPillarSynthesisTable = (data) => {
    const synthesis = data?.cross_pillar_synthesis;
    if (!synthesis) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none', marginBottom: '0px',
          gap: '8px',
          background: '#fff'
        }}>
          <Activity size={24} style={{ color: 'blue' }} />
          <h2>Cross-Pillar Synthesis</h2>
        </div>

        <div className="table-container">
          {synthesis.interconnections && synthesis.interconnections.length > 0 && (
            <>
              <h3 className="table-subtitle">Interconnections</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Connected Pillars</th>
                    <th>Relationship</th>
                    <th>Synergy Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesis.interconnections.map((connection, idx) => (
                    <tr key={idx}>
                      <td className="table-value">
                        <strong>{connection.pillars.join(' ↔ ')}</strong>
                      </td>
                      <td className="table-value">{connection.relationship}</td>
                      <td className="table-value">{connection.synergy_opportunity || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {synthesis.holistic_recommendations && synthesis.holistic_recommendations.length > 0 && (
            <>
              <h3 className="table-subtitle">Holistic Recommendations</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesis.holistic_recommendations.map((rec, idx) => (
                    <tr key={idx}>
                      <td className="table-value">
                        <div className="recommendation-row">
                          <ArrowRight size={14} />
                          {rec}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderAgileFrameworksTable = (data) => {
    const frameworks = data?.agile_frameworks_recommendations;
    if (!frameworks) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none', marginBottom: '0px',
          gap: '8px',
          background: '#fff'
        }}>
          <PlayCircle size={24} style={{ color: 'blue' }} />
          <h2>Agile Frameworks Recommendations</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Framework</th>
                <th>Implementation Priority</th>
                <th>Applicability</th>
                <th>Use Cases</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(frameworks).map(([frameworkKey, framework]) => (
                <tr key={frameworkKey}>
                  <td className="table-value">
                    <strong>{frameworkKey.toUpperCase()}</strong>
                  </td>
                  <td className="table-value text-center">
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(framework.implementation_priority) }}
                    >
                      {framework.implementation_priority}
                    </span>
                  </td>
                  <td className="table-value">{framework.applicability}</td>
                  <td className="table-value">
                    {framework.use_cases && framework.use_cases.length > 0 && (
                      <ul className="table-list">
                        {framework.use_cases.map((useCase, idx) => (
                          <li key={idx}>{useCase}</li>
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

  const renderRiskAssessmentTable = (data) => {
    const riskAssessment = data?.risk_assessment;
    if (!riskAssessment) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none', marginBottom: '0px',
          gap: '8px',
          background: '#fff'
        }}>
          <Shield size={24} style={{ color: 'blue' }} />
          <h2>Risk Assessment</h2>
        </div>

        <div className="table-container">
          {riskAssessment.strategic_risks && riskAssessment.strategic_risks.length > 0 && (
            <>
              <h3 className="table-subtitle">Strategic Risks</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Risk</th>
                    <th>Probability</th>
                    <th>Impact</th>
                    <th>Mitigation</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {riskAssessment.strategic_risks.map((risk, idx) => (
                    <tr key={idx}>
                      <td className="table-value"><strong>{risk.risk}</strong></td>
                      <td className="table-value text-center">
                        <span className={`risk-badge ${risk.probability?.toLowerCase()}`}>
                          {risk.probability}
                        </span>
                      </td>
                      <td className="table-value text-center">
                        <span className={`risk-badge ${risk.impact?.toLowerCase()}`}>
                          {risk.impact}
                        </span>
                      </td>
                      <td className="table-value">{risk.mitigation || 'N/A'}</td>
                      <td className="table-value">
                        {risk.owner && (
                          <div className="owner-info">
                            <Users size={12} />
                            {risk.owner}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {riskAssessment.contingency_plans && riskAssessment.contingency_plans.length > 0 && (
            <>
              <h3 className="table-subtitle">Contingency Plans</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Response</th>
                    <th>Trigger Indicators</th>
                  </tr>
                </thead>
                <tbody>
                  {riskAssessment.contingency_plans.map((plan, idx) => (
                    <tr key={idx}>
                      <td className="table-value"><strong>{plan.scenario}</strong></td>
                      <td className="table-value">{plan.response}</td>
                      <td className="table-value">
                        {plan.trigger_indicators && plan.trigger_indicators.length > 0 && (
                          <ul className="table-list">
                            {plan.trigger_indicators.map((indicator, i) => (
                              <li key={i}>{indicator}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderSuccessBenchmarksTable = (data) => {
    const benchmarks = data?.success_benchmarks;
    if (!benchmarks) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none', marginBottom: '0px',
          gap: '8px',
          background: '#fff'
        }}>
          <Award size={24} style={{ color: 'blue' }} />
          <h2>Success Benchmarks</h2>
        </div>

        <div className="table-container">
          {benchmarks.case_study_parallels && benchmarks.case_study_parallels.length > 0 && (
            <>
              <h3 className="table-subtitle">Case Study Parallels</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Parallel</th>
                    <th>Applicable Lesson</th>
                    <th>Success Metric</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.case_study_parallels.map((study, idx) => (
                    <tr key={idx}>
                      <td className="table-value">
                        <div className="company-name">
                          <Building size={14} />
                          <strong>{study.company}</strong>
                        </div>
                      </td>
                      <td className="table-value">{study.parallel}</td>
                      <td className="table-value">{study.applicable_lesson}</td>
                      <td className="table-value">{study.success_metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {benchmarks.industry_benchmarks && benchmarks.industry_benchmarks.length > 0 && (
            <>
              <h3 className="table-subtitle">Industry Benchmarks</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Industry Average</th>
                    <th>Target</th>
                    <th>Timeframe</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.industry_benchmarks.map((benchmark, idx) => (
                    <tr key={idx}>
                      <td className="table-value"><strong>{benchmark.metric}</strong></td>
                      <td className="table-value">{benchmark.industry_average}</td>
                      <td className="table-value">{benchmark.target}</td>
                      <td className="table-value">{benchmark.timeframe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderImplementationRoadmapTable = (data) => {
    const roadmap = data?.implementation_roadmap;
    if (!roadmap) return null;

    return (
      <section className="strategic-page-section">
        <div className="section-header" style={{
          display: 'inline-flex',
          alignItems: 'center', borderBottom: 'none',
          gap: '8px', marginBottom: '0px',
          background: '#fff'
        }}>
          <Calendar size={24} style={{ color: 'blue' }} />
          <h2>Implementation Roadmap</h2>
        </div>

        <div className="table-container">
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
              {Object.entries(roadmap).map(([phaseKey, phase], index) => (
                <tr key={phaseKey}>
                  <td className="table-value">
                    <div className="phase-name">
                      <div className="phase-number">{index + 1}</div>
                      <strong>{formatPhaseName(phaseKey)}</strong>
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
                        <DollarSign size={12} />
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

  const renderMonitoringAndFeedbackTable = (data) => {
    const monitoring = data?.monitoring_and_feedback;
    if (!monitoring) return null;

    return (
      <section className="strategic-page-section">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff'
          }}
        >
          <Monitor size={24} style={{ color: 'blue', flexShrink: 0 }} />
          <h2 style={{ margin: 0, display: 'inline', whiteSpace: 'nowrap' }}>
            Monitoring & Feedback
          </h2>
        </div>

        <div className="table-container">
          {monitoring.dashboard_requirements && monitoring.dashboard_requirements.length > 0 && (
            <>
              <h3 className="table-subtitle">Dashboard Requirements</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoring.dashboard_requirements.map((requirement, idx) => (
                    <tr key={idx}>
                      <td className="table-value">
                        <div className="requirement-item">
                          <CheckCircle size={12} />
                          {requirement}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {monitoring.review_cycles && (
            <>
              <h3 className="table-subtitle">Review Cycles</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monitoring.review_cycles).map(([cycle, description]) => (
                    <tr key={cycle}>
                      <td className="table-value">
                        <strong>{cycle.charAt(0).toUpperCase() + cycle.slice(1)}</strong>
                      </td>
                      <td className="table-value">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {monitoring.feedback_loops && monitoring.feedback_loops.length > 0 && (
            <>
              <h3 className="table-subtitle">Feedback Loops</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Frequency</th>
                    <th>Integration Point</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoring.feedback_loops.map((loop, idx) => (
                    <tr key={idx}>
                      <td className="table-value">
                        <div className="source-info">
                          <MessageCircle size={12} />
                          {loop.source}
                        </div>
                      </td>
                      <td className="table-value">
                        <div className="frequency-info">
                          <Clock size={12} />
                          {loop.frequency}
                        </div>
                      </td>
                      <td className="table-value">
                        <div className="integration-info">
                          <ArrowRight size={12} />
                          {loop.integration_point}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderStrategicContent = () => {
    // Extract strategic_analysis from the response
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;

    return (
      <div className="strategic-content"> 
        {renderStrategicPillarsTable(analysisData)}
        {renderCrossPillarSynthesisTable(analysisData)}
        {renderAgileFrameworksTable(analysisData)}
        {renderRiskAssessmentTable(analysisData)}
        {renderSuccessBenchmarksTable(analysisData)}
        {renderImplementationRoadmapTable(analysisData)}
        {renderMonitoringAndFeedbackTable(analysisData)}
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