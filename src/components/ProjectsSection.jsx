import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Lock, AlertTriangle, AlertCircle, CheckCircle, Plus, ListOrdered, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RankProjectsPanel from "../components/RankProjectsPanel";
import "../styles/ProjectsSection.css";

const projects = [
  {
    id: 1,
    initiative: "Immediate Initiative",
    title: "Enhance digital product offerings",
    description: "Expand digital product suite to diversify revenue",
    quote: "Reduces dependency on single product and increases customer lifetime value",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 2,
    initiative: "Short-term Initiative",
    title: "Strengthen partnerships with key merchants",
    description: "Build strategic merchant partnerships for transaction volumes",
    quote: "Network effects drive platform value and competitive moat",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 3,
    initiative: "Short-term Initiative",
    title: "Strengthen customer loyalty programs",
    description: "Implement comprehensive loyalty program to reduce churn",
    quote: "Customer retention is 5x cheaper than acquisition",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 4,
    initiative: "Long-term Initiative",
    title: "Expand into new geographical markets",
    description: "Geographic expansion beyond Peru",
    quote: "Unlocks new revenue streams and reduces regional risk",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 5,
    initiative: "Long-term Initiative",
    title: "Adopt advanced analytics and AI",
    description: "Build data infrastructure and AI capabilities",
    quote: "Data-driven decisions improve margins and customer experience",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 6,
    initiative: "Immediate Initiative",
    title: "Digital Wallet Launch",
    description: "Launch digital wallet product to capture market share",
    quote: "Critical for market entry and customer acquisition in digital payments space",
    lastUpdated: "Last edited by John Doe",
  },
];

const portfolioData = {
  totalProjects: 6,
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

const ProjectsSection = () => {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState("");
  const [showRankScreen, setShowRankScreen] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === "super_admin";
  const navigate = useNavigate();

  return (
    <Container fluid className="projects-wrapper">

      {/* OPEN FOR COLLABORATION CARD */}
      {isSuperAdmin && (
        <Card className="open-collab-card shadow-sm">
          <Row className="align-items-center">
            <Col md="8">
              <h5 className="open-collab-title fw-bold">{t("Open_for_Collaboration")}</h5>
              <p className="open-collab-text">
                {t("All_collaborators_can_add_projects_update_info_and_rank")}
              </p>
            </Col>

            <Col md="4" className="d-flex justify-content-end align-items-center">
              <Button className="open-collab-btn">
                <Lock size={16} color="#589be9ff" strokeWidth={2} />
                {t("Lock_Project_Creation")}
              </Button>
            </Col>
          </Row>
        </Card>
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
              onClick={() => navigate("/projects/new")}
              className="btn-new-project"
            >
              <Plus size={18} />
              {t("New_Project")}
            </button>

            <button
              onClick={() => setShowRankScreen(!showRankScreen)}
              className="btn-rank-projects"
            >
              <ListOrdered size={18} />
              {showRankScreen ? t("Hide") :t("Rank_Projects")}
            </button>
          </div>
        </div>
      </div>

      <RankProjectsPanel
        show={showRankScreen}
        onClose={() => setShowRankScreen(false)}
        projects={projects}
      />

      {/* PROJECTS LIST */}
      <div className="projects-list-wrapper">
        <Row className="g-4">
          {projects.map((p) => (
            <Col xs={12} sm={12} md={6} key={p.id}>
              <div className="project-card">
                <p className="project-initiative">
                  from{" "}
                  <span className="project-initiative-highlight">{p.initiative}</span>
                </p>

                <h5 className="project-title">{p.title}</h5>

                <p className="project-description">{p.description}</p>

                <div className="project-quote">“{p.quote}”</div>

                <p className="project-last-edited">
                  Last edited by{" "}
                  <span className="project-last-edited-name">
                    {p.lastUpdated.split(" ").slice(-2).join(" ")}
                  </span>
                </p>

                <hr />

                <div className="project-actions">
                  <button
                    onClick={() => navigate("/projects/edit")}
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Pencil size={16} /> {t("Edit")}
                  </button>

                  <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
                    <Trash2 size={16} /> {t("Delete")}
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
};

export default ProjectsSection;
