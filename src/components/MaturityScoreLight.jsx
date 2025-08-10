import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BarChart3, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Cog, 
  Star, 
  Zap, 
  Loader 
} from 'lucide-react';
import RegenerateButton from './RegenerateButton'; 

const MaturityScore = ({ 
  maturityData = null,
  businessName = '',
  isRegenerating = false,
  canRegenerate = true,
  onRegenerate 
}) => {
  const [transformedData, setTransformedData] = useState(null);

  // Transform raw API response to component-friendly format
  useEffect(() => {
    if (!maturityData) return;
    
    const scoreData = maturityData.maturityScore || maturityData;
    
    const transformed = {
      overallScore: scoreData.overallMaturity,
      level: scoreData.maturityLevel,
      components: {},
      dimensions: scoreData.dimensions || [],
      maturityProfile: `${scoreData.industryBenchmark?.comparison || 'Business'} maturity profile (${scoreData.industryBenchmark?.percentile}th percentile)`,
      strengths: [],
      developmentAreas: [],
      nextLevel: null,
      industryBenchmark: scoreData.industryBenchmark,
      crossScoring: scoreData.crossScoring,
      progressionPath: scoreData.progressionPath
    };

    // Transform dimensions to components
    if (scoreData.dimensions?.length) {
      scoreData.dimensions.forEach(dimension => {
        const componentKey = dimension.name.toLowerCase().replace(/\s+/g, '');
        transformed.components[componentKey] = dimension.score;
        
        // Extract strengths and development areas
        if (dimension.score >= 4.0) {
          transformed.strengths.push(
            `Strong ${dimension.name}: Achieving ${dimension.level} level performance (${dimension.score}/5.0)`
          );
        }
        
        if (dimension.gap && dimension.gap > 0) {
          transformed.developmentAreas.push(
            `${dimension.name}: ${dimension.gap} points above industry benchmark`
          );
        }
        
        // Add sub-dimension insights
        dimension.subDimensions?.forEach(subDim => {
          if (subDim.score >= 4.0) {
            transformed.strengths.push(`${subDim.name}: ${subDim.description}`);
          } else if (subDim.score < 3.7) {
            transformed.developmentAreas.push(`${subDim.name}: ${subDim.description}`);
          }
        });
      });
    }

    // Transform progression path
    if (scoreData.progressionPath?.length) {
      const progression = scoreData.progressionPath[0];
      transformed.nextLevel = {
        target: progression.nextLevel,
        estimatedTimeframe: progression.timeline,
        investment: progression.investment,
        requirements: progression.requirements || []
      };
    }

    setTransformedData(transformed);
  }, [maturityData]);

  // Helper functions
  const getScoreColor = (score) => {
    if (score >= 4.0) return '#10b981';
    if (score >= 3.5) return '#3b82f6';
    if (score >= 3.0) return '#f59e0b';
    return '#ef4444';
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

  const getDimensionIcon = (dimensionName) => {
    const name = dimensionName.toLowerCase();
    if (name.includes('process')) return <Cog size={20} />;
    if (name.includes('technology')) return <Zap size={20} />;
    if (name.includes('customer')) return <Users size={20} />;
    if (name.includes('organizational')) return <Star size={20} />;
    return <BarChart3 size={20} />;
  };

  // Component sections
  const renderHeader = () => (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="header-title">
          <div className="header-icon">
            <Award size={24} />
          </div>
          <div className="header-text">
            <h2>Business Maturity Score</h2>
            {businessName && <p>{businessName}</p>}
          </div>
        </div>
        {canRegenerate && onRegenerate && (
          <RegenerateButton
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Business Maturity Score"
            size="medium"
          />
        )}
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="maturity-dashboard">
      <div className="loading-state">
        <Loader size={48} className="loading-icon spinning" />
        <h3>Calculating Business Maturity</h3>
        <p>Analyzing maturity across key business dimensions...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="maturity-dashboard">
      {renderHeader()}
      <div className="empty-state">
        <Award size={48} className="empty-icon" />
        <h3>Business Maturity Analysis</h3>
        <p>Complete the assessment to generate your comprehensive maturity analysis.</p>
      </div>
    </div>
  );

  const renderGaugeChart = () => (
    <div className="gauge-section">
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={getScoreColor(transformedData.overallScore)}
            strokeWidth="12"
            strokeDasharray={`${(transformedData.overallScore / 5) * 251.3} 251.3`}
            strokeLinecap="round"
          />
        </svg>
        <div className="gauge-content">
          <div className="score-number">
            {transformedData.overallScore}
            <span className="score-max">/5.0</span>
          </div>
          <div 
            className="score-level"
            style={{ color: getLevelColor(transformedData.level) }}
          >
            {transformedData.level}
          </div>
          {transformedData.maturityProfile && (
            <div className="maturity-profile">{transformedData.maturityProfile}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDimensionCard = (dimension, index) => (
    <div 
      key={index} 
      className="dimension-card"
      style={{
        '--dimension-color': getScoreColor(dimension.score),
        '--dimension-color-dark': getScoreColor(dimension.score),
        '--dimension-color-light': getScoreColor(dimension.score),
        '--dimension-color-rgb': getScoreColor(dimension.score) === '#10b981' ? '16, 185, 129' : 
                                 getScoreColor(dimension.score) === '#3b82f6' ? '59, 130, 246' :
                                 getScoreColor(dimension.score) === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'
      }}
    >
      <div className="dimension-header">
        <div className="dimension-title">
          <div className="dimension-icon">
            {getDimensionIcon(dimension.name)}
          </div>
          <h4 className="dimension-name">{dimension.name}</h4>
        </div>
        <div className="dimension-score-display">
          <div className="dimension-score">{dimension.score}</div>
          <div className="dimension-level">{dimension.level}</div>
        </div>
      </div>
      
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${(dimension.score / 5) * 100}%`,
              '--dimension-color': getScoreColor(dimension.score)
            }}
          />
        </div>
      </div>
      
      {dimension.benchmark && (
        <div className="benchmark-info">
          <span>Industry benchmark: {dimension.benchmark}</span>
          <span className={dimension.gap > 0 ? 'benchmark-positive' : 'benchmark-negative'}>
            ({dimension.gap > 0 ? '+' : ''}{dimension.gap})
          </span>
        </div>
      )}

      {dimension.subDimensions?.length > 0 && (
        <div className="sub-dimensions">
          {dimension.subDimensions.map((subDim, subIndex) => (
            <div key={subIndex} className="sub-dimension">
              <div className="sub-dimension-header">
                <span className="sub-dimension-name">{subDim.name}</span>
                <span 
                  className="sub-dimension-score"
                  style={{ color: getScoreColor(subDim.score) }}
                >
                  {subDim.score}
                </span>
              </div>
              <div className="sub-dimension-description">{subDim.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBusinessAreas = () => {
    if (!transformedData.dimensions?.length) return null;

    const { dimensions } = transformedData;

    return (
      <div className="content-section">
        <div className="section-header">
          <div className="section-icon">
            <BarChart3 size={20} />
          </div>
          <h3>Maturity by Business Area</h3>
        </div>
        
        <div className="dimensions-grid">
          {dimensions.map(renderDimensionCard)}
        </div>

        <div className="stacked-chart-container">
          <h4 className="stacked-chart-title">Overall Maturity Distribution</h4>
          <div className="stacked-bar">
            {dimensions.map((dimension, index) => {
              const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
              const percentage = (dimension.score / totalScore) * 100;
              
              return (
                <div
                  key={index}
                  className="stacked-segment"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getScoreColor(dimension.score),
                  }}
                >
                  <div className="segment-tooltip">
                    {dimension.name}: {dimension.score}/5.0 ({percentage.toFixed(1)}%)
                  </div>
                  {percentage > 15 ? dimension.name.split(' ')[0] : ''}
                </div>
              );
            })}
          </div>
          
          <div className="chart-legend">
            {dimensions.map((dimension, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: getScoreColor(dimension.score) }}
                />
                <span className="legend-text">
                  {dimension.name}: {dimension.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInsightCard = (title, items, cardClass, iconComponent) => {
    if (!items?.length) return null;

    return (
      <div className={`insights-card ${cardClass}`}>
        <div className="insights-header">
          <div className="section-icon">
            {iconComponent}
          </div>
          <h3>{title}</h3>
        </div>
        <ul className="insights-list">
          {items.map((item, index) => (
            <li key={index} className={`insight-item ${cardClass.replace('-card', '-item')}`}>
              {iconComponent}
              <span className="insight-text">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderInsights = () => {
    const { strengths, developmentAreas } = transformedData;
    
    if (!strengths?.length && !developmentAreas?.length) return null;

    return (
      <div className="insights-grid">
        {renderInsightCard(
          'Key Strengths', 
          strengths, 
          'strengths-card', 
          <CheckCircle size={16} className="insight-icon" />
        )}
        {renderInsightCard(
          'Development Areas', 
          developmentAreas, 
          'development-card', 
          <AlertCircle size={16} className="insight-icon" />
        )}
      </div>
    );
  };

  const renderCrossScoring = () => {
    const { crossScoring } = transformedData;
    if (!crossScoring) return null;

    return (
      <div className="cross-scoring-card">
        <div className="section-header">
          <div className="section-icon">
            <Target size={20} />
          </div>
          <h3>Cross-Dimension Analysis</h3>
        </div>
        
        {crossScoring.correlations?.length > 0 && (
          <div className="content-section">
            <h4 className="correlation-header">Correlations</h4>
            {crossScoring.correlations.map((corr, index) => (
              <div key={index} className="correlation-item">
                <span className="correlation-header">{corr.dimension1}</span> ↔{' '}
                <span className="correlation-header">{corr.dimension2}</span>
                <span className={`correlation-value ${corr.correlation > 0.7 ? 'correlation-strong' : 'correlation-moderate'}`}>
                  {(corr.correlation * 100).toFixed(0)}% correlation
                </span>
                <span className="correlation-impact"> ({corr.impact})</span>
              </div>
            ))}
          </div>
        )}

        {crossScoring.synergies?.length > 0 && (
          <div className="content-section">
            <h4 className="synergy-header">Synergies</h4>
            {crossScoring.synergies.map((synergy, index) => (
              <div key={index} className="synergy-item">
                <div className="synergy-header">{synergy.combination}</div>
                <div>
                  <span>Synergy Score: </span>
                  <span className="synergy-score">{synergy.synergyScore}/10</span>
                </div>
                <div className="sub-dimension-description">{synergy.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNextLevel = () => {
    const { nextLevel } = transformedData;
    if (!nextLevel) return null;

    return (
      <div className="next-level-card">
        <div className="section-header">
          <div className="section-icon">
            <TrendingUp size={20} />
          </div>
          <h3>Path to {nextLevel.target}</h3>
        </div>
        
        <div className="next-level-grid">
          <div className="timeline-info">
            <div className="info-item">
              <Target size={16} />
              <span className="info-label">Timeline:</span>
              <span className="info-value">{nextLevel.estimatedTimeframe}</span>
            </div>
            
            {nextLevel.investment && (
              <div className="info-item">
                <Award size={16} />
                <span className="info-label">Investment:</span>
                <span className="info-value">{nextLevel.investment}</span>
              </div>
            )}
          </div>

          {nextLevel.requirements?.length > 0 && (
            <div className="requirements-section">
              <h4 className="requirements-title">Key Requirements</h4>
              <ul className="requirements-list">
                {nextLevel.requirements.map((requirement, index) => (
                  <li key={index} className="requirement-item">
                    <Target size={12} className="requirement-icon" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIndustryBenchmark = () => {
    const { industryBenchmark } = transformedData;
    if (!industryBenchmark) return null;

    return (
      <div className="benchmark-card">
        <h4 className="benchmark-title">Industry Position</h4>
        <div className="benchmark-stats">
          <div className="benchmark-stat">
            <div className="stat-value percentile-value">{industryBenchmark.percentile}th</div>
            <div className="stat-label">Percentile</div>
          </div>
          <div className="benchmark-stat">
            <div className="stat-value average-value">{industryBenchmark.average}</div>
            <div className="stat-label">Industry Average</div>
          </div>
          <div className="benchmark-stat">
            <div className="stat-value comparison-value">{industryBenchmark.comparison}</div>
            <div className="stat-label">Performance</div>
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  if (isRegenerating) {
    return renderLoadingState();
  }

  if (!maturityData || !transformedData) {
    return renderEmptyState();
  }

  return (
    <div className="maturity-dashboard fade-in-up">
      {renderHeader()}
      
      <div className="dashboard-content">
        {renderGaugeChart()}
        {renderBusinessAreas()}
        {renderInsights()}
        {renderCrossScoring()}
        {renderNextLevel()}
        {renderIndustryBenchmark()}
      </div>
    </div>
  );
};

export default MaturityScore;