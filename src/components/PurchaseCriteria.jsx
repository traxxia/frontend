import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, Star, Calendar, Loader, BarChart3, Zap, RefreshCw } from 'lucide-react';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useAnalysisStore } from "../store";
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const PurchaseCriteria = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  purchaseCriteriaData: propPurchaseCriteriaData = null,
  selectedBusinessId,
  onRedirectToBrief,
  hideImproveButton = false,
}) => {
  const { t } = useTranslation();
  const token = useAuthStore(state => state.token);
  
  const {
    purchaseCriteriaData: storePurchaseCriteriaData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();

  const criteriaDataRaw = propPurchaseCriteriaData || storePurchaseCriteriaData;
  const isRegenerating = propIsRegenerating || isTypeRegenerating('purchaseCriteria');

  const [error, setError] = useState(null);

  const PERFORMANCE_COLORS = {
    excellent: '#10B981',
    good: '#06B6D4',
    average: '#F59E0B',
    poor: '#EF4444'
  };

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.purchaseCriteria;
    await checkMissingQuestionsAndRedirect(
      'purchaseCriteria',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isCriteriaDataIncomplete = (data) => {
    if (!data) return true;
    let normalizedData = data.purchaseCriteria || data.purchase_criteria || (data.criteria ? data : null);
    if (!normalizedData || !normalizedData.criteria || normalizedData.criteria.length === 0) return true;
    const criticalFields = ['scale', 'overallAlignment'];
    return criticalFields.some(field => normalizedData[field] === null || normalizedData[field] === undefined);
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in PurchaseCriteria regeneration:', error);
        setError(error.message || 'Failed to regenerate analysis');
      }
    } else {
      setError(null);
      await regenerateIndividualAnalysis('purchaseCriteria', questions, userAnswers, selectedBusinessId);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleRegenerate();
  };

  const normalizedData = criteriaDataRaw ? (criteriaDataRaw.purchaseCriteria || criteriaDataRaw.purchase_criteria || (criteriaDataRaw.criteria ? criteriaDataRaw : null)) : null;

  const createRadarChart = () => {
    if (!normalizedData?.criteria) return { points: '', viewBox: '0 0 240 240' };
    const center = 120;
    const radius = 70;
    const criteria = normalizedData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;
    const points = criteria.map((criterion, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = criterion.selfRating / normalizedData.scale.max;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    return { points, viewBox: '0 0 240 240' };
  };

  const createRadarGrid = () => {
    if (!normalizedData?.criteria) return [];
    const center = 120;
    const radius = 70;
    const criteria = normalizedData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;
    const gridLines = [];
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

    levels.forEach((level, levelIndex) => {
      const points = criteria.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = center + radius * level * Math.cos(angle);
        const y = center + radius * level * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      gridLines.push(<polygon key={`level-${levelIndex}`} points={points} fill="none" stroke="#e5e7eb" strokeWidth="1" opacity={0.6} />);
    });

    criteria.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      gridLines.push(<line key={`radial-${index}`} x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" opacity={0.6} />);
    });
    return gridLines;
  };

  const createRadarLabels = () => {
    if (!normalizedData?.criteria) return [];
    const center = 120;
    const radius = 70;
    const labelOffset = 20;
    const criteria = normalizedData.criteria;
    const angleStep = (2 * Math.PI) / criteria.length;

    return criteria.map((criterion, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + (radius + labelOffset) * Math.cos(angle);
      const y = center + (radius + labelOffset) * Math.sin(angle);
      let textAnchor = "middle";
      const cos = Math.cos(angle);
      if (cos > 0.3) textAnchor = "start";
      else if (cos < -0.3) textAnchor = "end";

      const words = criterion.name.split(' ');
      const lines = [];
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        if ((currentLine + " " + words[i]).length > 12) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine += " " + words[i];
        }
      }
      lines.push(currentLine);

      return (
        <text key={`label-${index}`} x={x} y={y} textAnchor={textAnchor} dominantBaseline="middle" className="radar-label" fontSize="9" fill="#374151">
          {lines.map((line, i) => (<tspan key={i} x={x} dy={i === 0 ? `${-(lines.length - 1) * 0.5}em` : "1.1em"}>{line}</tspan>))}
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

  if (isRegenerating) {
    return (
      <div className="purchase-criteria">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating purchase criteria analysis...</span>
        </div>
      </div>
    );
  }

  if (error || (isCriteriaDataIncomplete(normalizedData) && Object.keys(userAnswers).length > 0)) {
    return (
      <div className="purchase-criteria">
        <AnalysisEmptyState
          analysisType="purchaseCriteria"
          analysisDisplayName="Purchase Criteria Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showImproveButton={false}
          showRegenerateButton={false}
        />
      </div>
    );
  }

  const radarData = createRadarChart();

  return (
    <div className="purchase-criteria"
      data-analysis-type="purchase-criteria"
      data-analysis-name="Purchase Criteria Matrix"
      data-analysis-order="2">

      <div className="pc-metrics">
        <div className="pc-metric-card pc-metric-blue">
          <div className="pc-metric-header">
            <BarChart3 size={20} />
            <span>{t("total_criteria")}</span>
          </div>
          <p className="pc-metric-value">{normalizedData?.criteria?.length || 0}</p>
        </div>

        {normalizedData?.overallAlignment && (
          <div className="pc-metric-card pc-metric-green">
            <div className="pc-metric-header">
              <Star size={20} />
              <span>{t("overall_alignment")}</span>
            </div>
            <p className="pc-metric-value">{normalizedData.overallAlignment.toFixed(1)}</p>
          </div>
        )}

        <div className="pc-metric-card pc-metric-purple">
          <div className="pc-metric-header">
            <Zap size={20} />
            <span>{t("top_performer")}</span>
          </div>
          <p className="pc-metric-value">
            {normalizedData?.criteria?.reduce((max, criterion) =>
              criterion.selfRating > max.selfRating ? criterion : max,
              normalizedData.criteria[0]
            )?.name || 'N/A'}
          </p>
        </div>
      </div>

      <div className="pc-charts">
        <div className="pc-chart-container">
          <h3 className="pc-chart-title">{t("criteria_performance")}</h3>
          <div className="radar-chart-wrapper">
            <svg className="radar-chart" viewBox={radarData.viewBox}>
              {createRadarGrid()}
              <polygon
                points={radarData.points}
                fill="rgba(79, 70, 229, 0.2)"
                stroke="#4F46E5"
                strokeWidth="2"
                className="radar-data"
              />
              {normalizedData?.criteria?.map((criterion, index) => {
                const center = 120;
                const radius = 70;
                const angleStep = (2 * Math.PI) / normalizedData.criteria.length;
                const angle = index * angleStep - Math.PI / 2;
                const value = criterion.selfRating / normalizedData.scale.max;
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
              {createRadarLabels()}
            </svg>
          </div>
        </div>

        <div className="pc-chart-container">
          <h3 className="pc-chart-title">{t("criteria_performance")}</h3>
          <div className="criteria-bars">
            {normalizedData?.criteria?.map((criterion, index) => (
              <div key={index} className="criteria-bar-item">
                <div className="criteria-bar-header">
                  <span className="criteria-name">{criterion.name}</span>
                  <span className="criteria-rating">{criterion.selfRating}/{normalizedData.scale.max}</span>
                </div>
                <div className="criteria-bar-container">
                  <div
                    className="criteria-bar-fill"
                    style={{
                      width: `${(criterion.selfRating / normalizedData.scale.max) * 100}%`,
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