import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container } from "react-bootstrap";
import axios from "axios";
import { lockField, heartbeat, unlockFields } from "@/hooks/fieldlockapi";
import { useFieldLockPolling } from "@/hooks/useFieldLockPolling";
import { useProjectOperations } from "../hooks/useProjectOperations";
import { useRankingOperations } from "../hooks/useRankingOperations";
import { useAccessControl } from "../hooks/useAccessControl";
import { useProjectForm } from "../hooks/useProjectForm";
import { simulateMLRankingAPI } from "../utils/aiRankingGenerator";
import { saveAIRankings } from "../services/aiRankingService";

import CollaborationCard from "../components/CollaborationCard";
import PortfolioOverview from "../components/PortfolioOverview";
import ProjectsHeader from "../components/ProjectsHeader";
import RankProjectsPanel from "../components/RankProjectsPanel";
import TeamRankingsView from "../components/TeamRankingsView";
import ProjectsList from "../components/ProjectsList";
import ProjectForm from "../components/ProjectForm";
import ToastNotifications from "../components/ToastNotifications";
import "../styles/ProjectsSection.css";

const ProjectsSection = ({
  selectedBusinessId,
  onProjectCountChange,
  onBusinessStatusChange,
  companyAdminIds,
}) => {
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState("");
  const myUserId = sessionStorage.getItem("userId");
  const user = sessionStorage.getItem("userName");

  const [activeView, setActiveView] = useState("list");
  const [currentProject, setCurrentProject] = useState(null);
  const [showRankScreen, setShowRankScreen] = useState(false);
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);

  const [projects, setProjects] = useState([]);
  const [teamRankings, setTeamRankings] = useState([]);
  const [adminRanks, setAdminRanks] = useState([]);

  const [rankingsLocked, setRankingsLocked] = useState(false);
  const [projectCreationLocked, setProjectCreationLocked] = useState(false);
  const [rankingLockedFirst, setRankingLockedFirst] = useState(false);
  const [finalizeCompleted, setFinalizeCompleted] = useState(false);
  const [launched, setLaunched] = useState(false);

  const [lockSummary, setLockSummary] = useState({
    locked_users_count: 0,
    total_users: 0,
  });

  const [showLockToast, setShowLockToast] = useState(false);
  const [showProjectLockToast, setShowProjectLockToast] = useState(false);
  const [showFinalizeToast, setShowFinalizeToast] = useState(false);
  const [showLaunchToast, setShowLaunchToast] = useState(false);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showAIRankingToast, setShowAIRankingToast] = useState(false);
  const [isGeneratingAIRankings, setIsGeneratingAIRankings] = useState(false);

  const { locks } = useFieldLockPolling(currentProject?._id);
  const { fetchProjects, deleteProject, createProject, updateProject } =
    useProjectOperations(selectedBusinessId, onProjectCountChange);
  const { fetchTeamRankings, fetchAdminRankings, lockRanking } =
    useRankingOperations(selectedBusinessId, companyAdminIds);
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
  const isEditor = userRole === "super_admin" || userRole === "company_admin";
  const isSuperAdmin = isEditor;

  const allCollaboratorsLocked =
    lockSummary.total_users > 0 &&
    lockSummary.locked_users_count === lockSummary.total_users;

  const isRankingLocked = allCollaboratorsLocked;

  const isFinalized =
    rankingsLocked && projectCreationLocked && rankingLockedFirst;
  const status = launched
    ? "launched"
    : finalizeCompleted
      ? "prioritized"
      : projectCreationLocked
        ? "prioritizing"
        : "draft";

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

  const sortedProjects = [...projects].sort((a, b) => {
    const rankA = rankMap[String(a._id)] ?? Infinity;
    const rankB = rankMap[String(b._id)] ?? Infinity;
    return rankA - rankB;
  });

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

      if (onBusinessStatusChange) {
        onBusinessStatusChange(newStatus);
      }
    } catch (err) {
      console.error("Failed to update business status", err);
    }
  };

  const loadProjects = useCallback(async () => {
    const result = await fetchProjects();
    if (!result) return;

    const fetched = result.projects;
    setProjects(fetched);
    setLockSummary((prev) => ({
      locked_users_count:
        result.lockSummary?.locked_users_count ?? prev.locked_users_count,
      total_users: result.lockSummary?.total_users ?? prev.total_users,
    }));
    const statuses = fetched.map((p) => p.status).filter(Boolean);

    let backendStatus = "draft";
    if (statuses.includes("launched")) {
      backendStatus = "launched";
    } else if (statuses.includes("prioritized")) {
      backendStatus = "prioritized";
    } else if (statuses.includes("prioritizing")) {
      backendStatus = "prioritizing";
    }
    if (backendStatus === "draft") {
      setProjectCreationLocked(false);
      setRankingsLocked(false);
      setRankingLockedFirst(false);
      setFinalizeCompleted(false);
      setLaunched(false);
    } else if (backendStatus === "prioritizing") {
      setProjectCreationLocked(true);
      setRankingsLocked(false);
      setRankingLockedFirst(false);
      setFinalizeCompleted(false);
      setLaunched(false);
    } else if (backendStatus === "prioritized") {
      setProjectCreationLocked(true);
      setRankingsLocked(true);
      setRankingLockedFirst(true);
      setFinalizeCompleted(true);
      setLaunched(false);
    } else if (backendStatus === "launched") {
      setProjectCreationLocked(true);
      setRankingsLocked(true);
      setRankingLockedFirst(true);
      setFinalizeCompleted(true);
      setLaunched(true);
    }
    await checkBusinessAccess();

    if (backendStatus === "launched") {
      const launchedProjectIds = fetched
        .filter((p) => p.status === "launched")
        .map((p) => p._id);

      if (launchedProjectIds.length > 0) {
        await checkProjectsAccess(launchedProjectIds);
      }
    }
  }, [fetchProjects, checkBusinessAccess, checkProjectsAccess]);

  const loadTeamRankings = useCallback(async () => {
    const result = await fetchTeamRankings();
    if (!result) return;

    setTeamRankings(result.rankings);
    setLockSummary((prev) => ({
      locked_users_count:
        result.lockSummary?.locked_users_count ?? prev.locked_users_count,
      total_users: result.lockSummary?.total_users ?? prev.total_users,
    }));
  }, [fetchTeamRankings]);

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
        alert("No projects available to rank. Please create projects first.");
        return;
      }

      setIsGeneratingAIRankings(true);
      const mlResponse = await simulateMLRankingAPI(selectedBusinessId, projects);
      const saveResponse = await saveAIRankings(
        selectedBusinessId,
        mlResponse.rankings,
        mlResponse.model_version,
        mlResponse.metadata
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
      alert("Failed to generate AI rankings. Please try again.");
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

  const handleLaunchProjects = () => {
    setLaunched(true);
    setShowLaunchToast(true);
    updateBusinessStatus("launched");
    setTimeout(() => setShowLaunchToast(false), 3000);
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

  const handleBackToList = () => {
    unlockAllFieldsSafe();
    setActiveView("list");
    setCurrentProject(null);
    resetForm();
  };

  const handleCreate = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      setValidationMessage(validation.firstError);
      setShowValidationToast(true);
      return;
    }

    const userId = sessionStorage.getItem("userId");
    const payload = getPayload(userId, selectedBusinessId);

    const success = await createProject(payload);
    if (success) {
      alert("Project created successfully!");
      await unlockAllFieldsSafe();
      await loadProjects();
      handleBackToList();
    } else {
      alert("Failed to create project.");
    }
  };

  const handleSave = async () => {
    if (!canEditProject(currentProject, isEditor, myUserId)) {
      alert("You are not allowed to edit this project");
      return;
    }

    if (!currentProject?._id) {
      console.error("No project ID found!");
      return;
    }

    const userId = sessionStorage.getItem("userId");
    const payload = getPayload(userId, selectedBusinessId);

    const success = await updateProject(currentProject._id, payload);
    if (success) {
      alert("Project updated successfully!");
      await unlockAllFieldsSafe();
      await loadProjects();
      handleBackToList();
    } else {
      alert("Failed to update project.");
    }
  };

  const handleDelete = async (projectId) => {
    if (isViewer) return;

    const success = await deleteProject(projectId);
    if (success) {
      alert("Project deleted successfully!");
      const updated = projects.filter((p) => p._id !== projectId);
      setProjects(updated);
      if (onProjectCountChange) {
        onProjectCountChange(updated.length);
      }
    } else {
      alert("Failed to delete project.");
    }
  };

  const lockMyRanking = async (projectId) => {
    const success = await lockRanking(projectId);
    if (success) {
      setRankingsLocked(true);
      setRankingLockedFirst(true);
      setShowLockToast(true);
      refreshTeamRankings();
      setTimeout(() => setShowLockToast(false), 3000);
    } else {
      alert("Failed to lock ranking");
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
    return (
      <ProjectForm
        mode={activeView}
        readOnly={
          activeView === "view" ||
          (currentProject && !canEditProject(currentProject, isEditor, myUserId))
        }
        {...formState}
        {...formSetters}
        onBack={handleBackToList}
        onSubmit={activeView === "new" ? handleCreate : handleSave}
        isLockedByOther={isLockedByOther}
        getLockOwnerForField={getLockOwnerForField}
        onFieldFocus={lockFieldSafe}
        onFieldEdit={heartbeatSafe}
      />
    );
  };

  const renderProjectList = () => {
    return (
      <>
        {isEditor && !isViewer && (
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
            />
          </div>
        )}

        <PortfolioOverview portfolioData={portfolioData} />

        <ProjectsHeader
          totalProjects={portfolioData.totalProjects}
          isDraft={isDraft}
          isPrioritizing={isPrioritizing}
          launched={launched}
          isViewer={isViewer}
          rankingsLocked={rankingsLocked}
          showRankScreen={showRankScreen}
          userHasRerankAccess={userHasRerankAccess}
          onNewProject={handleNewProject}
          onToggleRankScreen={() => setShowRankScreen(!showRankScreen)}
        />

        <RankProjectsPanel
          show={showRankScreen}
          projects={rankedProjects}
          businessId={selectedBusinessId}
          onLockRankings={() => lockMyRanking(rankedProjects[0]?._id)}
          onRankSaved={refreshTeamRankings}
          isAdmin={isEditor}
          isRankingLocked={isRankingLocked}
        />

        {((isPrioritizing || (launched && userHasRerankAccess)) && !isViewer) && (
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
            canEditProject(project, isEditor, myUserId)
          }
          onEdit={(project) => handleEditProject(project, "edit")}
          onView={(project) => handleEditProject(project, "view")}
          onDelete={handleDelete}
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