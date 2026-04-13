import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Loader, TrendingUp, Target, Lightbulb, AlertTriangle,
    ChevronDown, ChevronRight, Shield, Activity
} from 'lucide-react';
import { useAuthStore, useAnalysisStore } from "../store";
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import { useTranslation } from '@/hooks/useTranslation';

const CoreAdjacency = ({
    userAnswers = {},
    questions = [],
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    coreAdjacencyData: propCoreAdjacencyData = null,
    selectedBusinessId,
    onRedirectToBrief,
    isExpanded = true,
    streamingManager,
    cardId,
}) => {
    const {
        coreAdjacencyData: storeCoreAdjacencyData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis
    } = useAnalysisStore();

    const rawCoreAdjacencyData = propCoreAdjacencyData || storeCoreAdjacencyData;
    const isRegenerating = propIsRegenerating || isTypeRegenerating('coreAdjacency');

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

    const { lastRowRef, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

    const data = useMemo(() => {
        if (!rawCoreAdjacencyData) return null;
        return rawCoreAdjacencyData.coreAdjacency || 
               rawCoreAdjacencyData.core_adjacency || 
               rawCoreAdjacencyData.CoreAdjacency || 
               (rawCoreAdjacencyData.coreBusinessDefinition || rawCoreAdjacencyData.growthOpportunities ? rawCoreAdjacencyData : null);
    }, [rawCoreAdjacencyData]);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
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
    }, [selectedBusinessId, handleRedirectToBrief]);

    const handleRegenerate = useCallback(async () => {
        if (onRegenerate) {
            streamingManager?.resetCard(cardId);
            await onRegenerate();
        } else {
            streamingManager?.resetCard(cardId);
            await regenerateIndividualAnalysis('coreAdjacency', questions, userAnswers, selectedBusinessId);
        }
    }, [onRegenerate, streamingManager, cardId, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

    const isCoreAdjacencyDataIncomplete = useCallback((data) => {
        if (!data) return true;
        const normalized = data.coreAdjacency || data.core_adjacency || data.CoreAdjacency || (data.coreBusinessDefinition || data.growthOpportunities ? data : null);
        if (!normalized) return true;

        const hasCore = normalized.coreBusinessDefinition && (normalized.coreBusinessDefinition.keySegments?.length > 0 || normalized.coreBusinessDefinition.primaryCapabilities?.length > 0 || normalized.coreBusinessDefinition.profitDrivers?.length > 0);
        const hasGrowth = normalized.growthOpportunities && (normalized.growthOpportunities.withinCore?.length > 0 || normalized.growthOpportunities.adjacent?.length > 0 || normalized.growthOpportunities.nonAdjacent?.length > 0);
        const hasVectors = normalized.growthVectorCategorization && Object.values(normalized.growthVectorCategorization).some(arr => arr?.length > 0);
        return [hasCore, hasGrowth, hasVectors].filter(Boolean).length < 2;
    }, []);

    const opportunityMap = useMemo(() => {
        if (!data?.growthOpportunities) return {};
        const map = {};
        Object.values(data.growthOpportunities).forEach(list => {
            if (Array.isArray(list)) {
                list.forEach(item => {
                    if (item.id) map[item.id] = item.description || item.opportunity || item;
                });
            }
        });
        return map;
    }, [data]);

    const resolveOpportunity = useCallback((id) => {
        if (!id) return '';
        if (typeof id !== 'string') return String(id);
        return opportunityMap[id] || id;
    }, [opportunityMap]);

    const calculateTotalRows = useCallback((data) => {
        if (!data || isCoreAdjacencyDataIncomplete(data)) return 0;
        const normalized = data.coreAdjacency || data.core_adjacency || data.CoreAdjacency || (data.coreBusinessDefinition || data.growthOpportunities ? data : null);
        if (!normalized) return 0;

        let total = 0;
        if (normalized.coreBusinessDefinition) {
            ['keySegments', 'primaryCapabilities', 'profitDrivers'].forEach(key => {
                if (Array.isArray(normalized.coreBusinessDefinition[key])) total += normalized.coreBusinessDefinition[key].length;
            });
        }
        if (normalized.growthOpportunities) {
            ['withinCore', 'adjacent', 'nonAdjacent'].forEach(key => {
                if (Array.isArray(normalized.growthOpportunities[key])) total += normalized.growthOpportunities[key].length;
            });
        }
        if (normalized.growthVectorCategorization) {
            Object.values(normalized.growthVectorCategorization).forEach(arr => {
                if (Array.isArray(arr)) total += arr.length;
            });
        }
        
        if (normalized.missingInformation) {
            if (Array.isArray(normalized.missingInformation)) {
                total += normalized.missingInformation.length;
            } else if (typeof normalized.missingInformation === 'object') {
                Object.values(normalized.missingInformation).forEach(arr => {
                    if (Array.isArray(arr)) total += arr.length;
                });
            }
        }
        
        if (Array.isArray(normalized.recommendedNextSteps)) total += normalized.recommendedNextSteps.length;
        return total;
    }, [isCoreAdjacencyDataIncomplete]);

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
        const totalRows = calculateTotalRows(rawCoreAdjacencyData);
        if (totalRows === 0) return;
        if (!streamingManager?.shouldStream(cardId)) {
            setVisibleRows(totalRows);
        }
    }, [rawCoreAdjacencyData, cardId, streamingManager, calculateTotalRows]);

    useEffect(() => {
        if (!streamingManager?.shouldStream(cardId)) return;
        if (!rawCoreAdjacencyData || isRegenerating || isCoreAdjacencyDataIncomplete(rawCoreAdjacencyData)) return;

        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
        setVisibleRows(0);
        setTypingTexts({});
        setUserHasScrolled(false);

        const totalItems = calculateTotalRows(rawCoreAdjacencyData);
        let currentRow = 0;

        streamingIntervalRef.current = setInterval(() => {
            if (currentRow < totalItems) {
                setVisibleRows(currentRow + 1);
                let rowsProcessed = 0;
                const normalized = rawCoreAdjacencyData.coreAdjacency || rawCoreAdjacencyData.core_adjacency || rawCoreAdjacencyData.CoreAdjacency || (rawCoreAdjacencyData.coreBusinessDefinition || rawCoreAdjacencyData.growthOpportunities ? rawCoreAdjacencyData : null);
                if (!normalized) return;

                if (normalized.coreBusinessDefinition) {
                    const cbd = normalized.coreBusinessDefinition;
                    for (const key of ['keySegments', 'primaryCapabilities', 'profitDrivers']) {
                        if (Array.isArray(cbd[key]) && cbd[key].length > 0) {
                            const index = currentRow - rowsProcessed;
                            if (index >= 0 && index < cbd[key].length) {
                                typeText(cbd[key][index], currentRow, 'content', 0);
                                currentRow++;
                                return;
                            }
                            rowsProcessed += cbd[key].length;
                        }
                    }
                }

                if (normalized.growthOpportunities) {
                    const go = normalized.growthOpportunities;
                    for (const key of ['withinCore', 'adjacent', 'nonAdjacent']) {
                        if (Array.isArray(go[key]) && go[key].length > 0) {
                            const index = currentRow - rowsProcessed;
                            if (index >= 0 && index < go[key].length) {
                                const item = go[key][index];
                                typeText(item.opportunity || item.description || item, currentRow, 'opportunity', 0);
                                if (item.rationale) typeText(item.rationale, currentRow, 'rationale', 200);
                                currentRow++;
                                return;
                            }
                            rowsProcessed += go[key].length;
                        }
                    }
                }

                if (normalized.growthVectorCategorization) {
                    const gvc = normalized.growthVectorCategorization;
                    const allVectors = Object.entries(gvc).flatMap(([key, items]) => 
                        (Array.isArray(items) ? items : []).map(item => 
                            typeof item === 'string' 
                                ? { vector: item, category: key } 
                                : { ...item, category: key }
                        )
                    );
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < allVectors.length) {
                        const item = allVectors[index];
                        const vecInput = item.vector || item.opportunity || (typeof item === 'string' ? item : '');
                        const resolvedVec = resolveOpportunity(vecInput);
                        typeText(resolvedVec, currentRow, 'vector', 0);
                        if (item.description) typeText(item.description, currentRow, 'description', 200);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += allVectors.length;
                }

                if (normalized.missingInformation) {
                    const mi = normalized.missingInformation;
                    if (Array.isArray(mi)) {
                        const index = currentRow - rowsProcessed;
                        if (index >= 0 && index < mi.length) {
                            typeText(mi[index], currentRow, 'content', 0);
                            currentRow++;
                            return;
                        }
                        rowsProcessed += mi.length;
                    } else if (typeof mi === 'object') {
                        const categories = Object.keys(mi);
                        for (const cat of categories) {
                            if (Array.isArray(mi[cat]) && mi[cat].length > 0) {
                                const index = currentRow - rowsProcessed;
                                if (index >= 0 && index < mi[cat].length) {
                                    typeText(mi[cat][index], currentRow, 'content', 0);
                                    currentRow++;
                                    return;
                                }
                                rowsProcessed += mi[cat].length;
                            }
                        }
                    }
                }

                if (Array.isArray(normalized.recommendedNextSteps) && normalized.recommendedNextSteps.length > 0) {
                    const index = currentRow - rowsProcessed;
                    if (index >= 0 && index < normalized.recommendedNextSteps.length) {
                        typeText(normalized.recommendedNextSteps[index], currentRow, 'content', 0);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += normalized.recommendedNextSteps.length;
                }
                
                currentRow++;
            } else {
                clearInterval(streamingIntervalRef.current);
                setVisibleRows(totalItems);
                streamingManager?.stopStreaming(cardId);
                setUserHasScrolled(false);
            }
        }, STREAMING_CONFIG.ROW_INTERVAL);

        return () => { if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current); };
    }, [cardId, rawCoreAdjacencyData, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isCoreAdjacencyDataIncomplete, typeText, resolveOpportunity]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const formatLabel = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    };

    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating Core vs. Adjacency Analysis...</span>
                </div>
            </div>
        );
    }

    if (!data || isCoreAdjacencyDataIncomplete(rawCoreAdjacencyData)) {
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
    const indices = {
        keySegments: [], primaryCapabilities: [], profitDrivers: [],
        withinCore: [], adjacent: [], nonAdjacent: [],
        vectors: {}, missingInfo: [], nextSteps: []
    };

    if (data.coreBusinessDefinition) {
        ['keySegments', 'primaryCapabilities', 'profitDrivers'].forEach(key => {
            if (Array.isArray(data.coreBusinessDefinition[key]))
                data.coreBusinessDefinition[key].forEach(() => indices[key].push(currentRowIndex++));
        });
    }
    if (data.growthOpportunities) {
        ['withinCore', 'adjacent', 'nonAdjacent'].forEach(key => {
            if (Array.isArray(data.growthOpportunities[key]))
                data.growthOpportunities[key].forEach(() => indices[key].push(currentRowIndex++));
        });
    }
    if (data.growthVectorCategorization) {
        Object.entries(data.growthVectorCategorization).forEach(([cat, items]) => {
            if (Array.isArray(items)) {
                indices.vectors[cat] = [];
                items.forEach(() => indices.vectors[cat].push(currentRowIndex++));
            }
        });
    }

    if (data.missingInformation) {
        if (Array.isArray(data.missingInformation)) {
            data.missingInformation.forEach(() => indices.missingInfo.push(currentRowIndex++));
        } else if (typeof data.missingInformation === 'object') {
            Object.entries(data.missingInformation).forEach(([cat, items]) => {
                if (Array.isArray(items)) {
                    indices.missingInfo.push(...items.map(() => currentRowIndex++));
                }
            });
        }
    }
    
    if (Array.isArray(data.recommendedNextSteps)) data.recommendedNextSteps.forEach(() => indices.nextSteps.push(currentRowIndex++));

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    const getBadgeClass = (value) => {
        const val = value?.toLowerCase();
        if (['high', 'large'].includes(val)) return 'priority-badge high';
        if (['medium'].includes(val)) return 'priority-badge medium';
        if (['low', 'small'].includes(val)) return 'priority-badge low';
        return 'priority-badge';
    };

    return (
        <div className="porters-container full-swot-container" data-analysis-type="coreAdjacency" data-analysis-name="Core vs. Adjacency" data-analysis-order="10">
            {data.coreBusinessDefinition && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('coreBusinessDefinition')}>
                        <h5><Shield size={20} style={{ marginRight: '8px' }} />{t('Core_Business_Definition')}</h5>
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
                                    {[
                                        { key: 'keySegments', label: 'Key_Segments' },
                                        { key: 'primaryCapabilities', label: 'Primary_Capabilities' },
                                        { key: 'profitDrivers', label: 'Profit_Drivers' }
                                    ].map(conf => (
                                        data.coreBusinessDefinition[conf.key]?.length > 0 && (
                                            <tr key={conf.key}>
                                                <td style={{ width: '30%' }}><span className="status-badge high-intensity">{t(conf.label)}</span></td>
                                                <td>
                                                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                        {data.coreBusinessDefinition[conf.key].map((item, idx) => {
                                                            const rIdx = indices[conf.key][idx];
                                                            return (
                                                                <li key={idx} ref={rIdx === visibleRows - 1 && isStreaming ? lastRowRef : null} style={{ opacity: rIdx < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}>
                                                                    {hasStreamed ? item : (typingTexts[`${rIdx}-content`] || item)}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {data.growthOpportunities && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthOpportunities')}>
                        <h5><TrendingUp size={20} style={{ marginRight: '8px' }} />{t('Growth_Opportunities')}</h5>
                        {expandedSections.growthOpportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedSections.growthOpportunities && (
                        <div className="table-container">
                            {[
                                { key: 'withinCore', label: 'Within_Core' },
                                { key: 'adjacent', label: 'Adjacent' },
                                { key: 'nonAdjacent', label: 'Non-Adjacent' }
                            ].map(conf => (
                                data.growthOpportunities[conf.key]?.length > 0 && (
                                    <React.Fragment key={conf.key}>
                                        <h6 style={{ margin: '1rem 0 0.5rem 0', color: '#2c5282' }}>{t(conf.label)}</h6>
                                        <table className="data-table">
                                            <tbody>
                                                {data.growthOpportunities[conf.key].map((item, idx) => {
                                                    const rIdx = indices[conf.key][idx];
                                                    const opp = typeof item === 'string' ? item : (item.opportunity || item.description || '');
                                                    const rat = typeof item === 'object' ? item.rationale : '';
                                                    return (
                                                        <StreamingRow key={idx} isVisible={rIdx < visibleRows} isLast={rIdx === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                            <td>
                                                                <div style={{ marginBottom: '0.5rem' }}>{hasStreamed ? opp : (typingTexts[`${rIdx}-opportunity`] || opp)}</div>
                                                                {typeof item === 'object' && (
                                                                    <div className="item-meta" style={{ marginTop: '0.5rem' }}>
                                                                        {item.proximityToCore && <span className={`${getBadgeClass(item.proximityToCore)}`}>{t('Proximity')}: {item.proximityToCore}</span>}
                                                                        {item.profitPoolSize && <span className={`${getBadgeClass(item.profitPoolSize)}`}>{t('Profit_Pool')}: {item.profitPoolSize}</span>}
                                                                        {item.competitiveness && <span className={`${getBadgeClass(item.competitiveness)}`}>{t('Competitiveness')}: {item.competitiveness}</span>}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {rat && <td style={{ opacity: rIdx < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.2s' }}>{hasStreamed ? rat : (typingTexts[`${rIdx}-rationale`] || rat)}</td>}
                                                        </StreamingRow>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </React.Fragment>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}

            {data.growthVectorCategorization && Object.keys(data.growthVectorCategorization).length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthVectorCategorization')}>
                        <h5><Target size={20} style={{ marginRight: '8px' }} />{t('Growth_Vector_Categorization')}</h5>
                        {expandedSections.growthVectorCategorization ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    {expandedSections.growthVectorCategorization && (
                        <div className="table-container">
                            <table className="data-table">
                                <tbody>
                                    {Object.entries(data.growthVectorCategorization).map(([cat, items]) => {
                                        if (!items?.length) return null;
                                        return (
                                            <tr key={cat}>
                                                <td style={{ width: '30%' }}><span className="status-badge high-intensity">{formatLabel(cat)}</span></td>
                                                <td>
                                                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                        {items.map((item, idx) => {
                                                            const rIdx = indices.vectors[cat][idx];
                                                            const vec = typeof item === 'string' ? item : item.vector || '';
                                                            const desc = typeof item === 'object' ? item.description : '';
                                                            return (
                                                                <li key={idx} ref={rIdx === visibleRows - 1 && isStreaming ? lastRowRef : null} style={{ opacity: rIdx < visibleRows ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s' }}>
                                                                    <strong>{hasStreamed ? resolveOpportunity(vec) : (typingTexts[`${rIdx}-vector`] || resolveOpportunity(vec))}</strong>
                                                                    {desc && (
                                                                        <span style={{ display: 'block', fontSize: '0.9em', color: '#6b7280', marginTop: '2px' }}>
                                                                            {hasStreamed ? desc : (typingTexts[`${rIdx}-description`] || desc)}
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {[
                { key: 'missingInformation', label: 'Missing_Information', icon: AlertTriangle, iKey: 'missingInfo' },
                { key: 'recommendedNextSteps', label: 'Recommended_Next_Steps', icon: Lightbulb, iKey: 'nextSteps' }
            ].map(conf => (
                (data[conf.key] && (Array.isArray(data[conf.key]) ? data[conf.key].length > 0 : Object.values(data[conf.key]).some(arr => arr?.length > 0))) && (
                    <div className="section-container" key={conf.key}>
                        <div className="section-header" onClick={() => toggleSection(conf.key)}>
                            <h5><conf.icon size={20} style={{ marginRight: '8px' }} />{t(conf.label)}</h5>
                            {expandedSections[conf.key] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        {expandedSections[conf.key] && (
                            <div className="table-container">
                                <table className="data-table">
                                    <tbody>
                                        {(() => {
                                            const items = [];
                                            if (Array.isArray(data[conf.key])) {
                                                data[conf.key].forEach((item, idx) => {
                                                    const rIdx = indices[conf.iKey][idx];
                                                    items.push(
                                                        <StreamingRow key={idx} isVisible={rIdx < visibleRows} isLast={rIdx === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                            <td>{hasStreamed ? item : (typingTexts[`${rIdx}-content`] || item)}</td>
                                                        </StreamingRow>
                                                    );
                                                });
                                            } else if (typeof data[conf.key] === 'object') {
                                                let offset = 0;
                                                Object.entries(data[conf.key]).forEach(([cat, catItems]) => {
                                                    if (Array.isArray(catItems)) {
                                                        catItems.forEach((item, idx) => {
                                                            const rIdx = indices[conf.iKey][offset + idx];
                                                            items.push(
                                                                <StreamingRow key={`${cat}-${idx}`} isVisible={rIdx < visibleRows} isLast={rIdx === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                                                                    <td><strong>{formatLabel(cat)}:</strong> {hasStreamed ? item : (typingTexts[`${rIdx}-content`] || item)}</td>
                                                                </StreamingRow>
                                                            );
                                                        });
                                                        offset += catItems.length;
                                                    }
                                                });
                                            }
                                            return items;
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            ))}
        </div>
    );
};

export default CoreAdjacency;