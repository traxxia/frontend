import React, { useState, useEffect, useRef } from 'react';
import { Heart, TrendingUp, Users, Calendar, Loader, Target, Award, BarChart3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import { useTranslation } from "../hooks/useTranslation";

const LoyaltyNPS = ({ 
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}) => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
   const { t } = useTranslation();
  
  // Add refs to track if API call is in progress or has been made
  const isGeneratingRef = useRef(false);
  const hasGeneratedRef = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  const generateLoyaltyData = async () => {
    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) {
      console.log('Loyalty API call already in progress, skipping...');
      return;
    }

    try {
      isGeneratingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Prepare questions and answers arrays
      const questionsArray = [];
      const answersArray = [];

      // Sort questions by ID to maintain order
      const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
      
      // Only include answered questions
      sortedQuestions.forEach(question => {
        if (userAnswers[question.id]) {
          // Clean and sanitize text to avoid encoding issues
          const cleanQuestion = String(question.question)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();
            
          const cleanAnswer = String(userAnswers[question.id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();
            
          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for loyalty analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      console.log('Sending to /loyalty-metrics API:', payload);

      const response = await fetch(`${ML_API_BASE_URL}/loyalty-metrics`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = `API returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = `API Error: ${errorData.detail}`;
          }
        } catch (e) {
          errorMessage = `API Error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from API');
      }

      if (result && result.loyaltyMetrics) {
        console.log('Setting loyalty data:', result.loyaltyMetrics);
        setLoyaltyData(result.loyaltyMetrics);
        hasGeneratedRef.current = true;
        if (onDataGenerated) {
          onDataGenerated(result.loyaltyMetrics);
        }
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from API');
      }

    } catch (error) {
      console.error('Error generating loyalty analysis:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    hasGeneratedRef.current = false; // Reset the flag to allow regeneration
    if (onRegenerate) {
      // Use parent's regeneration logic
      onRegenerate();
    } else {
      // Use local regeneration logic
      setLoyaltyData(null);
      await generateLoyaltyData();
    }
  };

  // Auto-generate on mount if we have enough data
  useEffect(() => {
    const answeredCount = Object.keys(userAnswers).length;
    
    // Only generate if:
    // 1. We have enough answers
    // 2. We don't already have loyalty data
    // 3. We're not currently loading
    // 4. We haven't already generated data (to prevent multiple calls)
    // 5. We're not in the middle of regenerating
    if (answeredCount >= 3 && 
        !loyaltyData && 
        !isLoading && 
        !hasGeneratedRef.current && 
        !isRegenerating) {
      generateLoyaltyData();
    }
  }, [userAnswers, questions, loyaltyData, isLoading, isRegenerating]);

  // Get score classification based on NPS zones
  const getScoreClassification = (score, method = 'NPS') => {
    if (method === 'NPS') {
      if (score >= 50) return { label: 'Excellent', color: '#10B981', zone: 'promoters' };
      if (score >= 30) return { label: 'Good', color: '#06B6D4', zone: 'promoters' };
      if (score >= 0) return { label: 'Okay', color: '#F59E0B', zone: 'passives' };
      return { label: 'Needs Work', color: '#EF4444', zone: 'detractors' };
    } else if (method === 'CSAT') {
      if (score >= 80) return { label: 'Excellent', color: '#10B981', zone: 'satisfied' };
      if (score >= 70) return { label: 'Good', color: '#06B6D4', zone: 'satisfied' };
      if (score >= 60) return { label: 'Average', color: '#F59E0B', zone: 'neutral' };
      return { label: 'Poor', color: '#EF4444', zone: 'dissatisfied' };
    }
    // Default for other methods
    if (score >= 80) return { label: 'Excellent', color: '#10B981', zone: 'high' };
    if (score >= 60) return { label: 'Good', color: '#06B6D4', zone: 'medium' };
    if (score >= 40) return { label: 'Average', color: '#F59E0B', zone: 'medium' };
    return { label: 'Poor', color: '#EF4444', zone: 'low' };
  };

  // Create gauge chart SVG
  const createGaugeChart = () => {
    if (!loyaltyData) return null;

    const { overallScore, method, scale } = loyaltyData;
    const classification = getScoreClassification(overallScore, method);
    
    // Normalize score to 0-1 range for gauge
    const normalizedScore = method === 'NPS' 
      ? (overallScore + 100) / 200  // NPS is -100 to 100
      : overallScore / 100;         // CSAT and others are 0 to 100
    
    const radius = 80;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference * 0.75; // 3/4 circle
    const strokeDashoffset = strokeDasharray * (1 - normalizedScore);
    
    // Calculate zones for NPS
    let zones = [];
    if (method === 'NPS' && scale?.zones) {
      zones = [
        { name: 'Detractors', range: scale.zones.detractors, color: '#EF4444', start: 0, end: 0.5 },
        { name: 'Passives', range: scale.zones.passives, color: '#F59E0B', start: 0.5, end: 0.65 },
        { name: 'Promoters', range: scale.zones.promoters, color: '#10B981', start: 0.65, end: 1 }
      ];
    }

    return (
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 30 100 A 80 80 0 0 1 170 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Zone arcs for NPS */}
          {zones.map((zone, index) => {
            const zoneLength = strokeDasharray * (zone.end - zone.start);
            const zoneOffset = strokeDasharray * (1 - zone.end);
            return (
              <path
                key={index}
                d="M 30 100 A 80 80 0 0 1 170 100"
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth - 2}
                strokeLinecap="round"
                strokeDasharray={`${zoneLength} ${circumference}`}
                strokeDashoffset={zoneOffset}
                opacity={0.3}
              />
            );
          })}
          
          {/* Score arc */}
          <path
            d="M 30 100 A 80 80 0 0 1 170 100"
            fill="none"
            stroke={classification.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="gauge-progress"
          />
          
          {/* Center score */}
          <text x="100" y="85" textAnchor="middle" className="gauge-score">
            {overallScore}
          </text>
          <text x="100" y="100" textAnchor="middle" className="gauge-label">
            {classification.label}
          </text>
        </svg>
        
        {/* Scale labels */}
        <div className="gauge-scale">
          <span className="gauge-scale-min">{scale?.min || 0}</span>
          <span className="gauge-scale-max">{scale?.max || 100}</span>
        </div>
      </div>
    );
  };

  // Create Score Interpretation component
  const createScoreInterpretation = () => {
    if (!loyaltyData?.scale) return null;

    return (
      <div className="ln-scale-info">
        <h3 className="ln-section-title">Score Interpretation</h3>
        <div className="ln-scale-zones">
          {loyaltyData.method === 'NPS' && loyaltyData.scale.zones && (
            <>
              <div className="ln-zone-card detractors">
                <div className="ln-zone-indicator"></div>
                <div className="ln-zone-content">
                  <h4>Detractors ({loyaltyData.scale.zones.detractors[0]} to {loyaltyData.scale.zones.detractors[1]})</h4>
                  <p>Customers unlikely to recommend and may discourage others</p>
                </div>
              </div>
              <div className="ln-zone-card passives">
                <div className="ln-zone-indicator"></div>
                <div className="ln-zone-content">
                  <h4>Passives ({loyaltyData.scale.zones.passives[0]} to {loyaltyData.scale.zones.passives[1]})</h4>
                  <p>Satisfied but not enthusiastic customers</p>
                </div>
              </div>
              <div className="ln-zone-card promoters">
                <div className="ln-zone-indicator"></div>
                <div className="ln-zone-content">
                  <h4>Promoters ({loyaltyData.scale.zones.promoters[0]} to {loyaltyData.scale.zones.promoters[1]})</h4>
                  <p>Loyal enthusiasts who will refer others and fuel growth</p>
                </div>
              </div>
            </>
          )}
          
          {loyaltyData.method !== 'NPS' && (
            <div className="ln-scale-range">
              <span>Scale: {loyaltyData.scale.min} to {loyaltyData.scale.max}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get trend indicator
  const getTrendIndicator = (trend) => {
    switch (trend) {
      case 'improving':
        return { icon: TrendingUp, color: '#10B981', label: 'Improving', rotation: 0 };
      case 'declining':
        return { icon: TrendingUp, color: '#EF4444', label: 'Declining', rotation: 180 };
      case 'stable':
        return { icon: Target, color: '#06B6D4', label: 'Stable', rotation: 0 };
      default:
        return { icon: Target, color: '#6B7280', label: 'No Data', rotation: 0 };
    }
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="loyalty-nps">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating 
              ? t("Regenerating loyalty & NPS analysis...")
              : t("Generating loyalty & NPS analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loyalty-nps">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            hasGeneratedRef.current = false;
            generateLoyaltyData();
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="loyalty-nps">
        <div className="empty-state">
          <Heart size={48} className="empty-icon" />
          <h3>Loyalty & NPS Analysis</h3>
           
          <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Capability Heatmap"
          size="medium"
        />
        </div>
      </div>
    );
  }

  const classification = getScoreClassification(loyaltyData.overallScore, loyaltyData.method);
  const trendIndicator = getTrendIndicator(loyaltyData.trend);

  return (
    <div className="loyalty-nps">
      {/* Header with regenerate button */}
      <div className="ln-header">
        <div className="ln-title-section">
          <Heart className="ln-icon" size={24} />
          <h2 className="ln-title">{t("Loyalty & NPS Score")}</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Capability Heatmap"
          size="medium"
        />
      </div>
       
      {/* Key Metrics */}
      <div className="ln-metrics">
        <div className="ln-metric-card ln-metric-primary">
          <div className="ln-metric-header">
            <Award size={20} />
            <span>{loyaltyData.method} Score</span>
          </div>
          <p className="ln-metric-value" style={{ color: classification.color }}>
            {loyaltyData.overallScore}
          </p>
          <p className="ln-metric-label">{classification.label}</p>
        </div>

        {loyaltyData.benchmark && (
          <div className="ln-metric-card ln-metric-secondary">
            <div className="ln-metric-header">
              <BarChart3 size={20} />
              <span>Industry Benchmark</span>
            </div>
            <p className="ln-metric-value">{loyaltyData.benchmark}</p>
            {/* <p className="ln-metric-comparison">
              {loyaltyData.overallScore > loyaltyData.benchmark ? (
                <span className="positive">+{loyaltyData.overallScore - loyaltyData.benchmark} above</span>
              ) : (
                <span className="negative">{loyaltyData.overallScore - loyaltyData.benchmark} below</span>
              )}
            </p> */}
          </div>
        )}

        {loyaltyData.trend && (
          <div className="ln-metric-card ln-metric-accent">
            <div className="ln-metric-header">
              <trendIndicator.icon 
                size={20} 
                style={{ 
                  color: trendIndicator.color,
                  transform: `rotate(${trendIndicator.rotation}deg)`
                }} 
              />
              <span>Trend</span>
            </div>
            <p className="ln-metric-value" style={{ color: trendIndicator.color }}>
              {trendIndicator.label}
            </p>
          </div>
        )}

        {/* Measurement Method */}
        <div className="ln-metric-card ln-metric-secondary">
          <div className="ln-metric-header">
            <Target size={20} />
            <span>Method</span>
          </div>
          <p className="ln-metric-value">{loyaltyData.method}</p>
          <p className="ln-metric-label">
            {loyaltyData.method === 'NPS' && 'Net Promoter Score'}
            {loyaltyData.method === 'CSAT' && 'Customer Satisfaction'}
            {loyaltyData.method === 'retention_rate' && 'Retention Rate'}
          </p>
        </div>

        {/* Last Measured */}
        {loyaltyData.lastMeasured && (
          <div className="ln-metric-card ln-metric-accent">
            <div className="ln-metric-header">
              <Calendar size={20} />
              <span>Last Measured</span>
            </div>
            <p className="ln-metric-value">{loyaltyData.lastMeasured}</p>
            <p className="ln-metric-label">Latest Update</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="ln-content">
        {/* Gauge Chart with Score Interpretation below it */}
        <div className="ln-chart-container">
          <h3 className="ln-section-title">Overall {loyaltyData.method} Score</h3>
          {createGaugeChart()}
           
          {/* Score Interpretation - moved here, directly below the chart */}
          {createScoreInterpretation()}
        </div>

        {/* Segment Scores */}
        {loyaltyData.segmentScores && loyaltyData.segmentScores.length > 0 && (
          <div className="ln-segments-container">
            <h3 className="ln-section-title">Score by Customer Segment</h3>
            <div className="ln-segments">
              {loyaltyData.segmentScores.map((segment, index) => {
                const segmentClassification = getScoreClassification(segment.score, loyaltyData.method);
                const maxScore = Math.max(...loyaltyData.segmentScores.map(s => s.score));
                const percentage = (segment.score / maxScore) * 100;
                
                return (
                  <div key={index} className="ln-segment-card">
                    <div className="ln-segment-header">
                      <h4 className="ln-segment-name">{segment.segment}</h4>
                      <span 
                        className="ln-segment-score"
                        style={{ color: segmentClassification.color }}
                      >
                        {segment.score}
                      </span>
                    </div>
                    <div className="ln-segment-bar-container">
                      <div 
                        className="ln-segment-bar"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: segmentClassification.color
                        }}
                      ></div>
                    </div>
                    <div className="ln-segment-classification">
                      <span 
                        className="ln-classification-badge"
                        style={{ 
                          backgroundColor: `${segmentClassification.color}20`,
                          color: segmentClassification.color
                        }}
                      >
                        {segmentClassification.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyNPS;