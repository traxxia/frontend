import React, { useState, useEffect, useRef } from 'react';
import { Heart, TrendingUp, Users, Calendar, Loader, Target, Award, BarChart3 } from 'lucide-react'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const LoyaltyNPS = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  loyaltyNPSData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [loyaltyData, setLoyaltyData] = useState(loyaltyNPSData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add refs to track component mount
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.loyaltyNPS; 
    
    await checkMissingQuestionsAndRedirect(
      'loyaltyNPS', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the loyalty data is empty/incomplete
  const isLoyaltyDataIncomplete = (data) => {
    if (!data) return true;

    // Check if essential fields are missing or null
    if (data.overallScore === null || data.overallScore === undefined) return true;
    if (!data.method) return true;
    if (!data.scale) return true;

    // Check if scale object has required properties
    if (!data.scale.min && data.scale.min !== 0) return true;
    if (!data.scale.max) return true;

    return false;
  };

  // Check if analysis failed (all required questions answered but data is incomplete)
  const isAnalysisFailed = async () => {
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
            analysis_type: 'loyaltyNPS',
            business_id: selectedBusinessId
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        // If no missing questions but data is incomplete, it's an analysis failure
        return result.missing_count === 0 && isLoyaltyDataIncomplete(loyaltyData);
      }
      return false;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return false;
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setLoyaltyData(null);
      setError(null);
    }
  };

  // Update loyalty data when prop changes
  useEffect(() => {
    if (loyaltyNPSData && loyaltyNPSData !== loyaltyData) {
      setLoyaltyData(loyaltyNPSData);
      if (onDataGenerated) {
        onDataGenerated(loyaltyNPSData);
      }
    }
  }, [loyaltyNPSData]);

  // Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (loyaltyNPSData) {
      setLoyaltyData(loyaltyNPSData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

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
      <div className="gauge-wrapper">
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

  // Check if data is incomplete and show missing questions checker
  if (!loyaltyData || isLoyaltyDataIncomplete(loyaltyData)) {
    return (
      <div className="loyalty-nps"> 

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="loyaltyNPS"
          analysisDisplayName="Loyalty & NPS Analysis"
          icon={Heart}
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

  const classification = getScoreClassification(loyaltyData.overallScore, loyaltyData.method);
  const trendIndicator = getTrendIndicator(loyaltyData.trend);

  return (
    <div className="loyalty-nps" data-analysis-type="loyalty-nps"
      data-analysis-name="Loyalty & NPS Analysis"
      data-analysis-order="4"> 

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
      </div>
    </div>
  );
};

export default LoyaltyNPS;