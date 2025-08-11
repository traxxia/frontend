import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import RegenerateButton from './RegenerateButton';

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
    const [expandedSections, setExpandedSections] = useState({});

    // API Configuration
    const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // Save to backend using the phase analysis API (same as SWOT)
    const saveToBackend = async (analysisData) => {
        try {
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phase: 'essential', // Competitive Advantage is part of essential phase
                    analysis_type: 'competitiveAdvantage',
                    analysis_name: 'Competitive Advantage Analysis',
                    analysis_data: analysisData,
                    business_id: selectedBusinessId,
                    metadata: {
                        generated_at: new Date().toISOString(),
                        business_name: businessName,
                        phase: 'essential',
                        generation_context: 'regular_generation'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save Competitive Advantage analysis');
            }

            const result = await response.json(); 
            return result;
        } catch (error) {
            console.error('Error saving Competitive Advantage analysis to backend:', error);
            throw error;
        }
    };

    // Generate Competitive Advantage Analysis from API
    const generateCompetitiveAdvantageAnalysis = async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            setError(null);
            setData(null); // Clear existing data like SWOT does

            const questionsArray = [];
            const answersArray = [];

            // Filter and sort questions like SWOT does
            const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

            sortedQuestions.forEach(question => {
                const questionId = question._id || question.question_id;
                if (userAnswers[questionId] && userAnswers[questionId].trim()) {
                    // Clean the text like SWOT does
                    const cleanQuestion = String(question.question_text)
                        .replace(/[\u2018\u2019]/g, "'")
                        .replace(/[\u201C\u201D]/g, '"')
                        .replace(/[\u2013\u2014]/g, '-')
                        .replace(/[\u2026]/g, '...')
                        .replace(/[^\x00-\x7F]/g, '')
                        .trim();

                    const cleanAnswer = String(userAnswers[questionId])
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
                throw new Error('No answered questions available for competitive advantage analysis');
            }
 

            // Call ML Backend
            const response = await fetch(`${ML_API_BASE_URL}/competitive-advantage`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
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

            // Set local state
            setData(result);
            setHasGenerated(true);

            // Save to backend using phase analysis API (like SWOT)
            await saveToBackend(result);
             
            return result;

        } catch (error) {
            console.error('Error generating Competitive Advantage analysis:', error);
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

    // Handle regeneration - Updated to match SWOT pattern
    const handleRegenerate = async () => {
        if (onRegenerate) {
            // If parent component provides regeneration handler, use it
            await onRegenerate();
        } else {
            // Otherwise, handle regeneration internally
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

    // Get intensity color class
    const getIntensityColor = (score) => {
        if (score >= 8) return 'high-intensity';
        if (score >= 6) return 'medium-intensity';
        return 'low-intensity';
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
                                        className={`data-point ${diff.uniqueness >= 7 && diff.customerValue >= 7 ? 'sweet-spot' :
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

    // Loading state
    if (isLoading || isRegenerating) {
        return (
            <div className="competitive-advantage-container">
                <div className="loading-state">
                    <Loader className="loading-spinner" />
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
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>{error}</p>
                    <button onClick={handleRegenerate} className="retry-button">
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
                <div className="empty-state">
                    <Shield size={48} className="empty-icon" />
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
            <div className="cs-header">
                <div className="cs-title-section">
                    <Shield className="main-icon" size={24} />
                    <div>
                        <h2 className="cs-title">Competitive Advantage Matrix</h2>
                    </div>
                </div>
                <RegenerateButton
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    sectionName="Competitive Advantage"
                    size="medium"
                />
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
                        {/* Market Position Section */}
                        {advantage.competitivePosition && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('position')}>
                                    <h3>Market Position</h3>
                                    {expandedSections.position ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>

                                {expandedSections.position !== false && (
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
                                                    <td><strong>Overall Score</strong></td>
                                                    <td>{advantage.competitivePosition.overallScore}/10</td>
                                                    <td>
                                                        <span className={`status-badge ${getIntensityColor(advantage.competitivePosition.overallScore)}`}>
                                                            {advantage.competitivePosition.overallScore >= 8 ? 'Strong' :
                                                                advantage.competitivePosition.overallScore >= 6 ? 'Moderate' : 'Weak'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Market Position</strong></td>
                                                    <td>{advantage.competitivePosition.marketPosition}</td>
                                                    <td>
                                                        <span className={`status-badge ${advantage.competitivePosition.marketPosition?.toLowerCase()}`}>
                                                            {advantage.competitivePosition.marketPosition}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Sustainable Advantages</strong></td>
                                                    <td>{advantage.competitivePosition.sustainableAdvantages}</td>
                                                    <td>-</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Vulnerable Advantages</strong></td>
                                                    <td>{advantage.competitivePosition.vulnerableAdvantages}</td>
                                                    <td>-</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Customer Choice Drivers Section */}
                        {advantage.customerChoiceReasons && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('choice')}>
                                    <h3>Customer Choice Drivers</h3>
                                    {expandedSections.choice ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>

                                {expandedSections.choice !== false && (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Reason</th>
                                                    <th>Frequency</th>
                                                    <th>Linked Differentiator</th>
                                                    <th>Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {advantage.customerChoiceReasons
                                                    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
                                                    .map((reason, index) => (
                                                        <tr key={index}>
                                                            <td><strong>{reason.reason}</strong></td>
                                                            <td>
                                                                <span className="frequency-badge">{reason.frequency || 0}%</span>
                                                            </td>
                                                            <td>
                                                                {reason.linkedDifferentiator && (
                                                                    <span className="linked-badge">
                                                                        {reason.linkedDifferentiator}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${(reason.frequency || 0) >= 70 ? 'high-intensity' :
                                                                        (reason.frequency || 0) >= 40 ? 'medium-intensity' : 'low-intensity'
                                                                    }`}>
                                                                    {(reason.frequency || 0) >= 70 ? 'High' :
                                                                        (reason.frequency || 0) >= 40 ? 'Medium' : 'Low'}
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
                        {/* Differentiators Section */}
                        {advantage.differentiators && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('differentiators')}>
                                    <h3>Key Differentiators</h3>
                                    {expandedSections.differentiators ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>

                                {expandedSections.differentiators !== false && (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Differentiator</th>
                                                    <th>Description</th>
                                                    <th>Uniqueness</th>
                                                    <th>Customer Value</th>
                                                    <th>Sustainability</th>
                                                    <th>Proof Points</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {advantage.differentiators.map((diff, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{diff.type}</strong></td>
                                                        <td>{diff.description}</td>
                                                        <td>
                                                            <span className={`score-badge ${getIntensityColor(diff.uniqueness)}`}>
                                                                {diff.uniqueness}/10
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`score-badge ${getIntensityColor(diff.customerValue)}`}>
                                                                {diff.customerValue}/10
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`score-badge ${getIntensityColor(diff.sustainability)}`}>
                                                                {diff.sustainability}/10
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {diff.proofPoints && diff.proofPoints.length > 0 && (
                                                                <ul className="list-items">
                                                                    {diff.proofPoints.map((point, idx) => (
                                                                        <li key={idx}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            )}
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
            </div>
        </div>
    );
};

export default CompetitiveAdvantageMatrix;