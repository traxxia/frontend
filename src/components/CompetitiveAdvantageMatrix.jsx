import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader, Shield, Target, Award, TrendingUp, BarChart3, Activity, ChevronDown, ChevronRight } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState({
        position: true,
        choice: true,
        differentiators: true
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
        const hasDifferentiators = advantageData.differentiators && advantageData.differentiators.length > 0;
        const hasCompetitivePosition = advantageData.competitivePosition && (advantageData.competitivePosition.overallScore || advantageData.competitivePosition.marketPosition);
        const hasCustomerChoiceReasons = advantageData.customerChoiceReasons && advantageData.customerChoiceReasons.length > 0;
        const sectionsWithData = [hasDifferentiators, hasCompetitivePosition, hasCustomerChoiceReasons].filter(Boolean).length;
        return sectionsWithData < 2;
    }, []);

    const calculateTotalRows = useCallback((advantageData) => {
        if (!advantageData || isCompetitiveAdvantageDataIncomplete(advantageData)) return 0;
        let total = 0;
        if (advantageData.competitivePosition) total += 4;
        if (advantageData.customerChoiceReasons && Array.isArray(advantageData.customerChoiceReasons)) total += advantageData.customerChoiceReasons.length;
        if (advantageData.differentiators && Array.isArray(advantageData.differentiators)) total += advantageData.differentiators.length;
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
                    rowsProcessed += 4;
                }

                if (advantage.customerChoiceReasons && Array.isArray(advantage.customerChoiceReasons)) {
                    const choiceIndex = currentRow - rowsProcessed;
                    if (choiceIndex >= 0 && choiceIndex < advantage.customerChoiceReasons.length) {
                        const reason = advantage.customerChoiceReasons[choiceIndex];
                        typeText(reason.reason, currentRow, 'reason', 0);
                        typeText(String(reason.frequency || 0), currentRow, 'frequency', 200);
                        if (reason.linkedDifferentiator) typeText(reason.linkedDifferentiator, currentRow, 'linked', 400);
                        currentRow++;
                        return;
                    }
                    rowsProcessed += advantage.customerChoiceReasons.length;
                }

                if (advantage.differentiators && Array.isArray(advantage.differentiators)) {
                    const diffIndex = currentRow - rowsProcessed;
                    if (diffIndex >= 0 && diffIndex < advantage.differentiators.length) {
                        const diff = advantage.differentiators[diffIndex];
                        typeText(diff.type, currentRow, 'type', 0);
                        typeText(diff.description, currentRow, 'description', 200);
                        typeText(`${diff.uniqueness}/10`, currentRow, 'uniqueness', 400);
                        typeText(`${diff.customerValue}/10`, currentRow, 'customerValue', 500);
                        typeText(`${diff.sustainability}/10`, currentRow, 'sustainability', 600);
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

    /*
222:     const renderScatterPlot = (differentiators) => {
223:         if (!differentiators || differentiators.length === 0) return null;
224:         const maxValue = 10;
225:         const plotSize = 400;
226:         const padding = 50;
227:         const plotArea = plotSize - (padding * 2);
228:         return (
229:             <div className="scatter-plot-container">
230:                 <h4>{t('Competitive Advantage vs Customer Value Matrix')}</h4>
231:                 <div className="plot-wrapper">
232:                     <svg width={plotSize} height={plotSize} className="scatter-plot">
233:                         {[0, 2, 4, 6, 8, 10].map(value => {
234:                             const pos = padding + (value / maxValue) * plotArea;
235:                             return (
236:                                 <g key={value}>
237:                                     <line x1={padding} y1={pos} x2={plotSize - padding} y2={pos} className="grid-line" />
238:                                     <line x1={pos} y1={padding} x2={pos} y2={plotSize - padding} className="grid-line" />
239:                                 </g>
240:                             );
241:                         })}
242:                         <line x1={padding} y1={plotSize - padding} x2={plotSize - padding} y2={plotSize - padding} className="axis-line" />
243:                         <line x1={padding} y1={padding} x2={padding} y2={plotSize - padding} className="axis-line" />
244:                         <rect x={padding + plotArea * 0.5} y={padding} width={plotArea * 0.5} height={plotArea * 0.5} className="quadrant sweet-spot" />
245:                         {differentiators.map((diff, index) => {
246:                             const x = padding + (diff.uniqueness / maxValue) * plotArea;
247:                             const y = plotSize - padding - (diff.customerValue / maxValue) * plotArea;
248:                             return (
249:                                 <g key={index}>
250:                                     <circle cx={x} cy={y} r={8 + (diff.sustainability || 5) / 2} className={`data-point ${diff.uniqueness >= 7 && diff.customerValue >= 7 ? 'sweet-spot' : diff.uniqueness >= 7 ? 'niche' : diff.customerValue >= 7 ? 'high-value' : 'improve'}`} />
251:                                     <text x={x} y={y - 15} className="data-label">{diff.type}</text>
252:                                 </g>
253:                             );
254:                         })}
255:                         <text x={plotSize / 2} y={plotSize - 10} className="axis-label">Competitive Uniqueness →</text>
256:                         <text x={15} y={plotSize / 2} className="axis-label vertical" transform={`rotate(-90, 15, ${plotSize / 2})`}>Customer Value →</text>
257:                     </svg>
258:                     <div className="plot-legend">
259:                         <div className="legend-item"><div className="legend-dot sweet-spot"></div><span className="legend-text">Sweet Spot (High Value + High Uniqueness)</span></div>
260:                         <div className="legend-item"><div className="legend-dot niche"></div><span className="legend-text">Niche Advantage</span></div>
261:                         <div className="legend-item"><div className="legend-dot high-value"></div><span className="legend-text">High Value</span></div>
262:                         <div className="legend-item"><div className="legend-dot improve"></div><span className="legend-text">Needs Improvement</span></div>
263:                     </div>
264:                 </div>
265:             </div>
266:         );
267:     };
268: 
269:     const renderSpiderChart = (differentiators) => {
270:         if (!differentiators || differentiators.length === 0) return null;
271:         const size = 300;
272:         const center = size / 2;
273:         const radius = size / 2 - 40;
274:         const numSides = differentiators.length;
275:         const getPoint = (index, value, maxValue = 10) => {
276:             const angle = (index * 2 * Math.PI / numSides) - Math.PI / 2;
277:             const distance = (value / maxValue) * radius;
278:             return { x: center + distance * Math.cos(angle), y: center + distance * Math.sin(angle) };
279:         };
280:         return (
281:             <div className="spider-chart-container">
282:                 <h4> {t('Differentiators Radar Chart')} </h4>
283:                 <div className="chart-wrapper">
284:                     <svg width={size} height={size} className="spider-chart">
285:                         {[2, 4, 6, 8, 10].map(value => (
286:                             <polygon key={value} points={differentiators.map((_, index) => { const point = getPoint(index, value); return `${point.x},${point.y}`; }).join(' ')} className="web-line" />
287:                         ))}
288:                         {differentiators.map((_, index) => { const point = getPoint(index, 10); return <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} className="radial-line" />; })}
289:                         <polygon points={differentiators.map((diff, index) => { const point = getPoint(index, diff.customerValue); return `${point.x},${point.y}`; }).join(' ')} className="performance-polygon" />
290:                         {differentiators.map((diff, index) => {
291:                             const point = getPoint(index, diff.customerValue);
292:                             return <circle key={index} cx={point.x} cy={point.y} r="4" className="radar-point" />;
293:                         })}
294:                         {differentiators.map((diff, index) => {
295:                             const labelPoint = getPoint(index, 11);
296:                             return <text key={index} x={labelPoint.x} y={labelPoint.y} className="radar-label" textAnchor="middle">{diff.type}</text>;
297:                         })}
298:                     </svg>
299:                 </div>
300:             </div>
301:         );
302:     };
303:     */

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
    const choiceIndices = {};
    const diffIndices = {};

    if (advantage.competitivePosition) {
        positionIndices.overallScore = currentRowIndex++;
        positionIndices.marketPosition = currentRowIndex++;
        positionIndices.sustainableAdvantages = currentRowIndex++;
        positionIndices.vulnerableAdvantages = currentRowIndex++;
    }
    if (advantage.customerChoiceReasons && Array.isArray(advantage.customerChoiceReasons)) {
        advantage.customerChoiceReasons.forEach((_, index) => { choiceIndices[index] = currentRowIndex++; });
    }
    if (advantage.differentiators && Array.isArray(advantage.differentiators)) {
        advantage.differentiators.forEach((_, index) => { diffIndices[index] = currentRowIndex++; });
    }

    return (
        <div className="competitive-advantage-container"
            data-analysis-type="competitiveAdvantage"
            data-analysis-name="Competitive Advantage Matrix"
            data-analysis-order="9">
            <div className="competitive-advantage-tabs">
                {[
                    { id: 'overview', label: t('Overview'), icon: Target },
                    /*
                    { id: 'matrix', label: t('Scatter Plot'), icon: BarChart3 },
                    { id: 'radar', label: t('Spider Chart'), icon: Activity },
                    { id: 'details', label: t('details'), icon: Award },
                    */
                ].map(tab => {
                    const IconComponent = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
                            <IconComponent size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="competitive-advantage-content">
                {activeTab === 'overview' && (
                    <div className="overview-content">
                        {advantage.competitivePosition && (
                            <div className="section-container">
                                <div className="section-header" onClick={() => toggleSection('position')}>
                                    <h3>{t('Market Position')}</h3>
                                    {expandedSections.position ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                {expandedSections.position && (
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
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* /*
416:                 {activeTab === 'matrix' && (
417:                     <div className="matrix-content">
418:                         {advantage.differentiators && renderScatterPlot(advantage.differentiators)}
419:                     </div>
420:                 )}
421: 
422:                 {activeTab === 'radar' && (
423:                     <div className="radar-content">
424:                         {advantage.differentiators && renderSpiderChart(advantage.differentiators)}
425:                     </div>
426:                 )}
427: 
428:                 {activeTab === 'details' && (
429:                     <div className="details-content">
430:                         {advantage.differentiators && (
431:                             <div className="section-container">
432:                                 <div className="section-header" onClick={() => toggleSection('differentiators')}>
433:                                     <h3>{t('Key Differentiators')}</h3>
434:                                     {expandedSections.differentiators ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
435:                                 </div>
436:                                 {expandedSections.differentiators && (
437:                                     <div className="table-container">
438:                                         <table className="data-table">
439:                                             <thead>
440:                                                 <tr>
441:                                                     <th>{t('Differentiator')}</th>
442:                                                     <th>{t('description')}</th>
443:                                                     <th>{t('Uniqueness')}</th>
444:                                                     <th>{t('Customer Value')}</th>
445:                                                     <th>{t('Sustainability')}</th>
446:                                                     <th>{t('Proof Points')}</th>
447:                                                 </tr>
448:                                             </thead>
449:                                             <tbody>
450:                                                 {advantage.differentiators.map((diff, index) => {
451:                                                     const rowIndex = diffIndices[index];
452:                                                     const isVisible = rowIndex < visibleRows;
453:                                                     const isLast = rowIndex === visibleRows - 1;
454:                                                     return (
455:                                                         <StreamingRow key={index} isVisible={isVisible} isLast={isLast && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
456:                                                             <td><div className="force-name">{hasStreamed ? diff.type : (typingTexts[`${rowIndex}-type`] || diff.type)}</div></td>
457:                                                             <td>{hasStreamed ? diff.description : (typingTexts[`${rowIndex}-description`] || diff.description)}</td>
458:                                                             <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.4s' }}>
459:                                                                 <span className={`score-badge ${getIntensityColor(diff.uniqueness)}`}>{hasStreamed ? `${diff.uniqueness}/10` : (typingTexts[`${rowIndex}-uniqueness`] || `${diff.uniqueness}/10`)}</span>
460:                                                             </td>
461:                                                             <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.5s' }}>
462:                                                                 <span className={`score-badge ${getIntensityColor(diff.customerValue)}`}>{hasStreamed ? `${diff.customerValue}/10` : (typingTexts[`${rowIndex}-customerValue`] || `${diff.customerValue}/10`)}</span>
463:                                                             </td>
464:                                                             <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.6s' }}>
465:                                                                 <span className={`score-badge ${getIntensityColor(diff.sustainability)}`}>{hasStreamed ? `${diff.sustainability}/10` : (typingTexts[`${rowIndex}-sustainability`] || `${diff.sustainability}/10`)}</span>
466:                                                             </td>
467:                                                             <td style={{ opacity: isVisible ? 1 : 0, transition: !isStreaming ? 'none' : 'opacity 0.3s 0.7s' }}>
468:                                                                 {diff.proofPoints && diff.proofPoints.length > 0 && (
469:                                                                     <ul className="list-items">
470:                                                                         {diff.proofPoints.map((point, idx) => (<li key={idx}>{point}</li>))}
471:                                                                     </ul>
472:                                                                 )}
473:                                                             </td>
474:                                                         </StreamingRow>
475:                                                     );
476:                                                 })}
477:                                             </tbody>
478:                                         </table>
479:                                     </div>
480:                                 )}
481:                             </div>
482:                         )}
483:                     </div>
484:                 )}
485:                 */}
            </div>
        </div>
    );
};

export default CompetitiveAdvantageMatrix;     