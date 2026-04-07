import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Info, Target, FileText, ListChecks, Loader2, Zap } from "lucide-react";
import { AnalysisApiService } from "../services/analysisApiService";
import "../styles/executiveSummary.css";
import { useTranslation } from "../hooks/useTranslation";

const ExecutiveSummary = ({ businessId, onStartOnboarding, refreshTrigger }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    ahaInsights: false,
    whereToCompete: false,
    howToCompete: false,
    topPriorities: false,
  });

  const [ahaData, setAhaData] = useState(null);

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const userRole = (
    sessionStorage.getItem("role") ||
    sessionStorage.getItem("userRole") ||
    ""
  ).toLowerCase();
  const isViewer = userRole === "viewer";
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setData(null); // Clear old data to show loader during refresh
    if (!businessId) {
      setLoading(false);
      return;
    }
    try {
      // Fetch both Executive Summary and PMF Insights (AHA)
      const [summaryResult, ahaResult] = await Promise.all([
        analysisService.getPMFExecutiveSummary(businessId),
        analysisService.getPMFAnalysis(businessId)
      ]);

      // Handle Executive Summary Data
      let summaryContent = summaryResult?.summary || summaryResult;
      if (summaryResult?.onboarding_data && !summaryContent.onboarding_data) {
        summaryContent = { ...summaryContent, onboarding_data: summaryResult.onboarding_data };
      }
      setData(summaryContent);

      // Handle AHA Data
      setAhaData(ahaResult);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId, refreshTrigger]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper to extract Aha Insights
  const getTopAhaInsights = () => {
    if (!ahaData) return [];
    let rawInsights = [];
    if (Array.isArray(ahaData)) {
      rawInsights = ahaData;
    } else if (ahaData.insights) {
      if (Array.isArray(ahaData.insights)) {
        rawInsights = ahaData.insights;
      } else if (ahaData.insights.insights && Array.isArray(ahaData.insights.insights)) {
        rawInsights = ahaData.insights.insights;
      }
    }
    return rawInsights.slice(0, 4); // Limit to top 3-4
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Loader2 className="text-primary animate-spin" />
        <span className="ms-2 text-muted">Loading executive summary...</span>
      </div>
    );
  }

  // Robust check for empty content
  const hasActualContent = data && (
    (data.top_priorities && Array.isArray(data.top_priorities) && data.top_priorities.length > 0) || 
    (data.topPriorities && Array.isArray(data.topPriorities) && data.topPriorities.length > 0) ||
    (data["Top Priorities"] && Array.isArray(data["Top Priorities"]) && data["Top Priorities"].length > 0) ||
    data.how_to_compete || 
    data.howToCompete ||
    (data.new_adjacencies_to_explore && Array.isArray(data.new_adjacencies_to_explore) && data.new_adjacencies_to_explore.length > 0) ||
    (data.newAdjacencies && Array.isArray(data.newAdjacencies) && data.newAdjacencies.length > 0)
  );

  if (!data || !hasActualContent) {
    return (
      <div className="bg-light py-5 text-center rounded-4 m-3 shadow-sm border">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "No executive summary available yet."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to generate this summary."}</p>
          {onStartOnboarding && !isViewer && (
            <button
              className="btn btn-primary rounded-pill px-5 py-2 fw-semibold"
              onClick={onStartOnboarding}
            >
              {t("startPMFOnboarding") || "Start PMF Onboarding"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Enhanced helper to find data regardless of snake_case or camelCase or Title Case
  const getSection = (key) => {
    if (!data) return null;
    return data[key] ||
      data[key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())] || // Title Case
      data[key.replace(/_/g, "")] || // No spaces
      data[key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')]; // camelCase
  };

  const whereToCompete = getSection('where_to_compete') || data;
  const howToCompete = getSection('how_to_compete');
  const topPriorities = getSection('top_priorities') || data.top_priorities || data.topPriorities || data["Top Priorities"];

  // Helper for nested access
  const getNested = (obj, path) => {
    return path.split('.').reduce((acc, part) => {
      if (!acc) return null;
      // Try snake_case, then Title Case with spaces
      return acc[part] || acc[part.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())] || acc[part.replace(/_/g, " ")];
    }, obj);
  };

  // Specific mappings for the provided JSON structure
  const differentiationLevers = howToCompete?.recommended_differentiation?.primary_lever || howToCompete?.differentiation_levers || howToCompete?.["Differentiation Levers"] || "N/A";
  const implications = howToCompete?.what_this_implies || howToCompete?.implies || howToCompete?.implications || howToCompete?.Implies;
  const excludes = howToCompete?.what_this_excludes || howToCompete?.excludes || howToCompete?.Excludes;
  const alternativeLevers = howToCompete?.alternative_levers || howToCompete?.["Alternative Levers"] || [];
  const newAdjacencies = whereToCompete?.new_adjacencies_to_explore || whereToCompete?.new_adjacencies || whereToCompete?.["New Adjacencies"];
  const existingAdjacencies = whereToCompete?.existing_adjacencies || whereToCompete?.["Existing Adjacencies"];

  const topAhaInsights = getTopAhaInsights();

  return (
    <div className="exc-executive-summary-container">
      <div className="exc-executive-content">
        {/* AHA INSIGHTS SECTION */}
        {topAhaInsights.length > 0 && (
          <div className="exc-section-card">
            <div className="exc-section-header" onClick={() => toggleSection("ahaInsights")}>
              <div className="exc-section-title-wrapper">
                <div className="exc-section-icon exc-aha-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="exc-section-title">{t("AHA Insights")}</h3>
                  <p className="exc-section-subtitle">
                    {t("Key strategic insights based on your onboarding")}
                  </p>
                </div>
              </div>
              <button className="exc-section-toggle">
                {expandedSections.ahaInsights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {expandedSections.ahaInsights && (
              <div className="exc-section-body">
                <div className="exc-aha-vertical-tiles">
                  {topAhaInsights.map((insight, idx) => (
                    <div key={idx} className="exc-aha-tile full-width">
                      <div className="exc-aha-tile-header">
                        <span className="exc-aha-tile-category">{insight.type || t("Insight")}</span>
                      </div>
                      <h5 className="exc-aha-tile-title">{insight.title}</h5>
                      <ul className="exc-aha-tile-details">
                        {(insight.details || insight.key_points || []).slice(0, 3).map((detail, dIdx) => (
                          <li key={dIdx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WHERE TO COMPETE */}
        <div className="exc-section-card">
          <div className="exc-section-header" onClick={() => toggleSection("whereToCompete")}>
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-where-icon">
                <Target size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">{t("WHERE TO COMPETE")}</h3>
                <p className="exc-section-subtitle">
                  {t("Current Core, Existing Adjacencies, and New Adjacencies to Explore")}
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.whereToCompete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {expandedSections.whereToCompete && (
            <div className="exc-section-body">
              {/* Current Core */}
              <div className="exc-subsection exc-current-core">
                <div className="exc-subsection-icon exc-blue">
                  <Target size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">{t("Current Core")}</h3>
                  <p className="exc-source-label">
                    <Info size={14} /> {t("Profit arenas inferred from your data")}
                  </p>
                  <p className="exc-content-text">
                    <strong>{t("Segments")}:</strong> {data?.onboarding_data?.customerSegment1 || data?.onboarding_data?.customerSegment2 || data?.onboarding_data?.customerSegment3 ? [data?.onboarding_data?.customerSegment1, data?.onboarding_data?.customerSegment2, data?.onboarding_data?.customerSegment3].filter(Boolean).join(", ") : "N/A"}
                  </p>
                  <p className="exc-content-text">
                    <strong>{t("Products")}:</strong> {data?.onboarding_data?.productService1 || data?.onboarding_data?.productService2 || data?.onboarding_data?.productService3 ? [data?.onboarding_data?.productService1, data?.onboarding_data?.productService2, data?.onboarding_data?.productService3].filter(Boolean).join(", ") : "N/A"}
                  </p>
                  <p className="exc-content-text">
                    <strong>{t("Channels")}:</strong> {data?.onboarding_data?.channel1 || data?.onboarding_data?.channel2 || data?.onboarding_data?.channel3 ? [data?.onboarding_data?.channel1, data?.onboarding_data?.channel2, data?.onboarding_data?.channel3].filter(Boolean).join(", ") : "N/A"}
                  </p>
                  <p className="exc-content-text">
                    <strong>{t("Geographies")}:</strong> {data?.onboarding_data?.geography1 || data?.onboarding_data?.geography2 || data?.onboarding_data?.geography3 ? [data?.onboarding_data?.geography1, data?.onboarding_data?.geography2, data?.onboarding_data?.geography3].filter(Boolean).join(", ") : "N/A"}
                  </p>
                </div>
              </div>

              {/* Existing Adjacencies */}
              <div className="exc-subsection exc-existing-adjacencies">
                <div className="exc-subsection-icon exc-orange">
                  <FileText size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">{t("Existing Adjacencies")}</h3>
                  <p className="exc-source-label exc-orange-text">
                    <Info size={14} /> {t("AI-inferred from your core business data")}
                  </p>
                  {Array.isArray(existingAdjacencies) && existingAdjacencies.length > 0 ? (
                    existingAdjacencies.map((adj, idx) => (
                      <div className="exc-option-block" key={idx}>
                        <p className="exc-option-title"><strong>{t("Recommendation Basis")}: {adj.recommendation_basis || adj.basis}</strong></p>
                        <p className="exc-content-text"><strong>{t("Segments")}:</strong> {Array.isArray(adj.segments) ? adj.segments.join(", ") : (adj.segments || "N/A")}</p>
                        <p className="exc-content-text"><strong>{t("Products")}:</strong> {Array.isArray(adj.products) ? adj.products.join(", ") : (adj.products || "N/A")}</p>
                        <p className="exc-content-text"><strong>{t("Channels")}:</strong> {Array.isArray(adj.channels) ? adj.channels.join(", ") : (adj.channels || "N/A")}</p>
                        {adj.geographies && (
                          <p className="exc-content-text"><strong>{t("Geographies")}:</strong> {Array.isArray(adj.geographies) ? adj.geographies.join(", ") : adj.geographies}</p>
                        )}
                      </div>
                    ))
                  ) : (getNested(whereToCompete, 'existing_adjacencies.segments'))?.length > 0 ? (
                    <div className="exc-option-block">
                      <p className="exc-content-text">
                        <strong>{t("Segments")}:</strong> {(getNested(whereToCompete, 'existing_adjacencies.segments')).join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="exc-content-text exc-italic">{t("No existing adjacencies inferred. Business appears focused on core.")}</p>
                  )}
                </div>
              </div>

              {/* New Adjacencies */}
              <div className="exc-subsection exc-new-adjacencies">
                <div className="exc-subsection-icon exc-green">
                  <ListChecks size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">{t("New Adjacencies to Explore")}</h3>
                  <p className="exc-source-label exc-green-text">
                    <Info size={14} /> {t("AI-recommended based on industry and core business")}
                  </p>
                  {newAdjacencies?.map((adj, idx) => (
                    <div className="exc-option-block" key={idx}>
                      <p className="exc-option-title"><strong>{t("Recommendation Basis")}: {adj.recommendation_basis || adj.title || adj.name}</strong></p>
                      <p className="exc-content-text"><strong>{t("Segments")}:</strong> {Array.isArray(adj.segments) ? adj.segments.join(", ") : (adj.segments || "N/A")}</p>
                      <p className="exc-content-text"><strong>{t("Products")}:</strong> {Array.isArray(adj.products) ? adj.products.join(", ") : (adj.products || "N/A")}</p>
                      <p className="exc-content-text"><strong>{t("Channels")}:</strong> {Array.isArray(adj.channels) ? adj.channels.join(", ") : (adj.channels || "N/A")}</p>
                      {adj.strategic_fit_score && (
                        <p className="exc-content-text"><strong>{t("Strategic Fit Score")}:</strong> {adj.strategic_fit_score}</p>
                      )}
                      {adj.rationale && (
                        <p className="exc-content-text"><strong>{t("Rationale")}:</strong> {adj.rationale}</p>
                      )}
                    </div>
                  )) || <p className="exc-content-text exc-italic">{t("Analyzing potential adjacencies")}...</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HOW TO COMPETE */}
        <div className="exc-section-card">
          <div className="exc-section-header" onClick={() => toggleSection("howToCompete")}>
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-how-icon">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">{t("HOW TO COMPETE")}</h3>
                <p className="exc-section-subtitle">
                  {t("Differentiation strategy and what to focus on or exclude")}
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.howToCompete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {expandedSections.howToCompete && (
            <div className="exc-section-body">
              <div className="exc-how-compete-box">
                <p className="exc-box-title">{t("This is how you should differentiate")}:</p>

                <div className="exc-differentiation-inner">
                  <div className="exc-differentiation-header">
                    <p className="exc-differentiation-label">{t("Recommended differentiation levers")}</p>
                    <p className="exc-differentiation-text"><strong>{differentiationLevers}</strong></p>
                  </div>

                  <div className="exc-implications-list">
                    <div className="exc-implication-row exc-includes">
                      <div className="exc-icon-label">
                        <CheckCircle2 size={16} />
                        <span>{t("What this implies")}:</span>
                      </div>
                      <div className="exc-implication-content">
                        {Array.isArray(implications)
                          ? implications.map((item, i) => <div key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</div>)
                          : (typeof implications === 'object'
                            ? JSON.stringify(implications)
                            : (implications || "N/A"))
                        }
                      </div>
                    </div>

                    <div className="exc-implication-row exc-excludes">
                      <div className="exc-icon-label">
                        <AlertCircle size={16} />
                        <span>{t("What this excludes")}:</span>
                      </div>
                      <div className="exc-implication-content">
                        {Array.isArray(excludes)
                          ? excludes.map((item, i) => <div key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</div>)
                          : (typeof excludes === 'object'
                            ? JSON.stringify(excludes)
                            : (excludes || "N/A"))
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {alternativeLevers.length > 0 && (
                  <div className="exc-alternative-levers">
                    <p className="exc-differentiation-label" style={{ color: '#92400e' }}>{t("Alternative differentiation levers")}</p>
                    <ul className="exc-alternative-list">
                      {Array.isArray(alternativeLevers) ? alternativeLevers.map((item, idx) => (
                        <li key={idx} className="exc-alternative-item">
                          {typeof item === 'object' ? (
                            <>
                              <strong>{item.lever}</strong> (Score: {item.suitability_score}/10)
                              <p className="exc-alternative-reason">{item.reason}</p>
                            </>
                          ) : (
                            item
                          )}
                        </li>
                      )) : (
                        <li className="exc-alternative-item">{alternativeLevers}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOP PRIORITIES */}
        <div className="exc-section-card">
          <div className="exc-section-header" onClick={() => toggleSection("topPriorities")}>
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-priorities-icon">
                <ListChecks size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">{t("TOP 3-5 PRIORITIES")}</h3>
                <p className="exc-section-subtitle">
                  {t("Exactly 3-5 priorities • Priorities = workstreams • Each implies exclusion")}
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.topPriorities ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {expandedSections.topPriorities && (
            <div className="exc-section-body">
              {topPriorities?.map((item, idx) => {
                // Determine actions list
                const actions = item.actions || item.Actions || [];

                return (
                  <div className="exc-priority-item" key={idx}>
                    <div className="exc-priority-header">
                      <span className="exc-priority-number">{idx + 1}.</span>
                      <h4 className="exc-priority-title">{item.title || item.action || item.Action || item.Title}</h4>
                    </div>

                    {actions.length > 0 && (
                      <div className="exc-priority-actions mt-2 ps-4">
                        {actions.map((action, aIdx) => {
                          const actionText = typeof action === 'string' ? action : (action.action || action.Action || JSON.stringify(action));
                          return (
                            <div className="exc-action-item" key={aIdx}>
                              <CheckCircle2 size={16} />
                              <div>
                                <span>{actionText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }) || <p className="exc-content-text exc-italic">{t("Identifying strategic priorities")}...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;