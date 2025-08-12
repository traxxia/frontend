import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, Loader, Target, Award, Activity } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import MissingQuestionsChecker from './MissingQuestionsChecker';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';

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
  const [capabilityData, setCapabilityData] = useState(capabilityHeatmapData);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const checkMissingQuestionsAndRedirect = async () => {
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

        // If there are missing questions, redirect with highlighting
        if (result.missing_count > 0) {
          handleRedirectToBrief(result);
        } else {
          // No missing questions but data is incomplete - user needs to improve their answers
          // Create a custom result to highlight the capabilityHeatmap question(s)
          const capabilityHeatmapQuestions = await fetch(
            `${API_BASE_URL}/api/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          ).then(res => res.json()).then(data =>
            data.questions.filter(q => q.used_for && q.used_for.includes('capabilityHeatmap'))
          );

          handleRedirectToBrief({
            missing_count: capabilityHeatmapQuestions.length,
            missing_questions: capabilityHeatmapQuestions.map(q => ({
              _id: q._id,
              order: q.order,
              question_text: q.question_text,
              objective: q.objective,
              required_info: q.required_info,
              used_for: q.used_for
            })),
            analysis_type: 'capabilityHeatmap',
            message: `Please provide more detailed answers for capability heatmap analysis. The current answers are insufficient to generate meaningful capability insights.`,
            is_complete: false,
            keepHighlightLonger: true // Flag to keep highlighting longer
          });
        }
      } else {
        // If API call fails, redirect to review answers
        handleRedirectToBrief({
          missing_count: 0,
          missing_questions: [],
          analysis_type: 'capabilityHeatmap',
          message: 'Please review and improve your answers for capability heatmap analysis.'
        });
      }
    } catch (error) {
      console.error('Error checking missing questions:', error);
      // If error occurs, redirect to review answers
      handleRedirectToBrief({
        missing_count: 0,
        missing_questions: [],
        analysis_type: 'capabilityHeatmap',
        message: 'Please review and improve your answers for capability heatmap analysis.'
      });
    }
  };

  // Check if the capability data is empty/incomplete
  const isCapabilityDataIncomplete = (data) => {
    if (!data) return true;

    // Check if capabilities array is empty or null
    if (!data.capabilities || data.capabilities.length === 0) return true;

    // Check if maturity scale exists
    if (!data.maturityScale || !data.maturityScale.levels) return true;

    // Check if overallMaturity is missing
    if (data.overallMaturity === null || data.overallMaturity === undefined) return true;

    // Validate that capabilities have required fields
    const hasIncompleteCapabilities = data.capabilities.some(capability =>
      !capability.name ||
      !capability.category ||
      !capability.type ||
      capability.currentLevel === null ||
      capability.currentLevel === undefined
    );

    return hasIncompleteCapabilities;
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

  // Check if data is incomplete and show missing questions checker
  if (!capabilityData || isCapabilityDataIncomplete(capabilityData)) {
    return (
      <div className="capability-heatmap">
        <div className="ch-header">
          <div className="ch-title-section">
            <Zap className="ch-icon" size={24} />
            <h2 className="ch-title">{t("Capability Heatmap")}</h2>
          </div>
        </div>

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="capabilityHeatmap"
          analysisDisplayName="Capability Heatmap Analysis"
          icon={Zap}
          onImproveAnswers={checkMissingQuestionsAndRedirect}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />

        <MissingQuestionsChecker
          analysisType="capabilityHeatmap"
          analysisData={capabilityData}
          selectedBusinessId={selectedBusinessId}
          onRedirectToBrief={handleRedirectToBrief}
          API_BASE_URL={API_BASE_URL}
          getAuthToken={getAuthToken}
        />
      </div>
    );
  }

  return (
    <div className="capability-heatmap" data-analysis-type="capability-heatmap"
      data-analysis-name="Capability Heatmap"
      data-analysis-order="5">
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