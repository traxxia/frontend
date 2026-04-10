import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle,
    ChevronDown, ChevronRight, Users, Activity
} from 'lucide-react';
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
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    competitiveLandscapeData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
}) => {
    const [data, setData] = useState(competitiveLandscapeData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);
    const { t } = useTranslation();

    const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
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
    };

    const handleRegenerate = async () => {
        if (onRegenerate) {
            streamingManager?.resetCard(cardId);
            onRegenerate();
        }
    };

    const handleRetry = () => {
        setError(null);
        streamingManager?.resetCard(cardId);
        if (onRegenerate) {
            onRegenerate();
        }
    };

    const isCompetitiveLandscapeDataIncomplete = (data) => {
        if (!data || typeof data !== 'object') return true;

        const landscape = data.competitiveLandscape || data.competitive_landscape || data.CompetitiveLandscape || (Object.keys(data).length > 0 && !data.competitiveLandscape && !data.competitive_landscape ? data : null);
        if (!landscape || typeof landscape !== 'object') return true;

        const competitors = Object.keys(landscape);
        if (competitors.length === 0) return true;

        const hasValidCompetitor = competitors.some(competitor => {
            const competitorData = data[competitor];
            if (!competitorData || typeof competitorData !== 'object') return false;

            const categories = Object.keys(competitorData);
            const hasContent = categories.some(category => {
                const categoryData = competitorData[category];
                return Array.isArray(categoryData) && categoryData.length > 0;
            });

            return hasContent;
        });

        return !hasValidCompetitor;
    };

    const calculateTotalRows = useCallback((data) => {
        if (!data || isCompetitiveLandscapeDataIncomplete(data)) {
            return 0;
        }

        const landscape = data.competitiveLandscape || data.competitive_landscape || data.CompetitiveLandscape || (Object.keys(data).length > 0 && !data.competitiveLandscape && !data.competitive_landscape ? data : null);
        if (!landscape) return 0;

        let total = 0;
        const competitors = Object.keys(landscape);

        competitors.forEach(competitor => {
            const competitorData = landscape[competitor];
            const categories = Object.keys(competitorData);

            categories.forEach(category => {
                const categoryData = competitorData[category];
                if (Array.isArray(categoryData)) {
                    total += categoryData.length;
                } else {
                    total += 1;
                }
            });
        });

        return total;
    }, []);

    // ✅ Initialize visible rows when data is available
    useEffect(() => {
        const totalRows = calculateTotalRows(competitiveLandscapeData);

        if (totalRows === 0) {
            return;
        }

        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [competitiveLandscapeData, cardId, streamingManager, calculateTotalRows]);

    const typeText = (text, rowIndex, field, delay = 0) => {
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
    };

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) {
            return;
        }

        if (!competitiveLandscapeData || isRegenerating || isCompetitiveLandscapeDataIncomplete(competitiveLandscapeData)) {
            return;
        }

        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
        }

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(competitiveLandscapeData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);

                let rowCounter = 0;
                const landscape = competitiveLandscapeData.competitiveLandscape || competitiveLandscapeData.competitive_landscape || competitiveLandscapeData.CompetitiveLandscape || (Object.keys(competitiveLandscapeData).length > 0 && !competitiveLandscapeData.competitiveLandscape && !competitiveLandscapeData.competitive_landscape ? competitiveLandscapeData : null);
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

        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, [cardId, competitiveLandscapeData, isRegenerating, streamingManager, setUserHasScrolled]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (competitiveLandscapeData) {
            const landscape = competitiveLandscapeData.competitiveLandscape || competitiveLandscapeData.competitive_landscape || competitiveLandscapeData.CompetitiveLandscape || (Object.keys(competitiveLandscapeData).length > 0 && !competitiveLandscapeData.competitiveLandscape && !competitiveLandscapeData.competitive_landscape ? competitiveLandscapeData : null);

            if (landscape && Object.keys(landscape).length > 0) {
                setData(landscape);
                setHasGenerated(true);
                setError(null);

                const competitors = Object.keys(landscape);
                const initialExpandedState = {};
                competitors.forEach(competitor => {
                    initialExpandedState[competitor] = true;
                });
                setExpandedSections(initialExpandedState);
            } else {
                setData(null);
                setHasGenerated(false);
            }
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [competitiveLandscapeData]);

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, []);

    const getCategoryIcon = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's' || categoryLower.includes('strength')) return TrendingUp;
        if (categoryLower === 'w' || categoryLower.includes('weakness')) return TrendingDown;
        if (categoryLower === 'o' || categoryLower.includes('opportunity')) return Target;
        if (categoryLower === 't' || categoryLower.includes('threat')) return AlertTriangle;
        return Activity;
    };

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
                    <span>
                        {isRegenerating
                            ? "Regenerating Competitive Landscape..."
                            : "Generating Competitive Landscape..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    if (error ||
        (!hasGenerated && !data && Object.keys(userAnswers).length > 0)) {

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

    if (!competitiveLandscapeData || isCompetitiveLandscapeDataIncomplete(competitiveLandscapeData)) {
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
        const categories = Object.keys(competitorData);

        categories.forEach(category => {
            const categoryData = competitorData[category];

            if (Array.isArray(categoryData)) {
                categoryData.forEach((item, itemIndex) => {
                    const key = `${competitor}-${category}-${itemIndex}`;
                    rowIndices[key] = currentRowIndex++;
                });
            } else {
                const key = `${competitor}-${category}-single`;
                rowIndices[key] = currentRowIndex++;
            }
        });
    });

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="porters-container full-swot-container"
            data-analysis-type="competitiveLandscape"
            data-analysis-name="Competitive Landscape"
            data-analysis-order="9">

            <div className="">
                {competitors.map((competitor, competitorIndex) => {
                    const competitorData = data[competitor];
                    const categories = Object.keys(competitorData);

                    return (
                        <div key={competitorIndex} className="section-container">
                            <div className="section-header" onClick={() => toggleSection(competitor)}>
                                <h5>
                                    {competitor}
                                </h5>
                                {expandedSections[competitor] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>

                            {expandedSections[competitor] && (
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('Category')}</th>
                                                <th>{t('Analysis')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category, categoryIndex) => {
                                                const categoryData = competitorData[category];
                                                const categoryColor = getCategoryColor(category);
                                                const categoryLabel = getCategoryLabel(category);

                                                return Array.isArray(categoryData) ? (
                                                    categoryData.map((item, itemIndex) => {
                                                        const key = `${competitor}-${category}-${itemIndex}`;
                                                        const rowIndex = rowIndices[key];
                                                        const isVisible = rowIndex < visibleRows;
                                                        const isLast = rowIndex === visibleRows - 1;

                                                        return (
                                                            <StreamingRow
                                                                key={key}
                                                                isVisible={isVisible}
                                                                isLast={isLast && isStreaming}
                                                                lastRowRef={lastRowRef}
                                                                isStreaming={isStreaming}
                                                            >
                                                                {itemIndex === 0 && (
                                                                    <td rowSpan={categoryData.length}>
                                                                        <span className={`status-badge ${categoryColor}`}>
                                                                            {categoryLabel}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td>
                                                                    {hasStreamed ? item : (typingTexts[`${rowIndex}-item`] || item)}
                                                                </td>
                                                            </StreamingRow>
                                                        );
                                                    })
                                                ) : (
                                                    (() => {
                                                        const key = `${competitor}-${category}-single`;
                                                        const rowIndex = rowIndices[key];
                                                        const isVisible = rowIndex < visibleRows;
                                                        const isLast = rowIndex === visibleRows - 1;

                                                        return (
                                                            <StreamingRow
                                                                key={key}
                                                                isVisible={isVisible}
                                                                isLast={isLast && isStreaming}
                                                                lastRowRef={lastRowRef}
                                                                isStreaming={isStreaming}
                                                            >
                                                                <td>
                                                                    <span className={`status-badge ${categoryColor}`}>
                                                                        {categoryLabel}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {hasStreamed ? categoryData : (typingTexts[`${rowIndex}-item`] || categoryData)}
                                                                </td>
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
        </div>
    );
};

export default CompetitiveLandscape;