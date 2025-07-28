import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Layers, Calendar, Loader, Zap, Grid3x3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css'; // We'll create this CSS file
import { useTranslation } from "../hooks/useTranslation";

const ChannelHeatmap = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}) => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);
  const { t } = useTranslation();

  // Add refs to track if API has been called and component mount
  const hasCalledAPI = useRef(false);
  const isMounted = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Load existing analysis from backend
  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/analysis/channelHeatmap`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Loaded existing channel heatmap from backend:', result.analysisData);
        setHeatmapData(result.analysisData);
        setHasLoadedFromBackend(true);
        if (onDataGenerated) {
          onDataGenerated(result.analysisData);
        }
        return true;
      } else if (response.status === 404) {
        console.log('📊 No existing channel heatmap found in backend');
        setHasLoadedFromBackend(true);
        return false;
      } else {
        console.error('Failed to load channel heatmap:', response.statusText);
        setHasLoadedFromBackend(true);
        return false;
      }
    } catch (error) {
      console.error('Error loading channel heatmap:', error);
      setHasLoadedFromBackend(true);
      return false;
    }
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      // Get current session ID
      const currentResponse = await fetch(`${API_BASE_URL}/api/conversation/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!currentResponse.ok) {
        throw new Error('Failed to get current conversation');
      }

      const conversation = await currentResponse.json();
      const sessionId = conversation.sessionId;

      if (!sessionId) {
        throw new Error('No active conversation session found');
      }

      const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          analysisType: 'channelHeatmap',
          analysisData: analysisData,
          businessName: businessName
        })
      });

      if (response.ok) {
        console.log('📊 Channel heatmap analysis saved to backend');
        return true;
      } else {
        console.error('Failed to save channel heatmap analysis:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error saving channel heatmap analysis:', error);
      return false;
    }
  };

  const generateHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare questions and answers arrays
      const questionsArray = [];
      const answersArray = [];

      // Sort questions by ID to maintain order
      const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);

      // Only include answered questions
      sortedQuestions.forEach(question => {
        if (userAnswers[question.id]) {
          // Clean and sanitize text to avoid encoding issues
          const cleanQuestion = String(question.question)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for channel heatmap analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      console.log('Sending to /channel-heatmap API:', payload);

      const response = await fetch(`${ML_API_BASE_URL}/channel-heatmap`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = `API returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = `API Error: ${errorData.detail}`;
          }
        } catch (e) {
          errorMessage = `API Error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from API');
      }

      console.log('Parsed result from /channel-heatmap API:', result);

      if (result && result.channelHeatmap) {
        console.log('Setting heatmap data:', result.channelHeatmap);
        setHeatmapData(result.channelHeatmap);
        
        // Save to backend
        await saveAnalysisToBackend(result.channelHeatmap);
        
        if (onDataGenerated) {
          onDataGenerated(result.channelHeatmap);
        }
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from API');
      }

    } catch (error) {
      console.error('Error generating channel heatmap:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    hasCalledAPI.current = false; // Reset the flag for regeneration
    setHasLoadedFromBackend(false); // Reset backend load flag
    if (onRegenerate) {
      // Use parent's regeneration logic
      onRegenerate();
    } else {
      // Use local regeneration logic
      setHeatmapData(null);
      await generateHeatmapData();
    }
  };

  // Load existing analysis on mount
  useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;

    const initializeComponent = async () => {
      // First try to load existing analysis from backend
      const hasExistingAnalysis = await loadExistingAnalysis();
      
      if (!hasExistingAnalysis) {
        // If no existing analysis, check if we can generate new one
        const answeredCount = Object.keys(userAnswers).length;

        if (
          answeredCount >= 3 &&
          !heatmapData &&
          !isLoading &&
          !hasCalledAPI.current &&
          isMounted.current
        ) {
          hasCalledAPI.current = true; // Set flag before calling API
          generateHeatmapData();
        }
      }
    };

    initializeComponent();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Separate useEffect to handle prop changes (if needed)
  useEffect(() => {
    // Only proceed if we've already tried loading from backend
    if (!hasLoadedFromBackend) return;

    const answeredCount = Object.keys(userAnswers).length;

    // Only trigger if we have new data and haven't called API yet
    if (
      answeredCount >= 3 &&
      !heatmapData &&
      !isLoading &&
      !hasCalledAPI.current &&
      isMounted.current
    ) {
      hasCalledAPI.current = true;
      generateHeatmapData();
    }
  }, [userAnswers, questions, hasLoadedFromBackend]); // Include hasLoadedFromBackend in dependencies

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
              : !hasLoadedFromBackend
              ? t("Loading channel heatmap analysis...")
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
            hasCalledAPI.current = false; // Reset flag for retry
            generateHeatmapData();
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
              : hasLoadedFromBackend
              ? "Generate your channel heatmap to visualize product-channel performance."
              : "Loading channel heatmap analysis..."
            }
          </p>
          {answeredCount >= 3 && hasLoadedFromBackend && (
            <button onClick={() => {
              hasCalledAPI.current = false; // Reset flag for manual generation
              generateHeatmapData();
            }} className="generate-button">
              Generate Analysis
            </button>
          )}
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