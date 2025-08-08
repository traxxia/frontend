import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader, TrendingUp, AlertTriangle, Target, Activity, Clock, CheckCircle } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";

// Dummy PESTEL response matching the backend template
const DUMMY_PESTEL_DATA = {
  pestel_analysis: {
    executive_summary: {
      dominant_factors: [
        "Rapid technological advancement in AI and automation",
        "Increasing government support for digital transformation",
        "Growing consumer demand for sustainable solutions"
      ],
      critical_risks: [
        "Data privacy regulations creating compliance challenges",
        "Economic uncertainty affecting customer spending",
        "Cybersecurity threats to digital infrastructure"
      ],
      key_opportunities: [
        "Government incentives for green technology adoption",
        "Remote work trends driving demand for digital solutions",
        "AI integration creating competitive advantages"
      ],
      strategic_recommendations: [
        "Invest heavily in AI and automation capabilities",
        "Develop comprehensive data privacy compliance framework",
        "Establish strategic partnerships with government initiatives",
        "Create sustainable product offerings to meet market demand"
      ],
      agility_priority_score: 7.5
    },
    factor_summary: {
      political: {
        total_mentions: 8,
        high_impact_count: 3,
        key_themes: ["Government digitization", "Trade policies", "Regulatory changes"],
        strategic_priority: "High"
      },
      economic: {
        total_mentions: 6,
        high_impact_count: 2,
        key_themes: ["Interest rates", "Economic growth", "Inflation impact"],
        strategic_priority: "Medium"
      },
      social: {
        total_mentions: 9,
        high_impact_count: 4,
        key_themes: ["Remote work adoption", "Digital literacy", "Sustainability awareness"],
        strategic_priority: "High"
      },
      technological: {
        total_mentions: 12,
        high_impact_count: 5,
        key_themes: ["AI advancement", "Cloud computing", "Cybersecurity"],
        strategic_priority: "High"
      },
      environmental: {
        total_mentions: 4,
        high_impact_count: 1,
        key_themes: ["Carbon regulations", "Sustainability requirements"],
        strategic_priority: "Low"
      },
      legal: {
        total_mentions: 7,
        high_impact_count: 2,
        key_themes: ["Data protection", "Employment law", "IP protection"],
        strategic_priority: "Medium"
      }
    },
    strategic_recommendations: {
      immediate_actions: [
        {
          action: "Implement GDPR compliance audit and remediation",
          rationale: "New data protection regulations require immediate compliance to avoid penalties",
          timeline: "4 weeks",
          resources_required: "Legal team, IT security specialist, $15K budget",
          success_metrics: ["100% compliance score", "Zero regulatory violations", "Data audit completion"]
        },
        {
          action: "Establish cybersecurity incident response team",
          rationale: "Increasing cyber threats require immediate defensive capabilities",
          timeline: "6 weeks",
          resources_required: "2 security engineers, SOC tools, $25K initial investment",
          success_metrics: ["Response time <2 hours", "Zero successful breaches", "Team certification complete"]
        },
        {
          action: "Apply for government digital transformation grants",
          rationale: "Limited time window for accessing government funding opportunities",
          timeline: "3 weeks",
          resources_required: "Grant writer, business development lead, documentation",
          success_metrics: ["3+ grant applications submitted", "1+ grant approved", "Funding secured"]
        }
      ],
      short_term_initiatives: [
        {
          initiative: "AI-powered customer service automation platform",
          strategic_pillar: "Technology Leadership",
          expected_outcome: "30% reduction in support costs, 24/7 customer service capability",
          risk_mitigation: "Addresses technological disruption risk while improving operational efficiency"
        },
        {
          initiative: "Sustainable product line development",
          strategic_pillar: "Market Differentiation",
          expected_outcome: "Capture 15% of environmentally conscious customer segment",
          risk_mitigation: "Proactive response to environmental regulations and consumer preferences"
        },
        {
          initiative: "Remote work infrastructure optimization",
          strategic_pillar: "Operational Excellence",
          expected_outcome: "25% increase in productivity, reduced office overhead costs",
          risk_mitigation: "Adapts to permanent social changes in work preferences"
        }
      ],
      long_term_strategic_shifts: [
        {
          shift: "Transform from service provider to AI-driven platform company",
          transformation_required: "Technology stack overhaul, talent acquisition, business model redesign",
          competitive_advantage: "First-mover advantage in AI-powered industry solutions",
          sustainability: "Scalable platform model with network effects and recurring revenue"
        },
        {
          shift: "Establish strategic government partnerships",
          transformation_required: "Dedicated public sector division, compliance framework, security clearances",
          competitive_advantage: "Preferred vendor status for government digital transformation projects",
          sustainability: "Long-term contracts with stable government revenue streams"
        }
      ]
    },
    monitoring_dashboard: {
      key_indicators: [
        {
          indicator: "Regulatory Compliance Score",
          pestel_factor: "Legal",
          measurement_frequency: "Monthly",
          threshold_values: {
            green: "95-100% compliance",
            yellow: "85-94% compliance",
            red: "Below 85% compliance"
          }
        },
        {
          indicator: "Technology Adoption Rate",
          pestel_factor: "Technological",
          measurement_frequency: "Quarterly",
          threshold_values: {
            green: "Above industry average +10%",
            yellow: "Industry average ±10%",
            red: "Below industry average -10%"
          }
        },
        {
          indicator: "Customer Satisfaction with Digital Services",
          pestel_factor: "Social",
          measurement_frequency: "Monthly",
          threshold_values: {
            green: "4.5+ stars",
            yellow: "3.5-4.4 stars",
            red: "Below 3.5 stars"
          }
        },
        {
          indicator: "Government Contract Pipeline Value",
          pestel_factor: "Political",
          measurement_frequency: "Quarterly",
          threshold_values: {
            green: "$500K+ in pipeline",
            yellow: "$200K-$499K in pipeline",
            red: "Below $200K in pipeline"
          }
        }
      ],
      early_warning_signals: [
        {
          signal: "New data privacy regulation announcements",
          trigger_response: "Activate compliance assessment team within 48 hours",
          monitoring_source: "Government regulatory websites, legal news feeds"
        },
        {
          signal: "Major cybersecurity incidents in industry",
          trigger_response: "Conduct immediate security audit and threat assessment",
          monitoring_source: "Cybersecurity threat intelligence feeds, industry reports"
        },
        {
          signal: "Economic recession indicators",
          trigger_response: "Implement cost reduction contingency plan",
          monitoring_source: "Economic indicators dashboard, financial news"
        },
        {
          signal: "Competitor AI technology breakthrough",
          trigger_response: "Accelerate AI development roadmap",
          monitoring_source: "Industry news, patent filings, competitor announcements"
        }
      ]
    }
  }
};

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

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setPestelAnalysisData(DUMMY_PESTEL_DATA);
        setIsLoading(false);
      }, 2000);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Get threshold color
  const getThresholdColor = (threshold) => {
    switch (threshold) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'red': return '#DC2626';
      default: return '#6B7280';
    }
  };

  // Initialize component with dummy data
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMounted.current = true;
    hasInitialized.current = true;
    
    setIsLoading(true);
    setTimeout(() => {
      setPestelAnalysisData(DUMMY_PESTEL_DATA);
      setIsLoading(false);
      if (onDataGenerated) {
        onDataGenerated(DUMMY_PESTEL_DATA);
      }
    }, 1500);

    return () => {
      isMounted.current = false;
    };
  }, []);

  if (isLoading || isRegenerating) {
    return (
      <div className="pestel-analysis">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '4rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <Loader size={40} style={{ 
            animation: 'spin 1s linear infinite',
            color: '#3B82F6',
            marginBottom: '1.5rem'
          }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1F2937', fontSize: '1.25rem' }}>
            {isRegenerating ? "Regenerating PESTEL Analysis..." : "Generating PESTEL Analysis..."}
          </h3>
          <p style={{ color: '#6B7280', margin: 0, textAlign: 'center' }}>
            Analyzing external factors and generating strategic recommendations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pestel-analysis">
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <AlertTriangle size={48} style={{ color: '#DC2626', marginBottom: '1rem' }} />
          <h3 style={{ color: '#DC2626', margin: '0 0 1rem 0' }}>Analysis Error</h3>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={handleRegenerate}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!pestelAnalysisData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="pestel-analysis">
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <Globe size={64} style={{ color: '#9CA3AF', marginBottom: '1.5rem' }} />
          <h3 style={{ color: '#1F2937', margin: '0 0 1rem 0', fontSize: '1.5rem' }}>PESTEL Analysis</h3>
          <p style={{ color: '#6B7280', margin: 0 }}>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate PESTEL analysis.`
              : "PESTEL analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  const analysis = pestelAnalysisData.pestel_analysis;

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Globe size={32} style={{ color: '#3B82F6' }} />
          <div>
            <h1 style={{ margin: 0, color: '#1F2937', fontSize: '1.75rem', fontWeight: '600' }}>
              PESTEL Analysis
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '1rem' }}>
              Strategic Environmental Assessment for {businessName}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: analysis.executive_summary.agility_priority_score >= 7 ? '#DC2626' : 
                    analysis.executive_summary.agility_priority_score >= 5 ? '#F59E0B' : '#10B981'
            }}>
              {analysis.executive_summary.agility_priority_score}/10
            </div>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>Agility Priority</p>
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '0.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {[
          { id: 'summary', label: 'Executive Summary', icon: Target },
          { id: 'factors', label: 'Factor Analysis', icon: Activity },
          { id: 'recommendations', label: 'Strategic Actions', icon: TrendingUp },
          { id: 'monitoring', label: 'Monitoring Dashboard', icon: CheckCircle }
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: activeTab === tab.id ? '#3B82F6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Executive Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #10B981'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#10B981', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} />
                Key Opportunities
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4B5563' }}>
                {analysis.executive_summary.key_opportunities.map((opportunity, index) => (
                  <li key={index} style={{ marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #DC2626'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#DC2626', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} />
                Critical Risks
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4B5563' }}>
                {analysis.executive_summary.critical_risks.map((risk, index) => (
                  <li key={index} style={{ marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dominant Factors */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937', fontSize: '1.25rem' }}>Dominant Environmental Factors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {analysis.executive_summary.dominant_factors.map((factor, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px',
                  borderLeft: '3px solid #3B82F6'
                }}>
                  <p style={{ margin: 0, color: '#1F2937', fontSize: '0.9rem', fontWeight: '500' }}>
                    {factor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations Preview */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937', fontSize: '1.25rem' }}>Top Strategic Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analysis.executive_summary.strategic_recommendations.slice(0, 4).map((recommendation, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'factors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(analysis.factor_summary).map(([factor, data]) => (
            <div key={factor} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderTop: `4px solid ${getPriorityColor(data.strategic_priority)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1F2937', fontSize: '1.125rem', textTransform: 'capitalize' }}>
                  {factor}
                </h3>
                <span style={{
                  backgroundColor: getPriorityColor(data.strategic_priority),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {data.strategic_priority}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6' }}>
                    {data.total_mentions}
                  </div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.75rem' }}>Total Mentions</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>
                    {data.high_impact_count}
                  </div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.75rem' }}>High Impact</p>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1F2937', fontSize: '0.95rem' }}>Key Themes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {data.key_themes.map((theme, index) => (
                    <span key={index} style={{
                      backgroundColor: '#F3F4F6',
                      color: '#4B5563',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.8rem'
                    }}>
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Immediate Actions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #DC2626'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#DC2626', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} />
              Immediate Actions (Critical)
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analysis.strategic_recommendations.immediate_actions.map((action, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '8px',
                  border: '1px solid #FECACA'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, color: '#1F2937', fontSize: '1rem', fontWeight: '600', flex: 1 }}>
                      {action.action}
                    </h4>
                    <span style={{
                      backgroundColor: '#DC2626',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginLeft: '1rem'
                    }}>
                      {action.timeline}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', color: '#4B5563', fontSize: '0.9rem' }}>
                    <strong>Rationale:</strong> {action.rationale}
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0', color: '#4B5563', fontSize: '0.9rem' }}>
                    <strong>Resources:</strong> {action.resources_required}
                  </p>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4B5563', fontSize: '0.9rem', fontWeight: '500' }}>
                      Success Metrics:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {action.success_metrics.map((metric, metricIndex) => (
                        <span key={metricIndex} style={{
                          backgroundColor: 'white',
                          color: '#DC2626',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          border: '1px solid #DC2626'
                        }}>
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Short-term Initiatives */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #F59E0B'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#F59E0B', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} />
              Short-term Initiatives (3-6 months)
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analysis.strategic_recommendations.short_term_initiatives.map((initiative, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FED7AA'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem', fontWeight: '600' }}>
                    {initiative.initiative}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '500' }}>
                        Strategic Pillar:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {initiative.strategic_pillar}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '500' }}>
                        Expected Outcome:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {initiative.expected_outcome}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '500' }}>
                      Risk Mitigation:
                    </p>
                    <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                      {initiative.risk_mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long-term Strategic Shifts */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #10B981'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#10B981', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} />
              Long-term Strategic Shifts (6+ months)
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analysis.strategic_recommendations.long_term_strategic_shifts.map((shift, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  backgroundColor: '#ECFDF5',
                  borderRadius: '8px',
                  border: '1px solid #A7F3D0'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem', fontWeight: '600' }}>
                    {shift.shift}
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#10B981', fontSize: '0.8rem', fontWeight: '500' }}>
                        Transformation Required:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {shift.transformation_required}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#10B981', fontSize: '0.8rem', fontWeight: '500' }}>
                        Competitive Advantage:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {shift.competitive_advantage}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#10B981', fontSize: '0.8rem', fontWeight: '500' }}>
                        Sustainability:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {shift.sustainability}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Key Indicators */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} />
              Key Performance Indicators
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analysis.monitoring_dashboard.key_indicators.map((indicator, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, color: '#1F2937', fontSize: '1rem', fontWeight: '600', flex: 1 }}>
                      {indicator.indicator}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {indicator.pestel_factor}
                      </span>
                      <span style={{
                        backgroundColor: '#6B7280',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {indicator.measurement_frequency}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4B5563', fontSize: '0.9rem', fontWeight: '500' }}>
                      Performance Thresholds:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {Object.entries(indicator.threshold_values).map(([threshold, value]) => (
                        <div key={threshold} style={{
                          padding: '0.5rem',
                          backgroundColor: 'white',
                          border: `2px solid ${getThresholdColor(threshold)}`,
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            color: getThresholdColor(threshold),
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.25rem'
                          }}>
                            {threshold}
                          </div>
                          <div style={{ color: '#4B5563', fontSize: '0.8rem' }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Early Warning Signals */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #F59E0B'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#F59E0B', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} />
              Early Warning Signals
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analysis.monitoring_dashboard.early_warning_signals.map((signal, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FED7AA'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem', fontWeight: '600' }}>
                    {signal.signal}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '500' }}>
                        Trigger Response:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {signal.trigger_response}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '500' }}>
                        Monitoring Source:
                      </p>
                      <p style={{ margin: 0, color: '#4B5563', fontSize: '0.9rem' }}>
                        {signal.monitoring_source}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring Summary */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '2px solid #3B82F615'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} style={{ color: '#3B82F6' }} />
              Monitoring Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6', marginBottom: '0.5rem' }}>
                  {analysis.monitoring_dashboard.key_indicators.length}
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>KPIs to Track</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#F59E0B', marginBottom: '0.5rem' }}>
                  {analysis.monitoring_dashboard.early_warning_signals.length}
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>Warning Signals</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981', marginBottom: '0.5rem' }}>
                  6
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>PESTEL Factors</p>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#EFF6FF', 
              borderRadius: '8px',
              borderLeft: '4px solid #3B82F6'
            }}>
              <p style={{ margin: 0, color: '#1F2937', fontSize: '0.9rem', fontWeight: '500' }}>
                💡 <strong>Recommendation:</strong> Set up automated monitoring dashboards and establish weekly review cycles 
                to track these indicators. Assign ownership for each KPI and establish escalation procedures when thresholds are breached.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestelAnalysis;