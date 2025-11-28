import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const AnalysisEmptyState = ({ analysisDisplayName, icon: Icon, onImproveAnswers, onRegenerate, isRegenerating, canRegenerate, userAnswers, minimumAnswersRequired }) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <Icon size={48} color="#999" />
    <h3>No {analysisDisplayName} Available</h3>
    <p>Please provide more answers or regenerate the analysis.</p>
    {onImproveAnswers && <button onClick={onImproveAnswers}>Improve Answers</button>}
    {canRegenerate && <button onClick={onRegenerate} disabled={isRegenerating}>Regenerate</button>}
  </div>
);

const AnalysisError = ({ error, onRetry, title }) => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#d9534f' }}>
    <h3>{title}</h3>
    <p>{error}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);

const ProductivityMetrics = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  productivityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  isExpanded = true,
  streamingManager,
  cardId,
  hideImproveButton = false,
}) => {
  const [data, setData] = useState(productivityData);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const [visibleRows, setVisibleRows] = useState(0);
  const [typingTexts, setTypingTexts] = useState({});
  const streamingIntervalRef = useRef(null);

  const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
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

  const isProductivityDataIncomplete = (data) => {
    if (!data) return true;

    let normalizedData;
    if (data.productivityMetrics) {
      normalizedData = data;
    } else if (data.employeeProductivity || data.costStructure) {
      normalizedData = { productivityMetrics: data };
    } else {
      return true;
    }

    if (!normalizedData.productivityMetrics) {
      return true;
    }

    const metrics = normalizedData.productivityMetrics;
    const hasEmployeeData = metrics.employeeProductivity && Object.keys(metrics.employeeProductivity).length > 0;
    const hasCostData = metrics.costStructure && Object.keys(metrics.costStructure).length > 0;
    const hasValueDrivers = metrics.valueDrivers && metrics.valueDrivers.length > 0;
    const hasImprovements = metrics.improvementOpportunities && metrics.improvementOpportunities.length > 0;

    const sectionsWithData = [hasEmployeeData, hasCostData, hasValueDrivers, hasImprovements].filter(Boolean).length;
    return sectionsWithData === 0;
  };

  const calculateTotalRows = (data) => {
    if (!data || isProductivityDataIncomplete(data)) {
      return 0;
    }

    let normalizedData;
    if (data.productivityMetrics) {
      normalizedData = data;
    } else if (data.employeeProductivity || data.costStructure) {
      normalizedData = { productivityMetrics: data };
    } else {
      return 0;
    }

    const metrics = normalizedData.productivityMetrics;
    let total = 0;

    Object.keys(metrics).forEach(key => {
      const value = metrics[key];
      if (Array.isArray(value)) {
        total += value.length;
      }
    });

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
    const totalRows = calculateTotalRows(productivityData);

    if (totalRows === 0) {
      return;
    }

    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [productivityData, cardId, streamingManager]);

  useEffect(() => {
    if (!streamingManager?.shouldStream(cardId)) {
      return;
    }

    if (!productivityData || isRegenerating || isProductivityDataIncomplete(productivityData)) {
      return;
    }

    let normalizedData;
    if (productivityData.productivityMetrics) {
      normalizedData = productivityData;
    } else if (productivityData.employeeProductivity || productivityData.costStructure) {
      normalizedData = { productivityMetrics: productivityData };
    } else {
      return;
    }

    const metrics = normalizedData.productivityMetrics;

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    setVisibleRows(0);
    setTypingTexts({});
    setUserHasScrolled(false);

    const totalItems = calculateTotalRows(productivityData);
    let currentRow = 0;

    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        setVisibleRows(currentRow + 1);

        let rowsProcessed = 0;

        // Process all array sections
        Object.keys(metrics).forEach(sectionKey => {
          const sectionData = metrics[sectionKey];
          
          if (Array.isArray(sectionData) && sectionData.length > 0) {
            const index = currentRow - rowsProcessed;
            
            if (index >= 0 && index < sectionData.length) {
              const item = sectionData[index];
              
              if (typeof item === 'string') {
                typeText(item, currentRow, 'item', 0);
              } else if (typeof item === 'object' && item !== null) {
                const keys = Object.keys(item);
                keys.forEach((key, keyIndex) => {
                  typeText(item[key], currentRow, key, keyIndex * 100);
                });
              }
            }
            
            if (index >= 0 && index < sectionData.length) {
              currentRow++;
              return;
            }
            
            if (currentRow >= rowsProcessed && currentRow < rowsProcessed + sectionData.length) {
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
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, [cardId, productivityData, isRegenerating, streamingManager, setUserHasScrolled]);

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
    if (productivityData) {
      let normalizedData;
      if (productivityData.productivityMetrics) {
        normalizedData = productivityData;
      } else if (productivityData.employeeProductivity || productivityData.costStructure) {
        normalizedData = { productivityMetrics: productivityData };
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
        setError('Invalid productivity metrics data received');
      }
    } else {
      setData(null);
      setHasGenerated(false);
    }
  }, [productivityData]);

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A';

    if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('costs')) {
      return `${value}`;
    }

    if (key.toLowerCase().includes('value') && typeof value === 'number' && value > 1000) {
      return `${value.toLocaleString()}`;
    }

    if (typeof value === 'number' && value > 1000) {
      return value.toLocaleString();
    }

    return value;
  };

  const convertObjectToChartData = (obj) => {
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

    return (
      <div className="section-container" key={sectionKey} style={{
        backgroundColor: 'white',
        borderRadius: '8px',  
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div className="section-header" onClick={() => toggleSection(sectionKey)} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '10px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{sectionTitle}</h3>
          {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections[sectionKey] !== false && (
          <div style={{ width: '100%'}}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderArrayTable = (array, sectionKey, sectionTitle, sectionIndices) => {
    if (!array || !Array.isArray(array) || array.length === 0) return null;

    const isStreaming = streamingManager?.shouldStream(cardId);
    const hasStreamed = streamingManager?.hasStreamed(cardId);

    if (typeof array[0] === 'string') {
      return (
        <div className="section-container" key={sectionKey} style={{
          backgroundColor: 'white',
          borderRadius: '8px',  
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div className="section-header" onClick={() => toggleSection(sectionKey)} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{sectionTitle}</h3>
            {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections[sectionKey] !== false && (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600'
                    }}>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {array.map((item, index) => {
                    const rowIndex = sectionIndices[index];
                    const isVisible = rowIndex < visibleRows;
                    const isLast = rowIndex === visibleRows - 1;

                    return (
                      <StreamingRow
                        key={index}
                        isVisible={isVisible}
                        isLast={isLast && isStreaming}
                        lastRowRef={lastRowRef}
                      >
                        <td style={{ padding: '12px' }}>
                          {hasStreamed ? item : (typingTexts[`${rowIndex}-item`] || item)}
                        </td>
                      </StreamingRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (typeof array[0] === 'object' && array[0] !== null) {
      const keys = Object.keys(array[0]);

      return (
        <div className="section-container" key={sectionKey} style={{
          backgroundColor: 'white',
          borderRadius: '8px',  
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div className="section-header" onClick={() => toggleSection(sectionKey)} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{sectionTitle}</h3>
            {expandedSections[sectionKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections[sectionKey] !== false && (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {keys.map(key => (
                      <th key={key} style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #dee2e6',
                        fontWeight: '600'
                      }}>{formatFieldName(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {array.map((item, index) => {
                    const rowIndex = sectionIndices[index];
                    const isVisible = rowIndex < visibleRows;
                    const isLast = rowIndex === visibleRows - 1;

                    return (
                      <StreamingRow
                        key={index}
                        isVisible={isVisible}
                        isLast={isLast && isStreaming}
                        lastRowRef={lastRowRef}
                      >
                        {keys.map((key, keyIndex) => (
                          <td key={key} style={{ 
                            padding: '12px',
                            opacity: isVisible ? 1 : 0,
                            transition: hasStreamed ? 'none' : `opacity 0.3s ${keyIndex * 0.1}s`
                          }}>
                            {hasStreamed ? formatValue(item[key], key) : (typingTexts[`${rowIndex}-${key}`] ? formatValue(typingTexts[`${rowIndex}-${key}`], key) : formatValue(item[key], key))}
                          </td>
                        ))}
                      </StreamingRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (isRegenerating) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating productivity metrics analysis..."
              : "Generating productivity metrics analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto'  }}>
        <AnalysisError
          error={error}
          onRetry={handleRetry}
          title="Productivity Metrics Analysis Error"
        />
      </div>
    );
  }

  if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AnalysisError
          error="Unable to generate productivity metrics analysis. Please try regenerating or check your inputs."
          onRetry={handleRetry}
          title="Analysis Generation Error"
        />
      </div>
    );
  }

  if (!productivityData || isProductivityDataIncomplete(productivityData)) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <AnalysisEmptyState
          analysisType="productivityMetrics"
          analysisDisplayName="Productivity and Efficiency Metrics Analysis"
          icon={Activity}
          onImproveAnswers={() => { }}
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

  if (!data?.productivityMetrics) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto'}}>
        <AnalysisError
          error="The productivity metrics data received is not in the expected format. Please regenerate the analysis."
          onRetry={handleRetry}
          title="Invalid Data Structure"
        />
      </div>
    );
  }

  const productivityMetrics = data.productivityMetrics;

  // Calculate row indices inline like PESTEL
  let currentRowIndex = 0;
  const sectionIndices = {};

  Object.keys(productivityMetrics).forEach(sectionKey => {
    const sectionData = productivityMetrics[sectionKey];
    
    if (Array.isArray(sectionData) && sectionData.length > 0) {
      sectionIndices[sectionKey] = {};
      sectionData.forEach((_, index) => {
        sectionIndices[sectionKey][index] = currentRowIndex++;
      });
    }
  });

  return (
    <div
      data-analysis-type="productivityMetrics"
      data-analysis-name="Productivity Metrics"
      data-analysis-order="14">

      {Object.keys(productivityMetrics).map((sectionKey) => {
        const sectionData = productivityMetrics[sectionKey];
        const sectionTitle = formatFieldName(sectionKey);

        if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
          return renderObjectChart(sectionData, sectionKey, sectionTitle);
        }

        if (Array.isArray(sectionData) && sectionData.length > 0) {
          return renderArrayTable(sectionData, sectionKey, sectionTitle, sectionIndices[sectionKey] || {});
        }

        return null;
      })}
    </div>
  );
};

export default ProductivityMetrics;