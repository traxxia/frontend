import React, { useState, useEffect, useRef } from 'react';
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap,
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Lightbulb, PieChart,
    DollarSign, Activity, Map, CheckCircle, XCircle
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
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    competitiveLandscapeData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId
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

        const competitors = Object.keys(data);
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

    const calculateTotalRows = (data) => {
        if (!data || isCompetitiveLandscapeDataIncomplete(data)) {
            return 0;
        }

        let total = 0;
        const competitors = Object.keys(data);

        competitors.forEach(competitor => {
            const competitorData = data[competitor];
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
    };

    // ✅ Initialize visible rows when data is available
    useEffect(() => {
        const totalRows = calculateTotalRows(competitiveLandscapeData);

        if (totalRows === 0) {
            return;
        }

        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [competitiveLandscapeData, cardId, streamingManager]);

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
                const competitors = Object.keys(competitiveLandscapeData);

                for (const competitor of competitors) {
                    const competitorData = competitiveLandscapeData[competitor];
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
            setData(competitiveLandscapeData);
            setHasGenerated(true);
            setError(null);

            const competitors = Object.keys(competitiveLandscapeData);
            const initialExpandedState = {};
            competitors.forEach(competitor => {
                initialExpandedState[competitor] = true;
            });
            setExpandedSections(initialExpandedState);
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

        let errorMessage = error;
        if (!errorMessage) {
            errorMessage = "Unable to generate Competitive Landscape analysis. Please try regenerating or check your inputs.";
        }

        return (
            <div className="porters-container">
                <AnalysisError
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Competitive Landscape Analysis Error"
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