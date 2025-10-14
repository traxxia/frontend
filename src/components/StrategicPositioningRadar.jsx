import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Target, TrendingUp, Users, BarChart3, Activity, Award, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const StrategicPositioningRadar = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    strategicRadarData = null,
    selectedBusinessId,
    onRedirectToBrief // Add this prop
}) => {
    const [data, setData] = useState(strategicRadarData);
    const [activeTab, setActiveTab] = useState('overview');
    const [hasGenerated, setHasGenerated] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.strategicRadar;

        await checkMissingQuestionsAndRedirect(
            'strategicRadar',
            selectedBusinessId,
            handleRedirectToBrief,
            {
                displayName: analysisConfig.displayName,
                customMessage: analysisConfig.customMessage
            }
        );
    };

    // Check if the strategic radar data is empty/incomplete
    const isStrategicRadarDataIncomplete = (data) => {
        if (!data) return true;

        // Handle both wrapped and direct API response formats
        let normalizedData;
        if (data.strategicRadar) {
            normalizedData = data;
        } else if (data.dimensions) {
            normalizedData = { strategicRadar: data };
        } else {
            return true;
        }

        // Check if strategicRadar and dimensions exist
        if (!normalizedData.strategicRadar || !normalizedData.strategicRadar.dimensions) {
            return true;
        }

        // Check if dimensions array is empty or null
        if (!Array.isArray(normalizedData.strategicRadar.dimensions) || normalizedData.strategicRadar.dimensions.length === 0) {
            return true;
        }

        // Check if dimensions have essential data
        const hasValidDimensions = normalizedData.strategicRadar.dimensions.some(dimension =>
            dimension.name &&
            (dimension.currentScore !== undefined || dimension.targetScore !== undefined)
        );

        return !hasValidDimensions;
    };

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // Handle regeneration - same pattern as other components in business page
    const handleRegenerate = async () => {
        if (onRegenerate) {
            try {
                await onRegenerate();
            } catch (error) {
                console.error('Error in StrategicPositioningRadar regeneration:', error);
                setError(error.message || 'Failed to regenerate analysis');
            }
        }
    };

    // Handle retry for error state
    const handleRetry = () => {
        setError(null);
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
        if (score >= 8) return 'high-intensity';
        if (score >= 6) return 'medium-intensity';
        if (score >= 4) return 'low-intensity';
        return 'low-intensity';
    };

    const getPerformanceStatus = (current, target) => {
        const gap = target - current;
        if (gap <= 1) return 'On Track';
        if (gap <= 2) return 'Moderate Gap';
        return 'Significant Gap';
    };

    const getPerformanceStatusClass = (current, target) => {
        const gap = target - current;
        if (gap <= 1) return 'high-intensity';
        if (gap <= 2) return 'medium-intensity';
        return 'low-intensity';
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
            { name: 'Leaders', x: plotSize / 2 + padding, y: padding, color: '#10b981' },
            { name: 'Challengers', x: padding, y: padding, color: '#3b82f6' },
            { name: 'Followers', x: padding, y: plotSize / 2 + padding, color: '#f59e0b' },
            { name: 'Niche Players', x: plotSize / 2 + padding, y: plotSize / 2 + padding, color: '#8b5cf6' }
        ];

        return (
            <div className="positioning-map-container">
                <svg width={mapSize} height={mapSize}>
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width={mapSize} height={mapSize} fill="url(#grid)" />

                    {/* Quadrant dividers */}
                    <line
                        x1={mapSize / 2} y1={padding}
                        x2={mapSize / 2} y2={mapSize - padding}
                        stroke="#d1d5db" strokeWidth="2" strokeDasharray="5,5"
                    />
                    <line
                        x1={padding} y1={mapSize / 2}
                        x2={mapSize - padding} y2={mapSize / 2}
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
                        x={mapSize / 2}
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
                        y={mapSize / 2}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="500"
                        fill="#374151"
                        transform={`rotate(-90, 15, ${mapSize / 2})`}
                    >
                        {yDimension.name}
                    </text>

                    {/* Scale markers */}
                    {[0, 2, 4, 6, 8, 10].map(value => (
                        <g key={`x-${value}`}>
                            <text
                                x={padding + (value / 10) * plotSize}
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
                                y={padding + plotSize - (value / 10) * plotSize + 4}
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

    // Loading state
    if (isRegenerating) {
        return (
            <div className="strategic-radar-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating strategic positioning radar analysis..."
                            : "Generating strategic positioning radar analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Error state - using AnalysisError component
    if (error) {
        return (
            <div className="strategic-radar-container">
                <AnalysisError 
                    error={error}
                    onRetry={handleRetry}
                    title="Strategic Positioning Radar Analysis Error"
                />
            </div>
        );
    }

    // Error state for when analysis fails but no explicit error is set
    if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
        return (
            <div className="strategic-radar-container">
                <AnalysisError 
                    error="Unable to generate strategic positioning analysis. Please try regenerating or check your inputs."
                    onRetry={handleRetry}
                    title="Strategic Positioning Radar Analysis Error"
                />
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker
    if (!strategicRadarData || isStrategicRadarDataIncomplete(strategicRadarData)) {
        return (
            <div className="strategic-radar-container">

                {/* Replace the entire empty-state div with the common component */}
                <AnalysisEmptyState
                    analysisType="strategicRadar"
                    analysisDisplayName="Strategic Positioning Radar Analysis"
                    icon={Target}
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
    if (!data.strategicRadar || !data.strategicRadar.dimensions) {
        return (
            <div className="strategic-radar-container">
                <AnalysisError 
                    error="The strategic positioning data received is not in the expected format. Please regenerate the analysis."
                    onRetry={handleRetry}
                    title="Invalid Data Structure"
                />
            </div>
        );
    }

    const { strategicRadar } = data;
    const { dimensions, overallPosition } = strategicRadar;

    return (
        <div className="strategic-radar-container">

            {/* Navigation Tabs */}
            <div className="competitive-advantage-tabs">
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'radar', label: 'Radar View', icon: Activity },
                    { id: 'positioning', label: 'Positioning Map', icon: BarChart3 },
                    // { id: 'details', label: 'Details', icon: Award },
                ].map(tab => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <IconComponent size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="competitive-advantage-content">
                {activeTab === 'overview' && (
                    <div className="overview-content">
                        {/* Executive Summary Table */}
                        {overallPosition && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('executive')}>
                                    <h3>Executive Summary</h3>
                                    {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>

                                {expandedSections.executive !== false && (
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
                                                    <td><div className="force-name">Current Average Score</div></td>
                                                    <td>{overallPosition.currentAverage}</td>
                                                    <td>
                                                        <span className={`status-badge ${getScoreClass(overallPosition.currentAverage)}`}>
                                                            {overallPosition.currentAverage >= 8 ? 'Excellent' :
                                                                overallPosition.currentAverage >= 6 ? 'Good' :
                                                                    overallPosition.currentAverage >= 4 ? 'Average' : 'Poor'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><div className="force-name">Target Average Score</div></td>
                                                    <td>{overallPosition.targetAverage}</td>
                                                    <td>
                                                        <span className={`status-badge ${getScoreClass(overallPosition.targetAverage)}`}>
                                                            {overallPosition.targetAverage >= 8 ? 'Excellent' :
                                                                overallPosition.targetAverage >= 6 ? 'Good' :
                                                                    overallPosition.targetAverage >= 4 ? 'Average' : 'Poor'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><div className="force-name">Improvement Gap</div></td>
                                                    <td>{(overallPosition.targetAverage - overallPosition.currentAverage).toFixed(1)}</td>
                                                    <td>
                                                        <span className={`status-badge ${getPerformanceStatusClass(overallPosition.currentAverage, overallPosition.targetAverage)}`}>
                                                            {getPerformanceStatus(overallPosition.currentAverage, overallPosition.targetAverage)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {overallPosition.strengthAreas && (
                                            <div className="subsection">
                                                <h4>Strength Areas</h4>
                                                <div className="forces-tags">
                                                    {overallPosition.strengthAreas.map((area, index) => (
                                                        <span key={index} className="force-tag">{area}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {overallPosition.improvementAreas && (
                                            <div className="subsection">
                                                <h4>Improvement Areas</h4>
                                                <div className="forces-tags">
                                                    {overallPosition.improvementAreas.map((area, index) => (
                                                        <span key={index} className="force-tag">{area}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Strategic Dimensions Analysis Table */}
                        {dimensions && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('dimensions')}>
                                    <h3>Strategic Dimensions Analysis</h3>
                                    {expandedSections.dimensions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>

                                {expandedSections.dimensions !== false && (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Dimension</th>
                                                    <th>Current Score</th>
                                                    <th>Target Score</th>
                                                    <th>Industry Average</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dimensions.map((dimension, index) => (
                                                    <tr key={index}>
                                                        <td> <div className="force-name">{dimension.name} </div></td>
                                                        <td>
                                                            <span className="score-badge" style={{ backgroundColor: getScoreColor(dimension.currentScore) }}>
                                                                {dimension.currentScore}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="score-badge" style={{ backgroundColor: getScoreColor(dimension.targetScore), opacity: 0.8 }}>
                                                                {dimension.targetScore}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="score-badge" style={{ backgroundColor: '#9ca3af' }}>
                                                                {dimension.industryAverage}
                                                            </span>
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
                )}

                {activeTab === 'radar' && (
                    <div className="radar-content">
                        <RadarChart dimensions={dimensions} />
                    </div>
                )}

                {activeTab === 'positioning' && (
                    <div className="positioning-content">
                        <PositioningMap dimensions={dimensions} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicPositioningRadar;