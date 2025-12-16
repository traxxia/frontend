import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container, Row, Col, Card, Button, Toast, Accordion, Table, Badge } from "react-bootstrap";
import { Lock, AlertTriangle, AlertCircle, CheckCircle, Plus, ListOrdered, Pencil, Trash2, Users } from "lucide-react";
import axios from "axios";
import RankProjectsPanel from "../components/RankProjectsPanel";
import ProjectForm from "../components/ProjectForm";
import "../styles/ProjectsSection.css";

const ProjectsSection = ({ selectedBusinessId, onProjectCountChange }) => {
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

  // Content management states
  const [activeView, setActiveView] = useState("list"); // 'list', 'new', 'edit', 'view'
  const [currentProject, setCurrentProject] = useState(null);

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

  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("userName");

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin";

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
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleDelete = async (projectId) => {
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

  const isFinalized = rankingsLocked && projectCreationLocked && rankingLockedFirst;

  // Handle opening new project form
  const handleNewProject = () => {
    resetForm();
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

  // Handle create project
  const handleCreate = async () => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    const payload = {
      business_id: selectedBusinessId,
      user_id: userId,
      collaborators: [],
      project_name: projectName,
      description: description,
      why_this_matters: importance,
      impact: selectedImpact,
      effort: selectedEffort,
      risk: selectedRisk,
      strategic_theme: selectedTheme,
      dependencies,
      high_level_requirements: highLevelReq,
      scope_definition: scope,
      expected_outcome: outcome,
      success_metrics: successMetrics,
      estimated_timeline: timeline,
      budget_estimate: budget || 0,
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      alert("Project created successfully!");
      await fetchProjects();
      handleBackToList();
    } catch (err) {
      console.error("Project creation failed:", err);
      alert("Failed to create project.");
    }
  };

  // Handle save project
  const handleSave = async () => {
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
      await fetchProjects();
      handleBackToList();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  // Render project form (for new/edit/view)
  const renderProjectForm = () => {
    return (
      <ProjectForm
        mode={activeView}
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
      />
    );
  };

  // Render project list view
  const renderProjectList = () => {
    return (
      <>
        {/* OPEN FOR COLLABORATION CARD */}
        {isSuperAdmin && (
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
                            Project Creation Locked
                          </span>
                          <Lock size={16} className="project-locked-icon" />
                          <span className="project-locked-meta">
                            0 of 1 collaborators locked
                          </span>
                        </div>

                        {isFinalized && (
                          <button
                            className="finalize-prioritization-btn"
                            onClick={() => {
                              setFinalizeCompleted(true);
                              setShowFinalizeToast(true);
                              setTimeout(() => setShowFinalizeToast(false), 3000);
                            }}
                          >
                            <CheckCircle size={16} />
                            Finalize Prioritization
                          </button>
                        )}
                      </div>

                      <p className="project-locked-subtitle">
                        No new projects can be added. Continue ranking and updating.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card>
            ) : launched ? (
              <Card className="launched-card shadow-sm">
                <Row>
                  <Col>
                    <h5 className="launched-title">Launched</h5>
                    <p className="launched-subtitle">
                      Projects ready for execution
                    </p>
                  </Col>
                </Row>
              </Card>
            ) : (
              <Card className="prioritization-complete-card shadow-sm">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h5 className="prioritization-title">
                      Prioritization Complete
                    </h5>
                    <p className="prioritization-subtitle">
                      Projects prioritized. Complete all required details before launch.
                    </p>
                  </Col>

                  <Col md={4} className="d-flex justify-content-end">
                    <button
                      className="launch-projects-btn"
                      onClick={() => {
                        setLaunched(true);
                        setShowLaunchToast(true);
                        setTimeout(() => setShowLaunchToast(false), 3000);
                      }}
                    >
                      Launch Projects
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
              {!isFinalized && (
                <button
                  onClick={handleNewProject}
                  className="btn-new-project"
                >
                  <Plus size={18} />
                  {t("New_Project")}
                </button>
              )}

              {!isFinalized && (
                rankingsLocked ? (
                  <button className="btn-rankings-locked" disabled>
                    <Lock size={18} />
                    {t("Rankings_Locked")}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRankScreen(!showRankScreen)}
                    className="btn-rank-projects"
                  >
                    <ListOrdered size={18} />
                    {showRankScreen ? t("Hide") : t("Rank_Projects")}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <RankProjectsPanel
          show={showRankScreen}
          projects={projects}
          onLockRankings={() => {
            setRankingsLocked(true);
            setRankingLockedFirst(true);
            setShowLockToast(true);
            setTimeout(() => setShowLockToast(false), 3000);
          }}
        />

        <div className="rank-list mt-4">
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center gap-2">
                    <Users size={18} className="text-info"/>
                    <strong>Team Rankings View</strong>
                  </div>
                  <small className="text-muted">
                    See how all team members ranked projects
                  </small>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="d-flex gap-4 mb-3">
                  <span>🟢 High Agreement</span>
                  <span>🟡 Medium Agreement</span>
                  <span>🔴 Low Agreement</span>
                </div>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th className="text-center">{user}</th>
                      <th className="text-center">Consensus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr key={p._id || i}>
                        <td>{p.project_name}</td>
                        <td className="text-center">
                          <Badge pill bg="primary">
                            {p.rank ?? "8"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge
                            pill
                            bg={
                              p.consensus === "high"
                                ? "success"
                                : p.consensus === "medium"
                                ? "warning"
                                : "danger"
                            }
                          >
                            &nbsp;
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </div>

        {/* PROJECTS LIST */}
        <div className={`projects-list-wrapper ${isFinalized ? "finalized-view" : ""}`}>
          <Row className="g-4">
            {projects.map((p, index) => (
              <Col
                xs={12}
                sm={12}
                md={isFinalized ? 12 : 6}
                key={p._id}
              >
                <div className="project-card">
                  {finalizeCompleted && (
                    <div className="project-serial-number">
                      {index + 1}
                    </div>
                  )}
                  <p className="project-initiative">
                    from&nbsp;
                    <span className="project-initiative-highlight">{p.initiative || "initiatives"}</span>
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
                    {launched ? (
                      <button 
                        onClick={() => handleEditProject(p, "view")}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditProject(p, "edit")}
                        className="view-details-btn"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                    )}

                    {isSuperAdmin && !projectCreationLocked && (                  
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
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
              <span>Project creation locked. Continue ranking.</span>
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
              <span>Prioritization complete! Add detailed planning.</span>
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
              <span>Projects launched! Ready for execution.</span>
            </Toast.Body>
          </Toast>
        </div>
      </>
    );
  };

  return (
    <Container fluid className="projects-wrapper">
      {activeView === "list" ? renderProjectList() : renderProjectForm()}
    </Container>
  );
};

export default ProjectsSection;