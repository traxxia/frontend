import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";
import { Folder, Loader2, Info } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { AnalysisApiService } from "../services/analysisApiService";
import "../styles/PrioritiesProjects.css";

const PrioritiesProjects = ({ selectedBusinessId, companyAdminIds, onStartOnboarding }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  const fetchPriorities = useCallback(async () => {
    if (!selectedBusinessId) return;
    try {
      setLoading(true);
      const summaryResult = await analysisService.getPMFExecutiveSummary(selectedBusinessId);

      const summaryContent = summaryResult?.summary || summaryResult;

      // Extraction logic similar to ExecutiveSummary.jsx
      const getSection = (key, dataObj) => {
        if (!dataObj) return null;
        return dataObj[key] ||
          dataObj[key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())] ||
          dataObj[key.replace(/_/g, "")] ||
          dataObj[key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')];
      };

      const topPriorities = getSection('top_priorities', summaryContent) ||
        summaryContent?.topPriorities ||
        summaryContent?.["Top Priorities"];

      if (topPriorities && Array.isArray(topPriorities)) {
        const formattedPriorities = topPriorities.map((item, idx) => {
          const actions = item.actions || item.Actions || [];
          return {
            id: idx + 1,
            title: item.title || item.action || item.Action || item.Title || "Untitled Priority",
            description: item.description || (actions.length > 0 ? `${actions.length} projects recommended` : "Strategic priority from Executive Summary"),
            count: actions.length,
            projects: actions.map(a => typeof a === 'string' ? a : (a.action || a.Action || JSON.stringify(a)))
          };
        });
        setData(formattedPriorities);
      }
    } catch (error) {
      console.error("Error fetching priorities for projects tab:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleKickstart = () => {
    console.log("Selected priorities:", selected);
    // Future integration: redirect to project creation with these pre-filled
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Loader2 className="text-primary animate-spin" />
        <span className="ms-2 text-muted">Loading your priorities...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-light py-5 text-center rounded-4 m-3 shadow-sm border">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "No priorities found for this business yet."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to generate your top priorities."}</p>
          {onStartOnboarding && (
            <button
              className="btn btn-primary rounded-pill px-5 py-2 fw-semibold"
              onClick={onStartOnboarding}
            >
              {t("startPMFOnboarding") || "Start PMF Onboarding"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4 priorities-container">

      <h4 className="priorities-title">{t("Priorities & Projects")}</h4>
      <p className="priorities-subtitle">{t("What should I work on next")}?</p>

      <Card className="kickstart-card mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="kickstart-title mb-1">
              {t("Ready to Start Project Planning")}?
            </h6>
            <small className="text-muted">
              {t("Select one or more priorities below")}
            </small>
          </div>
          <Button
            className="kickstart-button"
            variant="secondary"
            disabled={selected.length === 0}
            onClick={handleKickstart}
          >
            🚀 {t("Kickstart_Projects")}
          </Button>
        </Card.Body>
      </Card>

      {data.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <Card key={item.id} className="priority-card mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs="auto">
                  <Form.Check
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                  />
                </Col>

                <Col onClick={() => toggleExpand(item.id)} style={{ cursor: 'pointer' }}>
                  <h6 className="priority-title mb-1">{item.title}</h6>
                  <small className="priority-desc">{item.description}</small>
                </Col>

                <Col
                  xs="auto"
                  className="d-flex align-items-center gap-2 expand-trigger"
                  onClick={() => toggleExpand(item.id)}
                >
                  <Badge bg="light" text="dark" className="priority-count">
                    📄 {item.count}
                  </Badge>
                  <ChevronRight className={isExpanded ? "rotate" : ""} />
                </Col>
              </Row>

              {isExpanded && item.projects.length > 0 && (
                <div className="projects-section mt-3">
                  <div className="projects-title mb-2 d-flex align-items-center gap-2">
                    <Folder size={16} className="projects-icon" />
                    <span>{t("Projects")}</span>
                  </div>

                  {item.projects.map((project, index) => (
                    <div key={index} className="project-row">
                      <span>{project}</span>
                      <span className="status-badge not-started">
                        {t("Not Started")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default PrioritiesProjects;
