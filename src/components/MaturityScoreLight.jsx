import React, { useState, useEffect } from 'react';
import { Loader,RefreshCw, Award, BarChart3, TrendingUp, Target, CheckCircle, AlertCircle } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import "../styles/EssentialPhase.css";

const MaturityScore = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  maturityData = null
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  const generateMaturityScore = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id] && userAnswers[q._id].trim() && userAnswers[q._id] !== '[Question Skipped]')
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for maturity analysis');
      }

      console.log('🚀 Calling Maturity Score API with:', {
        questionsCount: questionsArray.length,
        answersCount: answersArray.length
      });

      const response = await fetch(`${ML_API_BASE_URL}/maturity-score`, {
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
        console.error('❌ Maturity Score API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Maturity Score API Response:', result);

      return result;

    } catch (error) {
      console.error('💥 Error generating maturity score:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const hasAnswers = questions.some(q => userAnswers[q._id] && userAnswers[q._id].trim());

    console.log('🔍 Maturity Score useEffect triggered:', {
      hasAnswers,
      hasMaturityData: !!maturityData,
      isGenerating,
      isRegenerating
    });

    if (!maturityData && hasAnswers && !isGenerating && !isRegenerating) {
      console.log('✅ Auto-generating maturity score...');
      generateMaturityScore();
    }
  }, [questions, userAnswers, maturityData]);

  const handleRegenerate = async () => {
    console.log('🔄 Maturity Score Regenerate triggered');
    
    if (onRegenerate) {
      console.log('🎯 Calling parent onRegenerate function');
      onRegenerate();
    } else {
      console.log('🔧 Calling local generateMaturityScore function');
      await generateMaturityScore();
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#10b981'; // Green
    if (score >= 3) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getLevelColor = (level) => {
    const levelMap = {
      'Initial': '#ef4444',
      'Developing': '#f59e0b', 
      'Defined': '#3b82f6',
      'Managed': '#10b981',
      'Optimized': '#8b5cf6'
    };
    return levelMap[level] || '#6b7280';
  };

  // Loading state
  if (isGenerating || isRegenerating) {
    return (
      <div className="maturity-score">
        <div className="loading-state">
          <Loader size={32} className="spinner" />
          <h3>Calculating Business Maturity</h3>
          <p>Analyzing maturity across key business dimensions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !maturityData) {
    return (
      <div className="maturity-score">
        <div className="error-state">
          <h3>Unable to Generate Maturity Score</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} disabled={!canRegenerate} className="btn-retry">
            <RefreshCw size={16} />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!maturityData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="maturity-score">
        <div className="ms-header">
          <div className="ms-title-section">
            <Award size={24} />
            <h2 className="ms-title">Business Maturity Score</h2>
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Business Maturity Score"
            size="medium"
            buttonText="Generate"
          />
        </div>

        <div className="empty-state">
          <Award size={48} />
          <h3>Business Maturity Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate your maturity analysis.`
              : "Business maturity analysis will be generated automatically after completing the essential phase."
            }
          </p>
        </div>
      </div>
    );
  }

  const { 
    overallScore, 
    level, 
    components = {}, 
    maturityProfile, 
    strengths = [], 
    developmentAreas = [],
    nextLevel
  } = maturityData;

  return (
    <div className="maturity-score">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-title-section">
          <Award size={24} />
          <h2 className="ms-title">Business Maturity Score</h2>
          {businessName && <p className="business-name">{businessName}</p>}
        </div>
        {canRegenerate && (
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Business Maturity Score"
            size="medium"
          />
        )}
      </div>

      {/* Content */}
      <div className="maturity-content">
        {/* Overall Score Section */}
        <div className="section overall-section">
          <div className="gauge-container">
            <div className="gauge-chart">
              <svg viewBox="0 0 200 120" className="gauge-svg">
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  className="gauge-bg"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="12"
                  strokeDasharray={`${(overallScore / 5) * 251.3} 251.3`}
                  strokeLinecap="round"
                  className="gauge-progress"
                />
              </svg>
              <div className="gauge-content">
                <div className="score-display">
                  <span className="score-number">{overallScore}</span>
                  <span className="score-max">/5.0</span>
                </div>
                <div className="score-level" style={{ color: getLevelColor(level) }}>
                  {level}
                </div>
                {maturityProfile && (
                  <div className="maturity-profile">{maturityProfile}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Components Grid */}
        {Object.keys(components).length > 0 && (
          <div className="section components-section">
            <h3>
              <BarChart3 size={20} />
              Maturity by Business Area
            </h3>
            <div className="components-grid">
              {Object.entries(components).map(([component, score]) => (
                <div key={component} className="component-item">
                  <div className="component-header">
                    <span className="component-name">
                      {component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span 
                      className="component-score"
                      style={{ color: getScoreColor(score) }}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="component-bar">
                    <div 
                      className="component-fill"
                      style={{ 
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: getScoreColor(score)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Row */}
        <div className="section-row">
          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="section strengths-section">
              <h3>
                <CheckCircle size={20} />
                Key Strengths
              </h3>
              <ul className="insights-list">
                {strengths.map((strength, index) => (
                  <li key={index} className="insight-item strength">
                    <CheckCircle size={16} />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Development Areas */}
          {developmentAreas.length > 0 && (
            <div className="section development-section">
              <h3>
                <AlertCircle size={20} />
                Development Areas
              </h3>
              <ul className="insights-list">
                {developmentAreas.map((area, index) => (
                  <li key={index} className="insight-item development">
                    <AlertCircle size={16} />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Next Level Section */}
        {nextLevel && (
          <div className="section next-level-section">
            <h3>
              <Target size={20} />
              Path to {nextLevel.target}
            </h3>
            <div className="next-level-content">
              {nextLevel.estimatedTimeframe && (
                <div className="timeframe">
                  <TrendingUp size={16} />
                  <span>Estimated Timeframe: {nextLevel.estimatedTimeframe}</span>
                </div>
              )}
              {nextLevel.requirements && nextLevel.requirements.length > 0 && (
                <div className="requirements">
                  <h4>Key Requirements</h4>
                  <ul className="requirements-list">
                    {nextLevel.requirements.map((requirement, index) => (
                      <li key={index} className="requirement-item">
                        <Target size={14} />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaturityScore;