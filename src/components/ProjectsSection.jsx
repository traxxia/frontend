import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container, Row, Col, Card, Button ,Toast, Accordion, AccordionItem, Table, Badge} from "react-bootstrap";
import { Lock, AlertTriangle, AlertCircle, CheckCircle, Plus, ListOrdered, Pencil, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RankProjectsPanel from "../components/RankProjectsPanel";
import "../styles/ProjectsSection.css";



const ProjectsSection = ({ selectedBusinessId }) => {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState("");
  const [showRankScreen, setShowRankScreen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [rankingsLocked, setRankingsLocked] = useState(false);
  const [showLockToast, setShowLockToast] = useState(false);
  const [projectCreationLocked, setProjectCreationLocked] = useState(false);
  const [showProjectLockToast, setShowProjectLockToast] = useState(false);


  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("userName")


  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin";
  const navigate = useNavigate();
  useEffect(() => {
  if (!selectedBusinessId) return;

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
            business_id: selectedBusinessId  // <-- FILTER WORKS HERE
          }
        }
      );

      setProjects(res.data?.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };


  fetchProjects();
}, [selectedBusinessId]);

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

    // Optionally refresh the list
    setProjects(projects.filter(p => p._id !== projectId));

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


  return (
    <Container fluid className="projects-wrapper">

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
          ) : (
            <Card className="project-creation-locked-card shadow-sm">
              <Row>
                <Col>
                  <div className="project-locked-content">
                    <div className="project-locked-header">
                      <span className="project-locked-title">
                        Project Creation Locked
                      </span>
                      <Lock size={16} className="project-locked-icon" />
                      <span className="project-locked-meta">
                        0 of 1 collaborators locked
                      </span>
                    </div>

                    <p className="project-locked-subtitle">
                      No new projects can be added. Continue ranking and updating.
                    </p>
                  </div>
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
            <button
              onClick={() => navigate(`/projects/new/${selectedBusinessId}`)}
              className="btn-new-project"
            >
              <Plus size={18} />
              {t("New_Project")}
            </button>

            {rankingsLocked ? (
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
            )}
          </div>
        </div>
      </div>

      <RankProjectsPanel
        show={showRankScreen}
        projects={projects}
          onLockRankings={() => {
            setRankingsLocked(true);
            setShowLockToast(true);

            // auto-hide after 3 seconds
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
      <div className="projects-list-wrapper">
        <Row className="g-4">
          {projects.map((p) => (
             <Col xs={12} sm={12} md={6} key={p._id}>
              <div className="project-card">
                <p className="project-initiative">
                  from{" "}
                  <span className="project-initiative-highlight">{p.initiative || "initiatives"}</span>
                </p>

                <h5 className="project-title">{p.project_name}</h5>

                <p className="project-description">{p.description}</p>

                <div className="project-quote">“{p.quote || "Generate using AI"}”</div>

                <p className="project-last-edited">
                Created by{" "}
                <span className="project-last-edited-name">
                  {p.created_by || "Unknown"}
                </span>
              </p>

                <hr />

                <div className="project-actions">
                  {/* Edit button – always visible */}
                  <button
                    onClick={() =>
                      navigate("/projects/edit", {
                        state: { projectId: p._id }
                      })
                    }
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Pencil size={16} /> {t("Edit")}
                  </button>
                  {/* Delete button – hidden when project creation is locked */}
                  {!projectCreationLocked && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      <Trash2 size={16} /> {t("Delete")}
                    </button>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      {/* Rankings Locked Toast */}
      <div className="rankings-toast-wrapper">
        <Toast show={showLockToast} onClose={() => setShowLockToast(false)}>
          <Toast.Body className="rankings-toast-body">
            <CheckCircle size={18} />
            <span>{t("Your_rankings_have_been_locked")}</span>
          </Toast.Body>
        </Toast>
      </div>
      {/* Lock Project Creation Toast */}
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

    </Container>
  );
};

export default ProjectsSection;
