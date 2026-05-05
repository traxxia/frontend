import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import { useTranslation } from '../hooks/useTranslation';

const CompetitiveAdvantageMatrix = ({
    questions = [],
    userAnswers = {},
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    competitiveAdvantageData: propCompetitiveAdvantageData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
}) => {
    const { t } = useTranslation();
    const token = useAuthStore(state => state.token);
    
    const {
        competitiveAdvantageData: storeCompetitiveAdvantageData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const rawCompetitiveData = propCompetitiveAdvantageData || storeCompetitiveAdvantageData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('competitiveAdvantage');

    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState({
        position: false,
        choice: false,
        differentiators: false
    });

    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);

    const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const advantage = useMemo(() => {
        if (!rawCompetitiveData) return null;
        if (rawCompetitiveData.competitiveAdvantage) return rawCompetitiveData.competitiveAdvantage;
        if (rawCompetitiveData.competitive_advantage) return rawCompetitiveData.competitive_advantage;
        if (rawCompetitiveData.differentiators || rawCompetitiveData.competitivePosition || rawCompetitiveData.customerChoiceReasons) return rawCompetitiveData;
        return null;
    }, [rawCompetitiveData]);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
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
    }, [selectedBusinessId, handleRedirectToBrief]);

    const handleRegenerate = useCallback(async () => {
        if (onRegenerate) {
            streamingManager?.resetCard(cardId);
            await onRegenerate();
        } else {
            streamingManager?.resetCard(cardId);
            await regenerateIndividualAnalysis('competitiveAdvantage', questions, userAnswers, selectedBusinessId);
        }
    }, [onRegenerate, streamingManager, cardId, questions, userAnswers, selectedBusinessId, regenerateIndividualAnalysis]);

    const isCompetitiveAdvantageDataIncomplete = useCallback((advantageData) => {
        if (!advantageData) return true;
        const hasDifferentiators = advantageData.differentiators && advantageData.differentiators.length > 0;
        const hasCompetitivePosition = advantageData.competitivePosition && (advantageData.competitivePosition.overallScore || advantageData.competitivePosition.marketPosition);
        const hasCustomerChoiceReasons = advantageData.customerChoiceReasons && advantageData.customerChoiceReasons.length > 0;
        const sectionsWithData = [hasDifferentiators, hasCompetitivePosition, hasCustomerChoiceReasons].filter(Boolean).length;
        return sectionsWithData < 2;
    }, []);

    const calculateTotalRows = useCallback((advantageData) => {
        if (!advantageData || isCompetitiveAdvantageDataIncomplete(advantageData)) return 0;
        let total = 0;
        if (advantageData.competitivePosition) total += 4;
        if (advantageData.customerChoiceReasons && Array.isArray(advantageData.customerChoiceReasons)) total += advantageData.customerChoiceReasons.length;
        if (advantageData.differentiators && Array.isArray(advantageData.differentiators)) total += advantageData.differentiators.length;
        return total;
    }, [isCompetitiveAdvantageDataIncomplete]);

    const typeText = useCallback((text, rowIndex, field, delay = 0) => {
        if (!text) return;
        setTimeout(() => {
            let currentIndex = 0;
            const key = `${rowIndex}-${field}`;
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setTypingTexts(prev => ({ ...prev, [key]: text.substring(0, currentIndex) }));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, STREAMING_CONFIG.TYPING_SPEED);
        }, delay);
    }, []);

    useEffect(() => {
        const totalRows = calculateTotalRows(advantage);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [advantage, cardId, streamingManager, calculateTotalRows]);

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) return;
        if (!advantage || isRegenerating || isCompetitiveAdvantageDataIncomplete(advantage)) return;

        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(advantage);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                let rowsProcessed = 0;

                if (advantage.competitivePosition) {
                    const positionIndex = currentRow - rowsProcessed;
                    if (positionIndex === 0) {
                        typeText('Overall Score', currentRow, 'metric', 0);
                        typeText(String(advantage.competitivePosition.overallScore), currentRow, 'value', 200);
                    } else if (positionIndex === 1) {
                        typeText('Market Position', currentRow, 'metric', 0);
                        typeText(advantage.competitivePosition.marketPosition, currentRow, 'value', 200);
                    } else if (positionIndex === 2) {
                        typeText('Sustainable Advantages', currentRow, 'metric', 0);
                        typeText(String(advantage.competitivePosition.sustainableAdvantages), currentRow, 'value', 200);
                    } else if (positionIndex === 3) {
                        typeText('Vulnerable Advantages', currentRow, 'metric', 0);
                        typeText(String(advantage.competitivePosition.vulnerableAdvantages), currentRow, 'value', 200);
                    }
                    if (positionIndex >= 0 && positionIndex < 4) {
                        currentRow++;
                        return;
                    }
                    rowsProcessed += 4;
                }

                if (advantage.customerChoiceReasons && Array.isArray(advantage.customerChoiceReasons)) {
                    const choiceIndex = currentRow - rowsProcessed;
                    if (choiceIndex >= 0 && choiceIndex < advantage.customerChoiceReasons.length) {
                        const reason = advantage.customerChoiceReasons[choiceIndex];
                        typeText(reason.reason, currentRow, 'reason', 0);
                        typeText(String(reason.frequency || 0), currentRow, 'frequency', 200);
                        if (reason.linkedDifferentiator) typeText(reason.linkedDifferentiator, currentRow, 'linked', 400);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += advantage.customerChoiceReasons.length;
                }

                if (advantage.differentiators && Array.isArray(advantage.differentiators)) {
                    const diffIndex = currentRow - rowsProcessed;
                    if (diffIndex >= 0 && diffIndex < advantage.differentiators.length) {
                        const diff = advantage.differentiators[diffIndex];
                        typeText(diff.type, currentRow, 'type', 0);
                        typeText(diff.description, currentRow, 'description', 200);
                        typeText(`${diff.uniqueness}/10`, currentRow, 'uniqueness', 400);
                        typeText(`${diff.customerValue}/10`, currentRow, 'customerValue', 500);
                        typeText(`${diff.sustainability}/10`, currentRow, 'sustainability', 600);
                    }
                }
                currentRow++;
            } else {
                clearInterval(streamingIntervalRef.current);
                setVisibleRows(totalItems);
                streamingManager.stopStreaming(cardId);
                setUserHasScrolled(false);
            }
        }, STREAMING_CONFIG.ROW_INTERVAL);

        return () => {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        };
    }, [cardId, advantage, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isCompetitiveAdvantageDataIncomplete, typeText]);

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        };
    }, []);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

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
                <h4>{t('Competitive Advantage vs Customer Value Matrix')}</h4>
                <div className="plot-wrapper">
                    <svg width={plotSize} height={plotSize} className="scatter-plot">
                        {[0, 2, 4, 6, 8, 10].map(value => {
                            const pos = padding + (value / maxValue) * plotArea;
                            return (
                                <g key={value}>
                                    <line x1={padding} y1={pos} x2={plotSize - padding} y2={pos} className="grid-line" />
                                    <line x1={pos} y1={padding} x2={pos} y2={plotSize - padding} className="grid-line" />
                                </g>
                            );
                        })}
                        <line x1={padding} y1={plotSize - padding} x2={plotSize - padding} y2={plotSize - padding} className="axis-line" />
                        <line x1={padding} y1={padding} x2={padding} y2={plotSize - padding} className="axis-line" />
                        <rect x={padding + plotArea * 0.5} y={padding} width={plotArea * 0.5} height={plotArea * 0.5} className="quadrant sweet-spot" />
                        {differentiators.map((diff, index) => {
                            const x = padding + (diff.uniqueness / maxValue) * plotArea;
                            const y = plotSize - padding - (diff.customerValue / maxValue) * plotArea;
                            return (
                                <g key={index}>
                                    <circle cx={x} cy={y} r={8 + (diff.sustainability || 5) / 2} className={`data-point ${diff.uniqueness >= 7 && diff.customerValue >= 7 ? 'sweet-spot' : diff.uniqueness >= 7 ? 'niche' : diff.customerValue >= 7 ? 'high-value' : 'improve'}`} />
                                    <text x={x} y={y - 15} className="data-label">{diff.type}</text>
                                </g>
                            );
                        })}
                        <text x={plotSize / 2} y={plotSize - 10} className="axis-label">Competitive Uniqueness →</text>
                        <text x={15} y={plotSize / 2} className="axis-label vertical" transform={`rotate(-90, 15, ${plotSize / 2})`}>Customer Value →</text>
                    </svg>
                    <div className="plot-legend">
                        <div className="legend-item"><div className="legend-dot sweet-spot"></div><span className="legend-text">Sweet Spot (High Value + High Uniqueness)</span></div>
                        <div className="legend-item"><div className="legend-dot niche"></div><span className="legend-text">Niche Advantage</span></div>
                        <div className="legend-item"><div className="legend-dot high-value"></div><span className="legend-text">High Value</span></div>
                        <div className="legend-item"><div className="legend-dot improve"></div><span className="legend-text">Needs Improvement</span></div>
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
            return { x: center + distance * Math.cos(angle), y: center + distance * Math.sin(angle) };
        };
        return (
            <div className="spider-chart-container">
                <h4> {t('Differentiators Radar Chart')} </h4>
                <div className="chart-wrapper">
                    <svg width={size} height={size} className="spider-chart">
                        {[2, 4, 6, 8, 10].map(value => (
                            <polygon key={value} points={differentiators.map((_, index) => { const point = getPoint(index, value); return `${point.x},${point.y}`; }).join(' ')} className="web-line" />
                        ))}
                        {differentiators.map((_, index) => { const point = getPoint(index, 10); return <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} className="radial-line" />; })}
                        <polygon points={differentiators.map((diff, index) => { const point = getPoint(index, diff.customerValue); return `${point.x},${point.y}`; }).join(' ')} className="performance-polygon" />
                        {differentiators.map((diff, index) => {
                            const point = getPoint(index, diff.customerValue);
                            return <circle key={index} cx={point.x} cy={point.y} r="4" className="radar-point" />;
                        })}
                        {differentiators.map((diff, index) => {
                            const labelPoint = getPoint(index, 11);
                            return <text key={index} x={labelPoint.x} y={labelPoint.y} className="radar-label" textAnchor="middle">{diff.type}</text>;
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
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating Competitive Advantage Analysis...</span>
                </div>
            </div>
        );
    }

    if (!advantage || isCompetitiveAdvantageDataIncomplete(advantage)) {
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
                    showImproveButton={false}
                    showRegenerateButton={false}
                />
            </div>
        );
    }

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);
    let currentRowIndex = 0;
    const positionIndices = {};
    const choiceIndices = {};
    const diffIndices = {};

    if (advantage.competitivePosition) {
        positionIndices.overallScore = currentRowIndex++;
        positionIndices.marketPosition = currentRowIndex++;
        positionIndices.sustainableAdvantages = currentRowIndex++;
        positionIndices.vulnerableAdvantages = currentRowIndex++;
    }
    if (advantage.customerChoiceReasons && Array.isArray(advantage.customerChoiceReasons)) {
        advantage.customerChoiceReasons.forEach((_, index) => { choiceIndices[index] = currentRowIndex++; });
    }
    if (advantage.differentiators && Array.isArray(advantage.differentiators)) {
        advantage.differentiators.forEach((_, index) => { diffIndices[index] = currentRowIndex++; });
    }

    return (
        <div className="competitive-advantage-container"
            data-analysis-type="competitiveAdvantage"
            data-analysis-name="Competitive Advantage Matrix"
            data-analysis-order="9">
            <div className="competitive-advantage-tabs">
                {[
                    { id: 'overview', label: t('Overview'), icon: Target },
                    { id: 'matrix', label: t('Scatter Plot'), icon: BarChart3 },
                    { id: 'radar', label: t('Spider Chart'), icon: Activity },
                    { id: 'details', label: t('details'), icon: Award },
                ].map(tab => {
                    const IconComponent = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
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
                                    <h3>{t('Market Position')}</h3>
                                    {expandedSections.position === true ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div className={`matrix-section-content ${expandedSections.position === true ? 'expanded' : 'collapsed'}`}>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead><tr><th>{t('Metric')}</th><th>{t('Value')}</th></tr></thead>
                                            <tbody>
                                                <StreamingRow isVisible={positionIndices.overallScore < visibleRows} isLast={positionIndices.overallScore === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td><div className="force-name">{hasStreamed ? 'Overall Score' : (typingTexts[`${positionIndices.overallScore}-metric`] || 'Overall Score')}</div></td>
                                                    <td>{hasStreamed ? advantage.competitivePosition.overallScore : (typingTexts[`${positionIndices.overallScore}-value`] || advantage.competitivePosition.overallScore)}</td>
                                                </StreamingRow>
                                                <StreamingRow isVisible={positionIndices.marketPosition < visibleRows} isLast={positionIndices.marketPosition === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td><div className="force-name">{hasStreamed ? 'Market Position' : (typingTexts[`${positionIndices.marketPosition}-metric`] || 'Market Position')}</div></td>
                                                    <td>{hasStreamed ? advantage.competitivePosition.marketPosition : (typingTexts[`${positionIndices.marketPosition}-value`] || advantage.competitivePosition.marketPosition)}</td>
                                                </StreamingRow>
                                                <StreamingRow isVisible={positionIndices.sustainableAdvantages < visibleRows} isLast={positionIndices.sustainableAdvantages === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td><div className="force-name">{hasStreamed ? 'Sustainable Advantages' : (typingTexts[`${positionIndices.sustainableAdvantages}-metric`] || 'Sustainable Advantages')}</div></td>
                                                    <td>{hasStreamed ? advantage.competitivePosition.sustainableAdvantages : (typingTexts[`${positionIndices.sustainableAdvantages}-value`] || advantage.competitivePosition.sustainableAdvantages)}</td>
                                                </StreamingRow>
                                                <StreamingRow isVisible={positionIndices.vulnerableAdvantages < visibleRows} isLast={positionIndices.vulnerableAdvantages === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td><div className="force-name">{hasStreamed ? 'Vulnerable Advantages' : (typingTexts[`${positionIndices.vulnerableAdvantages}-metric`] || 'Vulnerable Advantages')}</div></td>
                                                    <td>{hasStreamed ? advantage.competitivePosition.vulnerableAdvantages : (typingTexts[`${positionIndices.vulnerableAdvantages}-value`] || advantage.competitivePosition.vulnerableAdvantages)}</td>
                                                </StreamingRow>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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
                                    <h3>{t('Key Differentiators')}</h3>
                                    {expandedSections.differentiators === true ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div className={`matrix-section-content ${expandedSections.differentiators === true ? 'expanded' : 'collapsed'}`}>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('Differentiator')}</th>
                                                    <th>{t('description')}</th>
                                                    <th>{t('Uniqueness')}</th>
                                                    <th>{t('Customer Value')}</th>
                                                    <th>{t('Sustainability')}</th>
                                                    <th>{t('Proof Points')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {advantage.differentiators.map((diff, index) => {
                                                    const rowIndex = diffIndices[index];
                                                    const isVisible = rowIndex < visibleRows;
                                                    const isLast = rowIndex === visibleRows - 1;
                                                    return (
                                                        <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                            <td><div className="force-name">{hasStreamed ? diff.type : (typingTexts[`${rowIndex}-type`] || diff.type)}</div></td>
                                                            <td>{hasStreamed ? diff.description : (typingTexts[`${rowIndex}-description`] || diff.description)}</td>
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                                <span className={`score-badge ${getIntensityColor(diff.uniqueness)}`}>{hasStreamed ? `${diff.uniqueness}/10` : (typingTexts[`${rowIndex}-uniqueness`] || `${diff.uniqueness}/10`)}</span>
                                                            </td>
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.5s' }}>
                                                                <span className={`score-badge ${getIntensityColor(diff.customerValue)}`}>{hasStreamed ? `${diff.customerValue}/10` : (typingTexts[`${rowIndex}-customerValue`] || `${diff.customerValue}/10`)}</span>
                                                            </td>
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.6s' }}>
                                                                <span className={`score-badge ${getIntensityColor(diff.sustainability)}`}>{hasStreamed ? `${diff.sustainability}/10` : (typingTexts[`${rowIndex}-sustainability`] || `${diff.sustainability}/10`)}</span>
                                                            </td>
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.7s' }}>
                                                                {diff.proofPoints && diff.proofPoints.length > 0 && (
                                                                    <ul className="list-items">
                                                                        {diff.proofPoints.map((point, idx) => (<li key={idx}>{point}</li>))}
                                                                    </ul>
                                                                )}
                                                            </td>
                                                        </StreamingRow>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetitiveAdvantageMatrix;