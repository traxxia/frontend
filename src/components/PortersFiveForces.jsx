import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Shield, Loader, AlertTriangle, Users, TrendingUp, Building, ArrowRight, ChevronDown, ChevronRight, Package, ShoppingCart, RefreshCw, Swords } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import '../styles/streaming.css';
import LiveStreamHandler from './LiveStreamHandler';


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
  onRedirectToBrief,
  streamingText = '',
  isStreamingActive = false,
  onStreamingMount,
  activeSection = null
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    forces: true,
    competitors: true,
    recommendations: true,
    monitoring: true,
    improvements: true
  });


  const improvementsRef = useRef(null);
  const contentRef = useRef(null);

  const [streamedData, setStreamedData] = useState({
  executive_summary: {},
  five_forces_analysis: {},
  key_improvements: []
  });
  const [isStreamingContent, setIsStreamingContent] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);

  const handleStreamUpdate = (data) => setStreamedData(data);
  // ✅ This stays as a normal function
  const handleStreamComplete = () => {
    setIsStreamingContent(false);
    setTimeout(() => {
      if (activeSection === 'porters' && improvementsRef.current) {
        improvementsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  // ✅ This should be OUTSIDE the function, after your other useEffects
  // 🔄 Smooth continuous slow scroll during Porter's streaming
  useEffect(() => {
    if (activeSection !== 'porters' || !isStreamingActive) return;

    let lastTime = 0;
    const scrollSpeed = 0.3; // 👈 Lower = slower scroll (try 0.3 to 0.6 for smooth live scroll)
    let animationFrame;

    const scrollSmoothly = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      // Scroll only every few milliseconds for smoothness
      if (delta > 16) { // about 60fps
        const portersCard = document.getElementById('porters');
        if (portersCard) {
          portersCard.scrollBy({
            top: scrollSpeed, // 👈 speed control
            behavior: 'smooth',
          });
        }
        lastTime = timestamp;
      }

      animationFrame = requestAnimationFrame(scrollSmoothly);
    };

    animationFrame = requestAnimationFrame(scrollSmoothly);

    return () => cancelAnimationFrame(animationFrame);
  }, [activeSection, isStreamingActive, streamedData]);

  useEffect(() => {
  const shouldScroll =
    activeSection === 'porters' &&
    ((isStreamingContent && displayProgress === 0) ||
     Object.keys(streamedData.executive_summary).length > 0);

    if (shouldScroll) {
      const portersCard = document.getElementById('porters');
      if (portersCard) {
        requestAnimationFrame(() => {
          portersCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    }
  }, [activeSection, isStreamingContent, streamedData.executive_summary, displayProgress]);

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

  const isPortersDataIncomplete = (data) => {
    if (!data) return true;
    if (!data.five_forces_analysis || Object.keys(data.five_forces_analysis).length === 0) return true;
    const criticalFields = ['executive_summary'];
    const hasNullFields = criticalFields.some(field => data[field] === null || data[field] === undefined);
    return hasNullFields;
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const parsePortersData = (data) => {
    if (!data) return null;
    if (data.portersAnalysis) return data.portersAnalysis;
    if (data.porter_analysis) return data.porter_analysis;
    return data;
  };

  const handleRegenerate = async () => {
    
    setDisplayProgress(0);
    setStreamedData({
      executive_summary: {},
      five_forces_analysis: {},
      key_improvements: []
    });
    setIsStreamingContent(false);
    setError(null);
    
    if (onRegenerate) {
      onRegenerate();
    } else {
      setPortersAnalysisData(null);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  useEffect(() => {
    if (portersData) {
      setPortersAnalysisData(parsePortersData(portersData));
    }
  }, [portersData]);

  const getIntensityColor = (intensity) => {
    if (!intensity) return '';
    const intensityLower = intensity.toLowerCase();
    if (intensityLower.includes('high')) return 'intensity-high';
    if (intensityLower.includes('moderate') || intensityLower.includes('medium')) return 'intensity-moderate';
    if (intensityLower.includes('low')) return 'intensity-low';
    return '';
  };

  const getForceIcon = (forceKey) => {
    const iconMap = {
      threat_of_new_entrants: <Building size={18} />,
      bargaining_power_of_suppliers: <Package size={18} />,
      bargaining_power_of_buyers: <ShoppingCart size={18} />,
      threat_of_substitutes: <RefreshCw size={18} />,
      threat_of_substitute_products: <RefreshCw size={18} />,
      competitive_rivalry: <Swords size={18} />
    };
    return iconMap[forceKey] || <Shield size={18} />;
  };

  const parsedData = parsePortersData(portersAnalysisData);

  if (error) {
    return (
      <AnalysisError
        error={error}
        onRetry={handleRetry}
        analysisType="Porter's Five Forces"
      />
    );
  }

  const showTypingEffect = isStreamingContent || displayProgress < 100;
  const hasAnalysisData = parsedData && !isPortersDataIncomplete(parsedData);

  if (!hasAnalysisData && !isStreamingActive && !isRegenerating && !isStreamingContent) {
    return (
      <AnalysisEmptyState
        analysisType="Porter's Five Forces"
        description="Analyze competitive forces in your industry to understand market dynamics and strategic positioning."
        icon={<Shield size={48} />}
        onGenerate={handleMissingQuestionsCheck}
        isGenerating={false}
      />
    );
  }

  return (
    <>
      <LiveStreamHandler
        parsedData={parsePortersData(portersAnalysisData)}
        isStreamingActive={isStreamingActive}
        activeSection={activeSection}
        onStreamingMount={onStreamingMount}
        onStreamUpdate={handleStreamUpdate}
        onStreamComplete={handleStreamComplete}
      />
    <div id="porters"  className={`porters-container ${isStreamingContent ? 'is-streaming' : ''}`} data-analysis-type="porters"
      data-analysis-name="Porter's Five Forces"
      data-analysis-order="6"
      style={{ position: 'relative' }}>

      <style>
        {`
          @keyframes fadeInRow {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInTag {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style> 

      <div ref={contentRef}>
        {streamedData.executive_summary && Object.keys(streamedData.executive_summary).length > 0 && (
          <div className="section-container" style={{ animation: 'slideIn 0.4s ease-out' }}>
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
                    {streamedData.executive_summary.industry_attractiveness && (
                      <tr style={{ animation: 'fadeInRow 0.5s ease-in forwards', opacity: 0 }}>
                        <td><div className="force-name">Industry Attractiveness</div></td>
                        <td>{streamedData.executive_summary.industry_attractiveness}</td>
                        <td>
                          <span className={`status-badge ${getIntensityColor(streamedData.executive_summary.industry_attractiveness)}`}>
                            {streamedData.executive_summary.industry_attractiveness}
                          </span>
                        </td>
                      </tr>
                    )}
                    {streamedData.executive_summary.overall_competitive_intensity && (
                      <tr style={{ animation: 'fadeInRow 0.5s ease-in forwards', animationDelay: '0.1s', opacity: 0 }}>
                        <td><div className="force-name">Competitive Intensity</div></td>
                        <td>{streamedData.executive_summary.overall_competitive_intensity}</td>
                        <td>
                          <span className={`status-badge ${getIntensityColor(streamedData.executive_summary.overall_competitive_intensity)}`}>
                            {streamedData.executive_summary.overall_competitive_intensity}
                          </span>
                        </td>
                      </tr>
                    )}
                    {streamedData.executive_summary.competitive_position && (
                      <tr style={{ animation: 'fadeInRow 0.5s ease-in forwards', animationDelay: '0.2s', opacity: 0 }}>
                        <td><div className="force-name">Competitive Position</div></td>
                        <td>{streamedData.executive_summary.competitive_position}</td>
                        <td>-</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {streamedData.executive_summary.key_competitive_forces?.length > 0 && (
                  <div className="subsection" style={{ animation: 'fadeInRow 0.5s ease-in forwards', animationDelay: '0.3s', opacity: 0 }}>
                    <h4>Key Competitive Forces</h4>
                    <div className="forces-tags">
                      {streamedData.executive_summary.key_competitive_forces.map((force, index) => (
                        <span key={index} className="force-tag" style={{ 
                          animation: 'fadeInTag 0.3s ease-in forwards', 
                          animationDelay: `${0.4 + index * 0.1}s`,
                          opacity: 0 
                        }}>{force}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {streamedData.five_forces_analysis && Object.keys(streamedData.five_forces_analysis).length > 0 && (
          <div className="section-container" style={{ animation: 'slideIn 0.4s ease-out', animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
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
                      <th>Key Factors</th>
                      <th>Additional Details</th>
                      <th>Strategic Implications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(streamedData.five_forces_analysis).map(([forceKey, forceData], index) => (
                      <tr key={forceKey} style={{ 
                        animation: 'fadeInRow 0.6s ease-in forwards', 
                        animationDelay: `${0.6 + index * 0.2}s`,
                        opacity: 0 
                      }}>
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
                        <td>
                          <div className="factors-cell">
                            {forceData.key_factors?.map((factor, idx) => (
                              <div key={idx} className="factor-item">
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
                            {forceData.entry_barriers && forceData.entry_barriers.length > 0 && (
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

        {streamedData.key_improvements && streamedData.key_improvements.length > 0 && (
  <>
    <div ref={improvementsRef} className="section-header" onClick={() => toggleSection('improvements')}>
      <h3>Key Improvements</h3>
      {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
    </div>

    {expandedSections.improvements && (
      <div className="table-container">
        <table className="data-table">
          <tbody>
            {streamedData.key_improvements.map((improvement, index) => (
              <tr
                key={index}
                style={{
                  animation: 'fadeInRow 0.5s ease-in forwards',
                  animationDelay: `${1.6 + index * 0.15}s`,
                  opacity: 0,
                }}
              >
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
  </>
)}

      </div>
    </div>
     </>
  );
};

export default PortersFiveForces;