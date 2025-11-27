import React, { useState, useEffect, useRef } from 'react';
import {
    Loader, TrendingUp, Target, Lightbulb, AlertTriangle, Award, 
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Map, 
    DollarSign, Activity, Zap, Package, Globe, ArrowRight
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
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    coreAdjacencyData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId
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

        const hasCore = data.coreBusinessDefinition && 
            (data.coreBusinessDefinition.keySegments?.length > 0 || 
             data.coreBusinessDefinition.primaryCapabilities?.length > 0 ||
             data.coreBusinessDefinition.profitDrivers?.length > 0);

        const hasGrowth = data.growthOpportunities && 
            (data.growthOpportunities.withinCore?.length > 0 ||
             data.growthOpportunities.adjacent?.length > 0 ||
             data.growthOpportunities.nonAdjacent?.length > 0);

        const hasVectors = data.growthVectorCategorization &&
            Object.values(data.growthVectorCategorization).some(arr => arr?.length > 0);

        const sectionsWithData = [hasCore, hasGrowth, hasVectors].filter(Boolean).length;
        return sectionsWithData < 2;
    };

    const calculateTotalRows = (data) => {
        if (!data || isCoreAdjacencyDataIncomplete(data)) {
            return 0;
        }

        let total = 0;

        if (data.coreBusinessDefinition) {
            if (data.coreBusinessDefinition.keySegments && Array.isArray(data.coreBusinessDefinition.keySegments)) {
                total += data.coreBusinessDefinition.keySegments.length;
            }
            if (data.coreBusinessDefinition.primaryCapabilities && Array.isArray(data.coreBusinessDefinition.primaryCapabilities)) {
                total += data.coreBusinessDefinition.primaryCapabilities.length;
            }
            if (data.coreBusinessDefinition.profitDrivers && Array.isArray(data.coreBusinessDefinition.profitDrivers)) {
                total += data.coreBusinessDefinition.profitDrivers.length;
            }
        }

        if (data.growthOpportunities) {
            if (data.growthOpportunities.withinCore && Array.isArray(data.growthOpportunities.withinCore)) {
                total += data.growthOpportunities.withinCore.length;
            }
            if (data.growthOpportunities.adjacent && Array.isArray(data.growthOpportunities.adjacent)) {
                total += data.growthOpportunities.adjacent.length;
            }
            if (data.growthOpportunities.nonAdjacent && Array.isArray(data.growthOpportunities.nonAdjacent)) {
                total += data.growthOpportunities.nonAdjacent.length;
            }
        }

        if (data.growthVectorCategorization) {
            Object.values(data.growthVectorCategorization).forEach(arr => {
                if (Array.isArray(arr)) total += arr.length;
            });
        }

        if (data.missingInformation && Array.isArray(data.missingInformation)) {
            total += data.missingInformation.length;
        }

        if (data.recommendedNextSteps && Array.isArray(data.recommendedNextSteps)) {
            total += data.recommendedNextSteps.length;
        }

        return total;
    };

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
    }, [coreAdjacencyData, cardId, streamingManager]);

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

                if (coreAdjacencyData.coreBusinessDefinition) {
                    const cbd = coreAdjacencyData.coreBusinessDefinition;
                    
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

                if (coreAdjacencyData.growthOpportunities) {
                    const go = coreAdjacencyData.growthOpportunities;
                    
                    if (go.withinCore && Array.isArray(go.withinCore) && go.withinCore.length > 0) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < go.withinCore.length) {
                            const item = go.withinCore[index];
                            typeText(item.opportunity || item, currentRow, 'opportunity', 0);
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
                            typeText(item.opportunity || item, currentRow, 'opportunity', 0);
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
                            typeText(item.opportunity || item, currentRow, 'opportunity', 0);
                            if (item.rationale) typeText(item.rationale, currentRow, 'rationale', 200);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += go.nonAdjacent.length;
                    }
                }

                if (coreAdjacencyData.growthVectorCategorization) {
                    const gvc = coreAdjacencyData.growthVectorCategorization;
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

                if (coreAdjacencyData.missingInformation && Array.isArray(coreAdjacencyData.missingInformation) && coreAdjacencyData.missingInformation.length > 0) {
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < coreAdjacencyData.missingInformation.length) {
                        typeText(coreAdjacencyData.missingInformation[index], currentRow, 'content', 0);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += coreAdjacencyData.missingInformation.length;
                }

                if (coreAdjacencyData.recommendedNextSteps && Array.isArray(coreAdjacencyData.recommendedNextSteps) && coreAdjacencyData.recommendedNextSteps.length > 0) {
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < coreAdjacencyData.recommendedNextSteps.length) {
                        typeText(coreAdjacencyData.recommendedNextSteps[index], currentRow, 'content', 0);
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
            setData(coreAdjacencyData);
            setHasGenerated(true);
            setError(null);
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
        let errorMessage = error;
        if (!errorMessage) {
            errorMessage = "Unable to generate Core vs. Adjacency analysis. Please try regenerating or check your inputs.";
        }

        return (
            <div className="porters-container">
                <AnalysisError 
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Core vs. Adjacency Analysis Error"
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
                                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
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
                                                            <StreamingRow
                                                                key={idx}
                                                                isVisible={isVisible}
                                                                isLast={isLast && isStreaming}
                                                                lastRowRef={lastRowRef}
                                                            >
                                                                <li>
                                                                    {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                                </li>
                                                            </StreamingRow>
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
                                                            <StreamingRow
                                                                key={idx}
                                                                isVisible={isVisible}
                                                                isLast={isLast && isStreaming}
                                                                lastRowRef={lastRowRef}
                                                            >
                                                                <li>
                                                                    {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                                </li>
                                                            </StreamingRow>
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
                                                            <StreamingRow
                                                                key={idx}
                                                                isVisible={isVisible}
                                                                isLast={isLast && isStreaming}
                                                                lastRowRef={lastRowRef}
                                                            >
                                                                <li>
                                                                    {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                                                </li>
                                                            </StreamingRow>
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
                                                const opportunity = typeof item === 'string' ? item : item.opportunity || '';
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                    >
                                                        <tr>
                                                            <td>
                                                                <strong>{hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}</strong>
                                                            </td>
                                                            {rationale && (
                                                                <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                    {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                                </td>
                                                            )}
                                                        </tr>
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
                                                const opportunity = typeof item === 'string' ? item : item.opportunity || '';
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                    >
                                                        <tr>
                                                            <td>
                                                                <strong>{hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}</strong>
                                                            </td>
                                                            {rationale && (
                                                                <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                    {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                                </td>
                                                            )}
                                                        </tr>
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
                                                const opportunity = typeof item === 'string' ? item : item.opportunity || '';
                                                const rationale = typeof item === 'object' ? item.rationale : '';

                                                return (
                                                    <StreamingRow
                                                        key={idx}
                                                        isVisible={isVisible}
                                                        isLast={isLast && isStreaming}
                                                        lastRowRef={lastRowRef}
                                                    >
                                                        <tr>
                                                            <td>
                                                                <strong>{hasStreamed ? opportunity : (typingTexts[`${rowIndex}-opportunity`] || opportunity)}</strong>
                                                            </td>
                                                            {rationale && (
                                                                <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                    {hasStreamed ? rationale : (typingTexts[`${rowIndex}-rationale`] || rationale)}
                                                                </td>
                                                            )}
                                                        </tr>
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
                                                        >
                                                            <tr>
                                                                <td style={{ width: '40%' }}>
                                                                    <strong>{hasStreamed ? vector : (typingTexts[`${rowIndex}-vector`] || vector)}</strong>
                                                                </td>
                                                                {description && (
                                                                    <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                                                        {hasStreamed ? description : (typingTexts[`${rowIndex}-description`] || description)}
                                                                    </td>
                                                                )}
                                                            </tr>
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
                                        <StreamingRow
                                            key={idx}
                                            isVisible={isVisible}
                                            isLast={isLast && isStreaming}
                                            lastRowRef={lastRowRef}
                                        >
                                            <li>
                                                {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                            </li>
                                        </StreamingRow>
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
                                        <StreamingRow
                                            key={idx}
                                            isVisible={isVisible}
                                            isLast={isLast && isStreaming}
                                            lastRowRef={lastRowRef}
                                        >
                                            <li>
                                                {hasStreamed ? item : (typingTexts[`${rowIndex}-content`] || item)}
                                            </li>
                                        </StreamingRow>
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