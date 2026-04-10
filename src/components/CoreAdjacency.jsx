import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Loader, TrendingUp, Target, Lightbulb, AlertTriangle,
    ChevronDown, ChevronRight, Shield, Activity
} from 'lucide-react';
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import { useTranslation } from '@/hooks/useTranslation';

const CoreAdjacency = ({
    userAnswers = {},
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    coreAdjacencyData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
}) => {
    const [data, setData] = useState(coreAdjacencyData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        coreBusinessDefinition: true,
        growthOpportunities: true,
        growthVectorCategorization: true,
        missingInformation: true,
        recommendedNextSteps: true
    });

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
        const analysisConfig = ANALYSIS_TYPES.coreAdjacency || {
            displayName: 'Core vs. Adjacency Analysis',
            customMessage: 'Complete your business brief to generate a comprehensive Core vs. Adjacency analysis.'
        };

        await checkMissingQuestionsAndRedirect(
            'coreAdjacency',
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
        if (onRegenerate) {
            onRegenerate();
        }
    };

    const isCoreAdjacencyDataIncomplete = (data) => {
        if (!data) return true;

        const normalized = data.coreAdjacency || data.core_adjacency || data.CoreAdjacency || (data.coreBusinessDefinition || data.growthOpportunities ? data : null);
        if (!normalized) return true;

        const hasCore = normalized.coreBusinessDefinition &&
            (normalized.coreBusinessDefinition.keySegments?.length > 0 ||
                normalized.coreBusinessDefinition.primaryCapabilities?.length > 0 ||
                normalized.coreBusinessDefinition.profitDrivers?.length > 0);

        const hasGrowth = normalized.growthOpportunities &&
            (normalized.growthOpportunities.withinCore?.length > 0 ||
                normalized.growthOpportunities.adjacent?.length > 0 ||
                normalized.growthOpportunities.nonAdjacent?.length > 0);

        const hasVectors = normalized.growthVectorCategorization &&
            Object.values(normalized.growthVectorCategorization).some(arr => arr?.length > 0);

        const sectionsWithData = [hasCore, hasGrowth, hasVectors].filter(Boolean).length;
        return sectionsWithData < 2;
    };

    const calculateTotalRows = useCallback((data) => {
        if (!data || isCoreAdjacencyDataIncomplete(data)) {
            return 0;
        }

        const normalized = data.coreAdjacency || data.core_adjacency || data.CoreAdjacency || (data.coreBusinessDefinition || data.growthOpportunities ? data : null);
        if (!normalized) return 0;

        let total = 0;

        if (normalized.coreBusinessDefinition) {
            if (normalized.coreBusinessDefinition.keySegments && Array.isArray(normalized.coreBusinessDefinition.keySegments)) {
                total += normalized.coreBusinessDefinition.keySegments.length;
            }
            if (normalized.coreBusinessDefinition.primaryCapabilities && Array.isArray(normalized.coreBusinessDefinition.primaryCapabilities)) {
                total += normalized.coreBusinessDefinition.primaryCapabilities.length;
            }
            if (normalized.coreBusinessDefinition.profitDrivers && Array.isArray(normalized.coreBusinessDefinition.profitDrivers)) {
                total += normalized.coreBusinessDefinition.profitDrivers.length;
            }
        }

        if (normalized.growthOpportunities) {
            if (normalized.growthOpportunities.withinCore && Array.isArray(normalized.growthOpportunities.withinCore)) {
                total += normalized.growthOpportunities.withinCore.length;
            }
            if (normalized.growthOpportunities.adjacent && Array.isArray(normalized.growthOpportunities.adjacent)) {
                total += normalized.growthOpportunities.adjacent.length;
            }
            if (normalized.growthOpportunities.nonAdjacent && Array.isArray(normalized.growthOpportunities.nonAdjacent)) {
                total += normalized.growthOpportunities.nonAdjacent.length;
            }
        }

        if (normalized.growthVectorCategorization) {
            Object.values(normalized.growthVectorCategorization).forEach(arr => {
                if (Array.isArray(arr)) total += arr.length;
            });
        }

        if (normalized.missingInformation && Array.isArray(normalized.missingInformation)) {
            total += normalized.missingInformation.length;
        }

        if (normalized.recommendedNextSteps && Array.isArray(normalized.recommendedNextSteps)) {
            total += normalized.recommendedNextSteps.length;
        }

        return total;
    }, []);

    const typeText = (text, rowIndex, field, delay = 0) => {
        if (text === null || text === undefined) return;

        const textStr = typeof text === 'string' ? text : String(text);

        setTimeout(() => {
            let currentIndex = 0;
            const key = `${rowIndex}-${field}`;

            const interval = setInterval(() => {
                if (currentIndex <= textStr.length) {
                    setTypingTexts(prev => ({
                        ...prev,
                        [key]: textStr.substring(0, currentIndex)
                    }));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, STREAMING_CONFIG.TYPING_SPEED);
        }, delay);
    };

    useEffect(() => {
        const totalRows = calculateTotalRows(coreAdjacencyData);

        if (totalRows === 0) {
            return;
        }

        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [coreAdjacencyData, cardId, streamingManager, calculateTotalRows]);

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) {
            return;
        }

        if (!coreAdjacencyData || isRegenerating || isCoreAdjacencyDataIncomplete(coreAdjacencyData)) {
            return;
        }

        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
        }

        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(coreAdjacencyData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);

                let rowsProcessed = 0;
                const normalized = coreAdjacencyData.coreAdjacency || coreAdjacencyData.core_adjacency || coreAdjacencyData.CoreAdjacency || (coreAdjacencyData.coreBusinessDefinition || coreAdjacencyData.growthOpportunities ? coreAdjacencyData : null);
                if (!normalized) return;

                if (normalized.coreBusinessDefinition) {
                    const cbd = normalized.coreBusinessDefinition;

                    if (cbd.keySegments && Array.isArray(cbd.keySegments) && cbd.keySegments.length > 0) {
                        const segmentIndex = currentRow - rowsProcessed;
                        if (segmentIndex >= 0 && segmentIndex < cbd.keySegments.length) {
                            typeText(cbd.keySegments[segmentIndex], currentRow, 'content', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += cbd.keySegments.length;
                    }

                    if (cbd.primaryCapabilities && Array.isArray(cbd.primaryCapabilities) && cbd.primaryCapabilities.length > 0) {
                        const capabilityIndex = currentRow - rowsProcessed;
                        if (capabilityIndex >= 0 && capabilityIndex < cbd.primaryCapabilities.length) {
                            typeText(cbd.primaryCapabilities[capabilityIndex], currentRow, 'content', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += cbd.primaryCapabilities.length;
                    }

                    if (cbd.profitDrivers && Array.isArray(cbd.profitDrivers) && cbd.profitDrivers.length > 0) {
                        const driverIndex = currentRow - rowsProcessed;
                        if (driverIndex >= 0 && driverIndex < cbd.profitDrivers.length) {
                            typeText(cbd.profitDrivers[driverIndex], currentRow, 'content', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += cbd.profitDrivers.length;
                    }
                }

                if (normalized.growthOpportunities) {
                    const go = normalized.growthOpportunities;

                    if (go.withinCore && Array.isArray(go.withinCore) && go.withinCore.length > 0) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < go.withinCore.length) {
                            const item = go.withinCore[index];
                            typeText(item.opportunity || item.description || item, currentRow, 'opportunity', 0);
                            if (item.rationale) typeText(item.rationale, currentRow, 'rationale', 200);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += go.withinCore.length;
                    }

                    if (go.adjacent && Array.isArray(go.adjacent) && go.adjacent.length > 0) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < go.adjacent.length) {
                            const item = go.adjacent[index];
                            typeText(item.opportunity || item.description || item, currentRow, 'opportunity', 0);
                            if (item.rationale) typeText(item.rationale, currentRow, 'rationale', 200);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += go.adjacent.length;
                    }

                    if (go.nonAdjacent && Array.isArray(go.nonAdjacent) && go.nonAdjacent.length > 0) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < go.nonAdjacent.length) {
                            const item = go.nonAdjacent[index];
                            typeText(item.opportunity || item.description || item, currentRow, 'opportunity', 0);
                            if (item.rationale) typeText(item.rationale, currentRow, 'rationale', 200);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += go.nonAdjacent.length;
                    }
                }

                if (normalized.growthVectorCategorization) {
                    const gvc = normalized.growthVectorCategorization;
                    const allVectors = Object.entries(gvc).flatMap(([key, items]) =>
                        (Array.isArray(items) ? items : []).map(item => ({ ...item, category: key }))
                    );

                    const vectorIndex = currentRow - rowsProcessed;
                    if (vectorIndex >= 0 && vectorIndex < allVectors.length) {
                        const item = allVectors[vectorIndex];
                        typeText(item.vector || item, currentRow, 'vector', 0);
                        if (item.description) typeText(item.description, currentRow, 'description', 200);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += allVectors.length;
                }

                if (normalized.missingInformation && Array.isArray(normalized.missingInformation) && normalized.missingInformation.length > 0) {
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < normalized.missingInformation.length) {
                        typeText(normalized.missingInformation[index], currentRow, 'content', 0);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += normalized.missingInformation.length;
                }

                if (normalized.recommendedNextSteps && Array.isArray(normalized.recommendedNextSteps) && normalized.recommendedNextSteps.length > 0) {
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < normalized.recommendedNextSteps.length) {
                        typeText(normalized.recommendedNextSteps[index], currentRow, 'content', 0);
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
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, [cardId, coreAdjacencyData, isRegenerating, streamingManager, setUserHasScrolled]);

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, []);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (coreAdjacencyData) {
            const normalized = coreAdjacencyData.coreAdjacency || coreAdjacencyData.core_adjacency || coreAdjacencyData.CoreAdjacency || (coreAdjacencyData.coreBusinessDefinition || coreAdjacencyData.growthOpportunities ? coreAdjacencyData : null);

            if (normalized && (normalized.coreBusinessDefinition || normalized.growthOpportunities)) {
                setData(normalized);
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
    }, [coreAdjacencyData]);

    const formatLabel = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const getSectionIcon = (sectionKey) => {
        const keyLower = sectionKey.toLowerCase();
        if (keyLower.includes('core') || keyLower.includes('definition')) return Shield;
        if (keyLower.includes('growth') && keyLower.includes('opportunit')) return TrendingUp;
        if (keyLower.includes('vector') || keyLower.includes('categori')) return Target;
        if (keyLower.includes('missing') || keyLower.includes('gap')) return AlertTriangle;
        if (keyLower.includes('recommend') || keyLower.includes('next')) return Lightbulb;
        return Activity;
    };

    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating Core vs. Adjacency Analysis..."
                            : "Generating Core vs. Adjacency Analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    if (error || (!hasGenerated && !data && Object.keys(userAnswers).length > 0)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="coreAdjacency"
                    analysisDisplayName="Core vs. Adjacency Analysis"
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

    if (!coreAdjacencyData || isCoreAdjacencyDataIncomplete(coreAdjacencyData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="coreAdjacency"
                    analysisDisplayName="Core vs. Adjacency Analysis"
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

    let currentRowIndex = 0;
    const keySegmentsIndices = {};
    const primaryCapabilitiesIndices = {};
    const profitDriversIndices = {};
    const withinCoreIndices = {};
    const adjacentIndices = {};
    const nonAdjacentIndices = {};
    const vectorIndices = {};
    const missingInfoIndices = {};
    const nextStepsIndices = {};

    if (data.coreBusinessDefinition) {
        if (data.coreBusinessDefinition.keySegments && Array.isArray(data.coreBusinessDefinition.keySegments)) {
            data.coreBusinessDefinition.keySegments.forEach((_, index) => {
                keySegmentsIndices[index] = currentRowIndex++;
            });
        }
        if (data.coreBusinessDefinition.primaryCapabilities && Array.isArray(data.coreBusinessDefinition.primaryCapabilities)) {
            data.coreBusinessDefinition.primaryCapabilities.forEach((_, index) => {
                primaryCapabilitiesIndices[index] = currentRowIndex++;
            });
        }
        if (data.coreBusinessDefinition.profitDrivers && Array.isArray(data.coreBusinessDefinition.profitDrivers)) {
            data.coreBusinessDefinition.profitDrivers.forEach((_, index) => {
                profitDriversIndices[index] = currentRowIndex++;
            });
        }
    }

    if (data.growthOpportunities) {
        if (data.growthOpportunities.withinCore && Array.isArray(data.growthOpportunities.withinCore)) {
            data.growthOpportunities.withinCore.forEach((_, index) => {
                withinCoreIndices[index] = currentRowIndex++;
            });
        }
        if (data.growthOpportunities.adjacent && Array.isArray(data.growthOpportunities.adjacent)) {
            data.growthOpportunities.adjacent.forEach((_, index) => {
                adjacentIndices[index] = currentRowIndex++;
            });
        }
        if (data.growthOpportunities.nonAdjacent && Array.isArray(data.growthOpportunities.nonAdjacent)) {
            data.growthOpportunities.nonAdjacent.forEach((_, index) => {
                nonAdjacentIndices[index] = currentRowIndex++;
            });
        }
    }

    if (data.growthVectorCategorization) {
        Object.entries(data.growthVectorCategorization).forEach(([category, items]) => {
            if (Array.isArray(items)) {
                items.forEach((_, index) => {
                    if (!vectorIndices[category]) vectorIndices[category] = {};
                    vectorIndices[category][index] = currentRowIndex++;
                });
            }
        });
    }

    if (data.missingInformation && Array.isArray(data.missingInformation)) {
        data.missingInformation.forEach((_, index) => {
            missingInfoIndices[index] = currentRowIndex++;
        });
    }

    if (data.recommendedNextSteps && Array.isArray(data.recommendedNextSteps)) {
        data.recommendedNextSteps.forEach((_, index) => {
            nextStepsIndices[index] = currentRowIndex++;
        });
    }

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    return (
        <div className="porters-container full-swot-container"
            data-analysis-type="coreAdjacency"
            data-analysis-name="Core vs. Adjacency"
            data-analysis-order="10">

            {data.coreBusinessDefinition && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('coreBusinessDefinition')}>
                        <h5>
                            <Shield size={20} style={{ marginRight: '8px' }} />
                            {t('Core_Business_Definition')}
                        </h5>
                        {expandedSections.coreBusinessDefinition ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.coreBusinessDefinition && (
                        <div className="table-container">
                            {data.coreBusinessDefinition.description && (
                                <div className="coreBusinessDefinition" style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <p style={{ margin: 0, lineHeight: '1.6' }}>{data.coreBusinessDefinition.description}</p>
                                </div>
                            )}

                            <table className="data-table">
                                <tbody>
                                    {data.coreBusinessDefinition.keySegments && data.coreBusinessDefinition.keySegments.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    {t('Key_Segments')}
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.keySegments.map((item, idx) => {
                                                        const rowIndex = keySegmentsIndices[idx];
                                                        const isVisible = rowIndex < visibleRows;
                                                        const isLast = rowIndex === visibleRows - 1;

                                                        return (
                                                            <li
                                                                key={idx}
                                                                ref={isLast && isStreaming ? lastRowRef : null}
                                                                style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}
                                                            >
                                                                {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.coreBusinessDefinition.primaryCapabilities && data.coreBusinessDefinition.primaryCapabilities.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    {t('Primary_Capabilities')}
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.primaryCapabilities.map((item, idx) => {
                                                        const rowIndex = primaryCapabilitiesIndices[idx];
                                                        const isVisible = rowIndex < visibleRows;
                                                        const isLast = rowIndex === visibleRows - 1;

                                                        return (
                                                            <li
                                                                key={idx}
                                                                ref={isLast && isStreaming ? lastRowRef : null}
                                                                style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}
                                                            >
                                                                {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.coreBusinessDefinition.profitDrivers && data.coreBusinessDefinition.profitDrivers.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    {t('Profit_Drivers')}
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.profitDrivers.map((item, idx) => {
                                                        const rowIndex = profitDriversIndices[idx];
                                                        const isVisible = rowIndex < visibleRows;
                                                        const isLast = rowIndex === visibleRows - 1;

                                                        return (
                                                            <li
                                                                key={idx}
                                                                ref={isLast && isStreaming ? lastRowRef : null}
                                                                style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}
                                                            >
                                                                {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                            </li>
                                                        );
                                                    })}
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

            {data.growthOpportunities && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthOpportunities')}>
                        <h5>
                            <TrendingUp size={20} style={{ marginRight: '8px' }} />
                            {t('Growth_Opportunities')}
                        </h5>
                        {expandedSections.growthOpportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.growthOpportunities && (
                        <div className="table-container">
                            {data.growthOpportunities.withinCore && data.growthOpportunities.withinCore.length > 0 && (
                                <>
                                    <h6 style={{ margin: '1rem 0 0.5rem 0', color: '#2c5282' }}>{t('Within_Core')}</h6>
                                    <table className="data-table">
                                        <tbody>
                                            {data.growthOpportunities.withinCore.map((item, idx) => {
                                                const rowIndex = withinCoreIndices[idx];
                                                const isVisible = rowIndex < visibleRows;
                                                const isLast = rowIndex === visibleRows - 1;
                                                const opportunity = typeof item === 'string' ? item : (item.opportunity || item.description || '');
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                        isStreaming={isStreaming}

                                                    >
                                                        <td>
                                                            {hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}
                                                        </td>
                                                        {rationale && (
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                            </td>
                                                        )}
                                                    </StreamingRow>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {data.growthOpportunities.adjacent && data.growthOpportunities.adjacent.length > 0 && (
                                <>
                                    <h6 style={{ margin: '1rem 0 0.5rem 0', color: '#2c5282' }}>{t('Adjacent')}</h6>
                                    <table className="data-table">
                                        <tbody>
                                            {data.growthOpportunities.adjacent.map((item, idx) => {
                                                const rowIndex = adjacentIndices[idx];
                                                const isVisible = rowIndex < visibleRows;
                                                const isLast = rowIndex === visibleRows - 1;
                                                const opportunity = typeof item === 'string' ? item : (item.opportunity || item.description || '');
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                        isStreaming={isStreaming}
                                                    >
                                                        <td>
                                                            {hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}
                                                        </td>
                                                        {rationale && (
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                            </td>
                                                        )}
                                                    </StreamingRow>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {data.growthOpportunities.nonAdjacent && data.growthOpportunities.nonAdjacent.length > 0 && (
                                <>
                                    <h6 style={{ margin: '1rem 0 0.5rem 0', color: '#2c5282' }}>{t('Non-Adjacent')}</h6>
                                    <table className="data-table">
                                        <tbody>
                                            {data.growthOpportunities.nonAdjacent.map((item, idx) => {
                                                const rowIndex = nonAdjacentIndices[idx];
                                                const isVisible = rowIndex < visibleRows;
                                                const isLast = rowIndex === visibleRows - 1;
                                                const opportunity = typeof item === 'string' ? item : (item.opportunity || item.description || '');
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                        isStreaming={isStreaming}
                                                    >
                                                        <td> {hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}
                                                        </td>
                                                        {rationale && (
                                                            <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                            </td>
                                                        )}
                                                    </StreamingRow>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {data.growthVectorCategorization && Object.keys(data.growthVectorCategorization).length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthVectorCategorization')}>
                        <h5>
                            <Target size={20} style={{ marginRight: '8px' }} />
                            {t('Growth_Vector_Categorization')}
                        </h5>
                        {expandedSections.growthVectorCategorization ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.growthVectorCategorization && (
                        <div className="table-container">
                            {Object.entries(data.growthVectorCategorization).map(([category, items]) => {
                                if (!items || items.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h6 style={{ margin: '1rem 0 0.5rem 0', color: '#2c5282' }}>{formatLabel(category)}</h6>
                                        <table className="data-table">
                                            <tbody>
                                                {items.map((item, idx) => {
                                                    const rowIndex = vectorIndices[category]?.[idx];
                                                    const isVisible = rowIndex < visibleRows;
                                                    const isLast = rowIndex === visibleRows - 1;
                                                    const vector = typeof item === 'string' ? item : item.vector || '';
                                                    const description = typeof item === 'object' ? item.description : '';

                                                    return (
                                                        <StreamingRow
                                                            key={idx}
                                                            isVisible={isVisible}
                                                            isLast={isLast && isStreaming}
                                                            lastRowRef={lastRowRef}
                                                            isStreaming={isStreaming}
                                                        >
                                                            <td style={{ width: '40%' }}> {hasStreamed ? vector : (typingTexts[`${rowIndex}-vector`] || vector)}
                                                            </td>
                                                            {description && (
                                                                <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                    {hasStreamed ? description : (typingTexts[`${rowIndex}-description`] || description)}
                                                                </td>
                                                            )}
                                                        </StreamingRow>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {data.missingInformation && data.missingInformation.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('missingInformation')}>
                        <h5>
                            <AlertTriangle size={20} style={{ marginRight: '8px' }} />
                            {t('Missing_Information')}
                        </h5>
                        {expandedSections.missingInformation ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.missingInformation && (
                        <div className="table-container">
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                {data.missingInformation.map((item, idx) => {
                                    const rowIndex = missingInfoIndices[idx];
                                    const isVisible = rowIndex < visibleRows;
                                    const isLast = rowIndex === visibleRows - 1;

                                    return (
                                        <li
                                            key={idx}
                                            ref={isLast && isStreaming ? lastRowRef : null}
                                            style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}
                                        >
                                            {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {data.recommendedNextSteps && data.recommendedNextSteps.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('recommendedNextSteps')}>
                        <h5>
                            <Lightbulb size={20} style={{ marginRight: '8px' }} />
                            {t('Recommended_Next_Steps')}
                        </h5>
                        {expandedSections.recommendedNextSteps ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.recommendedNextSteps && (
                        <div className="table-container">
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                {data.recommendedNextSteps.map((item, idx) => {
                                    const rowIndex = nextStepsIndices[idx];
                                    const isVisible = rowIndex < visibleRows;
                                    const isLast = rowIndex === visibleRows - 1;

                                    return (
                                        <li
                                            key={idx}
                                            ref={isLast && isStreaming ? lastRowRef : null}
                                            style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}
                                        >
                                            {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CoreAdjacency;