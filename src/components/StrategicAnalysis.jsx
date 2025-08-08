import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Target, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Shield, Zap, Eye, Settings, BarChart3, Activity, Star, ArrowRight } from 'lucide-react';

const StrategicAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  strategicData = null,
  selectedBusinessId
}) => {
  const [localStrategicData, setLocalStrategicData] = useState(strategicData);
  const [selectedPillar, setSelectedPillar] = useState(null);

  // Hardcoded strategic analysis data
  const hardcodedStrategicData = {
    "strategic_analysis": {
      "executive_summary": {
        "situation_overview": "Kasnet operates within the fintech and digital payments sector, specializing in providing a hybrid of physical and digital financial services. The company targets underserved and rural communities, leveraging a unique value proposition of accessibility and reliability via its non-banking correspondent agent (NBCA) network. The environment is characterized by rapid digital payment adoption, regulatory complexity, and heightened competition from both established institutions and agile fintech startups.",
        "primary_vuca_factors": [
          "Volatility in regulatory requirements",
          "Uncertainty from new fintech entrants and digital wallet startups",
          "Complexity in integrating physical and digital payment channels",
          "Ambiguity in future technological and market trends"
        ],
        "key_strategic_themes": [
          "Digital transformation",
          "Financial inclusion",
          "Customer experience optimization",
          "Operational agility",
          "Regulatory compliance"
        ],
        "urgency_level": "High",
        "strategic_maturity_assessment": "Kasnet demonstrates a high degree of strategic maturity, employing robust frameworks (OKRs) for objective tracking, proactively responding to disruptions, and integrating customer feedback. However, there is room for improvement in scaling digital innovation, deepening data analytics, and maintaining agility as the organization grows."
      },
      "strategic_pillars_analysis": {
        "strategy": {
          "pillar_code": "S",
          "relevance_score": 0.95,
          "current_state": {
            "strengths": [
              "Clear segmentation of target customers",
              "Well-defined value proposition",
              "Alignment with financial inclusion initiatives"
            ],
            "weaknesses": [
              "Potential over-reliance on physical infrastructure in an increasingly digital market",
              "Vision execution risk amid rapid regulatory changes"
            ],
            "assessment_score": 0.85
          },
          "recommendations": [
            {
              "action": "Refine strategic vision to explicitly prioritize digital leadership in underserved markets.",
              "priority": "High",
              "timeline": "Q3 2024",
              "resources_required": [
                "Strategy team",
                "Market research"
              ],
              "expected_impact": "Clear market positioning and increased investor confidence."
            }
          ]
        },
        "tactics": {
          "pillar_code": "T",
          "relevance_score": 0.9,
          "current_state": {
            "strengths": [
              "OKRs in place to translate vision to executable plans",
              "Ongoing merchant acquisition strategies"
            ],
            "weaknesses": [
              "Need for tighter tactical alignment as digital and regulatory landscapes shift rapidly"
            ],
            "assessment_score": 0.8
          }
        },
        "resources": {
          "pillar_code": "R",
          "relevance_score": 0.85,
          "current_state": {
            "strengths": [
              "Hybrid infrastructure (physical and digital)",
              "Proven capital allocation aligned with strategic targets"
            ],
            "weaknesses": [
              "Talent upskilling and retention in technology roles",
              "Potential limits in technology investment capacity"
            ],
            "assessment_score": 0.75
          }
        },
        "analysis_and_data": {
          "pillar_code": "A",
          "relevance_score": 0.9,
          "current_state": {
            "strengths": [
              "Regular NPS surveys",
              "Robust feedback/data integration with product cycles"
            ],
            "weaknesses": [
              "Need for advanced analytics and real-time insights for agile decision-making"
            ],
            "assessment_score": 0.7
          }
        },
        "technology_and_digitization": {
          "pillar_code": "T2",
          "relevance_score": 0.95,
          "current_state": {
            "strengths": [
              "API-based payment integration",
              "Strong combined physical and digital footprint"
            ],
            "weaknesses": [
              "Legacy systems may hinder rapid technological evolution",
              "Cybersecurity demands rising with regulatory changes"
            ],
            "assessment_score": 0.8
          }
        },
        "execution": {
          "pillar_code": "E",
          "relevance_score": 0.9,
          "current_state": {
            "strengths": [
              "Rigorous execution monitored through OKRs",
              "Streamlined decision-making"
            ],
            "weaknesses": [
              "Execution bandwidth may not pace with the speed of market and tech changes"
            ],
            "assessment_score": 0.8
          }
        },
        "governance": {
          "pillar_code": "G",
          "relevance_score": 0.85,
          "current_state": {
            "strengths": [
              "Agile, streamlined governance structures",
              "Responsiveness to compliance shifts"
            ],
            "weaknesses": [
              "Governance frameworks may need periodic refresh for scale and complexity"
            ],
            "assessment_score": 0.8
          }
        },
        "innovation": {
          "pillar_code": "I",
          "relevance_score": 0.9,
          "current_state": {
            "strengths": [
              "Active pilot programs",
              "Feedback-driven platform innovation"
            ],
            "weaknesses": [
              "Innovation consistency may be challenged by resource/budget constraints"
            ],
            "assessment_score": 0.75
          }
        },
        "culture": {
          "pillar_code": "C",
          "relevance_score": 0.87,
          "current_state": {
            "strengths": [
              "Customer-centricity embedded in service design",
              "Emphasis on agility and learning"
            ],
            "weaknesses": [
              "Cultural adaptation needed for a digital-first mindset at all staff levels"
            ],
            "assessment_score": 0.78
          }
        }
      },
      "risk_assessment": {
        "strategic_risks": [
          {
            "risk": "Speed of regulatory change outpaces compliance adaptation.",
            "probability": "High",
            "impact": "Severe",
            "mitigation": "Accelerate investment in regulatory monitoring tools and scenario planning.",
            "owner": "Chief Compliance Officer"
          },
          {
            "risk": "New digital entrants erode rural/underserved market share.",
            "probability": "Medium",
            "impact": "High",
            "mitigation": "Expand partnership and technology pilots to lock in local market loyalty.",
            "owner": "Head of Business Development"
          },
          {
            "risk": "Talent shortfall in digital/tech roles limits execution velocity.",
            "probability": "Medium",
            "impact": "Medium",
            "mitigation": "Prioritize targeted upskilling and attract fintech talent.",
            "owner": "HR Director"
          }
        ]
      },
      "implementation_roadmap": {
        "phase_1": {
          "duration": "Q2-Q3 2024",
          "focus": "Foundational digital upgrades, analytics enhancement, and cultural buy-in.",
          "key_initiatives": [
            "Deploy real-time analytics dashboard",
            "Initiate digital mindset program",
            "Start technology legacy migration"
          ],
          "budget": "10% of FY2024 OPEX",
          "success_criteria": [
            "Analytics dashboard live",
            "Staff engagement above 75%",
            "First legacy system retired"
          ]
        },
        "phase_2": {
          "duration": "Q4 2024-Q1 2025",
          "focus": "Accelerate innovation and digital product launches, governance refresh.",
          "key_initiatives": [
            "Formalize innovation funding",
            "Launch digital pilots in underserved regions",
            "Quarterly governance reviews"
          ],
          "budget": "15% of FY2025 OPEX",
          "success_criteria": [
            "Minimum 2 pilots launched",
            "Governance review delivered",
            "Innovation spend ≥ planned"
          ]
        },
        "phase_3": {
          "duration": "Q2-Q4 2025",
          "focus": "Scale successful pilots, solidify market differentiation, ongoing agile optimization.",
          "key_initiatives": [
            "Full rollout of top-performing pilots",
            "Broad digital onboarding push",
            "Embed feedback loop in all business lines"
          ],
          "budget": "20% of FY2025 OPEX",
          "success_criteria": [
            "3 pilots scaled",
            "NPS target met",
            "Digital engagement metrics up 20% over baseline"
          ]
        }
      }
    }
  };

  useEffect(() => {
    setLocalStrategicData(hardcodedStrategicData);
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
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const CircularProgress = ({ score, size = 60, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (score * circumference);

    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '12px',
          fontWeight: '600',
          color: getScoreColor(score)
        }}>
          {Math.round(score * 100)}%
        </div>
      </div>
    );
  };

  const renderDashboardOverview = () => {
    const summary = localStrategicData?.strategic_analysis?.executive_summary;
    if (!summary) return null;

    return (
      <div style={{ padding: '1.5rem' }}>
        {/* Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '24px', fontWeight: '700' }}>
              Strategic Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>Strategic Maturity</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>High Performance</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>Urgency Level</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: summary.urgency_level === 'High' ? '#fbbf24' : '#34d399'
                }}>
                  {summary.urgency_level}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>Focus Areas</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {summary.key_strategic_themes?.length || 0} Themes
                </div>
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* VUCA Factors */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#dc2626' }} />
              </div>
              <h4 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>VUCA Challenges</h4>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', marginBottom: '0.5rem' }}>
              {summary.primary_vuca_factors?.length || 0}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Critical volatility factors identified
            </p>
          </div>

          {/* Strategic Themes */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                <Target size={20} style={{ color: '#2563eb' }} />
              </div>
              <h4 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>Strategic Themes</h4>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', marginBottom: '0.5rem' }}>
              {summary.key_strategic_themes?.length || 0}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Core strategic focus areas
            </p>
          </div>
        </div>

        {/* Strategic Themes Tags */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#1f2937', marginBottom: '1rem', fontSize: '18px', fontWeight: '600' }}>
            Strategic Focus Areas
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {summary.key_strategic_themes?.map((theme, index) => (
              <div key={index} style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}>
                {theme}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPillarsRadar = () => {
    const pillars = localStrategicData?.strategic_analysis?.strategic_pillars_analysis;
    if (!pillars) return null;

    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '2rem', fontSize: '20px', fontWeight: '600' }}>
          Strategic Pillars Performance
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(pillars).map(([pillarKey, pillar]) => {
            const IconComponent = getPillarIcon(pillarKey);
            const score = pillar.current_state?.assessment_score || 0;
            const relevance = pillar.relevance_score || 0;
            
            return (
              <div 
                key={pillarKey}
                onClick={() => setSelectedPillar(selectedPillar === pillarKey ? null : pillarKey)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: selectedPillar === pillarKey ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  boxShadow: selectedPillar === pillarKey ? '0 8px 25px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ 
                        background: `${getScoreColor(score)}20`,
                        padding: '8px',
                        borderRadius: '8px'
                      }}>
                        <IconComponent size={20} style={{ color: getScoreColor(score) }} />
                      </div>
                      <h4 style={{ 
                        margin: 0, 
                        color: '#1f2937', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {pillarKey.replace(/_/g, ' ')}
                      </h4>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Performance
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: getScoreColor(score) }}>
                          {Math.round(score * 100)}%
                        </div>
                      </div>
                      
                      <div style={{ width: '1px', height: '30px', background: '#e5e7eb' }} />
                      
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Relevance
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                          {Math.round(relevance * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CircularProgress score={score} size={70} strokeWidth={6} />
                </div>

                {selectedPillar === pillarKey && (
                  <div style={{ 
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    {pillar.current_state?.strengths && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h6 style={{ color: '#10b981', fontSize: '13px', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                          ✓ Strengths
                        </h6>
                        <ul style={{ margin: 0, paddingLeft: '1rem', color: '#065f46' }}>
                          {pillar.current_state.strengths.map((strength, index) => (
                            <li key={index} style={{ fontSize: '12px', marginBottom: '0.25rem' }}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pillar.current_state?.weaknesses && (
                      <div>
                        <h6 style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                          ⚠ Areas for Improvement
                        </h6>
                        <ul style={{ margin: 0, paddingLeft: '1rem', color: '#7f1d1d' }}>
                          {pillar.current_state.weaknesses.map((weakness, index) => (
                            <li key={index} style={{ fontSize: '12px', marginBottom: '0.25rem' }}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${getScoreColor(score)} ${score * 100}%, #e5e7eb ${score * 100}%)`
                }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRiskMatrix = () => {
    const risks = localStrategicData?.strategic_analysis?.risk_assessment?.strategic_risks;
    if (!risks) return null;

    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '2rem', fontSize: '20px', fontWeight: '600' }}>
          Risk Assessment Matrix
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {risks.map((risk, index) => {
            const getRiskLevel = (prob, impact) => {
              if ((prob === 'High' && impact === 'Severe') || (prob === 'High' && impact === 'High')) return 'critical';
              if (prob === 'Medium' && impact === 'High') return 'high';
              if (prob === 'Medium' && impact === 'Medium') return 'medium';
              return 'low';
            };

            const riskLevel = getRiskLevel(risk.probability, risk.impact);
            const colors = {
              critical: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
              high: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
              medium: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
              low: { bg: '#f0f9ff', border: '#3b82f6', text: '#1e40af' }
            };

            return (
              <div key={index} style={{
                background: colors[riskLevel].bg,
                border: `2px solid ${colors[riskLevel].border}`,
                borderRadius: '12px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      color: colors[riskLevel].text, 
                      margin: '0 0 0.75rem 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      lineHeight: '1.4'
                    }}>
                      {risk.risk}
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.7)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors[riskLevel].text
                      }}>
                        {risk.probability} Probability
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.7)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors[riskLevel].text
                      }}>
                        {risk.impact} Impact
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: colors[riskLevel].border,
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {riskLevel}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h6 style={{ color: colors[riskLevel].text, fontSize: '13px', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    Mitigation Strategy
                  </h6>
                  <p style={{ color: colors[riskLevel].text, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                    {risk.mitigation}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} style={{ color: colors[riskLevel].text }} />
                  <span style={{ color: colors[riskLevel].text, fontSize: '12px', fontWeight: '500' }}>
                    Owner: {risk.owner}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRoadmapTimeline = () => {
    const roadmap = localStrategicData?.strategic_analysis?.implementation_roadmap;
    if (!roadmap) return null;

    const phases = Object.entries(roadmap);

    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '2rem', fontSize: '20px', fontWeight: '600' }}>
          Implementation Timeline
        </h3>
        
        <div style={{ position: 'relative' }}>
          {/* Timeline Line */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '40px',
            bottom: '40px',
            width: '3px',
            background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
            borderRadius: '2px'
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {phases.map(([phaseKey, phase], index) => (
              <div key={phaseKey} style={{ position: 'relative', paddingLeft: '60px' }}>
                {/* Timeline Dot */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '20px',
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '50%',
                  border: '4px solid white',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {index + 1}
                </div>

                <div style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ 
                        color: '#1f2937', 
                        margin: '0 0 0.5rem 0', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {phaseKey.replace(/_/g, ' ')}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Clock size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                          {phase.duration}
                        </span>
                      </div>
                    </div>
                    
                    {phase.budget && (
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {phase.budget}
                      </div>
                    )}
                  </div>

                  <p style={{ 
                    color: '#4b5563', 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    margin: '0 0 1.5rem 0',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3b82f6'
                  }}>
                    {phase.focus}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h6 style={{ 
                        color: '#3b82f6', 
                        fontSize: '14px', 
                        margin: '0 0 0.75rem 0', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <TrendingUp size={16} />
                        Key Initiatives
                      </h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {phase.key_initiatives?.map((initiative, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: '#eff6ff',
                            borderRadius: '8px',
                            border: '1px solid #dbeafe'
                          }}>
                            <ArrowRight size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.4' }}>
                              {initiative}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h6 style={{ 
                        color: '#10b981', 
                        fontSize: '14px', 
                        margin: '0 0 0.75rem 0', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <CheckCircle size={16} />
                        Success Criteria
                      </h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {phase.success_criteria?.map((criteria, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: '#ecfdf5',
                            borderRadius: '8px',
                            border: '1px solid #d1fae5'
                          }}>
                            <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#065f46', lineHeight: '1.4' }}>
                              {criteria}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStrategicContent = () => {
    if (isRegenerating) {
      return (
        <div className="analysis-loading" style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '16px',
          margin: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '50%',
            padding: '2rem',
            display: 'inline-block',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <Loader size={32} className="spinner" style={{ color: '#3b82f6' }} />
          </div>
          <h3 style={{ color: '#1f2937', margin: '0 0 0.5rem 0' }}>Generating Strategic Analysis</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Building comprehensive strategic insights...</p>
        </div>
      );
    }

    if (!localStrategicData) {
      return (
        <div className="no-analysis" style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '16px',
          margin: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '50%',
            padding: '2rem',
            display: 'inline-block',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <Target size={32} style={{ color: '#6b7280' }} />
          </div>
          <h3 style={{ color: '#1f2937', margin: '0 0 0.5rem 0' }}>Strategic Analysis Pending</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Complete the initial phase questions to unlock your comprehensive strategic analysis.
          </p>
        </div>
      );
    }

    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        {renderDashboardOverview()}
        {renderPillarsRadar()}
        {renderRiskMatrix()}
        {renderRoadmapTimeline()}
      </div>
    );
  };

  return (
    <div className="strategic-analysis-section" style={{ 
      backgroundColor: 'white',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div className="section-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        flexShrink: 0
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '700' }}>
            Strategic Analysis Dashboard
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            Comprehensive strategic insights for {businessName || 'your business'}
          </p>
        </div>
        
        {/* Uncomment this section when you want to enable regeneration */}
        {/* 
        {canRegenerate && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            style={{
              backgroundColor: isRegenerating ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            title="Regenerate strategic analysis"
          >
            {isRegenerating ? (
              <>
                <Loader size={16} className="animate-spin" />
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
        */}
      </div>
             
      <div className="section-content" style={{
        flex: 1,
        overflow: 'auto',
        height: '100%'
      }}>
        {renderStrategicContent()}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StrategicAnalysis;