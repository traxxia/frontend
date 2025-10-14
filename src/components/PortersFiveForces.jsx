import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader, AlertTriangle, Users, DollarSign, TrendingUp, Building, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const PortersFiveForces = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  portersData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    forces: true,
    competitors: true,
    recommendations: true,
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
    const analysisConfig = ANALYSIS_TYPES.porters;

    await checkMissingQuestionsAndRedirect(
      'porters',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the porters data is empty/incomplete
  const isPortersDataIncomplete = (data) => {
    if (!data) return true;

    // Check if five_forces_analysis is empty or null
    if (!data.five_forces_analysis || Object.keys(data.five_forces_analysis).length === 0) return true;

    // Check if any critical fields are null/undefined
    const criticalFields = ['executive_summary', 'competitive_landscape'];
    const hasNullFields = criticalFields.some(field => data[field] === null || data[field] === undefined);

    return hasNullFields;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      setError(null); // Clear any existing errors
      onRegenerate();
    } else {
      setPortersAnalysisData(null);
      setError(null);
    }
  };

  // Handle retry for error state
  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Update data when prop changes
  useEffect(() => {
    if (portersData && portersData !== portersAnalysisData) {
      setPortersAnalysisData(portersData);
      setError(null); // Clear errors when new data comes in
      if (onDataGenerated) {
        onDataGenerated(portersData);
      }
    }
  }, [portersData]);

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (portersData) {
      setPortersAnalysisData(portersData);
      setError(null);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Parse the Porter's analysis data
  const parsePortersData = (data) => {
    if (!data) return null;

    if (data.portersAnalysis) {
      return data.portersAnalysis;
    }

    if (data.porter_analysis) {
      return data.porter_analysis;
    }

    return data;
  };

  const getIntensityColor = (intensity) => {
    const level = intensity?.toLowerCase() || '';
    if (level.includes('high') || level.includes('strong')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low') || level.includes('weak')) return 'low-intensity';
    return 'medium-intensity';
  };

  const getForceIcon = (forceName) => {
    const name = forceName?.toLowerCase() || '';
    if (name.includes('supplier')) return <Building size={16} />;
    if (name.includes('buyer') || name.includes('customer')) return <Users size={16} />;
    if (name.includes('rivalry') || name.includes('competition')) return <TrendingUp size={16} />;
    if (name.includes('substitute')) return <ArrowRight size={16} />;
    if (name.includes('threat') || name.includes('new entrant')) return <AlertTriangle size={16} />;
    return <Shield size={16} />;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating Porter's Five Forces analysis..."
              : "Generating Porter's Five Forces analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  // Error state - UPDATED: Using AnalysisError component
  if (error) {
    return (
      <div className="porters-container">
        <AnalysisError 
          error={error}
          onRetry={handleRetry}
          title="Porter's Five Forces Analysis Error"
        />
      </div>
    );
  }

  const parsedData = parsePortersData(portersAnalysisData);

  // Check if data is incomplete and show missing questions checker
  if (!parsedData || isPortersDataIncomplete(parsedData)) {
    return (
      <div className="porters-container">

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="porters"
          analysisDisplayName="Porter's Five Forces Analysis"
          icon={Shield}
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
    <div className="porters-container" data-analysis-type="porters"
      data-analysis-name="Porter's Five Forces"
      data-analysis-order="6">

      {/* Executive Summary Table */}
      {parsedData.executive_summary && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('executive')}>
            <h3>Executive Summary</h3>
            {expandedSections.executive ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.executive !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.executive_summary.industry_attractiveness && (
                    <tr>
                      <td><div className="force-name">Industry Attractiveness</div></td>
                      <td>{parsedData.executive_summary.industry_attractiveness}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.industry_attractiveness)}`}>
                          {parsedData.executive_summary.industry_attractiveness}
                        </span>
                      </td>
                    </tr>
                  )}
                  {parsedData.executive_summary.overall_competitive_intensity && (
                    <tr>
                      <td><div className="force-name">Competitive Intensity</div></td>
                      <td>{parsedData.executive_summary.overall_competitive_intensity}</td>
                      <td>
                        <span className={`status-badge ${getIntensityColor(parsedData.executive_summary.overall_competitive_intensity)}`}>
                          {parsedData.executive_summary.overall_competitive_intensity}
                        </span>
                      </td>
                    </tr>
                  )}
                  {parsedData.executive_summary.competitive_position && (
                    <tr>
                      <td><div className="force-name">Competitive Position</div></td>
                      <td>{parsedData.executive_summary.competitive_position}</td>
                      <td>-</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {parsedData.executive_summary.key_competitive_forces?.length > 0 && (
                <div className="subsection">
                  <h4>Key Competitive Forces</h4>
                  <div className="forces-tags">
                    {parsedData.executive_summary.key_competitive_forces.map((force, index) => (
                      <span key={index} className="force-tag">{force}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Five Forces Analysis Table */}
      {parsedData.five_forces_analysis && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('forces')}>
            <h3>Five Forces Analysis</h3>
            {expandedSections.forces ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.forces !== false && (
            <div className="table-container">
              <table className="data-table forces-table">
                <thead>
                  <tr>
                    <th>Force</th>
                    <th>Intensity</th>
                    {/* <th>Score</th> */}
                    <th>Key Factors</th>
                    <th>Additional Details</th>
                    <th>Strategic Implications</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(parsedData.five_forces_analysis).map(([forceKey, forceData]) => (
                    <tr key={forceKey}>
                      <td>
                        <div className="force-name">
                          {getForceIcon(forceKey)}
                          <span>{forceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                      </td>
                      <td>
                        {forceData.intensity && (
                          <span className={`status-badge ${getIntensityColor(forceData.intensity)}`}>
                            {forceData.intensity}
                          </span>
                        )}
                      </td>
                      {/* <td>
                        {forceData.score && <span className="score-badge">{forceData.score}/10</span>}
                      </td> */}
                      <td>
                        <div className="factors-cell">
                          {forceData.key_factors?.map((factor, index) => (
                            <div key={index} className="factor-item">
                              <strong>{factor.factor}</strong>
                              {factor.impact && (
                                <span className={`factor-impact ${factor.impact?.toLowerCase()}`}>
                                  Impact: {factor.impact}
                                </span>
                              )}
                              <span className="factor-desc">{factor.description}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="additional-details">
                          {forceData.entry_barriers && (
                            <div>
                              <strong>Entry Barriers:</strong>
                              <ul>
                                {forceData.entry_barriers.map((barrier, idx) => (
                                  <li key={idx}>{barrier}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {forceData.supplier_concentration && (
                            <div><strong>Supplier Concentration:</strong> {forceData.supplier_concentration}</div>
                          )}
                          {forceData.switching_costs && (
                            <div><strong>Switching Costs:</strong> {forceData.switching_costs}</div>
                          )}
                          {forceData.buyer_concentration && (
                            <div><strong>Buyer Concentration:</strong> {forceData.buyer_concentration}</div>
                          )}
                          {forceData.product_differentiation && (
                            <div><strong>Product Differentiation:</strong> {forceData.product_differentiation}</div>
                          )}
                          {forceData.substitute_availability && (
                            <div><strong>Substitute Availability:</strong> {forceData.substitute_availability}</div>
                          )}
                          {forceData.competitor_concentration && (
                            <div><strong>Competitor Concentration:</strong> {forceData.competitor_concentration}</div>
                          )}
                          {forceData.industry_growth && (
                            <div><strong>Industry Growth:</strong> {forceData.industry_growth}</div>
                          )}
                        </div>
                      </td>
                      <td className="implications-cell">
                        {forceData.strategic_implications}
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
      {parsedData.key_improvements && Array.isArray(parsedData.key_improvements) && parsedData.key_improvements.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('improvements')}>
            <h3>Key Improvements</h3>
            {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>

          {expandedSections.improvements && (
            <div className="table-container">
              <table className="data-table">
                <tbody>
                  {parsedData.key_improvements.map((improvement, index) => (
                    <tr key={index}>
                      <td>
                        <div className="force-name">
                          <TrendingUp size={16} />
                          {improvement}
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

export default PortersFiveForces;