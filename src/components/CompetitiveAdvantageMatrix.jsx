import React, { useState, useEffect } from 'react';
import { Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
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
    const [error, setError] = useState(null);
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
            try {
                await onRegenerate();
            } catch (error) {
                console.error('Error in CompetitiveAdvantage regeneration:', error);
                setError(error.message || 'Failed to regenerate analysis');
            }
        } else {
            console.warn('No onRegenerate prop provided to CompetitiveAdvantageMatrix');
            setError('Regeneration not available');
        }
    };

    const handleRetry = () => {
        setError(null);
        if (onRegenerate) {
            handleRegenerate();
        }
    };

    const isCompetitiveAdvantageDataIncomplete = (data) => {
        if (!data) return true;

        let normalizedData;
        if (data.competitiveAdvantage) {
            normalizedData = data;
        } else if (data.differentiators || data.competitivePosition) {
            normalizedData = { competitiveAdvantage: data };
        } else {
            return true;
        }
        if (!normalizedData.competitiveAdvantage) {
            return true;
        }

        const advantage = normalizedData.competitiveAdvantage;
        const hasDifferentiators = advantage.differentiators && advantage.differentiators.length > 0;
        const hasCompetitivePosition = advantage.competitivePosition && advantage.competitivePosition.overallScore;
        const hasCustomerChoiceReasons = advantage.customerChoiceReasons && advantage.customerChoiceReasons.length > 0;
        const sectionsWithData = [hasDifferentiators, hasCompetitivePosition, hasCustomerChoiceReasons].filter(Boolean).length;

        return sectionsWithData < 2;
    };

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (competitiveAdvantageData) {
            let normalizedData;
            if (competitiveAdvantageData.competitiveAdvantage) {
                normalizedData = competitiveAdvantageData;
            } else if (competitiveAdvantageData.differentiators || competitiveAdvantageData.competitivePosition) {
                normalizedData = { competitiveAdvantage: competitiveAdvantageData };
            } else {
                normalizedData = null;
            }

            if (normalizedData) {
                setData(normalizedData);
                setHasGenerated(true);
                setError(null);
            } else {
                setData(null);
                setHasGenerated(false);
            }
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [competitiveAdvantageData]);

    const getIntensityColor = (score) => {
        if (score >= 8) return 'high-intensity';
        if (score >= 6) return 'medium-intensity';
        return 'low-intensity';
    };

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

                        <rect
                            x={padding + plotArea * 0.5}
                            y={padding}
                            width={plotArea * 0.5}
                            height={plotArea * 0.5}
                            className="quadrant sweet-spot"
                        />

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

    const renderSpiderChart = (differentiators) => {
        if (!differentiators || differentiators.length === 0) return null;

        const size = 300;
        const center = size / 2;
        const radius = size / 2 - 40;
        const numSides = differentiators.length;

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

                        <polygon
                            points={differentiators.map((diff, index) => {
                                const point = getPoint(index, diff.customerValue);
                                return `${point.x},${point.y}`;
                            }).join(' ')}
                            className="performance-polygon"
                        />
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

    if (isRegenerating) {
        return (
            <div className="competitive-advantage-container">
                <div className="loading-state">
                    <Loader className="loading-spinner" />
                    <span>Regenerating Competitive Advantage Analysis...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="competitive-advantage-container">
                <AnalysisError 
                    error={error}
                    onRetry={handleRetry}
                    title="Competitive Advantage Analysis Error"
                />
            </div>
        );
    }

    if (!hasGenerated || !data?.competitiveAdvantage || isCompetitiveAdvantageDataIncomplete(data)) {
        return (
            <div className="competitive-advantage-container">
                <AnalysisEmptyState
                    analysisType="competitiveAdvantage"
                    analysisDisplayName="Competitive Advantage Matrix"
                    icon={Shield}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate && !!onRegenerate}
                    userAnswers={userAnswers}
                    minimumAnswersRequired={5}
                    customMessage="Complete essential phase questions to unlock competitive advantage analysis."
                />
            </div>
        );
    }

    const advantage = data.competitiveAdvantage;

    return (
        <div className="competitive-advantage-container"
            data-analysis-type="competitiveAdvantage"
            data-analysis-name="Competitive Advantage Matrix"
            data-analysis-order="9">
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

            <div className="competitive-advantage-content">
                {activeTab === 'overview' && (
                    <div className="overview-content">
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