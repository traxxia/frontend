import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart3, TrendingUp, Layers, Loader, Zap, Grid3x3 } from 'lucide-react'; 
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ChannelHeatmap = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  channelHeatmapData: propChannelHeatmapData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    channelHeatmapData: storeChannelHeatmapData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('channelHeatmap');

  // Normalize data from store or props
  const heatmapData = useMemo(() => {
    const rawData = propChannelHeatmapData || storeChannelHeatmapData;
    if (!rawData) return null;
    
    // Normalize structure
    if (rawData.channels && rawData.products && rawData.matrix) return rawData;
    
    return null;
  }, [propChannelHeatmapData, storeChannelHeatmapData]);

  const [selectedCell, setSelectedCell] = useState(null); 
  const [error, setError] = useState(null);

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.channelHeatmap || {
      displayName: 'Channel Heatmap Analysis',
      customMessage: 'Answer more questions to unlock detailed channel heatmap analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'channelHeatmap',  
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
      try {
        setError(null);
        await onRegenerate();
      } catch (err) {
        setError(err.message || 'Failed to regenerate analysis');
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis('channelHeatmap', questions, userAnswers, selectedBusinessId);
      } catch (err) {
        setError(err.message || 'Failed to generate analysis');
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

  const isHeatmapDataIncomplete = useCallback((data) => {
    if (!data) return true; 
    if (!data.products || data.products.length === 0) return true;
    if (!data.channels || data.channels.length === 0) return true;
    if (!data.matrix || data.matrix.length === 0) return true; 
    return !data.legend;
  }, []); 

  const getMatrixValue = useCallback((product, channel) => {
    if (!heatmapData?.matrix) return null;
    return heatmapData.matrix.find(item =>
      item.product === product && item.channel === channel
    );
  }, [heatmapData]);
 
  const getHeatmapColor = useCallback((value) => {
    if (!value || !heatmapData?.legend) return '#f3f4f6';

    const intensity = value / 100; 
    const { colorRange } = heatmapData.legend; 
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const lowColor = hexToRgb(colorRange.low);
    const highColor = hexToRgb(colorRange.high);

    if (!lowColor || !highColor) return colorRange.low; 
    const r = Math.round(lowColor.r + (highColor.r - lowColor.r) * intensity);
    const g = Math.round(lowColor.g + (highColor.g - lowColor.g) * intensity);
    const b = Math.round(lowColor.b + (highColor.b - lowColor.b) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }, [heatmapData]);
 
  const getChannelTotal = useCallback((channel) => {
    if (!heatmapData?.matrix) return 0;
    return heatmapData.matrix
      .filter(item => item.channel === channel)
      .reduce((sum, item) => sum + item.value, 0);
  }, [heatmapData]);
 
  const getProductTotal = useCallback((product) => {
    if (!heatmapData?.matrix) return 0;
    return heatmapData.matrix
      .filter(item => item.product === product)
      .reduce((sum, item) => sum + item.value, 0);
  }, [heatmapData]);
 
  const topPerformers = useMemo(() => {
    if (!heatmapData?.matrix) return [];
    return [...heatmapData.matrix]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [heatmapData]);

  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating channel heatmap analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <AnalysisError 
          error={error}
          onRetry={handleRegenerate}
          title="Channel Heatmap Analysis Error"
        />
      );
    } 

    if (!heatmapData || isHeatmapDataIncomplete(heatmapData)) {
      return (
        <AnalysisEmptyState
          analysisType="channelHeatmap"
          analysisDisplayName="Channel Heatmap Analysis"
          icon={Grid3x3}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        /> 
      );
    }

    return (
      <>
        <div className="ch-metrics">
          <div className="ch-metric-card ch-metric-blue">
            <div className="ch-metric-header">
              <Layers size={20} />
              <span>Products</span>
            </div>
            <p className="ch-metric-value">{heatmapData.products?.length || 0}</p>
          </div>

          <div className="ch-metric-card ch-metric-green">
            <div className="ch-metric-header">
              <BarChart3 size={20} />
              <span>Channels</span>
            </div>
            <p className="ch-metric-value">{heatmapData.channels?.length || 0}</p>
          </div>

          <div className="ch-metric-card ch-metric-purple">
            <div className="ch-metric-header">
              <Zap size={20} />
              <span>Top Performer</span>
            </div>
            <p className="ch-metric-value">
              {topPerformers.length > 0 ? `${topPerformers[0].value}%` : 'N/A'}
            </p>
          </div>
        </div> 

        <div className="ch-heatmap-container">
          <div className="ch-heatmap-scroll">
            <div className="ch-heatmap-header-section">
              <h3 className="ch-section-title">Performance Heatmap</h3> 
              {heatmapData.legend && (
                <div className="ch-legend-gradient">
                  <div
                    className="ch-gradient-bar"
                    style={{
                      background: `linear-gradient(90deg, ${heatmapData.legend.colorRange.low}, ${heatmapData.legend.colorRange.high})`
                    }}
                  ></div>
                  <div className="ch-gradient-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            </div>

            <div className="ch-heatmap-wrapper">
              <div className="ch-heatmap"> 
                <div className="ch-heatmap-header">
                  <div className="ch-cell ch-cell-corner"></div>
                  {heatmapData.channels?.map((channel, index) => (
                    <div key={index} className="ch-cell ch-cell-header ch-channel-header">
                      <span className="ch-channel-name">{channel}</span>
                      <span className="ch-channel-total">
                        Total: {getChannelTotal(channel).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
   
                {heatmapData.products?.map((product, productIndex) => (
                  <div key={productIndex} className="ch-heatmap-row">
                    <div className="ch-cell ch-cell-header ch-product-header">
                      <span className="ch-product-name">{product}</span>
                      <span className="ch-product-total">
                        Total: {getProductTotal(product).toFixed(1)}%
                      </span>
                    </div>
                    {heatmapData.channels?.map((channel, channelIndex) => {
                      const cellData = getMatrixValue(product, channel);
                      const cellValue = cellData?.value || 0;
                      const cellColor = getHeatmapColor(cellValue);

                      return (
                        <div
                          key={channelIndex}
                          className={`ch-cell ch-cell-data ${selectedCell === `${productIndex}-${channelIndex}` ? 'selected' : ''}`}
                          style={{ backgroundColor: cellColor }}
                          onMouseEnter={() => setSelectedCell(`${productIndex}-${channelIndex}`)}
                          onMouseLeave={() => setSelectedCell(null)}
                        >
                          <div className="ch-cell-content">
                            <span className="ch-cell-value">{cellValue.toFixed(1)}%</span>
                            {cellData?.volume && (
                              <span className="ch-cell-volume">Vol: {cellData.volume}</span>
                            )}
                          </div> 
                          {selectedCell === `${productIndex}-${channelIndex}` && (
                            <div className="ch-tooltip">
                              <div className="ch-tooltip-header">
                                {product} × {channel}
                              </div>
                              <div className="ch-tooltip-content">
                                <div>Performance: {cellValue.toFixed(1)}%</div>
                                {cellData?.volume && <div>Volume: {cellData.volume}</div>}
                                {cellData?.metric && <div>Metric: {cellData.metric}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="channel-heatmap"
      data-analysis-name="Channel Heatmap"
      data-analysis-order="3">  
      {renderContent()}
    </div>
  );
};

export default React.memo(ChannelHeatmap);