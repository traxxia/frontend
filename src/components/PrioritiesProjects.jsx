import React, { useState, useEffect } from "react";
import { Card, Button, Form, Row, Col, Badge, Spinner } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";
import { Folder, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalysisApiService } from "../services/analysisApiService";
import { useTranslation } from "../hooks/useTranslation";
import PlanLimitModal from "./PlanLimitModal";
import "../styles/PrioritiesProjects.css";

const PrioritiesProjects = ({ selectedBusinessId, onSuccess }) => {
  const { t } = useTranslation();
  const [priorities, setPriorities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kickstarting, setKickstarting] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const navigate = useNavigate();
  const userPlan = sessionStorage.getItem("userPlan")?.toLowerCase() || "essential";

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const apiService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusinessId) return;
      try {
        setLoading(true);
        const data = await apiService.getKickstartData(selectedBusinessId);
        if (data && data.priorities) {
          setPriorities(data.priorities);
        }
      } catch (error) {
        console.error("Error fetching kickstart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBusinessId]);

  const toggleExpand = (idx) => {
    setExpandedId((prev) => (prev === idx ? null : idx));
  };

  const toggleSelection = (idx) => {
    setSelected((prev) =>
      prev.includes(idx)
        ? prev.filter((item) => item !== idx)
        : [...prev, idx]
    );
  };

  const handleKickstart = async () => {
    if (selected.length === 0) return;

    if (userPlan === 'essential') {
      setShowPlanLimitModal(true);
      return;
    }

    try {
      setKickstarting(true);
      const selectedPriorities = selected.map(idx => priorities[idx]);

      // Process projects sequentially or wait for all, but ensure we handle errors
      for (const priority of selectedPriorities) {
        await apiService.kickstartProject({
          businessId: selectedBusinessId,
          priority: priority
        });
      }

      // Refresh data to show kickstarted status
      const data = await apiService.getKickstartData(selectedBusinessId);
      if (data && data.priorities) {
        setPriorities(data.priorities);
      }
      setSelected([]);

      // Redirect to projects if callback provided
      if (onSuccess) {
        onSuccess();
      } else {
        alert(t("Projects kickstarted successfully!"));
      }
    } catch (error) {
      console.error("Error kickstarting projects:", error);
      const errorMsg = error.message || t("Failed to kickstart projects. Please try again.");
      alert(errorMsg);
    } finally {
      setKickstarting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="success" />
        <span className="ms-2">{t("Loading priorities...")}</span>
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
            className={`kickstart-button ${userPlan === 'essential' ? 'upgrade-needed' : ''}`}
            variant={userPlan === 'essential' ? "warning" : "success"}
            disabled={(selected.length === 0 && userPlan !== 'essential') || kickstarting}
            onClick={handleKickstart}
          >
            {kickstarting ? <Spinner size="sm" /> : userPlan === 'essential' ? "⭐" : "🚀"}
            {userPlan === 'essential' ? t("Upgrade to Kickstart") : t("Kickstart_Projects")}
          </Button>
        </Card.Body>
      </Card>

      <PlanLimitModal
        show={showPlanLimitModal}
        onHide={() => setShowPlanLimitModal(false)}
        title={t("upgrade_required") || "Upgrade Required"}
        message={t("kickstart_limit_msg") || "Project kickstarting is only available on Advanced plans."}
        subMessage={t("upgrade_to_execute") || "Upgrade to Advanced to execute your strategy with AI-powered kickstart."}
      />

      {priorities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">{t("No priorities found in the executive summary.")}</p>
        </div>
      ) : (
        priorities.map((item, idx) => {
          const isExpanded = expandedId === idx;
          const isAlreadyKickstarted = item.isKickstarted;
          const actions = item.actions || [];

          return (
            <Card key={idx} className={`priority-card mb-3 ${isAlreadyKickstarted ? 'kickstarted' : ''}`}>
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <Form.Check
                      type="checkbox"
                      disabled={isAlreadyKickstarted}
                      checked={selected.includes(idx)}
                      onChange={() => toggleSelection(idx)}
                    />
                  </Col>

                  <Col className="expand-trigger" onClick={() => toggleExpand(idx)}>
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="priority-title mb-0">{item.title}</h6>
                      {isAlreadyKickstarted && (
                        <Badge bg="success" className="ms-2 kickstarted-badge">
                          <CheckCircle size={12} className="me-1" />
                          {t("Kickstarted")}
                        </Badge>
                      )}
                    </div>
                    <small className="priority-desc">
                      {actions.length > 0
                        ? (typeof actions[0].action === 'string' ? actions[0].action : (typeof actions[0] === 'string' ? actions[0] : t("View Projects")))
                        : t("View Projects")}...
                    </small>
                  </Col>

                  <Col
                    xs="auto"
                    className="d-flex align-items-center gap-2 expand-trigger"
                    onClick={() => toggleExpand(idx)}
                  >
                    <Badge bg="light" text="dark" className="priority-count">
                      📄 {actions.length}
                    </Badge>
                    <ChevronRight className={isExpanded ? "rotate" : ""} />
                  </Col>
                </Row>

                {isExpanded && actions.length > 0 && (
                  <div className="projects-section mt-3">
                    <div className="projects-title mb-2 d-flex align-items-center gap-2">
                      <Folder size={16} className="projects-icon" />
                      <span>{t("Projects")}</span>
                    </div>

                    {actions.map((action, actionIdx) => {
                      const actionText = typeof action === 'object' ? (action.action || action.Action || JSON.stringify(action)) : action;
                      const isActionKickstarted = action.isKickstarted;
                      return (
                        <div key={actionIdx} className={`project-row ${isActionKickstarted ? 'kickstarted' : ''}`}>
                          <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-start gap-2">
                              <CheckCircle size={16} className={`${isActionKickstarted ? 'text-success' : 'text-muted'} mt-1 flex-shrink-0`} />
                              <span>{actionText}</span>
                            </div>
                            {isActionKickstarted && (
                              <Badge bg="success" className="ms-2">
                                {t("Status_Completed") || "Kickstarted"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          );
        })
      )}

      <Card className="footer-note mt-4">
        <Card.Body>
          <small className="text-muted">
            <strong>{t("Note")}:</strong> {t("Kickstarting a priority creates separate draft projects for each tactical action where you can further define scope and metrics.")}
          </small>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PrioritiesProjects;
