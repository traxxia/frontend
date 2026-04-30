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


import { Users, CheckCircle, Plus, ListOrdered, Rocket, Menu, BarChart4, ChevronDown, Check, List } from "lucide-react";
import RankProjectsPanel from "../components/RankProjectsPanel";
import TeamRankingsView from "../components/TeamRankingsView";
import ProjectsList from "../components/ProjectsList";
import ProjectForm from "../components/ProjectForm";
import ProjectDetails from "../components/ProjectDetails";
import ProjectReviewModal from "../components/ProjectReviewModal";
import StateChangeModal from "../components/StateChangeModal";
import ConfirmationModal from "../components/ConfirmationModal";
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
    deleteProject,
    createProject,
    updateProject,
    launchProjects,
    lockRanking,
    reviewProject: reviewProjectAction,
    adhocUpdateProject: adhocUpdateProjectAction,
    clearCache,
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
    // Prevent unmounting the page incorrectly: only report count when loading has finished
    if (onProjectCountChange && !isLoadingProjects) {
      onProjectCountChange(projects.length);
    }
  }, [projects.length, isLoadingProjects, onProjectCountChange]);

  const location = useLocation();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState(null);
  
  // Remove ranking specific view mode syncs as this is now handled by RankingSection
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [pendingSavePayload, setPendingSavePayload] = useState(null);
  const [pendingStateChanges, setPendingStateChanges] = useState([]);
  const [selectedReviewProject, setSelectedReviewProject] = useState(null);
  const [reviewType, setReviewType] = useState("review");

  const [apiIsArchived, setApiIsArchived] = useState(isArchived);
  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isRankingBlinking] = useState(false);
  const [showMissingRankModal, setShowMissingRankModal] = useState(false);

  useEffect(() => {
    let pageContext = null;
    if (activeView === "new") {
      pageContext = AI_PAGE_CONTEXTS.PROJECT_CREATE;
    } else if (activeView === "edit" || activeView === "view") {
      pageContext = AI_PAGE_CONTEXTS.PROJECT_EDIT;
    } else {
      pageContext = AI_PAGE_CONTEXTS.PROJECTS;
    }

    if (pageContext) {
      window.dispatchEvent(
        new CustomEvent("ai_context_changed", {
          detail: { pageContext }
        })
      );
    }
  }, [activeView]);
  
  // Consolidate data refresh logic
  // Uses getState()-based stable refs to avoid re-creating this callback on every Zustand update
  const refreshAllData = useCallback(async (options = { silent: true }) => {
    if (!selectedBusinessId) return;
    
    // Update signature to prevent immediate redundant automated refresh
    lastRefreshRef.current = `${selectedBusinessId}-${activeView}`;
    
    console.log("ProjectsSection: Refreshing all data");
    
    // 1. Clear custom store caches
    useProjectStore.getState().clearCache(selectedBusinessId);
    
    // 2. Invalidate TanStack queries
    queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["rankingsSummary", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["grantedAccess", selectedBusinessId] });

    // 3. Trigger store refreshes using stable getState() calls
    const accessData = await useProjectStore.getState().checkAllAccess(selectedBusinessId);

    if (accessData?.businessAccessMode) {
      const apiArchived = accessData.businessAccessMode === 'archived' || accessData.businessAccessMode === 'hidden';
      setApiIsArchived(apiArchived);
    }
  }, [selectedBusinessId, queryClient]); // stable deps only

  // Signature guard to prevent redundant calls during rapid state/view transitions
  const lastRefreshRef = useRef("");
  const hasMountedRef = useRef(false);
  
  // Trigger fresh fetch on mount only. The signature guard prevents repeat calls
  // for the same view configuration (e.g. switching tabs back and forth).
  // Trigger fresh fetch on mount only. The signature guard prevents repeat calls
  // for the same view configuration (e.g. switching tabs back and forth).
  useEffect(() => {
    if (!selectedBusinessId) return;

    // On mount: fetch access data (useProjects handles projects fetching automatically)
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      const isMainView = activeView === "list";
      if (isMainView) {
        const signature = `${selectedBusinessId}-${activeView}`;
        lastRefreshRef.current = signature;
        
        // Fetch access control only. It's cached in projectStore.
        useProjectStore.getState().checkAllAccess(selectedBusinessId).then(accessData => {
          if (accessData?.businessAccessMode) {
            setApiIsArchived(
              accessData.businessAccessMode === 'archived' || accessData.businessAccessMode === 'hidden'
            );
          }
        }).catch(err => console.error(err));
      }
      return;
    }

    // After mount: only refresh if view transitions (e.g. navigating back to list from edit)
    const signature = `${selectedBusinessId}-${activeView}`;
    if (lastRefreshRef.current === signature) {
      // console.log("ProjectsSection: Skipping redundant refresh for signature:", signature);
      return;
    }

    const isMainView = activeView === "list";
    if (isMainView) {
      lastRefreshRef.current = signature;
      refreshAllData();
    }
  }, [selectedBusinessId, activeView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync prop to internal state
  useEffect(() => {
    setApiIsArchived(isArchived);
  }, [isArchived]);









  // Derived status flags based on businessStatus from store
  const projectCreationLocked = useMemo(() => ["prioritizing", "prioritized", "launched"].includes(businessStatus), [businessStatus]);
  const finalizeCompleted = useMemo(() => ["prioritized", "launched"].includes(businessStatus), [businessStatus]);
  const launched = useMemo(() => businessStatus === "launched", [businessStatus]);

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


  // Reset sub-view to list whenever activeView goes entirely out of scope (Top-level navigation)
  // Since viewMode was removed, we don't have an equivalent top-level reset trigger here unless needed.

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

  const storeProjects = useProjectStore(state => state.projects);
  const rankMap = useMemo(() => {
    // Priority 1: User-specific ranks from the Zustand store (populated via fetchTeamRankings)
    // Priority 2: Global ranks from the TanStack Query projects list
    const projectsToProcess = projects || [];
    const storeRankingMap = (storeProjects || []).reduce((acc, p) => {
      const id = normalizeId(p._id || p.project_id);
      if (id) acc[id] = p.rank;
      return acc;
    }, {});

    return projectsToProcess.reduce((acc, p) => {
      const id = normalizeId(p._id);
      if (id) {
        // Check store first for collaborator's personal rank, then fallback to p.rank (global) or p.ai_rank
        const storeRank = storeRankingMap[id];
        const displayRank = (storeRank !== null && storeRank !== undefined) ? storeRank : 
                          ((p.rank !== null && p.rank !== undefined) ? p.rank : p.ai_rank);
        
        if (displayRank !== null && displayRank !== undefined) {
          acc[id] = displayRank;
        }
      }
      return acc;
    }, {});
  }, [projects, storeProjects]);


  const adminRankMap = useMemo(() => (adminRanks || []).reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {}), [adminRanks]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const idA = normalizeId(a._id);
      const idB = normalizeId(b._id);

      const rA = rankMap[idA] !== undefined ? rankMap[idA] : Infinity;
      const rB = rankMap[idB] !== undefined ? rankMap[idB] : Infinity;

      if (rA === rB) {
        return new Date(b.created_at) - new Date(a.created_at);
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




  const handleLockProjectRanking = useCallback(async () => {
    try {
      await lockRanking();
      await refreshAllData();
    } catch (err) {
      console.error("Failed to lock project ranking:", err);
    }
  }, [lockRanking, refreshAllData]);


  const executeLaunchProjects = useCallback(async () => {
    try {
      setShowMissingRankModal(false);
      setIsSubmitting(true);
      const { success, error, data } = await launchProjects(selectedProjectIds);

      if (success) {
        addToast({ message: t("Projects_launched_Ready_for_execution."), type: "success" });
        
        // Immediately update TanStack Query cache with fresh project data, merging to preserve ranks
        if (data && data.projects) {
          queryClient.setQueryData(["projects", selectedBusinessId], (oldProjects = []) => {
            return data.projects.map(newProj => {
              const existingProj = oldProjects.find(p => String(p._id) === String(newProj._id));
              return existingProj ? { ...existingProj, ...newProj } : newProj;
            });
          });
        }

        clearCache(selectedBusinessId);
        // We still invalidate to ensure total sync, but setQueryData fixed the immediate "old data" issue
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
        
        await refreshAllData();
        setSelectedProjectIds([]); // Clear selection

      } else {
        handleShowToast(error || "Failed to launch projects.", "error", 7000);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProjectIds, launchProjects, refreshAllData, handleShowToast, addToast, queryClient, selectedBusinessId, clearCache]);

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
      setShowMissingRankModal(true);
      return;
    }

    await executeLaunchProjects();
  }, [selectedProjectIds, rankMap, handleShowToast, t, executeLaunchProjects]);

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
      await refreshAllData();
    } else {

      handleShowToast(error || "Failed to kill project.", "error");
    }
  }, [isViewer, isSuperAdmin, deleteProject, refreshAllData, handleShowToast]);

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
        await refreshAllData();
        handleBackToList();

      } else {
        handleShowToast(error || "Failed to create project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, getPayload, selectedBusinessId, createProject, currentProject?._id, refreshAllData, handleBackToList, handleShowToast]);



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
        await refreshAllData();
        handleBackToList();

      } else {
        handleShowToast(error || "Failed to update project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProject, currentProject?._id, refreshAllData, handleBackToList, handleShowToast]);

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
      const oldLearningState = (currentProject.learning_state || "Testing").toLowerCase();
      const newLearningState = (payload.learning_state || "Testing").toLowerCase();

      const statusChanged = oldStatus !== newStatus;
      const learningStateChanged = oldLearningState !== newLearningState;
      const isProjectLaunched = (currentProject.launch_status || "").toLowerCase() === "launched";

      const isKilled = newStatus === 'killed';

      // If either status or learning state changed, show justification modal
      // We show it for ALL launched projects, OR if the project is being "Killed" (even if not launched)
      if ((isProjectLaunched || isKilled) && (statusChanged || learningStateChanged)) {
        const changes = [];
        if (statusChanged) {
          changes.push({
            label: t("Status"),
            oldValue: currentProject.status || "Draft",
            newValue: payload.status || "Draft"
          });
        }
        if (learningStateChanged) {
          changes.push({
            label: t("Learning State"),
            oldValue: currentProject.learning_state || "Testing",
            newValue: payload.learning_state || "Testing"
          });
        }
        setPendingSavePayload(payload);
        setPendingStateChanges(changes);
        openModal('stateChange');
        setIsSubmitting(false);
        return;
      }

      await executeSave(payload);
    } catch (err) {
      console.error("Error in prepare save:", err);
      setIsSubmitting(false);
    }
  }, [canEditProject, currentProject, isEditor, myUserId, businessStatus, apiIsArchived, validateForm, getPayload, selectedBusinessId, executeSave, handleShowToast, t]);

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
        await refreshAllData();
      } else {

        handleShowToast(error || "Failed to process update", "error");
      }

    } catch (err) {
      console.error("Review submit error:", err);
      const errorMsg = err.response?.data?.error || "Failed to process update";
      handleShowToast(errorMsg, "error");
    }
  }, [selectedReviewProject?._id, reviewType, refreshAllData, handleShowToast]);


  const handleAccordionSelect = useCallback((eventKey) => {
    setActiveAccordionKey((prevKey) => {
      const nextKey = prevKey === eventKey ? null : eventKey;
      if (nextKey === "0" && prevKey !== "0") {
        refreshAllData();
      }
      return nextKey;
    });
  }, [refreshAllData]);


  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    };
  }, []);

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

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".status-dropdown-wrapper")) {
        setIsStatusDropdownOpen(false);
      }
    };
    if (isStatusDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isStatusDropdownOpen]);

  const toggleCategory = useCallback((catId) => {
    setSelectedCategories((prev) => {
      if (catId === "All") return ["All"];
      
      let next = prev.filter(id => id !== "All");
      if (next.includes(catId)) {
        next = next.filter(id => id !== catId);
      } else {
        next = [...next, catId];
      }
      
      return next.length === 0 ? ["All"] : next;
    });
  }, []);

  const renderProjectList = () => {
    const isAllSelected = selectedCategories.includes("All");
    
    const selectedCategoryLabel = isAllSelected 
      ? t("all") 
      : selectedCategories.length === 1 
        ? t(CATEGORIES.find(c => c.id === selectedCategories[0])?.label || "all")
        : `${selectedCategories.length} ${t("selected")}`;

    const totalCount = isAllSelected 
      ? projects.length 
      : projects.filter(p => {
          const statusValue = (p.status || "Draft").toLowerCase();
          return selectedCategories.some(catId => {
            if (catId === "At Risk" && (statusValue === "at risk" || statusValue === "at_risk")) return true;
            return statusValue === catId.toLowerCase();
          });
        }).length;

    return (
      <>
        {/* Secondary Tabs - Toggle Style */}
        <div className="secondary-tabs-container">
          <button 
            className={`secondary-tab ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}
          >
            <List size={16} /> {t("Summary")}
          </button>
          <button 
            className={`secondary-tab ${activeView === "analysis" ? "active" : ""}`}
            onClick={() => {}} // Disabled
            style={{ cursor: 'not-allowed' }}
            title={t("Executive Analysis (Coming Soon)")}
          >
            <BarChart4 size={16} /> {t("Executive Analysis")}
          </button>
        </div>

        <div className="bet-ledger-container premium-card">
          <div className="bet-ledger-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 className="bet-ledger-title">
              {t("BET LEDGER")} — <span className="text-muted text-uppercase" style={{ fontSize: '11px', fontWeight: '700' }}>{t("ALL INITIATIVES")}</span>
            </h2>

            <div className="bet-ledger-actions d-flex align-items-center gap-3">
              {/* Custom Status Dropdown */}
              <div className="status-dropdown-wrapper">
                <div 
                  className="status-dropdown-btn"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  <div className="status-label-group">
                    <span className="status-label-prefix">{t("STATUS")}</span>
                    <span className="status-label-current">
                      {t(selectedCategoryLabel)} · {totalCount}
                    </span>
                  </div>
                  <ChevronDown size={14} color="#1e40af" />
                </div>

                {isStatusDropdownOpen && (
                  <div className="status-dropdown-menu">
                    {CATEGORIES.map(cat => (
                      <div 
                        key={cat.id} 
                        className="status-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(cat.id);
                        }}
                      >
                        <div className="status-menu-left">
                          <div className={`status-checkbox ${selectedCategories.includes(cat.id) ? "checked" : ""}`}>
                            {selectedCategories.includes(cat.id) && <Check size={12} color="white" />}
                          </div>
                          <span className="status-name-text">{t(cat.label)}</span>
                        </div>
                        <span className="status-count-text">{categoryCounts[cat.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isViewer && !isArchived && getUserLimits().project && (
                <button
                  onClick={handleNewProject}
                  className="btn-new-project-premium"
                >
                  <Plus size={18} />
                  {t("New Bet")}
                </button>
              )}

              {selectedProjectIds.length > 0 && !isViewer && !isArchived && getUserLimits().project && isSuperAdmin && (
                <button
                  onClick={handleLaunchProjects}
                  disabled={isSubmitting}
                  className="btn-launch-premium"
                >
                  <Rocket size={18} />
                  {isSubmitting ? t("Launching...") : `${t("Launch")} (${selectedProjectIds.length})`}
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
            selectedCategories={selectedCategories}
            isArchived={apiIsArchived}
            selectedProjectIds={selectedProjectIds}
            onToggleSelection={toggleProjectSelection}
            selectionDisabled={isGeneratingAIRankings || businessStatus !== "draft"}
          />
        </div>
      </>
    );
  };
  return (
    <>
      <ConfirmationModal
        show={showMissingRankModal}
        onHide={() => setShowMissingRankModal(false)}
        onConfirm={executeLaunchProjects}
        title={t("Missing Rankings")}
        message={t("One or more selected projects are not ranked. Are you sure you want to proceed without ranking?")}
        confirmText={t("Proceed")}
        cancelText={t("Cancel")}
        confirmVariant="warning"
      />

      <StateChangeModal
        show={isModalOpen('stateChange')}
        onHide={() => {
          closeModal('stateChange');
          setPendingSavePayload(null);
          setPendingStateChanges([]);
        }}
        onConfirm={(justification) => {
          closeModal('stateChange');
          if (pendingSavePayload) {
            executeSave(pendingSavePayload, justification);
          }
          setPendingStateChanges([]);
        }}
        changes={pendingStateChanges}
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