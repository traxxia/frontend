import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader, AlertTriangle, Users, DollarSign, TrendingUp, Building, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const PortersFiveForces = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  portersData = null,
  selectedBusinessId,
  onRedirectToBrief,
  isExpanded = true,
  streamingManager,
  cardId
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    forces: true,
    competitors: true,
    recommendations: true,
    monitoring: true,
    improvements: true
  });

  const [visibleRows, setVisibleRows] = useState(0);
  const [typingTexts, setTypingTexts] = useState({});
  const streamingIntervalRef = useRef(null);

  const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.porters;

    await checkMissingQuestionsAndRedirect(
      'porters',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isPortersDataIncomplete = (data) => {
    if (!data) return true;
    if (!data.five_forces_analysis || Object.keys(data.five_forces_analysis).length === 0) return true;
    const criticalFields = ['executive_summary', 'competitive_landscape'];
    const hasNullFields = criticalFields.some(field => data[field] === null || data[field] === undefined);
    return hasNullFields;
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      setError(null);
      streamingManager.resetCard(cardId);
      onRegenerate();
    } else {
      setPortersAnalysisData(null);
      setError(null);
      streamingManager.resetCard(cardId);
    }
  };

  const handleRetry = () => {
    setError(null);
    streamingManager.resetCard(cardId);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const parsePortersData = (data) => {
    if (!data) return null;
    if (data.portersAnalysis) return data.portersAnalysis;
    if (data.porter_analysis) return data.porter_analysis;
    return data;
  };

  const calculateTotalRows = (parsedData) => {
    if (!parsedData || isPortersDataIncomplete(parsedData)) {
      return 0;
    }

    let total = 0;

    if (parsedData.executive_summary) {
      if (parsedData.executive_summary.industry_attractiveness) total++;
      if (parsedData.executive_summary.overall_competitive_intensity) total++;
      if (parsedData.executive_summary.competitive_position) total++;
    }

    if (parsedData.five_forces_analysis) {
      total += Object.keys(parsedData.five_forces_analysis).length;
    }

    if (parsedData.key_improvements && Array.isArray(parsedData.key_improvements)) {
      total += parsedData.key_improvements.length;
    }

    return total;
  };

  useEffect(() => {
    const parsedData = parsePortersData(portersAnalysisData);
    const totalRows = calculateTotalRows(parsedData);

    if (totalRows === 0) {
      return;
    }

    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [portersAnalysisData, cardId, streamingManager]);

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
    const parsedData = parsePortersData(portersAnalysisData);

    if (!streamingManager?.shouldStream(cardId)) {
      return;
    }

    if (!parsedData || isRegenerating || isPortersDataIncomplete(parsedData)) {
      return;
    }

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    setVisibleRows(0);
    setTypingTexts({});
    setUserHasScrolled(false);

    const totalItems = calculateTotalRows(parsedData);
    let currentRow = 0;

    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        setVisibleRows(currentRow + 1);

        let rowsProcessed = 0;

        if (parsedData.executive_summary) {
          if (parsedData.executive_summary.industry_attractiveness) {
            if (currentRow === rowsProcessed) {
              typeText('Industry Attractiveness', currentRow, 'metric', 0);
              typeText(parsedData.executive_summary.industry_attractiveness, currentRow, 'value', 200);
            }
            rowsProcessed++;
            if (currentRow < rowsProcessed) { currentRow++; return; }
          }
          if (parsedData.executive_summary.overall_competitive_intensity) {
            if (currentRow === rowsProcessed) {
              typeText('Competitive Intensity', currentRow, 'metric', 0);
              typeText(parsedData.executive_summary.overall_competitive_intensity, currentRow, 'value', 200);
            }
            rowsProcessed++;
            if (currentRow < rowsProcessed) { currentRow++; return; }
          }
          if (parsedData.executive_summary.competitive_position) {
            if (currentRow === rowsProcessed) {
              typeText('Competitive Position', currentRow, 'metric', 0);
              typeText(parsedData.executive_summary.competitive_position, currentRow, 'value', 200);
            }
            rowsProcessed++;
            if (currentRow < rowsProcessed) { currentRow++; return; }
          }
        }

        if (parsedData.five_forces_analysis) {
          const forces = Object.entries(parsedData.five_forces_analysis);
          const forceIndex = currentRow - rowsProcessed;

          if (forceIndex >= 0 && forceIndex < forces.length) {
            const [forceKey, forceData] = forces[forceIndex];
            typeText(forceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), currentRow, 'force', 0);
            typeText(forceData.intensity || '', currentRow, 'intensity', 200);
            currentRow++;
            return;
          }

          rowsProcessed += forces.length;
        }

        if (parsedData.key_improvements && Array.isArray(parsedData.key_improvements)) {
          const improvementIndex = currentRow - rowsProcessed;

          if (improvementIndex >= 0 && improvementIndex < parsedData.key_improvements.length) {
            const improvement = parsedData.key_improvements[improvementIndex];
            typeText(improvement, currentRow, 'improvement', 0);
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
  }, [cardId, portersAnalysisData, isRegenerating, streamingManager, setUserHasScrolled]);

  useEffect(() => {
    if (portersData && portersData !== portersAnalysisData) {
      setPortersAnalysisData(portersData);
      setError(null);
      streamingManager.resetCard(cardId);
      if (onDataGenerated) {
        onDataGenerated(portersData);
      }
    }
  }, [portersData, cardId, streamingManager]);

  useEffect(() => {
    if (portersData) {
      setPortersAnalysisData(portersData);
      setError(null);
    }

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const getIntensityColor = (intensity) => {
    const level = intensity?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low') || level.includes('weak')) return 'low-intensity';
    return 'medium-intensity';
  };

  const getForceIcon = (forceName) => {
    const name = forceName?.toLowerCase() || '';
    if (name.includes('supplier')) return <Building size={16} />;
    if (name.includes('buyer') || name.includes('customer')) return <Users size={16} />;
    if (name.includes('rivalry') || name.includes('competition')) return <TrendingUp size={16} />;
    if (name.includes('substitute')) return <ArrowRight size={16} />;
    if (name.includes('threat') || name.includes('new entrant')) return <AlertTriangle size={16} />;
    return <Shield size={16} />;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating Porter's Five Forces analysis..."
              : "Generating Porter's Five Forces analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="porters-container">
        <AnalysisError
          error={error}
          onRetry={handleRetry}
          title="Porter's Five Forces Analysis Error"
        />
      </div>
    );
  }

  const parsedData = parsePortersData(portersAnalysisData);

  if (!parsedData || isPortersDataIncomplete(parsedData)) {
    return (
      <div className="porters-container">
        <AnalysisEmptyState
          analysisType="porters"
          analysisDisplayName="Porter's Five Forces Analysis"
          icon={Shield}
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
  const executiveSummaryIndices = {};
  const forcesIndices = {};
  const improvementsIndices = {};

  if (parsedData.executive_summary) {
    if (parsedData.executive_summary.industry_attractiveness) {
      executiveSummaryIndices.industry_attractiveness = currentRowIndex++;
    }
    if (parsedData.executive_summary.overall_competitive_intensity) {
      executiveSummaryIndices.overall_competitive_intensity = currentRowIndex++;
    }
    if (parsedData.executive_summary.competitive_position) {
      executiveSummaryIndices.competitive_position = currentRowIndex++;
    }
  }

  if (parsedData.five_forces_analysis) {
    Object.keys(parsedData.five_forces_analysis).forEach((forceKey) => {
      forcesIndices[forceKey] = currentRowIndex++;
    });
  }

  if (parsedData.key_improvements && Array.isArray(parsedData.key_improvements)) {
    parsedData.key_improvements.forEach((_, index) => {
      improvementsIndices[index] = currentRowIndex++;
    });
  }

  const isStreaming = streamingManager?.shouldStream(cardId);
  const hasStreamed = streamingManager?.hasStreamed(cardId);

  return (
    <div
      className="porters-container"
      data-analysis-type="porters"
      data-analysis-name="Porter's Five Forces"
      data-analysis-order="6"
    >

      {parsedData.executive_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('executive')}>
            <h3>Executive Summary</h3>
            {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.executive !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.executive_summary.industry_attractiveness && (
                    <StreamingRow
                      isVisible={executiveSummaryIndices.industry_attractiveness < visibleRows}
                      isLast={executiveSummaryIndices.industry_attractiveness === visibleRows - 1 && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td><div className="force-name">{hasStreamed ? 'Industry Attractiveness' : (typingTexts[`${executiveSummaryIndices.industry_attractiveness}-metric`] || 'Industry Attractiveness')}</div></td>
                      <td>{hasStreamed ? parsedData.executive_summary.industry_attractiveness : (typingTexts[`${executiveSummaryIndices.industry_attractiveness}-value`] || parsedData.executive_summary.industry_attractiveness)}</td>
                      <td style={{ opacity: executiveSummaryIndices.industry_attractiveness < visibleRows ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.industry_attractiveness)}`}>
                          {parsedData.executive_summary.industry_attractiveness}
                        </span>
                      </td>
                    </StreamingRow>
                  )}
                  {parsedData.executive_summary.overall_competitive_intensity && (
                    <StreamingRow
                      isVisible={executiveSummaryIndices.overall_competitive_intensity < visibleRows}
                      isLast={executiveSummaryIndices.overall_competitive_intensity === visibleRows - 1 && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td><div className="force-name">{hasStreamed ? 'Competitive Intensity' : (typingTexts[`${executiveSummaryIndices.overall_competitive_intensity}-metric`] || 'Competitive Intensity')}</div></td>
                      <td>{hasStreamed ? parsedData.executive_summary.overall_competitive_intensity : (typingTexts[`${executiveSummaryIndices.overall_competitive_intensity}-value`] || parsedData.executive_summary.overall_competitive_intensity)}</td>
                      <td style={{ opacity: executiveSummaryIndices.overall_competitive_intensity < visibleRows ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.overall_competitive_intensity)}`}>
                          {parsedData.executive_summary.overall_competitive_intensity}
                        </span>
                      </td>
                    </StreamingRow>
                  )}
                  {parsedData.executive_summary.competitive_position && (
                    <StreamingRow
                      isVisible={executiveSummaryIndices.competitive_position < visibleRows}
                      isLast={executiveSummaryIndices.competitive_position === visibleRows - 1 && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td><div className="force-name">{hasStreamed ? 'Competitive Position' : (typingTexts[`${executiveSummaryIndices.competitive_position}-metric`] || 'Competitive Position')}</div></td>
                      <td>{hasStreamed ? parsedData.executive_summary.competitive_position : (typingTexts[`${executiveSummaryIndices.competitive_position}-value`] || parsedData.executive_summary.competitive_position)}</td>
                      <td>-</td>
                    </StreamingRow>
                  )}
                </tbody>
              </table>

              {parsedData.executive_summary.key_competitive_forces?.length > 0 && (
                <div className="subsection">
                  <h4>Key Competitive Forces</h4>
                  <div className="forces-tags">
                    {parsedData.executive_summary.key_competitive_forces.map((force, index) => (
                      <span key={index} className="force-tag">{force}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {parsedData.five_forces_analysis && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('forces')}>
            <h3>Five Forces Analysis</h3>
            {expandedSections.forces ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.forces !== false && (
            <div className="table-container">
              <table className="data-table forces-table">
                <thead>
                  <tr>
                    <th>Force</th>
                    <th>Intensity</th>
                    <th>Key Factors</th>
                    <th>Additional Details</th>
                    <th>Strategic Implications</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parsedData.five_forces_analysis).map(([forceKey, forceData]) => {
                    const rowIndex = forcesIndices[forceKey];
                    const isVisible = rowIndex < visibleRows;
                    const isLast = rowIndex === visibleRows - 1;

                    return (
                      <StreamingRow
                        key={forceKey}
                        isVisible={isVisible}
                        isLast={isLast && isStreaming}
                        lastRowRef={lastRowRef}
                      >
                        <td>
                          <div className="force-name">
                            {getForceIcon(forceKey)}
                            <span>{hasStreamed ? forceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : (typingTexts[`${rowIndex}-force`] || forceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getIntensityColor(hasStreamed ? forceData.intensity : (typingTexts[`${rowIndex}-intensity`] || forceData.intensity))}`}>
                            {hasStreamed ? forceData.intensity : (typingTexts[`${rowIndex}-intensity`] || forceData.intensity)}
                          </span>
                        </td>
                        <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                          <div className="factors-cell">
                            {forceData.key_factors?.map((factor, idx) => (
                              <div key={idx} className="factor-item">
                                <strong>{factor.factor}</strong>
                                {factor.impact && (
                                  <span className={`factor-impact ${factor.impact?.toLowerCase()}`}>
                                    Impact: {factor.impact}
                                  </span>
                                )}
                                <span className="factor-desc">{factor.description}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.5s' }}>
                          <div className="additional-details">
                            {forceData.entry_barriers && (
                              <div>
                                <strong>Entry Barriers:</strong>
                                <ul>
                                  {forceData.entry_barriers.map((barrier, idx) => (
                                    <li key={idx}>{barrier}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {forceData.supplier_concentration && (
                              <div><strong>Supplier Concentration:</strong> {forceData.supplier_concentration}</div>
                            )}
                            {forceData.switching_costs && (
                              <div><strong>Switching Costs:</strong> {forceData.switching_costs}</div>
                            )}
                            {forceData.buyer_concentration && (
                              <div><strong>Buyer Concentration:</strong> {forceData.buyer_concentration}</div>
                            )}
                            {forceData.product_differentiation && (
                              <div><strong>Product Differentiation:</strong> {forceData.product_differentiation}</div>
                            )}
                            {forceData.substitute_availability && (
                              <div><strong>Substitute Availability:</strong> {forceData.substitute_availability}</div>
                            )}
                            {forceData.competitor_concentration && (
                              <div><strong>Competitor Concentration:</strong> {forceData.competitor_concentration}</div>
                            )}
                            {forceData.industry_growth && (
                              <div><strong>Industry Growth:</strong> {forceData.industry_growth}</div>
                            )}
                          </div>
                        </td>
                        <td className="implications-cell" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.6s' }}>
                          {forceData.strategic_implications}
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

      {parsedData.key_improvements && Array.isArray(parsedData.key_improvements) && parsedData.key_improvements.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('improvements')}>
            <h3>Key Improvements</h3>
            {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.improvements && (
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  {parsedData.key_improvements.map((improvement, index) => {
                    const rowIndex = improvementsIndices[index];
                    const isVisible = rowIndex < visibleRows;
                    const isLast = rowIndex === visibleRows - 1;

                    return (
                      <StreamingRow
                        key={index}
                        isVisible={isVisible}
                        isLast={isLast && isStreaming}
                        lastRowRef={lastRowRef}
                      >
                        <td>
                          <div className="force-name">
                            <TrendingUp size={16} />
                            <span>
                              {hasStreamed ? improvement : (typingTexts[`${rowIndex}-improvement`] || improvement)}
                            </span>
                          </div>
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

export default PortersFiveForces;