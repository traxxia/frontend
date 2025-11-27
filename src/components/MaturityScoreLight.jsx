import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  Users,
  Cog,
  Star,
  Zap,
  Loader,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import { useTranslation } from '@/hooks/useTranslation';

const MaturityScore = ({
  maturityData = null,
  businessName = '',
  isRegenerating = false,
  canRegenerate = true,
  onRegenerate,
  questions = [],
  userAnswers = {},
  selectedBusinessId,
  onRedirectToBrief,
  isExpanded = true,
  streamingManager,
  cardId,
  hideImproveButton = false,
  showImproveButton = true,
}) => {
  const [data, setData] = useState(maturityData);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [error, setError] = useState(null);

  const [visibleRows, setVisibleRows] = useState(0);
  const [typingTexts, setTypingTexts] = useState({});
  const streamingIntervalRef = useRef(null);
  const { t } = useTranslation();

  const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(
    streamingManager,
    cardId,
    isExpanded,
    visibleRows
  );

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.maturityScore;

    await checkMissingQuestionsAndRedirect(
      'maturityScore',
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
      setError(null);
      onRegenerate();
    }
  };

  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const isMaturityDataIncomplete = (data) => {
    if (!data) return true;

    let normalizedData;
    if (data.maturityScore) {
      normalizedData = data;
    } else if (data.maturityScoring) {
      normalizedData = { maturityScore: data.maturityScoring };
    } else if (data.dimensions || data.overallMaturity) {
      normalizedData = { maturityScore: data };
    } else {
      return true;
    }

    if (!normalizedData.maturityScore) {
      return true;
    }

    const score = normalizedData.maturityScore;
    const hasOverallMaturity = score.overallMaturity && score.overallMaturity > 0;
    const hasDimensions = score.dimensions && score.dimensions.length > 0;
    const hasMaturityLevel = score.maturityLevel && score.maturityLevel !== '';

    return !hasOverallMaturity && !hasDimensions && !hasMaturityLevel;
  };

  const calculateTotalRows = (data) => {
    if (!data || isMaturityDataIncomplete(data)) {
      return 0;
    }

    const transformedData = getTransformedData(data);
    if (!transformedData) return 0;

    let total = 0;

    if (transformedData.industryBenchmark) {
      total += 3;
    }

    if (transformedData.dimensions?.length) {
      total += transformedData.dimensions.length;

      transformedData.dimensions.forEach(dim => {
        if (dim.subDimensions?.length) {
          total += dim.subDimensions.length;
        }
      });
    }

    if (transformedData.crossScoring) {
      if (transformedData.crossScoring.correlations?.length) {
        total += transformedData.crossScoring.correlations.length;
      }
      if (transformedData.crossScoring.synergies?.length) {
        total += transformedData.crossScoring.synergies.length;
      }
    }

    if (transformedData.nextLevel) {
      total += 2;
      if (transformedData.nextLevel.investment) total += 1;
      if (transformedData.nextLevel.requirements?.length) {
        total += transformedData.nextLevel.requirements.length;
      }
    }

    return total;
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  useEffect(() => {
    if (maturityData) {
      let normalizedData;
      if (maturityData.maturityScore) {
        normalizedData = maturityData;
      } else if (maturityData.maturityScoring) {
        normalizedData = { maturityScore: maturityData.maturityScoring };
      } else if (maturityData.dimensions || maturityData.overallMaturity) {
        normalizedData = { maturityScore: maturityData };
      } else {
        normalizedData = null;
      }

      if (normalizedData) {
        setData(normalizedData);
        setHasGenerated(true);
        setError(null);
      } else {
        setData(null);
        setHasGenerated(false);
        setError('Invalid maturity score data received');
      }
    } else {
      setData(null);
      setHasGenerated(false);
    }
  }, [maturityData]);

  useEffect(() => {
    const totalRows = calculateTotalRows(data);

    if (totalRows === 0) {
      return;
    }

    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [data, cardId, streamingManager]);

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

    if (!data || isRegenerating || isMaturityDataIncomplete(data)) {
      return;
    }

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    setVisibleRows(0);
    setTypingTexts({});
    setUserHasScrolled(false);

    const totalItems = calculateTotalRows(data);
    let currentRow = 0;

    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        setVisibleRows(currentRow + 1);

        const transformedData = getTransformedData(data);
        let rowsProcessed = 0;

        if (transformedData.industryBenchmark) {
          const overviewRows = 3;
          if (currentRow < overviewRows) {
            if (currentRow === 0) {
              typeText(transformedData.overallScore.toString(), currentRow, 'overallScore', 0);
              typeText(transformedData.level, currentRow, 'level', 200);
            } else if (currentRow === 1) {
              typeText(transformedData.industryBenchmark.percentile, currentRow, 'percentile', 0);
              typeText(transformedData.industryBenchmark.comparison, currentRow, 'comparison', 200);
            } else if (currentRow === 2) {
              typeText(transformedData.industryBenchmark.average.toString(), currentRow, 'average', 0);
            }
            currentRow++;
            return;
          }
          rowsProcessed += overviewRows;
        }

        if (transformedData.dimensions?.length) {
          const dimensionIndex = currentRow - rowsProcessed;

          if (dimensionIndex >= 0 && dimensionIndex < transformedData.dimensions.length) {
            const dimension = transformedData.dimensions[dimensionIndex];
            typeText(dimension.name, currentRow, 'name', 0);
            typeText(dimension.score.toString(), currentRow, 'score', 200);
            typeText(dimension.level, currentRow, 'level', 400);
            currentRow++;
            return;
          }

          rowsProcessed += transformedData.dimensions.length;

          let subDimIndex = currentRow - rowsProcessed;
          for (const dimension of transformedData.dimensions) {
            if (dimension.subDimensions?.length) {
              if (subDimIndex < dimension.subDimensions.length) {
                const subDim = dimension.subDimensions[subDimIndex];
                typeText(dimension.name, currentRow, 'parentName', 0);
                typeText(subDim.name, currentRow, 'subName', 200);
                typeText(subDim.score.toString(), currentRow, 'subScore', 400);
                typeText(subDim.description, currentRow, 'subDescription', 600);
                currentRow++;
                return;
              }
              subDimIndex -= dimension.subDimensions.length;
              rowsProcessed += dimension.subDimensions.length;
            }
          }
        }

        if (transformedData.crossScoring) {
          if (transformedData.crossScoring.correlations?.length) {
            const corrIndex = currentRow - rowsProcessed;
            if (corrIndex >= 0 && corrIndex < transformedData.crossScoring.correlations.length) {
              const corr = transformedData.crossScoring.correlations[corrIndex];
              typeText(corr.dimension1, currentRow, 'dim1', 0);
              typeText(corr.dimension2, currentRow, 'dim2', 200);
              typeText(corr.correlation.toString(), currentRow, 'correlation', 400);
              typeText(corr.impact, currentRow, 'impact', 600);
              currentRow++;
              return;
            }
            rowsProcessed += transformedData.crossScoring.correlations.length;
          }

          if (transformedData.crossScoring.synergies?.length) {
            const synIndex = currentRow - rowsProcessed;
            if (synIndex >= 0 && synIndex < transformedData.crossScoring.synergies.length) {
              const synergy = transformedData.crossScoring.synergies[synIndex];
              typeText(synergy.combination, currentRow, 'combination', 0);
              typeText(synergy.synergyScore.toString(), currentRow, 'synergyScore', 200);
              typeText(synergy.description, currentRow, 'synDescription', 400);
              currentRow++;
              return;
            }
            rowsProcessed += transformedData.crossScoring.synergies.length;
          }
        }

        if (transformedData.nextLevel) {
          const progIndex = currentRow - rowsProcessed;
          let progRows = 2;
          if (transformedData.nextLevel.investment) progRows++;

          if (progIndex < progRows) {
            if (progIndex === 0) {
              typeText(transformedData.nextLevel.target, currentRow, 'target', 0);
            } else if (progIndex === 1) {
              typeText(transformedData.nextLevel.estimatedTimeframe, currentRow, 'timeline', 0);
            } else if (progIndex === 2 && transformedData.nextLevel.investment) {
              typeText(transformedData.nextLevel.investment, currentRow, 'investment', 0);
            }
            currentRow++;
            return;
          }

          rowsProcessed += progRows;

          if (transformedData.nextLevel.requirements?.length) {
            const reqIndex = currentRow - rowsProcessed;
            if (reqIndex >= 0 && reqIndex < transformedData.nextLevel.requirements.length) {
              const requirement = transformedData.nextLevel.requirements[reqIndex];
              typeText(requirement, currentRow, 'requirement', 0);
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
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, [cardId, data, isRegenerating, streamingManager, setUserHasScrolled]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const getTransformedData = (sourceData = data) => {
    if (!sourceData?.maturityScore) {
      return null;
    }

    const scoreData = sourceData.maturityScore;

    const transformed = {
      overallScore: scoreData.overallMaturity,
      level: scoreData.maturityLevel,
      components: {},
      dimensions: scoreData.dimensions || [],
      maturityProfile: `${scoreData.industryBenchmark?.comparison || 'Business'} maturity profile (${scoreData.industryBenchmark?.percentile}th percentile)`,
      strengths: [],
      developmentAreas: [],
      nextLevel: null,
      industryBenchmark: scoreData.industryBenchmark,
      crossScoring: scoreData.crossScoring,
      progressionPath: scoreData.progressionPath
    };

    if (scoreData.dimensions?.length) {
      scoreData.dimensions.forEach(dimension => {
        const componentKey = dimension.name.toLowerCase().replace(/\s+/g, '');
        transformed.components[componentKey] = dimension.score;

        if (dimension.score >= 4.0) {
          transformed.strengths.push(
            `Strong ${dimension.name}: Achieving ${dimension.level} level performance (${dimension.score})`
          );
        }

        if (dimension.gap && dimension.gap > 0) {
          transformed.developmentAreas.push(
            `${dimension.name}: ${dimension.gap} points above industry benchmark`
          );
        }

        dimension.subDimensions?.forEach(subDim => {
          if (subDim.score >= 4.0) {
            transformed.strengths.push(`${subDim.name}: ${subDim.description}`);
          } else if (subDim.score < 3.7) {
            transformed.developmentAreas.push(`${subDim.name}: ${subDim.description}`);
          }
        });
      });
    }

    if (scoreData.progressionPath?.length) {
      const progression = scoreData.progressionPath[0];
      transformed.nextLevel = {
        target: progression.nextLevel,
        estimatedTimeframe: progression.timeline,
        investment: progression.investment,
        requirements: progression.requirements || []
      };
    }

    return transformed;
  };

  const getScoreColor = (score) => {
    if (score >= 4.0) return '#10b981';
    if (score >= 3.5) return '#3b82f6';
    if (score >= 3.0) return '#f59e0b';
    return '#ef4444';
  };

  const getLevelColor = (level) => {
    const levelMap = {
      'Initial': '#ef4444',
      'Developing': '#f59e0b',
      'Defined': '#3b82f6',
      'Managed': '#10b981',
      'Optimized': '#8b5cf6'
    };
    return levelMap[level] || '#6b7280';
  };

  const getScoreClass = (score) => {
    if (score >= 4.0) return 'high-intensity';
    if (score >= 3.5) return 'medium-intensity';
    if (score >= 3.0) return 'low-intensity';
    return 'critical-intensity';
  };

  const getDimensionIcon = (dimensionName) => {
    const name = dimensionName.toLowerCase();
    if (name.includes('process')) return <Cog size={16} />;
    if (name.includes('technology')) return <Zap size={16} />;
    if (name.includes('customer')) return <Users size={16} />;
    if (name.includes('organizational')) return <Star size={16} />;
    return <BarChart3 size={16} />;
  };

  const renderGaugeChart = (transformedData) => (
    <div className="gauge-section">
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={getScoreColor(transformedData.overallScore)}
            strokeWidth="12"
            strokeDasharray={`${(transformedData.overallScore / 5) * 251.3} 251.3`}
            strokeLinecap="round"
          />
        </svg>
        <div className="gauge-content">
          <div className="score-number">
            {transformedData.overallScore}
            <span className="score-max"></span>
          </div>
          <div
            className="score-level"
            style={{ color: getLevelColor(transformedData.level) }}
          >
            {transformedData.level}
          </div>
          {transformedData.maturityProfile && (
            <div className="maturity-profile">{transformedData.maturityProfile}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMaturityOverview = (transformedData) => {
    if (!transformedData.industryBenchmark) return null;

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    const overviewRows = [
      { label: 'Overall Maturity Score', rowIndex: 0 },
      { label: 'Industry Percentile', rowIndex: 1 },
      { label: 'Industry Average', rowIndex: 2 }
    ];

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('overview')}>
          <h3>{t('Maturity_Overview')}</h3>
          {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.overview !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Metric')}</th>
                  <th>{t('Value')}</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                <StreamingRow
                  isVisible={visibleRows > 0}
                  isLast={visibleRows === 1 && isStreaming}
                  lastRowRef={lastRowRef}
                >
                  <td><strong>{t('Overall_Maturity_Score')}</strong></td>
                  <td>
                    {hasStreamed
                      ? transformedData.overallScore
                      : (typingTexts['0-overallScore'] || transformedData.overallScore)
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${getScoreClass(transformedData.overallScore)}`}>
                      {hasStreamed
                        ? transformedData.level
                        : (typingTexts['0-level'] || transformedData.level)
                      }
                    </span>
                  </td>
                </StreamingRow>

                <StreamingRow
                  isVisible={visibleRows > 1}
                  isLast={visibleRows === 2 && isStreaming}
                  lastRowRef={lastRowRef}
                >
                  <td><strong>{t('Industry_Percentile')}</strong></td>
                  <td>
                    {hasStreamed
                      ? transformedData.industryBenchmark.percentile
                      : (typingTexts['1-percentile'] || transformedData.industryBenchmark.percentile)
                    }
                  </td>
                  <td>
                    <span className="status-badge medium-intensity">
                      {hasStreamed
                        ? transformedData.industryBenchmark.comparison
                        : (typingTexts['1-comparison'] || transformedData.industryBenchmark.comparison)
                      }
                    </span>
                  </td>
                </StreamingRow>

                <StreamingRow
                  isVisible={visibleRows > 2}
                  isLast={visibleRows === 3 && isStreaming}
                  lastRowRef={lastRowRef}
                >
                  <td><strong>{t('Industry_Average')}</strong></td>
                  <td>
                    {hasStreamed
                      ? transformedData.industryBenchmark.average
                      : (typingTexts['2-average'] || transformedData.industryBenchmark.average)
                    }
                  </td>
                  <td>-</td>
                </StreamingRow>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderBusinessAreas = (transformedData) => {
    if (!transformedData.dimensions?.length) return null;

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    let currentRowIndex = 3; // After overview section
    const dimensionIndices = {};
    const subDimensionIndices = {};

    transformedData.dimensions.forEach((dimension, index) => {
      dimensionIndices[dimension.name] = currentRowIndex++;

      if (dimension.subDimensions?.length) {
        dimension.subDimensions.forEach((subDim, subIndex) => {
          subDimensionIndices[`${dimension.name}-${subIndex}`] = currentRowIndex++;
        });
      }
    });

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('areas')}>
          <h3>{t('Maturity_by_Business_Area')}</h3>
          {expandedSections.areas ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.areas !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Business_Area')}</th>
                  <th>{t('Score')}</th>
                  <th>{t('Level')}</th>
                  <th>{t('Industry_Benchmark')}</th>
                  <th>{t('Gap_Analysis')}</th>
                </tr>
              </thead>
              <tbody>
                {transformedData.dimensions.map((dimension, index) => {
                  const rowIndex = dimensionIndices[dimension.name];
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
                          {getDimensionIcon(dimension.name)}
                          <span>
                            {hasStreamed
                              ? dimension.name
                              : (typingTexts[`${rowIndex}-name`] || dimension.name)
                            }
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="score-badge1">
                          {hasStreamed
                            ? dimension.score
                            : (typingTexts[`${rowIndex}-score`] || dimension.score)
                          }
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getScoreClass(dimension.score)}`}>
                          {hasStreamed
                            ? dimension.level
                            : (typingTexts[`${rowIndex}-level`] || dimension.level)
                          }
                        </span>
                      </td>
                      <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.6s' }}>
                        {dimension.benchmark || 'N/A'}
                      </td>
                      <td style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.8s' }}>
                        {dimension.gap && (
                          <span className={dimension.gap > 0 ? 'benchmark-positive' : 'benchmark-negative'}>
                            {dimension.gap}
                          </span>
                        )}
                      </td>
                    </StreamingRow>
                  );
                })}
              </tbody>
            </table>

            {transformedData.dimensions.some(d => d.subDimensions?.length) && (
              <div className="subsection">
                <h4>{t('Sub-Dimension_Details')}</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Area')}</th>
                      <th>{t('Sub-Dimension')}</th>
                      <th>{t('Score')}</th>
                      <th>{t('description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformedData.dimensions.map((dimension) =>
                      dimension.subDimensions?.map((subDim, subIndex) => {
                        const rowIndex = subDimensionIndices[`${dimension.name}-${subIndex}`];
                        const isVisible = rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={`${dimension.name}-${subIndex}`}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td>
                              {hasStreamed
                                ? dimension.name
                                : (typingTexts[`${rowIndex}-parentName`] || dimension.name)
                              }
                            </td>
                            <td>
                              <strong>
                                {hasStreamed
                                  ? subDim.name
                                  : (typingTexts[`${rowIndex}-subName`] || subDim.name)
                                }
                              </strong>
                            </td>
                            <td>
                              <span className={`score-badge ${getScoreClass(subDim.score)}`}>
                                {hasStreamed
                                  ? subDim.score
                                  : (typingTexts[`${rowIndex}-subScore`] || subDim.score)
                                }
                              </span>
                            </td>
                            <td>
                              {hasStreamed
                                ? subDim.description
                                : (typingTexts[`${rowIndex}-subDescription`] || subDim.description)
                              }
                            </td>
                          </StreamingRow>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCrossScoring = (transformedData) => {
    const { crossScoring } = transformedData;
    if (!crossScoring) return null;

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    let currentRowIndex = 3; // After overview
    if (transformedData.dimensions?.length) {
      currentRowIndex += transformedData.dimensions.length;
      transformedData.dimensions.forEach(dim => {
        if (dim.subDimensions?.length) {
          currentRowIndex += dim.subDimensions.length;
        }
      });
    }

    const correlationIndices = {};
    const synergyIndices = {};

    if (crossScoring.correlations?.length) {
      crossScoring.correlations.forEach((_, index) => {
        correlationIndices[index] = currentRowIndex++;
      });
    }

    if (crossScoring.synergies?.length) {
      crossScoring.synergies.forEach((_, index) => {
        synergyIndices[index] = currentRowIndex++;
      });
    }

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('crossScoring')}>
          <h3>{t('Cross-Dimension_Analysis')}</h3>
          {expandedSections.crossScoring ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.crossScoring !== false && (
          <div className="table-container">
            {/* Correlations */}
            {crossScoring.correlations?.length > 0 && (
              <div className="subsection">
                <h4>{t('Correlations')}</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Dimension_1')}</th>
                      <th>{t('Dimension_2')}</th>
                      <th>{t('Correlation')}</th>
                      <th>{t('Impact')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossScoring.correlations.map((corr, index) => {
                      const rowIndex = correlationIndices[index];
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
                            <strong>
                              {hasStreamed
                                ? corr.dimension1
                                : (typingTexts[`${rowIndex}-dim1`] || corr.dimension1)
                              }
                            </strong>
                          </td>
                          <td>
                            <strong>
                              {hasStreamed
                                ? corr.dimension2
                                : (typingTexts[`${rowIndex}-dim2`] || corr.dimension2)
                              }
                            </strong>
                          </td>
                          <td>
                            <span className={`status-badge ${corr.correlation > 0.7 ? 'high-intensity' : 'medium-intensity'}`}>
                              {hasStreamed
                                ? corr.correlation
                                : (typingTexts[`${rowIndex}-correlation`] || corr.correlation)
                              }
                            </span>
                          </td>
                          <td>
                            {hasStreamed
                              ? corr.impact
                              : (typingTexts[`${rowIndex}-impact`] || corr.impact)
                            }
                          </td>
                        </StreamingRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {crossScoring.synergies?.length > 0 && (
              <div className="subsection">
                <h4>{t('Synergies')}</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Combination')}</th>
                      <th>{t('Synergy_Score')}</th>
                      <th>{t('description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossScoring.synergies.map((synergy, index) => {
                      const rowIndex = synergyIndices[index];
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
                            <strong>
                              {hasStreamed
                                ? synergy.combination
                                : (typingTexts[`${rowIndex}-combination`] || synergy.combination)
                              }
                            </strong>
                          </td>
                          <td>
                            <span className="score-badge1">
                              {hasStreamed
                                ? synergy.synergyScore
                                : (typingTexts[`${rowIndex}-synergyScore`] || synergy.synergyScore)
                              }
                            </span>
                          </td>
                          <td>
                            {hasStreamed
                              ? synergy.description
                              : (typingTexts[`${rowIndex}-synDescription`] || synergy.description)
                            }
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

  const renderNextLevel = (transformedData) => {
    const { nextLevel } = transformedData;
    if (!nextLevel) return null;

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    let currentRowIndex = 3; // After overview
    if (transformedData.dimensions?.length) {
      currentRowIndex += transformedData.dimensions.length;
      transformedData.dimensions.forEach(dim => {
        if (dim.subDimensions?.length) {
          currentRowIndex += dim.subDimensions.length;
        }
      });
    }
    if (transformedData.crossScoring) {
      if (transformedData.crossScoring.correlations?.length) {
        currentRowIndex += transformedData.crossScoring.correlations.length;
      }
      if (transformedData.crossScoring.synergies?.length) {
        currentRowIndex += transformedData.crossScoring.synergies.length;
      }
    }

    const progressionIndices = {
      target: currentRowIndex++,
      timeline: currentRowIndex++,
      investment: nextLevel.investment ? currentRowIndex++ : null
    };

    const requirementIndices = {};
    if (nextLevel.requirements?.length) {
      nextLevel.requirements.forEach((_, index) => {
        requirementIndices[index] = currentRowIndex++;
      });
    }

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('progression')}>
          <h3>{t('Path_to')} {nextLevel.target}</h3>
          {expandedSections.progression ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.progression !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Metric')}</th>
                  <th>{t('Value')}</th>
                </tr>
              </thead>
              <tbody>
                <StreamingRow
                  isVisible={progressionIndices.target < visibleRows}
                  isLast={progressionIndices.target === visibleRows - 1 && isStreaming}
                  lastRowRef={lastRowRef}
                >
                  <td><strong>{t('Target_Level')}</strong></td>
                  <td>
                    {hasStreamed
                      ? nextLevel.target
                      : (typingTexts[`${progressionIndices.target}-target`] || nextLevel.target)
                    }
                  </td>
                </StreamingRow>

                <StreamingRow
                  isVisible={progressionIndices.timeline < visibleRows}
                  isLast={progressionIndices.timeline === visibleRows - 1 && isStreaming}
                  lastRowRef={lastRowRef}
                >
                  <td><strong>{t('Estimated_Timeline')}</strong></td>
                  <td>
                    <span className="timeline-badge">
                      {hasStreamed
                        ? nextLevel.estimatedTimeframe
                        : (typingTexts[`${progressionIndices.timeline}-timeline`] || nextLevel.estimatedTimeframe)
                      }
                    </span>
                  </td>
                </StreamingRow>

                {nextLevel.investment && progressionIndices.investment && (
                  <StreamingRow
                    isVisible={progressionIndices.investment < visibleRows}
                    isLast={progressionIndices.investment === visibleRows - 1 && isStreaming}
                    lastRowRef={lastRowRef}
                  >
                    <td><strong>{t('Investment_Required')}</strong></td>
                    <td>
                      {hasStreamed
                        ? nextLevel.investment
                        : (typingTexts[`${progressionIndices.investment}-investment`] || nextLevel.investment)
                      }
                    </td>
                  </StreamingRow>
                )}
              </tbody>
            </table>

            {nextLevel.requirements?.length > 0 && (
              <div className="subsection">
                <h4>{t('Key_Requirements')}</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Requirement')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextLevel.requirements.map((requirement, index) => {
                      const rowIndex = requirementIndices[index];
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
                            {hasStreamed
                              ? requirement
                              : (typingTexts[`${rowIndex}-requirement`] || requirement)
                            }
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

  if (isRegenerating) {
    return (
      <div className="maturity-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating business maturity score analysis..."
              : "Generating business maturity score analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maturity-container">
        <AnalysisError
          error={error}
          onRetry={handleRetry}
          title="Business Maturity Score Analysis Error"
        />
      </div>
    );
  }

  if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
    return (
      <div className="maturity-container">
        <AnalysisError
          error="Unable to generate business maturity score analysis. Please try regenerating or check your inputs."
          onRetry={handleRetry}
          title="Analysis Generation Error"
        />
      </div>
    );
  }

  if (!maturityData || isMaturityDataIncomplete(maturityData)) {
    return (
      <div className="maturity-container">
        <AnalysisEmptyState
          analysisType="maturityScore"
          analysisDisplayName="Business Maturity Score Analysis"
          icon={Award}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showImproveButton={!hideImproveButton}
        />
      </div>
    );
  }

  if (!data?.maturityScore) {
    return (
      <div className="maturity-container">
        <AnalysisError
          error="The maturity score data received is not in the expected format. Please regenerate the analysis."
          onRetry={handleRetry}
          title="Invalid Data Structure"
        />
      </div>
    );
  }

  const transformedData = getTransformedData();

  if (!transformedData) {
    return (
      <div className="maturity-container">
        <AnalysisError
          error="Unable to process maturity score data. Please try regenerating."
          onRetry={handleRetry}
          title="Data Processing Error"
        />
      </div>
    );
  }

  return (
    <div
      className="maturity-container"
      data-analysis-type="maturityScore"
      data-analysis-name="Business Maturity Score"
      data-analysis-order="8"
    >

      <div className="dashboard-content">
        {renderGaugeChart(transformedData)}
        {renderMaturityOverview(transformedData)}
        {renderBusinessAreas(transformedData)}
        {renderCrossScoring(transformedData)}
        {renderNextLevel(transformedData)}
      </div>
    </div>
  );
};

export default MaturityScore;