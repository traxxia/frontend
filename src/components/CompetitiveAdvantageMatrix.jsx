import React, { useState, useEffect } from 'react';
import { Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const CompetitiveAdvantageMatrix = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    competitiveAdvantageData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(competitiveAdvantageData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState({});

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.competitiveAdvantage;

        await checkMissingQuestionsAndRedirect(
            'competitiveAdvantage',
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
            onRegenerate();
        }
    };

    // Check if the competitive advantage data is empty/incomplete
    const isCompetitiveAdvantageDataIncomplete = (data) => {
        if (!data) return true;

        // Handle both wrapped and direct API response formats
        let normalizedData;
        if (data.competitiveAdvantage) {
            normalizedData = data;
        } else if (data.differentiators || data.competitivePosition) {
            normalizedData = { competitiveAdvantage: data };
        } else {
            return true;
        }

        // Check if competitiveAdvantage exists
        if (!normalizedData.competitiveAdvantage) {
            return true;
        }

        const advantage = normalizedData.competitiveAdvantage;

        // Check if key sections are missing
        const hasDifferentiators = advantage.differentiators && advantage.differentiators.length > 0;
        const hasCompetitivePosition = advantage.competitivePosition && advantage.competitivePosition.overallScore;
        const hasCustomerChoiceReasons = advantage.customerChoiceReasons && advantage.customerChoiceReasons.length > 0;

        // At least 2 out of 3 key sections should have data for meaningful analysis
        const sectionsWithData = [hasDifferentiators, hasCompetitivePosition, hasCustomerChoiceReasons].filter(Boolean).length;

        return sectionsWithData < 2;
    };

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (competitiveAdvantageData) {
            // Handle both wrapped and direct API response formats
            let normalizedData;
            if (competitiveAdvantageData.competitiveAdvantage) {
                // Data is already wrapped
                normalizedData = competitiveAdvantageData;
            } else if (competitiveAdvantageData.differentiators || competitiveAdvantageData.competitivePosition) {
                // Data is direct from API, needs wrapping
                normalizedData = { competitiveAdvantage: competitiveAdvantageData };
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
    }, [competitiveAdvantageData]);

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
    if (isRegenerating) {
        return (
            <div className="competitive-advantage-container">
                <div className="loading-state">
                    <Loader className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating Competitive Advantage Analysis..."
                            : "Generating Competitive Advantage Analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Error state for when we have answers but no generated data
    if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
        return (
            <div className="competitive-advantage-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>Unable to generate Competitive Advantage analysis. Please try regenerating or check your inputs.</p>
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
    }

    // Check if data is incomplete and show missing questions checker
    if (!competitiveAdvantageData || isCompetitiveAdvantageDataIncomplete(competitiveAdvantageData)) {
        return (
            <div className="competitive-advantage-container">
                <AnalysisEmptyState
                    analysisType="competitiveAdvantage"
                    analysisDisplayName="Competitive Advantage Matrix"
                    icon={Shield}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    userAnswers={userAnswers}
                    minimumAnswersRequired={5}
                    customMessage="Complete essential phase questions to unlock competitive advantage analysis."
                />
            </div>
        );
    }

    // Check if data structure is valid
    if (!data?.competitiveAdvantage) {
        return (
            <div className="competitive-advantage-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Invalid Data Structure</h3>
                    <p>The Competitive Advantage data received is not in the expected format. Please regenerate the analysis.</p>
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
    }

    const advantage = data.competitiveAdvantage;

    return (
        <div className="competitive-advantage-container"
            data-analysis-type="competitiveAdvantage"
            data-analysis-name="Competitive Advantage Matrix"
            data-analysis-order="9">

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
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><div className="force-name">Overall Score</div></td>
                                                    <td>{advantage.competitivePosition.overallScore}</td>
                                                </tr>
                                                <tr>
                                                    <td><div className="force-name"> Market Position</div></td>
                                                    <td>{advantage.competitivePosition.marketPosition}</td>
                                                </tr>
                                                <tr>
                                                    <td><div className="force-name"> Sustainable Advantages</div></td>
                                                    <td>{advantage.competitivePosition.sustainableAdvantages}</td>
                                                </tr>
                                                <tr>
                                                    <td><div className="force-name"> Vulnerable Advantages</div></td>
                                                    <td>{advantage.competitivePosition.vulnerableAdvantages}</td>
                                                </tr>
                                                {/* Add Key Improvements row */}
                                                {advantage.competitivePosition.key_improvements && Array.isArray(advantage.competitivePosition.key_improvements) && advantage.competitivePosition.key_improvements.length > 0 && (
                                                    <tr>
                                                        <td><strong>Key Improvements</strong></td>
                                                        <td>
                                                            <ul className="list-items">
                                                                {advantage.competitivePosition.key_improvements.map((improvement, idx) => (
                                                                    <li key={idx}>{improvement}</li>
                                                                ))}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                )}
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
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {advantage.customerChoiceReasons
                                                    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
                                                    .map((reason, index) => (
                                                        <tr key={index}>
                                                            <td><div className="force-name"> {reason.reason}</div></td>
                                                            <td>
                                                                <span className="frequency-badge">{reason.frequency || 0}</span>
                                                            </td>
                                                            <td>
                                                                {reason.linkedDifferentiator && (
                                                                    <span className="linked-badge">
                                                                        {reason.linkedDifferentiator}
                                                                    </span>
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
                                                        <td><div className="force-name"> {diff.type}</div></td>
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