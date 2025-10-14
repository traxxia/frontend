import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader, RefreshCw, BarChart3 } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
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
  onRedirectToBrief
}) => { 
  const [data, setData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const bubbleChartRef = useRef(null); 
  const hasInitialized = useRef(false);

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
 
  const handleRegenerate = async () => {
    console.log('ChannelEffectiveness handleRegenerate called', { onRegenerate: !!onRegenerate });
    
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in ChannelEffectiveness regeneration:', error);
        setError(error.message || 'Failed to regenerate analysis');
      }
    } else {
      console.warn('No onRegenerate prop provided to ChannelEffectivenessMap');
      setError('Regeneration not available');
    }
  };
 
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      handleRegenerate();
    }
  };
 
  const isChannelEffectivenessDataIncomplete = (data) => {
    if (!data) return true; 
    if (!data.channelEffectiveness?.channels || data.channelEffectiveness.channels.length === 0) return true; 
    const mainData = data.channelEffectiveness;
    if (!mainData) return true; 
    const hasValidChannels = mainData.channels.some(channel => {
      if (!channel.name) return false; 
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
 
        for (const value of Object.values(obj)) {
          if (checkValue(value)) return true;
          if (typeof value === 'object' && value !== null) {
            if (hasInsufficientDataIndicators(value)) return true;
          }
        }
        return false;
      }; 
      if (hasInsufficientDataIndicators(channel.effectiveness) ||
        hasInsufficientDataIndicators(channel.efficiency)) {
        return false;
      } 
      const effectiveness = extractScore(channel.effectiveness, 'effectiveness');
      const efficiency = extractScore(channel.efficiency, 'efficiency'); 
      if (isNaN(effectiveness) || isNaN(efficiency)) return false;
      if (!isFinite(effectiveness) || !isFinite(efficiency)) return false;

      return true;
    });

    return !hasValidChannels;
  };
 
  const extractScore = (data, type) => {
    if (!data) { 
      return 50;  
    }

    let score = null; 
    if (typeof data.score === 'number' && !isNaN(data.score) && isFinite(data.score)) {
      score = Math.min(Math.max(data.score, 0), 100);
    } else if (typeof data.customerSatisfaction === 'number' && !isNaN(data.customerSatisfaction) && isFinite(data.customerSatisfaction)) {
      score = Math.min(Math.max(data.customerSatisfaction * 10, 0), 100);
    } else if (typeof data.roi === 'number' && !isNaN(data.roi) && isFinite(data.roi)) {
      score = Math.min(Math.max(data.roi, 0), 100);
    } else if (typeof data.costPerAcquisition === 'number' && !isNaN(data.costPerAcquisition) && isFinite(data.costPerAcquisition)) {
      score = Math.max(Math.min(100 - data.costPerAcquisition, 100), 0);
    } 
    if (score !== null) return score; 
    const qualitativeMap = {
      'highest': 95, 'excellent': 90, 'high': 80,
      'good': 70, 'medium': 60, 'moderate': 50,
      'low': 30, 'poor': 20, 'lowest': 10
    }; 
    for (const value of Object.values(data)) {
      if (typeof value === 'string') {
        const mapped = qualitativeMap[value.toLowerCase()];
        if (mapped && !isNaN(mapped)) return mapped;
      }
    } 
    return 50;
  };

  const getChannelColor = (index) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#a55eea', '#26de81'];
    return colors[index % colors.length];
  };
 
  const processBubbleData = (channels) => {
    if (!channels || channels.length === 0) return [];

    const validChannels = channels
      .map((channel, index) => { 
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
          for (const value of Object.values(obj)) {
            if (checkValue(value)) return true;
            if (typeof value === 'object' && value !== null) {
              if (hasInsufficientData(value)) return true;
            }
          }
          return false;
        };
 
        if (hasInsufficientData(channel)) {
          console.warn(`Skipping channel ${channel.name} due to insufficient data indicators`);
          return null;
        } 
        const effectiveness = extractScore(channel.effectiveness, 'effectiveness');
        const efficiency = extractScore(channel.efficiency, 'efficiency'); 
        let revenue = 25;   
        if (channel.effectiveness?.revenueContribution) {
          const revenueValue = channel.effectiveness.revenueContribution; 
          if (typeof revenueValue === 'string') {
            const lowerValue = revenueValue.toLowerCase();
            if (lowerValue.includes('not enough data') ||
              lowerValue.includes('insufficient data') ||
              lowerValue.includes('no data') ||
              lowerValue.includes('unavailable')) {
              console.warn(`Skipping channel ${channel.name} due to insufficient revenue data: ${revenueValue}`);
              return null;
            } 
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
        if (channel.revenue) {
          const channelRevenue = typeof channel.revenue === 'number' ? channel.revenue : parseFloat(channel.revenue);
          if (!isNaN(channelRevenue) && isFinite(channelRevenue)) {
            revenue = channelRevenue;
          }
        } 
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
      .filter(channel => channel !== null);  

    return validChannels;
  }; 
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (channelEffectivenessData) {
      setData(channelEffectivenessData);
      setHasGenerated(true);
      setError(null);
    }
  }, [channelEffectivenessData]);
 
  useEffect(() => {
    if (channelEffectivenessData) {
      setData(channelEffectivenessData);
      setHasGenerated(true);
      setError(null);
    } else if (channelEffectivenessData === null) { 
      setData(null);
      setHasGenerated(false);
    }
  }, [channelEffectivenessData]); 

  const processedData = useMemo(() => {
    if (!data?.channelEffectiveness?.channels) {
      return [];
    }
    return processBubbleData(data.channelEffectiveness.channels);
  }, [data]);
 
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
 
            <line
              x1={0} x2={chartWidth}
              y1={chartHeight / 2} y2={chartHeight / 2}
              stroke="#374151"
              strokeWidth="2"
            />
            <line
              x1={chartWidth / 2} x2={chartWidth / 2}
              y1={0} y2={chartHeight}
              stroke="#374151"
              strokeWidth="2"
            /> 
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
 
            {data.map((channel) => {
              const x = xScale(channel.effectiveness);
              const y = yScale(channel.efficiency);
              const radius = radiusScale(channel.revenue); 
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
  if (isRegenerating) {
    return (
      <div className="channel-effectiveness-analysis">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating Channel Effectiveness Analysis...</span>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="channel-effectiveness-analysis">
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Channel Effectiveness Analysis Error"
        />
      </div>
    );
  } 
  if (!hasGenerated || !data?.channelEffectiveness || isChannelEffectivenessDataIncomplete(data) || !hasValidData) {
    return (
      <div className="channel-effectiveness-analysis">
        <AnalysisEmptyState
          analysisType="channelEffectiveness"
          analysisDisplayName="Channel Effectiveness Analysis"
          icon={BarChart3}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate && !!onRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />
      </div>
    );
  }

  return (
    <div className='channel-effectiveness-analysis'
         data-analysis-type="channelEffectiveness"
         data-analysis-name="Channel Effectiveness Map"
         data-analysis-order="11">
      <div style={{ padding: '24px' }}>
        <BubbleChart data={processedData} />
      </div>
    </div>
  );
};

export default ChannelEffectivenessMap;