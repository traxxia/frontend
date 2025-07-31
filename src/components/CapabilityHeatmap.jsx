import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, Loader, Target, Award, Activity } from 'lucide-react'; 
import RegenerateButton from './RegenerateButton';
import { useTranslation } from "../hooks/useTranslation";

const CapabilityHeatmap = ({ 
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  capabilityHeatmapData = null // Add this prop to receive data from parent
}) => {
  const [capabilityData, setCapabilityData] = useState(capabilityHeatmapData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);
  const { t } = useTranslation();
  
  // Add refs to track component mount
  const isMounted = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Load existing analysis from backend (chat history)
  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/user/conversation-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const analysisMessages = result.chat_messages?.filter(msg => 
          msg.metadata?.analysisType === 'capabilityHeatmap' && msg.metadata?.analysisData
        );
        
        if (analysisMessages && analysisMessages.length > 0) {
          const latestAnalysis = analysisMessages[analysisMessages.length - 1];
          console.log('📊 Loaded existing capability heatmap from backend:', latestAnalysis.metadata.analysisData);
          setCapabilityData(latestAnalysis.metadata.analysisData);
          setHasLoadedFromBackend(true);
          if (onDataGenerated) {
            onDataGenerated(latestAnalysis.metadata.analysisData);
          }
          return true;
        } else {
          console.log('📊 No existing capability heatmap found in backend');
          setHasLoadedFromBackend(true);
          return false;
        }
      } else {
        console.error('Failed to load conversation history:', response.statusText);
        setHasLoadedFromBackend(true);
        return false;
      }
    } catch (error) {
      console.error('Error loading capability heatmap:', error);
      setHasLoadedFromBackend(true);
      return false;
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      // Use parent's regeneration logic
      onRegenerate();
    } else {
      // Local regeneration (should not happen in new flow, but keep as fallback)
      setCapabilityData(null);
      setError(null);
    }
  };

  // Update capability data when prop changes
  useEffect(() => {
    if (capabilityHeatmapData && capabilityHeatmapData !== capabilityData) {
      console.log('📊 Updating capability heatmap data from props:', capabilityHeatmapData);
      setCapabilityData(capabilityHeatmapData);
      if (onDataGenerated) {
        onDataGenerated(capabilityHeatmapData);
      }
    }
  }, [capabilityHeatmapData, capabilityData, onDataGenerated]);

  // Load existing analysis on mount
  useEffect(() => {
    isMounted.current = true;
    
    const initializeComponent = async () => {
      // Only load from backend if no data was provided via props
      if (!capabilityHeatmapData) {
        await loadExistingAnalysis();
      } else {
        setHasLoadedFromBackend(true);
      }
    };

    initializeComponent();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - only run on mount
  
  // Get color based on capability level and type
  const getCellColor = (capability, maturityLevel) => {
    if (capability.currentLevel === maturityLevel) {
      // This is the capability's current level - color based on type and impact
      if (capability.type === 'strength') {
        return capability.impact === 'high' ? '#10b981' : '#34d399'; // Green shades
      } else {
        return capability.impact === 'high' ? '#ef4444' : '#f87171'; // Red shades
      }
    } else if (capability.currentLevel > maturityLevel) {
      // Capability is above this level - light fill
      return '#f0fdf4'; // Very light green
    } else {
      // Capability is below this level - no fill
      return '#f9fafb'; // Light gray
    }
  };
  
  // Get maturity levels from data or use default
  const maturityLevels = capabilityData?.maturityScale?.levels || [
    { level: 1, label: "Initial" },
    { level: 2, label: "Developing" },
    { level: 3, label: "Defined" },
    { level: 4, label: "Managed" },
    { level: 5, label: "Optimized" }
  ];

  // Calculate metrics based on available data
  const totalCapabilities = capabilityData?.capabilities?.length || 0;
  const strengthsCount = capabilityData?.capabilities?.filter(c => c.type === 'strength').length || 0;
  const weaknessesCount = capabilityData?.capabilities?.filter(c => c.type === 'weakness').length || 0;
  const overallMaturity = capabilityData?.overallMaturity || 0;

  if (isLoading || isRegenerating) {
    return (
      <div className="capability-heatmap">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating 
              ? t("Regenerating capability heatmap analysis...")
              : !hasLoadedFromBackend
              ? t("Loading capability heatmap analysis...")
              : t("Generating capability heatmap analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="capability-heatmap">
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

  if (!capabilityData || !capabilityData.capabilities || capabilityData.capabilities.length === 0) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="capability-heatmap">
        <div className="empty-state">
          <Zap size={48} className="empty-icon" />
          <h3>Capability Heatmap Analysis</h3>
          <p>
            {answeredCount < 3 
              ? `Answer ${3 - answeredCount} more questions to generate capability insights.`
              : hasLoadedFromBackend
              ? "Capability heatmap analysis will be generated automatically after completing the initial phase."
              : "Loading capability heatmap analysis..."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="capability-heatmap">
      {/* Header */}
      <div className="ch-header">
        <div className="ch-title-section">
          <Zap className="ch-icon" size={24} />
          <h2 className="ch-title">{t("Capability Heatmap")}</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Capability Heatmap"
          size="medium"
        />
      </div>

      {/* Key Metrics */}
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <Activity size={20} />
            <span>Total Capabilities</span>
          </div>
          <p className="ch-metric-value">{totalCapabilities}</p>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <Award size={20} />
            <span>Strengths</span>
          </div>
          <p className="ch-metric-value">{strengthsCount}</p>
        </div>

        <div className="ch-metric-card ch-metric-red">
          <div className="ch-metric-header">
            <Target size={20} />
            <span>Weaknesses</span>
          </div>
          <p className="ch-metric-value">{weaknessesCount}</p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Overall Maturity</span>
          </div>
          <p className="ch-metric-value">{overallMaturity}</p>
        </div>
      </div>

      {/* Main Heatmap - Capabilities (Y-axis) vs Maturity Level (X-axis) */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
        <div className="ch-heatmap-wrapper">
          <div className="ch-heatmap">
            {/* Header Row - Maturity Levels */}
            <div className="ch-heatmap-header">
              <div className="ch-cell ch-cell-corner">
                <div className="ch-corner-label">Capabilities</div>
                <div className="ch-corner-sublabel">vs Maturity</div>
              </div>
              {maturityLevels.map(level => (
                <div key={level.level} className="ch-cell ch-cell-header ch-maturity-header">
                  <div className="ch-maturity-level">Level {level.level}</div>
                  <div className="ch-maturity-label">{level.label}</div>
                </div>
              ))}
            </div>

            {/* Data Rows - One row per capability */}
            {capabilityData.capabilities.map((capability, capIndex) => (
              <div key={capability.name} className="ch-heatmap-row">
                <div className="ch-cell ch-cell-header ch-capability-header">
                  <div className="ch-capability-name">{capability.name}</div>
                </div>
                
                {/* Maturity level cells */}
                {maturityLevels.map(level => {
                  const cellKey = `${capability.name}-${level.level}`;
                  const isCurrentLevel = capability.currentLevel === level.level;
                  
                  return (
                    <div
                      key={cellKey}
                      className={`ch-cell ch-cell-data ${selectedCell === cellKey ? 'selected' : ''} ${isCurrentLevel ? 'active-level' : ''}`}
                      style={{
                        backgroundColor: getCellColor(capability, level.level),
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedCell(cellKey === selectedCell ? null : cellKey)}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="ch-cell-content">
                        {isCurrentLevel && (
                          <div className="ch-level-indicator">
                            <div className="ch-level-dot"></div>
                            Current
                          </div>
                        )}
                      </div>
                      
                      {/* Tooltip */}
                      {hoveredCell === cellKey && (
                        <div className="ch-tooltip">
                          <div className="ch-tooltip-header">{capability.name}</div>
                          <div className="ch-tooltip-content">
                            <div>Category: {capability.category}</div>
                            <div>Type: {capability.type}</div>
                            <div>Impact: {capability.impact}</div>
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

export default CapabilityHeatmap;