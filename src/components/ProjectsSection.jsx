import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Row, Col, Button, Form, Dropdown, Alert, Container } from "react-bootstrap";
import axios from "axios";
import { lockField, heartbeat, unlockFields } from "@/hooks/fieldlockapi";
import { useFieldLockPolling } from "@/hooks/useFieldLockPolling";
import { useProjectOperations } from "../hooks/useProjectOperations";
import { useRankingOperations } from "../hooks/useRankingOperations";
import { useAccessControl } from "../hooks/useAccessControl";
import { useProjectForm } from "../hooks/useProjectForm";
import { callMLRankingAPI, saveAIRankings } from "../services/aiRankingService";

import { MdArrowDownward } from "react-icons/md";
import { Users, CheckCircle, Plus, ListOrdered, Lock, Rocket, Briefcase } from "lucide-react";
import CollaborationCard from "../components/CollaborationCard";
import PortfolioOverview from "../components/PortfolioOverview";
import RankProjectsPanel from "../components/RankProjectsPanel";
import TeamRankingsView from "../components/TeamRankingsView";
import ProjectsList from "../components/ProjectsList";
import ProjectForm from "../components/ProjectForm";
import ProjectDetails from "../components/ProjectDetails";
import ToastNotifications from "../components/ToastNotifications";
import "../styles/ProjectsSection.css";

const ProjectsSection = ({
  selectedBusinessId,
  onProjectCountChange,
  onBusinessStatusChange,
  companyAdminIds,
  isArchived,
}) => {
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState("");
  const myUserId = sessionStorage.getItem("userId");
  const user = sessionStorage.getItem("userName");

  const [activeView, setActiveView] = useState("list");
  const containerRef = useRef(null);

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

  const [viewMode, setViewMode] = useState("projects"); // "projects" or "ranking"
  const [currentProject, setCurrentProject] = useState(null);
  const [showRankScreen, setShowRankScreen] = useState(false);
  const [showTeamRankings, setShowTeamRankings] = useState(false); // New state for Team Rankings Panel
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);

  const [projects, setProjects] = useState([]);
  const [teamRankings, setTeamRankings] = useState([]);
  const [isRankingsLoading, setIsRankingsLoading] = useState(false);
  const [adminRanks, setAdminRanks] = useState([]);

  // NEW: Business-level status
  const [businessStatus, setBusinessStatus] = useState("draft");
  const [apiIsArchived, setApiIsArchived] = useState(isArchived);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isRankingBlinking, setIsRankingBlinking] = useState(false);

  // Sync prop to internal state
  useEffect(() => {
    setApiIsArchived(isArchived);
  }, [isArchived]);

  const categories = [
    { id: "All", label: t("all") || "All" },
    { id: "Draft", label: t("Draft") || "Draft" },
    { id: "Active", label: t("Active") || "Active" },
    { id: "At Risk", label: t("At Risk") || "At Risk" },
    { id: "Paused", label: t("Paused") || "Paused" },
    { id: "Killed", label: t("Killed") || "Killed" },
    { id: "Scaled", label: t("Scaled") || "Scaled" },
  ];

  const onToggleTeamRankings = () => {
    const newState = !showTeamRankings;
    setShowTeamRankings(newState);
    if (newState) setShowRankScreen(false);
  };

  // UPDATED: This should reflect if the CURRENT USER has locked their ranking
  const [rankingsLocked, setRankingsLocked] = useState(false);
  const [projectCreationLocked, setProjectCreationLocked] = useState(false);
  const [rankingLockedFirst, setRankingLockedFirst] = useState(false);
  const [finalizeCompleted, setFinalizeCompleted] = useState(false);
  const [launched, setLaunched] = useState(false);

  // UPDATED: Lock summary now includes locked_users array
  const [lockSummary, setLockSummary] = useState({
    locked_users_count: 0,
    total_users: 0,
    locked_users: [], // NEW: Array of locked user objects
  });

  const [showLockToast, setShowLockToast] = useState(false);
  const [showProjectLockToast, setShowProjectLockToast] = useState(false);
  const [showFinalizeToast, setShowFinalizeToast] = useState(false);
  const [showLaunchToast, setShowLaunchToast] = useState(false);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showAIRankingToast, setShowAIRankingToast] = useState(false);
  const [isGeneratingAIRankings, setIsGeneratingAIRankings] = useState(false);
  const [validationMessageType, setValidationMessageType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { locks } = useFieldLockPolling(currentProject?._id);
  const { fetchProjects, deleteProject, createProject, updateProject, launchProjects } =
    useProjectOperations(selectedBusinessId, onProjectCountChange);
  const { fetchTeamRankings, fetchAdminRankings, lockRanking } =
    useRankingOperations(selectedBusinessId, companyAdminIds);

  // ... (jumping to renderProjectList)


  const {
    userHasRerankAccess,
    checkBusinessAccess,
    checkProjectsAccess,
    checkAllAccess,
    canEditProject
  } = useAccessControl(selectedBusinessId);
  const {
    formState,
    formSetters,
    resetForm,
    loadProjectData,
    getPayload,
    validateForm,
  } = useProjectForm();

  const isViewer = userRole === "viewer";
  const isEditor = userRole === "super_admin" || userRole === "company_admin" || userRole === "collaborator";
  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin";

  const allCollaboratorsLocked =
    lockSummary.locked_users_count === lockSummary.total_users;

  const isRankingLocked = allCollaboratorsLocked;

  const isFinalized =
    rankingsLocked && projectCreationLocked && rankingLockedFirst;

  // UPDATED: Use businessStatus instead of derived status
  const status = businessStatus;

  const isDraft = status === "draft";
  const isPrioritizing = status === "prioritizing";
  const isPrioritized = status === "prioritized";
  const isLaunched = status === "launched";
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

  const normalizeId = (id) => String(id);
  const rankMap = (projects || []).reduce((acc, p) => {
    acc[normalizeId(p._id)] = p.rank;
    return acc;
  }, {});

  const adminRankMap = adminRanks.reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {});

  const handleShowToast = (message, type = "error", duration = 3000) => {
    setValidationMessage(message);
    setValidationMessageType(type);
    setShowValidationToast(true);
    setTimeout(() => setShowValidationToast(false), duration);
  };

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
      } else if (statusValue === "scaled") {
        counts.Scaled++;
      } else {
        // Includes 'draft', 'launched', and any unknown fallback
        counts.Draft++;
      }
    });

    return counts;
  }, [projects]);

  const aiRankMap = (projects || []).reduce((acc, p) => {
    acc[normalizeId(p._id)] = p.ai_rank;
    return acc;
  }, {});

  const rankedProjects = projects.map((p) => {
    const manualRank = rankMap[String(p._id)];
    const aiRank = p.ai_rank || aiRankMap[String(p._id)];
    return {
      ...p,
      rank: manualRank,
      ai_rank: aiRank,
    };
  });

  const getToken = () => sessionStorage.getItem("token");

  const isLockedByOther = (field) =>
    locks.some((l) => l.field_name === field && l.locked_by !== myUserId);

  const getLockOwnerForField = (field) => {
    const lock = locks.find(
      (l) => l.field_name === field && l.locked_by !== myUserId
    );
    return lock?.locked_by_name || null;
  };

  const lockFieldSafe = async (fieldName) => {
    try {
      if (!currentProject?._id) return;
      const token = getToken();
      if (!token) return;
      await lockField(currentProject._id, fieldName, token);
    } catch (err) {
      console.error("Failed to lock field", fieldName, err);
    }
  };

  const heartbeatSafe = async () => {
    try {
      if (!currentProject?._id) return;
      const token = getToken();
      if (!token) return;
      await heartbeat(currentProject._id, token);
    } catch (err) {
      console.error("Failed to send lock heartbeat", err);
    }
  };

  const unlockAllFieldsSafe = async () => {
    try {
      if (!currentProject?._id) return;
      const token = getToken();
      if (!token) return;
      await unlockFields(currentProject._id, null, token);
    } catch (err) {
      console.error("Failed to unlock fields", err);
    }
  };

  const updateBusinessStatus = async (newStatus) => {
    if (!selectedBusinessId) return;

    try {
      const token = getToken();
      if (!token) return;

      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/business/${selectedBusinessId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local business status
      setBusinessStatus(newStatus);

      if (onBusinessStatusChange) {
        onBusinessStatusChange(newStatus);
      }
    } catch (err) {
      console.error("Failed to update business status", err);
    }
  };

  // NEW: Helper function to check if current user has locked their ranking
  const checkIfCurrentUserLocked = (lockedUsers) => {
    if (!Array.isArray(lockedUsers) || lockedUsers.length === 0) {
      return false;
    }
    return lockedUsers.some(user => user.user_id.toString() === myUserId);
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const loadAdminRankings = useCallback(async () => {
    const rankings = await fetchAdminRankings();
    setAdminRanks(rankings);
  }, [fetchAdminRankings]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    
    // Call new consolidated access check API
    const accessData = await checkAllAccess();
    
    // Fetch rankings (this also returns projects list, business status, etc.)
    const result = await fetchTeamRankings();
    
    if (!result) {
      setIsLoading(false);
      return;
    }

    const fetched = result.rankings; // In getRankings, this is the projects array
    setProjects(fetched);

    // Set business status from API response
    if (result.businessStatus) {
      setBusinessStatus(result.businessStatus);
    }

    // Set lock summary with locked_users array
    const lockSummaryData = {
      locked_users_count: result.lockSummary?.locked_users_count ?? 0,
      total_users: result.lockSummary?.total_users ?? 0,
      locked_users: result.lockSummary?.locked_users ?? [],
    };
    setLockSummary(lockSummaryData);

    // Check if current user has locked their ranking
    const isCurrentUserLocked = checkIfCurrentUserLocked(lockSummaryData.locked_users);
    setRankingsLocked(isCurrentUserLocked);

    // Set archival status from API response
    if (result.businessAccessMode) {
      const apiArchived = result.businessAccessMode === 'archived' || result.businessAccessMode === 'hidden';
      setApiIsArchived(apiArchived);
    }

    // Use business status from API to set internal lock states
    const backendStatus = result.businessStatus || "draft";

    if (backendStatus === "draft") {
      setProjectCreationLocked(false);
      setRankingLockedFirst(false);
      setFinalizeCompleted(false);
      setLaunched(false);
    } else if (backendStatus === "prioritizing") {
      setProjectCreationLocked(true);
      setRankingLockedFirst(false);
      setFinalizeCompleted(false);
      setLaunched(false);
    } else if (backendStatus === "prioritized") {
      setProjectCreationLocked(true);
      setRankingLockedFirst(isCurrentUserLocked);
      setFinalizeCompleted(true);
      setLaunched(false);
    } else if (backendStatus === "launched") {
      setProjectCreationLocked(true);
      setRankingLockedFirst(isCurrentUserLocked);
      setFinalizeCompleted(true);
      setLaunched(true);
    }

    setIsLoading(false);
  }, [checkAllAccess, fetchTeamRankings, myUserId]);

  const refreshTeamRankings = useCallback(async () => {
    await loadProjects(); // Use the consolidated loader
  }, [loadProjects]);

  const handleLockProjectCreation = async () => {
    try {
      if (!projects || projects.length === 0) {
        handleShowToast("No projects available to rank. Please create projects first.", "error");
        return;
      }

      setIsGeneratingAIRankings(true);

      // Deduplicate projects by ID before sending to ML API
      const uniqueProjects = projects.filter((project, index, self) =>
        index === self.findIndex(p => p._id === project._id)
      );

      const mlResponse = await callMLRankingAPI(uniqueProjects);

      const saveResponse = await saveAIRankings(
        selectedBusinessId,
        mlResponse.rankings
      );
      setProjectCreationLocked(true);
      setShowAIRankingToast(true);
      setShowProjectLockToast(true);
      await updateBusinessStatus("prioritizing");
      await loadProjects();

      setTimeout(() => {
        setShowAIRankingToast(false);
        setShowProjectLockToast(false);
      }, 3000);

    } catch (error) {
      console.error("Failed to lock project creation and generate AI rankings:", error);
      handleShowToast("Failed to generate AI rankings. Please try again.", "error");
      setIsGeneratingAIRankings(false);
    } finally {
      setIsGeneratingAIRankings(false);
    }
  };

  const handleFinalizePrioritization = () => {
    setFinalizeCompleted(true);
    setShowFinalizeToast(true);
    updateBusinessStatus("prioritized");
    setTimeout(() => setShowFinalizeToast(false), 3000);
  };

  const handleLaunchProjects = async () => {
    if (selectedProjectIds.length === 0) {
      handleShowToast("Please select at least one project to launch.", "error");
      return;
    }

    // 1. Check for killed projects (cannot be launched)
    const killedProjects = selectedProjectIds.filter(id => {
      const project = projects.find(p => p._id === id);
      return project?.status?.toLowerCase() === 'killed';
    });

    if (killedProjects.length > 0) {
      handleShowToast("Killed projects cannot be launched. Please deselect killed projects and try again.", "error", 5000);
      return;
    }

    // 2. Check if ADMIN has ranked the selected projects (Frontend check for immediate feedback)
    const unrankedSelectedNames = selectedProjectIds
      .filter(id => {
        const rank = rankMap[String(id)];
        return rank === null || rank === undefined;
      })
      .map(id => projects.find(p => p._id === id)?.project_name)
      .filter(Boolean);

    if (unrankedSelectedNames.length > 0) {
      const bulletedList = unrankedSelectedNames.map(name => `• ${name}`).join("\n");
      const message = `The following projects chosen for launch are not ranked:\n${bulletedList}\n\nPlease rank them before launching.`;

      handleShowToast(message, "error", 10000);
      setIsRankingBlinking(true);
      setTimeout(() => setIsRankingBlinking(false), 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      const { success, data, error } = await launchProjects(selectedProjectIds);

      if (success) {
        setLaunched(true);
        setShowLaunchToast(true);
        updateBusinessStatus("launched");
        setSelectedProjectIds([]); // Clear selection
        await loadProjects();
        setTimeout(() => setShowLaunchToast(false), 3000);
      } else {
        // Special case: If it failed because of collaborators, we still want to refresh
        // because the backend HAS persisted the pending_launch selection.
        if (error.includes("collaborators")) {
          await loadProjects();
        }
        handleShowToast(error || "Failed to launch projects.", "error", 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup project context on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    };
  }, []);

  const handleNewProject = () => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    resetForm();
    setCurrentProject(null);
    setActiveView("new");
  };

  const handleEditProject = (project, mode = "edit") => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: project._id } }));
    setCurrentProject(project);
    loadProjectData(project);
    setActiveView(mode);
  };

  const handleFieldFocus = (fieldName) => {
    lockFieldSafe(fieldName);
  };

  const handleFieldEdit = () => {
    heartbeatSafe();
  };

  const handleBackToList = () => {
    window.dispatchEvent(new CustomEvent('ai_context_changed', { detail: { projectId: null } }));
    unlockAllFieldsSafe();
    setActiveView("list");
    setCurrentProject(null);
    resetForm();
  };

  const handleCreate = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      handleShowToast(validation.firstError, "error", 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = sessionStorage.getItem("userId");
      const payload = getPayload(userId, selectedBusinessId);

      const { success, error } = await createProject(payload);
      if (success) {
        handleShowToast("Project created successfully!", "success");
        await unlockAllFieldsSafe();
        await loadProjects();
        handleBackToList();
      } else {
        handleShowToast(error || "Failed to create project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!canEditProject(currentProject, isEditor, myUserId, businessStatus)) {
      handleShowToast("You are not allowed to edit this project", "error");
      return;
    }

    if (!currentProject?._id) {
      console.error("No project ID found!");
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      handleShowToast(validation.firstError, "error", 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = sessionStorage.getItem("userId");
      const payload = getPayload(userId, selectedBusinessId);

      const { success, error } = await updateProject(currentProject._id, payload);
      if (success) {
        handleShowToast("Project updated successfully!", "success");
        await unlockAllFieldsSafe();
        await loadProjects();
        handleBackToList();
      } else {
        handleShowToast(error || "Failed to update project.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (isViewer || !isSuperAdmin) return;

    const { success, error } = await deleteProject(projectId);
    if (success) {
      handleShowToast("Project killed successfully!", "success");
      await loadProjects(); // Reload to get updated status/sorting
    } else {
      handleShowToast(error || "Failed to kill project.", "error");
    }
  };

  const handleLockProjectRanking = async () => {
    // This used to lock, now it just refreshes as saving is enough
    await refreshTeamRankings();
  };

  const handleAccordionSelect = (eventKey) => {
    setActiveAccordionKey((prevKey) => {
      const nextKey = prevKey === eventKey ? null : eventKey;
      if (nextKey === "0" && prevKey !== "0") {
        refreshTeamRankings();
      }
      return nextKey;
    });
  };

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

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
          canEdit={currentProject && canEditProject(currentProject, isEditor, myUserId, businessStatus, apiIsArchived)}
        />
      );
    }

    // Use ProjectForm for new and edit modes
    return (
      <ProjectForm
        mode={activeView}
        readOnly={
          activeView === "view" ||
          (currentProject && !canEditProject(currentProject, isEditor, myUserId, businessStatus, apiIsArchived))
        }
        {...formState}
        {...formSetters}
        onBack={handleBackToList}
        onSubmit={activeView === "new" ? handleCreate : handleSave}
        isLockedByOther={isLockedByOther}
        getLockOwnerForField={getLockOwnerForField}
        onFieldFocus={handleFieldFocus}
        onFieldEdit={handleFieldEdit}
        isSubmitting={isSubmitting}
        selectedBusinessId={selectedBusinessId}
        projectId={currentProject?._id}
      />
    );
  };

  const renderProjectList = () => {
    const userPlan = sessionStorage.getItem("userPlan");
    const isReadOnly = apiIsArchived || userPlan === 'essential';

    return (
      <>
        <div className="view-mode-tabs-container mb-4" style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          width: '100%',
          paddingLeft: '4px'
        }}>
          <button
            onClick={() => {
              setViewMode("projects");
              setShowRankScreen(false);
              setShowTeamRankings(false);
            }}
            className={`view-mode-tab ${viewMode === "projects" ? "active" : ""}`}
            style={{
              padding: '12px 20px',
              border: 'none',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '0px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: viewMode === "projects" ? 'rgb(37, 99, 235)' : '#94a3b8',
              borderBottom: viewMode === "projects" ? '2px solid rgb(37, 99, 235)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              marginBottom: '-1px'
            }}
          >
            {isLoading ? (
              <>
                {t("Projects")} (..)
              </>
            ) : (
              <>
                {t("Projects")} ({portfolioData.totalProjects})
              </>
            )}
          </button>
          <button
            onClick={() => {
              setViewMode("ranking");
              setShowRankScreen(true);
            }}
            className={`view-mode-tab ${viewMode === "ranking" ? "active" : ""}`}
            style={{
              padding: '12px 20px',
              border: 'none',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '0px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: viewMode === "ranking" ? 'rgb(37, 99, 235)' : '#94a3b8',
              borderBottom: viewMode === "ranking" ? '2px solid rgb(37, 99, 235)' : '2px solid transparent',
              transition: 'all 0.2s ease',
              marginBottom: '-1px'
            }}
          >
            {t("Ranking")}
          </button>
        </div>

        {viewMode === "ranking" ? (
          <>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                {!isViewer && !isArchived && (
                  <div className="status-tabs-container" style={{ WebkitOverflowScrolling: 'touch', overflowX: 'auto' }}>
                    <button
                      onClick={() => {
                        setShowRankScreen(!showRankScreen);
                        if (!showRankScreen) setShowTeamRankings(false);
                      }}
                      className={`status-tab ${showRankScreen ? 'active' : ''} ${isRankingBlinking ? 'blink-highlight' : ''}`}
                    >
                      <ListOrdered size={16} />
                      {t("Rank_Projects")}
                    </button>

                    <button
                      onClick={onToggleTeamRankings}
                      className={`status-tab ${showTeamRankings ? 'active' : ''}`}
                    >
                      <Users size={16} />
                      {t("Rankings_View")}
                    </button>
                  </div>
                )}

              </div>

              {/* Repositioned Collaborator Progress - Admin Only */}
              {isSuperAdmin && (
                <div className="collaborator-progress-compact d-flex align-items-center gap-2 px-3 py-2 mt-md-0 mt-2" style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '100px', // Matches status-tabs
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

            {showRankScreen && !isLoading && !isRankingsLoading && (
              <RankProjectsPanel
                show={showRankScreen}
                projects={rankedProjects}
                businessId={selectedBusinessId}
                onLockRankings={handleLockProjectRanking}
                onRankSaved={() => {
                  refreshTeamRankings();
                }}
                isAdmin={isSuperAdmin}
                isRankingLocked={isRankingLocked}
                businessStatus={businessStatus}
                userHasRerankAccess={userHasRerankAccess}
                onShowToast={handleShowToast}
                isArchived={apiIsArchived}
              />
            )}

            {showTeamRankings && !isViewer && !isLoading && !isRankingsLoading && (
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
        ) : (
          <>
            <div className="management-row-container mb-4" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div className="status-tabs-container">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`status-tab ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="status-name">{cat.label}</span>
                    <span className="status-count">{categoryCounts[cat.id] || 0}</span>
                  </button>
                ))}
              </div>

              <div className="management-buttons d-flex gap-2">
                {selectedProjectIds.length > 0 && !isViewer && !isArchived && sessionStorage.getItem("userPlan") !== 'essential' && isSuperAdmin && (
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

                {!isViewer && !isArchived && sessionStorage.getItem("userPlan") !== 'essential' && (
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
                canEditProject(project, isEditor, myUserId, businessStatus, apiIsArchived)
              }
              onEdit={(project) => handleEditProject(project, "edit")}
              onView={(project) => handleEditProject(project, "view")}
              onDelete={handleDelete}
              selectedCategory={selectedCategory}
              isArchived={apiIsArchived}
              selectedProjectIds={selectedProjectIds}
              onToggleSelection={toggleProjectSelection}
            />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <ToastNotifications
        showLockToast={showLockToast}
        setShowLockToast={setShowLockToast}
        showProjectLockToast={showProjectLockToast}
        setShowProjectLockToast={setShowProjectLockToast}
        showFinalizeToast={showFinalizeToast}
        setShowFinalizeToast={setShowFinalizeToast}
        showLaunchToast={showLaunchToast}
        setShowLaunchToast={setShowLaunchToast}
        showValidationToast={showValidationToast}
        setShowValidationToast={setShowValidationToast}
        validationMessage={validationMessage}
        validationMessageType={validationMessageType}
        showAIRankingToast={showAIRankingToast}
        setShowAIRankingToast={setShowAIRankingToast}
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
    </>
  );
};

export default ProjectsSection;