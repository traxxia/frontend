import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Target, AlertTriangle, Activity, Clock, RefreshCw, Loader, TrendingUp } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const PestelAnalysis = ({
  pestelData,
  businessName = "Your Business",
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  questions = [],
  userAnswers = {},
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    factors: true,
    actions: true,
    monitoring: true,
    improvements: true
  });

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.pestel;

    await checkMissingQuestionsAndRedirect(
      'pestel',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the pestel data is empty/incomplete
  const isPestelDataIncomplete = (data) => {
    if (!data) return true;

    // Handle nested structure
    const analysis = data.pestel_analysis || data;

    // Check if factor_summary is empty or null
    if (!analysis.factor_summary || Object.keys(analysis.factor_summary).length === 0) return true;

    // Check if any critical fields are null/undefined
    const criticalFields = ['executive_summary', 'strategic_recommendations'];
    const hasNullFields = criticalFields.some(field => analysis[field] === null || analysis[field] === undefined);

    return hasNullFields;
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle loading state
  if (isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating PESTEL Analysis...</span>
        </div>
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!pestelData || Array.isArray(pestelData) || isPestelDataIncomplete(pestelData)) {
    return (
      <div className="porters-container">

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="pestel"
          analysisDisplayName="PESTEL Analysis"
          icon={BarChart3}
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

  // Handle nested structure - check if data is wrapped in pestel_analysis
  const analysis = pestelData.pestel_analysis || pestelData;

  return (
    <div className="porters-container pestel-container" data-analysis-type="pestel"
      data-analysis-name="PESTEL Analysis"
      data-analysis-order="7">

      {/* PESTEL Factors Section */}
      {analysis.factor_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('factors')}>
            <h3>PESTEL Factors Analysis</h3>
            {expandedSections.factors ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.factors && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Strategic Priority</th>
                    <th>Total Mentions</th>
                    <th>High Impact Count</th>
                    <th>Key Themes</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.factor_summary).map(([factor, data]) => (
                    <tr key={factor}>
                      <td>
                        <div className="force-name">
                          <span>{factor.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>{data?.strategic_priority || 'N/A'} </td>
                      <td>{data?.total_mentions || 0}</td>
                      <td>{data?.high_impact_count || 0}</td>
                      <td>
                        <div className="forces-tags">
                          {(data?.key_themes || []).map((theme, index) => (
                            <span key={index} className="force-tag">{theme}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Key Improvements Section */}
      {analysis.key_improvements && Array.isArray(analysis.key_improvements) && analysis.key_improvements.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('improvements')}>
            <h3>Key Improvements</h3>
            {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.improvements && (
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  {analysis.key_improvements.map((improvement, index) => (
                    <tr key={index}>
                      <td>
                        <div className="force-name">
                          <TrendingUp size={16} />
                          <span>{improvement}</span>
                        </div>
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

export default PestelAnalysis;