import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader, AlertTriangle, Users, DollarSign, TrendingUp, Building, ArrowRight } from 'lucide-react';
import RegenerateButton from './RegenerateButton'; 
import { useTranslation } from "../hooks/useTranslation";

const PortersFiveForces = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  portersData = null
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

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

    // Handle the actual API response structure
    if (data.portersAnalysis) {
      return data.portersAnalysis;
    }
    
    if (data.porter_analysis) {
      return data.porter_analysis;
    }

    // If it's the raw data structure, return as is
    return data;
  };

  // Transform the five forces data for rendering
  const transformForcesData = (portersAnalysis) => {
    if (!portersAnalysis || !portersAnalysis.five_forces_analysis) return [];

    const forcesMap = portersAnalysis.five_forces_analysis;
    const forces = [];

    // Transform each force into a standardized format
    if (forcesMap.threat_of_new_entrants) {
      forces.push({
        force: "Threat of New Entrants",
        intensity: forcesMap.threat_of_new_entrants.intensity,
        score: forcesMap.threat_of_new_entrants.score,
        description: forcesMap.threat_of_new_entrants.strategic_implications,
        factors: forcesMap.threat_of_new_entrants.key_factors?.map(f => f.description) || [],
        impact: `Score: ${forcesMap.threat_of_new_entrants.score}/10`,
        keyFactors: forcesMap.threat_of_new_entrants.key_factors || []
      });
    }

    if (forcesMap.bargaining_power_of_suppliers) {
      forces.push({
        force: "Bargaining Power of Suppliers",
        intensity: forcesMap.bargaining_power_of_suppliers.intensity,
        score: forcesMap.bargaining_power_of_suppliers.score,
        description: forcesMap.bargaining_power_of_suppliers.strategic_implications,
        factors: forcesMap.bargaining_power_of_suppliers.key_factors?.map(f => f.description) || [],
        impact: `Score: ${forcesMap.bargaining_power_of_suppliers.score}/10`,
        keyFactors: forcesMap.bargaining_power_of_suppliers.key_factors || []
      });
    }

    if (forcesMap.bargaining_power_of_buyers) {
      forces.push({
        force: "Bargaining Power of Buyers",
        intensity: forcesMap.bargaining_power_of_buyers.intensity,
        score: forcesMap.bargaining_power_of_buyers.score,
        description: forcesMap.bargaining_power_of_buyers.strategic_implications,
        factors: forcesMap.bargaining_power_of_buyers.key_factors?.map(f => f.description) || [],
        impact: `Score: ${forcesMap.bargaining_power_of_buyers.score}/10`,
        keyFactors: forcesMap.bargaining_power_of_buyers.key_factors || []
      });
    }

    if (forcesMap.threat_of_substitute_products) {
      forces.push({
        force: "Threat of Substitute Products",
        intensity: forcesMap.threat_of_substitute_products.intensity,
        score: forcesMap.threat_of_substitute_products.score,
        description: forcesMap.threat_of_substitute_products.strategic_implications,
        factors: forcesMap.threat_of_substitute_products.key_factors?.map(f => f.description) || [],
        impact: `Score: ${forcesMap.threat_of_substitute_products.score}/10`,
        keyFactors: forcesMap.threat_of_substitute_products.key_factors || []
      });
    }

    if (forcesMap.competitive_rivalry) {
      forces.push({
        force: "Competitive Rivalry",
        intensity: forcesMap.competitive_rivalry.intensity,
        score: forcesMap.competitive_rivalry.score,
        description: forcesMap.competitive_rivalry.strategic_implications,
        factors: forcesMap.competitive_rivalry.key_factors?.map(f => f.description) || [],
        impact: `Score: ${forcesMap.competitive_rivalry.score}/10`,
        keyFactors: forcesMap.competitive_rivalry.key_factors || []
      });
    }

    return forces;
  };

  const getForceIcon = (forceName) => {
    const name = forceName?.toLowerCase() || '';
    if (name.includes('supplier')) return <Building size={20} />;
    if (name.includes('buyer') || name.includes('customer')) return <Users size={20} />;
    if (name.includes('rivalry') || name.includes('competition')) return <TrendingUp size={20} />;
    if (name.includes('substitute')) return <ArrowRight size={20} />;
    if (name.includes('threat') || name.includes('new entrant')) return <AlertTriangle size={20} />;
    return <Shield size={20} />;
  };

  const getIntensityColor = (intensity) => {
    const level = intensity?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'intensity-high';
    if (level.includes('medium') || level.includes('moderate')) return 'intensity-medium';
    if (level.includes('low') || level.includes('weak')) return 'intensity-low';
    return 'intensity-medium';
  };

  const renderForceCard = (force, index) => {
    return (
      <div key={index} className={`force-card ${getIntensityColor(force.intensity)}`}>
        <div className="force-header">
          <div className="force-icon">
            {getForceIcon(force.force)}
          </div>
          <div className="force-title">
            <h4>{force.force}</h4>
            <div className="force-badges">
              <span className={`intensity-badge ${getIntensityColor(force.intensity)}`}>
                {force.intensity}
              </span>
              {force.score && (
                <span className="score-badge">
                  {force.score}/10
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="force-content">
          <p className="force-description">{force.description}</p>
          
          {force.keyFactors && force.keyFactors.length > 0 && (
            <div className="force-factors">
              <h5>Key Factors:</h5>
              <div className="factors-list">
                {force.keyFactors.map((factor, factorIndex) => (
                  <div key={factorIndex} className="factor-item">
                    <div className="factor-header">
                      <span className="factor-name">{factor.factor}</span>
                      <span className={`factor-impact ${factor.impact?.toLowerCase()}`}>
                        {factor.impact} Impact
                      </span>
                    </div>
                    <p className="factor-description">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {force.factors && force.factors.length > 0 && !force.keyFactors && (
            <div className="force-factors">
              <h5>Key Factors:</h5>
              <ul>
                {force.factors.map((factor, factorIndex) => (
                  <li key={factorIndex}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {force.impact && (
            <div className="force-impact">
              <h5>Strategic Impact:</h5>
              <p>{force.impact}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="porters-five-forces">
        <div className="pff-header">
          <div className="pff-title-section">
            <Shield className="pff-icon" size={24} />
            <h2 className="pff-title">Porter's Five Forces Analysis</h2>
          </div>
        </div>
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
      <div className="porters-five-forces">
        <div className="pff-header">
          <div className="pff-title-section">
            <Shield className="pff-icon" size={24} />
            <h2 className="pff-title">Porter's Five Forces Analysis</h2>
          </div>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            setError(null);
            if (onRegenerate) {
              onRegenerate();
            }
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const parsedData = parsePortersData(portersAnalysisData);

  if (!parsedData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="porters-five-forces">
        <div className="pff-header">
          <div className="pff-title-section">
            <Shield className="pff-icon" size={24} />
            <h2 className="pff-title">Porter's Five Forces Analysis</h2>
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Porter's Five Forces"
            size="medium"
            buttonText="Generate"
          />
        </div>
        <div className="empty-state">
          <Shield size={48} className="empty-icon" />
          <h3>Porter's Five Forces Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate Porter's Five Forces analysis.`
              : "Porter's Five Forces analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="porters-five-forces">
      {/* Header */}
      <div className="pff-header">
        <div className="pff-title-section">
          <Shield className="pff-icon" size={24} />
          <h2 className="pff-title">Porter's Five Forces Analysis</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Porter's Five Forces"
          size="medium"
        />
      </div>

      {/* Analysis Content */}
      <div className="porters-content">
        {/* Executive Summary */}
        {parsedData.executive_summary && (
          <div className="executive-summary">
            <h3>Executive Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Industry Attractiveness:</span>
                <span className={`summary-value ${getIntensityColor(parsedData.executive_summary.industry_attractiveness)}`}>
                  {parsedData.executive_summary.industry_attractiveness}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Competitive Intensity:</span>
                <span className={`summary-value ${getIntensityColor(parsedData.executive_summary.overall_competitive_intensity)}`}>
                  {parsedData.executive_summary.overall_competitive_intensity}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Competitive Position:</span>
                <span className="summary-value">{parsedData.executive_summary.competitive_position}</span>
              </div>
            </div>
            
            {parsedData.executive_summary.key_competitive_forces && (
              <div className="key-forces">
                <h4>Key Competitive Forces:</h4>
                <div className="forces-tags">
                  {parsedData.executive_summary.key_competitive_forces.map((force, index) => (
                    <span key={index} className="force-tag">{force}</span>
                  ))}
                </div>
              </div>
            )}

            {parsedData.executive_summary.strategic_implications && (
              <div className="strategic-implications">
                <h4>Strategic Implications:</h4>
                <ul>
                  {parsedData.executive_summary.strategic_implications.map((implication, index) => (
                    <li key={index}>{implication}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Forces Analysis */}
        {parsedData.five_forces_analysis && (
          <div className="forces-section">
            <h3>Five Forces Analysis</h3>
            <div className="forces-grid">
              {transformForcesData(parsedData).map((force, index) => renderForceCard(force, index))}
            </div>
          </div>
        )}

        {/* Competitive Landscape */}
        {parsedData.competitive_landscape && (
          <div className="competitive-landscape">
            <h3>Competitive Landscape</h3>
            
            {parsedData.competitive_landscape.direct_competitors && (
              <div className="competitors-section">
                <h4>Direct Competitors</h4>
                <div className="competitors-grid">
                  {parsedData.competitive_landscape.direct_competitors.map((competitor, index) => (
                    <div key={index} className="competitor-card">
                      <h5>{competitor.name}</h5>
                      {competitor.market_share && (
                        <div className="market-share">Market Share: {competitor.market_share}</div>
                      )}
                      <div className="competitor-details">
                        {competitor.strengths && (
                          <div className="strengths">
                            <h6>Strengths:</h6>
                            <ul>
                              {competitor.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {competitor.weaknesses && (
                          <div className="weaknesses">
                            <h6>Weaknesses:</h6>
                            <ul>
                              {competitor.weaknesses.map((weakness, idx) => (
                                <li key={idx}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strategic Recommendations */}
        {parsedData.strategic_recommendations && (
          <div className="strategic-recommendations">
            <h3>Strategic Recommendations</h3>
            
            {parsedData.strategic_recommendations.immediate_actions && (
              <div className="recommendations-section">
                <h4>Immediate Actions (Next 3-6 months)</h4>
                {parsedData.strategic_recommendations.immediate_actions.map((action, index) => (
                  <div key={index} className="recommendation-card immediate">
                    <h5>{action.action}</h5>
                    <p className="rationale">{action.rationale}</p>
                    <div className="recommendation-details">
                      <div className="timeline">Timeline: {action.timeline}</div>
                      {action.expected_impact && (
                        <div className="impact">Expected Impact: {action.expected_impact}</div>
                      )}
                      {action.resources_required && (
                        <div className="resources">
                          Resources: {action.resources_required.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {parsedData.strategic_recommendations.short_term_initiatives && (
              <div className="recommendations-section">
                <h4>Short-term Initiatives</h4>
                {parsedData.strategic_recommendations.short_term_initiatives.map((initiative, index) => (
                  <div key={index} className="recommendation-card short-term">
                    <h5>{initiative.initiative}</h5>
                    <div className="recommendation-details">
                      {initiative.strategic_pillar && (
                        <div className="pillar">Strategic Pillar: {initiative.strategic_pillar}</div>
                      )}
                      {initiative.expected_outcome && (
                        <div className="outcome">Expected Outcome: {initiative.expected_outcome}</div>
                      )}
                      {initiative.risk_mitigation && (
                        <div className="risk">Risk Mitigation: {initiative.risk_mitigation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {parsedData.strategic_recommendations.long_term_strategic_shifts && (
              <div className="recommendations-section">
                <h4>Long-term Strategic Shifts</h4>
                {parsedData.strategic_recommendations.long_term_strategic_shifts.map((shift, index) => (
                  <div key={index} className="recommendation-card long-term">
                    <h5>{shift.shift}</h5>
                    <div className="recommendation-details">
                      {shift.transformation_required && (
                        <div className="transformation">Transformation: {shift.transformation_required}</div>
                      )}
                      {shift.competitive_advantage && (
                        <div className="advantage">Competitive Advantage: {shift.competitive_advantage}</div>
                      )}
                      {shift.sustainability && (
                        <div className="sustainability">Sustainability: {shift.sustainability}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monitoring Dashboard */}
        {parsedData.monitoring_dashboard && (
          <div className="monitoring-dashboard">
            <h3>Monitoring Dashboard</h3>
            
            {parsedData.monitoring_dashboard.key_indicators && (
              <div className="indicators-section">
                <h4>Key Performance Indicators</h4>
                {parsedData.monitoring_dashboard.key_indicators.map((indicator, index) => (
                  <div key={index} className="indicator-card">
                    <h5>{indicator.indicator}</h5>
                    <div className="indicator-details">
                      <div className="force-relation">Related Force: {indicator.force}</div>
                      <div className="frequency">Measurement: {indicator.measurement_frequency}</div>
                      {indicator.threshold_values && (
                        <div className="thresholds">
                          <div className="threshold green">✓ {indicator.threshold_values.green}</div>
                          <div className="threshold yellow">⚠ {indicator.threshold_values.yellow}</div>
                          <div className="threshold red">✗ {indicator.threshold_values.red}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {parsedData.monitoring_dashboard.early_warning_signals && (
              <div className="warnings-section">
                <h4>Early Warning Signals</h4>
                {parsedData.monitoring_dashboard.early_warning_signals.map((signal, index) => (
                  <div key={index} className="warning-card">
                    <h5>{signal.signal}</h5>
                    <div className="warning-details">
                      <div className="trigger">Trigger Response: {signal.trigger_response}</div>
                      <div className="source">Monitoring Source: {signal.monitoring_source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} 
      </div>
    </div>
  );
};

export default PortersFiveForces;