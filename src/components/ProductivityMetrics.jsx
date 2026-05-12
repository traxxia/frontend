import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore, useAnalysisStore } from "../store";
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import AnalysisEmptyState from './AnalysisEmptyState';
const ProductivityMetrics = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  productivityData: propProductivityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  isExpanded = true,
  streamingManager,
  cardId,
  hideImproveButton = false
}) => {
  const token = useAuthStore(state => state.token);
  const {
    productivityData: storeProductivityData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const rawProductivityData = propProductivityData || storeProductivityData;
  const isRegenerating = propIsRegenerating || isTypeRegenerating('productivityMetrics');
  const [expandedSections, setExpandedSections] = useState({});
  const [visibleRows, setVisibleRows] = useState(0);
  const [typingTexts, setTypingTexts] = useState({});
  const streamingIntervalRef = useRef(null);
  const {
    lastRowRef,
    setUserHasScrolled
  } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);
  const data = useMemo(() => {
    if (!rawProductivityData) return null;
    let normalized;
    if (rawProductivityData.productivityMetrics) {
      normalized = rawProductivityData.productivityMetrics;
    } else if (rawProductivityData.productivity_metrics) {
      normalized = rawProductivityData.productivity_metrics;
    } else if (rawProductivityData.employeeProductivity || rawProductivityData.costStructure) {
      normalized = rawProductivityData;
    } else {
      return null;
    }
    return {
      productivityMetrics: normalized
    };
  }, [rawProductivityData]);
  const isProductivityDataIncomplete = useCallback(productivityData => {
    if (!productivityData) return true;
    let normalized;
    if (productivityData.productivityMetrics) {
      normalized = productivityData.productivityMetrics;
    } else if (productivityData.productivity_metrics) {
      normalized = productivityData.productivity_metrics;
    } else if (productivityData.employeeProductivity || productivityData.costStructure) {
      normalized = productivityData;
    } else {
      return true;
    }
    const hasEmployeeData = normalized.employeeProductivity && Object.keys(normalized.employeeProductivity).length > 0;
    const hasCostData = normalized.costStructure && Object.keys(normalized.costStructure).length > 0;
    const hasValueDrivers = normalized.valueDrivers && normalized.valueDrivers.length > 0;
    const hasImprovements = normalized.improvementOpportunities && normalized.improvementOpportunities.length > 0;
    return ![hasEmployeeData, hasCostData, hasValueDrivers, hasImprovements].some(Boolean);
  }, []);
  const calculateTotalRows = useCallback(productivityData => {
    if (!productivityData || isProductivityDataIncomplete(productivityData)) return 0;
    let normalized;
    if (productivityData.productivityMetrics) {
      normalized = productivityData.productivityMetrics;
    } else if (productivityData.productivity_metrics) {
      normalized = productivityData.productivity_metrics;
    } else if (productivityData.employeeProductivity || productivityData.costStructure) {
      normalized = productivityData;
    } else {
      return 0;
    }
    let total = 0;
    Object.keys(normalized).forEach(key => {
      const value = normalized[key];
      if (Array.isArray(value)) total += value.length;
    });
    return total;
  }, [isProductivityDataIncomplete]);
  const typeText = useCallback((text, rowIndex, field, delay = 0) => {
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
  }, []);
  useEffect(() => {
    const totalRows = calculateTotalRows(rawProductivityData);
    if (totalRows === 0) return;
    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [rawProductivityData, cardId, streamingManager, calculateTotalRows]);
  useEffect(() => {
    if (!streamingManager?.shouldStream(cardId)) return;
    if (!rawProductivityData || isRegenerating || isProductivityDataIncomplete(rawProductivityData)) return;
    let normalized;
    if (rawProductivityData.productivityMetrics) normalized = rawProductivityData.productivityMetrics;else if (rawProductivityData.productivity_metrics) normalized = rawProductivityData.productivity_metrics;else if (rawProductivityData.employeeProductivity || rawProductivityData.costStructure) normalized = rawProductivityData;else return;
    if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
    setVisibleRows(0);
    setTypingTexts({});
    setUserHasScrolled(false);
    const totalItems = calculateTotalRows(rawProductivityData);
    let currentRow = 0;
    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        setVisibleRows(currentRow + 1);
        let rowsProcessed = 0;
        Object.keys(normalized).forEach(sectionKey => {
          const sectionData = normalized[sectionKey];
          if (Array.isArray(sectionData) && sectionData.length > 0) {
            const index = currentRow - rowsProcessed;
            if (index >= 0 && index < sectionData.length) {
              const item = sectionData[index];
              if (typeof item === 'string') {
                typeText(item, currentRow, 'item', 0);
              } else if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach((key, keyIndex) => {
                  typeText(item[key], currentRow, key, keyIndex * 100);
                });
              }
            }
            if (index >= 0 && index < sectionData.length) {
              currentRow++;
              return;
            }
            rowsProcessed += sectionData.length;
          }
        });
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
  }, [cardId, rawProductivityData, isRegenerating, streamingManager, setUserHasScrolled, calculateTotalRows, isProductivityDataIncomplete, typeText]);
  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      streamingManager?.resetCard(cardId);
      await onRegenerate();
    } else {
      streamingManager?.resetCard(cardId);
      await regenerateIndividualAnalysis('productivityMetrics', questions, userAnswers, selectedBusinessId);
    }
  }, [onRegenerate, streamingManager, cardId, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);
  const toggleSection = sectionKey => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  const formatFieldName = fieldName => {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };
  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A';
    if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('costs')) return `${value}`;
    if (key.toLowerCase().includes('value') && typeof value === 'number' && value > 1000) return `${value.toLocaleString()}`;
    if (typeof value === 'number' && value > 1000) return value.toLocaleString();
    return value;
  };
  const convertObjectToChartData = obj => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj).map(key => ({
      name: formatFieldName(key),
      value: typeof obj[key] === 'number' ? obj[key] : parseFloat(obj[key]) || 0
    }));
  };
  const renderObjectChart = (obj, sectionKey, sectionTitle) => {
    if (!obj || typeof obj !== 'object') return null;
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    const chartData = convertObjectToChartData(obj);
    return <div className="section-container productivity-metrics--s1" key={sectionKey}>
        <div className="section-header productivity-metrics--s2" onClick={() => toggleSection(sectionKey)}>
          <h5>{sectionTitle}</h5>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        <div className={`section-container ${expandedSections[sectionKey] === true ? 'expanded' : 'collapsed'}`}>
          <div className="productivity-metrics--s3">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 25
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} tick={{
                fontSize: 11
              }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>;
  };
  const renderArrayTable = (array, sectionKey, sectionTitle, sectionIndices) => {
    if (!array || !Array.isArray(array) || array.length === 0) return null;
    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);
    return <div className="section-container productivity-metrics--s1" key={sectionKey}>
        <div className="section-header productivity-metrics--s2" onClick={() => toggleSection(sectionKey)}>
          <h5>{sectionTitle}</h5>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        <div className={`section-container ${expandedSections[sectionKey] === true ? 'expanded' : 'collapsed'}`}>
          <div className="table-container productivity-metrics--s4">
            <table className="data-table productivity-metrics--s5">
              <thead>
                <tr className="productivity-metrics--s6">
                  {typeof array[0] === 'string' ? <th className="productivity-metrics--s7">Item</th> : Object.keys(array[0]).map(key => <th key={key} className="productivity-metrics--s7">{formatFieldName(key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {array.map((item, index) => {
                const rowIndex = sectionIndices[index];
                const isVisible = rowIndex < visibleRows;
                return <StreamingRow key={index} isVisible={isVisible} isLast={rowIndex === visibleRows - 1 && isStreaming} lastRowRef={lastRowRef} isStreaming={isStreaming}>
                      {typeof item === 'string' ? <td className="productivity-metrics--s8">{hasStreamed ? item : typingTexts[`${rowIndex}-item`] || item}</td> : Object.keys(item).map((key, keyIndex) => <td key={key} style={{
                    opacity: isVisible ? 1 : 0,
                    transition: !isStreaming ? 'none' : `opacity 0.3s ${keyIndex * 0.1}s`
                  }} className="productivity-metrics--s8">
                            {hasStreamed ? formatValue(item[key], key) : typingTexts[`${rowIndex}-${key}`] ? formatValue(typingTexts[`${rowIndex}-${key}`], key) : formatValue(item[key], key)}
                          </td>)}
                    </StreamingRow>;
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>;
  };
  if (isRegenerating) {
    return <div className="productivity-metrics--s9">
        <div className="loading-state productivity-metrics--s10">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating productivity metrics analysis...</span>
        </div>
      </div>;
  }
  if (!data || isProductivityDataIncomplete(data.productivityMetrics)) {
    return <div className="productivity-metrics--s9">
        <AnalysisEmptyState analysisType="productivityMetrics" analysisDisplayName="Productivity and Efficiency Metrics Analysis" icon={Activity} onImproveAnswers={() => {}} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} canRegenerate={canRegenerate} userAnswers={userAnswers} minimumAnswersRequired={3} showImproveButton={false} showRegenerateButton={false} />
      </div>;
  }
  const productivityMetrics = data.productivityMetrics;
  let currentRowIndex = 0;
  const sectionRowIndices = {};
  Object.keys(productivityMetrics).forEach(sectionKey => {
    const sectionData = productivityMetrics[sectionKey];
    if (Array.isArray(sectionData) && sectionData.length > 0) {
      sectionRowIndices[sectionKey] = {};
      sectionData.forEach((_, index) => {
        sectionRowIndices[sectionKey][index] = currentRowIndex++;
      });
    }
  });
  return <div data-analysis-type="productivityMetrics" data-analysis-name="Productivity Metrics" data-analysis-order="14">
      {Object.keys(productivityMetrics).map(sectionKey => {
      const sectionData = productivityMetrics[sectionKey];
      const sectionTitle = formatFieldName(sectionKey);
      if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        return renderObjectChart(sectionData, sectionKey, sectionTitle);
      }
      if (Array.isArray(sectionData) && sectionData.length > 0) {
        return renderArrayTable(sectionData, sectionKey, sectionTitle, sectionRowIndices[sectionKey] || {});
      }
      return null;
    })}
    </div>;
};
export default ProductivityMetrics;