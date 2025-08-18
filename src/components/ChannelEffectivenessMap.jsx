import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader, RefreshCw, BarChart3 } from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ChannelEffectivenessMap = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  channelEffectivenessData = null,
  selectedBusinessId,
  onRedirectToBrief,
  isPhaseRegenerating = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const bubbleChartRef = useRef(null);
  const hasGeneratedRef = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.channelEffectiveness;  
    
    await checkMissingQuestionsAndRedirect(
      'channelEffectiveness', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Enhanced validation to check for NaN values and insufficient data indicators
  const isChannelEffectivenessDataIncomplete = (data) => {
    if (!data) return true;
    
    // Check if channels array is empty or null
    if (!data.channelEffectiveness?.channels || data.channelEffectiveness.channels.length === 0) return true;
    
    // Check if any critical fields are null/undefined in the main data structure
    const mainData = data.channelEffectiveness;
    if (!mainData) return true;
    
    // Check if channels have essential data and no NaN values or insufficient data indicators
    const hasValidChannels = mainData.channels.some(channel => {
      if (!channel.name) return false;
      
      // Check for "NOT ENOUGH DATA" or similar insufficient data indicators
      const hasInsufficientDataIndicators = (obj) => {
        if (!obj) return false;
        
        const checkValue = (value) => {
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            return lowerValue.includes('not enough data') || 
                   lowerValue.includes('insufficient data') ||
                   lowerValue.includes('no data') ||
                   lowerValue.includes('unavailable') ||
                   lowerValue === 'n/a' ||
                   lowerValue === 'null' ||
                   lowerValue === 'undefined';
          }
          return false;
        };
        
        // Check all values in the object recursively
        for (const value of Object.values(obj)) {
          if (checkValue(value)) return true;
          if (typeof value === 'object' && value !== null) {
            if (hasInsufficientDataIndicators(value)) return true;
          }
        }
        return false;
      };
      
      // Check if effectiveness or efficiency data contains insufficient data indicators
      if (hasInsufficientDataIndicators(channel.effectiveness) || 
          hasInsufficientDataIndicators(channel.efficiency)) {
        return false;
      }
      
      // Check for NaN values in effectiveness and efficiency
      const effectiveness = extractScore(channel.effectiveness, 'effectiveness');
      const efficiency = extractScore(channel.efficiency, 'efficiency');
      
      // Return false if any values are NaN
      if (isNaN(effectiveness) || isNaN(efficiency)) return false;
      if (!isFinite(effectiveness) || !isFinite(efficiency)) return false;
      
      return true;
    });
    
    return !hasValidChannels;
  };

  // Enhanced extract score function with better NaN handling
  const extractScore = (data, type) => {
    if (!data) {
      // Return a valid default instead of random
      return 50; // Default to middle value
    }
    
    let score = null;
    
    // Direct numeric values with validation
    if (typeof data.score === 'number' && !isNaN(data.score) && isFinite(data.score)) {
      score = Math.min(Math.max(data.score, 0), 100);
    } else if (typeof data.customerSatisfaction === 'number' && !isNaN(data.customerSatisfaction) && isFinite(data.customerSatisfaction)) {
      score = Math.min(Math.max(data.customerSatisfaction * 10, 0), 100);
    } else if (typeof data.roi === 'number' && !isNaN(data.roi) && isFinite(data.roi)) {
      score = Math.min(Math.max(data.roi, 0), 100);
    } else if (typeof data.costPerAcquisition === 'number' && !isNaN(data.costPerAcquisition) && isFinite(data.costPerAcquisition)) {
      score = Math.max(Math.min(100 - data.costPerAcquisition, 100), 0);
    }
    
    // If we found a valid numeric score, return it
    if (score !== null) return score;
    
    // Qualitative to numeric mapping
    const qualitativeMap = {
      'highest': 95, 'excellent': 90, 'high': 80,
      'good': 70, 'medium': 60, 'moderate': 50,
      'low': 30, 'poor': 20, 'lowest': 10
    };
    
    // Check all values in the data object
    for (const value of Object.values(data)) {
      if (typeof value === 'string') {
        const mapped = qualitativeMap[value.toLowerCase()];
        if (mapped && !isNaN(mapped)) return mapped;
      }
    }
    
    // Return valid default if nothing else works
    return 50;
  };

  const getChannelColor = (index) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#a55eea', '#26de81'];
    return colors[index % colors.length];
  };

  // Enhanced data processing with comprehensive validation
  const processBubbleData = (channels) => {
    if (!channels || channels.length === 0) return [];
    
    const validChannels = channels
      .map((channel, index) => {
        // Check for insufficient data indicators in the channel data
        const hasInsufficientData = (obj) => {
          if (!obj) return false;
          
          const checkValue = (value) => {
            if (typeof value === 'string') {
              const lowerValue = value.toLowerCase();
              return lowerValue.includes('not enough data') || 
                     lowerValue.includes('insufficient data') ||
                     lowerValue.includes('no data') ||
                     lowerValue.includes('unavailable') ||
                     lowerValue === 'n/a' ||
                     lowerValue === 'null' ||
                     lowerValue === 'undefined';
            }
            return false;
          };
          
          // Check all values in the object recursively
          for (const value of Object.values(obj)) {
            if (checkValue(value)) return true;
            if (typeof value === 'object' && value !== null) {
              if (hasInsufficientData(value)) return true;
            }
          }
          return false;
        };
        
        // If channel contains insufficient data indicators, mark as invalid
        if (hasInsufficientData(channel)) {
          console.warn(`Skipping channel ${channel.name} due to insufficient data indicators`);
          return null;
        }
        
        const effectiveness = extractScore(channel.effectiveness, 'effectiveness');
        const efficiency = extractScore(channel.efficiency, 'efficiency');
        
        // Enhanced revenue extraction with string handling
        let revenue = 25; // Default value
        
        // Try to extract revenue from various sources
        if (channel.effectiveness?.revenueContribution) {
          const revenueValue = channel.effectiveness.revenueContribution;
          
          // Check if revenue value indicates insufficient data
          if (typeof revenueValue === 'string') {
            const lowerValue = revenueValue.toLowerCase();
            if (lowerValue.includes('not enough data') || 
                lowerValue.includes('insufficient data') ||
                lowerValue.includes('no data') ||
                lowerValue.includes('unavailable')) {
              console.warn(`Skipping channel ${channel.name} due to insufficient revenue data: ${revenueValue}`);
              return null;
            }
            
            // Try to extract numeric value from string
            const numericMatch = revenueValue.match(/(\d+(?:\.\d+)?)/);
            if (numericMatch) {
              const parsed = parseFloat(numericMatch[1]);
              if (!isNaN(parsed) && isFinite(parsed)) {
                revenue = parsed;
              }
            }
          } else if (typeof revenueValue === 'number' && !isNaN(revenueValue) && isFinite(revenueValue)) {
            revenue = revenueValue;
          }
        }
        
        // Additional fallback checks for revenue
        if (channel.revenue) {
          const channelRevenue = typeof channel.revenue === 'number' ? channel.revenue : parseFloat(channel.revenue);
          if (!isNaN(channelRevenue) && isFinite(channelRevenue)) {
            revenue = channelRevenue;
          }
        }
        
        // Validate all numeric values
        if (isNaN(effectiveness) || isNaN(efficiency) || isNaN(revenue) ||
            !isFinite(effectiveness) || !isFinite(efficiency) || !isFinite(revenue)) {
          console.warn(`Skipping channel ${channel.name} due to invalid numeric values:`, {
            effectiveness, efficiency, revenue, 
            originalRevenue: channel.effectiveness?.revenueContribution
          });
          return null;
        }
        
        return {
          name: channel.name || `Channel ${index + 1}`,
          effectiveness: Math.max(0, Math.min(100, effectiveness)),
          efficiency: Math.max(0, Math.min(100, efficiency)),
          revenue: Math.max(0, Math.min(100, revenue)),
          trend: channel.trend || 'stable',
          color: getChannelColor(index),
          rawData: channel
        };
      })
      .filter(channel => channel !== null); // Remove invalid channels
    
    return validChannels;
  };

  // Memoize processed data to avoid recalculation
  const processedData = useMemo(() => {
    if (!channelEffectivenessData?.channelEffectiveness?.channels) {
      return [];
    }
    return processBubbleData(channelEffectivenessData.channelEffectiveness.channels);
  }, [channelEffectivenessData]);

  // Check if processed data contains any valid entries
  const hasValidData = processedData.length > 0;

  const handleMouseMove = (e, channel) => {
    if (!bubbleChartRef.current) return;
    
    const rect = bubbleChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTooltipPosition({ x, y });
    setHoveredChannel(channel);
  };

  const handleMouseLeave = () => {
    setHoveredChannel(null);
  };

  const BubbleChart = ({ data }) => {
    // Additional validation before rendering
    if (!data || data.length === 0) {
      return (
        <div style={{ 
          width: 600, 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '2px dashed #d1d5db',
          borderRadius: '12px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              No Valid Channel Data
            </div>
            <div style={{ fontSize: '14px' }}>
              Unable to display chart with current data
            </div>
          </div>
        </div>
      );
    }

    const width = 600;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const minRevenue = Math.min(...data.map(d => d.revenue));

    const xScale = (value) => {
      const scaled = (value / 100) * chartWidth;
      return isNaN(scaled) ? 0 : scaled;
    };
    
    const yScale = (value) => {
      const scaled = chartHeight - (value / 100) * chartHeight;
      return isNaN(scaled) ? chartHeight : scaled;
    };
    
    const radiusScale = (value) => {
      const normalized = (value - minRevenue) / (maxRevenue - minRevenue || 1);
      const radius = 15 + (normalized * 20);
      return isNaN(radius) ? 15 : radius;
    };

    return (
      <div 
        className="bubble-chart-container" 
        ref={bubbleChartRef}
        style={{ position: 'relative' }}
      >
        <svg width={width} height={height}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <line
                  x1={xScale(val)} x2={xScale(val)}
                  y1={0} y2={chartHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />
                <line
                  x1={0} x2={chartWidth}
                  y1={yScale(val)} y2={yScale(val)}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />
              </g>
            ))}

            {/* Main Axes */}
            <line
              x1={0} x2={chartWidth}
              y1={chartHeight/2} y2={chartHeight/2}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1={chartWidth/2} x2={chartWidth/2}
              y1={0} y2={chartHeight}
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Quadrant Labels */}
            <text x={chartWidth * 0.75} y={20} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">
              High Performance
            </text>
            <text x={chartWidth * 0.25} y={20} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">
              Optimize Efficiency
            </text>
            <text x={chartWidth * 0.25} y={chartHeight - 10} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">
              Needs Improvement
            </text>
            <text x={chartWidth * 0.75} y={chartHeight - 10} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">
              Optimize Effectiveness
            </text>

            {/* Bubbles - with additional validation */}
            {data.map((channel) => {
              const x = xScale(channel.effectiveness);
              const y = yScale(channel.efficiency);
              const radius = radiusScale(channel.revenue);
              
              // Skip rendering if any coordinate is invalid
              if (isNaN(x) || isNaN(y) || isNaN(radius)) {
                console.warn('Skipping bubble due to NaN coordinates:', channel);
                return null;
              }
              
              const isHovered = hoveredChannel?.name === channel.name;

              return (
                <g key={channel.name}>
                  <circle
                    cx={x} 
                    cy={y} 
                    r={radius}
                    fill={channel.color}
                    fillOpacity="0.85"
                    stroke={isHovered ? '#ffffff' : channel.color}
                    strokeWidth="3"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onMouseMove={(e) => handleMouseMove(e, channel)}
                    onMouseLeave={handleMouseLeave}
                  />
                  <text
                    x={x} 
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#1f2937"
                    style={{ 
                      pointerEvents: 'none',
                      textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {channel.name}
                  </text>
                  
                  {/* Trend Arrow */}
                  {channel.trend !== 'stable' && (
                    <text
                      x={x + radius + 8} 
                      y={y - radius - 5}
                      fontSize="16"
                      fill={channel.trend === 'increasing' ? '#00ff88' : '#ff4757'}
                      style={{ 
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                      }}
                    >
                      {channel.trend === 'increasing' ? '↗' : '↘'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axis Labels */}
            <text 
              x={chartWidth / 2} 
              y={chartHeight + 40} 
              textAnchor="middle"
              fontSize="16"
              fontWeight="800"
              fill="#111827"
            >
              Effectiveness Score →
            </text>
            <text 
              x={-chartHeight / 2} 
              y={-40} 
              textAnchor="middle"
              fontSize="16"
              fontWeight="800"
              fill="#111827"
              transform={`rotate(-90, -${chartHeight / 2}, -40)`}
            >
              ← Efficiency Score
            </text>

            {/* Axis Values */}
            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <text 
                  x={xScale(val)} 
                  y={chartHeight + 20} 
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="#374151"
                >
                  {val}
                </text>
                <text 
                  x={-10} 
                  y={yScale(val) + 4} 
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="#374151"
                >
                  {val}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredChannel && (
          <div 
            style={{
              position: 'absolute',
              left: tooltipPosition.x + 15,
              top: tooltipPosition.y - 10,
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              maxWidth: '200px',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: tooltipPosition.x > 400 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '13px' }}>
              {hoveredChannel.name}
            </div>
            <div style={{ margin: '3px 0', fontWeight: '500', fontSize: '11px' }}>
              Effectiveness: {hoveredChannel.effectiveness.toFixed(1)}
            </div>
            <div style={{ margin: '3px 0', fontWeight: '500', fontSize: '11px' }}>
              Efficiency: {hoveredChannel.efficiency.toFixed(1)}
            </div>
            <div style={{ margin: '3px 0', fontWeight: '500', fontSize: '11px' }}>
              Revenue: {hoveredChannel.revenue.toFixed(1)}%
            </div>
            {hoveredChannel.trend !== 'stable' && (
              <div 
                style={{ 
                  marginTop: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: hoveredChannel.trend === 'increasing' ? '#00ff88' : '#ff4757'
                }}
              >
                Trend: {hoveredChannel.trend}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const generateChannelEffectiveness = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const validQuestions = questions.filter(q => 
        userAnswers[q._id] && 
        userAnswers[q._id].trim() && 
        userAnswers[q._id] !== '[Question Skipped]'
      );

      if (validQuestions.length === 0) {
        throw new Error('No answered questions available');
      }

      const questionsArray = validQuestions.map(q => q.question_text.trim());
      const answersArray = validQuestions.map(q => userAnswers[q._id].trim());

      const response = await fetch(`${ML_API_BASE_URL}/channel-effectiveness`, {
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
        throw new Error(`API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating channel effectiveness:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

 useEffect(() => {
    const hasAnswers = questions.some(q => userAnswers[q._id]?.trim());
    
    // Only auto-generate if not part of a phase regeneration
    if (!channelEffectivenessData && 
        hasAnswers && 
        !isGenerating && 
        !isRegenerating && 
        !isPhaseRegenerating && 
        !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generateChannelEffectiveness();
    }
  }, [questions, userAnswers, channelEffectivenessData, isRegenerating, isPhaseRegenerating]);

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate();
    } else {
      hasGeneratedRef.current = false;
      await generateChannelEffectiveness();
    }
  };

  // Loading State
  if (isGenerating || isRegenerating) {
    return (
      <div className="channel-effectiveness-analysis">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating channel effectiveness analysis..."
              : "Generating channel effectiveness analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !channelEffectivenessData) {
    return (
      <div className="channel-effectiveness-analysis">
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

  // Check if data is incomplete, has NaN values, or no valid processed data
  if (!channelEffectivenessData || isChannelEffectivenessDataIncomplete(channelEffectivenessData) || !hasValidData) {
    return (
      <div className="channel-effectiveness-analysis">
        <AnalysisEmptyState
          analysisType="channelEffectiveness"
          analysisDisplayName="Channel Effectiveness Analysis"
          icon={BarChart3}
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

  return (
    <div className='channel-effectiveness-analysis'> 
      <div style={{ padding: '24px' }}>
        <BubbleChart data={processedData} />
      </div>
    </div>
  );
};

export default ChannelEffectivenessMap;