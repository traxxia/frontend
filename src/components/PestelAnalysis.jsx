import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, BarChart3, Loader, TrendingUp } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import LiveStreamHandler from "./LiveStreamHandler";
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

  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [activeSection, setActiveSection] = useState("factors");
  const [streamedData, setStreamedData] = useState(null);

  const isMounted = useRef(false);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) onRedirectToBrief(missingQuestionsData);
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

  const isPestelDataIncomplete = (data) => {
    if (!data) return true;
    const analysis = data.pestel_analysis || data;
    if (!analysis.factor_summary || Object.keys(analysis.factor_summary).length === 0) return true;

    const criticalFields = ['executive_summary', 'strategic_recommendations'];
    return criticalFields.some(field => analysis[field] == null);
  };

  const handleRegenerate = async () => {
    if (onRegenerate) onRegenerate();
  };

  /** ✅ Receive streamed data updates progressively */
  const handleStreamUpdate = (chunk) => {
    setStreamedData((prev) => ({
      ...prev,
      factor_summary: {
        ...(prev?.factor_summary || {}),
        ...(chunk.factor_summary || {}),
      },
      key_improvements: chunk.key_improvements || prev?.key_improvements || [],
    }));
  };

  /** ✅ Handle stream completion */
  const handleStreamComplete = () => {
    setIsStreamingActive(false);
  };

  /** ✅ Attach stream chunk handler */
  const handleStreamingMount = (handleChunk) => {
    // This will be connected to backend or real stream later
    // You can directly call handleChunk(chunk) whenever new data arrives
  };

  /** ✅ Auto-start streaming when valid data is loaded */
  useEffect(() => {
    if (!pestelData || Array.isArray(pestelData) || isPestelDataIncomplete(pestelData)) return;
    setIsStreamingActive(true);
  }, [pestelData]);

  /** ✅ Smooth auto-scroll while streaming */
  useEffect(() => {
    if (!isStreamingActive) return;
    const pestelCard = document.querySelector('.pestel-container');
    if (!pestelCard) return;

    let animationFrame;
    const scrollSmoothly = () => {
      pestelCard.scrollBy({ top: 0.3, behavior: 'smooth' });
      animationFrame = requestAnimationFrame(scrollSmoothly);
    };

    animationFrame = requestAnimationFrame(scrollSmoothly);
    return () => cancelAnimationFrame(animationFrame);
  }, [isStreamingActive]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /** ✅ Loading / Empty State */
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

  if (!pestelData || Array.isArray(pestelData) || isPestelDataIncomplete(pestelData)) {
    return (
      <div className="porters-container">
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

  /** ✅ Merge streamed data progressively */
  const analysis = pestelData.pestel_analysis || pestelData;
  const displayData = {
    ...analysis,
    factor_summary: streamedData?.factor_summary || analysis.factor_summary,
    key_improvements: streamedData?.key_improvements || analysis.key_improvements,
  };

  return (
    <>
      {/* ✅ Live Stream Handler Integration */}
      <LiveStreamHandler
        parsedData={pestelData?.pestel_analysis || pestelData}
        isStreamingActive={isStreamingActive}
        activeSection={activeSection}
        onStreamingMount={handleStreamingMount}
        onStreamUpdate={handleStreamUpdate}
        onStreamComplete={handleStreamComplete}
      />

      <div className="porters-container pestel-container" data-analysis-type="pestel">
        {/* --- PESTEL FACTORS --- */}
        {displayData.factor_summary && (
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
                    {Object.entries(displayData.factor_summary || {}).map(([factor, data], index) => (
                      <tr
                        key={factor}
                        style={{
                          opacity: 0,
                          animation: `fadeInRow 0.5s ease-in forwards`,
                          animationDelay: `${index * 0.4}s`
                        }}
                      >
                        <td><span>{factor.toUpperCase()}</span></td>
                        <td>{data?.strategic_priority || 'N/A'}</td>
                        <td>{data?.total_mentions || 0}</td>
                        <td>{data?.high_impact_count || 0}</td>
                        <td>
                          <div className="forces-tags">
                            {(data?.key_themes || []).map((theme, i) => (
                              <span
                                key={i}
                                className="force-tag"
                                style={{
                                  opacity: 0,
                                  animation: `fadeInTag 0.3s ease-in forwards`,
                                  animationDelay: `${0.6 + i * 0.2}s`
                                }}
                              >
                                {theme}
                              </span>
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

        {/* --- KEY IMPROVEMENTS --- */}
        {displayData.key_improvements && Array.isArray(displayData.key_improvements) && (
          <div className="section-container">
            <div className="section-header" onClick={() => toggleSection('improvements')}>
              <h3>Key Improvements</h3>
              {expandedSections.improvements ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>

            {expandedSections.improvements && (
              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    {displayData.key_improvements.map((improvement, index) => (
                      <tr
                        key={index}
                        style={{
                          opacity: 0,
                          animation: `fadeInRow 0.6s ease-in forwards`,
                          animationDelay: `${index * 0.4}s`
                        }}
                      >
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
    </>
  );
};

export default PestelAnalysis;