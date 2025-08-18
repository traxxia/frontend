import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Target, AlertTriangle, Activity, Clock, RefreshCw, Loader } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const PestelAnalysis = ({
  pestelData,
  businessName = "Your Business",
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  questions = [],
  userAnswers = {},
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    factors: true,
    actions: true,
    monitoring: true
  });

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.pestel; 
    
    await checkMissingQuestionsAndRedirect(
      'pestel', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the pestel data is empty/incomplete
  const isPestelDataIncomplete = (data) => {
    if (!data) return true;

    // Handle nested structure
    const analysis = data.pestel_analysis || data;

    // Check if factor_summary is empty or null
    if (!analysis.factor_summary || Object.keys(analysis.factor_summary).length === 0) return true;

    // Check if any critical fields are null/undefined
    const criticalFields = ['executive_summary', 'strategic_recommendations'];
    const hasNullFields = criticalFields.some(field => analysis[field] === null || analysis[field] === undefined);

    return hasNullFields;
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle loading state
  if (isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating PESTEL Analysis...</span>
        </div>
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!pestelData || Array.isArray(pestelData) || isPestelDataIncomplete(pestelData)) {
    return (
      <div className="porters-container"> 

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="pestel"
          analysisDisplayName="PESTEL Analysis"
          icon={BarChart3}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        /> 
      </div>
    );
  }

  // Handle nested structure - check if data is wrapped in pestel_analysis
  const analysis = pestelData.pestel_analysis || pestelData;

  return (
    <div className="porters-container pestel-container" data-analysis-type="pestel"
      data-analysis-name="PESTEL Analysis"
      data-analysis-order="7">
       
      {/* Executive Summary Section */}
      {analysis.executive_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('executive')}>
            <h3>Executive Summary</h3>
            {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.executive && (
            <div className="table-container">
              {analysis.executive_summary?.agility_priority_score && (
                <div className="subsection">
                  <h4>Agility Priority Score: {analysis.executive_summary.agility_priority_score}/10</h4>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.executive_summary.key_opportunities && (
                    <tr>
                      <td><strong>Key Opportunities</strong></td>
                      <td>
                        <ul className="list-items">
                          {analysis.executive_summary.key_opportunities.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}

                  {analysis.executive_summary.critical_risks && (
                    <tr>
                      <td><strong>Critical Risks</strong></td>
                      <td>
                        <ul className="list-items">
                          {analysis.executive_summary.critical_risks.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}

                  {analysis.executive_summary.dominant_factors && (
                    <tr>
                      <td><strong>Dominant Factors</strong></td>
                      <td>
                        <div className="forces-tags">
                          {analysis.executive_summary.dominant_factors.map((factor, index) => (
                            <span key={index} className="force-tag">{factor}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}

                  {analysis.executive_summary.strategic_recommendations && (
                    <tr>
                      <td><strong>Strategic Recommendations</strong></td>
                      <td>
                        <ul className="implications-list">
                          {analysis.executive_summary.strategic_recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PESTEL Factors Section */}
      {analysis.factor_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('factors')}>
            <h3>PESTEL Factors Analysis</h3>
            {expandedSections.factors ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.factors && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Strategic Priority</th>
                    <th>Total Mentions</th>
                    <th>High Impact Count</th>
                    <th>Key Themes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.factor_summary).map(([factor, data]) => (
                    <tr key={factor}>
                      <td>
                        <div className="force-name">
                          <BarChart3 size={16} />
                          <span>{factor.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${data?.strategic_priority?.toLowerCase() || 'medium-intensity'}`}>
                          {data?.strategic_priority || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="score-badge">{data?.total_mentions || 0}</span>
                      </td>
                      <td>
                        <span className="score-badge">{data?.high_impact_count || 0}</span>
                      </td>
                      <td>
                        <div className="forces-tags">
                          {(data?.key_themes || []).map((theme, index) => (
                            <span key={index} className="force-tag">{theme}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Strategic Actions Section */}
      {analysis.strategic_recommendations && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('actions')}>
            <h3>Strategic Actions</h3>
            {expandedSections.actions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.actions && (
            <div className="table-container">
              {/* Immediate Actions */}
              {analysis.strategic_recommendations.immediate_actions && (
                <div className="subsection">
                  <h4>Immediate Actions</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Timeline</th>
                        <th>Rationale</th>
                        <th>Resources Required</th>
                        <th>Success Metrics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.strategic_recommendations.immediate_actions.map((action, index) => (
                        <tr key={index}>
                          <td><strong>{action.action}</strong></td>
                          <td><span className="timeline-badge">{action.timeline}</span></td>
                          <td className="implications-cell">{action.rationale}</td>
                          <td>{action.resources_required}</td>
                          <td>
                            <div className="forces-tags">
                              {(action.success_metrics || []).map((metric, i) => (
                                <span key={i} className="force-tag">{metric}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Short-term Initiatives */}
              {analysis.strategic_recommendations.short_term_initiatives && (
                <div className="subsection">
                  <h4>Short-term Initiatives</h4>
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
                      {analysis.strategic_recommendations.short_term_initiatives.map((initiative, index) => (
                        <tr key={index}>
                          <td><strong>{initiative.initiative}</strong></td>
                          <td>{initiative.strategic_pillar}</td>
                          <td className="implications-cell">{initiative.expected_outcome}</td>
                          <td className="implications-cell">{initiative.risk_mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Long-term Strategic Shifts */}
              {analysis.strategic_recommendations.long_term_strategic_shifts && (
                <div className="subsection">
                  <h4>Long-term Strategic Shifts</h4>
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
                      {analysis.strategic_recommendations.long_term_strategic_shifts.map((shift, index) => (
                        <tr key={index}>
                          <td><strong>{shift.shift}</strong></td>
                          <td className="implications-cell">{shift.transformation_required}</td>
                          <td className="implications-cell">{shift.competitive_advantage}</td>
                          <td className="implications-cell">{shift.sustainability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monitoring Dashboard Section */}
      {analysis.monitoring_dashboard && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('monitoring')}>
            <h3>Monitoring Dashboard</h3>
            {expandedSections.monitoring ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.monitoring && (
            <div className="table-container">
              {/* Key Indicators */}
              {analysis.monitoring_dashboard.key_indicators && (
                <div className="subsection">
                  <h4>Key Performance Indicators</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Indicator</th>
                        <th>PESTEL Factor</th>
                        <th>Measurement Frequency</th>
                        <th>Threshold Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.monitoring_dashboard.key_indicators.map((indicator, index) => (
                        <tr key={index}>
                          <td><strong>{indicator.indicator}</strong></td>
                          <td>{indicator.pestel_factor}</td>
                          <td><span className="frequency-badge">{indicator.measurement_frequency}</span></td>
                          <td>
                            {indicator.threshold_values && (
                              <div className="thresholds">
                                {Object.entries(indicator.threshold_values).map(([level, value]) => (
                                  <div key={level} className={`threshold ${level}`}>
                                    {level === 'green' && '✓'}
                                    {level === 'yellow' && '⚠'}
                                    {level === 'red' && '✗'}
                                    {value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Early Warning Signals */}
              {analysis.monitoring_dashboard.early_warning_signals && (
                <div className="subsection">
                  <h4>Early Warning Signals</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Signal</th>
                        <th>Trigger Response</th>
                        <th>Monitoring Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.monitoring_dashboard.early_warning_signals.map((signal, index) => (
                        <tr key={index}>
                          <td><strong>{signal.signal}</strong></td>
                          <td className="implications-cell">{signal.trigger_response}</td>
                          <td>{signal.monitoring_source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PestelAnalysis;