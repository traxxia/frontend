import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader, Shield, ChevronDown, ChevronRight } from 'lucide-react';
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

    const [expandedSections, setExpandedSections] = useState({
        position: false
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
        const hasCompetitivePosition = advantageData.competitivePosition && (advantageData.competitivePosition.overallScore || advantageData.competitivePosition.marketPosition);
        return !hasCompetitivePosition;
    }, []);

    const calculateTotalRows = useCallback((advantageData) => {
        if (!advantageData || isCompetitiveAdvantageDataIncomplete(advantageData)) return 0;
        let total = 0;
        if (advantageData.competitivePosition) total += 4;
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
    if (advantage.competitivePosition) {
        positionIndices.overallScore = currentRowIndex++;
        positionIndices.marketPosition = currentRowIndex++;
        positionIndices.sustainableAdvantages = currentRowIndex++;
        positionIndices.vulnerableAdvantages = currentRowIndex++;
    }

    return (
        <div className="competitive-advantage-container"
            data-analysis-type="competitiveAdvantage"
            data-analysis-name="Competitive Advantage Matrix"
            data-analysis-order="9">
            <div className="competitive-advantage-content">
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
            </div>
        </div>
    );
};

export default CompetitiveAdvantageMatrix;
