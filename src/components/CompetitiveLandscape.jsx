import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle,
    ChevronDown, ChevronRight, Users, Activity
} from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import { useTranslation } from '@/hooks/useTranslation';

const CompetitiveLandscape = ({
    userAnswers = {},
    questions = [],
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    competitiveLandscapeData: propCompetitiveLandscapeData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
}) => {
    const token = useAuthStore(state => state.token);
    const {
        competitiveLandscapeData: storeCompetitiveLandscapeData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const rawCompetitiveLandscapeData = propCompetitiveLandscapeData || storeCompetitiveLandscapeData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('competitiveLandscape');

    const [expandedSections, setExpandedSections] = useState({});
    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);
    const { t } = useTranslation();

    const { lastRowRef, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const data = useMemo(() => {
        if (!rawCompetitiveLandscapeData) return null;
        return rawCompetitiveLandscapeData.competitiveLandscape || 
               rawCompetitiveLandscapeData.competitive_landscape || 
               rawCompetitiveLandscapeData.CompetitiveLandscape || 
               (Object.keys(rawCompetitiveLandscapeData).length > 0 && !rawCompetitiveLandscapeData.competitiveLandscape && !rawCompetitiveLandscapeData.competitive_landscape ? rawCompetitiveLandscapeData : null);
    }, [rawCompetitiveLandscapeData]);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
        const analysisConfig = ANALYSIS_TYPES.competitiveLandscape;
        await checkMissingQuestionsAndRedirect(
            'competitiveLandscape',
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
            await regenerateIndividualAnalysis('competitiveLandscape', questions, userAnswers, selectedBusinessId);
        }
    }, [onRegenerate, streamingManager, cardId, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

    const isCompetitiveLandscapeDataIncomplete = useCallback((data) => {
        if (!data || typeof data !== 'object') return true;
        const landscape = data.competitiveLandscape || data.competitive_landscape || data.CompetitiveLandscape || (Object.keys(data).length > 0 && !data.competitiveLandscape && !data.competitive_landscape ? data : null);
        if (!landscape || typeof landscape !== 'object') return true;

        const competitors = Object.keys(landscape);
        if (competitors.length === 0) return true;

        return !competitors.some(competitor => {
            const competitorData = landscape[competitor];
            if (!competitorData || typeof competitorData !== 'object') return false;
            return Object.keys(competitorData).some(category => {
                const categoryData = competitorData[category];
                return Array.isArray(categoryData) && categoryData.length > 0;
            });
        });
    }, []);

    const calculateTotalRows = useCallback((data) => {
        if (!data || isCompetitiveLandscapeDataIncomplete(data)) return 0;
        const landscape = data.competitiveLandscape || data.competitive_landscape || data.CompetitiveLandscape || (Object.keys(data).length > 0 && !data.competitiveLandscape && !data.competitive_landscape ? data : null);
        if (!landscape) return 0;

        let total = 0;
        Object.keys(landscape).forEach(competitor => {
            const competitorData = landscape[competitor];
            Object.keys(competitorData).forEach(category => {
                const categoryData = competitorData[category];
                total += Array.isArray(categoryData) ? categoryData.length : 1;
            });
        });
        return total;
    }, [isCompetitiveLandscapeDataIncomplete]);

    useEffect(() => {
        const totalRows = calculateTotalRows(rawCompetitiveLandscapeData);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [rawCompetitiveLandscapeData, cardId, streamingManager, calculateTotalRows]);

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
        if (!streamingManager?.shouldStream(cardId)) return;
        if (!rawCompetitiveLandscapeData || isRegenerating || isCompetitiveLandscapeDataIncomplete(rawCompetitiveLandscapeData)) return;

        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(rawCompetitiveLandscapeData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                let rowCounter = 0;
                const landscape = rawCompetitiveLandscapeData.competitiveLandscape || rawCompetitiveLandscapeData.competitive_landscape || rawCompetitiveLandscapeData.CompetitiveLandscape || (Object.keys(rawCompetitiveLandscapeData).length > 0 && !rawCompetitiveLandscapeData.competitiveLandscape && !rawCompetitiveLandscapeData.competitive_landscape ? rawCompetitiveLandscapeData : null);
                if (!landscape) return;

                const competitors = Object.keys(landscape);
                for (const competitor of competitors) {
                    const competitorData = landscape[competitor];
                    const categories = Object.keys(competitorData);
                    for (const category of categories) {
                        const categoryData = competitorData[category];
                        if (Array.isArray(categoryData)) {
                            for (const item of categoryData) {
                                if (rowCounter === currentRow) {
                                    typeText(item, currentRow, 'item', 0);
                                    currentRow++;
                                    return;
                                }
                                rowCounter++;
                            }
                        } else {
                            if (rowCounter === currentRow) {
                                typeText(categoryData, currentRow, 'item', 0);
                                currentRow++;
                                return;
                            }
                            rowCounter++;
                        }
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
    }, [cardId, rawCompetitiveLandscapeData, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isCompetitiveLandscapeDataIncomplete, typeText]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    useEffect(() => {
        if (data) {
            const competitors = Object.keys(data);
            const initialExpandedState = {};
            competitors.forEach(competitor => { initialExpandedState[competitor] = true; });
            setExpandedSections(prev => ({ ...initialExpandedState, ...prev }));
        }
    }, [data]);

    const getCategoryColor = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's' || categoryLower.includes('strength')) return 'high-intensity';
        if (categoryLower === 'w' || categoryLower.includes('weakness')) return 'low-intensity';
        if (categoryLower === 'o' || categoryLower.includes('opportunity')) return 'medium-intensity';
        if (categoryLower === 't' || categoryLower.includes('threat')) return 'low-intensity';
        return 'medium-intensity';
    };

    const getCategoryLabel = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's') return 'Strengths';
        if (categoryLower === 'w') return 'Weaknesses';
        if (categoryLower === 'o') return 'Opportunities';
        if (categoryLower === 't') return 'Threats';
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating Competitive Landscape...</span>
                </div>
            </div>
        );
    }

    if (!data || isCompetitiveLandscapeDataIncomplete(rawCompetitiveLandscapeData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="competitiveLandscape"
                    analysisDisplayName="Competitive Landscape"
                    icon={Users}
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

    const competitors = Object.keys(data);
    let currentRowIndex = 0;
    const rowIndices = {};
    competitors.forEach(competitor => {
        const competitorData = data[competitor];
        Object.keys(competitorData).forEach(category => {
            const categoryData = competitorData[category];
            if (Array.isArray(categoryData)) {
                categoryData.forEach((_, itemIndex) => { rowIndices[`${competitor}-${category}-${itemIndex}`] = currentRowIndex++; });
            } else {
                rowIndices[`${competitor}-${category}-single`] = currentRowIndex++;
            }
        });
    });

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="porters-container full-swot-container" data-analysis-type="competitiveLandscape" data-analysis-name="Competitive Landscape" data-analysis-order="9">
            {competitors.map((competitor, competitorIndex) => {
                const competitorData = data[competitor];
                const categories = Object.keys(competitorData);
                return (
                    <div key={competitorIndex} className="section-container">
                        <div className="section-header" onClick={() => toggleSection(competitor)}>
                            <h5>{competitor}</h5>
                            {expandedSections[competitor] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        {expandedSections[competitor] && (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>{t('Category')}</th><th>{t('Analysis')}</th></tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((category) => {
                                            const categoryData = competitorData[category];
                                            const categoryColor = getCategoryColor(category);
                                            const categoryLabel = getCategoryLabel(category);
                                            return Array.isArray(categoryData) ? (
                                                categoryData.map((item, itemIndex) => {
                                                    const key = `${competitor}-${category}-${itemIndex}`;
                                                    const rowIndex = rowIndices[key];
                                                    const isVisible = rowIndex < visibleRows;
                                                    return (
                                                        <StreamingRow key={key} isVisible={isVisible} isLast={rowIndex === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                            {itemIndex === 0 && (
                                                                <td rowSpan={categoryData.length}><span className={`status-badge ${categoryColor}`}>{categoryLabel}</span></td>
                                                            )}
                                                            <td>{hasStreamed ? item : (typingTexts[`${rowIndex}-item`] || item)}</td>
                                                        </StreamingRow>
                                                    );
                                                })
                                            ) : (
                                                (() => {
                                                    const key = `${competitor}-${category}-single`;
                                                    const rowIndex = rowIndices[key];
                                                    const isVisible = rowIndex < visibleRows;
                                                    return (
                                                        <StreamingRow key={key} isVisible={isVisible} isLast={rowIndex === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                            <td><span className={`status-badge ${categoryColor}`}>{categoryLabel}</span></td>
                                                            <td>{hasStreamed ? categoryData : (typingTexts[`${rowIndex}-item`] || categoryData)}</td>
                                                        </StreamingRow>
                                                    );
                                                })()
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CompetitiveLandscape;