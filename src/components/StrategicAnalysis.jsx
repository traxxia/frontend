import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Award,
  Info
} from 'lucide-react';

const StrategicAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  strategicData = null, 
}) => {
  const [localStrategicData, setLocalStrategicData] = useState(strategicData);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';

  const generateStrategicAnalysis = async () => {
    try {
      setIsLoading(true);
      
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
        const errorText = await response.text();
        throw new Error(`Strategic Analysis API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setLocalStrategicData(result);
      return result;

    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      if (onRegenerate) {
        onRegenerate();
      } else {
        setLocalStrategicData(null);
        await generateStrategicAnalysis();
      }
    } catch (error) {
      // Handle error
    }
  };

  useEffect(() => {
    if (strategicData) {
      setLocalStrategicData(strategicData);
    } else if (!localStrategicData && !isLoading && Object.keys(userAnswers).length >= 3) {
      generateStrategicAnalysis();
    }
  }, [strategicData, userAnswers, localStrategicData, isLoading]);

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
      case 'high': return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
      case 'medium': return 'linear-gradient(135deg, #ffd93d 0%, #ff9500 100%)';
      case 'low': return 'linear-gradient(135deg, #6bcf7f 0%, #4dabf7 100%)';
      default: return '#6b7280';
    }
  };

  const getRiskLevelColor = (probability, impact) => {
    if (probability === 'High' && impact === 'High') return '#dc2626';
    if (probability === 'High' || impact === 'High') return '#ea580c';
    if (probability === 'Medium' && impact === 'Medium') return '#d97706';
    return '#059669';
  };

  const getUrgencyColorClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffd93d';
      case 'low': return '#6bcf7f';
      default: return '#6b7280';
    }
  };

  const formatPillarName = (pillarKey) => {
    return pillarKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPhaseName = (phaseKey) => {
    return phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderExecutiveSummary = () => {
    const summary = localStrategicData?.executive_summary;
    if (!summary) return null;

    return (
      <div className="executive-summary">
        <div className="summary-header">
          <div className="summary-icon">
            <Target size={24} />
          </div>
          <h2 className="summary-title">Executive Summary</h2>
        </div>
        
        <div className="summary-grid">
          <div className="summary-overview">
            <h3 className="overview-title">Situation Overview</h3>
            <p className="overview-text">{summary.situation_overview}</p>
          </div>
          
          <div className="summary-metrics">
            <div className="metric-card">
              <div className="metric-label">Urgency Level</div>
              <div 
                className="metric-value"
                style={{ color: getUrgencyColorClass(summary.urgency_level) }}
              >
                {summary.urgency_level}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Strategic Maturity</div>
              <div className="metric-value">{summary.strategic_maturity_assessment}</div>
            </div>
          </div>
        </div>

        {summary.key_strategic_themes && summary.key_strategic_themes.length > 0 && (
          <div className="themes-section">
            <h4 className="themes-title">Strategic Themes</h4>
            <div className="themes-grid">
              {summary.key_strategic_themes.map((theme, index) => (
                <div key={index} className="theme-tag">
                  {theme}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.primary_vuca_factors && summary.primary_vuca_factors.length > 0 && (
          <div className="vuca-section">
            <h4 className="vuca-title">VUCA Factors</h4>
            <div className="vuca-grid">
              {summary.primary_vuca_factors.map((factor, index) => (
                <div key={index} className="vuca-item">
                  <AlertTriangle size={16} />
                  {factor}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategicPillars = () => {
    const pillars = localStrategicData?.strategic_pillars_analysis;
    if (!pillars) return null;

    return (
      <section className="pillars-section">
        <div className="section-header">
          <div className="section-icon">
            <BarChart3 size={24} />
          </div>
          <h2 className="section-title">Strategic Pillars Analysis</h2>
        </div>
        
        <div className="pillars-grid">
          {Object.entries(pillars).map(([pillarKey, pillar]) => {
            const IconComponent = getPillarIcon(pillarKey);
            const score = pillar.current_state?.assessment_score || 0;
            const isSelected = selectedPillar === pillarKey;
            
            return (
              <div 
                key={pillarKey}
                className={`pillar-card ${isSelected ? 'expanded' : ''}`}
                onClick={() => setSelectedPillar(isSelected ? null : pillarKey)}
              >
                <div className="pillar-header">
                  <div className="pillar-info">
                    <div className="pillar-icon">
                      <IconComponent size={24} />
                    </div>
                    <div>
                      <h3 className="pillar-title">{formatPillarName(pillarKey)}</h3>
                      <div className="pillar-scores">
                        <span 
                          className="score"
                          style={{ color: getScoreColor(score) }}
                        >
                          Score: {score}/10
                        </span>
                        <span className="relevance">
                          Relevance: {pillar.relevance_score || 0}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`expand-icon ${isSelected ? 'expanded' : ''}`}
                    size={20}
                  />
                </div>

                {isSelected && (
                  <div className="pillar-details">
                    {pillar.current_state?.strengths && pillar.current_state.strengths.length > 0 && (
                      <div className="pillar-section">
                        <h4 className="pillar-section-title strengths-title">✓ Strengths</h4>
                        <ul className="pillar-list">
                          {pillar.current_state.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pillar.current_state?.weaknesses && pillar.current_state.weaknesses.length > 0 && (
                      <div className="pillar-section">
                        <h4 className="pillar-section-title weaknesses-title">⚠ Weaknesses</h4>
                        <ul className="pillar-list">
                          {pillar.current_state.weaknesses.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pillar.recommendations && pillar.recommendations.length > 0 && (
                      <div className="pillar-section">
                        <h4 className="pillar-section-title recommendations-title">🎯 Recommendations</h4>
                        {pillar.recommendations.map((rec, idx) => (
                          <div key={idx} className="recommendation-card">
                            <div className="rec-header">
                              <div className="rec-title">{rec.action}</div>
                              <div 
                                className="priority-badge"
                                style={{ background: getPriorityColor(rec.priority) }}
                              >
                                {rec.priority}
                              </div>
                            </div>
                            <div className="rec-meta">
                              {rec.timeline && (
                                <div className="rec-meta-item">
                                  <Clock size={14} />
                                  <span>{rec.timeline}</span>
                                </div>
                              )}
                              {rec.expected_impact && (
                                <div className="rec-meta-item">
                                  <TrendingUp size={14} />
                                  <span>{rec.expected_impact}</span>
                                </div>
                              )}
                            </div>
                            {rec.resources_required && rec.resources_required.length > 0 && (
                              <div className="rec-resources">
                                <strong>Resources:</strong> {rec.resources_required.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {pillar.success_metrics && pillar.success_metrics.length > 0 && (
                      <div className="pillar-section">
                        <h4 className="pillar-section-title">📊 Success Metrics</h4>
                        {pillar.success_metrics.map((metric, idx) => (
                          <div key={idx} className="metric-item">
                            <div className="metric-name">{metric.metric}</div>
                            <div className="metric-target">{metric.target}</div>
                            <div className="metric-frequency">{metric.measurement_frequency}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderRiskAssessment = () => {
    const risks = localStrategicData?.risk_assessment?.strategic_risks;
    if (!risks || risks.length === 0) return null;

    return (
      <section className="pillars-section">
        <div className="section-header">
          <div className="section-icon">
            <Shield size={24} />
          </div>
          <h2 className="section-title">Risk Assessment</h2>
        </div>
        
        <div className="risk-grid">
          {risks.map((risk, index) => (
            <div 
              key={index} 
              className="risk-card"
              style={{ borderLeftColor: getRiskLevelColor(risk.probability, risk.impact) }}
            >
              <div className="risk-header">
                <h3 className="risk-title">{risk.risk}</h3>
                <div className="risk-badges">
                  <div className="risk-badge">{risk.probability} Probability</div>
                  <div className="risk-badge">{risk.impact} Impact</div>
                </div>
              </div>
              
              {risk.mitigation && (
                <div className="risk-mitigation">
                  <h4 className="risk-mitigation-title">Mitigation Strategy</h4>
                  <p>{risk.mitigation}</p>
                </div>
              )}
              
              {risk.owner && (
                <div className="risk-owner">
                  <Users size={16} />
                  <span>Owner: {risk.owner}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderImplementationRoadmap = () => {
    const roadmap = localStrategicData?.implementation_roadmap;
    if (!roadmap) return null;

    const phases = Object.entries(roadmap);

    return (
      <section className="pillars-section">
        <div className="section-header">
          <div className="section-icon">
            <Calendar size={24} />
          </div>
          <h2 className="section-title">Implementation Roadmap</h2>
        </div>
        
        <div className="roadmap-timeline">
          {phases.map(([phaseKey, phase], index) => {
            const isSelected = selectedPhase === phaseKey;
            
            return (
              <div 
                key={phaseKey} 
                className={`phase-card ${isSelected ? 'expanded' : ''}`}
                onClick={() => setSelectedPhase(isSelected ? null : phaseKey)}
              >
                <div className="phase-header">
                  <div className="phase-info">
                    <div className="phase-number">{index + 1}</div>
                    <div>
                      <h3 className="phase-title">{formatPhaseName(phaseKey)}</h3>
                      <div className="phase-meta">
                        {phase.duration && (
                          <span className="phase-meta-item">
                            <Clock size={14} />
                            {phase.duration}
                          </span>
                        )}
                        {phase.budget && (
                          <span className="phase-meta-item">
                            <DollarSign size={14} />
                            {phase.budget}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`expand-icon ${isSelected ? 'expanded' : ''}`}
                    size={20}
                  />
                </div>

                {phase.focus && (
                  <div className="phase-focus">{phase.focus}</div>
                )}

                {isSelected && (
                  <div className="phase-details">
                    {phase.key_initiatives && phase.key_initiatives.length > 0 && (
                      <div className="phase-section">
                        <h4 className="phase-section-title">🚀 Key Initiatives</h4>
                        <ul className="phase-list">
                          {phase.key_initiatives.map((initiative, idx) => (
                            <li key={idx} className="phase-list-item">
                              <ArrowRight size={14} />
                              {initiative}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {phase.success_criteria && phase.success_criteria.length > 0 && (
                      <div className="phase-section">
                        <h4 className="phase-section-title">✅ Success Criteria</h4>
                        <ul className="phase-list">
                          {phase.success_criteria.map((criteria, idx) => (
                            <li key={idx} className="phase-list-item">
                              <CheckCircle size={14} />
                              {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderAdditionalSections = () => {
    const data = localStrategicData;
    if (!data) return null;

    return (
      <>
        {data.cross_pillar_synthesis && (
          <section className="pillars-section">
            <div className="section-header">
              <div className="section-icon">
                <Activity size={24} />
              </div>
              <h2 className="section-title">Cross-Pillar Synthesis</h2>
            </div>
            
            {data.cross_pillar_synthesis.interconnections && data.cross_pillar_synthesis.interconnections.length > 0 && (
              <div className="subsection">
                <h3 className="subsection-title">Interconnections</h3>
                {data.cross_pillar_synthesis.interconnections.map((connection, idx) => (
                  <div key={idx} className="interconnection-card">
                    <div className="interconnection-pillars">
                      {connection.pillars.join(' ↔ ')}
                    </div>
                    <div className="interconnection-relationship">
                      {connection.relationship}
                    </div>
                    {connection.synergy_opportunity && (
                      <div className="interconnection-synergy">
                        <strong>Synergy:</strong> {connection.synergy_opportunity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {data.cross_pillar_synthesis.holistic_recommendations && data.cross_pillar_synthesis.holistic_recommendations.length > 0 && (
              <div className="subsection">
                <h3 className="subsection-title">Holistic Recommendations</h3>
                <ul className="holistic-list">
                  {data.cross_pillar_synthesis.holistic_recommendations.map((rec, idx) => (
                    <li key={idx} className="holistic-item">
                      <ArrowRight size={16} />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {data.success_benchmarks && (
          <section className="pillars-section">
            <div className="section-header">
              <div className="section-icon">
                <Award size={24} />
              </div>
              <h2 className="section-title">Success Benchmarks</h2>
            </div>
            
            {data.success_benchmarks.case_study_parallels && data.success_benchmarks.case_study_parallels.length > 0 && (
              <div className="subsection">
                <h3 className="subsection-title">Case Study Parallels</h3>
                <div className="case-studies-grid">
                  {data.success_benchmarks.case_study_parallels.map((study, idx) => (
                    <div key={idx} className="case-study-card">
                      <h4 className="case-study-title">{study.company}</h4>
                      <p className="case-study-detail"><strong>Parallel:</strong> {study.parallel}</p>
                      <p className="case-study-detail"><strong>Lesson:</strong> {study.applicable_lesson}</p>
                      <p className="case-study-detail"><strong>Metric:</strong> {study.success_metric}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.success_benchmarks.industry_benchmarks && data.success_benchmarks.industry_benchmarks.length > 0 && (
              <div className="subsection">
                <h3 className="subsection-title">Industry Benchmarks</h3>
                <div className="benchmarks-grid">
                  {data.success_benchmarks.industry_benchmarks.map((benchmark, idx) => (
                    <div key={idx} className="benchmark-card">
                      <div className="benchmark-metric">{benchmark.metric}</div>
                      <div className="benchmark-values">
                        <span className="benchmark-industry">Industry: {benchmark.industry_average}</span>
                        <span className="benchmark-target">Target: {benchmark.target}</span>
                      </div>
                      <div className="benchmark-timeframe">{benchmark.timeframe}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (isRegenerating || isLoading) {
      return (
        <div className="loading-state">
          <Loader className="loading-spinner" size={40} />
          <h3 className="loading-title">Generating Strategic Analysis</h3>
          <p className="loading-text">Building comprehensive strategic insights...</p>
        </div>
      );
    }

    if (!localStrategicData) {
      return (
        <div className="empty-state">
          <Target className="empty-icon" size={48} />
          <h3 className="empty-title">Strategic Analysis Pending</h3>
          <p className="empty-text">Complete the initial phase questions to unlock your comprehensive strategic analysis.</p>
        </div>
      );
    }

    return (
      <>
        {renderExecutiveSummary()}
        {renderStrategicPillars()}
        {renderRiskAssessment()}
        {renderImplementationRoadmap()}
        {renderAdditionalSections()}
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1a202c;
          line-height: 1.6;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2.5rem;
          border-radius: 20px;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          color: white;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          font-weight: 400;
        }

        .regenerate-btn {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .regenerate-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .regenerate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .executive-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          color: white;
          box-shadow: 0 20px 25px -5px rgba(102, 126, 234, 0.4);
        }

        .summary-header {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          backdrop-filter: blur(10px);
        }

        .summary-title {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          position: relative;
          z-index: 2;
        }

        .summary-overview {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .overview-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .overview-text {
          line-height: 1.7;
          opacity: 0.9;
        }

        .summary-metrics {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.2);
        }

        .metric-label {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .themes-section,
        .vuca-section {
          margin-top: 2rem;
          position: relative;
          z-index: 2;
        }

        .themes-title,
        .vuca-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .themes-grid,
        .vuca-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .theme-tag {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .vuca-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 107, 107, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .pillars-section {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f7fafc;
        }

        .section-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          color: white;
        }

        .section-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #2d3748;
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .pillar-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .pillar-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .pillar-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border-color: #667eea;
        }

        .pillar-card:hover::before {
          transform: translateX(0);
        }

        .pillar-card.expanded {
          border-color: #667eea;
          box-shadow: 0 25px 50px -12px rgba(102, 126, 234, 0.25);
        }

        .pillar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .pillar-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pillar-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .pillar-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .pillar-scores {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
        }

        .score {
          font-weight: 600;
        }

        .relevance {
          color: #718096;
        }

        .expand-icon {
          transition: transform 0.3s ease;
          color: #667eea;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .pillar-details {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pillar-section {
          margin-bottom: 1.5rem;
        }

        .pillar-section-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .strengths-title { color: #48bb78; }
        .weaknesses-title { color: #f56565; }
        .recommendations-title { color: #667eea; }

        .pillar-list {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }

        .pillar-list li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: #4a5568;
          line-height: 1.6;
        }

        .pillar-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }

        .recommendation-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.8rem;
          border-left: 4px solid #667eea;
          transition: all 0.3s ease;
        }

        .recommendation-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.8rem;
          gap: 1rem;
        }

        .rec-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
          line-height: 1.4;
          flex: 1;
        }

        .priority-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
        }

        .rec-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #718096;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .rec-meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .rec-resources {
          font-size: 0.8rem;
          color: #4a5568;
        }

        .metric-item {
          background: #f0f9ff;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border: 1px solid #bae6fd;
        }

        .metric-name {
          font-weight: 600;
          color: #0369a1;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .metric-target {
          color: #0284c7;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .metric-frequency {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .risk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .risk-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          border-left: 4px solid #f56565;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .risk-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .risk-header {
          margin-bottom: 1rem;
        }

        .risk-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.8rem;
          line-height: 1.4;
        }

        .risk-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .risk-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
        }

        .risk-mitigation {
          background: #f7fafc;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .risk-mitigation-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .risk-mitigation p {
          margin: 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .risk-owner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #718096;
        }

        .roadmap-timeline {
          position: relative;
          padding-left: 2rem;
        }

        .roadmap-timeline::before {
          content: '';
          position: absolute;
          left: 1rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #667eea, #764ba2);
        }

        .phase-card {
          position: relative;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          margin-left: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .phase-card::before {
          content: '';
          position: absolute;
          left: -2.5rem;
          top: 2rem;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 0 0 2px #667eea;
        }

        .phase-card:hover {
          transform: translateX(8px);
          border-color: #667eea;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .phase-card.expanded {
          border-color: #667eea;
          box-shadow: 0 20px 25px -5px rgba(102, 126, 234, 0.25);
        }

        .phase-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .phase-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .phase-number {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .phase-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .phase-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #718096;
          flex-wrap: wrap;
        }

        .phase-meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .phase-focus {
          margin-top: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 8px;
          font-style: italic;
          color: #4a5568;
          line-height: 1.5;
        }

        .phase-details {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
          animation: slideDown 0.3s ease;
        }

        .phase-section {
          margin-bottom: 1.5rem;
        }

        .phase-section-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.8rem;
          color: #2d3748;
        }

        .phase-list {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }

        .phase-list-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .phase-list-item svg {
          color: #667eea;
          margin-top: 0.1rem;
          flex-shrink: 0;
        }

        .subsection {
          margin-bottom: 2rem;
        }

        .subsection-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .interconnection-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .interconnection-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .interconnection-pillars {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .interconnection-relationship {
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .interconnection-synergy {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .holistic-list {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }

        .holistic-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #374151;
          line-height: 1.6;
        }

        .holistic-item svg {
          color: #667eea;
          margin-top: 0.1rem;
          flex-shrink: 0;
        }

        .case-studies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .case-study-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #bae6fd;
          transition: all 0.3s ease;
        }

        .case-study-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .case-study-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 1rem;
        }

        .case-study-detail {
          font-size: 0.9rem;
          color: #374151;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .benchmarks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .benchmark-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #bbf7d0;
          transition: all 0.3s ease;
        }

        .benchmark-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .benchmark-metric {
          font-weight: 600;
          color: #166534;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .benchmark-values {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .benchmark-industry {
          font-size: 0.9rem;
          color: #374151;
        }

        .benchmark-target {
          font-size: 0.9rem;
          color: #166534;
          font-weight: 500;
        }

        .benchmark-timeframe {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          color: #667eea;
          margin-bottom: 1.5rem;
        }

        .loading-title,
        .empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
        }

        .loading-text,
        .empty-text {
          color: #718096;
          font-size: 1rem;
          max-width: 400px;
          line-height: 1.5;
        }

        .empty-icon {
          color: #cbd5e0;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          
          .pillars-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
          
          .risk-grid {
            grid-template-columns: 1fr;
          }
          
          .case-studies-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-header {
            padding: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .header-title {
            font-size: 2rem;
          }

          .pillars-section {
            padding: 1.5rem;
          }

          .pillars-grid {
            grid-template-columns: 1fr;
          }

          .rec-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .phase-card {
            padding: 1.5rem;
            margin-left: 0.5rem;
          }

          .roadmap-timeline {
            padding-left: 1.5rem;
          }

          .roadmap-timeline::before {
            left: 0.75rem;
          }

          .phase-card::before {
            left: -2rem;
          }

          .phase-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .phase-meta {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>

      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Strategic Analysis Dashboard</h1>
            <p className="header-subtitle">
              Comprehensive strategic insights for {businessName || 'your business'}
            </p>
          </div>
          {canRegenerate && (
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating || isLoading}
              className="regenerate-btn"
            >
              {isRegenerating || isLoading ? (
                <>
                  <Loader size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Regenerate Analysis
                </>
              )}
            </button>
          )}
        </div>
      </header>
      
      {renderContent()}
    </div>
  );
};

export default StrategicAnalysis;