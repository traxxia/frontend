import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, Star, Calendar, Loader, BarChart3, Zap, RefreshCw } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";

const PurchaseCriteria = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  purchaseCriteriaData = null
}) => {
  const [criteriaData, setCriteriaData] = useState(purchaseCriteriaData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add refs to track component mount
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  // Colors for different performance levels
  const PERFORMANCE_COLORS = {
    excellent: '#10B981', // Green
    good: '#06B6D4',      // Blue
    average: '#F59E0B',   // Orange
    poor: '#EF4444'       // Red
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setCriteriaData(null);
      setError(null);
    }
  };

  // Update criteria data when prop changes
  useEffect(() => {
    if (purchaseCriteriaData && purchaseCriteriaData !== criteriaData) {
      setCriteriaData(purchaseCriteriaData);
      if (onDataGenerated) {
        onDataGenerated(purchaseCriteriaData);
      }
    }
  }, [purchaseCriteriaData]);

  // Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (purchaseCriteriaData) {
      setCriteriaData(purchaseCriteriaData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Create radar chart points
  const createRadarChart = () => {
    if (!criteriaData?.criteria) return { points: '', viewBox: '0 0 200 200' };

    const center = 100;
    const radius = 70;
    const criteria = criteriaData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;

    const points = criteria.map((criterion, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const value = criterion.selfRating / criteriaData.scale.max;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return { points, viewBox: '0 0 200 200' };
  };

  // Create radar chart grid lines
  const createRadarGrid = () => {
    if (!criteriaData?.criteria) return [];

    const center = 100;
    const radius = 70;
    const criteria = criteriaData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;

    const gridLines = [];
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Concentric polygons
    levels.forEach((level, levelIndex) => {
      const points = criteria.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = center + radius * level * Math.cos(angle);
        const y = center + radius * level * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');

      gridLines.push(
        <polygon
          key={`level-${levelIndex}`}
          points={points}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity={0.6}
        />
      );
    });

    // Radial lines
    criteria.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      gridLines.push(
        <line
          key={`radial-${index}`}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity={0.6}
        />
      );
    });

    return gridLines;
  };

  // Create radar chart labels
  const createRadarLabels = () => {
    if (!criteriaData?.criteria) return [];

    const center = 100;
    const radius = 85;
    const criteria = criteriaData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;

    return criteria.map((criterion, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      return (
        <text
          key={`label-${index}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="radar-label"
          fontSize="10"
          fill="#374151"
        >
          {criterion.name}
        </text>
      );
    });
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 8) return PERFORMANCE_COLORS.excellent;
    if (rating >= 6) return PERFORMANCE_COLORS.good;
    if (rating >= 4) return PERFORMANCE_COLORS.average;
    return PERFORMANCE_COLORS.poor;
  };

  const getPerformanceLabel = (rating) => {
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Average';
    return 'Needs Improvement';
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="purchase-criteria">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating purchase criteria analysis...")
              : t("Generating purchase criteria analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-criteria">
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

  if (!criteriaData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="purchase-criteria">
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <h3>Purchase Criteria Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate purchase criteria insights.`
              : "Purchase criteria analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  const radarData = createRadarChart();

  return (
    <div className="purchase-criteria">
      {/* Header with regenerate button - Updated to match CapabilityHeatmap style */}
      <div className="pc-header">
        <div className="pc-title-section">
          <Target className="pc-icon" size={24} />
          <h2 className="pc-title">{t("Purchase Criteria Matrix")}</h2>
        </div>

        {/* Updated Regenerate Button to use RegenerateButton component */}
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Purchase Criteria"
          size="medium"
        />
      </div>

      {/* Key Metrics */}
      <div className="pc-metrics">
        <div className="pc-metric-card pc-metric-blue">
          <div className="pc-metric-header">
            <BarChart3 size={20} />
            <span>Total Criteria</span>
          </div>
          <p className="pc-metric-value">{criteriaData.criteria?.length || 0}</p>
        </div>

        {criteriaData.overallAlignment && (
          <div className="pc-metric-card pc-metric-green">
            <div className="pc-metric-header">
              <Star size={20} />
              <span>Overall Alignment</span>
            </div>
            <p className="pc-metric-value">{criteriaData.overallAlignment.toFixed(1)}/10</p>
          </div>
        )}

        <div className="pc-metric-card pc-metric-purple">
          <div className="pc-metric-header">
            <Zap size={20} />
            <span>Top Performer</span>
          </div>
          <p className="pc-metric-value">
            {criteriaData.criteria?.reduce((max, criterion) =>
              criterion.selfRating > max.selfRating ? criterion : max,
              criteriaData.criteria[0]
            )?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="pc-charts">
        {/* Radar Chart */}
        <div className="pc-chart-container">
          <h3 className="pc-chart-title">Performance Radar</h3>
          <div className="radar-chart-wrapper">
            <svg className="radar-chart" viewBox={radarData.viewBox}>
              {/* Grid */}
              {createRadarGrid()}

              {/* Data polygon */}
              <polygon
                points={radarData.points}
                fill="rgba(79, 70, 229, 0.2)"
                stroke="#4F46E5"
                strokeWidth="2"
                className="radar-data"
              />

              {/* Data points */}
              {criteriaData.criteria?.map((criterion, index) => {
                const center = 100;
                const radius = 70;
                const angleStep = (2 * Math.PI) / criteriaData.criteria.length;
                const angle = index * angleStep - Math.PI / 2;
                const value = criterion.selfRating / criteriaData.scale.max;
                const x = center + radius * value * Math.cos(angle);
                const y = center + radius * value * Math.sin(angle);

                return (
                  <circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={getPerformanceColor(criterion.selfRating)}
                    stroke="white"
                    strokeWidth="2"
                    className="radar-point"
                  />
                );
              })}

              {/* Labels */}
              {createRadarLabels()}
            </svg>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="pc-chart-container">
          <h3 className="pc-chart-title">Criteria Performance</h3>
          <div className="criteria-bars">
            {criteriaData.criteria?.map((criterion, index) => (
              <div key={index} className="criteria-bar-item">
                <div className="criteria-bar-header">
                  <span className="criteria-name">{criterion.name}</span>
                  <span className="criteria-rating">{criterion.selfRating}/{criteriaData.scale.max}</span>
                </div>
                <div className="criteria-bar-container">
                  <div
                    className="criteria-bar-fill"
                    style={{
                      width: `${(criterion.selfRating / criteriaData.scale.max) * 100}%`,
                      backgroundColor: getPerformanceColor(criterion.selfRating)
                    }}
                  ></div>
                </div>
                <div className="criteria-bar-footer">
                  <span className="performance-label" style={{ color: getPerformanceColor(criterion.selfRating) }}>
                    {getPerformanceLabel(criterion.selfRating)}
                  </span>
                  {criterion.gap !== undefined && (
                    <span className={`gap-indicator ${criterion.gap >= 0 ? 'positive' : 'negative'}`}>
                      Gap: {criterion.gap > 0 ? '+' : ''}{criterion.gap}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCriteria;