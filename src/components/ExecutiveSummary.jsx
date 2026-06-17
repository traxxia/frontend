import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Info, Target, FileText, ListChecks, Loader2, Zap, Plus, Rocket, ArrowRight, AlertTriangle, Lock, XCircle } from "lucide-react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AnalysisApiService } from "../services/analysisApiService";
import "../styles/executiveSummary.css";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { useAnalysisStore } from "../store/analysisStore";
import { useBusinessSetupContext } from "../context/BusinessSetupContext";
import { useQueryClient } from "@tanstack/react-query";
const ExecutiveSummary = ({ hideNextStep }) => {
  const {
    selectedBusinessId: businessId,
    openModal,
    pmfRefreshTrigger: refreshTrigger,
    t,
    apiService: analysisService,
    setActiveTab,
    handleKickstartSuccess,
    handleStayOnPriorities
  } = useBusinessSetupContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    ahaInsights: false,
    whereToCompete: false,
    howToCompete: false,
    topPriorities: false
  });
  const [ahaData, setAhaData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAdjacency, setSelectedAdjacency] = useState(null);
  const [kickstarting, setKickstarting] = useState(false);
  const addToast = useUIStore(state => state.addToast);
  const kickstartData = useAnalysisStore(state => state.kickstartData);
  const fetchKickstartData = useAnalysisStore(state => state.fetchKickstartData);
  const isAdmin = useAuthStore(state => state.isAdmin);
  const hasCollaborators = kickstartData?.hasCollaborators ?? true;
  const projects = useProjectStore(state => state.projects);
  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const isViewer = useAuthStore(state => (state.userRole || "").toLowerCase() === "viewer");
  const isCompanyAdmin = useAuthStore(state => state.userRole === 'company_admin' || state.isAdmin);
  const userPlan = useAuthStore(state => state.userPlan);
  const isPaidPlan = userPlan && userPlan.toLowerCase() !== 'explorer' && userPlan.toLowerCase() !== 'free' && userPlan.toLowerCase() !== 'none';
  const theme = useUIStore(state => state.theme);
  const fetchingRef = useRef(false);
  const lastFetchedRef = useRef(null);

  const fetchSummary = useCallback(async (force = false) => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchKey = `${businessId}-${refreshTrigger}`;
    if (!force && (fetchingRef.current || lastFetchedRef.current === fetchKey)) return;
    
    fetchingRef.current = true;
    lastFetchedRef.current = fetchKey;
    
    setLoading(true);
    try {
      // Use refreshTrigger > 0 as a signal to bypass cache
      const forceRefresh = force || refreshTrigger > 0;
      const [summaryResult, ahaResult] = await Promise.all([
        analysisService.getPMFExecutiveSummary(businessId, forceRefresh), 
        analysisService.getPMFAnalysis(businessId, forceRefresh)
      ]);
      
      let summaryContent = summaryResult?.summary || summaryResult;
      if (summaryResult?.onboarding_data && !summaryContent.onboarding_data) {
        summaryContent = {
          ...summaryContent,
          onboarding_data: summaryResult.onboarding_data
        };
      }
      setData(summaryContent);
      setAhaData(ahaResult);
      await fetchKickstartData(businessId, forceRefresh);
      await fetchProjects(businessId);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [businessId, refreshTrigger, analysisService, fetchKickstartData, fetchProjects]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
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
    return rawInsights.slice(0, 4);
  };
  const isAlreadyProject = useCallback(adj => {
    if (!projects || projects.length === 0) return false;
    const adjTitle = (adj.recommendation_basis || adj.title || adj.name || "").toLowerCase().trim();
    return projects.some(p => (p.project_name || "").toLowerCase().trim() === adjTitle);
  }, [projects]);
  const handleCreateButtonClick = (adj, index) => {
    if (isViewer) return;
    setSelectedAdjacency({
      ...adj,
      index
    });
    setShowConfirmModal(true);
  };
  const confirmKickstart = async () => {
    if (!selectedAdjacency) return;
    setKickstarting(true);
    try {
      const priority = {
        title: selectedAdjacency.recommendation_basis || selectedAdjacency.title || selectedAdjacency.name,
        actions: [{
          action: selectedAdjacency.recommendation_basis || selectedAdjacency.title || selectedAdjacency.name,
          details: `Targeting segments: ${Array.isArray(selectedAdjacency.segments) ? selectedAdjacency.segments.join(", ") : selectedAdjacency.segments}. Products: ${Array.isArray(selectedAdjacency.products) ? selectedAdjacency.products.join(", ") : selectedAdjacency.products}. Channels: ${Array.isArray(selectedAdjacency.channels) ? selectedAdjacency.channels.join(", ") : selectedAdjacency.channels}.`
        }]
      };
      await analysisService.kickstartProject({
        businessId,
        priority
      });
      useProjectStore.getState().clearCache(businessId);
      await fetchProjects(businessId);
      
      // Invalidate the react-query cache and unlock the tab visibility
      if (typeof handleStayOnPriorities === 'function') {
        handleStayOnPriorities();
      }
      queryClient.invalidateQueries({
        queryKey: ["projects", businessId]
      });
      queryClient.invalidateQueries({
        queryKey: ["rankingsSummary", businessId]
      });
      queryClient.invalidateQueries({
        queryKey: ["teamRankings", businessId]
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creating project:", error);
      addToast({
        message: t("Failed to create project. Please try again."),
        type: "error"
      });
    } finally {
      setKickstarting(false);
    }
  };
  const handleRedirectToProjects = () => {
    setShowSuccessModal(false);
    if (typeof handleKickstartSuccess === 'function') {
      handleKickstartSuccess();
    } else {
      useProjectStore.getState().setViewMode('projects');
      setActiveTab('bets');
    }
  };
  if (loading) {
    return <div className="d-flex justify-content-center align-items-center py-5">
        <Loader2 className="text-primary animate-spin" />
        <span className="ms-2 text-muted">Loading executive summary...</span>
      </div>;
  }
  const hasActualContent = data && (data.top_priorities && Array.isArray(data.top_priorities) && data.top_priorities.length > 0 || data.topPriorities && Array.isArray(data.topPriorities) && data.topPriorities.length > 0 || data["Top Priorities"] && Array.isArray(data["Top Priorities"]) && data["Top Priorities"].length > 0 || data.how_to_compete || data.howToCompete || data.new_adjacencies_to_explore && Array.isArray(data.new_adjacencies_to_explore) && data.new_adjacencies_to_explore.length > 0 || data.newAdjacencies && Array.isArray(data.newAdjacencies) && data.newAdjacencies.length > 0);
  if (!data || !hasActualContent) {
    return <div className="bg-light py-5 text-center rounded-4 m-3 shadow-sm border">
        <div className="container executive-summary--s1">
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "You haven't completed the onboarding process fully."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Do you want to go back and complete it?"}</p>
          {!isViewer && <button className="btn btn-primary rounded-pill px-5 py-2 fw-semibold" onClick={() => navigate(`/onboarding/${businessId}`, { state: { business: { _id: businessId, onboarding_data: data?.onboarding_data || data?.onboarding || data }, pmfData: data?.onboarding_data || data?.onboarding || data } })}>
              {t("startPMFOnboarding") || "Go Back"}
            </button>}
        </div>
      </div>;
  }
  const getSection = key => {
    if (!data) return null;
    return data[key] || data[key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())] || data[key.replace(/_/g, "")] || data[key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')];
  };
  const whereToCompete = getSection('where_to_compete') || data;
  const howToCompete = getSection('how_to_compete');
  const topPriorities = getSection('top_priorities') || data.top_priorities || data.topPriorities || data["Top Priorities"];
  const getNested = (obj, path) => {
    return path.split('.').reduce((acc, part) => {
      if (!acc) return null;
      return acc[part] || acc[part.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())] || acc[part.replace(/_/g, " ")];
    }, obj);
  };
  const differentiationLevers = howToCompete?.recommended_differentiation?.primary_lever || howToCompete?.differentiation_levers || howToCompete?.["Differentiation Levers"] || "N/A";
  const implications = howToCompete?.what_this_implies || howToCompete?.implies || howToCompete?.implications || howToCompete?.Implies;
  const excludes = howToCompete?.what_this_excludes || howToCompete?.excludes || howToCompete?.Excludes;
  const alternativeLevers = howToCompete?.alternative_levers || howToCompete?.["Alternative Levers"] || [];
  const newAdjacencies = whereToCompete?.new_adjacencies_to_explore || whereToCompete?.new_adjacencies || whereToCompete?.["New Adjacencies"];
  const existingAdjacencies = whereToCompete?.existing_adjacencies || whereToCompete?.["Existing Adjacencies"];
  const topAhaInsights = getTopAhaInsights();
  
  const formatCoreData = (key1, key2, key3) => {
    const v1 = data?.onboarding_data?.[key1];
    const v2 = data?.onboarding_data?.[key2];
    const v3 = data?.onboarding_data?.[key3];
    if (v1 || v2 || v3) {
      return [v1, v2, v3].filter(Boolean).join(", ");
    }
    return "N/A";
  };

  const formatAdjData = (adjList, key) => {
    if (!adjList || !Array.isArray(adjList) || adjList.length === 0) {
      const fallback = getNested(whereToCompete, `existing_adjacencies.${key}`);
      if (fallback && Array.isArray(fallback)) return fallback.join(", ");
      if (fallback) return fallback;
      return "N/A";
    }
    return adjList.map(a => Array.isArray(a[key]) ? a[key].join(", ") : a[key]).filter(Boolean).join(" | ") || "N/A";
  };
  return <div className="exc-executive-summary-container">
      <div className="exc-executive-content">
        {}
        {topAhaInsights.length > 0 && <div className="exc-section-card">
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

            <div className={`exc-section-body ${expandedSections.ahaInsights ? 'expanded' : 'collapsed'}`} data-component="executive-aha">
              <div className="exc-aha-vertical-tiles">
                {topAhaInsights.map((insight, idx) => {
              const conf = (insight.confidence || '').toLowerCase();
              let confBg = 'bg-secondary-subtle';
              let confText = 'text-secondary';
              if (conf.includes('high')) {
                confBg = 'bg-success-subtle';
                confText = 'text-success';
              } else if (conf.includes('medium')) {
                confBg = 'bg-warning-subtle';
                confText = 'text-warning';
              } else if (conf.includes('low')) {
                confBg = 'bg-danger-subtle';
                confText = 'text-danger';
              }
              return <div key={idx} className="exc-aha-tile full-width">
                      <div className="exc-aha-tile-header d-flex justify-content-between align-items-center">
                        <span className="exc-aha-tile-category">{insight.type || t("Insight")}</span>
                        {insight.confidence && <span className={`badge rounded-pill ${confBg} ${confText} px-3 py-2 fw-semibold`}>
                            {t("Confidence")}: {insight.confidence.charAt(0).toUpperCase() + insight.confidence.slice(1)}
                          </span>}
                      </div>
                      <h5 className="exc-aha-tile-title">{insight.title}</h5>
                      <ul className="exc-aha-tile-details">
                        {(insight.details || insight.key_points || []).slice(0, 3).map((detail, dIdx) => <li key={dIdx}>{detail}</li>)}
                      </ul>
                    </div>;
            })}
              </div>
              <div className="exc-discuss-footer">
                <button 
                  className="exc-discuss-btn"
                  onClick={() => window.dispatchEvent(new CustomEvent('open_ai_assistant'))}
                >
                  <span className="exc-tx-icon">TX</span>
                  {t("Discuss with Trax") || "Discuss with Trax"}
                </button>
              </div>
            </div>
          </div>}

        {}
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

          <div className={`exc-section-body ${expandedSections.whereToCompete ? 'expanded' : 'collapsed'}`} data-component="executive-where">
            <div className="exc-horizons-container">
              <div className="exc-horizons-header">
                <p className="exc-super-title">{t("COMPARISON ACROSS HORIZONS")}</p>
                <h4 className="exc-horizons-title">{t("How the business expands outward from its core")}</h4>
              </div>
              <div className="exc-horizons-table-wrapper">
                <table className="exc-horizons-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>{t("CURRENT CORE")}</th>
                      <th>{t("EXISTING ADJACENCIES")}</th>
                      <th>{t("NEW ADJACENCIES")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="exc-row-label">{t("Segments")}</td>
                      <td>{formatCoreData("customerSegment1", "customerSegment2", "customerSegment3")}</td>
                      <td>{formatAdjData(existingAdjacencies, "segments")}</td>
                      <td>{formatAdjData(newAdjacencies, "segments")}</td>
                    </tr>
                    <tr>
                      <td className="exc-row-label">{t("Products")}</td>
                      <td>{formatCoreData("productService1", "productService2", "productService3")}</td>
                      <td>{formatAdjData(existingAdjacencies, "products")}</td>
                      <td>{formatAdjData(newAdjacencies, "products")}</td>
                    </tr>
                    <tr>
                      <td className="exc-row-label">{t("Channels")}</td>
                      <td>{formatCoreData("channel1", "channel2", "channel3")}</td>
                      <td>{formatAdjData(existingAdjacencies, "channels")}</td>
                      <td>{formatAdjData(newAdjacencies, "channels")}</td>
                    </tr>
                    <tr>
                      <td className="exc-row-label">{t("Geographies")}</td>
                      <td>{formatCoreData("geography1", "geography2", "geography3")}</td>
                      <td>{formatAdjData(existingAdjacencies, "geographies")}</td>
                      <td>{formatAdjData(newAdjacencies, "geographies")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="exc-recommended-moves">
              <div className="exc-recommended-header">
                <p className="exc-super-title">{t("RECOMMENDED MOVES")}</p>
                <h4 className="exc-horizons-title">{t("Adjacencies Trax surfaced — ranked by strategic fit")}</h4>
              </div>
              <div className="exc-moves-list">
                {newAdjacencies?.map((adj, idx) => (
                  <div className="exc-move-card" key={idx}>
                    <div className="exc-move-card-header">
                      <h5 className="exc-move-title">{adj.title || adj.name || adj.recommendation_basis || "Adjacency"}</h5>
                      {adj.strategic_fit_score && <span className="exc-move-score">{t("FIT SCORE")} <strong>{adj.strategic_fit_score}</strong></span>}
                    </div>
                    <p className="exc-move-subtitle">{adj.recommendation_basis || "Strategic expansion"}</p>
                    <p className="exc-move-body">{adj.rationale}</p>
                    
                    {isCompanyAdmin && (() => {
                        const exists = isAlreadyProject(adj);
                        if (!isPaidPlan) return null;
                        return (
                          <button 
                            className={`exc-create-project-btn mt-3 ${exists ? 'exists' : ''}`} 
                            onClick={() => !exists && handleCreateButtonClick(adj, idx)} 
                            disabled={kickstarting || exists}
                          >
                          {exists ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                          <span>{exists ? t("Already in Bets") : t("Create Strategic Bet")}</span>
                        </button>
                      );
                    })()}
                  </div>
                )) || <p className="exc-content-text exc-italic">{t("Analyzing potential adjacencies")}...</p>}
              </div>

              <div className="exc-discuss-footer">
                <button 
                  className="exc-discuss-btn"
                  onClick={() => window.dispatchEvent(new CustomEvent('open_ai_assistant'))}
                >
                  <span className="exc-tx-icon">TX</span>
                  {t("Discuss with Trax") || "Discuss with Trax"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {}
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

          <div className={`exc-section-body ${expandedSections.howToCompete ? 'expanded' : 'collapsed'}`} data-component="executive-how">
            
            {}
            {howToCompete?.current_differentiation && (
              <div className="exc-how-block">
                <p className="exc-super-title">{t("CURRENT DIFFERENTIATION")}</p>
                <h4 className="exc-horizons-title">{t("How the business differentiates today")}</h4>
                <div className="exc-current-diff-card">
                  <h5 className="exc-diff-title">{howToCompete.current_differentiation.primary_lever}</h5>
                  {howToCompete.current_differentiation.description && (
                    <p className="exc-diff-desc">{howToCompete.current_differentiation.description}</p>
                  )}
                </div>
              </div>
            )}

            {}
            <div className="exc-how-block">
              <p className="exc-super-title">{t("RECOMMENDED DIFFERENTIATION LEVER")}</p>
              <h4 className="exc-horizons-title">{t("What Trax recommends doubling down on")}</h4>
              <div className="exc-rec-diff-card">
                <h5 className="exc-diff-title">{differentiationLevers}</h5>
                
                <div className="exc-implications-container">
                  <div className="exc-impl-group">
                    <div className="exc-impl-header">
                      <div className="exc-impl-icon-green"><CheckCircle2 size={14} strokeWidth={3} /></div>
                      <span className="exc-impl-label">{t("What this implies")}</span>
                    </div>
                    <div className="exc-impl-list">
                      {Array.isArray(implications) ? implications.map((item, i) => (
                        <p className="exc-impl-text" key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</p>
                      )) : (
                        <p className="exc-impl-text">{typeof implications === 'object' ? JSON.stringify(implications) : implications || "N/A"}</p>
                      )}
                    </div>
                  </div>

                  <div className="exc-impl-group">
                    <div className="exc-impl-header">
                      <div className="exc-impl-icon-red"><XCircle size={14} strokeWidth={3} /></div>
                      <span className="exc-impl-label">{t("What this excludes")}</span>
                    </div>
                    <div className="exc-impl-list">
                      {Array.isArray(excludes) ? excludes.map((item, i) => (
                        <p className="exc-impl-text" key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</p>
                      )) : (
                        <p className="exc-impl-text">{typeof excludes === 'object' ? JSON.stringify(excludes) : excludes || "N/A"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {}
            {alternativeLevers && alternativeLevers.length > 0 && (
              <div className="exc-how-blocks">
                <p className="exc-super-title">{t("ALTERNATIVE DIFFERENTIATION LEVERS")}</p>
                <h4 className="exc-horizons-title">{t("Considered but not recommended — ranked by fit")}</h4>
                <div className="exc-alt-levers-list">
                  {Array.isArray(alternativeLevers) ? alternativeLevers.map((item, idx) => (
                    <div className="exc-alt-card" key={idx}>
                      <div className="exc-alt-card-header">
                        <h5 className="exc-alt-title">{typeof item === 'object' ? item.lever : item}</h5>
                        {typeof item === 'object' && item.suitability_score && (
                          <span className="exc-alt-score">{t("SCORE")} {item.suitability_score} / 10</span>
                        )}
                      </div>
                      {typeof item === 'object' && item.reason && (
                        <p className="exc-alt-desc">{item.reason}</p>
                      )}
                    </div>
                  )) : (
                    <div className="exc-alt-card">
                      <h5 className="exc-alt-title">{alternativeLevers}</h5>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="exc-discuss-footer">
              <button 
                className="exc-discuss-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('open_ai_assistant'))}
              >
                <span className="exc-tx-icon">TX</span>
                {t("Discuss with Trax") || "Discuss with Trax"}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="exc-section-card">
          <div className="exc-section-header" onClick={() => toggleSection("topPriorities")}>
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-priorities-icon">
                <ListChecks size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">{t("TOP 5 PRIORITIES")}</h3>
                <p className="exc-section-subtitle">
                  {t("Exactly 5 priorities • Priorities = workstreams • Each implies exclusion")}
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.topPriorities ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className={`exc-section-body ${expandedSections.topPriorities ? 'expanded' : 'collapsed'}`} data-component="executive-priorities">
            <div className="exc-prio-list">
              {topPriorities?.map((item, idx) => {
                const actions = item.actions || item.Actions || [];
                return (
                  <div className="exc-prio-card" key={idx}>
                    <div className="exc-prio-card-header">
                      <div className="exc-prio-header-left">
                        <span className="exc-prio-number">{idx + 1}.</span>
                        <h4 className="exc-prio-title">{item.title || item.action || item.Action || item.Title}</h4>
                        {/* <span className="exc-prio-badge">
                          <CheckCircle2 size={10} strokeWidth={3} /> {t("BET")} #{idx + 1}
                        </span> */}
                      </div>
                    </div>

                    {actions.length > 0 && (
                      <div className="exc-prio-actions">
                        {actions.map((action, aIdx) => {
                          const actionText = typeof action === 'string' ? action : action.action || action.Action || JSON.stringify(action);
                          return (
                            <div className="exc-prio-action-item" key={aIdx}>
                              <div className="exc-prio-icon-green"><CheckCircle2 size={14} strokeWidth={2.5} /></div>
                              <span className="exc-prio-action-text">{actionText}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {item.what_this_excludes && Array.isArray(item.what_this_excludes) && item.what_this_excludes.length > 0 && (
                      <div className="exc-prio-excludes">
                        <div className="exc-prio-excludes-header">
                          <div className="exc-prio-icon-red"><AlertCircle size={14} strokeWidth={2.5} /></div>
                          <span className="exc-prio-excludes-label">{t("What this excludes")}:</span>
                        </div>
                        <ul className="exc-prio-excludes-list">
                          {item.what_this_excludes.map((excludeItem, eIdx) => (
                            <li key={eIdx} className="exc-prio-exclude-item">
                              {typeof excludeItem === 'object' ? JSON.stringify(excludeItem) : excludeItem}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              }) || <p className="exc-content-text exc-italic">{t("Identifying strategic priorities")}...</p>}
            </div>

            <div className="exc-discuss-footer">
              <button 
                className="exc-discuss-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('open_ai_assistant'))}
              >
                <span className="exc-tx-icon">TX</span>
                {t("Discuss with Trax") || "Discuss with Trax"}
              </button>
            </div>
          </div>
        </div>

        {/* Next Step Card */}
        {!hideNextStep && (
          <div className="exc-section-card p-4">
          <p className="fw-bold text-uppercase mb-2 cta-path-eyebrow">{t("Next step")}</p>
          <h3 className="exc-section-title mb-3 next-step" style={{ fontSize: '19px', textTransform: 'none' }}>{t("Go deeper with Advanced Insights")}</h3>
          <p className="exc-content-text mb-4" style={{ fontSize: '14px' }}>
            {t("Your Basic diagnosis is the quick read. Advanced asks a few more questions to build the full picture — the 6 C's and the S.T.R.A.T.E.G.I.C. scorecard — and that sharper analysis is what your Bets are built from.")}
          </p>
          
          <div className="d-flex align-items-center mb-4 flex-wrap gap-2" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
            <div className="d-flex align-items-center rounded-pill px-3 py-1" style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={16} fill="#166534" color="#ffffff" className="me-2" /> {t("Basic")}
            </div>
            <span className="text-muted mx-1">→</span>
            <div className="d-flex align-items-center rounded-pill px-3 py-1" style={{ backgroundColor: '#eff6ff', border: '1px solid #2563eb', color: '#2563eb' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ backgroundColor: '#2563eb', color: 'white', width: '20px', height: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>2</div> {t("Advanced")}
            </div>
            <span className="text-muted mx-1">→</span>
            <div className="d-flex align-items-center rounded-pill px-3 py-1" style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ backgroundColor: '#f1f5f9', color: '#334155', width: '20px', height: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>3</div> {t("Execution")}
            </div>
          </div>

          <button className="exc-create-project-btn mt-4" onClick={() => {
            const hasPlan = userPlan && userPlan.trim().toLowerCase() !== "no plan" && userPlan.trim().toLowerCase() !== "none";
            if (hasPlan) {
              navigate('/businesspage', { state: { businessId: businessId, initialTab: 'advanced' } });
            } else {
              navigate(`/business/${businessId || 'default'}/advanced-insights`);
            }
          }}>
            {(!userPlan || userPlan.trim().toLowerCase() === "no plan" || userPlan.trim().toLowerCase() === "none") && <span className="ms-1" style={{ fontSize: '14px' }}>🔒</span>} {t("Continue to Advanced Insights")} <ArrowRight size={16} />
          </button>
        </div>
        )}
      </div>

      {}
      <Modal show={showConfirmModal} onHide={() => !kickstarting && setShowConfirmModal(false)} centered className="kickstart-confirm-modal">
        <Modal.Body className="text-center p-4">
          <div className="warning-icon-wrapper mb-3 executive-summary--s9">
            <AlertTriangle size={32} className="executive-summary--s10" />
          </div>
          <h4 className="fw-bold mb-2">{t("Kickstart Strategic Bet?")}</h4>
          <div className="text-muted mb-4 text-start bg-light p-3 rounded-3 executive-summary--s11">
            <p className="mb-2"><strong>{t("Project Title")}:</strong> {selectedAdjacency?.recommendation_basis || selectedAdjacency?.title || selectedAdjacency?.name}</p>
            <p className="mb-2"><strong>{t("Segments")}:</strong> {Array.isArray(selectedAdjacency?.segments) ? selectedAdjacency?.segments.join(", ") : selectedAdjacency?.segments}</p>
            <p className="mb-0"><strong>{t("Products")}:</strong> {Array.isArray(selectedAdjacency?.products) ? selectedAdjacency?.products.join(", ") : selectedAdjacency?.products}</p>
          </div>
          <div className="text-muted mb-4">
            <p>
              {t("Are you sure you want to kickstart this adjacency and create a new project? This will trigger AI generation for project details.")}
            </p>
            {isAdmin && !hasCollaborators && projects.length === 0 && <p className="mb-0 small text-info fw-medium">
                <AlertCircle size={14} className="me-1" />
                {t("Note: You are proceeding without collaborators. You can always add them later in User Management.")}
              </p>}
          </div>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={confirmKickstart} disabled={kickstarting} className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold executive-summary--s12">
              {kickstarting ? <Spinner size="sm" /> : null}
              {kickstarting ? t("Kickstarting...") : t("Kickstart to Bets")}
            </Button>
            {!kickstarting && <>
                {isAdmin && !hasCollaborators && projects.length === 0 && <Button variant="outline-warning" onClick={() => navigate('/admin?tab=user_management')} className="py-2">
                    {t("Add Collaborators First")}
                  </Button>}
                <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)} className="py-2">
                  {t("Cancel")}
                </Button>
              </>}
          </div>
        </Modal.Body>
      </Modal>

      {}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered className="kickstart-success-modal">
        <Modal.Body className="text-center p-4">
          <div className="success-icon-wrapper mb-3 executive-summary--s13">
            <Rocket size={32} className="executive-summary--s14" />
          </div>
          <h4 className="fw-bold mb-2">{t("Project Kickstart Successful")}!</h4>
          <p className="text-muted mb-4">
            {t("A new draft project has been created in your Projects tab. You can now define its scope, metrics, and start execution.")}
          </p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={handleRedirectToProjects} className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold executive-summary--s12">
              {t("Go to Bets")} <ArrowRight size={18} />
            </Button>
            <Button variant="link" onClick={() => setShowSuccessModal(false)} className="text-muted text-decoration-none">
              {t("Stay on this page")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>;
};
export default ExecutiveSummary;
