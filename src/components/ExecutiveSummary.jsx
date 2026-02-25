import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Info, Target, FileText, ListChecks, Loader2 } from "lucide-react";
import { AnalysisApiService } from "../services/analysisApiService";
import "../styles/executiveSummary.css";
import { useTranslation } from "../hooks/useTranslation";

const ExecutiveSummary = ({ businessId, onStartOnboarding }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    whereToCompete: false,
    howToCompete: false,
    topPriorities: false,
  });

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  const fetchSummary = useCallback(async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const [summaryResult, analysisResult] = await Promise.all([
        analysisService.getPMFExecutiveSummary(businessId),
        analysisService.getPMFAnalysis(businessId)
      ]);

      const summaryContent = summaryResult?.summary || summaryResult;
      const baseAnalysis = analysisResult?.analysis || analysisResult;

      // Merge data: Use summary but fallback to base analysis for core items
      setData({
        ...summaryContent,
        _baseAnalysis: baseAnalysis
      });
    } catch (error) {
      console.error("Error fetching executive summary:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Loader2 className="text-primary animate-spin" />
        <span className="ms-2 text-muted">Loading executive summary...</span>
      </div>
    );
  }

  if (!data || Object.keys(data).length <= 1) { // _baseAnalysis always exists if call succeeds
    return (
      <div className="bg-light py-5 text-center rounded-4 m-3 shadow-sm border">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "No executive summary available yet."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to generate this summary."}</p>
          {onStartOnboarding && (
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
  const newAdjacencies = whereToCompete?.new_adjacencies_to_explore || whereToCompete?.new_adjacencies || whereToCompete?.["New Adjacencies"];

  return (
    <div className="exc-executive-summary-container">
      <div className="exc-executive-content">
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
                    <strong>{t("Segments")}:</strong> {[data._baseAnalysis?.onboarding_data?.customerSegment1, data._baseAnalysis?.onboarding_data?.customerSegment2, data._baseAnalysis?.onboarding_data?.customerSegment3].filter(Boolean).join(", ") || "N/A"}<br />
                    <strong>{t("Products")}:</strong> {[data._baseAnalysis?.onboarding_data?.productService1, data._baseAnalysis?.onboarding_data?.productService2, data._baseAnalysis?.onboarding_data?.productService3].filter(Boolean).join(", ") || "N/A"}<br />
                    <strong>{t("Channels")}:</strong> {[data._baseAnalysis?.onboarding_data?.channel1, data._baseAnalysis?.onboarding_data?.channel2, data._baseAnalysis?.onboarding_data?.channel3].filter(Boolean).join(", ") || "N/A"}
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
                  {(getNested(whereToCompete, 'existing_adjacencies.segments') || data._baseAnalysis?.insights?.adjacencies?.segments)?.length > 0 ? (
                    <p className="exc-content-text">
                      <strong>{t("Segments")}:</strong> {(getNested(whereToCompete, 'existing_adjacencies.segments') || data._baseAnalysis?.insights?.adjacencies?.segments).join(", ")}
                    </p>
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
                      <p className="exc-option-title"><strong>{t("Option")} {idx + 1}: {adj.title || adj.name}</strong></p>
                      <p className="exc-content-text"><strong>{t("Segments")}:</strong> {Array.isArray(adj.segments) ? adj.segments.join(", ") : (adj.segments || "N/A")}</p>
                      <p className="exc-content-text"><strong>{t("Products")}:</strong> {Array.isArray(adj.products) ? adj.products.join(", ") : (adj.products || "N/A")}</p>
                      <p className="exc-content-text"><strong>{t("Channels")}:</strong> {Array.isArray(adj.channels) ? adj.channels.join(", ") : (adj.channels || "N/A")}</p>
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