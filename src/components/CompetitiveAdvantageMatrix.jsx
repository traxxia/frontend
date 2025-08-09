import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity } from 'lucide-react';


const CompetitiveAdvantageMatrix = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    competitiveAdvantageData = null,
    selectedBusinessId
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // API Configuration
    const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';

    // Generate Competitive Advantage Analysis from API
    const generateCompetitiveAdvantageAnalysis = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const questionsArray = [];
            const answersArray = [];

            questions
                .filter(q => userAnswers[q._id] && userAnswers[q._id].trim())
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .forEach(question => {
                    questionsArray.push(question.question_text);
                    answersArray.push(userAnswers[question._id]);
                });

            if (questionsArray.length === 0) {
                throw new Error('No questions available for competitive advantage analysis');
            }

            const response = await fetch(`${ML_API_BASE_URL}/competitive-advantage`, {
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
                const errorText = await response.text();
                throw new Error(`Competitive Advantage API returned ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            // Validate response structure
            if (!result.competitiveAdvantage) {
                throw new Error('Invalid API response structure: missing competitiveAdvantage');
            }

            setData(result);
            setHasGenerated(true);
            return result;

        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize component
    useEffect(() => {
        if (competitiveAdvantageData) {
            setData(competitiveAdvantageData);
            setHasGenerated(true);
        } else {
            // Check if we have enough data to generate analysis
            const answeredCount = Object.keys(userAnswers).length;
            if (answeredCount >= 5 && questions.length > 0) {
                generateCompetitiveAdvantageAnalysis();
            }
        }
    }, [competitiveAdvantageData]);

    // Handle regeneration
    const handleRegenerate = async () => {
        if (onRegenerate) {
            onRegenerate();
        } else {
            await generateCompetitiveAdvantageAnalysis();
        }
    };

    // Get position color
    const getPositionColor = (position) => {
        const colors = {
            'leader': '#10b981',
            'challenger': '#f59e0b', 
            'follower': '#6b7280',
            'nicher': '#8b5cf6'
        };
        return colors[position] || '#6b7280';
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    // Render Scatter Plot
    const renderScatterPlot = (differentiators) => {
        if (!differentiators || differentiators.length === 0) return null;

        const maxValue = 10;
        const plotSize = 400;
        const padding = 50;
        const plotArea = plotSize - (padding * 2);

        return (
            <div className="scatter-plot-container">
                <h4>Competitive Advantage vs Customer Value Matrix</h4>
                
                <div className="plot-wrapper">
                    <svg width={plotSize} height={plotSize} className="scatter-plot">
                        {/* Grid lines */}
                        {[0, 2, 4, 6, 8, 10].map(value => {
                            const pos = padding + (value / maxValue) * plotArea;
                            return (
                                <g key={value}>
                                    <line
                                        x1={padding}
                                        y1={pos}
                                        x2={plotSize - padding}
                                        y2={pos}
                                        className="grid-line"
                                    />
                                    <line
                                        x1={pos}
                                        y1={padding}
                                        x2={pos}
                                        y2={plotSize - padding}
                                        className="grid-line"
                                    />
                                </g>
                            );
                        })}

                        {/* Axes */}
                        <line
                            x1={padding}
                            y1={plotSize - padding}
                            x2={plotSize - padding}
                            y2={plotSize - padding}
                            className="axis-line"
                        />
                        <line
                            x1={padding}
                            y1={padding}
                            x2={padding}
                            y2={plotSize - padding}
                            className="axis-line"
                        />

                        {/* Quadrant backgrounds */}
                        <rect
                            x={padding + plotArea * 0.5}
                            y={padding}
                            width={plotArea * 0.5}
                            height={plotArea * 0.5}
                            className="quadrant sweet-spot"
                        />

                        {/* Data points */}
                        {differentiators.map((diff, index) => {
                            const x = padding + (diff.uniqueness / maxValue) * plotArea;
                            const y = plotSize - padding - (diff.customerValue / maxValue) * plotArea;
                            
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={8 + (diff.sustainability || 5) / 2}
                                        className={`data-point ${
                                            diff.uniqueness >= 7 && diff.customerValue >= 7 ? 'sweet-spot' : 
                                            diff.uniqueness >= 7 ? 'niche' : 
                                            diff.customerValue >= 7 ? 'high-value' : 'improve'
                                        }`}
                                    />
                                    <text
                                        x={x}
                                        y={y - 15}
                                        className="data-label"
                                    >
                                        {diff.type}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Axis labels */}
                        <text
                            x={plotSize / 2}
                            y={plotSize - 10}
                            className="axis-label"
                        >
                            Competitive Uniqueness →
                        </text>
                        <text
                            x={15}
                            y={plotSize / 2}
                            className="axis-label vertical"
                            transform={`rotate(-90, 15, ${plotSize / 2})`}
                        >
                            Customer Value →
                        </text>
                    </svg>

                    {/* Legend */}
                    <div className="plot-legend">
                        <div className="legend-item">
                            <div className="legend-dot sweet-spot"></div>
                            <span>Sweet Spot (High Value + High Uniqueness)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot niche"></div>
                            <span>Niche Advantage</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot high-value"></div>
                            <span>High Value</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot improve"></div>
                            <span>Needs Improvement</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render Spider Chart (Radar Chart)
    const renderSpiderChart = (differentiators) => {
        if (!differentiators || differentiators.length === 0) return null;

        const size = 300;
        const center = size / 2;
        const radius = size / 2 - 40;
        const numSides = differentiators.length;

        // Calculate points for the spider web
        const getPoint = (index, value, maxValue = 10) => {
            const angle = (index * 2 * Math.PI / numSides) - Math.PI / 2;
            const distance = (value / maxValue) * radius;
            return {
                x: center + distance * Math.cos(angle),
                y: center + distance * Math.sin(angle)
            };
        };

        return (
            <div className="spider-chart-container">
                <h4>Differentiators Radar Chart</h4>
                
                <div className="chart-wrapper">
                    <svg width={size} height={size} className="spider-chart">
                        {/* Background web */}
                        {[2, 4, 6, 8, 10].map(value => (
                            <polygon
                                key={value}
                                points={differentiators.map((_, index) => {
                                    const point = getPoint(index, value);
                                    return `${point.x},${point.y}`;
                                }).join(' ')}
                                className="web-line"
                            />
                        ))}

                        {/* Radial lines */}
                        {differentiators.map((_, index) => {
                            const point = getPoint(index, 10);
                            return (
                                <line
                                    key={index}
                                    x1={center}
                                    y1={center}
                                    x2={point.x}
                                    y2={point.y}
                                    className="radial-line"
                                />
                            );
                        })}

                        {/* Company performance polygon */}
                        <polygon
                            points={differentiators.map((diff, index) => {
                                const point = getPoint(index, diff.customerValue);
                                return `${point.x},${point.y}`;
                            }).join(' ')}
                            className="performance-polygon"
                        />

                        {/* Data points */}
                        {differentiators.map((diff, index) => {
                            const point = getPoint(index, diff.customerValue);
                            return (
                                <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    className="radar-point"
                                />
                            );
                        })}

                        {/* Labels */}
                        {differentiators.map((diff, index) => {
                            const labelPoint = getPoint(index, 11);
                            return (
                                <text
                                    key={index}
                                    x={labelPoint.x}
                                    y={labelPoint.y}
                                    className="radar-label"
                                    textAnchor="middle"
                                >
                                    {diff.type}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    // Render Competitive Position
    const renderCompetitivePosition = (position) => {
        if (!position) return null;

        return (
            <div className="competitive-position-grid">
                <div className="position-card overall-score">
                    <div className="metric-value" style={{ color: getScoreColor(position.overallScore) }}>
                        {position.overallScore}/10
                    </div>
                    <div className="metric-label">Overall Score</div>
                </div>

                <div className="position-card market-position">
                    <div className="metric-value" style={{ color: getPositionColor(position.marketPosition) }}>
                        {position.marketPosition}
                    </div>
                    <div className="metric-label">Market Position</div>
                </div>

                <div className="position-card sustainable">
                    <div className="metric-value">{position.sustainableAdvantages}</div>
                    <div className="metric-label">Sustainable Advantages</div>
                </div>

                <div className="position-card vulnerable">
                    <div className="metric-value">{position.vulnerableAdvantages}</div>
                    <div className="metric-label">Vulnerable Advantages</div>
                </div>
            </div>
        );
    };

    // Render Differentiators List
    const renderDifferentiatorsList = (differentiators) => {
        if (!differentiators || differentiators.length === 0) return null;

        return (
            <div className="differentiators-list">
                <h4>
                    <Award size={18} />
                    Key Differentiators
                </h4>
                
                <div className="differentiators-grid">
                    {differentiators.map((diff, index) => (
                        <div key={index} className="differentiator-card">
                            <div className="differentiator-header">
                                <h5>{diff.type} - {diff.description}</h5>
                                <div className="score-badges">
                                    <span className="score-badge" style={{ backgroundColor: getScoreColor(diff.uniqueness) }}>
                                        Unique: {diff.uniqueness}/10
                                    </span>
                                    <span className="score-badge" style={{ backgroundColor: getScoreColor(diff.customerValue) }}>
                                        Value: {diff.customerValue}/10
                                    </span>
                                    <span className="score-badge" style={{ backgroundColor: getScoreColor(diff.sustainability) }}>
                                        Sustainable: {diff.sustainability}/10
                                    </span>
                                </div>
                            </div>

                            {diff.proofPoints && diff.proofPoints.length > 0 && (
                                <div className="proof-points">
                                    <strong>Proof Points:</strong>
                                    <ul>
                                        {diff.proofPoints.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render Customer Choice Reasons
    const renderCustomerChoiceReasons = (reasons) => {
        if (!reasons || reasons.length === 0) return null;

        return (
            <div className="customer-choice-reasons">
                <h4>
                    <TrendingUp size={18} />
                    Why Customers Choose {businessName || 'Us'}
                </h4>
                
                <div className="reasons-list">
                    {reasons
                        .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
                        .map((reason, index) => (
                            <div key={index} className="reason-item">
                                <div className="reason-content">
                                    <span className="reason-text">{reason.reason}</span>
                                    {reason.linkedDifferentiator && (
                                        <span className="linked-badge">
                                            Linked to {reason.linkedDifferentiator}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="frequency-display">
                                    <div className="frequency-bar">
                                        <div 
                                            className="frequency-fill"
                                            style={{ width: `${reason.frequency || 0}%` }}
                                        />
                                    </div>
                                    <span className="frequency-text">{reason.frequency || 0}%</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        );
    };

    // Loading state
    if (isLoading || isRegenerating) {
        return (
            <div className="competitive-advantage-container">
                <div className="competitive-advantage-loading">
                    <Loader className="spinner" />
                    <h3>Analyzing Competitive Advantages...</h3>
                    <p>Evaluating your market position and competitive differentiators...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="competitive-advantage-container">
                <div className="competitive-advantage-error">
                    <Shield />
                    <h3>Analysis Error</h3>
                    <p>{error}</p>
                    <button onClick={handleRegenerate} className="retry-btn">
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!hasGenerated || !data?.competitiveAdvantage) {
        const answeredCount = Object.keys(userAnswers).length;
        return (
            <div className="competitive-advantage-container">
                <div className="competitive-advantage-empty">
                    <Shield size={48} />
                    <h3>Competitive Advantage Matrix</h3>
                    <p>
                        {answeredCount < 5
                            ? `Answer ${5 - answeredCount} more questions to generate competitive advantage analysis.`
                            : "Complete essential phase questions to unlock competitive advantage analysis."
                        }
                    </p>
                </div>
            </div>
        );
    }

    const advantage = data.competitiveAdvantage;

    return (
        <div className="competitive-advantage-container">
            {/* Header */}
            <div className="competitive-advantage-header">
                <div className="header-content">
                    <Shield className="header-icon" />
                    <div>
                        <h1>Competitive Advantage Matrix</h1>
                        <p>Analysis of your competitive differentiators and market position for {businessName}</p>
                    </div>
                </div>
                {canRegenerate && onRegenerate && (
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="regenerate-btn"
                    >
                        <RefreshCw size={16} />
                        Regenerate
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="competitive-advantage-tabs">
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'matrix', label: 'Scatter Plot', icon: BarChart3 },
                    { id: 'radar', label: 'Spider Chart', icon: Activity },
                    { id: 'details', label: 'Details', icon: Award },
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
                        <div className="overview-section">
                            <h3>Market Position</h3>
                            {advantage.competitivePosition && renderCompetitivePosition(advantage.competitivePosition)}
                        </div>

                        <div className="overview-section">
                            <h3>Customer Choice Drivers</h3>
                            {advantage.customerChoiceReasons && renderCustomerChoiceReasons(advantage.customerChoiceReasons)}
                        </div>
                    </div>
                )}

                {activeTab === 'matrix' && (
                    <div className="matrix-content">
                        {advantage.differentiators && renderScatterPlot(advantage.differentiators)}
                    </div>
                )}

                {activeTab === 'radar' && (
                    <div className="radar-content">
                        {advantage.differentiators && renderSpiderChart(advantage.differentiators)}
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="details-content">
                        {advantage.differentiators && renderDifferentiatorsList(advantage.differentiators)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetitiveAdvantageMatrix;