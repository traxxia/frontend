import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Target, TrendingUp, Users } from 'lucide-react';
import RegenerateButton from './RegenerateButton';

const StrategicPositioningRadar = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    strategicRadarData = null,
    selectedBusinessId
}) => {
    const [data, setData] = useState(strategicRadarData);
    const [activeView, setActiveView] = useState('radar'); // 'radar' or 'positioning'
    const [hasGenerated, setHasGenerated] = useState(false);

    // Handle regeneration - same pattern as other components in business page
    const handleRegenerate = async () => {
        if (onRegenerate) {
            onRegenerate();
        }
    };

    useEffect(() => {
        if (strategicRadarData) {
            // Handle both wrapped and direct API response formats
            let normalizedData;
            if (strategicRadarData.strategicRadar) {
                // Data is already wrapped
                normalizedData = strategicRadarData;
            } else if (strategicRadarData.dimensions) {
                // Data is direct from API, needs wrapping
                normalizedData = { strategicRadar: strategicRadarData };
            } else {
                normalizedData = null;
            }
            
            if (normalizedData) {
                setData(normalizedData);
                setHasGenerated(true);
            } else {
                setData(null);
                setHasGenerated(false);
            }
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [strategicRadarData]);

    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#3b82f6';
        if (score >= 4) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreClass = (score) => {
        if (score >= 8) return 'score-excellent';
        if (score >= 6) return 'score-good';
        if (score >= 4) return 'score-average';
        return 'score-poor';
    };

    // Radar Chart Component
    const RadarChart = ({ dimensions }) => {
        const size = 320;
        const center = size / 2;
        const maxRadius = 130;
        const levels = 5;
        const angleStep = (2 * Math.PI) / dimensions.length;
        
        const getCoordinates = (score, angle) => {
            const radius = (score / 10) * maxRadius;
            const x = center + radius * Math.cos(angle - Math.PI / 2);
            const y = center + radius * Math.sin(angle - Math.PI / 2);
            return { x, y };
        };

        // Generate grid circles
        const gridCircles = Array.from({ length: levels }, (_, i) => {
            const radius = ((i + 1) / levels) * maxRadius;
            return (
                <circle
                    key={i}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                />
            );
        });

        // Generate axes and labels
        const axes = dimensions.map((dimension, i) => {
            const angle = i * angleStep;
            const endX = center + maxRadius * Math.cos(angle - Math.PI / 2);
            const endY = center + maxRadius * Math.sin(angle - Math.PI / 2);
            
            const labelX = center + (maxRadius + 25) * Math.cos(angle - Math.PI / 2);
            const labelY = center + (maxRadius + 25) * Math.sin(angle - Math.PI / 2);

            return (
                <g key={i}>
                    <line
                        x1={center}
                        y1={center}
                        x2={endX}
                        y2={endY}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                    />
                    <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="500"
                        fill="#374151"
                    >
                        {dimension.name}
                    </text>
                </g>
            );
        });

        // Current and target score paths
        const currentPoints = dimensions.map((dimension, i) => {
            const angle = i * angleStep;
            return getCoordinates(dimension.currentScore, angle);
        });

        const targetPoints = dimensions.map((dimension, i) => {
            const angle = i * angleStep;
            return getCoordinates(dimension.targetScore, angle);
        });

        const currentPath = `M ${currentPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
        const targetPath = `M ${targetPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

        return (
            <div className="radar-chart-container">
                <svg width={size} height={size} style={{ overflow: 'visible' }}>
                    {gridCircles}
                    {axes}
                    
                    {/* Scale labels */}
                    {Array.from({ length: levels }, (_, i) => {
                        const value = ((i + 1) * 10) / levels;
                        const y = center - ((i + 1) / levels) * maxRadius;
                        return (
                            <text
                                key={i}
                                x={center + 8}
                                y={y + 4}
                                fontSize="10"
                                fill="#9ca3af"
                            >
                                {value}
                            </text>
                        );
                    })}
                    
                    {/* Target area (dashed) */}
                    <path 
                        d={targetPath} 
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                    
                    {/* Current area */}
                    <path 
                        d={currentPath} 
                        fill="rgba(16, 185, 129, 0.2)"
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                    
                    {/* Current score points */}
                    {currentPoints.map((point, i) => (
                        <circle
                            key={`current-${i}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#10b981"
                        />
                    ))}
                    
                    {/* Target score points */}
                    {targetPoints.map((point, i) => (
                        <circle
                            key={`target-${i}`}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill="#3b82f6"
                        />
                    ))}
                </svg>
                
                <div className="radar-legend">
                    <div className="legend-item">
                        <span className="legend-color current"></span>
                        <span>Current Score</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color target"></span>
                        <span>Target Score</span>
                    </div>
                </div>
            </div>
        );
    };

    // Strategic Positioning Map Component
    const PositioningMap = ({ dimensions }) => {
        const mapSize = 320;
        const padding = 40;
        const plotSize = mapSize - (padding * 2);
        
        // Use first two dimensions for X and Y axes
        const xDimension = dimensions[0];
        const yDimension = dimensions[1];
        
        const getPosition = (xScore, yScore) => ({
            x: padding + (xScore / 10) * plotSize,
            y: padding + plotSize - (yScore / 10) * plotSize
        });

        const currentPos = getPosition(xDimension.currentScore, yDimension.currentScore);
        const targetPos = getPosition(xDimension.targetScore, yDimension.targetScore);
        const industryPos = getPosition(xDimension.industryAverage, yDimension.industryAverage);

        // Strategic quadrants
        const quadrants = [
            { name: 'Leaders', x: plotSize/2 + padding, y: padding, color: '#10b981' },
            { name: 'Challengers', x: padding, y: padding, color: '#3b82f6' },
            { name: 'Followers', x: padding, y: plotSize/2 + padding, color: '#f59e0b' },
            { name: 'Niche Players', x: plotSize/2 + padding, y: plotSize/2 + padding, color: '#8b5cf6' }
        ];

        return (
            <div className="positioning-map-container">
                <svg width={mapSize} height={mapSize}>
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width={mapSize} height={mapSize} fill="url(#grid)" />
                    
                    {/* Quadrant dividers */}
                    <line 
                        x1={mapSize/2} y1={padding} 
                        x2={mapSize/2} y2={mapSize - padding} 
                        stroke="#d1d5db" strokeWidth="2" strokeDasharray="5,5"
                    />
                    <line 
                        x1={padding} y1={mapSize/2} 
                        x2={mapSize - padding} y2={mapSize/2} 
                        stroke="#d1d5db" strokeWidth="2" strokeDasharray="5,5"
                    />
                    
                    {/* Axes */}
                    <line 
                        x1={padding} y1={mapSize - padding} 
                        x2={mapSize - padding} y2={mapSize - padding} 
                        stroke="#374151" strokeWidth="2"
                    />
                    <line 
                        x1={padding} y1={padding} 
                        x2={padding} y2={mapSize - padding} 
                        stroke="#374151" strokeWidth="2"
                    />
                    
                    {/* Axis labels */}
                    <text 
                        x={mapSize/2} 
                        y={mapSize - 10} 
                        textAnchor="middle" 
                        fontSize="12" 
                        fontWeight="500"
                        fill="#374151"
                    >
                        {xDimension.name}
                    </text>
                    <text 
                        x={15} 
                        y={mapSize/2} 
                        textAnchor="middle" 
                        fontSize="12" 
                        fontWeight="500"
                        fill="#374151"
                        transform={`rotate(-90, 15, ${mapSize/2})`}
                    >
                        {yDimension.name}
                    </text>
                    
                    {/* Scale markers */}
                    {[0, 2, 4, 6, 8, 10].map(value => (
                        <g key={`x-${value}`}>
                            <text 
                                x={padding + (value/10) * plotSize} 
                                y={mapSize - 25} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fill="#6b7280"
                            >
                                {value}
                            </text>
                        </g>
                    ))}
                    {[0, 2, 4, 6, 8, 10].map(value => (
                        <g key={`y-${value}`}>
                            <text 
                                x={25} 
                                y={padding + plotSize - (value/10) * plotSize + 4} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fill="#6b7280"
                            >
                                {value}
                            </text>
                        </g>
                    ))}
                    
                    {/* Quadrant labels */}
                    {quadrants.map((quad, i) => (
                        <text
                            key={i}
                            x={quad.x}
                            y={quad.y + 15}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill={quad.color}
                        >
                            {quad.name}
                        </text>
                    ))}
                    
                    {/* Industry average */}
                    <circle
                        cx={industryPos.x}
                        cy={industryPos.y}
                        r="6"
                        fill="#9ca3af"
                        stroke="#fff"
                        strokeWidth="2"
                    />
                    
                    {/* Current position */}
                    <circle
                        cx={currentPos.x}
                        cy={currentPos.y}
                        r="8"
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth="2"
                    />
                    
                    {/* Target position */}
                    <circle
                        cx={targetPos.x}
                        cy={targetPos.y}
                        r="6"
                        fill="#3b82f6"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeDasharray="3,3"
                    />
                    
                    {/* Movement arrow */}
                    <line
                        x1={currentPos.x}
                        y1={currentPos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke="#6b7280"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                    
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                                refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                        </marker>
                    </defs>
                </svg>
                
                <div className="positioning-legend">
                    <div className="legend-item">
                        <span className="legend-dot current"></span>
                        <span>Current Position</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot target"></span>
                        <span>Target Position</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot industry"></span>
                        <span>Industry Average</span>
                    </div>
                </div>
            </div>
        );
    };

    // Dimension Cards Component
    const DimensionCards = ({ dimensions }) => (
        <div className="dimensions-grid">
            {dimensions.map((dimension, index) => (
                <div key={index} className="dimension-card">
                    <div className="dimension-header">
                        <h4>{dimension.name}</h4>
                        <div className={`dimension-score ${getScoreClass(dimension.currentScore)}`}>
                            {dimension.currentScore}/10
                        </div>
                    </div>
                    
                    <div className="dimension-bars">
                        <div className="score-bar">
                            <div className="score-bar-header">
                                <span>Current</span>
                                <span style={{ color: getScoreColor(dimension.currentScore) }}>
                                    {dimension.currentScore}
                                </span>
                            </div>
                            <div className="score-bar-track">
                                <div 
                                    className="score-bar-fill"
                                    style={{
                                        width: `${(dimension.currentScore / 10) * 100}%`,
                                        backgroundColor: getScoreColor(dimension.currentScore)
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="score-bar">
                            <div className="score-bar-header">
                                <span>Target</span>
                                <span style={{ color: getScoreColor(dimension.targetScore) }}>
                                    {dimension.targetScore}
                                </span>
                            </div>
                            <div className="score-bar-track">
                                <div 
                                    className="score-bar-fill"
                                    style={{
                                        width: `${(dimension.targetScore / 10) * 100}%`,
                                        backgroundColor: getScoreColor(dimension.targetScore),
                                        opacity: 0.6
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="score-bar">
                            <div className="score-bar-header">
                                <span>Industry</span>
                                <span style={{ color: '#6b7280' }}>
                                    {dimension.industryAverage}
                                </span>
                            </div>
                            <div className="score-bar-track">
                                <div 
                                    className="score-bar-fill"
                                    style={{
                                        width: `${(dimension.industryAverage / 10) * 100}%`,
                                        backgroundColor: '#9ca3af'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Loading state
    if (isRegenerating) {
        return (
            <div className="strategic-radar-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h3 className='cs-title'>Strategic Positioning Radar</h3>
                    </div>
                </div>
                <div className="loading-state">
                    <Loader size={32} className="spinner" />
                    <p>Generating strategic positioning radar...</p>
                </div>
            </div>
        );
    }

    // No data state
    if (!hasGenerated && !data) {
        const answeredCount = Object.keys(userAnswers).length;
        return (
            <div className="strategic-radar-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h3 className='cs-title'>Strategic Positioning Radar</h3>
                    </div>
                    <RegenerateButton
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                        canRegenerate={canRegenerate}
                        sectionName="Strategic Positioning Radar"
                        size="medium"
                        buttonText="Generate"
                    />
                </div>

                <div className="empty-state">
                    <Target size={48} className="empty-icon" />
                    <h3>Strategic Positioning Analysis</h3>
                    <p>
                        {answeredCount < 3
                            ? `Answer ${3 - answeredCount} more questions to generate strategic positioning insights.`
                            : "Strategic positioning analysis will be generated automatically after completing the essential phase."
                        }
                    </p>
                </div>
            </div>
        );
    }

    // No data available but has attempted generation
    if (!data) {
        return (
            <div className="strategic-radar-container">
                <div className="cd-header">
                    <div className="cd-title-section">
                        <Target size={24} />
                        <h3 className='cs-title'>Strategic Positioning Radar</h3>
                    </div>
                    <RegenerateButton
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                        canRegenerate={canRegenerate}
                        sectionName="Strategic Positioning Radar"
                        size="medium"
                    />
                </div>
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>Unable to generate strategic positioning analysis. Please try regenerating or check your inputs.</p>
                </div>
            </div>
        );
    }

    // Check if data structure is valid
    if (!data.strategicRadar || !data.strategicRadar.dimensions) {
        return (
            <div className="strategic-radar-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h3 className='cs-title'>Strategic Positioning Radar</h3>
                    </div>
                    <RegenerateButton
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                        canRegenerate={canRegenerate}
                        sectionName="Strategic Positioning Radar"
                        size="medium"
                    />
                </div>
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3>Invalid Data Structure</h3>
                    <p>The strategic positioning data received is not in the expected format. Please regenerate the analysis.</p>
                </div>
            </div>
        );
    }

    const { strategicRadar } = data;
    const { dimensions, overallPosition } = strategicRadar;

    return (
        <div className="strategic-radar-container">
            {/* Header */}
            <div className="cs-header">
                <div className="cs-title-section">
                    <Target size={24} />
                    <h3 className='cs-title'>Strategic Positioning Radar</h3> 
                </div>
                <RegenerateButton
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    sectionName="Strategic Positioning Radar"
                    size="medium"
                />
            </div>

            {/* View Toggle */}
            <div className="view-toggle">
                <button
                    className={`toggle-btn ${activeView === 'radar' ? 'active' : ''}`}
                    onClick={() => setActiveView('radar')}
                >
                    <Target size={16} />
                    Radar View
                </button>
                <button
                    className={`toggle-btn ${activeView === 'positioning' ? 'active' : ''}`}
                    onClick={() => setActiveView('positioning')}
                >
                    <TrendingUp size={16} />
                    Positioning Map
                </button>
            </div>

            {/* Chart Container */}
            <div className="chart-container">
                {activeView === 'radar' ? (
                    <RadarChart dimensions={dimensions} />
                ) : (
                    <PositioningMap dimensions={dimensions} />
                )}
            </div>

            {/* Dimension Cards */}
            <DimensionCards dimensions={dimensions} />

            {/* Summary Section */}
            {overallPosition && (
                <div className="summary-section">
                    <h4 className="summary-title">
                        <Target size={20} />
                        Strategic Position Summary
                    </h4>
                    
                    <div className="summary-stats">
                        <div className="summary-stat">
                            <div className="summary-stat-label">Current Average</div>
                            <div 
                                className="summary-stat-value"
                                style={{ color: getScoreColor(overallPosition.currentAverage) }}
                            >
                                {overallPosition.currentAverage}/10
                            </div>
                        </div>
                        <div className="summary-stat">
                            <div className="summary-stat-label">Target Average</div>
                            <div 
                                className="summary-stat-value"
                                style={{ color: getScoreColor(overallPosition.targetAverage) }}
                            >
                                {overallPosition.targetAverage}/10
                            </div>
                        </div>
                    </div>

                    <div className="summary-areas">
                        <div className="summary-area strengths">
                            <h4>
                                <Users size={16} />
                                Strength Areas
                            </h4>
                            <div className="area-tags">
                                {overallPosition.strengthAreas?.map((area, index) => (
                                    <span key={index} className="area-tag strength-tag">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="summary-area improvements">
                            <h4>
                                <TrendingUp size={16} />
                                Improvement Areas
                            </h4>
                            <div className="area-tags">
                                {overallPosition.improvementAreas?.map((area, index) => (
                                    <span key={index} className="area-tag improvement-tag">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )} 
        </div>
    );
};

export default StrategicPositioningRadar;