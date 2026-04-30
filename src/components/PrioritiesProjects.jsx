import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Button, Form, Badge, Spinner, Modal, ProgressBar } from "react-bootstrap";
import { ChevronRight, ArrowRight } from "react-bootstrap-icons";
import { Folder, CheckCircle, Rocket, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useAnalysisStore, useProjectStore } from "../store";
import { useTranslation } from "../hooks/useTranslation";
import { usePlanDetails } from "../hooks/useQueries";
import PlanLimitModal from "./PlanLimitModal";
import "../styles/PrioritiesProjects.css";

const PrioritiesProjects = ({ selectedBusinessId, onSuccess, onStayOnPriorities, onToastMessage, onStartOnboarding, refreshTrigger }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userRole = useAuthStore(state => state.userRole);
  const userLimits = useAuthStore(state => state.userLimits);
  const isAdmin = useAuthStore(state => state.isAdmin);
  const isViewer = userRole?.toLowerCase() === "viewer";
  const hasProjectsAccess = userLimits?.project === true;

  const kickstartData = useAnalysisStore(state => state.kickstartData);
  const fetchKickstartData = useAnalysisStore(state => state.fetchKickstartData);
  const kickstartProject = useAnalysisStore(state => state.kickstartProject);
  const clearProjectCache = useProjectStore(state => state.clearCache);
  const projects = useProjectStore(state => state.projects);

  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kickstarting, setKickstarting] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastKickstartedCount, setLastKickstartedCount] = useState(0);
  const [showNoCollaboratorsModal, setShowNoCollaboratorsModal] = useState(false);

  const { data: usageData } = usePlanDetails();
  const usage = usageData?.usage;

  const priorities = useMemo(() => kickstartData?.priorities || [], [kickstartData]);
  const hasCollaborators = kickstartData?.hasCollaborators ?? true;

  const { totalActions, kickstartedActions, globalProgressPercent } = useMemo(() => {
    let total = 0;
    let kickstarted = 0;
    priorities.forEach(priority => {
      const actions = priority.actions || [];
      total += actions.length;
      kickstarted += actions.filter(a => a.isKickstarted || a.status === 'kickstarted').length;
    });
    const percent = total > 0 ? Math.round((kickstarted / total) * 100) : 0;
    return { totalActions: total, kickstartedActions: kickstarted, globalProgressPercent: percent };
  }, [priorities]);

  const anyProjectKickstarted = useMemo(() =>
    priorities.some(p => p.isKickstarted || (p.actions && p.actions.some(a => a.isKickstarted))),
    [priorities]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusinessId) return;
      setLoading(true);
      try {
        await fetchKickstartData(selectedBusinessId, false);
      } catch (error) {
        console.error("Error fetching kickstart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBusinessId, refreshTrigger, fetchKickstartData]);

  const toggleExpand = useCallback((idx) => {
    setExpandedId((prev) => (prev === idx ? null : idx));
  }, []);

  const toggleSelection = useCallback((idx) => {
    setSelected((prev) =>
      prev.includes(idx)
        ? prev.filter((item) => item !== idx)
        : [...prev, idx]
    );
  }, []);

  const confirmKickstart = useCallback(async () => {
    try {
      setKickstarting(true);
      const selectedPriorities = selected.map(idx => priorities[idx]);
      let totalProjectsCreated = 0;

      for (const priority of selectedPriorities) {
        const response = await kickstartProject({
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
      await fetchKickstartData(selectedBusinessId);
      setSelected([]);
      setLastKickstartedCount(totalProjectsCreated);
      setShowSuccessModal(true);
      setShowNoCollaboratorsModal(false);

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
  }, [selected, hasProjectsAccess, priorities, isAdmin, hasCollaborators, selectedBusinessId, t, onToastMessage, kickstartProject, fetchKickstartData]);

  const handleKickstart = useCallback(async () => {
    if (!hasProjectsAccess) {
      setShowPlanLimitModal(true);
      return;
    }

    if (selected.length === 0) return;

    setShowNoCollaboratorsModal(true);
  }, [selected, hasProjectsAccess]);

  const handleConfirmRedirect = useCallback(() => {
    setShowSuccessModal(false);
    // Clear project-store caches so the Projects page fetches fresh data
    clearProjectCache(selectedBusinessId);

    // Set view mode to projects to ensure we see the card view
    useProjectStore.getState().setViewMode('projects');

    if (onSuccess) {
      onSuccess();
    } else {
      navigate(`/businesspage?business=${selectedBusinessId}&tab=bets`);
    }
  }, [onSuccess, navigate, selectedBusinessId, clearProjectCache]);

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
      {totalActions > 0 && (
        <Card className="mb-4 border-0 shadow-sm granular-header" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <Card.Body className="d-flex justify-content-between align-items-center py-3 px-4">
            <div>
              <h6 className="mb-1 text-dark fw-bold">
                {t("Overall Kickstart Progress") || "Overall Kickstart Progress"}
              </h6>
              <div className="text-muted small">
                {t("Track your tactical actions moving into execution phase")}
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                  {t("Tasks Kickstarted") || "Tasks Kickstarted"}
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '1rem', lineHeight: '1.2' }}>
                  {kickstartedActions} <span className="text-muted fw-normal" style={{ fontSize: '0.8rem' }}>/ {totalActions}</span>
                </div>
              </div>
              <div style={{ width: '48px', height: '48px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.5"
                  />
                  <path
                    strokeDasharray={`${globalProgressPercent}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={globalProgressPercent === 100 ? "#10b981" : "#6366f1"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease 0s' }}
                  />
                  <text x="18" y="21" fill="#333" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {globalProgressPercent}%
                  </text>
                </svg>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {isAdmin && (
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
        title={t("no_access_modal_title")}
        message={t("no_access_modal_msg")}
        subMessage={t(isAdmin ? "no_access_modal_sub_admin" : "no_access_modal_sub_user")}
        plan={usage?.plan}
        limit={usage?.project?.limit}
        isAdmin={isAdmin}
      />

      {priorities.map((item, idx) => {
        const isExpanded = expandedId === idx;
        const actions = item.actions || [];

        // Calculate granular progress
        const totalActions = actions.length;
        const kickstartedActions = actions.filter(a => a.isKickstarted || a.status === 'kickstarted').length;
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
                    {isAdmin && (
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
                    const isActionKickstarted = action.isKickstarted || action.status === 'kickstarted';
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
            {lastKickstartedCount} {t("new draft projects have been created in your Bets tab. You can now define their scope, metrics, and start execution.")}
          </p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={handleConfirmRedirect} className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold">
              {t("Go to Bets")} <ArrowRight size={18} />
            </Button>
            <Button variant="link" onClick={() => {
              setShowSuccessModal(false);
              if (onStayOnPriorities) {
                onStayOnPriorities();
              }
            }} className="text-muted text-decoration-none">
              {t("Stay on Priorities")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showNoCollaboratorsModal}
        onHide={() => { if (!kickstarting) setShowNoCollaboratorsModal(false); }}
        backdrop={kickstarting ? "static" : true}
        keyboard={!kickstarting}
        centered
        className="kickstart-confirm-modal"
      >
        <Modal.Body className="text-center p-4">
          <div className="warning-icon-wrapper mb-3">
            <AlertTriangle size={48} className="text-warning" />
          </div>
          <h4 className="fw-bold mb-2">{t("Kickstart Projects?")}</h4>
          <div className="text-muted mb-4">
            <p>
              {t("Are you sure you want to kickstart the selected priorities and create new bets? This will trigger AI generation for project details.")}
            </p>
            {isAdmin && !hasCollaborators && !anyProjectKickstarted && projects.length === 0 && (
              <p className="mb-0 small text-info">
                {t("Note: You are proceeding without collaborators. You can also continue without any participants for now—this is perfectly fine, and you can always add them later.")}
              </p>
            )}
          </div>
          <div className="d-grid gap-2">
            <Button
              variant="success"
              onClick={confirmKickstart}
              disabled={kickstarting}
              className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
            >
              {kickstarting ? <Spinner size="sm" /> : null}
              {kickstarting ? t("Kickstarting...") : t("Kickstart to Bets")}
            </Button>
            {!kickstarting && (
              <>
                {isAdmin && !hasCollaborators && !anyProjectKickstarted && projects.length === 0 && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/admin?tab=user_management')}
                    className="py-2"
                  >
                    {t("Add Collaborators First")}
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNoCollaboratorsModal(false)}
                  className="py-2"
                >
                  {t("Cancel")}
                </Button>
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PrioritiesProjects;
