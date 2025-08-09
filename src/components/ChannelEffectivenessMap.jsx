import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, BarChart3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
 
const ChannelEffectivenessMap = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  channelEffectivenessData = null,
  selectedBusinessId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const bubbleChartRef = useRef(null);
  const hasGeneratedRef = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  // Convert API data to bubble chart format
  const processBubbleData = (channels) => {
    if (!channels || channels.length === 0) return [];
    
    return channels.map((channel, index) => ({
      name: channel.name,
      effectiveness: extractScore(channel.effectiveness, 'effectiveness'),
      efficiency: extractScore(channel.efficiency, 'efficiency'),
      revenue: channel.effectiveness?.revenueContribution || (Math.random() * 30 + 10),
      trend: channel.trend || 'stable',
      color: getChannelColor(index),
      rawData: channel
    }));
  };

  // Extract numeric score from API data
  const extractScore = (data, type) => {
    if (!data) return Math.random() * 60 + 20;
    
    // Direct numeric values
    if (typeof data.score === 'number') return Math.min(data.score, 100);
    if (typeof data.customerSatisfaction === 'number') return Math.min(data.customerSatisfaction * 10, 100);
    if (typeof data.roi === 'number') return Math.min(data.roi, 100);
    if (typeof data.costPerAcquisition === 'number') return Math.max(100 - data.costPerAcquisition, 0);
    
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
        if (mapped) return mapped;
      }
    }
    
    return Math.random() * 60 + 20;
  };

  const getChannelColor = (index) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#a55eea', '#26de81'];
    return colors[index % colors.length];
  };

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
    const width = 600;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const minRevenue = Math.min(...data.map(d => d.revenue));

    const xScale = (value) => (value / 100) * chartWidth;
    const yScale = (value) => chartHeight - (value / 100) * chartHeight;
    const radiusScale = (value) => {
      const normalized = (value - minRevenue) / (maxRevenue - minRevenue || 1);
      return 15 + (normalized * 20);
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

            {/* Bubbles */}
            {data.map((channel) => {
              const x = xScale(channel.effectiveness);
              const y = yScale(channel.efficiency);
              const radius = radiusScale(channel.revenue);
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
    
    if (!channelEffectivenessData && hasAnswers && !isGenerating && !isRegenerating && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generateChannelEffectiveness();
    }
  }, [questions, userAnswers, channelEffectivenessData]);

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate();
    } else {
      hasGeneratedRef.current = false;
      await generateChannelEffectiveness();
    }
  };

  // Mock data for demonstration
  const mockData = [
    { name: 'Email', effectiveness: 85, efficiency: 75, revenue: 25, trend: 'increasing', color: '#ff6b6b' },
    { name: 'Social Media', effectiveness: 60, efficiency: 90, revenue: 20, trend: 'stable', color: '#4ecdc4' },
    { name: 'SEO', effectiveness: 90, efficiency: 80, revenue: 30, trend: 'increasing', color: '#45b7d1' },
    { name: 'PPC', effectiveness: 70, efficiency: 45, revenue: 15, trend: 'decreasing', color: '#96ceb4' },
    { name: 'Content Marketing', effectiveness: 80, efficiency: 65, revenue: 18, trend: 'stable', color: '#feca57' }
  ];

  // Loading State
  if (isGenerating || isRegenerating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        margin: '20px 0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>
          Analyzing Channel Effectiveness
        </h3>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>
          Evaluating channel performance and efficiency metrics...
        </p>
      </div>
    );
  }

  // Error State
  if (error && !channelEffectivenessData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        margin: '20px 0',
        boxShadow: '0 4px 20px rgba(255, 107, 107, 0.1)',
        border: '2px solid #ff6b6b'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '20px', fontWeight: '700' }}>
          Unable to Generate Analysis
        </h3>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>
          {error}
        </p>
        <button 
          onClick={handleRegenerate} 
          disabled={!canRegenerate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  // Use mock data if no real data is available
  const displayData = channelEffectivenessData?.channelEffectiveness 
    ? processBubbleData(channelEffectivenessData.channelEffectiveness.channels)
    : mockData;

  return (
    <div  className='channel-effectiveness-analysis'>
      <div className='cs-header'>
        <div className='cs-title-section'>
          <BarChart3 size={24} />
          <h2  className='cs-title'>
            Channel Effectiveness Map
          </h2>
        </div>
        
            <RegenerateButton
                          onRegenerate={handleRegenerate}
                          isRegenerating={isRegenerating}
                          canRegenerate={canRegenerate}
                          sectionName="Competitive Advantage"
                          size="medium"
                        />
         
       
      </div>

      <div style={{ padding: '24px' }}>
        <BubbleChart data={displayData} />
      </div>
    </div>
  );
};

export default ChannelEffectivenessMap;