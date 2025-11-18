import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BarChart3, TrendingUp, Loader } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const PestelAnalysis = ({
  pestelData,
  businessName = "Your Business",
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  questions = [],
  userAnswers = {},
  selectedBusinessId,
  onRedirectToBrief,
  isExpanded = true,
  streamingManager,
  cardId
}) => {
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    factors: true,
    actions: true,
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
    const analysisConfig = ANALYSIS_TYPES.pestel;

    await checkMissingQuestionsAndRedirect(
      'pestel',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isPestelDataIncomplete = (data) => {
    if (!data) return true;
    const analysis = data.pestel_analysis || data;
    if (!analysis.factor_summary || Object.keys(analysis.factor_summary).length === 0) return true;
    const criticalFields = ['executive_summary', 'strategic_recommendations'];
    const hasNullFields = criticalFields.some(field => analysis[field] === null || analysis[field] === undefined);
    return hasNullFields;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      streamingManager.resetCard(cardId);
      onRegenerate();
    }
  };

  const calculateTotalRows = (data) => {
    if (!data || isPestelDataIncomplete(data)) {
      return 0;
    }

    const analysis = data.pestel_analysis || data;
    let total = 0;

    if (analysis.factor_summary) {
      total += Object.keys(analysis.factor_summary).length;
    }

    if (analysis.key_improvements && Array.isArray(analysis.key_improvements)) {
      total += analysis.key_improvements.length;
    }

    return total;
  };

  useEffect(() => {
    const totalRows = calculateTotalRows(pestelData);

    if (totalRows === 0) {
      return;
    }

    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [pestelData, cardId, streamingManager]);

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

    if (!pestelData || isRegenerating || isPestelDataIncomplete(pestelData)) {
      return;
    }

    const analysis = pestelData.pestel_analysis || pestelData;

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    setVisibleRows(0);
    setTypingTexts({});
    setUserHasScrolled(false);

    const totalItems = calculateTotalRows(pestelData);
    let currentRow = 0;

    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        setVisibleRows(currentRow + 1);

        let rowsProcessed = 0;

        if (analysis.factor_summary) {
          const factorEntries = Object.entries(analysis.factor_summary);
          const factorIndex = currentRow - rowsProcessed;

          if (factorIndex >= 0 && factorIndex < factorEntries.length) {
            const [factor, data] = factorEntries[factorIndex];
            typeText(factor.toUpperCase(), currentRow, 'factor', 0);
            typeText(data?.strategic_priority || 'N/A', currentRow, 'priority', 200);
            currentRow++;
            return;
          }

          rowsProcessed += factorEntries.length;
        }

        if (analysis.key_improvements && Array.isArray(analysis.key_improvements)) {
          const improvementIndex = currentRow - rowsProcessed;

          if (improvementIndex >= 0 && improvementIndex < analysis.key_improvements.length) {
            const improvement = analysis.key_improvements[improvementIndex];
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
  }, [cardId, pestelData, isRegenerating, streamingManager, setUserHasScrolled]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating PESTEL Analysis...</span>
        </div>
      </div>
    );
  }

  if (!pestelData || Array.isArray(pestelData) || isPestelDataIncomplete(pestelData)) {
    return (
      <div className="porters-container">
        <AnalysisEmptyState
          analysisType="pestel"
          analysisDisplayName="PESTEL Analysis"
          icon={BarChart3}
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

  const analysis = pestelData.pestel_analysis || pestelData;
  const factorEntries = analysis.factor_summary ? Object.entries(analysis.factor_summary) : [];

  let currentRowIndex = 0;
  const factorIndices = {};
  const improvementsIndices = {};

  if (analysis.factor_summary) {
    Object.keys(analysis.factor_summary).forEach((factor) => {
      factorIndices[factor] = currentRowIndex++;
    });
  }

  if (analysis.key_improvements && Array.isArray(analysis.key_improvements)) {
    analysis.key_improvements.forEach((_, index) => {
      improvementsIndices[index] = currentRowIndex++;
    });
  }

  const isStreaming = streamingManager?.shouldStream(cardId);
  const hasStreamed = streamingManager?.hasStreamed(cardId);

  return (
    <div
      className="porters-container pestel-container"
      data-analysis-type="pestel"
      data-analysis-name="PESTEL Analysis"
      data-analysis-order="7"
    >

      {analysis.factor_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('factors')}>
            <h3>PESTEL Factors Analysis</h3>
            {expandedSections.factors ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.factors && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Strategic Priority</th>
                    <th>Total Mentions</th>
                    <th>High Impact Count</th>
                    <th>Key Themes</th>
                  </tr>
                </thead>
                <tbody>
                  {factorEntries.map(([factor, data]) => {
                    const rowIndex = factorIndices[factor];
                    const isVisible = rowIndex < visibleRows;
                    const isLast = rowIndex === visibleRows - 1;

                    return (
                      <StreamingRow
                        key={factor}
                        isVisible={isVisible}
                        isLast={isLast && isStreaming}
                        lastRowRef={lastRowRef}
                      >
                        <td>
                          <div className="force-name">
                            <span>{hasStreamed ? factor.toUpperCase() : (typingTexts[`${rowIndex}-factor`] || factor.toUpperCase())}</span>
                          </div>
                        </td>
                        <td>
                          {hasStreamed ? (data?.strategic_priority || 'N/A') : (typingTexts[`${rowIndex}-priority`] || (data?.strategic_priority || 'N/A'))}
                        </td>
                        <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                          {data?.total_mentions || 0}
                        </td>
                        <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.5s' }}>
                          {data?.high_impact_count || 0}
                        </td>
                        <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.6s' }}>
                          <div className="forces-tags">
                            {(data?.key_themes || []).map((theme, idx) => (
                              <span key={idx} className="force-tag">{theme}</span>
                            ))}
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

      {analysis.key_improvements && Array.isArray(analysis.key_improvements) && analysis.key_improvements.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('improvements')}>
            <h3>Key Improvements</h3>
            {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.improvements && (
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  {analysis.key_improvements.map((improvement, index) => {
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

export default PestelAnalysis;