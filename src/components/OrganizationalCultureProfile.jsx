import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Users, TrendingUp, Target, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import "../styles/EssentialPhase.css";

const OrganizationalCultureProfile = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  cultureProfileData = null
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const generateCultureProfile = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id] && userAnswers[q._id].trim() && userAnswers[q._id] !== '[Question Skipped]')
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for culture profile analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/culture-profile`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Culture Profile API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json(); 

      // Handle the direct API response structure
      const processedData = result.cultureProfile ? result : { cultureProfile: result }; 

      return processedData;

    } catch (error) {
      console.error('💥 Error generating culture profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const hasAnswers = questions.some(q => userAnswers[q._id] && userAnswers[q._id].trim()); 
    if (!cultureProfileData && hasAnswers && !isGenerating && !isRegenerating) { 
      generateCultureProfile();
    }
  }, [questions, userAnswers, cultureProfileData]);

  // Handle regeneration - same pattern as other components in business page
  const handleRegenerate = async () => { 
    if (onRegenerate) { 
      onRegenerate(); 
      await generateCultureProfile();
    }
  };

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
  if (isGenerating || isRegenerating) {
    return (
      <div className="culture-profile">
        <div className="loading-state">
          <Loader size={32} className="spinner" />
          <h3>Analyzing Organizational Culture</h3>
          <p>Evaluating culture values, work style, and organizational fit...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !cultureProfileData) {
    return (
      <div className="culture-profile">
        <div className="error-state">
          <h3>Unable to Generate Culture Profile</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} disabled={!canRegenerate} className="btn-retry">
            <RefreshCw size={16} />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!cultureProfileData?.cultureProfile && !cultureProfileData?.values) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="culture-profile">
        <div className="cs-header">
          <div className="cs-title-section">
            <Users size={24} />
            <h2 className='cs-title'>
              Organizational Culture Profile
            </h2> 
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Organizational Culture Profile"
            size="medium"
            buttonText="Generate"
          />
        </div>

        <div className="empty-state">
          <Users size={48} />
          <h3>Organizational Culture Profile</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate your organizational culture analysis.`
              : "Organizational culture analysis will be generated automatically after completing the essential phase."
            }
          </p>
        </div>
      </div>
    );
  }

  // Handle both wrapped and direct response structures
  const cultureProfile = cultureProfileData?.cultureProfile || cultureProfileData;
 

  return (
    <div className="porters-container">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-title-section">
          <Users size={24} />
          <div>
            <h2 className='cs-title'>
              Organizational Culture Profile
            </h2>
          </div>
        </div>
        {canRegenerate && (
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Organizational Culture Profile"
            size="medium"
          />
        )}
      </div>

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