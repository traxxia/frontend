import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle,
    ChevronDown, ChevronRight, Users, Activity, Shield, 
    Zap, Star, Award, BarChart
} from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
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
    const {
        competitiveLandscapeData: storeCompetitiveLandscapeData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const rawData = propCompetitiveLandscapeData || storeCompetitiveLandscapeData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('competitiveLandscape');

    const [expandedSections, setExpandedSections] = useState({});
    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);
    const { t } = useTranslation();

    const { lastRowRef, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    // Parse the data based on the new structure
    const competitorSwot = useMemo(() => {
        if (!rawData) return null;
        return rawData.competitor_swot || rawData.competitiveLandscape || rawData.competitive_landscape || null;
    }, [rawData]);

    const ourDifferentiators = useMemo(() => {
        if (!rawData) return null;
        return rawData.our_differentiators || [];
    }, [rawData]);

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

    const isDataIncomplete = useCallback((data) => {
        if (!data || typeof data !== 'object') return true;
        const swot = data.competitor_swot || data.competitiveLandscape || data.competitive_landscape;
        const diffs = data.our_differentiators;
        
        if (!swot && (!diffs || diffs.length === 0)) return true;

        if (swot) {
            const competitors = Object.keys(swot);
            if (competitors.length > 0) return false;
        }
        
        if (diffs && diffs.length > 0) return false;

        return true;
    }, []);

    const calculateTotalRows = useCallback((data) => {
        if (!data || isDataIncomplete(data)) return 0;
        
        const swot = data.competitor_swot || data.competitiveLandscape || data.competitive_landscape;
        const diffs = data.our_differentiators || [];
        
        let total = 0;
        
        if (swot) {
            Object.keys(swot).forEach(competitor => {
                const competitorData = swot[competitor];
                Object.keys(competitorData).forEach(category => {
                    const categoryData = competitorData[category];
                    total += Array.isArray(categoryData) ? categoryData.length : 1;
                });
            });
        }
        
        total += diffs.length;
        
        return total;
    }, [isDataIncomplete]);

    useEffect(() => {
        const totalRows = calculateTotalRows(rawData);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [rawData, cardId, streamingManager, calculateTotalRows]);

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
        if (!rawData || isRegenerating || isDataIncomplete(rawData)) return;

        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(rawData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                
                const swot = rawData.competitor_swot || rawData.competitiveLandscape || rawData.competitive_landscape;
                const diffs = rawData.our_differentiators || [];
                
                let rowCounter = 0;

                // Stream SWOT first
                if (swot) {
                    const competitors = Object.keys(swot);
                    for (const competitor of competitors) {
                        const competitorData = swot[competitor];
                        for (const category of Object.keys(competitorData)) {
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
                }

                // Stream Differentiators
                for (const diff of diffs) {
                    if (rowCounter === currentRow) {
                        typeText(diff.description, currentRow, 'item', 0);
                        currentRow++;
                        return;
                    }
                    rowCounter++;
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
    }, [cardId, rawData, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isDataIncomplete, typeText]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    useEffect(() => {
        if (competitorSwot) {
            const initialExpandedState = { differentiators: true };
            Object.keys(competitorSwot).forEach(competitor => { initialExpandedState[competitor] = true; });
            setExpandedSections(prev => ({ ...initialExpandedState, ...prev }));
        }
    }, [competitorSwot]);

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

    const getSustainabilityColor = (level) => {
        const l = String(level).toLowerCase();
        if (l === 'high') return '#10b981';
        if (l === 'medium') return '#3b82f6';
        if (l === 'low') return '#f59e0b';
        return '#6b7280';
    };

    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner modern-animate-spin" />
                    <span>Regenerating Competitive Analysis...</span>
                </div>
            </div>
        );
    }

    if (!rawData || isDataIncomplete(rawData)) {
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

    // Pre-calculate indices for streaming
    let totalSwotRows = 0;
    const swotRowIndices = {};
    if (competitorSwot) {
        Object.keys(competitorSwot).forEach(competitor => {
            const competitorData = competitorSwot[competitor];
            Object.keys(competitorData).forEach(category => {
                const categoryData = competitorData[category];
                if (Array.isArray(categoryData)) {
                    categoryData.forEach((_, itemIndex) => { 
                        swotRowIndices[`${competitor}-${category}-${itemIndex}`] = totalSwotRows++; 
                    });
                } else {
                    swotRowIndices[`${competitor}-${category}-single`] = totalSwotRows++;
                }
            });
        });
    }

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="porters-container full-swot-container" data-analysis-type="competitiveLandscape" data-analysis-name="Competitive Landscape" data-analysis-order="9">
            
            {/* Our Differentiators Section */}
            {ourDifferentiators.length > 0 && (
                <div className="section-container" style={{ marginBottom: '2rem' }}>
                    <div className="section-header" onClick={() => toggleSection('differentiators')} style={{ background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={20} color="#0ea5e9" />
                            <h5 style={{ margin: 0, color: '#0369a1' }}>Our Differentiators vs Competitors</h5>
                        </div>
                        {expandedSections['differentiators'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedSections['differentiators'] && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('Differentiator')}</th>
                                        <th>{t('Description')}</th>
                                        <th>{t('Competitive Edge')}</th>
                                        <th>{t('Sustainability')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ourDifferentiators.map((diff, index) => {
                                        const rowIndex = totalSwotRows + index;
                                        const isVisible = rowIndex < visibleRows;
                                        if (!isVisible) return null;

                                        return (
                                            <StreamingRow 
                                                key={index} 
                                                isVisible={isVisible} 
                                                isLast={rowIndex === visibleRows - 1 && isStreaming} 
                                                lastRowRef={lastRowRef} 
                                                isStreaming={isStreaming}
                                            >
                                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{diff.differentiator}</td>
                                                <td style={{ fontSize: '0.875rem' }}>
                                                    {hasStreamed ? diff.description : (typingTexts[`${rowIndex}-item`] || diff.description)}
                                                </td>
                                                <td style={{ fontSize: '0.875rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Zap size={14} color="#f59e0b" />
                                                        <span>{diff.competitive_edge}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '12px', 
                                                        background: getSustainabilityColor(diff.sustainability) + '20', 
                                                        color: getSustainabilityColor(diff.sustainability),
                                                        fontWeight: 700,
                                                        border: `1px solid ${getSustainabilityColor(diff.sustainability)}40`
                                                    }}>
                                                        {diff.sustainability}
                                                    </span>
                                                </td>
                                            </StreamingRow>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Competitor SWOT Section */}
            {competitorSwot && Object.keys(competitorSwot).map((competitor, competitorIndex) => {
                const competitorData = competitorSwot[competitor];
                const categories = Object.keys(competitorData);
                return (
                    <div key={competitorIndex} className="section-container">
                        <div className="section-header" onClick={() => toggleSection(competitor)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={20} color="#6366f1" />
                                <h5 style={{ margin: 0 }}>{competitor}</h5>
                            </div>
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
                                                    const rowIndex = swotRowIndices[key];
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
                                                    const rowIndex = swotRowIndices[key];
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