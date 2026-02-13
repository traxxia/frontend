import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container } from "react-bootstrap";
import axios from "axios";
import { lockField, heartbeat, unlockFields } from "@/hooks/fieldlockapi";
import { useFieldLockPolling } from "@/hooks/useFieldLockPolling";
import { useProjectOperations } from "../hooks/useProjectOperations";
import { useRankingOperations } from "../hooks/useRankingOperations";
import { useAccessControl } from "../hooks/useAccessControl";
import { useProjectForm } from "../hooks/useProjectForm";
import { callMLRankingAPI, saveAIRankings } from "../services/aiRankingService";

import { MdArrowDownward } from "react-icons/md";
import CollaborationCard from "../components/CollaborationCard";
import PortfolioOverview from "../components/PortfolioOverview";
import ProjectsHeader from "../components/ProjectsHeader";
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
  const [currentProject, setCurrentProject] = useState(null);
  const [showRankScreen, setShowRankScreen] = useState(false);
  const [showTeamRankings, setShowTeamRankings] = useState(false); // New state for Team Rankings Panel
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);

  const [projects, setProjects] = useState([]);
  const [teamRankings, setTeamRankings] = useState([]);
  const [adminRanks, setAdminRanks] = useState([]);

  // NEW: Business-level status
  const [businessStatus, setBusinessStatus] = useState("draft");
  const [apiIsArchived, setApiIsArchived] = useState(isArchived);
  const [selectedCategory, setSelectedCategory] = useState("All");

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
    lockSummary.total_users > 0 &&
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
  const rankMap = teamRankings.reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
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

      // Treat null/undefined as Infinity to push to bottom
      const rA = (rankA === null || rankA === undefined) ? Infinity : rankA;
      const rB = (rankB === null || rankB === undefined) ? Infinity : rankB;

      if (rA === rB) {
        // Secondary sort by modification date if ranks are equal (or both unranked)
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
      Killed: 0
    };

    projects.forEach(p => {
      const status = p.status || "Draft";
      if (counts[status] !== undefined) {
        counts[status]++;
      } else if (status === "Draft") {
        counts.Draft++;
      }
    });

    return counts;
  }, [projects]);

  const rankedProjects = projects.map((p) => ({
    ...p,
    rank: rankMap[String(p._id)],
  }));

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

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchProjects();
    if (!result) {
      setIsLoading(false);
      return;
    }

    const fetched = result.projects;
    setProjects(fetched);

    // UPDATED: Set business status from API response
    if (result.businessStatus) {
      setBusinessStatus(result.businessStatus);
    }

    // UPDATED: Set lock summary with locked_users array
    const lockSummaryData = {
      locked_users_count: result.lockSummary?.locked_users_count ?? 0,
      total_users: result.lockSummary?.total_users ?? 0,
      locked_users: result.lockSummary?.locked_users ?? [],
    };
    setLockSummary(lockSummaryData);

    // UPDATED: Check if current user has locked their ranking
    const isCurrentUserLocked = checkIfCurrentUserLocked(lockSummaryData.locked_users);
    setRankingsLocked(isCurrentUserLocked);

    // UPDATED: Set archival status from API response
    if (result.businessAccessMode) {
      const apiArchived = result.businessAccessMode === 'archived' || result.businessAccessMode === 'hidden';
      setApiIsArchived(apiArchived);
    }

    // UPDATED: Use business status from API instead of deriving from projects
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

    await checkBusinessAccess();

    if (backendStatus === "launched") {
      const launchedProjectIds = fetched.map((p) => p._id);

      if (launchedProjectIds.length > 0) {
        await checkProjectsAccess(launchedProjectIds);
      }
    }
    setIsLoading(false);
  }, [fetchProjects, checkBusinessAccess, checkProjectsAccess, myUserId]);

  const loadTeamRankings = useCallback(async () => {
    const result = await fetchTeamRankings();
    if (!result) return;

    setTeamRankings(result.rankings);

    // UPDATED: Set business status from ranking response
    if (result.businessStatus) {
      setBusinessStatus(result.businessStatus);
    }
    if (result.businessAccessMode) {
      const apiArchived = result.businessAccessMode === 'archived' || result.businessAccessMode === 'hidden';
      setApiIsArchived(apiArchived);
    }

    // UPDATED: Set lock summary with locked_users array
    const lockSummaryData = {
      locked_users_count: result.lockSummary?.locked_users_count ?? 0,
      total_users: result.lockSummary?.total_users ?? 0,
      locked_users: result.lockSummary?.locked_users ?? [],
    };
    setLockSummary(lockSummaryData);

    // UPDATED: Check if current user has locked their ranking
    const isCurrentUserLocked = checkIfCurrentUserLocked(lockSummaryData.locked_users);
    setRankingsLocked(isCurrentUserLocked);
  }, [fetchTeamRankings, myUserId]);

  const loadAdminRankings = useCallback(async () => {
    const rankings = await fetchAdminRankings();
    setAdminRanks(rankings);
  }, [fetchAdminRankings]);

  const refreshTeamRankings = useCallback(async () => {
    await loadTeamRankings();
    await loadAdminRankings();
  }, [loadTeamRankings, loadAdminRankings]);

  const handleLockProjectCreation = async () => {
    try {
      if (!projects || projects.length === 0) {
        handleShowToast("No projects available to rank. Please create projects first.", "error");
        return;
      }

      setIsGeneratingAIRankings(true);

      const mlResponse = await callMLRankingAPI(projects);

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
    try {
      setIsSubmitting(true);
      const projectIds = projects.map(p => p._id);

      const { success, error } = await launchProjects(projectIds);

      if (success) {
        setLaunched(true);
        setShowLaunchToast(true);
        updateBusinessStatus("launched");
        await loadProjects();
        setTimeout(() => setShowLaunchToast(false), 3000);
      } else {
        handleShowToast(error || "Failed to launch projects.", "error", 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewProject = () => {
    resetForm();
    setCurrentProject(null);
    setActiveView("new");
  };

  const handleEditProject = (project, mode = "edit") => {
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
    if (isViewer) return;

    const { success, error } = await deleteProject(projectId);
    if (success) {
      handleShowToast("Project killed successfully!", "success");
      await loadProjects(); // Reload to get updated status/sorting
    } else {
      handleShowToast(error || "Failed to kill project.", "error");
    }
  };

  const lockMyRanking = async (projectId) => {
    const { success, error } = await lockRanking(projectId);
    if (success) {
      setRankingsLocked(true);
      setRankingLockedFirst(true);
      setShowLockToast(true);
      refreshTeamRankings();
      setTimeout(() => setShowLockToast(false), 3000);
    } else {
      handleShowToast(error || "Failed to lock ranking", "error");
    }
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

  useEffect(() => {
    if (!selectedBusinessId) return;
    loadTeamRankings();
    loadAdminRankings();
  }, [selectedBusinessId, isPrioritizing, isPrioritized, loadTeamRankings, loadAdminRankings]);

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
    return (
      <>
        {isSuperAdmin && !isViewer && (
          <div className="collaboration-card-wrapper">
            <CollaborationCard
              projectCreationLocked={projectCreationLocked}
              finalizeCompleted={finalizeCompleted}
              launched={launched}
              lockSummary={lockSummary}
              allCollaboratorsLocked={allCollaboratorsLocked}
              onLockProjectCreation={handleLockProjectCreation}
              onFinalizePrioritization={handleFinalizePrioritization}
              onLaunchProjects={handleLaunchProjects}
              isGeneratingAIRankings={isGeneratingAIRankings}
            />
          </div>
        )}

        {/* <PortfolioOverview portfolioData={portfolioData} /> */}

        <ProjectsHeader
          totalProjects={portfolioData.totalProjects}
          isLoading={isLoading}
          isDraft={isDraft}
          isPrioritizing={isPrioritizing}
          launched={launched}
          isViewer={isViewer}
          isArchived={apiIsArchived}
          rankingsLocked={rankingsLocked}
          showRankScreen={showRankScreen}
          userHasRerankAccess={userHasRerankAccess}
          onNewProject={handleNewProject}
          onToggleRankScreen={() => {
            const newState = !showRankScreen;
            setShowRankScreen(newState);
            if (newState) setShowTeamRankings(false);
          }}
          showTeamRankings={showTeamRankings}
          onToggleTeamRankings={onToggleTeamRankings}
        />

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

        <RankProjectsPanel
          show={showRankScreen}
          projects={rankedProjects}
          businessId={selectedBusinessId}
          onLockRankings={() => lockMyRanking(rankedProjects[0]?._id)}
          onRankSaved={refreshTeamRankings}
          isAdmin={isSuperAdmin}
          isRankingLocked={isRankingLocked}
          onShowToast={handleShowToast}
          isArchived={apiIsArchived}
        />

        {showTeamRankings && ((isPrioritizing || (launched && userHasRerankAccess)) && !isViewer) && (
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

        <ProjectsList
          sortedProjects={sortedProjects}
          rankMap={rankMap}
          finalizeCompleted={finalizeCompleted}
          launched={launched}
          isViewer={isViewer}
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
        />
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

      <Container fluid className="projects-wrapper">
        {activeView === "list" ? renderProjectList() : renderProjectForm()}
      </Container>
    </>
  );
};

export default ProjectsSection;