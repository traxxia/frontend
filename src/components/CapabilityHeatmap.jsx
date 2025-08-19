import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, Loader, Target, Award, Activity } from 'lucide-react'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const CapabilityHeatmap = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  capabilityHeatmapData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => { 
  console.log('Raw capabilityHeatmapData:', capabilityHeatmapData);
  
  const [capabilityData, setCapabilityData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Extract the actual capability data from the API response
  const extractCapabilityData = (data) => {
    if (!data) return null;
    
    // If data has capabilityHeatmap property, extract it
    if (data.capabilityHeatmap) {
      return data.capabilityHeatmap;
    }
    
    // If data already has the expected structure
    if (data.capabilities && data.maturityScale) {
      return data;
    }
    
    return null;
  };

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.capabilityHeatmap;

    await checkMissingQuestionsAndRedirect(
      'CapabilityHeatmap',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if a value contains "NOT ENOUGH DATA" (case-insensitive)
  const hasNotEnoughDataValue = (value) => {
    if (typeof value === 'string') {
      return value.toUpperCase().includes('NOT ENOUGH DATA');
    }
    return false;
  };

  // Check if any data contains "NOT ENOUGH DATA"
  const containsNotEnoughData = (data) => {
    if (!data) return false;

    // Check capabilities array
    if (data.capabilities && Array.isArray(data.capabilities)) {
      for (const capability of data.capabilities) {
        if (hasNotEnoughDataValue(capability.name) ||
            hasNotEnoughDataValue(capability.category) ||
            hasNotEnoughDataValue(capability.type) ||
            hasNotEnoughDataValue(capability.impact) ||
            hasNotEnoughDataValue(capability.currentLevel)) {
          return true;
        }
      }
    }

    // Check maturity scale
    if (data.maturityScale && data.maturityScale.levels) {
      for (const level of data.maturityScale.levels) {
        if (hasNotEnoughDataValue(level.label)) {
          return true;
        }
      }
    }

    // Check overall maturity
    if (hasNotEnoughDataValue(data.overallMaturity)) {
      return true;
    }

    return false;
  };

  // Simplified check for incomplete data
  const isCapabilityDataIncomplete = (data) => {
    if (!data) return true;

    // Check if capabilities array is empty or null
    if (!data.capabilities || data.capabilities.length === 0) return true;

    // Check if maturity scale exists
    if (!data.maturityScale || !data.maturityScale.levels) return true;

    // Check if overallMaturity is missing
    if (data.overallMaturity === null || data.overallMaturity === undefined) return true;

    // Filter valid capabilities (excluding "NOT ENOUGH DATA" ones)
    const validCapabilities = data.capabilities.filter(capability => 
      capability.name && 
      !hasNotEnoughDataValue(capability.name) &&
      capability.category &&
      !hasNotEnoughDataValue(capability.category) &&
      capability.type &&
      !hasNotEnoughDataValue(capability.type) &&
      capability.currentLevel !== null &&
      capability.currentLevel !== undefined &&
      !hasNotEnoughDataValue(capability.currentLevel)
    );

    // If we have at least one valid capability, data is complete enough to show
    if (validCapabilities.length > 0) return false;

    return true;
  };

  // Check if analysis failed (all required questions answered but data is incomplete)
  const isAnalysisFailed = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/questions/missing-for-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analysis_type: 'capabilityHeatmap',
            business_id: selectedBusinessId
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        // If no missing questions but data is incomplete, it's an analysis failure
        return result.missing_count === 0 && isCapabilityDataIncomplete(capabilityData);
      }
      return false;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return false;
    }
  };

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
    const extractedData = extractCapabilityData(capabilityHeatmapData);
    console.log('Extracted capability data:', extractedData);
    
    if (extractedData && extractedData !== capabilityData) {
      setCapabilityData(extractedData);
      if (onDataGenerated) {
        onDataGenerated(extractedData);
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
      const extractedData = extractCapabilityData(capabilityHeatmapData);
      if (extractedData) {
        setCapabilityData(extractedData);
      }
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

  // Filter out capabilities with "NOT ENOUGH DATA" values for display
  const getValidCapabilities = (capabilities) => {
    if (!capabilities) return [];
    
    return capabilities.filter(capability => 
      capability.name && 
      !hasNotEnoughDataValue(capability.name) &&
      capability.category &&
      !hasNotEnoughDataValue(capability.category) &&
      capability.type &&
      !hasNotEnoughDataValue(capability.type) &&
      capability.currentLevel !== null &&
      capability.currentLevel !== undefined &&
      !hasNotEnoughDataValue(capability.currentLevel)
    );
  };

  const maturityLevels = capabilityData?.maturityScale?.levels || [
    { level: 1, label: "Initial" },
    { level: 2, label: "Developing" },
    { level: 3, label: "Defined" },
    { level: 4, label: "Managed" },
    { level: 5, label: "Optimized" }
  ];

  const validCapabilities = getValidCapabilities(capabilityData?.capabilities);
  const totalCapabilities = validCapabilities.length;
  const strengthsCount = validCapabilities.filter(c => c.type === 'strength').length;
  const weaknessesCount = validCapabilities.filter(c => c.type === 'weakness').length;
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

  // Check if data is incomplete (including "NOT ENOUGH DATA" values) and show missing questions checker
  if (!capabilityData || isCapabilityDataIncomplete(capabilityData)) {
    return (
      <div className="capability-heatmap"> 
        <AnalysisEmptyState
          analysisType="capabilityHeatmap"
          analysisDisplayName="Capability Heatmap Analysis"
          icon={Zap}
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

  return (
    <div className="capability-heatmap" data-analysis-type="capability-heatmap"
      data-analysis-name="Capability Heatmap"
      data-analysis-order="5"> 

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

              {validCapabilities.map((capability) => (
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
                              <div>Current Level: {capability.currentLevel}</div>
                              {capability.targetLevel && (
                                <div>Target Level: {capability.targetLevel}</div>
                              )}
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