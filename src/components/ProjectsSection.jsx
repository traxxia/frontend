import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container, Row, Col, Card, Button, Toast, Accordion, Table, Badge } from "react-bootstrap";
import { Lock, AlertTriangle, AlertCircle, CheckCircle, Plus, ListOrdered, Pencil, Trash2, Users } from "lucide-react";
import axios from "axios";
import { lockField, heartbeat, unlockFields } from "@/hooks/fieldlockapi";
import RankProjectsPanel from "../components/RankProjectsPanel";
import ProjectForm from "../components/ProjectForm";
import { useFieldLockPolling } from "@/hooks/useFieldLockPolling";
import "../styles/ProjectsSection.css";
import ConsensusButtonPopover from "../components/ConsensusButtonPopover";

const ProjectsSection = ({ selectedBusinessId, onProjectCountChange, onBusinessStatusChange, companyAdminIds }) => {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState("");
  const [showRankScreen, setShowRankScreen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [rankingsLocked, setRankingsLocked] = useState(false);
  const [showLockToast, setShowLockToast] = useState(false);
  const [projectCreationLocked, setProjectCreationLocked] = useState(false);
  const [showProjectLockToast, setShowProjectLockToast] = useState(false);
  const [rankingLockedFirst, setRankingLockedFirst] = useState(false);
  const [finalizeCompleted, setFinalizeCompleted] = useState(false);
  const [showFinalizeToast, setShowFinalizeToast] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [showLaunchToast, setShowLaunchToast] = useState(false);

  const [lockSummary, setLockSummary] = useState({
    locked_users_count: 0,
    total_users: 0
  });

  // NEW: Access control states
  const [userHasRerankAccess, setUserHasRerankAccess] = useState(false);
  const [userHasProjectEditAccess, setUserHasProjectEditAccess] = useState({});

  const isViewer = userRole === "viewer";
  const isEditor = userRole === "super_admin" || userRole === "company_admin";
  const myUserId = sessionStorage.getItem("userId");

  const allCollaboratorsLocked =
    lockSummary.total_users > 0 &&
    lockSummary.locked_users_count === lockSummary.total_users;

  const isRankingLocked =
    lockSummary.total_users > 0 &&
    lockSummary.locked_users_count === lockSummary.total_users;

  // Content management states
  const [activeView, setActiveView] = useState("list"); // 'list', 'new', 'edit', 'view'
  const [currentProject, setCurrentProject] = useState(null);
  const { locks } = useFieldLockPolling(currentProject?._id);

  const isLockedByOther = (field) =>
    locks.some(
      (l) => l.field_name === field && l.locked_by !== myUserId
    );

  const getLockOwnerForField = (field) => {
    const lock = locks.find(
      (l) => l.field_name === field && l.locked_by !== myUserId
    );
    return lock?.locked_by_name || null;
  };

  const getToken = () => sessionStorage.getItem("token");

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

  // Form states for new/edit project
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedImpact, setSelectedImpact] = useState("");
  const [selectedEffort, setSelectedEffort] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [dependencies, setDependencies] = useState("");
  const [highLevelReq, setHighLevelReq] = useState("");
  const [scope, setScope] = useState("");
  const [outcome, setOutcome] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [teamRankings, setTeamRankings] = useState([]);
  const [errors, setErrors] = useState({});
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const user = sessionStorage.getItem("userName");
  const [adminRanks, setAdminRanks] = useState([]);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin";

  const updateBusinessStatus = async (newStatus) => {
    if (!selectedBusinessId) return;

    try {
      const token = sessionStorage.getItem("token");
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

  const isFinalized = rankingsLocked && projectCreationLocked && rankingLockedFirst;
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

  // NEW: Check user access permissions
  // In ProjectsSection.jsx - Update checkUserAccess function

  const checkUserAccess = async (projectId = null) => {
    try {
      const token = sessionStorage.getItem("token");
      const params = {
        business_id: selectedBusinessId,
      };

      if (projectId) {
        // Ensure projectId is a string
        params.project_id = String(projectId);
      }

      console.log("Checking access with params:", params); // Debug log

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/check-access`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      setUserHasRerankAccess(res.data.has_rerank_access);

      if (projectId) {
        setUserHasProjectEditAccess(prev => ({
          ...prev,
          [String(projectId)]: res.data.has_project_edit_access
        }));
      }

      return res.data;
    } catch (err) {
      console.error("Failed to check access:", err);
      // Don't throw error, just return default values
      return {
        has_rerank_access: false,
        has_project_edit_access: false
      };
    }
  };

  useEffect(() => {
    if (!selectedBusinessId) return;
    fetchProjects();
  }, [selectedBusinessId]);


  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            business_id: selectedBusinessId
          }
        }
      );

      const fetched = res.data?.projects || [];
      setProjects(fetched);
      if (onProjectCountChange) {
        onProjectCountChange(fetched.length);
      }
      setLockSummary(prev => ({
        locked_users_count: res.data?.ranking_lock_summary?.locked_users_count ?? prev.locked_users_count,
        total_users: res.data?.ranking_lock_summary?.total_users ?? prev.total_users
      }));

      // Derive portfolio status from project statuses
      const statuses = fetched
        .map((p) => p.status)
        .filter(Boolean);

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

      // Check business-level access first (no project_id)
      const businessAccess = await checkUserAccess();

      // Only check project-level access for launched projects
      if (backendStatus === "launched") {
        const projectAccessPromises = fetched
          .filter(p => p.status === "launched")
          .map(project => checkUserAccess(project._id));

        await Promise.all(projectAccessPromises);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    if (!selectedBusinessId) return;
    fetchTeamRankings();
    fetchAdminRankings();
  }, [selectedBusinessId, isPrioritizing, isPrioritized]);

  const fetchTeamRankings = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userId = sessionStorage.getItem("userId");

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/rank/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            business_id: selectedBusinessId
          }
        }
      );
      setTeamRankings(res.data.projects || []);
      setLockSummary(prev => ({
        locked_users_count: res.data?.ranking_lock_summary?.locked_users_count ?? prev.locked_users_count,
        total_users: res.data?.ranking_lock_summary?.total_users ?? prev.total_users
      }));
    } catch (err) {
      console.error("Failed to fetch team rankings", err);
    }
  };

  const fetchAdminRankings = async () => {
    const token = sessionStorage.getItem("token");

    const res = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/projects/admin-rank`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { business_id: selectedBusinessId, admin_user_id: companyAdminIds[0] }
      }
    );
    console.log("Frontend → Admin User IDs:", companyAdminIds);
    console.log("Frontend → Admin User ID (single):", companyAdminIds?.[0]);
    console.log("Frontend → Business ID:", selectedBusinessId);

    setAdminRanks(res.data.projects || []);
  };

  const normalizeId = (id) => String(id);
  const rankMap = teamRankings.reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {});

  const sortedProjects = [...projects].sort((a, b) => {
    const rankA = rankMap[String(a._id)] ?? Infinity;
    const rankB = rankMap[String(b._id)] ?? Infinity;
    return rankA - rankB;
  });

  const adminRankMap = adminRanks.reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {});

  const getConsensusVariant = (u, a) => {
    if (!u || !a) return "secondary";
    const diff = Math.abs(u - a);
    if (diff === 0) return "success";
    if (diff <= 2) return "warning";
    return "danger";
  };

  const lockMyRanking = async (projectId) => {
    try {
      const token = sessionStorage.getItem("token");

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/lock-rank`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            project_id: projectId
          }
        }
      );

      setRankingsLocked(true);
      setRankingLockedFirst(true);
      setShowLockToast(true);

      refreshTeamRankings();

      setTimeout(() => setShowLockToast(false), 3000);
    } catch (err) {
      console.error("Failed to lock ranking", err);
      alert("Failed to lock ranking");
    }
  };

  const handleDelete = async (projectId) => {
    if (isViewer) return;
    try {
      const token = sessionStorage.getItem("token");

      const res = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("DELETE SUCCESS:", res.data);
      alert("Project deleted successfully!");

      const updated = projects.filter(p => p._id !== projectId);
      setProjects(updated);
      if (onProjectCountChange) {
        onProjectCountChange(updated.length);
      }
    } catch (err) {
      console.error("DELETE FAILED:", err);
      alert("Failed to delete project.");
    }
  };

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

  const handleNewProject = () => {
    resetForm();
    setCurrentProject(null);
    setActiveView("new");
  };

  // Handle opening edit project form
  const handleEditProject = (project, mode = "edit") => {
    setCurrentProject(project);
    setProjectName(project.project_name || "");
    setDescription(project.description || "");
    setImportance(project.why_this_matters || "");
    setSelectedImpact(project.impact || "");
    setSelectedEffort(project.effort || "");
    setSelectedRisk(project.risk || "");
    setSelectedTheme(project.strategic_theme || "");
    setDependencies(project.dependencies || "");
    setHighLevelReq(project.high_level_requirements || "");
    setScope(project.scope_definition || "");
    setOutcome(project.expected_outcome || "");
    setSuccessMetrics(project.success_metrics || "");
    setTimeline(project.estimated_timeline || "");
    setBudget(project.budget_estimate || "");
    setActiveView(mode);
  };

  // Handle back to list
  const handleBackToList = () => {
    unlockAllFieldsSafe();
    setActiveView("list");
    setCurrentProject(null);
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setProjectName("");
    setDescription("");
    setImportance("");
    setSelectedImpact("");
    setSelectedEffort("");
    setSelectedRisk("");
    setSelectedTheme("");
    setDependencies("");
    setHighLevelReq("");
    setScope("");
    setOutcome("");
    setSuccessMetrics("");
    setTimeline("");
    setBudget("");
    setOpenDropdown(null);
  };

  const validateProjectForm = () => {
    const newErrors = {};

    const isEmpty = (val) => !val || val.trim().length === 0;
    const hasLetter = (val) => /[a-zA-Z]/.test(val);

    if (isEmpty(projectName)) {
      newErrors.projectName = "Project name is required";
    } else if (!hasLetter(projectName)) {
      newErrors.projectName = "Project name must contain letters";
    }

    if (isEmpty(description)) {
      newErrors.description = "Description is required";
    } else if (!hasLetter(description)) {
      newErrors.description = "Description must contain letters";
    }

    if (isEmpty(importance)) {
      newErrors.importance = "Why this matters is required";
    } else if (!hasLetter(importance)) {
      newErrors.importance = "Must contain meaningful text";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setValidationMessage(firstError);
      setShowValidationToast(true);
      return false;
    }

    return true;
  };

  // Handle create project
  const handleCreate = async () => {
    if (!validateProjectForm()) return;

    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    const payload = {
      business_id: selectedBusinessId,
      user_id: userId,
      collaborators: [],
      project_name: projectName.trim(),
      description: description.trim(),
      why_this_matters: importance.trim(),
      impact: selectedImpact || null,
      effort: selectedEffort || null,
      risk: selectedRisk || null,
      strategic_theme: selectedTheme || null,
      dependencies,
      high_level_requirements: highLevelReq,
      scope_definition: scope,
      expected_outcome: outcome,
      success_metrics: successMetrics,
      estimated_timeline: timeline,
      budget_estimate: budget,
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Project created successfully!");
      await unlockAllFieldsSafe();
      await fetchProjects();
      handleBackToList();
    } catch (err) {
      console.error("Project creation failed:", err);
      alert("Failed to create project.");
    }
  };

  // NEW: Updated canEditProject function
  const canEditProject = (project) => {
    if (!project) return false;

    // Admins can always edit (except truly locked launched projects)
    if (isEditor && project.status !== "launched") return true;

    // For reprioritizing projects
    if (project.status === "reprioritizing") {
      if (isEditor) return true;

      if (
        Array.isArray(project.allowed_collaborators) &&
        project.allowed_collaborators.includes(myUserId)
      ) {
        return true;
      }
    }

    // NEW: For launched projects, check if user has been granted access
    if (project.status === "launched") {
      return userHasProjectEditAccess[project._id] === true;
    }

    return false;
  };

  // Handle save project
  const handleSave = async () => {
    if (!canEditProject(currentProject)) {
      alert("You are not allowed to edit this project");
      return;
    }

    if (!currentProject?._id) {
      console.error("No project ID found!");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("Token missing!");
      return;
    }

    const payload = {
      project_name: projectName,
      description: description,
      why_this_matters: importance,
      impact: selectedImpact,
      effort: selectedEffort,
      risk: selectedRisk,
      strategic_theme: selectedTheme,
      dependencies: dependencies,
      high_level_requirements: highLevelReq,
      scope_definition: scope,
      expected_outcome: outcome,
      success_metrics: successMetrics,
      estimated_timeline: timeline,
      budget_estimate: budget,
    };

    try {
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/${currentProject._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Project updated successfully!");
      await unlockAllFieldsSafe();
      await fetchProjects();
      handleBackToList();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  const refreshTeamRankings = async () => {
    await fetchTeamRankings();
    await fetchAdminRankings();
  };

  const rankedProjects = projects.map((p) => ({
    ...p,
    rank: rankMap[String(p._id)]
  }));

  const handleAccordionSelect = (eventKey) => {
    setActiveAccordionKey((prevKey) => {
      const nextKey = prevKey === eventKey ? null : eventKey;
      if (nextKey === "0" && prevKey !== "0") {
        refreshTeamRankings();
      }
      return nextKey;
    });
  };

  // Render project form (for new/edit/view)
  const renderProjectForm = () => {
    return (
      <ProjectForm
        mode={activeView}
        readOnly={
          activeView === "view" ||
          (currentProject && !canEditProject(currentProject))
        }
        projectName={projectName}
        setProjectName={setProjectName}
        description={description}
        setDescription={setDescription}
        importance={importance}
        setImportance={setImportance}
        selectedImpact={selectedImpact}
        setSelectedImpact={setSelectedImpact}
        selectedEffort={selectedEffort}
        setSelectedEffort={setSelectedEffort}
        selectedRisk={selectedRisk}
        setSelectedRisk={setSelectedRisk}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        dependencies={dependencies}
        setDependencies={setDependencies}
        highLevelReq={highLevelReq}
        setHighLevelReq={setHighLevelReq}
        scope={scope}
        setScope={setScope}
        outcome={outcome}
        setOutcome={setOutcome}
        successMetrics={successMetrics}
        setSuccessMetrics={setSuccessMetrics}
        timeline={timeline}
        setTimeline={setTimeline}
        budget={budget}
        setBudget={setBudget}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        onBack={handleBackToList}
        onSubmit={activeView === "new" ? handleCreate : handleSave}
        isLockedByOther={isLockedByOther}
        getLockOwnerForField={getLockOwnerForField}
        onFieldFocus={lockFieldSafe}
        onFieldEdit={heartbeatSafe}
        errors={errors}
      />
    );
  };

  // Render project list view
  const renderProjectList = () => {
    return (
      <>
        {/* OPEN FOR COLLABORATION CARD */}
        {isEditor && !isViewer && (
          <div className="collaboration-card-wrapper">
            {!projectCreationLocked ? (
              <Card className="open-collab-card shadow-sm">
                <Row className="align-items-center">
                  <Col md="8">
                    <h5 className="open-collab-title fw-bold">
                      {t("Open_for_Collaboration")}
                    </h5>
                    <p className="open-collab-text">
                      {t("All_collaborators_can_add_projects_update_info_and_rank")}
                    </p>
                  </Col>

                  <Col md="4" className="d-flex justify-content-end align-items-center">
                    <Button
                      className="open-collab-btn"
                      onClick={() => {
                        setProjectCreationLocked(true);
                        setShowProjectLockToast(true);
                        updateBusinessStatus("prioritizing");
                        setTimeout(() => {
                          setShowProjectLockToast(false);
                        }, 3000);
                      }}
                    >
                      <Lock size={16} color="#589be9ff" strokeWidth={2} />
                      {t("Lock_Project_Creation")}
                    </Button>
                  </Col>
                </Row>
              </Card>
            ) : !finalizeCompleted ? (
              <Card className="project-creation-locked-card shadow-sm">
                <Row>
                  <Col>
                    <div className="project-locked-content">
                      <div className="project-locked-header project-locked-header-row">
                        <div className="project-locked-left">
                          <span className="project-locked-title">
                            {t("Project_Creation_Locked")}
                          </span>
                          <Lock size={16} className="project-locked-icon" />
                          <span className="project-locked-meta">
                            {lockSummary.locked_users_count} of {lockSummary.total_users} collaborators locked
                          </span>
                        </div>

                        {allCollaboratorsLocked && (
                          <button
                            className="finalize-prioritization-btn"
                            onClick={() => {
                              setFinalizeCompleted(true);
                              setShowFinalizeToast(true);
                              updateBusinessStatus("prioritized");
                              setTimeout(() => setShowFinalizeToast(false), 3000);
                            }}
                          >
                            <CheckCircle size={16} />
                            {t("Finalize_Prioritization")}
                          </button>
                        )}
                      </div>

                      <p className="project-locked-subtitle">
                        {t("No_newprojectscan_be_added_Continue_ranking_and_updating.")}
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card>
            ) : launched ? (
              <Card className="launched-card shadow-sm">
                <Row>
                  <Col>
                    <h5 className="launched-title">{t("Launched")}</h5>
                    <p className="launched-subtitle">
                      {t("Projects_ready_for_execution")}
                    </p>
                  </Col>
                </Row>
              </Card>
            ) : (
              <Card className="prioritization-complete-card shadow-sm">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="prioritization-title">
                      {t("Prioritization_Complete")}
                    </h5>
                    <p className="prioritization-subtitle">
                      {t("Projects_prioritized")}
                    </p>
                  </Col>

                  <Col md={4} className="d-flex justify-content-end">
                    <button
                      className="launch-projects-btn"
                      onClick={() => {
                        setLaunched(true);
                        setShowLaunchToast(true);
                        updateBusinessStatus("launched");
                        setTimeout(() => setShowLaunchToast(false), 3000);
                      }}
                    >
                      {t("Launch_Projects")}
                    </button>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}

        {/* PORTFOLIO OVERVIEW */}
        <Card className="portfolio-card shadow-sm">
          <h5 className="portfolio-title fw-bold mb-4">{t("Portfolio_Overview")}</h5>

          <Row>
            {[
              {
                title: t("Total_Projects"),
                content: <h3 className="fw-bold">{portfolioData.totalProjects}</h3>,
              },
              {
                title: t("Impact_Distribution"),
                content: (
                  <div className="impact-row">
                    <div className="impact-item">
                      <span className="impact-dot green"></span>
                      <span>{portfolioData.impactDistribution.green}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-dot orange"></span>
                      <span>{portfolioData.impactDistribution.orange}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-dot blue"></span>
                      <span>{portfolioData.impactDistribution.blue}</span>
                    </div>
                  </div>
                ),
              },
              {
                title: t("Risk_Balance"),
                content: (
                  <div className="risk-row">
                    <div className="risk-item">
                      <AlertTriangle size={18} color="#ff3b30" />
                      <span>{portfolioData.riskBalance.high}</span>
                    </div>
                    <div className="risk-item">
                      <AlertCircle size={18} color="#ff9500" />
                      <span>{portfolioData.riskBalance.medium}</span>
                    </div>
                    <div className="risk-item">
                      <CheckCircle size={18} color="#34c759" />
                      <span>{portfolioData.riskBalance.low}</span>
                    </div>
                  </div>
                ),
              },
              {
                title: t("Completed_Details"),
                content: <h3 className="fw-bold">{portfolioData.completedDetails}</h3>,
              },
            ].map((item, index) => (
              <Col md={3} key={index}>
                <div className="portfolio-box">
                  <p className="portfolio-label">{item.title}</p>
                  {item.content}
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* PROJECT HEADER SECTION */}
        <div className="projects-header-container">
          <h6 className="projects-small-title">{t("Projects")}</h6>

          <div className="projects-header-row">
            <h2 className="projects-count">
              {portfolioData.totalProjects} {t("total_projects")}
            </h2>

            <div className="d-flex gap-2 flex-wrap justify-content-end">
              {isDraft && !isViewer && (
                <button
                  onClick={handleNewProject}
                  className="btn-new-project"
                >
                  <Plus size={18} />
                  {t("New_Project")}
                </button>
              )}

              {/* NEW: Show rank button if user has rerank access even when launched */}
              {((isPrioritizing && !rankingsLocked) || (launched && userHasRerankAccess)) && !isViewer && (
                <button
                  onClick={() => setShowRankScreen(!showRankScreen)}
                  className="btn-rank-projects"
                >
                  <ListOrdered size={18} />
                  {showRankScreen ? t("Hide") : t("Rank_Projects")}
                </button>
              )}

              {isPrioritizing && rankingsLocked && !userHasRerankAccess && (
                <>
                  <button className="btn-rankings-locked" disabled>
                    <Lock size={18} />
                    {t("Rankings_Locked")}
                  </button>
                  {showRankScreen && (
                    <button
                      onClick={() => setShowRankScreen(false)}
                      className="btn-rank-projects"
                    >
                      {t("Hide")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <RankProjectsPanel
          show={showRankScreen}
          projects={rankedProjects}
          businessId={selectedBusinessId}
          onLockRankings={() => lockMyRanking(rankedProjects[0]?._id)}
          onRankSaved={refreshTeamRankings}
          isAdmin={isEditor}
          isRankingLocked={isRankingLocked}
        />

        {/* TEAM RANKINGS VIEW */}
        {(isPrioritizing || (launched && userHasRerankAccess)) && !isViewer && (
          <div className="rank-list mt-4">
            <Accordion activeKey={activeAccordionKey} onSelect={handleAccordionSelect}>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <div className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-2">
                      <Users size={18} className="text-info" />
                      <strong>{t("Team_Rankings_View")}</strong>
                    </div>
                    <small className="text-muted">
                      {t("See_how_all_team_members_ranked_projects")}
                    </small>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <div className="d-flex gap-4 mb-3">
                    <span>🟢 {t("High_Agreement")}</span>
                    <span>🟡 {t("Medium_Agreement")}</span>
                    <span>🔴 {t("Low_Agreement")}</span>
                  </div>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>{t("Project")}</th>
                        <th className="text-center">{user}</th>
                        <th className="text-center">{t("Consensus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProjects.map((p) => {
                        const key = String(p._id);
                        const userRank = rankMap[key];
                        const adminRank = adminRankMap[key];

                        return (
                          <tr key={p._id}>
                            <td>{p.project_name}</td>
                            <td className="text-center">
                              <Badge pill bg="primary">
                                {userRank ?? "-"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <ConsensusButtonPopover
                                userRole={userRole}
                                userRank={userRank}
                                adminRank={adminRank}
                                project={p}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        )}

        {/* PROJECTS LIST */}
        <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
          <Row className="g-4">
            {sortedProjects.map((p, index) => (
              <Col
                xs={12}
                sm={12}
                md={isFinalizedView ? 12 : 6}
                key={p._id}
              >
                <div className="project-card">
                  {finalizeCompleted && (
                    <div className="project-serial-number">
                      {rankMap[String(p._id)] ?? index + 1}
                    </div>
                  )}
                  <p className="project-initiative">
                    from&nbsp;
                    <span className="project-initiative-highlight">{p.project_type || "Created project"}</span>
                  </p>

                  <h5 className="project-title">{p.project_name}</h5>

                  <p className="project-description">{p.description}</p>

                  <div className="project-quote">"{p.quote || "Generate using AI"}"</div>

                  <p className="project-last-edited">
                    Created by{" "}
                    <span className="project-last-edited-name">
                      {p.created_by || "Unknown"}
                    </span>
                  </p>

                  <hr />

                  <div className="project-actions">
                    {/* NEW: Updated edit button logic */}
                    {launched ? (
                      canEditProject(p) ? (
                        <button
                          onClick={() => handleEditProject(p, "edit")}
                          className="view-details-btn"
                        >
                          <Pencil size={16} /> {t("edit")}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditProject(p, "view")}
                          className="view-details-btn"
                        >
                          {t("View_Details")}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() =>
                          handleEditProject(p, isViewer ? "view" : "edit")
                        }
                        className="view-details-btn"
                      >
                        {isViewer ? (
                          t("View_Details")
                        ) : (
                          <>
                            <Pencil size={16} /> {t("edit")}
                          </>
                        )}
                      </button>
                    )}

                    {isEditor && !isViewer && isDraft && !projectCreationLocked && (
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                      >
                        <Trash2 size={16} /> {t("delete")}
                      </button>
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Toasts */}
        <div className="rankings-toast-wrapper">
          <Toast show={showLockToast} onClose={() => setShowLockToast(false)}>
            <Toast.Body className="rankings-toast-body">
              <CheckCircle size={18} />
              <span>{t("Your_rankings_have_been_locked")}</span>
            </Toast.Body>
          </Toast>
        </div>

        <div className="project-lock-toast-wrapper">
          <Toast
            show={showProjectLockToast}
            onClose={() => setShowProjectLockToast(false)}
          >
            <Toast.Body className="project-lock-toast-body">
              <CheckCircle size={18} />
              <span>{t("Project_creation_locked_Continue_ranking")}</span>
            </Toast.Body>
          </Toast>
        </div>

        <div className="finalize-toast-wrapper">
          <Toast
            show={showFinalizeToast}
            onClose={() => setShowFinalizeToast(false)}
          >
            <Toast.Body className="finalize-toast-body">
              <CheckCircle size={18} />
              <span>{t("Prioritization_complete_Add_detailed_planning")}</span>
            </Toast.Body>
          </Toast>
        </div>

        <div className="launch-toast-wrapper">
          <Toast
            show={showLaunchToast}
            onClose={() => setShowLaunchToast(false)}
          >
            <Toast.Body className="launch-toast-body">
              <CheckCircle size={18} />
              <span>{t("Projects_launched_Ready_for_execution.")}</span>
            </Toast.Body>
          </Toast>
        </div>
      </>
    );
  };

  return (
    <>
      {/* GLOBAL VALIDATION TOAST */}
      <div className="validation-toast-wrapper">
        <Toast
          show={showValidationToast}
          onClose={() => setShowValidationToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="validation-toast-body">
            <AlertTriangle size={18} />
            <span>{validationMessage}</span>
          </Toast.Body>
        </Toast>
      </div>

      <Container fluid className="projects-wrapper">
        {activeView === "list" ? renderProjectList() : renderProjectForm()}
      </Container>
    </>
  );
};

export default ProjectsSection;