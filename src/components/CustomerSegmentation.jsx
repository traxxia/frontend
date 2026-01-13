import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, Star, Calendar, Filter, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import AnalysisError from './AnalysisError';

const CustomerSegmentation = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  customerSegmentationData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [segmentationData, setSegmentationData] = useState(customerSegmentationData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const SEGMENT_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.customerSegmentation;

    await checkMissingQuestionsAndRedirect(
      'customerSegmentation',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isSegmentationDataIncomplete = (data) => {
    if (!data) return true;

    if (!data.segments || data.segments.length === 0) return true;
    const criticalFields = ['totalCustomers', 'segmentationCriteria'];
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
      onRegenerate();
    } else {
      setSegmentationData(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (customerSegmentationData && customerSegmentationData !== segmentationData) {
      setSegmentationData(customerSegmentationData);
      if (onDataGenerated) {
        onDataGenerated(customerSegmentationData);
      }
    }
  }, [customerSegmentationData]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (customerSegmentationData) {
      setSegmentationData(customerSegmentationData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const createPieChartData = () => {
    if (!segmentationData?.segments) return { segments: [], total: 0 };

    let runningTotal = 0;
    const processedSegments = segmentationData.segments.map((segment, index) => {
      const startAngle = runningTotal;
      runningTotal += segment.percentage;

      const midAngle = ((startAngle + runningTotal) / 2 / 100) * 360;
      const labelRadius = 55;

      const labelX = 100 + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
      const labelY = 100 + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);

      return {
        ...segment,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        startAngle,
        endAngle: runningTotal,
        offset: runningTotal - (segment.percentage / 2),
        labelX,
        labelY,
        midAngle
      };
    });

    return { segments: processedSegments, total: runningTotal };
  };

  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const preparePurchaseCriteriaData = () => {
    if (!segmentationData?.purchaseCriteriaRatings) return [];

    return Object.entries(segmentationData.purchaseCriteriaRatings).map(([criteria, rating]) => ({
      criteria: criteria.charAt(0).toUpperCase() + criteria.slice(1).replace(/([A-Z])/g, ' $1'),
      rating: rating,
      percentage: (rating / 10) * 100
    }));
  };

  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const splitTextIntoLines = (text, maxCharsPerLine = 10) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxCharsPerLine));
          currentLine = word.substring(maxCharsPerLine);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="customer-segmentation">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating customer segmentation analysis...")
              : t("Generating customer segmentation analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisError
          error={error}
          onRetry={handleRetry}
          title="Customer Segmentation Analysis Error"
        />
      </div>
    );
  }

  if (!segmentationData || isSegmentationDataIncomplete(segmentationData)) {
    return (
      <div className="customer-segmentation">
        <AnalysisEmptyState
          analysisType="customerSegmentation"
          analysisDisplayName="Customer Segmentation Analysis"
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

  const pieData = createPieChartData();
  const purchaseCriteriaData = preparePurchaseCriteriaData();

  return (
    <div className="customer-segmentation" data-analysis-type="customerSegmentation"
      data-analysis-name="Customer Segmentation"
      data-analysis-order="9">
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('summary')}>
          <h3>Segmentation Overview</h3>
          {expandedSections.summary ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.summary !== false && (
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
                <tr>
                  <td><strong>Total Segments</strong></td>
                  <td>{segmentationData.segments?.length || 0}</td>
                  <td>
                    <span className="status-badge medium-intensity">
                      {segmentationData.segments?.length || 0} Segments
                    </span>
                  </td>
                </tr>
                {segmentationData.loyaltyScore && (
                  <tr>
                    <td><strong>Loyalty Score</strong></td>
                    <td>{segmentationData.loyaltyScore}</td>
                    <td>
                      <span className="score-badge">{segmentationData.loyaltyScore}/10</span>
                    </td>
                  </tr>
                )}
                {segmentationData.totalCustomers && (
                  <tr>
                    <td><strong>Total Customers</strong></td>
                    <td>{segmentationData.totalCustomers.toLocaleString()}</td>
                    <td>-</td>
                  </tr>
                )}
                {segmentationData.segmentationCriteria && (
                  <tr>
                    <td><strong>Segmentation Criteria</strong></td>
                    <td>{segmentationData.segmentationCriteria}</td>
                    <td>-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('distribution')}>
          <h3>Customer Distribution</h3>
          {expandedSections.distribution ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.distribution !== false && (
          <div className="cs-chart-container">
            <div className="pie-chart-wrapper enhanced">
              <div className="pie-chart-section">
                <svg className="pie-chart" viewBox="0 0 200 200">
                  {pieData.segments.map((segment, index) => {
                    const startAngle = (segment.startAngle / 100) * 360;
                    const endAngle = (segment.endAngle / 100) * 360;
                    const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

                    const startX = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const startY = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const endX = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const endY = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);

                    const pathData = [
                      "M", 100, 100,
                      "L", startX, startY,
                      "A", 80, 80, 0, largeArcFlag, 1, endX, endY,
                      "Z"
                    ].join(" ");

                    const textColor = getContrastColor(segment.color);
                    const shouldShowLabel = segment.percentage >= 5;

                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={segment.color}
                          stroke="#fff"
                          strokeWidth="2"
                          className="pie-segment"
                        />

                        {shouldShowLabel && (
                          <g>
                            {(() => {
                              const nameLines = splitTextIntoLines(segment.name, segment.percentage > 20 ? 12 : 8);
                              const totalLines = nameLines.length;
                              const lineHeight = 10;
                              const startY = segment.labelY - (totalLines * lineHeight / 2) - 2;

                              return (
                                <>
                                  {nameLines.map((line, lineIndex) => (
                                    <text
                                      key={lineIndex}
                                      x={segment.labelX}
                                      y={startY + (lineIndex * lineHeight)}
                                      textAnchor="middle"
                                      fill={textColor}
                                      fontSize={segment.percentage > 15 ? "9" : "8"}
                                      fontWeight="600"
                                      className="pie-segment-label"
                                    >
                                      {line}
                                    </text>
                                  ))}

                                  <text
                                    x={segment.labelX}
                                    y={startY + (totalLines * lineHeight) + 6}
                                    textAnchor="middle"
                                    fill={textColor}
                                    fontSize={segment.percentage > 15 ? "10" : "9"}
                                    fontWeight="700"
                                    className="pie-segment-percentage"
                                  >
                                    {segment.percentage}%
                                  </text>
                                </>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                    );
                  })}

                  <circle cx="100" cy="100" r="30" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                  <text x="100" y="95" textAnchor="middle" className="pie-center-text">Customer</text>
                  <text x="100" y="110" textAnchor="middle" className="pie-center-text">Segments</text>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection('segments')}>
          <h3>Segment Details</h3>
          {expandedSections.segments ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.segments !== false && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Percentage</th>
                  <th>Primary Need</th>
                  <th>Behavior</th>
                </tr>
              </thead>
              <tbody>
                {pieData.segments.map((segment, index) => (
                  <tr key={index}>
                    <td>
                      <div className="force-name">
                        <div
                          className="pie-legend-color"
                          style={{ backgroundColor: segment.color, width: '16px', height: '16px', borderRadius: '50%' }}
                        ></div>
                        <span><strong>{segment.name}</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge medium-intensity">
                        {segment.percentage}%
                      </span>
                    </td>
                    <td>
                      {segment.characteristics?.primaryNeed || 'N/A'}
                    </td>
                    <td>
                      {segment.characteristics?.behavior || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {purchaseCriteriaData.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('criteria')}>
            <h3>Purchase Criteria Ratings</h3>
            {expandedSections.criteria ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.criteria !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Criteria</th>
                    <th>Rating</th>
                    <th>Importance</th>
                    <th>Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseCriteriaData.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.criteria}</strong></td>
                      <td>
                        <span className="score-badge">{item.rating}/10</span>
                      </td>
                      <td>
                        <span className={`status-badge ${item.rating >= 8 ? 'high-intensity' :
                            item.rating >= 6 ? 'medium-intensity' :
                              'low-intensity'
                          }`}>
                          {item.rating >= 8 ? 'High' : item.rating >= 6 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td>
                        <div className="bar-container" style={{ width: '100px', height: '20px' }}>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${item.percentage}%`,
                              height: '100%',
                              backgroundColor: item.rating >= 8 ? '#10B981' : item.rating >= 6 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSegmentation;