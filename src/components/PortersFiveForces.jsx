import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader, AlertTriangle, Users, DollarSign, TrendingUp, Building, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import MissingQuestionsChecker from './MissingQuestionsChecker';
import AnalysisEmptyState from './AnalysisEmptyState';

const PortersFiveForces = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  portersData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    forces: true,
    competitors: true,
    recommendations: true,
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

  // Function to check missing questions and redirect
  const checkMissingQuestionsAndRedirect = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/questions/missing-for-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analysis_type: 'porters',
            business_id: selectedBusinessId
          })
        }
      );

      if (response.ok) {
        const result = await response.json();

        // If there are missing questions, redirect with highlighting
        if (result.missing_count > 0) {
          handleRedirectToBrief(result);
        } else {
          // No missing questions but data is incomplete - user needs to improve their answers
          // Create a custom result to highlight the porters question(s)
          const portersQuestions = await fetch(
            `${API_BASE_URL}/api/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          ).then(res => res.json()).then(data =>
            data.questions.filter(q => q.used_for && q.used_for.includes('porters'))
          );

          handleRedirectToBrief({
            missing_count: portersQuestions.length,
            missing_questions: portersQuestions.map(q => ({
              _id: q._id,
              order: q.order,
              question_text: q.question_text,
              objective: q.objective,
              required_info: q.required_info,
              used_for: q.used_for
            })),
            analysis_type: 'porters',
            message: `Please provide more detailed answers for Porter's Five Forces analysis. The current answers are insufficient to generate meaningful insights.`,
            is_complete: false,
            keepHighlightLonger: true // Flag to keep highlighting longer
          });
        }
      } else {
        // If API call fails, redirect to review answers
        handleRedirectToBrief({
          missing_count: 0,
          missing_questions: [],
          analysis_type: 'porters',
          message: 'Please review and improve your answers for Porter\'s Five Forces analysis.'
        });
      }
    } catch (error) {
      console.error('Error checking missing questions:', error);
      // If error occurs, redirect to review answers
      handleRedirectToBrief({
        missing_count: 0,
        missing_questions: [],
        analysis_type: 'porters',
        message: 'Please review and improve your answers for Porter\'s Five Forces analysis.'
      });
    }
  };

  // Check if the porters data is empty/incomplete
  const isPortersDataIncomplete = (data) => {
    if (!data) return true;

    // Check if five_forces_analysis is empty or null
    if (!data.five_forces_analysis || Object.keys(data.five_forces_analysis).length === 0) return true;

    // Check if any critical fields are null/undefined
    const criticalFields = ['executive_summary', 'competitive_landscape'];
    const hasNullFields = criticalFields.some(field => data[field] === null || data[field] === undefined);

    return hasNullFields;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setPortersAnalysisData(null);
      setError(null);
    }
  };

  // Update data when prop changes
  useEffect(() => {
    if (portersData && portersData !== portersAnalysisData) {
      setPortersAnalysisData(portersData);
      if (onDataGenerated) {
        onDataGenerated(portersData);
      }
    }
  }, [portersData]);

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (portersData) {
      setPortersAnalysisData(portersData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Parse the Porter's analysis data
  const parsePortersData = (data) => {
    if (!data) return null;

    if (data.portersAnalysis) {
      return data.portersAnalysis;
    }

    if (data.porter_analysis) {
      return data.porter_analysis;
    }

    return data;
  };

  const getIntensityColor = (intensity) => {
    const level = intensity?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low') || level.includes('weak')) return 'low-intensity';
    return 'medium-intensity';
  };

  const getForceIcon = (forceName) => {
    const name = forceName?.toLowerCase() || '';
    if (name.includes('supplier')) return <Building size={16} />;
    if (name.includes('buyer') || name.includes('customer')) return <Users size={16} />;
    if (name.includes('rivalry') || name.includes('competition')) return <TrendingUp size={16} />;
    if (name.includes('substitute')) return <ArrowRight size={16} />;
    if (name.includes('threat') || name.includes('new entrant')) return <AlertTriangle size={16} />;
    return <Shield size={16} />;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating Porter's Five Forces analysis..."
              : "Generating Porter's Five Forces analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="porters-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const parsedData = parsePortersData(portersAnalysisData);

  // Check if data is incomplete and show missing questions checker
  if (!parsedData || isPortersDataIncomplete(parsedData)) {
    return (
      <div className="porters-container">
        <div className="cs-header">
          <div className="cs-title-section">
            <Shield className="main-icon" size={24} />
            <div>
              <h2 className='cs-title'>Porter's Five Forces Analysis</h2>
            </div>
          </div>
        </div>

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="porters"
          analysisDisplayName="Porter's Five Forces Analysis"
          icon={Shield}
          onImproveAnswers={checkMissingQuestionsAndRedirect}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />

        <MissingQuestionsChecker
          analysisType="porters"
          analysisData={parsedData}
          selectedBusinessId={selectedBusinessId}
          onRedirectToBrief={handleRedirectToBrief}
          API_BASE_URL={API_BASE_URL}
          getAuthToken={getAuthToken}
        />
      </div>
    );
  }

  return (
    <div className="porters-container" data-analysis-type="porters"
      data-analysis-name="Porter's Five Forces"
      data-analysis-order="6">
      <div className="cs-header">
        <div className="cs-title-section">
          <Shield className="main-icon" size={24} />
          <div>
            <h2 className='cs-title'>Porter's Five Forces Analysis</h2>
          </div>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Porter's Analysis"
          size="medium"
        />
      </div>

      {/* Executive Summary Table */}
      {parsedData.executive_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('executive')}>
            <h3>Executive Summary</h3>
            {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.executive !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.executive_summary.industry_attractiveness && (
                    <tr>
                      <td><strong>Industry Attractiveness</strong></td>
                      <td>{parsedData.executive_summary.industry_attractiveness}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.industry_attractiveness)}`}>
                          {parsedData.executive_summary.industry_attractiveness}
                        </span>
                      </td>
                    </tr>
                  )}
                  {parsedData.executive_summary.overall_competitive_intensity && (
                    <tr>
                      <td><strong>Competitive Intensity</strong></td>
                      <td>{parsedData.executive_summary.overall_competitive_intensity}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.overall_competitive_intensity)}`}>
                          {parsedData.executive_summary.overall_competitive_intensity}
                        </span>
                      </td>
                    </tr>
                  )}
                  {parsedData.executive_summary.competitive_position && (
                    <tr>
                      <td><strong>Competitive Position</strong></td>
                      <td>{parsedData.executive_summary.competitive_position}</td>
                      <td>-</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {parsedData.executive_summary.key_competitive_forces && (
                <div className="subsection">
                  <h4>Key Competitive Forces</h4>
                  <div className="forces-tags">
                    {parsedData.executive_summary.key_competitive_forces.map((force, index) => (
                      <span key={index} className="force-tag">{force}</span>
                    ))}
                  </div>
                </div>
              )}

              {parsedData.executive_summary.strategic_implications && (
                <div className="subsection">
                  <h4>Strategic Implications</h4>
                  <ul className="implications-list">
                    {parsedData.executive_summary.strategic_implications.map((implication, index) => (
                      <li key={index}>{implication}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Five Forces Analysis Table */}
      {parsedData.five_forces_analysis && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('forces')}>
            <h3>Five Forces Analysis</h3>
            {expandedSections.forces ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.forces !== false && (
            <div className="table-container">
              <table className="data-table forces-table">
                <thead>
                  <tr>
                    <th>Force</th>
                    <th>Intensity</th>
                    <th>Score</th>
                    <th>Strategic Implications</th>
                    <th>Key Factors</th>
                    <th>Additional Details</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parsedData.five_forces_analysis).map(([forceKey, forceData]) => (
                    <tr key={forceKey}>
                      <td>
                        <div className="force-name">
                          {getForceIcon(forceKey)}
                          <span>{forceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      </td>
                      <td>
                        {forceData.intensity && (
                          <span className={`status-badge ${getIntensityColor(forceData.intensity)}`}>
                            {forceData.intensity}
                          </span>
                        )}
                      </td>
                      <td>
                        {forceData.score && <span className="score-badge">{forceData.score}/10</span>}
                      </td>
                      <td className="implications-cell">
                        {forceData.strategic_implications}
                      </td>
                      <td>
                        <div className="factors-cell">
                          {forceData.key_factors?.map((factor, index) => (
                            <div key={index} className="factor-item">
                              <strong>{factor.factor}</strong>
                              {factor.impact && (
                                <span className={`factor-impact ${factor.impact?.toLowerCase()}`}>
                                  Impact: {factor.impact}
                                </span>
                              )}
                              <span className="factor-desc">{factor.description}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="additional-details">
                          {forceData.entry_barriers && (
                            <div>
                              <strong>Entry Barriers:</strong>
                              <ul>
                                {forceData.entry_barriers.map((barrier, idx) => (
                                  <li key={idx}>{barrier}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {forceData.supplier_concentration && (
                            <div><strong>Supplier Concentration:</strong> {forceData.supplier_concentration}</div>
                          )}
                          {forceData.switching_costs && (
                            <div><strong>Switching Costs:</strong> {forceData.switching_costs}</div>
                          )}
                          {forceData.buyer_concentration && (
                            <div><strong>Buyer Concentration:</strong> {forceData.buyer_concentration}</div>
                          )}
                          {forceData.product_differentiation && (
                            <div><strong>Product Differentiation:</strong> {forceData.product_differentiation}</div>
                          )}
                          {forceData.substitute_availability && (
                            <div><strong>Substitute Availability:</strong> {forceData.substitute_availability}</div>
                          )}
                          {forceData.competitor_concentration && (
                            <div><strong>Competitor Concentration:</strong> {forceData.competitor_concentration}</div>
                          )}
                          {forceData.industry_growth && (
                            <div><strong>Industry Growth:</strong> {forceData.industry_growth}</div>
                          )}
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

      {/* Competitive Landscape Table */}
      {parsedData.competitive_landscape && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('competitors')}>
            <h3>Competitive Landscape</h3>
            {expandedSections.competitors ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.competitors !== false && (
            <div className="table-container">
              {/* Direct Competitors */}
              {parsedData.competitive_landscape.direct_competitors && (
                <div className="subsection">
                  <h4>Direct Competitors</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Competitor</th>
                        <th>Market Share</th>
                        <th>Strengths</th>
                        <th>Weaknesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.competitive_landscape.direct_competitors.map((competitor, index) => (
                        <tr key={index}>
                          <td><strong>{competitor.name}</strong></td>
                          <td>{competitor.market_share || 'N/A'}</td>
                          <td>
                            {competitor.strengths && (
                              <ul className="list-items">
                                {competitor.strengths.map((strength, idx) => (
                                  <li key={idx}>{strength}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td>
                            {competitor.weaknesses && (
                              <ul className="list-items">
                                {competitor.weaknesses.map((weakness, idx) => (
                                  <li key={idx}>{weakness}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Indirect Competitors */}
              {parsedData.competitive_landscape.indirect_competitors && (
                <div className="subsection">
                  <h4>Indirect Competitors</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Competitor</th>
                        <th>Threat Level</th>
                        <th>Competitive Advantage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.competitive_landscape.indirect_competitors.map((competitor, index) => (
                        <tr key={index}>
                          <td><strong>{competitor.name}</strong></td>
                          <td>
                            <span className={`status-badge ${getIntensityColor(competitor.threat_level)}`}>
                              {competitor.threat_level}
                            </span>
                          </td>
                          <td>{competitor.competitive_advantage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Potential Entrants */}
              {parsedData.competitive_landscape.potential_entrants && (
                <div className="subsection">
                  <h4>Potential Entrants</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Likelihood</th>
                        <th>Barriers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.competitive_landscape.potential_entrants.map((entrant, index) => (
                        <tr key={index}>
                          <td><strong>{entrant.category}</strong></td>
                          <td>
                            <span className={`status-badge ${getIntensityColor(entrant.likelihood)}`}>
                              {entrant.likelihood}
                            </span>
                          </td>
                          <td>{entrant.barriers}</td>
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

      {/* Strategic Recommendations Table */}
      {parsedData.strategic_recommendations && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('recommendations')}>
            <h3>Strategic Recommendations</h3>
            {expandedSections.recommendations ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.recommendations !== false && (
            <div className="table-container">
              {/* Immediate Actions */}
              {parsedData.strategic_recommendations.immediate_actions && (
                <div className="subsection">
                  <h4>Immediate Actions (Next 3-6 months)</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Rationale</th>
                        <th>Timeline</th>
                        <th>Expected Impact</th>
                        <th>Resources Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.strategic_recommendations.immediate_actions.map((action, index) => (
                        <tr key={index}>
                          <td><strong>{action.action}</strong></td>
                          <td>{action.rationale}</td>
                          <td><span className="timeline-badge">{action.timeline}</span></td>
                          <td>{action.expected_impact || 'N/A'}</td>
                          <td>
                            {action.resources_required ? action.resources_required.join(', ') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Short-term Initiatives */}
              {parsedData.strategic_recommendations.short_term_initiatives && (
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
                      {parsedData.strategic_recommendations.short_term_initiatives.map((initiative, index) => (
                        <tr key={index}>
                          <td><strong>{initiative.initiative}</strong></td>
                          <td>{initiative.strategic_pillar || 'N/A'}</td>
                          <td>{initiative.expected_outcome || 'N/A'}</td>
                          <td>{initiative.risk_mitigation || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Long-term Strategic Shifts */}
              {parsedData.strategic_recommendations.long_term_strategic_shifts && (
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
                      {parsedData.strategic_recommendations.long_term_strategic_shifts.map((shift, index) => (
                        <tr key={index}>
                          <td><strong>{shift.shift}</strong></td>
                          <td>{shift.transformation_required || 'N/A'}</td>
                          <td>{shift.competitive_advantage || 'N/A'}</td>
                          <td>{shift.sustainability || 'N/A'}</td>
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

      {/* Monitoring Dashboard Table */}
      {parsedData.monitoring_dashboard && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('monitoring')}>
            <h3>Monitoring Dashboard</h3>
            {expandedSections.monitoring ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.monitoring !== false && (
            <div className="table-container">
              {/* Key Performance Indicators */}
              {parsedData.monitoring_dashboard.key_indicators && (
                <div className="subsection">
                  <h4>Key Performance Indicators</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Indicator</th>
                        <th>Related Force</th>
                        <th>Measurement Frequency</th>
                        <th>Threshold Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.monitoring_dashboard.key_indicators.map((indicator, index) => (
                        <tr key={index}>
                          <td><strong>{indicator.indicator}</strong></td>
                          <td>{indicator.force}</td>
                          <td><span className="frequency-badge">{indicator.measurement_frequency}</span></td>
                          <td>
                            {indicator.threshold_values && (
                              <div className="thresholds">
                                <div className="threshold green">✓ {indicator.threshold_values.green}</div>
                                <div className="threshold yellow">⚠ {indicator.threshold_values.yellow}</div>
                                <div className="threshold red">✗ {indicator.threshold_values.red}</div>
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
              {parsedData.monitoring_dashboard.early_warning_signals && (
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
                      {parsedData.monitoring_dashboard.early_warning_signals.map((signal, index) => (
                        <tr key={index}>
                          <td><strong>{signal.signal}</strong></td>
                          <td>{signal.trigger_response}</td>
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

export default PortersFiveForces;