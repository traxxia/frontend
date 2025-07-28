import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, Settings, Calendar, Loader, Target, Award, Activity } from 'lucide-react';
import '../styles/Analytics.css';
import RegenerateButton from './RegenerateButton';

const CapabilityHeatmap = ({ 
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}) => {
  const [capabilityData, setCapabilityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewMode, setViewMode] = useState('maturity'); // 'maturity' or 'gap'
  
  // Add ref to track if API call is in progress or has been made
  const isGeneratingRef = useRef(false);
  const hasGeneratedRef = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  const generateCapabilityData = async () => {
    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) {
      console.log('API call already in progress, skipping...');
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
        throw new Error('No answered questions available for capability analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      console.log('Sending to /capability-heatmap API:', payload);

      const response = await fetch(`${ML_API_BASE_URL}/capability-heatmap`, {
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

      console.log('Parsed result from /capability-heatmap API:', result);

      if (result && result.capabilityHeatmap) {
        console.log('Setting capability data:', result.capabilityHeatmap);
        setCapabilityData(result.capabilityHeatmap);
        hasGeneratedRef.current = true;
        if (onDataGenerated) {
          onDataGenerated(result.capabilityHeatmap);
        }
      } else if (result && result.capabilities) {
        // Handle direct response format
        console.log('Setting capability data (direct format):', result);
        setCapabilityData(result);
        hasGeneratedRef.current = true;
        if (onDataGenerated) {
          onDataGenerated(result);
        }
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from API');
      }

    } catch (error) {
      console.error('Error generating capability heatmap:', error);
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
      setCapabilityData(null);
      await generateCapabilityData();
    }
  };

  // Auto-generate on mount if we have enough data
  useEffect(() => {
    const answeredCount = Object.keys(userAnswers).length;
    
    // Only generate if:
    // 1. We have enough answers
    // 2. We don't already have capability data
    // 3. We're not currently loading
    // 4. We haven't already generated data (to prevent multiple calls)
    // 5. We're not in the middle of regenerating
    if (answeredCount >= 3 && 
        !capabilityData && 
        !isLoading && 
        !hasGeneratedRef.current && 
        !isRegenerating) {
      generateCapabilityData();
    }
  }, [userAnswers, questions, capabilityData, isLoading, isRegenerating]);
  
  // Get color based on value and view mode
  const getCellColor = (capability) => {
    if (viewMode === 'maturity') {
      const level = capability.currentLevel;
      const colors = ['#fee2e2', '#fed7aa', '#fef3c7', '#d1fae5', '#a7f3d0'];
      return colors[level - 1] || '#f3f4f6';
    } else {
      const gap = capability.targetLevel - capability.currentLevel;
      if (gap === 0) return '#d1fae5'; // Green - at target
      if (gap === 1) return '#fef3c7'; // Yellow - 1 level gap
      if (gap === 2) return '#fed7aa'; // Orange - 2 level gap
      return '#fee2e2'; // Red - 3+ level gap
    }
  };
  
  // Get text color for contrast
  const getTextColor = (capability) => {
    return '#1f2937';
  };
  
  // Group capabilities by category - only if data exists
  const categories = capabilityData?.capabilities ? [...new Set(capabilityData.capabilities.map(cap => cap.category))] : [];
  const capabilitiesByCategory = categories.reduce((acc, category) => {
    acc[category] = capabilityData.capabilities.filter(cap => cap.category === category);
    return acc;
  }, {});

  // Get the maximum number of capabilities in any category for grid layout
  const maxCapabilitiesPerCategory = categories.length > 0 ? Math.max(...categories.map(cat => capabilitiesByCategory[cat].length)) : 0;
 

  if (isLoading || isRegenerating) {
    return (
      <div className="capability-heatmap">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating 
              ? "Regenerating capability heatmap analysis..." 
              : "Generating capability heatmap analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="capability-heatmap">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            hasGeneratedRef.current = false;
            generateCapabilityData();
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!capabilityData || !capabilityData.capabilities || capabilityData.capabilities.length === 0) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="capability-heatmap">
        <div className="empty-state">
          <Zap size={48} className="empty-icon" />
          <h3>Capability Heatmap Analysis</h3>
          <p>
            {answeredCount < 3 
              ? `Answer ${3 - answeredCount} more questions to generate capability insights.`
              : "Generate your capability analysis to understand organizational strengths and development areas."
            }
          </p>
          {answeredCount >= 3 && (
            <button onClick={() => {
              hasGeneratedRef.current = false;
              generateCapabilityData();
            }} className="generate-button">
              Generate Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="capability-heatmap">
      {/* Header */}
      <div className="ch-header">
        <div className="ch-title-section">
          <Zap className="ch-icon" size={24} />
          <h2 className="ch-title">Capability Heatmap</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Channel Heatmap"
          size="medium"
        />
      </div>

      {/* Key Metrics */}
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <Activity size={20} />
            <span>Total Capabilities</span>
          </div>
          <p className="ch-metric-value">{capabilityData.capabilities?.length || 0}</p>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <Award size={20} />
            <span>At Target Level</span>
          </div>
          <p className="ch-metric-value">
            {capabilityData.capabilities?.filter(c => c.currentLevel >= c.targetLevel).length || 0}
          </p>
        </div>

        <div className="ch-metric-card ch-metric-red">
          <div className="ch-metric-header">
            <Target size={20} />
            <span>Development Areas</span>
          </div>
          <p className="ch-metric-value">
            {capabilityData.capabilities?.filter(c => c.currentLevel < c.targetLevel).length || 0}
          </p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Overall Maturity</span>
          </div>
          <p className="ch-metric-value">{capabilityData.overallMaturity?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="ch-view-toggle">
        <button 
          className={`ch-toggle-btn ${viewMode === 'maturity' ? 'active' : ''}`}
          onClick={() => setViewMode('maturity')}
        >
          Current Maturity
        </button>
        <button 
          className={`ch-toggle-btn ${viewMode === 'gap' ? 'active' : ''}`}
          onClick={() => setViewMode('gap')}
        >
          Capability Gap
        </button>
      </div>

      {/* Legend */}
      <div className="ch-heatmap-header-section">
        <h3 className="ch-section-title">Capability Matrix</h3>
        <div className="ch-legend-gradient">
          <div 
            className="ch-gradient-bar"
            style={{
              background: viewMode === 'maturity' 
                ? 'linear-gradient(to right, #fee2e2, #fed7aa, #fef3c7, #d1fae5, #a7f3d0)'
                : 'linear-gradient(to right, #d1fae5, #fef3c7, #fed7aa, #fee2e2)'
            }}
          ></div>
          <div className="ch-gradient-labels">
            <span>{viewMode === 'maturity' ? 'Low' : 'No Gap'}</span>
            <span>{viewMode === 'maturity' ? 'High' : 'Large Gap'}</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-wrapper">
          <div className="ch-heatmap">
            {/* Header Row */}
            <div className="ch-heatmap-header">
              <div className="ch-cell ch-cell-corner"></div>
              {categories.map(category => (
                <div key={category} className="ch-cell ch-cell-header ch-category-header">
                  <div className="ch-category-name">{category}</div>
                  <div className="ch-category-count">
                    {capabilitiesByCategory[category].length} capabilities
                  </div>
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {Array.from({ length: maxCapabilitiesPerCategory }, (_, rowIndex) => (
              <div key={rowIndex} className="ch-heatmap-row">
                <div className="ch-cell ch-cell-header ch-row-header">
                  Position {rowIndex + 1}
                </div>
                {categories.map(category => {
                  const capability = capabilitiesByCategory[category][rowIndex];
                  const cellKey = `${category}-${rowIndex}`;
                  
                  return (
                    <div
                      key={cellKey}
                      className={`ch-cell ch-cell-data ${selectedCell === cellKey ? 'selected' : ''}`}
                      style={{
                        backgroundColor: capability ? getCellColor(capability) : '#f9fafb',
                        color: capability ? getTextColor(capability) : '#9ca3af',
                        cursor: capability ? 'pointer' : 'default'
                      }}
                      onClick={() => capability && setSelectedCell(cellKey === selectedCell ? null : cellKey)}
                      onMouseEnter={() => capability && setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {capability ? (
                        <div className="ch-cell-content">
                          <div className="ch-cell-name">{capability.name}</div>
                          <div className="ch-cell-values">
                            {viewMode === 'maturity' ? (
                              <>
                                <div className="ch-cell-value">
                                  {capability.currentLevel}/5
                                </div>
                                <div className="ch-cell-label">Current</div>
                              </>
                            ) : (
                              <>
                                <div className="ch-cell-value">
                                  {capability.targetLevel - capability.currentLevel > 0 ? '+' : ''}
                                  {capability.targetLevel - capability.currentLevel}
                                </div>
                                <div className="ch-cell-label">Gap</div>
                              </>
                            )}
                          </div>
                          <div className="ch-cell-impact">
                            <span className={`impact-badge impact-${capability.impact}`}>
                              {capability.impact}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="ch-cell-empty">-</div>
                      )}
                      
                      {/* Tooltip */}
                      {hoveredCell === cellKey && capability && (
                        <div className="ch-tooltip">
                          <div className="ch-tooltip-header">{capability.name}</div>
                          <div className="ch-tooltip-content">
                            <div>Category: {capability.category}</div>
                            <div>Current Level: {capability.currentLevel}/5</div>
                            <div>Target Level: {capability.targetLevel}/5</div>
                            <div>Gap: {capability.targetLevel - capability.currentLevel}</div>
                            <div>Impact: {capability.impact}</div>
                            <div>Type: {capability.type}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapabilityHeatmap;