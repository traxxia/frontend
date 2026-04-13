import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from "../hooks/useTranslation";
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap,
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Lightbulb, PieChart,
    DollarSign, Activity, Map, CheckCircle, XCircle
} from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const getScoreColor = (score) => {
    if (score >= 8) return 'high-intensity';
    if (score >= 6) return 'medium-intensity';
    return 'low-intensity';
};

const getPriorityColor = (priority) => {
    const colors = {
        'high': 'high-intensity',
        'medium': 'medium-intensity',
        'low': 'low-intensity'
    };
    return colors[priority?.toLowerCase()] || 'medium-intensity';
};

const getLikelihoodColor = (likelihood) => {
    if (likelihood >= 4) return 'high-intensity';
    if (likelihood >= 3) return 'medium-intensity';
    return 'low-intensity';
};

const isFullSwotDataIncomplete = (data) => {
    if (!data) return true;
    const swotPortfolio = data.swotPortfolio || data.swot_portfolio || data.fullSwot || data.full_swot || (data.strengths || data.weaknesses ? data : null);
    if (!swotPortfolio) return true;
    const portfolio = swotPortfolio;
    const hasStrengths = portfolio.strengths && portfolio.strengths.length > 0;
    const hasWeaknesses = portfolio.weaknesses && portfolio.weaknesses.length > 0;
    const hasOpportunities = portfolio.opportunities && portfolio.opportunities.length > 0;
    const hasThreats = portfolio.threats && portfolio.threats.length > 0;
    const sectionsWithData = [hasStrengths, hasWeaknesses, hasOpportunities, hasThreats].filter(Boolean).length;
    return sectionsWithData < 2;
};

const calculateTotalRows = (data) => {
    if (!data || isFullSwotDataIncomplete(data)) return 0;
    const swotPortfolio = data.swotPortfolio || data.swot_portfolio || data.fullSwot || data.full_swot || (data.strengths || data.weaknesses ? data : null);
    if (!swotPortfolio) return 0;
    const portfolio = swotPortfolio;
    let total = 0;
    if (portfolio.strengths && Array.isArray(portfolio.strengths)) total += portfolio.strengths.length;
    if (portfolio.weaknesses && Array.isArray(portfolio.weaknesses)) total += portfolio.weaknesses.length;
    if (portfolio.opportunities && Array.isArray(portfolio.opportunities)) total += portfolio.opportunities.length;
    if (portfolio.threats && Array.isArray(portfolio.threats)) total += portfolio.threats.length;
    if (portfolio.strategicOptions) {
        if (portfolio.strategicOptions.SO_strategies && Array.isArray(portfolio.strategicOptions.SO_strategies)) total += portfolio.strategicOptions.SO_strategies.length;
        if (portfolio.strategicOptions.WO_strategies && Array.isArray(portfolio.strategicOptions.WO_strategies)) total += portfolio.strategicOptions.WO_strategies.length;
        if (portfolio.strategicOptions.ST_strategies && Array.isArray(portfolio.strategicOptions.ST_strategies)) total += portfolio.strategicOptions.ST_strategies.length;
        if (portfolio.strategicOptions.WT_strategies && Array.isArray(portfolio.strategicOptions.WT_strategies)) total += portfolio.strategicOptions.WT_strategies.length;
    }
    if (portfolio.riskAssessment) {
        if (portfolio.riskAssessment.operationalRisks && Array.isArray(portfolio.riskAssessment.operationalRisks)) total += portfolio.riskAssessment.operationalRisks.length;
        if (portfolio.riskAssessment.strategicRisks && Array.isArray(portfolio.riskAssessment.strategicRisks)) total += portfolio.riskAssessment.strategicRisks.length;
    }
    return total;
};

const FullSWOTPortfolio = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    fullSwotData: propFullSwotData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId
}) => {
    const { t } = useTranslation();
    const token = useAuthStore(state => state.token);
    
    const {
        fullSwotData: storeFullSwotData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const fullSwotData = propFullSwotData || storeFullSwotData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('fullSwot');

    const [expandedSections, setExpandedSections] = useState({
        strengths: true,
        weaknesses: true,
        opportunities: true,
        threats: true,
        strategicOptions: true,
        riskAssessment: true,
        competitivePositioning: true
    });

    const [visibleRows, setVisibleRows] = useState(0);
    const [typingTexts, setTypingTexts] = useState({});
    const streamingIntervalRef = useRef(null);

    const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
        const analysisConfig = ANALYSIS_TYPES.fullSwot;
        await checkMissingQuestionsAndRedirect(
            'fullSwot',
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
            onRegenerate();
        } else {
            streamingManager?.resetCard(cardId);
            await regenerateIndividualAnalysis('fullSwot', questions, userAnswers, selectedBusinessId);
        }
    }, [onRegenerate, streamingManager, cardId, questions, userAnswers, selectedBusinessId, regenerateIndividualAnalysis]);

    const typeText = useCallback((text, rowIndex, field, delay = 0) => {
        if (text === null || text === undefined) return;
        const textStr = typeof text === 'string' ? text : String(text);
        setTimeout(() => {
            let currentIndex = 0;
            const key = `${rowIndex}-${field}`;
            const interval = setInterval(() => {
                if (currentIndex <= textStr.length) {
                    setTypingTexts(prev => ({ ...prev, [key]: textStr.substring(0, currentIndex) }));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, STREAMING_CONFIG.TYPING_SPEED);
        }, delay);
    }, []);

    useEffect(() => {
        const totalRows = calculateTotalRows(fullSwotData);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [fullSwotData, cardId, streamingManager]);

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) return;
        if (!fullSwotData || isRegenerating || isFullSwotDataIncomplete(fullSwotData)) return;

        const swotPortfolio = fullSwotData.swotPortfolio || fullSwotData.swot_portfolio || fullSwotData.fullSwot || fullSwotData.full_swot || (fullSwotData.strengths || fullSwotData.weaknesses ? fullSwotData : null);
        if (!swotPortfolio) return;

        const portfolio = swotPortfolio;
        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(fullSwotData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                let rowsProcessed = 0;

                if (portfolio.strengths && Array.isArray(portfolio.strengths)) {
                    const strengthIndex = currentRow - rowsProcessed;
                    if (strengthIndex >= 0 && strengthIndex < portfolio.strengths.length) {
                        const item = portfolio.strengths[strengthIndex];
                        typeText(item.item, currentRow, 'item', 0);
                        if (item.category) typeText(item.category, currentRow, 'category', 200);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += portfolio.strengths.length;
                }

                if (portfolio.weaknesses && Array.isArray(portfolio.weaknesses)) {
                    const weaknessIndex = currentRow - rowsProcessed;
                    if (weaknessIndex >= 0 && weaknessIndex < portfolio.weaknesses.length) {
                        const item = portfolio.weaknesses[weaknessIndex];
                        typeText(item.item, currentRow, 'item', 0);
                        if (item.category) typeText(item.category, currentRow, 'category', 200);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += portfolio.weaknesses.length;
                }

                if (portfolio.opportunities && Array.isArray(portfolio.opportunities)) {
                    const opportunityIndex = currentRow - rowsProcessed;
                    if (opportunityIndex >= 0 && opportunityIndex < portfolio.opportunities.length) {
                        const item = portfolio.opportunities[opportunityIndex];
                        typeText(item.item, currentRow, 'item', 0);
                        if (item.category) typeText(item.category, currentRow, 'category', 200);
                        if (item.timeframe) typeText(item.timeframe, currentRow, 'timeframe', 300);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += portfolio.opportunities.length;
                }

                if (portfolio.threats && Array.isArray(portfolio.threats)) {
                    const threatIndex = currentRow - rowsProcessed;
                    if (threatIndex >= 0 && threatIndex < portfolio.threats.length) {
                        const item = portfolio.threats[threatIndex];
                        typeText(item.item, currentRow, 'item', 0);
                        if (item.category) typeText(item.category, currentRow, 'category', 200);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += portfolio.threats.length;
                }

                if (portfolio.strategicOptions) {
                    const so = portfolio.strategicOptions;
                    if (so.SO_strategies && Array.isArray(so.SO_strategies)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < so.SO_strategies.length) {
                            typeText(so.SO_strategies[index], currentRow, 'strategy', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += so.SO_strategies.length;
                    }
                    if (so.WO_strategies && Array.isArray(so.WO_strategies)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < so.WO_strategies.length) {
                            typeText(so.WO_strategies[index], currentRow, 'strategy', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += so.WO_strategies.length;
                    }
                    if (so.ST_strategies && Array.isArray(so.ST_strategies)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < so.ST_strategies.length) {
                            typeText(so.ST_strategies[index], currentRow, 'strategy', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += so.ST_strategies.length;
                    }
                    if (so.WT_strategies && Array.isArray(so.WT_strategies)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < so.WT_strategies.length) {
                            typeText(so.WT_strategies[index], currentRow, 'strategy', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += so.WT_strategies.length;
                    }
                }

                if (portfolio.riskAssessment) {
                    const ra = portfolio.riskAssessment;
                    if (ra.operationalRisks && Array.isArray(ra.operationalRisks)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < ra.operationalRisks.length) {
                            const risk = ra.operationalRisks[index];
                            typeText(risk.risk, currentRow, 'risk', 0);
                            if (risk.mitigationMeasures) typeText(risk.mitigationMeasures, currentRow, 'mitigation', 200);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += ra.operationalRisks.length;
                    }
                    if (ra.strategicRisks && Array.isArray(ra.strategicRisks)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < ra.strategicRisks.length) {
                            const risk = ra.strategicRisks[index];
                            typeText(risk.risk, currentRow, 'risk', 0);
                            if (risk.mitigationMeasures) typeText(risk.mitigationMeasures, currentRow, 'mitigation', 200);
                            currentRow++;
                            return;
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
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        };
    }, [cardId, fullSwotData, isRegenerating, streamingManager, setUserHasScrolled, typeText]);

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        };
    }, []);

    const toggleSection = useCallback((sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    }, []);

    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating Full SWOT Portfolio...</span>
                </div>
            </div>
        );
    }

    if (!fullSwotData || isFullSwotDataIncomplete(fullSwotData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="fullSwot"
                    analysisDisplayName="Full SWOT Portfolio"
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

    const portfolio = fullSwotData.swotPortfolio || fullSwotData.swot_portfolio || fullSwotData.fullSwot || fullSwotData.full_swot || (fullSwotData.strengths || fullSwotData.weaknesses ? fullSwotData : null);

    let currentRowIndex = 0;
    const strengthsIndices = {};
    const weaknessesIndices = {};
    const opportunitiesIndices = {};
    const threatsIndices = {};
    const soStrategiesIndices = {};
    const woStrategiesIndices = {};
    const stStrategiesIndices = {};
    const wtStrategiesIndices = {};
    const operationalRisksIndices = {};
    const strategicRisksIndices = {};

    if (portfolio.strengths && Array.isArray(portfolio.strengths)) {
        portfolio.strengths.forEach((_, index) => { strengthsIndices[index] = currentRowIndex++; });
    }
    if (portfolio.weaknesses && Array.isArray(portfolio.weaknesses)) {
        portfolio.weaknesses.forEach((_, index) => { weaknessesIndices[index] = currentRowIndex++; });
    }
    if (portfolio.opportunities && Array.isArray(portfolio.opportunities)) {
        portfolio.opportunities.forEach((_, index) => { opportunitiesIndices[index] = currentRowIndex++; });
    }
    if (portfolio.threats && Array.isArray(portfolio.threats)) {
        portfolio.threats.forEach((_, index) => { threatsIndices[index] = currentRowIndex++; });
    }
    if (portfolio.strategicOptions) {
        if (portfolio.strategicOptions.SO_strategies && Array.isArray(portfolio.strategicOptions.SO_strategies)) {
            portfolio.strategicOptions.SO_strategies.forEach((_, index) => { soStrategiesIndices[index] = currentRowIndex++; });
        }
        if (portfolio.strategicOptions.WO_strategies && Array.isArray(portfolio.strategicOptions.WO_strategies)) {
            portfolio.strategicOptions.WO_strategies.forEach((_, index) => { woStrategiesIndices[index] = currentRowIndex++; });
        }
        if (portfolio.strategicOptions.ST_strategies && Array.isArray(portfolio.strategicOptions.ST_strategies)) {
            portfolio.strategicOptions.ST_strategies.forEach((_, index) => { stStrategiesIndices[index] = currentRowIndex++; });
        }
        if (portfolio.strategicOptions.WT_strategies && Array.isArray(portfolio.strategicOptions.WT_strategies)) {
            portfolio.strategicOptions.WT_strategies.forEach((_, index) => { wtStrategiesIndices[index] = currentRowIndex++; });
        }
    }
    if (portfolio.riskAssessment) {
        if (portfolio.riskAssessment.operationalRisks && Array.isArray(portfolio.riskAssessment.operationalRisks)) {
            portfolio.riskAssessment.operationalRisks.forEach((_, index) => { operationalRisksIndices[index] = currentRowIndex++; });
        }
        if (portfolio.riskAssessment.strategicRisks && Array.isArray(portfolio.riskAssessment.strategicRisks)) {
            portfolio.riskAssessment.strategicRisks.forEach((_, index) => { strategicRisksIndices[index] = currentRowIndex++; });
        }
    }

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="porters-container full-swot-container"
            data-analysis-type="fullSwot"
            data-analysis-name="Full SWOT Portfolio"
            data-analysis-order="8">

            {portfolio.overallStrategicScore && (
                <div className="">
                    <h4>
                        <BarChart3 size={24} />
                        Overall Strategic Score: {portfolio.overallStrategicScore}
                    </h4>
                </div>
            )}

            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('threats')}>
                    <h5>{t("fullswot_card1")}</h5>
                    {expandedSections.threats ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className='table-container'>
                    {portfolio.strengths && portfolio.strengths.length > 0 && (
                        <>
                            {expandedSections.strengths && (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t("fullswot_card1_head1")}</th>
                                            <th>{t("fullswot_card1_head2")}</th>
                                            <th>{t("fullswot_card1_head3")}</th>
                                            <th>{t("fullswot_card1_head4")}</th>
                                            <th>{t("fullswot_card1_head5")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.strengths.map((item, index) => {
                                            const rowIndex = strengthsIndices[index];
                                            const isVisible = rowIndex < visibleRows;
                                            const isLast = rowIndex === visibleRows - 1;
                                            return (
                                                <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td>{hasStreamed ? item.item : (typingTexts[`${rowIndex}-item`] || item.item)}</td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                        {item.score && (<span className={`status-badge ${getScoreColor(item.score)}`}>{item.score}</span>)}
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                        <span className="force-tag">{hasStreamed ? (item.category?.replace(/_/g, ' ') || 'N/A') : (typingTexts[`${rowIndex}-category`]?.replace(/_/g, ' ') || item.category?.replace(/_/g, ' ') || 'N/A')}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                        <span className={`status-badge ${item.competitiveAdvantage ? 'high-intensity' : 'low-intensity'}`}>{item.competitiveAdvantage ? 'Yes' : 'No'}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                        <span className={`status-badge ${item.customerValidated ? 'high-intensity' : 'low-intensity'}`}>{item.customerValidated ? 'Yes' : 'No'}</span>
                                                    </td>
                                                </StreamingRow>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {portfolio.weaknesses && portfolio.weaknesses.length > 0 && (
                        <>
                            {expandedSections.weaknesses && (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t("fullswot_card1_head6")}</th>
                                            <th>{t("fullswot_card1_head2")}</th>
                                            <th>{t("fullswot_card1_head3")}</th>
                                            <th>{t("fullswot_card1_head7")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.weaknesses.map((item, index) => {
                                            const rowIndex = weaknessesIndices[index];
                                            const isVisible = rowIndex < visibleRows;
                                            const isLast = rowIndex === visibleRows - 1;
                                            return (
                                                <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td>{hasStreamed ? item.item : (typingTexts[`${rowIndex}-item`] || item.item)}</td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                        {item.score && (<span className={`status-badge ${getScoreColor(item.score)}`}>{item.score}</span>)}
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                        <span className="force-tag">{hasStreamed ? (item.category?.replace(/_/g, ' ') || 'N/A') : (typingTexts[`${rowIndex}-category`]?.replace(/_/g, ' ') || item.category?.replace(/_/g, ' ') || 'N/A')}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                        {item.improvementPriority && (<span className={`status-badge ${getPriorityColor(item.improvementPriority)}`}>{item.improvementPriority}</span>)}
                                                    </td>
                                                </StreamingRow>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {portfolio.opportunities && portfolio.opportunities.length > 0 && (
                        <>
                            {expandedSections.opportunities && (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t("fullswot_card1_head8")}</th>
                                            <th>{t("fullswot_card1_head2")}</th>
                                            <th>{t("fullswot_card1_head3")}</th>
                                            <th>{t("fullswot_card1_head9")}</th>
                                            <th>{t("fullswot_card1_head10")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.opportunities.map((item, index) => {
                                            const rowIndex = opportunitiesIndices[index];
                                            const isVisible = rowIndex < visibleRows;
                                            const isLast = rowIndex === visibleRows - 1;
                                            return (
                                                <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td>{hasStreamed ? item.item : (typingTexts[`${rowIndex}-item`] || item.item)}</td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                        {item.score && (<span className={`status-badge ${getScoreColor(item.score)}`}>{item.score}</span>)}
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                        <span className="force-tag">{hasStreamed ? (item.category?.replace(/_/g, ' ') || 'N/A') : (typingTexts[`${rowIndex}-category`]?.replace(/_/g, ' ') || item.category?.replace(/_/g, ' ') || 'N/A')}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                        <span className={`status-badge ${item.marketTrend ? 'high-intensity' : 'low-intensity'}`}>{item.marketTrend ? 'Yes' : 'No'}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                        {item.timeframe && (<span className="timeline-badge">{hasStreamed ? item.timeframe : (typingTexts[`${rowIndex}-timeframe`] || item.timeframe)}</span>)}
                                                    </td>
                                                </StreamingRow>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {portfolio.threats && portfolio.threats.length > 0 && (
                        <>
                            {expandedSections.threats && (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t("fullswot_card1_head11")}</th>
                                            <th>{t("fullswot_card1_head2")}</th>
                                            <th>{t("fullswot_card1_head3")}</th>
                                            <th>{t("fullswot_card1_head12")}</th>
                                            <th>{t("fullswot_card1_head13")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.threats.map((item, index) => {
                                            const rowIndex = threatsIndices[index];
                                            const isVisible = rowIndex < visibleRows;
                                            const isLast = rowIndex === visibleRows - 1;
                                            return (
                                                <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                    <td>{hasStreamed ? item.item : (typingTexts[`${rowIndex}-item`] || item.item)}</td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                        {item.score && (<span className={`status-badge ${getScoreColor(item.score)}`}>{item.score}</span>)}
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                        <span className="force-tag">{hasStreamed ? (item.category?.replace(/_/g, ' ') || 'N/A') : (typingTexts[`${rowIndex}-category`]?.replace(/_/g, ' ') || item.category?.replace(/_/g, ' ') || 'N/A')}</span>
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                        {item.likelihood && (<span className={`status-badge ${getPriorityColor(item.likelihood)}`}>{item.likelihood}</span>)}
                                                    </td>
                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
                                                        {item.impact && (<span className={`status-badge ${getPriorityColor(item.impact)}`}>{item.impact}</span>)}
                                                    </td>
                                                </StreamingRow>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>

            {portfolio.strategicOptions && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strategicOptions')}>
                        <h5>{t("fullswot_card2")}</h5>
                        {expandedSections.strategicOptions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedSections.strategicOptions && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t("fullswot_card2_head1")}</th>
                                        <th>{t("fullswot_card2_head2")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.strategicOptions.SO_strategies && portfolio.strategicOptions.SO_strategies.map((strategy, index) => {
                                        const rowIndex = soStrategiesIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`so-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">SO - Strengths-Opportunities</span></td>
                                                <td>{hasStreamed ? strategy : (typingTexts[`${rowIndex}-strategy`] || strategy)}</td>
                                            </StreamingRow>
                                        );
                                    })}
                                    {portfolio.strategicOptions.WO_strategies && portfolio.strategicOptions.WO_strategies.map((strategy, index) => {
                                        const rowIndex = woStrategiesIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`wo-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">WO - Weaknesses-Opportunities</span></td>
                                                <td>{hasStreamed ? strategy : (typingTexts[`${rowIndex}-strategy`] || strategy)}</td>
                                            </StreamingRow>
                                        );
                                    })}
                                    {portfolio.strategicOptions.ST_strategies && portfolio.strategicOptions.ST_strategies.map((strategy, index) => {
                                        const rowIndex = stStrategiesIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`st-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">ST - Strengths-Threats</span></td>
                                                <td>{hasStreamed ? strategy : (typingTexts[`${rowIndex}-strategy`] || strategy)}</td>
                                            </StreamingRow>
                                        );
                                    })}
                                    {portfolio.strategicOptions.WT_strategies && portfolio.strategicOptions.WT_strategies.map((strategy, index) => {
                                        const rowIndex = wtStrategiesIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`wt-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">WT - Weaknesses-Threats</span></td>
                                                <td>{hasStreamed ? strategy : (typingTexts[`${rowIndex}-strategy`] || strategy)}</td>
                                            </StreamingRow>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {portfolio.riskAssessment && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('riskAssessment')}>
                        <h3>Risk Assessment</h3>
                        {expandedSections.riskAssessment ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedSections.riskAssessment && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Risk Type</th>
                                        <th>Risk</th>
                                        <th>Likelihood</th>
                                        <th>Financial Impact</th>
                                        <th>Mitigation Measures</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.riskAssessment.operationalRisks && portfolio.riskAssessment.operationalRisks.map((risk, index) => {
                                        const rowIndex = operationalRisksIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`operational-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">Operational</span></td>
                                                <td>{hasStreamed ? risk.risk : (typingTexts[`${rowIndex}-risk`] || risk.risk)}</td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                    <span className={`status-badge ${getLikelihoodColor(risk.likelihood)}`}>{risk.likelihood}</span>
                                                </td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                    <span className="status-badge medium-intensity">{risk.potentialFinancialImpact}</span>
                                                </td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                    {hasStreamed ? risk.mitigationMeasures : (typingTexts[`${rowIndex}-mitigation`] || risk.mitigationMeasures)}
                                                </td>
                                            </StreamingRow>
                                        );
                                    })}
                                    {portfolio.riskAssessment.strategicRisks && portfolio.riskAssessment.strategicRisks.map((risk, index) => {
                                        const rowIndex = strategicRisksIndices[index];
                                        const isVisible = rowIndex < visibleRows;
                                        const isLast = rowIndex === visibleRows - 1;
                                        return (
                                            <StreamingRow key={`strategic-${index}`} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                <td><span className="force-tag">Strategic</span></td>
                                                <td>{hasStreamed ? risk.risk : (typingTexts[`${rowIndex}-risk`] || risk.risk)}</td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.1s' }}>
                                                    <span className={`status-badge ${getLikelihoodColor(risk.likelihood)}`}>{risk.likelihood}</span>
                                                </td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                    <span className="status-badge medium-intensity">{risk.potentialFinancialImpact}</span>
                                                </td>
                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.3s' }}>
                                                    {hasStreamed ? risk.mitigationMeasures : (typingTexts[`${rowIndex}-mitigation`] || risk.mitigationMeasures)}
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
        </div>
    );
};

export default FullSWOTPortfolio;