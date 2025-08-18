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
  onRedirectToBrief // Add this prop
}) => {
  const [transformedData, setTransformedData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

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

  // Check if a value contains "NOT ENOUGH DATA" (case-insensitive)
  const hasNotEnoughDataValue = (value) => {
    if (typeof value === 'string') {
      return value.toUpperCase().includes('NOT ENOUGH DATA');
    }
    return false;
  };

  // Check if any data contains "NOT ENOUGH DATA"
  const containsNotEnoughData = (data) => {
    if (!data) return false;

    // Helper function to recursively check an object for "NOT ENOUGH DATA"
    const checkObjectRecursively = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return hasNotEnoughDataValue(obj);
      }

      if (Array.isArray(obj)) {
        return obj.some(item => checkObjectRecursively(item));
      }

      return Object.values(obj).some(value => checkObjectRecursively(value));
    };

    return checkObjectRecursively(data);
  };

  // Check if the maturity data is empty/incomplete
  const isMaturityDataIncomplete = (data) => {
    if (!data) return true;
    
    // Check for "NOT ENOUGH DATA" values first
    if (containsNotEnoughData(data)) return true;
    
    // Handle various nested structures
    let scoreData;
    if (data.maturityScore && data.maturityScore.maturityScoring) {
      scoreData = data.maturityScore.maturityScoring;
    } else if (data.maturityScoring) {
      scoreData = data.maturityScoring;
    } else if (data.maturityScore) {
      scoreData = data.maturityScore;
    } else if (data.dimensions && data.overallMaturity) {
      scoreData = data;
    } else {
      scoreData = data;
    }
    
    // Check if essential maturity data exists
    if (!scoreData) return true;
    
    // Check if we have meaningful data
    const hasOverallMaturity = scoreData.overallMaturity && scoreData.overallMaturity > 0;
    const hasValidDimensions = scoreData.dimensions && 
                               Array.isArray(scoreData.dimensions) && 
                               scoreData.dimensions.length > 0 &&
                               scoreData.dimensions.some(dim => dim.score && dim.score > 0);
    
    // Check if maturity level exists and is not empty/default
    const hasMaturityLevel = scoreData.maturityLevel && 
                             scoreData.maturityLevel !== '' && 
                             scoreData.maturityLevel.toLowerCase() !== 'unknown';
    
    // Consider data complete only if we have meaningful maturity information
    const hasEssentialData = hasOverallMaturity || hasValidDimensions || hasMaturityLevel;
    
    return !hasEssentialData;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Transform raw API response to component-friendly format
  useEffect(() => {
    if (!maturityData) return;
    
    // Check for "NOT ENOUGH DATA" before processing
    if (containsNotEnoughData(maturityData)) {
      console.error('Maturity data contains "NOT ENOUGH DATA" values:', maturityData);
      setTransformedData(null);
      return;
    }
    
    // Fixed: Handle the nested API response structure properly
    let scoreData;
    
    // Handle various nested structures
    if (maturityData.maturityScore && maturityData.maturityScore.maturityScoring) {
      // Structure: { maturityScore: { maturityScoring: { ... } } }
      scoreData = maturityData.maturityScore.maturityScoring;
    } else if (maturityData.maturityScoring) {
      // Structure: { maturityScoring: { ... } }
      scoreData = maturityData.maturityScoring;
    } else if (maturityData.maturityScore) {
      // Structure: { maturityScore: { ... } }
      scoreData = maturityData.maturityScore;
    } else if (maturityData.dimensions && maturityData.overallMaturity) {
      // Direct structure with dimensions at root
      scoreData = maturityData;
    } else {
      // Fallback
      scoreData = maturityData;
    }
    
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

  const renderLoadingState = () => (
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

  const renderErrorState = () => (
    <div className="maturity-container"> 
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>Analysis Error</h3>
        <p>Unable to generate business maturity score. Please try regenerating or check your inputs.</p>
        <button onClick={() => {
          if (onRegenerate) {
            onRegenerate();
          }
        }} className="retry-button">
          Retry Analysis
        </button>
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

  // Maturity Overview Table
  const renderMaturityOverview = () => {
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
                  <td>{transformedData.overallScore}/5.0</td>
                  <td>
                    <span className={`status-badge ${getScoreClass(transformedData.overallScore)}`}>
                      {transformedData.level}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Industry Percentile</strong></td>
                  <td>{transformedData.industryBenchmark.percentile}th percentile</td>
                  <td>
                    <span className="status-badge medium-intensity">
                      {transformedData.industryBenchmark.comparison}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Industry Average</strong></td>
                  <td>{transformedData.industryBenchmark.average}/5.0</td>
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
  const renderBusinessAreas = () => {
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
                      <span className="score-badge">{dimension.score}/5.0</span>
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
                          {dimension.gap > 0 ? '+' : ''}{dimension.gap}
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
                              {subDim.score}/5.0
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

  // Insights Table
  const renderInsights = () => {
    const { strengths, developmentAreas } = transformedData;
    
    if (!strengths?.length && !developmentAreas?.length) return null;

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('insights')}>
          <h3>Key Insights</h3>
          {expandedSections.insights ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.insights !== false && (
          <div className="table-container">
            {/* Strengths */}
            {strengths?.length > 0 && (
              <div className="subsection">
                <h4>Key Strengths</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strengths.map((strength, index) => (
                      <tr key={index}>
                        <td>
                          <CheckCircle size={16} className="insight-icon" style={{ color: '#10b981' }} />
                          <span>Strength</span>
                        </td>
                        <td>{strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Development Areas */}
            {developmentAreas?.length > 0 && (
              <div className="subsection">
                <h4>Development Areas</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Development Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {developmentAreas.map((area, index) => (
                      <tr key={index}>
                        <td>
                          <AlertCircle size={16} className="insight-icon" style={{ color: '#f59e0b' }} />
                          <span>Opportunity</span>
                        </td>
                        <td>{area}</td>
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

  // Cross-Scoring Analysis Table
  const renderCrossScoring = () => {
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
                            {(corr.correlation * 100).toFixed(0)}%
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
                          <span className="score-badge">{synergy.synergyScore}/10</span>
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
  const renderNextLevel = () => {
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
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Target Level</strong></td>
                  <td>{nextLevel.target}</td>
                  <td>Next maturity milestone</td>
                </tr>
                <tr>
                  <td><strong>Estimated Timeline</strong></td>
                  <td>
                    <span className="timeline-badge">{nextLevel.estimatedTimeframe}</span>
                  </td>
                  <td>Expected time to achieve target</td>
                </tr>
                {nextLevel.investment && (
                  <tr>
                    <td><strong>Investment Required</strong></td>
                    <td>{nextLevel.investment}</td>
                    <td>Resource commitment needed</td>
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
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextLevel.requirements.map((requirement, index) => (
                      <tr key={index}>
                        <td>
                          <Target size={12} className="requirement-icon" />
                          {requirement}
                        </td>
                        <td>High</td>
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

  // Main render logic
  if (isRegenerating) {
    return renderLoadingState();
  }

  // Check if data is incomplete (including "NOT ENOUGH DATA" values) and show missing questions checker
  if (!maturityData || isMaturityDataIncomplete(maturityData)) {
    return (
      <div className="maturity-container"> 
        <AnalysisEmptyState
          analysisType="maturityScore"
          analysisDisplayName="Business Maturity Score Analysis"
          icon={Award}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        /> 
      </div>
    );
  }

  if (!transformedData) {
    return renderErrorState();
  }

  return (
    <div className="maturity-container fade-in-up"> 
      
      <div className="dashboard-content">
        {renderGaugeChart()}
        {renderMaturityOverview()}
        {renderBusinessAreas()}
        {renderInsights()}
        {renderCrossScoring()}
        {renderNextLevel()}
      </div>
    </div>
  );
};

export default MaturityScore;