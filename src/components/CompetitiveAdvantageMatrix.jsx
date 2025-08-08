import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, TrendingUp, Shield, Target, Award } from 'lucide-react';
import '../styles/EssentialPhase.css';  

const CompetitiveAdvantageMatrix = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  competitiveAdvantageData = null,
  selectedBusinessId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  // ADD THESE REFS TO TRACK COMPONENT STATE
  const isMounted = useRef(false);
  const hasGeneratedRef = useRef(false);
  const hasInitialized = useRef(false);

  // Show toast message
  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Generate competitive advantage analysis
  const generateCompetitiveAdvantage = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const questionsArray = [];
      const answersArray = [];

      // Filter and prepare questions with answers
      questions
        .filter(q => {
          const hasAnswer = userAnswers[q._id] && userAnswers[q._id].trim();
          return hasAnswer && userAnswers[q._id] !== '[Question Skipped]';
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question._id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for competitive advantage analysis');
      }

      console.log('Calling competitive advantage API with:', {
        questionsCount: questionsArray.length,
        answersCount: answersArray.length
      });

      const response = await fetch(`${ML_API_BASE_URL}/competitive-advantage`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Competitive Advantage API Error:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Competitive Advantage API Response:', result);

      // Handle different response structures
      let competitiveData = null;
      if (result.competitiveAdvantage) {
        competitiveData = result;
      } else if (result.competitive_advantage) {
        competitiveData = { competitiveAdvantage: result.competitive_advantage };
      } else {
        competitiveData = { competitiveAdvantage: result };
      }

      return competitiveData;

    } catch (error) {
      console.error('Error generating competitive advantage analysis:', error);
      setError(error.message);
      showToastMessage('Failed to generate competitive advantage analysis', 'error');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // FIXED: Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMounted.current = true;
    hasInitialized.current = true;
    
    // If data already exists, don't generate
    if (competitiveAdvantageData) { 
      hasGeneratedRef.current = true;
    }

    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - only run once

  // FIXED: Update data when prop changes - don't auto-generate
  useEffect(() => {
    if (competitiveAdvantageData && competitiveAdvantageData !== null) { 
      hasGeneratedRef.current = true;
      setError(null); // Clear any existing errors
    }
  }, [competitiveAdvantageData]);

  // FIXED: Reset generation flag when data is cleared (for regeneration scenarios)
  useEffect(() => {
    if (!competitiveAdvantageData && !isGenerating && !isRegenerating) {
      hasGeneratedRef.current = false;
    }
  }, [competitiveAdvantageData, isGenerating, isRegenerating]);

  // REMOVED: Auto-generation useEffect that was causing the issue
  // The old useEffect that was auto-generating has been completely removed

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate();
    } else {
      await generateCompetitiveAdvantage();
    }
  };

  // ADDED: Manual generation trigger for empty state
  const handleManualGenerate = async () => {
    hasGeneratedRef.current = true;
    await generateCompetitiveAdvantage();
  };

  // Render scatter plot visualization
  const renderScatterPlot = (differentiators) => {
    if (!differentiators || differentiators.length === 0) return null;

    const maxValue = 10;
    const plotSize = 400;
    const padding = 40;
    const plotArea = plotSize - (padding * 2);

    return (
      <div className="scatter-plot-container" style={{ marginBottom: '2rem' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Competitive Advantage vs Customer Value Matrix
        </h4>
        
        <div style={{ position: 'relative', margin: '0 auto', width: plotSize }}>
          <svg width={plotSize} height={plotSize} style={{ border: '1px solid #e5e7eb' }}>
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map(value => {
              const pos = padding + (value / maxValue) * plotArea;
              return (
                <g key={value}>
                  <line
                    x1={padding}
                    y1={pos}
                    x2={plotSize - padding}
                    y2={pos}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                  <line
                    x1={pos}
                    y1={padding}
                    x2={pos}
                    y2={plotSize - padding}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={padding}
              y1={plotSize - padding}
              x2={plotSize - padding}
              y2={plotSize - padding}
              stroke="#374151"
              strokeWidth={2}
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={plotSize - padding}
              stroke="#374151"
              strokeWidth={2}
            />

            {/* Quadrant labels */}
            <text x={padding + plotArea * 0.25} y={padding + plotArea * 0.25} 
                  textAnchor="middle" fontSize="12" fill="#6b7280">
              High Value, Low Uniqueness
            </text>
            <text x={padding + plotArea * 0.75} y={padding + plotArea * 0.25} 
                  textAnchor="middle" fontSize="12" fill="#059669">
              Sweet Spot
            </text>
            <text x={padding + plotArea * 0.25} y={padding + plotArea * 0.75} 
                  textAnchor="middle" fontSize="12" fill="#dc2626">
              Low Value, Low Uniqueness
            </text>
            <text x={padding + plotArea * 0.75} y={padding + plotArea * 0.75} 
                  textAnchor="middle" fontSize="12" fill="#d97706">
              Niche Advantage
            </text>

            {/* Data points */}
            {differentiators.map((diff, index) => {
              const x = padding + (diff.uniqueness / maxValue) * plotArea;
              const y = plotSize - padding - (diff.customerValue / maxValue) * plotArea;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={6 + (diff.sustainability || 5) / 2}
                    fill={diff.uniqueness >= 7 && diff.customerValue >= 7 ? '#059669' : 
                          diff.uniqueness >= 7 ? '#d97706' : 
                          diff.customerValue >= 7 ? '#6b7280' : '#dc2626'}
                    fillOpacity={0.7}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                    fontWeight="500"
                  >
                    {diff.type}
                  </text>
                </g>
              );
            })}

            {/* Axis labels */}
            <text
              x={plotSize / 2}
              y={plotSize - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
            >
              Competitive Uniqueness →
            </text>
            <text
              x={15}
              y={plotSize / 2}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
              transform={`rotate(-90, 15, ${plotSize / 2})`}
            >
              Customer Value →
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // Render differentiators list
  const renderDifferentiatorsList = (differentiators) => {
    if (!differentiators || differentiators.length === 0) return null;

    return (
      <div className="differentiators-list" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} />
          Key Differentiators
        </h4>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {differentiators.map((diff, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h5 style={{ 
                  margin: 0, 
                  color: '#374151',
                  textTransform: 'capitalize',
                  fontWeight: 600
                }}>
                  {diff.type} - {diff.description}
                </h5>
                
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: diff.uniqueness >= 7 ? '#dcfce7' : diff.uniqueness >= 5 ? '#fef3c7' : '#fee2e2',
                    color: diff.uniqueness >= 7 ? '#166534' : diff.uniqueness >= 5 ? '#92400e' : '#991b1b'
                  }}>
                    Unique: {diff.uniqueness}/10
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: diff.customerValue >= 7 ? '#dcfce7' : diff.customerValue >= 5 ? '#fef3c7' : '#fee2e2',
                    color: diff.customerValue >= 7 ? '#166534' : diff.customerValue >= 5 ? '#92400e' : '#991b1b'
                  }}>
                    Value: {diff.customerValue}/10
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: diff.sustainability >= 7 ? '#dcfce7' : diff.sustainability >= 5 ? '#fef3c7' : '#fee2e2',
                    color: diff.sustainability >= 7 ? '#166534' : diff.sustainability >= 5 ? '#92400e' : '#991b1b'
                  }}>
                    Sustainable: {diff.sustainability}/10
                  </span>
                </div>
              </div>

              {diff.proofPoints && diff.proofPoints.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#6b7280' }}>Proof Points:</strong>
                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    {diff.proofPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render competitive position
  const renderCompetitivePosition = (position) => {
    if (!position) return null;

    const getPositionColor = (pos) => {
      switch(pos) {
        case 'leader': return '#059669';
        case 'challenger': return '#d97706';
        case 'follower': return '#6b7280';
        case 'nicher': return '#7c3aed';
        default: return '#6b7280';
      }
    };

    return (
      <div className="competitive-position" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={18} />
          Market Position
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getPositionColor(position.marketPosition) }}>
              {position.overallScore}/10
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Overall Competitive Score
            </div>
          </div>

          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: getPositionColor(position.marketPosition),
              textTransform: 'capitalize'
            }}>
              {position.marketPosition}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Market Position
            </div>
          </div>

          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
              {position.sustainableAdvantages}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Sustainable Advantages
            </div>
          </div>

          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
              {position.vulnerableAdvantages}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Vulnerable Advantages
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render customer choice reasons
  const renderCustomerChoiceReasons = (reasons) => {
    if (!reasons || reasons.length === 0) return null;

    return (
      <div className="customer-choice-reasons" style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} />
          Why Customers Choose {businessName || 'Us'}
        </h4>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {reasons
            .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
            .map((reason, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontWeight: 500, color: '#374151' }}>
                    {reason.reason}
                  </span>
                  {reason.linkedDifferentiator && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3'
                    }}>
                      Linked to {reason.linkedDifferentiator}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        width: `${reason.frequency || 0}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', minWidth: '35px' }}>
                    {reason.frequency || 0}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isGenerating || isRegenerating) {
    return (
      <div className="competitive-advantage-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        margin: '2rem 0'
      }}>
        <Loader size={32} className="spinner" />
        <h3 style={{ margin: '1rem 0 0.5rem', color: '#374151' }}>
          Analyzing Your Competitive Advantages
        </h3>
        <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: '500px' }}>
          We're evaluating your differentiators, market position, and competitive strengths...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !competitiveAdvantageData) {
    return (
      <div className="competitive-advantage-error" style={{
        padding: '2rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '2rem 0'
      }}>
        <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>
          Unable to Generate Competitive Advantage Analysis
        </h3>
        <p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>
          {error}
        </p>
        <button
          onClick={handleRegenerate}
          disabled={!canRegenerate}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: canRegenerate ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} />
          Retry Analysis
        </button>
      </div>
    );
  }

  // UPDATED: No data state - only show manual generate button when appropriate
  if (!competitiveAdvantageData || !competitiveAdvantageData.competitiveAdvantage) {
    const hasAnswers = questions.some(q => userAnswers[q._id] && userAnswers[q._id].trim() && userAnswers[q._id] !== '[Question Skipped]');
    
    return (
      <div className="competitive-advantage-empty" style={{
        padding: '2rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        textAlign: 'center',
        margin: '2rem 0'
      }}>
        <Shield size={48} style={{ color: '#6b7280', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#374151', marginBottom: '1rem' }}>
          Competitive Advantage Analysis
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          {hasAnswers 
            ? 'This analysis will be generated automatically when you complete the essential phase.'
            : 'Complete more questions to unlock your competitive advantage analysis.'
          }
        </p>
        {/* REMOVED: Manual generate button to prevent unwanted API calls */}
        {/* Users should only get this analysis through the phase completion flow */}
      </div>
    );
  }

  const { competitiveAdvantage } = competitiveAdvantageData;

  return (
    <div className="competitive-advantage-analysis" style={{ margin: '2rem 0' }}>
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`} style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          backgroundColor: showToast.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: showToast.type === 'success' ? '#166534' : '#991b1b',
          zIndex: 1000
        }}>
          {showToast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} />
            Competitive Advantage Matrix
          </h3>
          <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
            Analysis of your competitive differentiators and market position
          </p>
        </div>

        {canRegenerate && (
          <button
            onClick={handleRegenerate}
            disabled={isGenerating || isRegenerating}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isGenerating || isRegenerating ? '#f3f4f6' : '#8b5cf6',
              color: isGenerating || isRegenerating ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isGenerating || isRegenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isGenerating || isRegenerating ? (
              <>
                <Loader size={16} className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Regenerate
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="competitive-advantage-content">
        {/* Scatter Plot */}
        {competitiveAdvantage.differentiators && (
          renderScatterPlot(competitiveAdvantage.differentiators)
        )}

        {/* Competitive Position */}
        {competitiveAdvantage.competitivePosition && (
          renderCompetitivePosition(competitiveAdvantage.competitivePosition)
        )}

        {/* Differentiators List */}
        {competitiveAdvantage.differentiators && (
          renderDifferentiatorsList(competitiveAdvantage.differentiators)
        )}

        {/* Customer Choice Reasons */}
        {competitiveAdvantage.customerChoiceReasons && (
          renderCustomerChoiceReasons(competitiveAdvantage.customerChoiceReasons)
        )}
      </div> 
    </div>
  );
};

export default CompetitiveAdvantageMatrix;