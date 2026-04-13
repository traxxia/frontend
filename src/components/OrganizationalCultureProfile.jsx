import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader, Users, TrendingUp, Target, BarChart3, ChevronDown, ChevronRight } from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { useAnalysisStore } from '../store';
import { useTranslation } from "../hooks/useTranslation";
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import "../styles/EssentialPhase.css";

const OrganizationalCultureProfile = ({
  questions = [],
  userAnswers = {},
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  cultureProfileData: propCultureProfileData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const { t } = useTranslation();
  
  // Use Zustand store
  const { 
    cultureProfileData: storeCultureProfileData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis 
  } = useAnalysisStore();

  const isRegenerating = propIsRegenerating || isTypeRegenerating('cultureProfile');

  // Normalize data from store or props
  const cultureProfile = useMemo(() => {
    const rawData = propCultureProfileData || storeCultureProfileData;
    if (!rawData) return null;
    return rawData.cultureProfile || rawData;
  }, [propCultureProfileData, storeCultureProfileData]);

  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    wordcloud: true,
    culturemap: true,
    overview: true,
    workstyle: true,
    metrics: true,
    fit: true
  });

  const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  }, [onRedirectToBrief]);

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.cultureProfile || {
      displayName: 'Organizational Culture Profile Analysis',
      customMessage: 'Answer more questions to unlock detailed organizational culture profile analysis'
    };
    
    await checkMissingQuestionsAndRedirect(
      'cultureProfile', 
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isCultureProfileDataIncomplete = useCallback((data) => {
    if (!data) return true;
    if (!data.cultureType || data.cultureType.trim() === '') return true;
    if (!data.values || data.values.length === 0) return true;
    if (!data.behaviors || data.behaviors.length === 0) return true;
    return false;
  }, []);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

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
        await regenerateIndividualAnalysis('cultureProfile', questions, userAnswers, selectedBusinessId);
      } catch (err) {
        setError(err.message || 'Failed to generate analysis');
      }
    }
  }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

  const WordCloud = React.memo(({ values = [], behaviors = [] }) => {
    const allWords = [...values, ...behaviors];
    if (allWords.length === 0) return null;

    const wordSizes = allWords.map((word, index) => ({
      word,
      size: Math.random() * 20 + 14,
      type: index < values.length ? 'value' : 'behavior'
    }));

    return (
      <div className="word-cloud">
        {wordSizes.map((item, index) => (
          <span key={index} className={`word-cloud-item ${item.type}`}>
            {item.word}
          </span>
        ))}
      </div>
    );
  });

  const CultureMap = React.memo(({ cultureType, cultureFit = {} }) => {
    const quadrants = [
      { name: 'Clan', position: { top: '20%', left: '20%' }, color: '#10b981' },
      { name: 'Adhocracy', position: { top: '20%', right: '20%' }, color: '#f59e0b' },
      { name: 'Market', position: { bottom: '20%', right: '20%' }, color: '#ef4444' },
      { name: 'Hierarchy', position: { bottom: '20%', left: '20%' }, color: '#3b82f6' }
    ];

    const currentQuadrant = quadrants.find(q => q.name === cultureType) || quadrants[0];

    return (
      <div className="culture-map">
        <div className="culture-map-container">
          <div className="grid-line horizontal"></div>
          <div className="grid-line vertical"></div>
          <div className="axis-label top">Flexible & Adaptable</div>
          <div className="axis-label bottom">Stable & Controlled</div>
          <div className="axis-label left">Internal Focus</div>
          <div className="axis-label right">External Focus</div>

          {quadrants.map((quadrant, index) => (
            <div key={index} className={`quadrant ${quadrant.name.toLowerCase()} ${cultureType === quadrant.name ? 'active' : ''}`} style={quadrant.position}>
              <div className="quadrant-label" style={{ color: quadrant.color }}>{quadrant.name}</div>
            </div>
          ))}

          <div className="current-position" style={{ ...currentQuadrant.position, backgroundColor: currentQuadrant.color }}>
            <div className="position-dot"></div>
            <div className="position-label">Current</div>
          </div>
        </div>

        {Object.keys(cultureFit).length > 0 && (
          <div className="culture-fit-indicators">
            {Object.entries(cultureFit).map(([area, fit]) => (
              <div key={area} className="fit-indicator">
                <span className="fit-area">{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="fit-bar">
                  <div className={`fit-level ${fit.toLowerCase()}`} style={{ width: fit === 'high' ? '80%' : fit === 'medium' ? '50%' : '20%' }}></div>
                </div>
                <span className={`fit-label ${fit.toLowerCase()}`}>{fit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });

  const getIntensityColor = (value) => {
    const level = value?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low') || level.includes('weak')) return 'low-intensity';
    return 'medium-intensity';
  };

  if (isRegenerating) {
    return (
      <div className="culture-profile">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating organizational culture profile analysis...</span>
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
          title="Organizational Culture Profile Analysis Error"
        />
      );
    }

    if (!cultureProfile || isCultureProfileDataIncomplete(cultureProfile)) {
      return (
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
      );
    }

    return (
      <div className="porters-container"> 
        {/* Word Cloud Section */}
        {(cultureProfile.values?.length > 0 || cultureProfile.behaviors?.length > 0) && (
          <div className="section-container">
            <div className="section-header" onClick={() => toggleSection('wordcloud')}>
              <h3><BarChart3 size={20} />Key Cultural Values & Behaviors</h3>
              {expandedSections.wordcloud ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {expandedSections.wordcloud && (
              <div className="table-container">
                <WordCloud values={cultureProfile.values || []} behaviors={cultureProfile.behaviors || []} />
              </div>
            )}
          </div>
        )}

        {/* Culture Map Section */}
        {cultureProfile.cultureType && (
          <div className="section-container">
            <div className="section-header" onClick={() => toggleSection('culturemap')}>
              <h3><Target size={20} />Culture Map: Current Position & Fit Assessment</h3>
              {expandedSections.culturemap ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {expandedSections.culturemap && (
              <div className="table-container">
                <CultureMap cultureType={cultureProfile.cultureType} cultureFit={cultureProfile.cultureFit || {}} />
              </div>
            )}
          </div>
        )}

        {/* Culture Overview Table */}
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('overview')}>
            <h3>Culture Overview</h3>
            {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          {expandedSections.overview && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Attribute</th><th>Current State</th><th>Assessment</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Culture Type</strong></td>
                    <td>{cultureProfile.cultureType}</td>
                    <td><span className="type-badge">{cultureProfile.cultureType}</span></td>
                  </tr>
                  {cultureProfile.values?.length > 0 && (
                    <tr>
                      <td><strong>Core Values</strong></td>
                      <td>{cultureProfile.values.slice(0, 3).join(', ')}</td>
                      <td><span className="status-badge high-intensity">{cultureProfile.values.length} Values Identified</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Work Style Analysis Table */}
        {cultureProfile.workStyle && Object.keys(cultureProfile.workStyle).length > 0 && (
          <div className="section-container">
            <div className="section-header" onClick={() => toggleSection('workstyle')}>
              <h3><TrendingUp size={20} />Work Style Analysis</h3>
              {expandedSections.workstyle ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {expandedSections.workstyle && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Work Style Attribute</th><th>Current Approach</th><th>Impact Level</th></tr></thead>
                  <tbody>
                    {Object.entries(cultureProfile.workStyle).map(([key, value]) => (
                      <tr key={key}>
                        <td><strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                        <td>{value}</td>
                        <td><span className={`status-badge ${getIntensityColor(value)}`}>{value}</span></td>
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
              <h3><Target size={20} />Employee Metrics & Performance</h3>
              {expandedSections.metrics ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {expandedSections.metrics && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Metric</th><th>Value</th><th>Performance</th></tr></thead>
                  <tbody>
                    {Object.entries(cultureProfile.employeeMetrics).map(([key, value]) => (
                      <tr key={key}>
                        <td><strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                        <td>{typeof value === 'number' && key.includes('Percentage') ? `${value}%` : value}</td>
                        <td><span className={`status-badge ${getIntensityColor(String(value))}`}>{value}</span></td>
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

  return (
    <div className="porters-container"> 
      {renderContent()}
    </div>
  );
};

export default React.memo(OrganizationalCultureProfile);