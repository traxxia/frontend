import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from "../hooks/useTranslation";
import { RefreshCw, Loader, Target, TrendingUp, Users, BarChart3, Activity, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const StrategicPositioningRadar = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    strategicRadarData: propStrategicRadarData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
    hideImproveButton = false,
}) => {
    const { t } = useTranslation();
    const token = useAuthStore(state => state.token);

    const {
        strategicRadarData: storeStrategicRadarData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const rawRadarData = propStrategicRadarData || storeStrategicRadarData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('strategicRadar');

    const [expandedSections, setExpandedSections] = useState({});
    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);

    const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const data = useMemo(() => {
        if (!rawRadarData) return null;
        const strategicRadar = rawRadarData.strategicRadar || rawRadarData.strategic_radar || (rawRadarData.dimensions ? rawRadarData : null);
        if (strategicRadar && strategicRadar.dimensions) {
            return { strategicRadar };
        }
        return null;
    }, [rawRadarData]);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
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
    }, [selectedBusinessId, handleRedirectToBrief]);

    const isStrategicRadarDataIncomplete = useCallback((radarData) => {
        if (!radarData) return true;
        const strategicRadar = radarData.strategicRadar || radarData.strategic_radar || (radarData.dimensions ? radarData : null);
        if (!strategicRadar || !strategicRadar.dimensions) return true;
        return !strategicRadar.dimensions.some(dimension =>
            dimension.name && (dimension.currentScore !== undefined || dimension.targetScore !== undefined)
        );
    }, []);

    const calculateTotalRows = useCallback((radarData) => {
        if (!radarData || isStrategicRadarDataIncomplete(radarData)) return 0;
        const strategicRadar = radarData.strategicRadar || radarData.strategic_radar || (radarData.dimensions ? radarData : null);
        if (!strategicRadar) return 0;
        let total = 0;
        if (strategicRadar.overallPosition) total += 3;
        if (strategicRadar.dimensions) total += strategicRadar.dimensions.length;
        return total;
    }, [isStrategicRadarDataIncomplete]);

    useEffect(() => {
        const totalRows = calculateTotalRows(rawRadarData);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [rawRadarData, cardId, streamingManager, calculateTotalRows]);

    const typeText = useCallback((text, rowIndex, field, delay = 0) => {
        if (!text) return;
        setTimeout(() => {
            let currentIndex = 0;
            const key = `${rowIndex}-${field}`;
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setTypingTexts(prev => ({
                        ...prev,
                        [key]: text.substring(0, currentIndex)
                    }));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, STREAMING_CONFIG.TYPING_SPEED);
        }, delay);
    }, []);

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) return;
        if (!rawRadarData || isRegenerating || isStrategicRadarDataIncomplete(rawRadarData)) return;

        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(rawRadarData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                const strategicRadar = rawRadarData.strategicRadar || rawRadarData.strategic_radar || (rawRadarData.dimensions ? rawRadarData : null);
                if (!strategicRadar) return;

                const normalizedData = { strategicRadar };
                let rowsProcessed = 0;

                if (normalizedData.strategicRadar.overallPosition) {
                    if (currentRow === rowsProcessed) {
                        typeText('Current Average Score', currentRow, 'label', STREAMING_CONFIG.TYPING_DELAY.PRIMARY);
                        typeText(normalizedData.strategicRadar.overallPosition.currentAverage?.toString() || '', currentRow, 'value', STREAMING_CONFIG.TYPING_DELAY.SECONDARY);
                    }
                    rowsProcessed++;
                    if (currentRow < rowsProcessed) { currentRow++; return; }

                    if (currentRow === rowsProcessed) {
                        typeText('Target Average Score', currentRow, 'label', STREAMING_CONFIG.TYPING_DELAY.PRIMARY);
                        typeText(normalizedData.strategicRadar.overallPosition.targetAverage?.toString() || '', currentRow, 'value', STREAMING_CONFIG.TYPING_DELAY.SECONDARY);
                    }
                    rowsProcessed++;
                    if (currentRow < rowsProcessed) { currentRow++; return; }

                    if (currentRow === rowsProcessed) {
                        typeText('Improvement Gap', currentRow, 'label', STREAMING_CONFIG.TYPING_DELAY.PRIMARY);
                        const gap = (normalizedData.strategicRadar.overallPosition.targetAverage - normalizedData.strategicRadar.overallPosition.currentAverage).toFixed(1);
                        typeText(gap, currentRow, 'value', STREAMING_CONFIG.TYPING_DELAY.SECONDARY);
                    }
                    rowsProcessed++;
                    if (currentRow < rowsProcessed) { currentRow++; return; }
                }

                if (normalizedData.strategicRadar.dimensions) {
                    const dimensionIndex = currentRow - rowsProcessed;
                    if (dimensionIndex >= 0 && dimensionIndex < normalizedData.strategicRadar.dimensions.length) {
                        const dimension = normalizedData.strategicRadar.dimensions[dimensionIndex];
                        typeText(dimension.name, currentRow, 'name', STREAMING_CONFIG.TYPING_DELAY.PRIMARY);
                        typeText(dimension.currentScore?.toString() || '', currentRow, 'current', STREAMING_CONFIG.TYPING_DELAY.SECONDARY);
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

        return () => { if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current); };
    }, [cardId, rawRadarData, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isStrategicRadarDataIncomplete, typeText]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const handleRegenerate = useCallback(async () => {
        if (onRegenerate) {
            streamingManager?.resetCard(cardId);
            await onRegenerate();
        } else {
            streamingManager?.resetCard(cardId);
            await regenerateIndividualAnalysis('strategicRadar', questions, userAnswers, selectedBusinessId);
        }
    }, [onRegenerate, streamingManager, cardId, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

    const handleRetry = useCallback(() => {
        handleRegenerate();
    }, [handleRegenerate]);

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



    if (isRegenerating) {
        return (
            <div className="strategic-radar-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating strategic positioning radar analysis...</span>
                </div>
            </div>
        );
    }

    if (!data || isStrategicRadarDataIncomplete(data)) {
        return (
            <div className="strategic-radar-container">
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
                    showImproveButton={false}
                    showRegenerateButton={false}
                />
            </div>
        );
    }

    const { strategicRadar } = data;
    const { dimensions, overallPosition } = strategicRadar;

    let currentRowIndex = 0;
    const executiveIndices = overallPosition ? {
        currentAverage: currentRowIndex++,
        targetAverage: currentRowIndex++,
        improvementGap: currentRowIndex++
    } : {};
    const dimensionIndices = dimensions?.map(() => currentRowIndex++) || [];

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="strategic-radar-container">
            <div className="competitive-advantage-content">
                <div className="overview-content">
                    {overallPosition && (
                        <div className="section-container">
                            <div className="section-header" onClick={() => toggleSection('executive')}>
                                <h3>{t("strategic_card1")}</h3>
                                {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                            <div className={`radar-section-content ${expandedSections.executive === true ? 'expanded' : 'collapsed'}`}>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead><tr><th>{t("strategic_card1_head1")}</th><th>{t("strategic_card1_head2")}</th><th>{t("strategic_card1_head3")}</th></tr></thead>
                                        <tbody>
                                            <StreamingRow isVisible={executiveIndices.currentAverage < visibleRows} isLast={executiveIndices.currentAverage === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><div className="force-name">{hasStreamed ? 'Current Average Score' : (typingTexts[`${executiveIndices.currentAverage}-label`] || 'Current Average Score')}</div></td>
                                                <td>{hasStreamed ? overallPosition.currentAverage : (typingTexts[`${executiveIndices.currentAverage}-value`] || overallPosition.currentAverage)}</td>
                                                <td style={{ opacity: executiveIndices.currentAverage < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                    <span className={`status-badge ${getScoreClass(overallPosition.currentAverage)}`}>
                                                        {overallPosition.currentAverage >= 8 ? 'Excellent' : overallPosition.currentAverage >= 6 ? 'Good' : overallPosition.currentAverage >= 4 ? 'Average' : 'Poor'}
                                                    </span>
                                                </td>
                                            </StreamingRow>
                                            <StreamingRow isVisible={executiveIndices.targetAverage < visibleRows} isLast={executiveIndices.targetAverage === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><div className="force-name">{hasStreamed ? 'Target Average Score' : (typingTexts[`${executiveIndices.targetAverage}-label`] || 'Target Average Score')}</div></td>
                                                <td>{hasStreamed ? overallPosition.targetAverage : (typingTexts[`${executiveIndices.targetAverage}-value`] || overallPosition.targetAverage)}</td>
                                                <td style={{ opacity: executiveIndices.targetAverage < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                    <span className={`status-badge ${getScoreClass(overallPosition.targetAverage)}`}>
                                                        {overallPosition.targetAverage >= 8 ? 'Excellent' : overallPosition.targetAverage >= 6 ? 'Good' : overallPosition.targetAverage >= 4 ? 'Average' : 'Poor'}
                                                    </span>
                                                </td>
                                            </StreamingRow>
                                            <StreamingRow isVisible={executiveIndices.improvementGap < visibleRows} isLast={executiveIndices.improvementGap === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><div className="force-name">{hasStreamed ? 'Improvement Gap' : (typingTexts[`${executiveIndices.improvementGap}-label`] || 'Improvement Gap')}</div></td>
                                                <td>{hasStreamed ? (overallPosition.targetAverage - overallPosition.currentAverage).toFixed(1) : (typingTexts[`${executiveIndices.improvementGap}-value`] || (overallPosition.targetAverage - overallPosition.currentAverage).toFixed(1))}</td>
                                                <td style={{ opacity: executiveIndices.improvementGap < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                    <span className={`status-badge ${getPerformanceStatusClass(overallPosition.currentAverage, overallPosition.targetAverage)}`}>{getPerformanceStatus(overallPosition.currentAverage, overallPosition.targetAverage)}</span>
                                                </td>
                                            </StreamingRow>
                                        </tbody>
                                    </table>
                                    {overallPosition.strengthAreas && (
                                        <div className="subsection"><h4>{t("strategic_card1_head4")}</h4><div className="forces-tags">{overallPosition.strengthAreas.map((area, index) => (<span key={index} className="force-tag">{area}</span>))}</div></div>
                                    )}
                                    {overallPosition.improvementAreas && (
                                        <div className="subsection"><h4>{t("strategic_card1_head5")}</h4><div className="forces-tags">{overallPosition.improvementAreas.map((area, index) => (<span key={index} className="force-tag">{area}</span>))}</div></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {dimensions && (
                        <div className="section-container">
                            <div className="section-header" onClick={() => toggleSection('dimensions')}>
                                <h3>{t("strategic_card2")}</h3>
                                {expandedSections.dimensions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                            <div className={`radar-section-content ${expandedSections.dimensions === true ? 'expanded' : 'collapsed'}`}>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead><tr><th>{t("strategic_card2_head1")}</th><th>{t("strategic_card2_head2")}</th><th>{t("strategic_card2_head3")}</th><th>{t("strategic_card2_head4")}</th></tr></thead>
                                        <tbody>
                                            {dimensions.map((dimension, index) => {
                                                const rowIndex = dimensionIndices[index];
                                                const isVisible = rowIndex < visibleRows;
                                                return (
                                                    <StreamingRow key={index} isVisible={isVisible} isLast={rowIndex === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                        <td><div className="force-name">{hasStreamed ? dimension.name : (typingTexts[`${rowIndex}-name`] || dimension.name)}</div></td>
                                                        <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}><span className="score-badge" style={{ backgroundColor: getScoreColor(dimension.currentScore) }}>{hasStreamed ? dimension.currentScore : (typingTexts[`${rowIndex}-current`] || dimension.currentScore)}</span></td>
                                                        <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.5s' }}><span className="score-badge" style={{ backgroundColor: getScoreColor(dimension.targetScore), opacity: 0.8 }}>{dimension.targetScore}</span></td>
                                                        <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.6s' }}><span className="score-badge" style={{ backgroundColor: '#9ca3af' }}>{dimension.industryAverage}</span></td>
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
            </div>
        </div>
    );
};

export default StrategicPositioningRadar;