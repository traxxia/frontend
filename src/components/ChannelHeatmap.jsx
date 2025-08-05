import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Layers, Calendar, Loader, Zap, Grid3x3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";

const ChannelHeatmap = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  channelHeatmapData = null
}) => {
  const [heatmapData, setHeatmapData] = useState(channelHeatmapData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // Add refs to track component mount
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setHeatmapData(null);
      setError(null);
    }
  };

  // Update heatmap data when prop changes
  useEffect(() => {
    if (channelHeatmapData && channelHeatmapData !== heatmapData) {
      setHeatmapData(channelHeatmapData);
      if (onDataGenerated) {
        onDataGenerated(channelHeatmapData);
      }
    }
  }, [channelHeatmapData]);

  // Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (channelHeatmapData) {
      setHeatmapData(channelHeatmapData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get matrix value for a specific product-channel combination
  const getMatrixValue = (product, channel) => {
    if (!heatmapData?.matrix) return null;
    return heatmapData.matrix.find(item =>
      item.product === product && item.channel === channel
    );
  };

  // Get color intensity based on value
  const getHeatmapColor = (value) => {
    if (!value || !heatmapData?.legend) return '#f3f4f6';

    const intensity = value / 100; // Assuming 0-100 scale
    const { colorRange } = heatmapData.legend;

    // Convert hex to RGB for interpolation
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

    // Interpolate between low and high colors
    const r = Math.round(lowColor.r + (highColor.r - lowColor.r) * intensity);
    const g = Math.round(lowColor.g + (highColor.g - lowColor.g) * intensity);
    const b = Math.round(lowColor.b + (highColor.b - lowColor.b) * intensity);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Calculate channel totals
  const getChannelTotal = (channel) => {
    if (!heatmapData?.matrix) return 0;
    return heatmapData.matrix
      .filter(item => item.channel === channel)
      .reduce((sum, item) => sum + item.value, 0);
  };

  // Calculate product totals
  const getProductTotal = (product) => {
    if (!heatmapData?.matrix) return 0;
    return heatmapData.matrix
      .filter(item => item.product === product)
      .reduce((sum, item) => sum + item.value, 0);
  };

  // Get top performing combinations
  const getTopPerformers = () => {
    if (!heatmapData?.matrix) return [];
    return [...heatmapData.matrix]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="channel-heatmap">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating channel heatmap analysis...")
              : t("Generating channel heatmap analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-heatmap">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            setError(null);
            if (onRegenerate) {
              onRegenerate();
            }
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="channel-heatmap">
        <div className="empty-state">
          <Grid3x3 size={48} className="empty-icon" />
          <h3>Channel Heatmap Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate channel performance insights.`
              : "Channel heatmap analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  const topPerformers = getTopPerformers();

  return (
    <div className="channel-heatmap">
      {/* Header with regenerate button */}
      <div className="ch-header">
        <div className="ch-title-section">
          <Grid3x3 className="ch-icon" size={24} />
          <h2 className="ch-title">{t("Channel Heatmap")}</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Channel Heatmap"
          size="medium"
        />
      </div>

      {/* Key Metrics */}
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

      {/* Heatmap */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Performance Heatmap</h3>
            {/* Legend moved to top right */}
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
              {/* Header row with channels */}
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

              {/* Data rows */}
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
                        onClick={() => setSelectedCell(`${productIndex}-${channelIndex}`)}
                        onMouseEnter={() => setSelectedCell(`${productIndex}-${channelIndex}`)}
                        onMouseLeave={() => setSelectedCell(null)}
                      >
                        <div className="ch-cell-content">
                          <span className="ch-cell-value">{cellValue.toFixed(1)}%</span>
                          {cellData?.volume && (
                            <span className="ch-cell-volume">Vol: {cellData.volume}</span>
                          )}
                        </div>

                        {/* Tooltip */}
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
    </div>
  );
};

export default ChannelHeatmap;