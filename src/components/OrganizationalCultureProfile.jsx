import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Users, TrendingUp, Target, BarChart3, ChevronDown, ChevronRight } from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import "../styles/EssentialPhase.css";
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const OrganizationalCultureProfile = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  cultureProfileData = null,
  selectedBusinessId,
  onRedirectToBrief // Add this prop
}) => {
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.cultureProfile; 
    
    await checkMissingQuestionsAndRedirect(
      'cultureProfile', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the culture profile data is empty/incomplete
  const isCultureProfileDataIncomplete = (data) => {
    if (!data) return true;
    
    // Handle both wrapped and direct response structures
    const cultureProfile = data?.cultureProfile || data;
    
    // Check if essential culture profile data exists
    if (!cultureProfile) return true;
    
    // Check if cultureType is empty or null
    if (!cultureProfile.cultureType || cultureProfile.cultureType.trim() === '') return true;
    
    // Check if values array is empty
    if (!cultureProfile.values || cultureProfile.values.length === 0) return true;
    
    // Check if behaviors array is empty
    if (!cultureProfile.behaviors || cultureProfile.behaviors.length === 0) return true;
    
    // Check if workStyle has meaningful data (not just empty strings)
    if (cultureProfile.workStyle) {
      const workStyleValues = Object.values(cultureProfile.workStyle);
      const hasValidWorkStyle = workStyleValues.some(value => 
        value && typeof value === 'string' && value.trim() !== ''
      );
      if (!hasValidWorkStyle) return true;
    }
    
    // Check if cultureFit has meaningful data (not just empty strings)
    if (cultureProfile.cultureFit) {
      const cultureFitValues = Object.values(cultureProfile.cultureFit);
      const hasValidCultureFit = cultureFitValues.some(value => 
        value && typeof value === 'string' && value.trim() !== ''
      );
      if (!hasValidCultureFit) return true;
    }
    
    // Check if employeeMetrics has meaningful data (not just zeros or empty strings)
    if (cultureProfile.employeeMetrics) {
      const metrics = cultureProfile.employeeMetrics;
      const hasValidMetrics = (
        (metrics.totalEmployees && metrics.totalEmployees > 0) ||
        (metrics.costPercentage && metrics.costPercentage > 0) ||
        (metrics.valuePerEmployee && metrics.valuePerEmployee > 0) ||
        (metrics.productivity && metrics.productivity.trim() !== '')
      );
      if (!hasValidMetrics) return true;
    }
    
    // If we get here, the data appears to be incomplete/empty
    return true;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle regeneration - same pattern as CustomerSegmentation
  const handleRegenerate = async () => { 
    if (onRegenerate) {
      setError(null); // Clear any existing errors
      onRegenerate(); 
    }
  };

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Clear errors when new data comes in
  useEffect(() => {
    if (cultureProfileData) {
      setError(null);
    }
  }, [cultureProfileData]);

  // Word Cloud Component
  const WordCloud = ({ values = [], behaviors = [] }) => {
    const allWords = [...values, ...behaviors];
    if (allWords.length === 0) return null;

    const wordSizes = allWords.map((word, index) => ({
      word,
      size: Math.random() * 20 + 14, // Random size between 14-34px
      type: index < values.length ? 'value' : 'behavior'
    }));

    return (
      <div className="word-cloud">
        {wordSizes.map((item, index) => (
          <span
            key={index}
            className={`word-cloud-item ${item.type}`} 
          >
            {item.word}
          </span>
        ))}
      </div>
    );
  };

  // Culture Map Component
  const CultureMap = ({ cultureType, cultureFit = {} }) => {
    const quadrants = [
      { name: 'Clan', position: { top: '20%', left: '20%' }, color: '#10b981' },
      { name: 'Adhocracy', position: { top: '20%', right: '20%' }, color: '#f59e0b' },
      { name: 'Market', position: { bottom: '20%', right: '20%' }, color: '#ef4444' },
      { name: 'Hierarchy', position: { bottom: '20%', left: '20%' }, color: '#3b82f6' }
    ];

    const getCurrentQuadrant = () => {
      return quadrants.find(q => q.name === cultureType) || quadrants[0];
    };

    const currentQuadrant = getCurrentQuadrant();

    return (
      <div className="culture-map">
        <div className="culture-map-container">
          {/* Grid lines */}
          <div className="grid-line horizontal"></div>
          <div className="grid-line vertical"></div>

          {/* Axis labels */}
          <div className="axis-label top">Flexible & Adaptable</div>
          <div className="axis-label bottom">Stable & Controlled</div>
          <div className="axis-label left">Internal Focus</div>
          <div className="axis-label right">External Focus</div>

          {/* Quadrants */}
          {quadrants.map((quadrant, index) => (
            <div
              key={index}
              className={`quadrant ${quadrant.name.toLowerCase()} ${cultureType === quadrant.name ? 'active' : ''}`}
              style={quadrant.position}
            >
              <div className="quadrant-label" style={{ color: quadrant.color }}>
                {quadrant.name}
              </div>
            </div>
          ))}

          {/* Current position indicator */}
          <div
            className="current-position"
            style={{
              ...currentQuadrant.position,
              backgroundColor: currentQuadrant.color
            }}
          >
            <div className="position-dot"></div>
            <div className="position-label">Current</div>
          </div>
        </div>

        {/* Culture fit indicators */}
        {Object.keys(cultureFit).length > 0 && (
          <div className="culture-fit-indicators">
            {Object.entries(cultureFit).map(([area, fit]) => (
              <div key={area} className="fit-indicator">
                <span className="fit-area">{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="fit-bar">
                  <div
                    className={`fit-level ${fit.toLowerCase()}`}
                    style={{ width: fit === 'high' ? '80%' : fit === 'medium' ? '50%' : '20%' }}
                  ></div>
                </div>
                <span className={`fit-label ${fit.toLowerCase()}`}>{fit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get intensity color for styling
  const getIntensityColor = (value) => {
    const level = value?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low') || level.includes('weak')) return 'low-intensity';
    return 'medium-intensity';
  };

  // Loading state
  if (isRegenerating) {
    return (
      <div className="culture-profile">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating organizational culture profile analysis...</span>
        </div>
      </div>
    );
  }

  // Error state - UPDATED: Using AnalysisError component
  if (error) {
    return (
      <div className="culture-profile"> 
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Organizational Culture Profile Analysis Error"
        />
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!cultureProfileData || isCultureProfileDataIncomplete(cultureProfileData)) {
    return (
      <div className="culture-profile"> 

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="cultureProfile"
          analysisDisplayName="Organizational Culture Profile Analysis"
          icon={Users}
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

  // Handle both wrapped and direct response structures
  const cultureProfile = cultureProfileData?.cultureProfile || cultureProfileData;

  return (
    <div className="porters-container"> 

      {/* Word Cloud Section */}
      {(cultureProfile.values?.length > 0 || cultureProfile.behaviors?.length > 0) && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('wordcloud')}>
            <h3>
              <BarChart3 size={20} />
              Key Cultural Values & Behaviors
            </h3>
            {expandedSections.wordcloud ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.wordcloud !== false && (
            <div className="table-container">
              <WordCloud
                values={cultureProfile.values || []}
                behaviors={cultureProfile.behaviors || []}
              />
            </div>
          )}
        </div>
      )}

      {/* Culture Map Section */}
      {cultureProfile.cultureType && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('culturemap')}>
            <h3>
              <Target size={20} />
              Culture Map: Current Position & Fit Assessment
            </h3>
            {expandedSections.culturemap ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.culturemap !== false && (
            <div className="table-container">
              <CultureMap
                cultureType={cultureProfile.cultureType}
                cultureFit={cultureProfile.cultureFit || {}}
              />
            </div>
          )}
        </div>
      )}

      {/* Culture Overview Table */}
      {cultureProfile.cultureType && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('overview')}>
            <h3>Culture Overview</h3>
            {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.overview !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Current State</th>
                    <th>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Culture Type</strong></td>
                    <td>{cultureProfile.cultureType}</td>
                    <td>
                      <span className="type-badge">{cultureProfile.cultureType}</span>
                    </td>
                  </tr>
                  {cultureProfile.values && cultureProfile.values.length > 0 && (
                    <tr>
                      <td><strong>Core Values</strong></td>
                      <td>{cultureProfile.values.slice(0, 3).join(', ')}</td>
                      <td>
                        <span className="status-badge high-intensity">
                          {cultureProfile.values.length} Values Identified
                        </span>
                      </td>
                    </tr>
                  )}
                  {cultureProfile.behaviors && cultureProfile.behaviors.length > 0 && (
                    <tr>
                      <td><strong>Key Behaviors</strong></td>
                      <td>{cultureProfile.behaviors.slice(0, 3).join(', ')}</td>
                      <td>
                        <span className="status-badge medium-intensity">
                          {cultureProfile.behaviors.length} Behaviors Defined
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Work Style Analysis Table */}
      {cultureProfile.workStyle && Object.keys(cultureProfile.workStyle).length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('workstyle')}>
            <h3>
              <TrendingUp size={20} />
              Work Style Analysis
            </h3>
            {expandedSections.workstyle ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.workstyle !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Work Style Attribute</th>
                    <th>Current Approach</th>
                    <th>Impact Level</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cultureProfile.workStyle).map(([key, value]) => (
                    <tr key={key}>
                      <td><strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                      <td>{value}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(value)}`}>
                          {value.toLowerCase().includes('high') || value.toLowerCase().includes('strong') ? 'High' :
                           value.toLowerCase().includes('medium') || value.toLowerCase().includes('moderate') ? 'Medium' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Employee Metrics Table */}
      {cultureProfile.employeeMetrics && Object.keys(cultureProfile.employeeMetrics).length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('metrics')}>
            <h3>
              <Target size={20} />
              Employee Metrics & Performance
            </h3>
            {expandedSections.metrics ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.metrics !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Performance Level</th>
                    <th>Industry Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cultureProfile.employeeMetrics)
                    .filter(([key, value]) => value !== null && value !== undefined)
                    .map(([key, value]) => {
                      const isPercentage = key.toLowerCase().includes('percentage') || key.toLowerCase().includes('rate');
                      const displayValue = isPercentage ? `${value}%` : value;
                      const performanceLevel = typeof value === 'number' ? 
                        (value > 75 ? 'High' : value > 50 ? 'Medium' : 'Low') : 'Standard';
                      
                      return (
                        <tr key={key}>
                          <td><strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                          <td>{displayValue}</td>
                          <td>
                            <span className={`status-badge ${getIntensityColor(performanceLevel)}`}>
                              {performanceLevel}
                            </span>
                          </td>
                          <td>
                            {isPercentage && typeof value === 'number' ? 
                              (value > 70 ? 'Above Average' : value > 40 ? 'Average' : 'Below Average') : 
                              'Industry Standard'
                            }
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Culture Fit Assessment Table */}
      {cultureProfile.cultureFit && Object.keys(cultureProfile.cultureFit).length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('fit')}>
            <h3>Culture Fit Assessment</h3>
            {expandedSections.fit ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.fit !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment Area</th>
                    <th>Fit Level</th>
                    <th>Status</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cultureProfile.cultureFit).map(([area, fit]) => (
                    <tr key={area}>
                      <td><strong>{area.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                      <td>{fit}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(fit)}`}>
                          {fit}
                        </span>
                      </td>
                      <td>
                        {fit === 'high' ? 'Maintain current approach' :
                         fit === 'medium' ? 'Consider improvements' :
                         'Requires attention'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationalCultureProfile;