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
  capabilityHeatmapData = null
}) => {
  const [capabilityData, setCapabilityData] = useState(capabilityHeatmapData);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setCapabilityData(null);
      setError(null);
    }
  };

  // Update capability data when prop changes
  useEffect(() => {
    if (capabilityHeatmapData && capabilityHeatmapData !== capabilityData) {
      setCapabilityData(capabilityHeatmapData);
      if (onDataGenerated) {
        onDataGenerated(capabilityHeatmapData);
      }
    }
  }, [capabilityHeatmapData]);
 useEffect(() => {
  if (capabilityData && onDataGenerated) {
    onDataGenerated(capabilityData);
  }
}, [capabilityData]);
  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (capabilityHeatmapData) {
      setCapabilityData(capabilityHeatmapData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get color based on capability level and type
  const getCellColor = (capability, maturityLevel) => {
    if (capability.currentLevel === maturityLevel) {
      return capability.type === 'strength'
        ? capability.impact === 'high' ? '#10b981' : '#34d399'
        : capability.impact === 'high' ? '#ef4444' : '#f87171';
    } else if (capability.currentLevel > maturityLevel) {
      return '#f0fdf4';
    } else {
      return '#f9fafb';
    }
  };

  const maturityLevels = capabilityData?.maturityScale?.levels || [
    { level: 1, label: "Initial" },
    { level: 2, label: "Developing" },
    { level: 3, label: "Defined" },
    { level: 4, label: "Managed" },
    { level: 5, label: "Optimized" }
  ];

  const totalCapabilities = capabilityData?.capabilities?.length || 0;
  const strengthsCount = capabilityData?.capabilities?.filter(c => c.type === 'strength').length || 0;
  const weaknessesCount = capabilityData?.capabilities?.filter(c => c.type === 'weakness').length || 0;
  const overallMaturity = capabilityData?.overallMaturity || 0;

  if (isRegenerating) {
    return (
      <div className="capability-heatmap">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>{t("Regenerating capability heatmap analysis...")}</span>
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
            if (onRegenerate) onRegenerate();
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
              : "Capability heatmap analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="capability-heatmap">
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

      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-wrapper">
            <div className="ch-heatmap">
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

              {capabilityData.capabilities.map((capability) => (
                <div key={capability.name} className="ch-heatmap-row">
                  <div className="ch-cell ch-cell-header ch-capability-header">
                    <div className="ch-capability-name">{capability.name}</div>
                  </div>
                  {maturityLevels.map(level => {
                    const cellKey = `${capability.name}-${level.level}`;
                    const isCurrentLevel = capability.currentLevel === level.level;
                    return (
                      <div
                        key={cellKey}
                        className={`ch-cell ch-cell-data ${selectedCell === cellKey ? 'selected' : ''} ${isCurrentLevel ? 'active-level' : ''}`}
                        style={{ backgroundColor: getCellColor(capability, level.level), cursor: 'pointer' }}
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
