import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Shield, Loader, AlertTriangle, Users, TrendingUp, Building, ArrowRight, ChevronDown, ChevronRight, Package, ShoppingCart, RefreshCw, Swords } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import '../styles/streaming.css';

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
  onStreamingMount
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

  const [displayProgress, setDisplayProgress] = useState(0);
  const [streamedData, setStreamedData] = useState({
    executive_summary: {},
    five_forces_analysis: {},
    key_improvements: []
  });
  const [isStreamingContent, setIsStreamingContent] = useState(false);
  
  const streamingDataRef = useRef(null);
  const displayIndexRef = useRef(0);
  const intervalRef = useRef(null);
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const streamTimeoutRef = useRef(null);
  const processedDataRef = useRef(null);
  const contentRef = useRef(null);

  console.log('🔵 Porter Render:', {
    portersData: !!portersData,
    portersAnalysisData: !!portersAnalysisData,
    isStreamingActive,
    isStreamingContent,
    displayProgress,
    processedData: processedDataRef.current,
    streamedDataKeys: {
      executive: Object.keys(streamedData.executive_summary).length,
      forces: Object.keys(streamedData.five_forces_analysis).length,
      improvements: streamedData.key_improvements.length
    }
  });

  useEffect(() => {
    if (isStreamingContent && contentRef.current) {
      const portersCard = document.getElementById('porters');
      if (portersCard) {
        portersCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isStreamingContent]);

  useEffect(() => {
    if (Object.keys(streamedData.executive_summary).length > 0 && contentRef.current) {
      const portersCard = document.getElementById('porters');
      if (portersCard) {
        setTimeout(() => {
          portersCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    }
  }, [streamedData.executive_summary]);

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
    console.log('🔍 Parsing porters data:', data);
    if (!data) return null;
    if (data.portersAnalysis) return data.portersAnalysis;
    if (data.porter_analysis) return data.porter_analysis;
    return data;
  };

  const startTypingAnimation = useCallback(() => {
    if (intervalRef.current || hasStartedRef.current) {
      console.log('⏭️ Animation already started');
      return;
    }

    console.log('✅ Starting typing animation NOW');
    hasStartedRef.current = true;
    
    if (isMountedRef.current) {
      displayIndexRef.current = 0;
      setDisplayProgress(0);
    }

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      displayIndexRef.current += 5;
      
      if (displayIndexRef.current >= 100) {
        displayIndexRef.current = 100;
        setDisplayProgress(100);
        
        console.log('✅ Animation complete');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        hasStartedRef.current = false;
      } else {
        setDisplayProgress(displayIndexRef.current);
      }

      if (displayIndexRef.current % 20 === 0) {
        console.log(`⌨️ Typing progress: ${displayIndexRef.current}%`);
      }
    }, 100);

    console.log('🎯 Interval created:', intervalRef.current);
  }, []);

  const streamTableContent = useCallback(async (parsedData) => {
    if (!parsedData) {
      console.log('❌ No parsed data to stream');
      return;
    }

    if (processedDataRef.current === parsedData) {
      console.log('⏭️ Already processed this data, skipping');
      return;
    }

    console.log('🎬 Starting table content streaming with data:', parsedData);
    processedDataRef.current = parsedData;
    setIsStreamingContent(true);

    setStreamedData({
      executive_summary: {},
      five_forces_analysis: {},
      key_improvements: []
    });

    startTypingAnimation();

    if (parsedData.executive_summary) {
      console.log('📊 Streaming executive summary...');
      const execKeys = Object.keys(parsedData.executive_summary);
      console.log('Executive keys:', execKeys);
      
      for (let i = 0; i < execKeys.length; i++) {
        if (!isMountedRef.current) break;
        
        await new Promise(resolve => {
          streamTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`✅ Adding executive key: ${execKeys[i]}`);
              setStreamedData(prev => ({
                ...prev,
                executive_summary: {
                  ...prev.executive_summary,
                  [execKeys[i]]: parsedData.executive_summary[execKeys[i]]
                }
              }));
            }
            resolve();
          }, 300);
        });
      }
    } else {
      console.log('⚠️ No executive_summary found in parsed data');
    }

    if (parsedData.five_forces_analysis) {
      console.log('📊 Streaming five forces analysis...');
      const forceKeys = Object.keys(parsedData.five_forces_analysis);
      console.log('Force keys:', forceKeys);
      
      for (let i = 0; i < forceKeys.length; i++) {
        if (!isMountedRef.current) break;
        
        await new Promise(resolve => {
          streamTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`✅ Adding force: ${forceKeys[i]}`);
              setStreamedData(prev => ({
                ...prev,
                five_forces_analysis: {
                  ...prev.five_forces_analysis,
                  [forceKeys[i]]: parsedData.five_forces_analysis[forceKeys[i]]
                }
              }));
            }
            resolve();
          }, 500);
        });
      }
    } else {
      console.log('⚠️ No five_forces_analysis found in parsed data');
    }

    if (parsedData.key_improvements && Array.isArray(parsedData.key_improvements)) {
      console.log('📊 Streaming key improvements...');
      console.log('Improvements:', parsedData.key_improvements);
      
      for (let i = 0; i < parsedData.key_improvements.length; i++) {
        if (!isMountedRef.current) break;
        
        await new Promise(resolve => {
          streamTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`✅ Adding improvement: ${parsedData.key_improvements[i]}`);
              setStreamedData(prev => ({
                ...prev,
                key_improvements: [...prev.key_improvements, parsedData.key_improvements[i]]
              }));
            }
            resolve();
          }, 300);
        });
      }
    } else {
      console.log('⚠️ No key_improvements found in parsed data');
    }

    console.log('✅ Table streaming complete');
    setIsStreamingContent(false);
  }, [startTypingAnimation]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (isStreamingActive && onStreamingMount) {
      console.log('🎤 Setting up streaming mount handler');
      const handleChunk = (newChunk) => {
        console.log('📥 Porter received chunk:', newChunk.length, newChunk.substring(0, 100));
        
        try {
          const parsed = JSON.parse(newChunk);
          console.log('✅ Parsed chunk successfully:', parsed);
          const porterData = parsed.porter_analysis || parsed;
          console.log('📦 Porter data extracted:', porterData);
          streamingDataRef.current = porterData;
          
          console.log('🚀 Triggering streaming from chunk');
          requestAnimationFrame(() => {
            streamTableContent(porterData);
          });
        } catch (e) {
          console.log('⚠️ Could not parse chunk as JSON yet:', e.message);
        }
      };
      
      onStreamingMount(handleChunk);
    } else {
      console.log('⏸️ Streaming not active or no mount handler');
    }
    
    return () => {
      console.log('🧹 Cleanup streaming mount');
    };
  }, [isStreamingActive, onStreamingMount, streamTableContent]);

  useEffect(() => {
    return () => {
      console.log('🛑 Component unmounting');
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
      hasStartedRef.current = false;
      processedDataRef.current = null;
    };
  }, []);

  const handleRegenerate = async () => {
    console.log('🔄 Regenerate');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    
    hasStartedRef.current = false;
    processedDataRef.current = null;
    streamingDataRef.current = null;
    displayIndexRef.current = 0;
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
    console.log('🔁 Retry');
    setError(null);
    if (onRegenerate) {
      onRegenerate();
    }
  };

  useEffect(() => {
    console.log('🔄 portersData changed:', {
      hasData: !!portersData,
      isStreaming: isStreamingActive,
      processedData: processedDataRef.current
    });
    
    if (portersData) {
      const parsed = parsePortersData(portersData);
      console.log('📦 Parsed new portersData:', parsed);
      
      if (parsed) {
        setPortersAnalysisData(parsed);
        
        console.log('🎬 Triggering streaming for new data');
        streamTableContent(parsed);
      }
    }
  }, [portersData, streamTableContent]);

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

  console.log('🎨 Render state:', {
    showTypingEffect,
    hasAnalysisData,
    isStreamingActive,
    isStreamingContent,
    displayProgress,
    hasStreamedExec: Object.keys(streamedData.executive_summary).length > 0,
    hasStreamedForces: Object.keys(streamedData.five_forces_analysis).length > 0,
    hasStreamedImprovements: streamedData.key_improvements.length > 0
  });

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
          <div className="section-container" style={{ animation: 'slideIn 0.4s ease-out', animationDelay: '1.5s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="section-header" onClick={() => toggleSection('improvements')}>
              <h3>Key Improvements</h3>
              {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>

            {expandedSections.improvements && (
              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    {streamedData.key_improvements.map((improvement, index) => (
                      <tr key={index} style={{ 
                        animation: 'fadeInRow 0.5s ease-in forwards', 
                        animationDelay: `${1.6 + index * 0.15}s`,
                        opacity: 0 
                      }}>
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
    </div>
  );
};

export default PortersFiveForces;