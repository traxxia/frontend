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
  canRegenerate = true
}) => {
  const [capabilityData, setCapabilityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);
  const { t } = useTranslation();
  
  // Add ref to track if API call is in progress or has been made
  const isGeneratingRef = useRef(false);
  const hasGeneratedRef = useRef(false);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Load existing analysis from backend
  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/analysis/capabilityHeatmap`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Loaded existing capability heatmap from backend:', result.analysisData);
        setCapabilityData(result.analysisData);
        setHasLoadedFromBackend(true);
        hasGeneratedRef.current = true;
        if (onDataGenerated) {
          onDataGenerated(result.analysisData);
        }
        return true;
      } else if (response.status === 404) {
        console.log('📊 No existing capability heatmap found in backend');
        setHasLoadedFromBackend(true);
        return false;
      } else {
        console.error('Failed to load capability heatmap:', response.statusText);
        setHasLoadedFromBackend(true);
        return false;
      }
    } catch (error) {
      console.error('Error loading capability heatmap:', error);
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
          analysisType: 'capabilityHeatmap',
          analysisData: analysisData,
          businessName: businessName
        })
      });

      if (response.ok) {
        console.log('📊 Capability heatmap analysis saved to backend');
        return true;
      } else {
        console.error('Failed to save capability heatmap analysis:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error saving capability heatmap analysis:', error);
      return false;
    }
  };

  const generateCapabilityData = async () => {
    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) {
      console.log('API call already in progress, skipping...');
      return;
    }

    try {
      isGeneratingRef.current = true;
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
        throw new Error('No answered questions available for capability analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      console.log('Sending to /capability-heatmap API:', payload);

      const response = await fetch(`${ML_API_BASE_URL}/capability-heatmap`, {
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

      console.log('Parsed result from /capability-heatmap API:', result);

      let dataToSave = null;
      if (result && result.capabilityHeatmap) {
        console.log('Setting capability data:', result.capabilityHeatmap);
        setCapabilityData(result.capabilityHeatmap);
        dataToSave = result.capabilityHeatmap;
      } else if (result && result.capabilities) {
        // Handle direct response format
        console.log('Setting capability data (direct format):', result);
        setCapabilityData(result);
        dataToSave = result;
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from API');
      }

      if (dataToSave) {
        hasGeneratedRef.current = true;
        
        // Save to backend
        await saveAnalysisToBackend(dataToSave);
        
        if (onDataGenerated) {
          onDataGenerated(dataToSave);
        }
      }

    } catch (error) {
      console.error('Error generating capability heatmap:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    hasGeneratedRef.current = false; // Reset the flag to allow regeneration
    setHasLoadedFromBackend(false); // Reset backend load flag
    if (onRegenerate) {
      // Use parent's regeneration logic
      onRegenerate();
    } else {
      // Use local regeneration logic
      setCapabilityData(null);
      await generateCapabilityData();
    }
  };

  // Load existing analysis on mount
  useEffect(() => {
    const initializeComponent = async () => {
      // First try to load existing analysis from backend
      const hasExistingAnalysis = await loadExistingAnalysis();
      
      if (!hasExistingAnalysis) {
        // If no existing analysis, check if we can generate new one
        const answeredCount = Object.keys(userAnswers).length;
        
        if (answeredCount >= 3 && 
            !capabilityData && 
            !isLoading && 
            !hasGeneratedRef.current && 
            !isRegenerating) {
          generateCapabilityData();
        }
      }
    };

    initializeComponent();
  }, []); // Empty dependency array - only run on mount

  // Separate useEffect to handle prop changes (if needed)
  useEffect(() => {
    // Only proceed if we've already tried loading from backend
    if (!hasLoadedFromBackend) return;
    
    const answeredCount = Object.keys(userAnswers).length;
    
    // Only generate if:
    // 1. We have enough answers
    // 2. We don't already have capability data
    // 3. We're not currently loading
    // 4. We haven't already generated data (to prevent multiple calls)
    // 5. We're not in the middle of regenerating
    if (answeredCount >= 3 && 
        !capabilityData && 
        !isLoading && 
        !hasGeneratedRef.current && 
        !isRegenerating) {
      generateCapabilityData();
    }
  }, [userAnswers, questions, capabilityData, isLoading, isRegenerating, hasLoadedFromBackend]);
  
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
            hasGeneratedRef.current = false;
            generateCapabilityData();
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
              ? "Generate your capability analysis to understand organizational strengths and development areas."
              : "Loading capability heatmap analysis..."
            }
          </p>
          {answeredCount >= 3 && hasLoadedFromBackend && (
            <button onClick={() => {
              hasGeneratedRef.current = false;
              generateCapabilityData();
            }} className="generate-button">
              Generate Analysis
            </button>
          )}
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
                            {/* <div>Current Level: {capability.currentLevel} ({maturityLevels[capability.currentLevel - 1]?.label})</div> */}
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
  );
};

export default CapabilityHeatmap;