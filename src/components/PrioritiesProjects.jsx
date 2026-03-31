import React, { useState, useEffect } from "react";
import { Card, Button, Form, Row, Col, Badge, Spinner, ProgressBar, Modal } from "react-bootstrap";
import { ChevronRight, ArrowRight } from "react-bootstrap-icons";
import { Folder, CheckCircle, Rocket, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalysisApiService } from "../services/analysisApiService";
import { useTranslation } from "../hooks/useTranslation";
import PlanLimitModal from "./PlanLimitModal";
import "../styles/PrioritiesProjects.css";
import { getUserLimits } from "../utils/authUtils";

const PrioritiesProjects = ({ selectedBusinessId, companyAdminIds, onSuccess, onToastMessage, onStartOnboarding }) => {
  const { t } = useTranslation();
  const [priorities, setPriorities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kickstarting, setKickstarting] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastKickstartedCount, setLastKickstartedCount] = useState(0);
  const navigate = useNavigate();
  const userRole = (
    sessionStorage.getItem("role") ||
    sessionStorage.getItem("userRole") ||
    ""
  ).toLowerCase();
  const isAdmin = userRole === "company_admin" || userRole === "super_admin";
  const isViewer = userRole === "viewer";
  const hasProjectsAccess = getUserLimits().project === true;

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

    if (!hasProjectsAccess) {
      setShowPlanLimitModal(true);
      return;
    }

    try {
      setKickstarting(true);
      const selectedPriorities = selected.map(idx => priorities[idx]);
      let totalProjectsCreated = 0;

      // Process projects sequentially or wait for all, but ensure we handle errors
      for (const priority of selectedPriorities) {
        const response = await apiService.kickstartProject({
          businessId: selectedBusinessId,
          priority: priority
        });
        if (response && response.projectIds) {
          totalProjectsCreated += response.projectIds.length;
        } else if (priority.actions) {
          totalProjectsCreated += priority.actions.length;
        }
      }

      // Refresh data to show kickstarted status
      const data = await apiService.getKickstartData(selectedBusinessId);
      if (data && data.priorities) {
        setPriorities(data.priorities);
      }
      setSelected([]);
      setLastKickstartedCount(totalProjectsCreated);
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Error kickstarting projects:", error);
      const errorMsg = error.message || t("Failed to kickstart projects. Please try again.");
      if (onToastMessage) {
        onToastMessage(errorMsg, "error");
      } else {
        alert(errorMsg);
      }
    } finally {
      setKickstarting(false);
    }
  };

  const handleConfirmRedirect = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(`/projects?business_id=${selectedBusinessId}`);
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

  if (priorities.length === 0) {
    return (
      <div className="bg-light py-5 text-center rounded-4 m-3 shadow-sm border">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "No results available yet."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see results here."}</p>
          {onStartOnboarding && !isViewer && (
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

      {isAdmin && hasProjectsAccess && (
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
              className={`kickstart-button d-flex align-items-center gap-2 ${!hasProjectsAccess ? 'upgrade-needed' : ''}`}
              variant={!hasProjectsAccess ? "warning" : "success"}
              disabled={(selected.length === 0 && hasProjectsAccess) || kickstarting}
              onClick={handleKickstart}
            >
              {kickstarting ? <Spinner size="sm" /> : <span>{!hasProjectsAccess ? "⭐" : "🚀"}</span>}
              <span>{!hasProjectsAccess ? t("Upgrade to Kickstart") : t("Kickstart_Projects")}</span>
            </Button>
          </Card.Body>
        </Card>
      )}

      <PlanLimitModal
        show={showPlanLimitModal}
        onHide={() => setShowPlanLimitModal(false)}
        title={t("upgrade_required") || "Upgrade Required"}
        message={t("kickstart_limit_msg") || "Project kickstarting is only available on upgraded plans."}
        subMessage={t("upgrade_to_execute") || "Upgrade to Advanced to execute your strategy with AI-powered kickstart."}
      />

      {priorities.map((item, idx) => {
        const isExpanded = expandedId === idx;
        const isAlreadyKickstarted = item.isKickstarted;
        const actions = item.actions || [];
        
        // Calculate granular progress
        const totalActions = actions.length;
        const kickstartedActions = actions.filter(a => a.isKickstarted).length;
        const progressPercent = totalActions > 0 ? (kickstartedActions / totalActions) * 100 : 0;
        const isFullyKickstarted = progressPercent === 100 && totalActions > 0;
        const isPartiallyKickstarted = progressPercent > 0 && progressPercent < 100;

        return (
          <Card key={idx} className={`priority-card mb-3 ${isFullyKickstarted ? 'kickstarted' : isPartiallyKickstarted ? 'partially-kickstarted' : ''}`}>
            <Card.Body onClick={() => toggleExpand(idx)} className="expand-trigger">
              <div className="priority-card-inner">
                {/* TOP SECTION */}
                <div className="priority-top justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    {isAdmin && hasProjectsAccess && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Form.Check
                          type="checkbox"
                          disabled={isFullyKickstarted || kickstarting}
                          checked={selected.includes(idx)}
                          onChange={() => toggleSelection(idx)}
                        />
                      </div>
                    )}
                    <h6 className="priority-title mb-0">{item.title}</h6>
                  </div>

                  {progressPercent > 0 && (
                    <div className={`minimal-status-badge ${isFullyKickstarted ? 'fully' : 'partial'}`}>
                      {isFullyKickstarted ? <CheckCircle size={12} /> : <Rocket size={12} />}
                      <span>{isFullyKickstarted ? t("Kickstarted") : `${kickstartedActions}/${totalActions}`}</span>
                    </div>
                  )}
                </div>

                {/* BOTTOM SECTION */}
                <div className="priority-bottom mt-1">
                  <div className="priority-meta text-muted">
                    <Folder size={12} className="me-1" />
                    <span>{actions.length} {t("Tactical Actions")}</span>
                  </div>
                  
                  <ChevronRight
                    size={16}
                    className={`priority-chevron ${isExpanded ? "rotate" : ""}`}
                  />
                </div>
              </div>

              {isExpanded && actions.length > 0 && (
                <div className="projects-section mt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="projects-title mb-2 d-flex align-items-center gap-2">
                    <Info size={14} className="text-muted" />
                    <span>{t("Individual Projects")}</span>
                  </div>

                  {actions.map((action, actionIdx) => {
                    const actionText = typeof action === 'object' ? (action.action || action.Action || JSON.stringify(action)) : action;
                    const isActionKickstarted = action.isKickstarted;
                    return (
                      <div key={actionIdx} className={`project-row ${isActionKickstarted ? 'kickstarted' : ''}`}>
                        <div className="d-flex align-items-center justify-content-between w-100">
                          <div className="d-flex align-items-start gap-2">
                            <CheckCircle size={14} className={`${isActionKickstarted ? 'text-success' : 'text-muted'} mt-1 flex-shrink-0`} />
                            <span className={isActionKickstarted ? "text-success small fw-medium" : "small"}>{actionText}</span>
                          </div>
                          {isActionKickstarted && (
                            <Badge bg="success" className="minimal-kickstart-badge">
                              {t("Kickstarted")}
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
      })}

      <Card className="footer-note mt-4">
        <Card.Body>
          <small className="text-muted">
            <strong>{t("Note")}:</strong> {t("Kickstarting a priority creates separate draft projects for each tactical action where you can further define scope and metrics.")}
          </small>
        </Card.Body>
      </Card>

      {/* SUCCESS MODAL (New) */}
      <Modal 
        show={showSuccessModal} 
        onHide={() => setShowSuccessModal(false)}
        centered
        className="kickstart-success-modal"
      >
        <Modal.Body className="text-center p-4">
          <div className="success-icon-wrapper mb-3">
            <Rocket size={48} className="text-success" />
          </div>
          <h4 className="fw-bold mb-2">{t("Project Kickstart Successful")}!</h4>
          <p className="text-muted mb-4">
            {lastKickstartedCount} {t("new draft projects have been created in your Projects tab. You can now define their scope, metrics, and start execution.")}
          </p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={handleConfirmRedirect} className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold">
              {t("Go to Projects")} <ArrowRight size={18} />
            </Button>
            <Button variant="link" onClick={() => setShowSuccessModal(false)} className="text-muted text-decoration-none">
              {t("Stay on Priorities")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PrioritiesProjects;
