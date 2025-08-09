import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader, AlertTriangle, Target, Activity, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css'; 
import { useTranslation } from "../hooks/useTranslation";

const PestelAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  pestelData = null
}) => {
  const [pestelAnalysisData, setPestelAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  // API Configuration
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';

  // Generate PESTEL Analysis from API
  const generatePestelAnalysis = async () => {
    try {
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
        throw new Error('No questions available for PESTEL analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/pestel-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PESTEL API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Validate response structure
      let processedData = null;
      
      if (Array.isArray(result)) {
        throw new Error('Invalid API response: received array instead of PESTEL analysis object');
      }
      
      // Check for different possible response structures
      if (result.executive_summary && result.factor_summary) {
        // Direct structure without pestel_analysis wrapper
        processedData = result;
      } else if (result.pestel_analysis) {
        processedData = result.pestel_analysis;
      } else {
        throw new Error('Invalid API response structure: missing required PESTEL analysis data');
      }

      setPestelAnalysisData(processedData);
      if (onDataGenerated) {
        onDataGenerated(processedData);
      }

      return processedData;

    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setIsLoading(true);
      setError(null);
      try {
        await generatePestelAnalysis();
      } catch (error) {
        // Error is already set in generatePestelAnalysis
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMounted.current = true;
    hasInitialized.current = true;
    
    // If pestelData is provided, validate and use it
    if (pestelData) {
      if (Array.isArray(pestelData)) {
        // Don't use array data, treat as if no data provided
      } else if (pestelData.executive_summary || pestelData.pestel_analysis) {
        // Handle wrapped vs direct structure
        const dataToUse = pestelData.pestel_analysis || pestelData;
        setPestelAnalysisData(dataToUse);
        return;
      }
    }

    // Check if we have enough data to generate analysis
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount >= 3 && questions.length > 0) {
      setIsLoading(true);
      generatePestelAnalysis()
        .catch(() => {
          // Error handling is done in generatePestelAnalysis
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      isMounted.current = false;
    };
  }, [pestelData]);

  if (isLoading || isRegenerating) {
    return (
      <div className="pestel-container">
        <div className="pestel-loading">
          <Loader className="pestel-spinner" />
          <h3>Generating PESTEL Analysis...</h3>
          <p>Analyzing external factors and generating strategic recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pestel-container">
        <div className="pestel-error">
          <AlertTriangle />
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} className="retry-btn">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!pestelAnalysisData || Array.isArray(pestelAnalysisData)) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="pestel-container">
        <div className="pestel-empty">
          <Globe />
          <h3>PESTEL Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate PESTEL analysis.`
              : "PESTEL analysis will be generated automatically after completing the initial phase."
            }
          </p>
          {Array.isArray(pestelAnalysisData) && (
            <p style={{ color: 'red', fontSize: '0.8rem' }}>
              Invalid data format detected. Please regenerate the analysis.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Validate analysis structure
  if (!pestelAnalysisData.executive_summary || !pestelAnalysisData.factor_summary) {
    return (
      <div className="pestel-container">
        <div className="pestel-error">
          <AlertTriangle />
          <h3>Invalid Data Structure</h3>
          <p>PESTEL analysis data is missing required components. Please regenerate.</p>
          <button onClick={handleRegenerate} className="retry-btn">
            Regenerate Analysis
          </button>
        </div>
      </div>
    );
  }

  const analysis = pestelAnalysisData;

  return (
    <div className="pestel-container">
      {/* Header */}
      <div className="pestel-header">
        <div className="header-content">
          <Globe className="header-icon" />
          <div>
            <h1>PESTEL Analysis</h1>
            <p>Strategic Environmental Assessment for {businessName}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="agility-score">
            <div className={`score-value priority-${analysis.executive_summary?.agility_priority_score >= 7 ? 'high' : 
              analysis.executive_summary?.agility_priority_score >= 5 ? 'medium' : 'low'}`}>
              {analysis.executive_summary?.agility_priority_score || 'N/A'}/10
            </div>
            <span>Agility Priority</span>
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="PESTEL Analysis"
            size="medium"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="pestel-tabs">
        {[
          { id: 'summary', label: 'Executive Summary', icon: Target },
          { id: 'factors', label: 'PESTEL Factors', icon: BarChart3 },
          { id: 'monitoring', label: 'Monitoring', icon: Activity }, 
          { id: 'actions', label: 'Strategic Actions', icon: Clock },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="pestel-content">
        {activeTab === 'summary' && (
          <div className="summary-content">
            {/* Key Opportunities */}
            <div className="summary-card opportunities">
              <h3><Target size={20} />Key Opportunities</h3>
              <ul>
                {(analysis.executive_summary?.key_opportunities || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Critical Risks */}
            <div className="summary-card risks">
              <h3><AlertTriangle size={20} />Critical Risks</h3>
              <ul>
                {(analysis.executive_summary?.critical_risks || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Dominant Factors */}
            <div className="summary-card factors">
              <h3>Dominant Environmental Factors</h3>
              <div className="factor-list">
                {(analysis.executive_summary?.dominant_factors || []).map((factor, index) => (
                  <div key={index} className="factor-item">{factor}</div>
                ))}
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="summary-card recommendations">
              <h3>Strategic Recommendations</h3>
              <div className="recommendation-list">
                {(analysis.executive_summary?.strategic_recommendations || []).map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="rec-number">{index + 1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="factors-content">
            {Object.entries(analysis.factor_summary || {}).map(([factor, data]) => (
              <div key={factor} className={`factor-card priority-${data.strategic_priority?.toLowerCase()}`}>
                <div className="factor-header">
                  <h3>{factor.toUpperCase()}</h3>
                  <span className={`priority-badge priority-${data.strategic_priority?.toLowerCase()}`}>
                    {data.strategic_priority}
                  </span>
                </div>
                
                <div className="factor-stats">
                  <div className="stat">
                    <span className="stat-value">{data.total_mentions}</span>
                    <span className="stat-label">Total Mentions</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{data.high_impact_count}</span>
                    <span className="stat-label">High Impact</span>
                  </div>
                </div>

                <div className="factor-themes">
                  <h4>Key Themes</h4>
                  <div className="theme-tags">
                    {(data.key_themes || []).map((theme, index) => (
                      <span key={index} className="theme-tag">{theme}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="actions-content">
            {/* Immediate Actions */}
            <div className="action-section immediate">
              <h3><Clock size={20} />Immediate Actions</h3>
              {(analysis.strategic_recommendations?.immediate_actions || []).length === 0 ? (
                <p>No immediate actions available.</p>
              ) : (
                (analysis.strategic_recommendations?.immediate_actions || []).map((action, index) => (
                  <div key={index} className="action-card">
                    <div className="action-header">
                      <h4>{action.action}</h4>
                      <span className="timeline">{action.timeline}</span>
                    </div>
                    <p><strong>Rationale:</strong> {action.rationale}</p>
                    <p><strong>Resources:</strong> {action.resources_required}</p>
                    <div className="metrics">
                      <strong>Success Metrics:</strong>
                      <div className="metric-tags">
                        {(action.success_metrics || []).map((metric, i) => (
                          <span key={i} className="metric-tag">{metric}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Short-term Initiatives */}
            <div className="action-section short-term">
              <h3>Short-term Initiatives</h3>
              {(analysis.strategic_recommendations?.short_term_initiatives || []).length === 0 ? (
                <p>No short-term initiatives available.</p>
              ) : (
                (analysis.strategic_recommendations?.short_term_initiatives || []).map((initiative, index) => (
                  <div key={index} className="action-card">
                    <h4>{initiative.initiative}</h4>
                    <div className="initiative-details">
                      <p><strong>Strategic Pillar:</strong> {initiative.strategic_pillar}</p>
                      <p><strong>Expected Outcome:</strong> {initiative.expected_outcome}</p>
                      <p><strong>Risk Mitigation:</strong> {initiative.risk_mitigation}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Long-term Strategic Shifts */}
            <div className="action-section long-term">
              <h3>Long-term Strategic Shifts</h3>
              {(analysis.strategic_recommendations?.long_term_strategic_shifts || []).length === 0 ? (
                <p>No long-term strategic shifts available.</p>
              ) : (
                (analysis.strategic_recommendations?.long_term_strategic_shifts || []).map((shift, index) => (
                  <div key={index} className="action-card">
                    <h4>{shift.shift}</h4>
                    <div className="shift-details">
                      <p><strong>Transformation Required:</strong> {shift.transformation_required}</p>
                      <p><strong>Competitive Advantage:</strong> {shift.competitive_advantage}</p>
                      <p><strong>Sustainability:</strong> {shift.sustainability}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="monitoring-content">
            {/* Key Indicators */}
            <div className="monitoring-section">
              <h3><Activity size={20} />Key Performance Indicators</h3>
              {(analysis.monitoring_dashboard?.key_indicators || []).length === 0 ? (
                <p>No key performance indicators available.</p>
              ) : (
                (analysis.monitoring_dashboard?.key_indicators || []).map((indicator, index) => (
                  <div key={index} className="indicator-card">
                    <div className="indicator-header">
                      <h4>{indicator.indicator}</h4>
                      <div className="indicator-badges">
                        <span className="badge factor">{indicator.pestel_factor}</span>
                        <span className="badge frequency">{indicator.measurement_frequency}</span>
                      </div>
                    </div>
                    
                    <div className="thresholds">
                      <h5>Performance Thresholds:</h5>
                      <div className="threshold-grid">
                        {Object.entries(indicator.threshold_values || {}).map(([level, value]) => (
                          <div key={level} className={`threshold-item ${level}`}>
                            <span className="threshold-label">{level}</span>
                            <span className="threshold-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Early Warning Signals */}
            <div className="monitoring-section">
              <h3><AlertTriangle size={20} />Early Warning Signals</h3>
              {(analysis.monitoring_dashboard?.early_warning_signals || []).length === 0 ? (
                <p>No early warning signals available.</p>
              ) : (
                (analysis.monitoring_dashboard?.early_warning_signals || []).map((signal, index) => (
                  <div key={index} className="warning-card">
                    <h4>{signal.signal}</h4>
                    <p><strong>Trigger Response:</strong> {signal.trigger_response}</p>
                    <p><strong>Monitoring Source:</strong> {signal.monitoring_source}</p>
                  </div>
                ))
              )}
            </div>

            {/* Summary Stats */}
            <div className="monitoring-summary">
              <h3><CheckCircle size={20} />Monitoring Summary</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-number">{(analysis.monitoring_dashboard?.key_indicators || []).length}</div>
                  <div className="stat-label">KPIs to Track</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{(analysis.monitoring_dashboard?.early_warning_signals || []).length}</div>
                  <div className="stat-label">Warning Signals</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">6</div>
                  <div className="stat-label">PESTEL Factors</div>
                </div>
              </div>
            </div>
          </div>
        )} 
      </div>
    </div>
  );
};

export default PestelAnalysis;