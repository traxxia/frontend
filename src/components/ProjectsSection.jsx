import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { Container } from "react-bootstrap";
import axios from "axios";
import { lockField, heartbeat, unlockFields } from "@/hooks/fieldlockapi";
import { useFieldLockPolling } from "@/hooks/useFieldLockPolling";
import { useAccessControl } from "../hooks/useAccessControl";
import { useProjectForm } from "../hooks/useProjectForm";
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";

import { useAuthStore, useProjectStore, useUIStore, useBusinessStore } from "../store";
import { useProjects } from "../hooks/useQueries";

import { useQueryClient } from "@tanstack/react-query";


import { Users, CheckCircle, Plus, ListOrdered, Rocket } from "lucide-react";
import RankProjectsPanel from "../components/RankProjectsPanel";
import TeamRankingsView from "../components/TeamRankingsView";
import ProjectsList from "../components/ProjectsList";
import ProjectForm from "../components/ProjectForm";
import ProjectDetails from "../components/ProjectDetails";
import ProjectReviewModal from "../components/ProjectReviewModal";
import ToastNotifications from "../components/ToastNotifications";
import StateChangeModal from "../components/StateChangeModal";
import "../styles/ProjectsSection.css";
import "../styles/ProjectReviewModal.css";

const CATEGORIES = [
  { id: "All", label: "all" },
  { id: "Draft", label: "Draft" },
  { id: "Active", label: "Active" },
  { id: "At Risk", label: "At Risk" },
  { id: "Paused", label: "Paused" },
  { id: "Killed", label: "Killed" },
  { id: "Completed", label: "Completed" },
  { id: "Scaled", label: "Scaled" },
];



const getToken = () => useAuthStore.getState().token;

const lockFieldSafe = async (projectId, fieldName) => {
  try {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;
    await lockField(projectId, fieldName, token);
  } catch (err) {
    console.error("Failed to lock field", fieldName, err);
  }
};

const heartbeatSafe = async (projectId) => {
  try {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;
    await heartbeat(projectId, token);
  } catch (err) {
    console.error("Failed to send lock heartbeat", err);
  }
};

const unlockAllFieldsSafe = async (projectId) => {
  try {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;
    await unlockFields(projectId, null, token);
  } catch (err) {
    console.error("Failed to unlock fields", err);
  }
};

const ProjectsSection = ({
  onProjectCountChange,
  companyAdminIds,
  isArchived,
}) => {
  const { selectedBusinessId } = useBusinessStore();
  const { t } = useTranslation();
  const readOnlyIndicator = isArchived ? <span className="read-only-indicator">{t('read_only')}</span> : null;
  const { userRole, userId: myUserId, userName: user, userLimits } = useAuthStore();
  const getUserLimits = () => userLimits || {};

  const {
    lockSummary: storeLockSummary,
    businessStatus: storeBusinessStatus,
    fetchProjects: fetchProjectsStore,
    fetchTeamRankings: fetchTeamRankingsStore,
    checkAllAccess: checkAllAccessStore,
    deleteProject,
    createProject,
    updateProject,
    launchProjects,
    lockRanking,
    reviewProject: reviewProjectAction,
    adhocUpdateProject: adhocUpdateProjectAction,
    clearCache,
    viewMode,
    setViewMode
  } = useProjectStore();

  const queryClient = useQueryClient();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(selectedBusinessId);

  
  const lockSummary = storeLockSummary || { total_users: 0, locked_users_count: 0, locked_users: [] };
  const businessStatus = storeBusinessStatus || "draft";



  const { addToast, openModal, closeModal, isModalOpen } = useUIStore();

  const [activeView, setActiveView] = useState("list");
  const [isRankingsLoading] = useState(false);
  const [isGeneratingAIRankings] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (onProjectCountChange) {
      onProjectCountChange(projects.length);
    }
  }, [projects.length, onProjectCountChange]);

  useEffect(() => {
    if (activeView !== "list") {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });

          const parent = containerRef.current.closest('.info-panel-content');
          if (parent) {
            parent.scrollTo({ top: 0, behavior: 'auto' });
          }
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 0);
    }
  }, [activeView]);

  const location = useLocation();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState(null);
  
  // Set initial state based on viewMode
  const initialIsViewer = useAuthStore.getState().isViewer();
  const [showRankScreen, setShowRankScreen] = useState(location.state?.viewMode === "ranking" && !initialIsViewer);
  const [showTeamRankings, setShowTeamRankings] = useState(location.state?.viewMode === "ranking" && initialIsViewer);

  // Sync viewMode from location if it changes
  useEffect(() => {
    if (location.state?.viewMode === 'ranking') {
      setViewMode('ranking');
    }
  }, [location.state?.viewMode, setViewMode]);
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [pendingSavePayload, setPendingSavePayload] = useState(null);
  const [selectedReviewProject, setSelectedReviewProject] = useState(null);
  const [reviewType, setReviewType] = useState("review");

  const [apiIsArchived, setApiIsArchived] = useState(isArchived);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isRankingBlinking] = useState(false);
  useEffect(() => {
    let pageContext = null;
    if (activeView === "new") {
      pageContext = AI_PAGE_CONTEXTS.PROJECT_CREATE;
    } else if (activeView === "edit" || activeView === "view") {
      pageContext = AI_PAGE_CONTEXTS.PROJECT_EDIT;
    } else {
      pageContext = viewMode === "ranking" ? AI_PAGE_CONTEXTS.PROJECT_RANKING || AI_PAGE_CONTEXTS.PROJECTS : AI_PAGE_CONTEXTS.PROJECTS;
    }

    if (pageContext) {
      window.dispatchEvent(
        new CustomEvent("ai_context_changed", {
          detail: { pageContext }
        })
      );
    }
  }, [activeView, viewMode]);
  
  // Consolidate data refresh logic
  const refreshAllData = useCallback(async (options = { silent: true }) => {
    if (!selectedBusinessId) return;
    
    console.log("ProjectsSection: Refreshing all data (View Transition)");
    
    // 1. Clear custom store caches to bypass Zimmmer-level Map caching
    clearCache(selectedBusinessId);
    
    // 2. Invalidate TanStack queries to trigger fresh network requests
    queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["rankingsSummary", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["grantedAccess", selectedBusinessId] });

    // 3. Trigger immediate Zustand store refreshes
    await Promise.all([
      fetchProjectsStore(selectedBusinessId, { silent: options.silent }),
      fetchTeamRankingsStore(selectedBusinessId, { silent: options.silent }),
      checkAllAccessStore(selectedBusinessId)
    ]);
  }, [selectedBusinessId, clearCache, queryClient, fetchProjectsStore, fetchTeamRankingsStore, checkAllAccessStore]);

  // Trigger fresh fetch on mount AND on any major view transition (Redirects)
  useEffect(() => {
    if (selectedBusinessId) {
      // We only want to trigger this when arriving at the main lists
      const isMainView = activeView === "list" || viewMode === "ranking";
      if (isMainView) {
        refreshAllData();
      }
    }
  }, [selectedBusinessId, viewMode, activeView, refreshAllData]);

  // Sync prop to internal state
  useEffect(() => {
    setApiIsArchived(isArchived);
  }, [isArchived]);

  // Initial screen state based on viewMode and role
  useEffect(() => {
    if (viewMode === "ranking") {
      const isViewerRole = userRole === 'viewer';
      setShowRankScreen(!isViewerRole);
      setShowTeamRankings(isViewerRole);
    } else {
      setShowRankScreen(false);
      setShowTeamRankings(false);
    }
  }, [viewMode, userRole]);





  const onToggleTeamRankings = useCallback(() => {
    setShowTeamRankings(true);
    setShowRankScreen(false);
  }, []);

  // UPDATED: This should reflect if the CURRENT USER has locked their ranking
  const [projectCreationLocked, setProjectCreationLocked] = useState(false);
  const [finalizeCompleted, setFinalizeCompleted] = useState(false);
  const [launched, setLaunched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProjectsLoadingRef = useRef(false);

  const adminRanks = useProjectStore(state => state.aiRankings);

  const { locks } = useFieldLockPolling(currentProject?._id, activeView === "edit");

  const {
    userHasRerankAccess,
    userHasRankingAccess,
    canEditProject,
    canReviewProject
  } = useAccessControl(selectedBusinessId);
  const {
    formState,
    formSetters,
    resetForm,
    loadProjectData,
    getPayload,
    validateForm,
  } = useProjectForm();

  // Reset sub-view to list whenever viewMode changes (Top-level navigation)
  useEffect(() => {
    if (activeView !== "list") {
      setActiveView("list");
      setCurrentProject(null);
      resetForm();
    }
  }, [viewMode, setActiveView, resetForm]);

  const isViewer = userRole === "viewer";
  const isEditor = userRole === "super_admin" || userRole === "company_admin" || userRole === "collaborator" || userRole === "user";
  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin" || userRole === "admin";

  const allCollaboratorsLocked =
    lockSummary.locked_users_count === lockSummary.total_users;

  const isRankingLocked = allCollaboratorsLocked;
  const userHasLockedRank = useMemo(() => {
    return lockSummary.locked_users?.some(u => String(u.user_id) === String(myUserId)) || false;
  }, [lockSummary.locked_users, myUserId]);

  const currentStatus = businessStatus;

  const isDraft = currentStatus === "draft";
  const isPrioritized = currentStatus === "prioritized";
  const isLaunched = currentStatus === "launched";
  const isFinalizedView = isPrioritized || isLaunched;

  const portfolioData = {
    totalProjects: projects.length,
    impactDistribution: {
      green: 0,
      orange: 0,
      blue: 0,
    },
    riskBalance: {
      high: 0,
      medium: 0,
      low: 0,
    },
    completedDetails: 0,
  };

  const normalizeId = (id) => {
    if (!id) return '';
    return typeof id === 'object' ? String(id) : String(id);
  };

  const rankMap = useMemo(() => (projects || []).reduce((acc, p) => {
    const id = normalizeId(p._id);
    if (id) {
      const displayRank = (p.rank !== null && p.rank !== undefined) ? p.rank : p.ai_rank;
      if (displayRank !== null && displayRank !== undefined) {
        acc[id] = displayRank;
      }
    }
    return acc;
  }, {}), [projects]);

  const adminRankMap = useMemo(() => (adminRanks || []).reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {}), [adminRanks]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const rankA = rankMap[String(a._id)];
      const rankB = rankMap[String(b._id)];

      // Primary: manual rank
      // Secondary: AI rank
      const rA = (rankA !== null && rankA !== undefined) ? rankA :
        ((a.ai_rank !== null && a.ai_rank !== undefined) ? a.ai_rank : Infinity);
      const rB = (rankB !== null && rankB !== undefined) ? rankB :
        ((b.ai_rank !== null && b.ai_rank !== undefined) ? b.ai_rank : Infinity);

      if (rA === rB) {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      return rA - rB;
    });
  }, [projects, rankMap]);

  const categoryCounts = useMemo(() => {
    const counts = {
      All: projects.length,
      Draft: 0,
      Active: 0,
      "At Risk": 0,
      Paused: 0,
      Killed: 0,
      Completed: 0,
      Scaled: 0
    };

    projects.forEach(p => {
      const statusValue = (p.status || "Draft").toLowerCase();
      if (statusValue === "active") {
        counts.Active++;
      } else if (statusValue === "at risk" || statusValue === "at_risk") {
        counts["At Risk"]++;
      } else if (statusValue === "paused") {
        counts.Paused++;
      } else if (statusValue === "killed") {
        counts.Killed++;
      } else if (statusValue === "completed") {
        counts.Completed++;
      } else if (statusValue === "scaled") {
        counts.Scaled++;
      } else if (statusValue === "draft") {
        counts.Draft++;
      } else {
        // Unknown fallback
        counts.Draft++;
      }
    });

    return counts;
  }, [projects]);

  const aiRankMap = (projects || []).reduce((acc, p) => {
    acc[normalizeId(p._id)] = p.ai_rank;
    return acc;
  }, {});

  const handleShowToast = useCallback((message, type = "error", duration = 3000) => {
    addToast({ message, type, duration });
  }, [addToast]);

  const rankedProjects = useMemo(() => projects.map((p) => {
    const manualRank = rankMap[String(p._id)];
    const aiRank = p.ai_rank || aiRankMap[String(p._id)];
    return {
      ...p,
      rank: manualRank,
      ai_rank: aiRank,
    };
  }), [projects, rankMap, aiRankMap]);

  const isLockedByOther = useCallback((field) =>
    locks.some((l) => l.field_name === field && l.locked_by !== myUserId), [locks, myUserId]);

  const getLockOwnerForField = useCallback((field) => {
    const lock = locks.find(
      (l) => l.field_name === field && l.locked_by !== myUserId
    );
    return lock?.locked_by_name || null;
  }, [locks, myUserId]);



  const checkIfCurrentUserLocked = useCallback((lockedUsers) => {
    if (!Array.isArray(lockedUsers) || lockedUsers.length === 0) {
      return false;
    }
    return lockedUsers.some(user => user.user_id.toString() === myUserId);
  }, [myUserId]);

  const loadProjects = useCallback(async () => {
    try {
      // Parallelize access check and rankings fetch
      const [accessResult, rankingsResult] = await Promise.all([
        checkAllAccessStore(selectedBusinessId),
        fetchTeamRankingsStore(selectedBusinessId)
      ]);

      if (!rankingsResult) return;

      const lockSummaryData = rankingsResult.lockSummary || { locked_users: [] };
      checkIfCurrentUserLocked(lockSummaryData.locked_users);

      if (rankingsResult.businessAccessMode) {
        const apiArchived = rankingsResult.businessAccessMode === 'archived' || rankingsResult.businessAccessMode === 'hidden';
        setApiIsArchived(apiArchived);
      }

      const currentStatus = rankingsResult.businessStatus || "draft";
      if (currentStatus === "draft") {
        setProjectCreationLocked(false);
        setFinalizeCompleted(false);
        setLaunched(false);
      } else if (currentStatus === "prioritizing") {
        setProjectCreationLocked(true);
        setFinalizeCompleted(false);
        setLaunched(false);
      } else if (currentStatus === "prioritized") {
        setProjectCreationLocked(true);
        setFinalizeCompleted(true);
        setLaunched(false);
      } else if (currentStatus === "launched") {
        setProjectCreationLocked(true);
        setFinalizeCompleted(true);
        setLaunched(true);
      }
    } catch (err) {
      console.error("Error in loadProjects:", err);
    }
  }, [checkAllAccessStore, checkIfCurrentUserLocked, fetchTeamRankingsStore, selectedBusinessId]);


  const refreshTeamRankings = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    };
  }, []);

  const handleLockProjectRanking = useCallback(async () => {
    try {
      await lockRanking();
      await loadProjects();
    } catch (err) {
      console.error("Failed to lock project ranking:", err);
    }
  }, [lockRanking, loadProjects]);

  const handleLaunchProjects = useCallback(async () => {
    if (selectedProjectIds.length === 0) {
      handleShowToast(t("Please select at least one project to launch."), "error");
      return;
    }

    // Check if all selected projects have been ranked
    const unrankedProjects = selectedProjectIds.filter(id => {
      const rank = rankMap[String(id)];
      return rank === null || rank === undefined;
    });

    if (unrankedProjects.length > 0) {
      handleShowToast(t("One or more selected projects are not ranked. All projects must be ranked before launch."), "error", 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      const { success, error } = await launchProjects(selectedProjectIds);

      if (success) {
        setLaunched(true);
        addToast({ message: t("Projects_launched_Ready_for_execution."), type: "success" });
        clearCache(selectedBusinessId);
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
        await loadProjects();
        setSelectedProjectIds([]); // Clear selection

      } else {
        handleShowToast(error || "Failed to launch projects.", "error", 7000);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProjectIds, launchProjects, loadProjects, handleShowToast]);

  const toggleProjectSelection = useCallback((projectId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  const handleNewProject = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    resetForm();
    setCurrentProject(null);
    setActiveView("new");
  }, [resetForm]);

  const handleDelete = useCallback(async (projectId) => {
    if (isViewer || !isSuperAdmin) return;

    const { success, error } = await deleteProject(projectId);
    if (success) {
      handleShowToast("Project killed successfully!", "success");
      clearCache(selectedBusinessId);
      queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
      queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
      await loadProjects();
    } else {

      handleShowToast(error || "Failed to kill project.", "error");
    }
  }, [isViewer, isSuperAdmin, deleteProject, loadProjects, handleShowToast]);

  const handlePerformReview = useCallback((project) => {
    setSelectedReviewProject(project);
    setReviewType("review");
    openModal('projectReview');
  }, [openModal]);

  const handleAdhocUpdate = useCallback((project) => {
    setSelectedReviewProject(project);
    setReviewType("adhoc");
    openModal('projectReview');
  }, [openModal]);

  const handleFieldFocus = useCallback((fieldName) => {
    lockFieldSafe(currentProject?._id, fieldName);
  }, [currentProject?._id]);

  const handleFieldEdit = useCallback(() => {
    heartbeatSafe(currentProject?._id);
  }, [currentProject?._id]);

  const handleEditProject = useCallback((project, mode = "edit") => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: project._id } }));
    setCurrentProject(project);
    loadProjectData(project);
    setActiveView(mode);
  }, [loadProjectData]);

  const handleBackToList = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    unlockAllFieldsSafe(currentProject?._id);
    setActiveView("list");
    setCurrentProject(null);
    resetForm();
  }, [currentProject?._id, resetForm]);

  const handleCreate = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) return;

    setIsSubmitting(true);
    try {
      const userId = useAuthStore.getState().userId;
      const payload = getPayload(userId, selectedBusinessId);

      const { success, error } = await createProject(payload);
      if (success) {
        handleShowToast("Project created successfully!", "success");
        await unlockAllFieldsSafe(currentProject?._id);
        clearCache(selectedBusinessId);
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
        await loadProjects();
        handleBackToList();

      } else {
        handleShowToast(error || "Failed to create project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, getPayload, selectedBusinessId, createProject, currentProject?._id, loadProjects, handleBackToList, handleShowToast]);



  const executeSave = useCallback(async (payload, justification = null) => {
    setIsSubmitting(true);
    try {
      if (justification) {
        payload.justification = justification;
      }

      const { success, error } = await updateProject(currentProject._id, payload);
      if (success) {
        handleShowToast("Project updated successfully!", "success");
        await unlockAllFieldsSafe(currentProject?._id);
        clearCache(selectedBusinessId);
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
        await loadProjects();
        handleBackToList();

      } else {
        handleShowToast(error || "Failed to update project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProject, currentProject?._id, loadProjects, handleBackToList, handleShowToast]);

  const handleSave = useCallback(async () => {
    if (!canEditProject(currentProject, isEditor, myUserId, businessStatus, apiIsArchived)) {
      handleShowToast("You are not allowed to edit this project", "error");
      return;
    }

    if (!currentProject?._id) return;

    const validation = validateForm();
    if (!validation.isValid) return;

    try {
      const userId = useAuthStore.getState().userId;
      const payload = getPayload(userId, selectedBusinessId);

      const oldStatus = (currentProject.status || "Draft").toLowerCase();
      const newStatus = (payload.status || "Draft").toLowerCase();

      if (oldStatus !== newStatus) {
        setPendingSavePayload(payload);
        openModal('stateChange');
        setIsSubmitting(false);
        return;
      }

      await executeSave(payload);
    } catch (err) {
      console.error("Error in prepare save:", err);
      setIsSubmitting(false);
    }
  }, [canEditProject, currentProject, isEditor, myUserId, businessStatus, apiIsArchived, validateForm, getPayload, selectedBusinessId, executeSave, handleShowToast]);

  const submitReview = useCallback(async (data) => {
    if (!selectedReviewProject?._id) return;

    try {
      const { success, error } = reviewType === "review" 
        ? await reviewProjectAction(selectedReviewProject._id, data)
        : await adhocUpdateProjectAction(selectedReviewProject._id, data);

      if (success) {
        handleShowToast(reviewType === "review" ? "Review submitted successfully!" : "Update submitted successfully!", "success");
        clearCache(selectedBusinessId);
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
        await loadProjects();
      } else {

        handleShowToast(error || "Failed to process update", "error");
      }

    } catch (err) {
      console.error("Review submit error:", err);
      const errorMsg = err.response?.data?.error || "Failed to process update";
      handleShowToast(errorMsg, "error");
    }
  }, [selectedReviewProject?._id, reviewType, loadProjects, handleShowToast]);


  const handleAccordionSelect = useCallback((eventKey) => {
    setActiveAccordionKey((prevKey) => {
      const nextKey = prevKey === eventKey ? null : eventKey;
      if (nextKey === "0" && prevKey !== "0") {
        refreshTeamRankings();
      }
      return nextKey;
    });
  }, [refreshTeamRankings]);


  useEffect(() => {
    if (!selectedBusinessId) return;
    loadProjects();
  }, [selectedBusinessId, loadProjects]);

  // Removed redundant loadTeamRankings and loadAdminRankings effects as they are now in loadProjects

  const renderProjectForm = () => {
    // Use ProjectDetails component for view mode
    if (activeView === "view") {
      return (
        <ProjectDetails
          project={currentProject}
          onBack={handleBackToList}
          onEdit={(project) => handleEditProject(project, "edit")}
          onPerformReview={handlePerformReview}
          onAdhocUpdate={handleAdhocUpdate}
          canEdit={currentProject && canEditProject(currentProject, isEditor, myUserId, businessStatus, apiIsArchived)}
          canReview={currentProject && canReviewProject(currentProject, isSuperAdmin, myUserId, apiIsArchived)}
        />
      );
    }

    // Use ProjectForm for new and edit modes
    return (
      <ProjectForm
        mode={activeView}
        readOnly={
          activeView === "view" ||
          (currentProject && !canEditProject(currentProject, isEditor, myUserId, businessStatus, apiIsArchived, isSuperAdmin))
        }
        {...formState}
        {...formSetters}
        accountableOwnerId={formState.accountableOwnerId}
        setAccountableOwnerId={formSetters.setAccountableOwnerId}
        onBack={handleBackToList}
        onSubmit={activeView === "new" ? handleCreate : handleSave}
        isLockedByOther={isLockedByOther}
        getLockOwnerForField={getLockOwnerForField}
        onFieldFocus={handleFieldFocus}
        onFieldEdit={handleFieldEdit}
        isSubmitting={isSubmitting}
        selectedBusinessId={selectedBusinessId}
        projectId={currentProject?._id}
        launchStatus={currentProject?.launch_status}
        initialStatus={currentProject?.status}
        decisionLog={currentProject?.decision_log}
        isAdmin={isSuperAdmin}
        validateForm={validateForm}
      />
    );
  };

  const renderProjectList = () => {
    // isReadOnly is now defined at the top level of the component

    return (
      <>
        {/* View mode handled via global navigation dropdown */}
        {viewMode === "ranking" ? (
          <>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                {!isViewer && (
                  <div className="status-tabs-container" style={{ WebkitOverflowScrolling: 'touch', overflowX: 'auto' }}>
                    <button
                      onClick={() => {
                        setShowRankScreen(true);
                        setShowTeamRankings(false);
                      }}
                      className={`status-tab ${showRankScreen ? 'active' : ''} ${isRankingBlinking ? 'blink-highlight' : ''}`}
                    >
                      <ListOrdered size={16} />
                      {t("Rank_Projects")} {readOnlyIndicator}
                    </button>

                    {lockSummary.total_users > 0 && (
                      <button
                        onClick={onToggleTeamRankings}
                        className={`status-tab ${showTeamRankings ? 'active' : ''}`}
                      >
                        <Users size={16} />
                        {t("Rankings_View")} {readOnlyIndicator}
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Repositioned Collaborator Progress - Admin Only */}
              {isSuperAdmin && lockSummary.total_users > 0 && (
                <div className="collaborator-progress-compact d-flex align-items-center gap-2 px-3 py-2 mt-md-0 mt-2" style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px', // Matches status-tabs
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}>
                  <Users size={16} className="text-primary" />
                  <span className="fw-600 text-slate-700" style={{ fontWeight: '600' }}>{t("Collaborator Progress")}:</span>
                  <span className="badge bg-primary rounded-pill" style={{ fontSize: '11px' }}>
                    {lockSummary.locked_users_count} / {lockSummary.total_users}
                  </span>

                  {lockSummary.total_users > 0 && lockSummary.locked_users_count === lockSummary.total_users && (
                    <CheckCircle size={14} className="text-success" />
                  )}
                </div>
              )}
            </div>

            {isLoadingProjects && projects.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "300px" }}>

                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {showRankScreen && (
                  <RankProjectsPanel
                    show={showRankScreen}
                    projects={rankedProjects}
                    onLockRankings={handleLockProjectRanking}
                    onRankSaved={async () => {
                      await refreshAllData();
                      if (useProjectStore.getState().lockSummary.total_users === 0) {
                        setViewMode("projects");
                        setShowRankScreen(false);
                        setShowTeamRankings(false);
                      } else {
                        onToggleTeamRankings();
                      }
                    }}
                    isAdmin={isSuperAdmin}
                    isRankingLocked={isRankingLocked}
                    businessStatus={businessStatus}
                    userHasRerankAccess={userHasRerankAccess}
                    userHasRankingAccess={userHasRankingAccess}
                    onShowToast={handleShowToast}
                    isArchived={apiIsArchived}
                    userHasLockedRanking={userHasLockedRank}
                  />
                )}

                {showTeamRankings && (
                  <TeamRankingsView
                    activeAccordionKey={activeAccordionKey}
                    onAccordionSelect={handleAccordionSelect}
                    isSuperAdmin={isSuperAdmin}
                    user={user}
                    sortedProjects={sortedProjects}
                    rankMap={rankMap}
                    adminRankMap={adminRankMap}
                    userRole={userRole}
                    businessId={selectedBusinessId}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="management-row-container mb-4" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="status-tabs-container">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`status-tab ${selectedCategory === cat.id ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span className="status-name">{t(cat.label)}</span>
                      <span className="status-count">{categoryCounts[cat.id] || 0}</span>
                    </button>
                  ))}
                </div>
 
              </div>

              <div className="management-buttons d-flex gap-2">
                {selectedProjectIds.length > 0 && !isViewer && !isArchived && getUserLimits().project && isSuperAdmin && (
                  <button
                    onClick={handleLaunchProjects}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#9333ea',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Rocket size={18} />
                    {isSubmitting ? t("Launching...") : `${t("Launch")} (${selectedProjectIds.length})`}
                  </button>
                )}

                {!isViewer && !isArchived && getUserLimits().project && (
                  <button
                    onClick={handleNewProject}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '700',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Plus size={18} />
                    {t("New_Project")}
                  </button>
                )}
              </div>
            </div>

            <ProjectsList
              isLoading={isLoadingProjects}
              sortedProjects={sortedProjects}

              rankMap={rankMap}
              finalizeCompleted={finalizeCompleted}
              launched={launched}
              isViewer={isViewer}
              isAdmin={isSuperAdmin}
              isEditor={isEditor}
              isDraft={isDraft}
              projectCreationLocked={projectCreationLocked}
              isFinalizedView={isFinalizedView}
              canEditProject={(project) =>
                canEditProject(project, isEditor, myUserId, businessStatus, apiIsArchived, isSuperAdmin)
              }
              onEdit={(project) => handleEditProject(project, "edit")}
              onView={(project) => handleEditProject(project, "view")}
              onDelete={handleDelete}
              onPerformReview={handlePerformReview}
              onAdhocUpdate={handleAdhocUpdate}
              canReviewProject={canReviewProject}
              myUserId={myUserId}
              selectedCategory={selectedCategory}
              isArchived={apiIsArchived}
              selectedProjectIds={selectedProjectIds}
              onToggleSelection={toggleProjectSelection}
              selectionDisabled={isGeneratingAIRankings || businessStatus !== "draft"}
            />
          </>
        )}
      </>
    );
  };

  return (
    <>

      <StateChangeModal
        show={isModalOpen('stateChange')}
        onHide={() => {
          closeModal('stateChange');
          setPendingSavePayload(null);
        }}
        onConfirm={(justification) => {
          closeModal('stateChange');
          if (pendingSavePayload) {
            executeSave(pendingSavePayload, justification);
          }
        }}
        oldState={currentProject?.status || t("Draft")}
        newState={pendingSavePayload?.status || t("Unknown")}
      />

      {isGeneratingAIRankings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5>Generating AI Rankings...</h5>
            <p className="text-muted mb-0">Please wait while we analyze your projects</p>
          </div>
        </div>
      )}

      <Container fluid className="projects-wrapper" ref={containerRef}>
        {activeView === "list" ? renderProjectList() : renderProjectForm()}
      </Container>

      <ProjectReviewModal
        isOpen={isModalOpen('projectReview')}
        onClose={() => closeModal('projectReview')}
        project={selectedReviewProject}
        type={reviewType}
        onSubmit={submitReview}
      />
    </>
  );
};

export default ProjectsSection;