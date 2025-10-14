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
  Loader,
  ChevronDown,
  ChevronRight
} from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const MaturityScore = ({ 
  maturityData = null,
  businessName = '',
  isRegenerating = false,
  canRegenerate = true,
  onRegenerate,
  questions = [],
  userAnswers = {},
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [data, setData] = useState(maturityData);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [error, setError] = useState(null);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.maturityScore; 
    
    await checkMissingQuestionsAndRedirect(
      'maturityScore', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      setError(null); // Clear any existing errors
      onRegenerate();
    }
  };

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Simplified validation - EXACTLY like other components
  const isMaturityDataIncomplete = (data) => {
    if (!data) return true;
    
    // Handle both wrapped and direct API response formats
    let normalizedData;
    if (data.maturityScore) {
      normalizedData = data;
    } else if (data.maturityScoring) {
      normalizedData = { maturityScore: data.maturityScoring };
    } else if (data.dimensions || data.overallMaturity) {
      normalizedData = { maturityScore: data };
    } else {
      return true;
    }
    
    // Check if maturityScore exists
    if (!normalizedData.maturityScore) {
      return true;
    }
    
    const score = normalizedData.maturityScore;
    const hasOverallMaturity = score.overallMaturity && score.overallMaturity > 0;
    const hasDimensions = score.dimensions && score.dimensions.length > 0;
    const hasMaturityLevel = score.maturityLevel && score.maturityLevel !== '';

    // Need at least some data to show something meaningful
    return !hasOverallMaturity && !hasDimensions && !hasMaturityLevel;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // SINGLE useEffect - exactly like other working components
  useEffect(() => {
    if (maturityData) {
      // Handle both wrapped and direct API response formats
      let normalizedData;
      if (maturityData.maturityScore) {
        // Data is already wrapped
        normalizedData = maturityData;
      } else if (maturityData.maturityScoring) {
        // Data has maturityScoring wrapper
        normalizedData = { maturityScore: maturityData.maturityScoring };
      } else if (maturityData.dimensions || maturityData.overallMaturity) {
        // Data is direct from API, needs wrapping
        normalizedData = { maturityScore: maturityData };
      } else {
        normalizedData = null;
      }
      
      if (normalizedData) {
        setData(normalizedData);
        setHasGenerated(true);
        setError(null); // Clear any existing errors
      } else {
        setData(null);
        setHasGenerated(false);
        setError('Invalid maturity score data received');
      }
    } else {
      setData(null);
      setHasGenerated(false);
    }
  }, [maturityData]);

  // Transform data for rendering - moved to helper function
  const getTransformedData = () => {
    if (!data?.maturityScore) {
      return null;
    }

    const scoreData = data.maturityScore;
    
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
            `Strong ${dimension.name}: Achieving ${dimension.level} level performance (${dimension.score})`
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
  
    return transformed;
  };

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

  const getScoreClass = (score) => {
    if (score >= 4.0) return 'high-intensity';
    if (score >= 3.5) return 'medium-intensity';
    if (score >= 3.0) return 'low-intensity';
    return 'critical-intensity';
  };

  const getDimensionIcon = (dimensionName) => {
    const name = dimensionName.toLowerCase();
    if (name.includes('process')) return <Cog size={16} />;
    if (name.includes('technology')) return <Zap size={16} />;
    if (name.includes('customer')) return <Users size={16} />;
    if (name.includes('organizational')) return <Star size={16} />;
    return <BarChart3 size={16} />;
  };

  const renderGaugeChart = (transformedData) => (
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
            <span className="score-max"></span>
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

  // Maturity Overview Table
  const renderMaturityOverview = (transformedData) => {
    if (!transformedData.industryBenchmark) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('overview')}>
          <h3>Maturity Overview</h3>
          {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.overview !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Overall Maturity Score</strong></td>
                  <td>{transformedData.overallScore}</td>
                  <td>
                    <span className={`status-badge ${getScoreClass(transformedData.overallScore)}`}>
                      {transformedData.level}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Industry Percentile</strong></td>
                  <td>{transformedData.industryBenchmark.percentile}</td>
                  <td>
                    <span className="status-badge medium-intensity">
                      {transformedData.industryBenchmark.comparison}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Industry Average</strong></td>
                  <td>{transformedData.industryBenchmark.average}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Business Areas Table
  const renderBusinessAreas = (transformedData) => {
    if (!transformedData.dimensions?.length) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('areas')}>
          <h3>Maturity by Business Area</h3>
          {expandedSections.areas ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.areas !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Area</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Industry Benchmark</th>
                  <th>Gap Analysis</th>
                </tr>
              </thead>
              <tbody>
                {transformedData.dimensions.map((dimension, index) => (
                  <tr key={index}>
                    <td>
                      <div className="force-name">
                        {getDimensionIcon(dimension.name)}
                        <span>{dimension.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="score-badge">{dimension.score}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getScoreClass(dimension.score)}`}>
                        {dimension.level}
                      </span>
                    </td>
                    <td>{dimension.benchmark || 'N/A'}</td>
                    <td>
                      {dimension.gap && (
                        <span className={dimension.gap > 0 ? 'benchmark-positive' : 'benchmark-negative'}>
                          {dimension.gap}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sub-dimensions details */}
            {transformedData.dimensions.some(d => d.subDimensions?.length) && (
              <div className="subsection">
                <h4>Sub-Dimension Details</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Sub-Dimension</th>
                      <th>Score</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformedData.dimensions.map((dimension) =>
                      dimension.subDimensions?.map((subDim, subIndex) => (
                        <tr key={`${dimension.name}-${subIndex}`}>
                          <td>{dimension.name}</td>
                          <td><strong>{subDim.name}</strong></td>
                          <td>
                            <span 
                              className={`score-badge ${getScoreClass(subDim.score)}`}
                            >
                              {subDim.score}
                            </span>
                          </td>
                          <td>{subDim.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Cross-Scoring Analysis Table
  const renderCrossScoring = (transformedData) => {
    const { crossScoring } = transformedData;
    if (!crossScoring) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('crossScoring')}>
          <h3>Cross-Dimension Analysis</h3>
          {expandedSections.crossScoring ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.crossScoring !== false && (
          <div className="table-container">
            {/* Correlations */}
            {crossScoring.correlations?.length > 0 && (
              <div className="subsection">
                <h4>Correlations</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dimension 1</th>
                      <th>Dimension 2</th>
                      <th>Correlation</th>
                      <th>Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossScoring.correlations.map((corr, index) => (
                      <tr key={index}>
                        <td><strong>{corr.dimension1}</strong></td>
                        <td><strong>{corr.dimension2}</strong></td>
                        <td>
                          <span className={`status-badge ${corr.correlation > 0.7 ? 'high-intensity' : 'medium-intensity'}`}>
                            { corr.correlation}
                          </span>
                        </td>
                        <td>{corr.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Synergies */}
            {crossScoring.synergies?.length > 0 && (
              <div className="subsection">
                <h4>Synergies</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Combination</th>
                      <th>Synergy Score</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossScoring.synergies.map((synergy, index) => (
                      <tr key={index}>
                        <td><strong>{synergy.combination}</strong></td>
                        <td>
                          <span className="score-badge">{synergy.synergyScore}</span>
                        </td>
                        <td>{synergy.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Progression Path Table
  const renderNextLevel = (transformedData) => {
    const { nextLevel } = transformedData;
    if (!nextLevel) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('progression')}>
          <h3>Path to {nextLevel.target}</h3>
          {expandedSections.progression ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.progression !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th> 
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Target Level</strong></td>
                  <td>{nextLevel.target}</td> 
                </tr>
                <tr>
                  <td><strong>Estimated Timeline</strong></td>
                  <td>
                    <span className="timeline-badge">{nextLevel.estimatedTimeframe}</span>
                  </td> 
                </tr>
                {nextLevel.investment && (
                  <tr>
                    <td><strong>Investment Required</strong></td>
                    <td>{nextLevel.investment}</td> 
                  </tr>
                )}
              </tbody>
            </table>

            {/* Requirements */}
            {nextLevel.requirements?.length > 0 && (
              <div className="subsection">
                <h4>Key Requirements</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Requirement</th> 
                    </tr>
                  </thead>
                  <tbody>
                    {nextLevel.requirements.map((requirement, index) => (
                      <tr key={index}>
                        <td>
                          {requirement}
                        </td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isRegenerating) {
    return (
      <div className="maturity-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating business maturity score analysis..."
              : "Generating business maturity score analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  // Error state - NEW: Using AnalysisError component
  if (error) {
    return (
      <div className="maturity-container"> 
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Business Maturity Score Analysis Error"
        />
      </div>
    );
  }

  // Error state for generation failure with user answers
  if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
    return (
      <div className="maturity-container"> 
        <AnalysisError 
          error="Unable to generate business maturity score analysis. Please try regenerating or check your inputs."
          onRetry={handleRetry}
          title="Analysis Generation Error"
        />
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!maturityData || isMaturityDataIncomplete(maturityData)) {
    return (
      <div className="maturity-container"> 
        <AnalysisEmptyState
          analysisType="maturityScore"
          analysisDisplayName="Business Maturity Score Analysis"
          icon={Award}
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

  // Check if data structure is valid
  if (!data?.maturityScore) {
    return (
      <div className="maturity-container">
        <AnalysisError 
          error="The maturity score data received is not in the expected format. Please regenerate the analysis."
          onRetry={handleRetry}
          title="Invalid Data Structure"
        />
      </div>
    );
  }

  // Get transformed data for rendering
  const transformedData = getTransformedData();
  
  if (!transformedData) {
    return (
      <div className="maturity-container">
        <AnalysisError 
          error="Unable to process maturity score data. Please try regenerating."
          onRetry={handleRetry}
          title="Data Processing Error"
        />
      </div>
    );
  }

  return (
    <div className="maturity-container"> 
      
      <div className="dashboard-content">
        {renderGaugeChart(transformedData)}
        {renderMaturityOverview(transformedData)}
        {renderBusinessAreas(transformedData)} 
        {renderCrossScoring(transformedData)}
        {renderNextLevel(transformedData)}
      </div>
    </div>
  );
};

export default MaturityScore;