import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Button, Form, Badge, Spinner, Modal, ProgressBar } from "react-bootstrap";
import { ChevronRight, ArrowRight, Zap } from "lucide-react";
import { Folder, CheckCircle, Rocket, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useAnalysisStore, useProjectStore, useBusinessStore } from "../store";
import { useTranslation } from "../hooks/useTranslation";
import { usePlanDetails } from "../hooks/useQueries";
import PlanLimitModal from "./PlanLimitModal";
import "../styles/PrioritiesProjects.css";
const PrioritiesProjects = ({
  selectedBusinessId,
  onSuccess,
  onStayOnPriorities,
  onToastMessage,
  onStartOnboarding,
  refreshTrigger
}) => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const userRole = useAuthStore(state => state.userRole);
  const userLimits = useAuthStore(state => state.userLimits);
  const isAdmin = useAuthStore(state => state.isAdmin);
  const isViewer = userRole?.toLowerCase() === "viewer";
  const hasProjectsAccess = userLimits?.project === true;
  const kickstartData = useAnalysisStore(state => state.kickstartData);
  const fetchKickstartData = useAnalysisStore(state => state.fetchKickstartData);
  const kickstartProject = useAnalysisStore(state => state.kickstartProject);
  const updatePriorityName = useAnalysisStore(state => state.updatePriorityName);
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
  const businesses = useBusinessStore(state => state.businesses);
  const fetchBusinesses = useBusinessStore(state => state.fetchBusinesses);
  const currentBusiness = useMemo(() => businesses.find(b => b._id === selectedBusinessId), [businesses, selectedBusinessId]);
  const {
    data: usageData
  } = usePlanDetails();
  const usage = usageData?.usage;
  const initialPriorities = useMemo(() => kickstartData?.priorities || [], [kickstartData]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    setPriorities(initialPriorities.map(p => ({ ...p })));
  }, [initialPriorities]);

  const handleTitleChange = useCallback((idx, newTitle) => {
    setPriorities(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], title: newTitle };
      return updated;
    });
  }, []);

  const handleTitleBlur = useCallback(async (idx, title) => {
    try {
      await updatePriorityName(selectedBusinessId, idx, title);
    } catch (err) {
      console.error("Failed to update title in DB", err);
    }
  }, [selectedBusinessId, updatePriorityName]);
  const hasCollaborators = kickstartData?.hasCollaborators ?? true;
  const {
    totalActions,
    kickstartedActions,
    globalProgressPercent
  } = useMemo(() => {
    let total = 0;
    let kickstarted = 0;
    priorities.forEach(priority => {
      const actions = priority.actions || [];
      total += actions.length;
      kickstarted += actions.filter(a => a.isKickstarted || a.status === 'kickstarted').length;
    });
    const percent = total > 0 ? Math.round(kickstarted / total * 100) : 0;
    return {
      totalActions: total,
      kickstartedActions: kickstarted,
      globalProgressPercent: percent
    };
  }, [priorities]);
  const anyProjectKickstarted = useMemo(() => {
    return currentBusiness?.is_bets_built || kickstartData?.is_bets_built || priorities.some(p => p.isKickstarted || p.actions && p.actions.some(a => a.isKickstarted));
  }, [priorities, currentBusiness, kickstartData]);
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusinessId) return;
      setLoading(true);
      try {
        await fetchKickstartData(selectedBusinessId, refreshTrigger > 0);
      } catch (error) {
        console.error("Error fetching kickstart data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBusinessId, refreshTrigger, fetchKickstartData]);
  const toggleExpand = useCallback(idx => {
    setExpandedId(prev => prev === idx ? null : idx);
  }, []);
  const toggleSelection = useCallback(idx => {
    setSelected(prev => prev.includes(idx) ? prev.filter(item => item !== idx) : [...prev, idx]);
  }, []);
  const confirmKickstart = useCallback(async () => {
    try {
      setKickstarting(true);
      const selectedPriorities = selected.map(idx => priorities[idx]);
      let totalProjectsCreated = 0;
      const response = await kickstartProject({
        businessId: selectedBusinessId,
        priorities: selectedPriorities
      });
      if (response && response.projectIds) {
        totalProjectsCreated = response.projectIds.length;
      }
      await fetchKickstartData(selectedBusinessId, true);
      await fetchBusinesses();
      setPriorities(prev => prev.map((p, i) => selected.includes(i) ? { ...p, isKickstarted: true } : p));
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
    const allIndexes = priorities.map((_, idx) => idx);
    setSelected(allIndexes);
    setShowNoCollaboratorsModal(true);
  }, [priorities, hasProjectsAccess]);

  const handleConfirmRedirect = useCallback(() => {
    setShowSuccessModal(false);
    clearProjectCache(selectedBusinessId);
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
        <div className="container priorities-projects--s1">
          <h3 className="fw-bold mb-3">{t("noInsightsAvailable") || "No results available yet."}</h3>
          <p className="text-muted mb-4">{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see results here."}</p>
          {onStartOnboarding && !isViewer && (
            <button className="btn btn-primary rounded-pill px-5 py-2 fw-semibold" onClick={onStartOnboarding}>
              {t("startPMFOnboarding") || "Start PMF Onboarding"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-3" style={{ margin: '0 auto' }}>
      
      {/* Header Section */}
      <div className="mb-4 text-left">
        <div className="d-flex align-items-left justify-content-left gap-2 mb-2" style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1.5px', color: '#0ea5e9' }}>
          <Zap size={14} fill="#0ea5e9" stroke="none" />
          <span>COMMIT - THE PROMOTION MOMENT</span>
        </div>
        <h1 className="fw-bold mb-3" style={{ color: '#0f172a', fontSize: '2rem' }}>
          Build your <span style={{ color: '#0ea5e9' }}>Bets</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {(() => {
            const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
            const countWord = numberWords[priorities.length] || priorities.length;
            return (
              <>
                These are the <span>{countWord}</span> things you're choosing to bet on this period. Edit anything that doesn't read right — once you lock them in, they become Bets you'll execute and review. The commitment is what matters.
              </>
            );
          })()}
        </p>
      </div>

      {/* Info Alert */}
      {!anyProjectKickstarted && (
        <div className="d-flex align-items-center p-3 mb-4 rounded" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3" style={{ width: '32px', height: '32px', backgroundColor: '#3b82f6', flexShrink: 0, fontSize: '10px' }}>
            TX
          </div>
          <p className="mb-0" style={{ fontSize: '0.9rem', color: '#334155' }}>
            <strong style={{ color: '#0369a1' }}>One last edit, then they're yours.</strong> Anything you change here also updates the Top 5 in Insights Basic — this is your final draft of the diagnosis. After lock-in, bets evolve on their own.
          </p>
        </div>
      )}

      {/* Priority Cards */}
      <div className="d-flex flex-column gap-3 mb-4">
        {priorities.map((item, idx) => (
          <Card key={idx} className="border shadow-sm rounded-3" style={{ borderColor: '#e2e8f0' }}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="d-flex align-items-center justify-content-center rounded me-4" style={{ width: '40px', height: '40px', backgroundColor: '#f0f9ff', color: '#0284c7', fontWeight: '600', fontSize: '0.9rem', flexShrink: 0 }}>
                #{idx + 1}
              </div>
              <div className="w-100">
                <div className="text-uppercase mb-1" style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px', color: '#94a3b8' }}>
                  PRIORITY {idx + 1} <span className="mx-1">→</span> BECOMES BET #{idx + 1}
                </div>
                <input 
                  type="text"
                  className="fw-bold w-100 priority-edit-input"
                  value={item.title}
                  onChange={(e) => handleTitleChange(idx, e.target.value)}
                  onBlur={(e) => handleTitleBlur(idx, e.target.value)}
                  placeholder="Enter your bet name..."
                  readOnly={anyProjectKickstarted}
                />
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Build Bets Button */}
      <div className="d-flex justify-content-end">
        {anyProjectKickstarted ? (
          <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2 px-4 py-2 fw-semibold rounded-3" 
            style={{ backgroundColor: '#0284c7', border: 'none' }}
            onClick={() => navigate(`/businesspage?business=${selectedBusinessId}&tab=bets`)}
          >
            {t("Go to bets")} <ArrowRight size={16} />
          </Button>
        ) : (
          <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2 px-4 py-2 fw-semibold rounded-3" 
            style={{ backgroundColor: '#0284c7', border: 'none' }}
            onClick={handleKickstart}
            disabled={kickstarting}
          >
            {kickstarting ? <Spinner size="sm" /> : null}
            {kickstarting ? t("Building...") : t("Build bets")} <ArrowRight size={16} />
          </Button>
        )}
      </div>

      <PlanLimitModal show={showPlanLimitModal} onHide={() => setShowPlanLimitModal(false)} title={t("no_access_modal_title")} message={t("no_access_modal_msg")} subMessage={t(isAdmin ? "no_access_modal_sub_admin" : "no_access_modal_sub_user")} plan={usage?.plan} limit={usage?.project?.limit} isAdmin={isAdmin} />

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered className="kickstart-success-modal">
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

      <Modal show={showNoCollaboratorsModal} onHide={() => {
        if (!kickstarting) setShowNoCollaboratorsModal(false);
      }} backdrop={kickstarting ? "static" : true} keyboard={!kickstarting} centered className="kickstart-confirm-modal">
        <Modal.Body className="text-center p-4">
          <div className="warning-icon-wrapper mb-3">
            <AlertTriangle size={48} className="text-warning" />
          </div>
          <h4 className="fw-bold mb-2">{t("Build Bets?")}</h4>
          <div className="text-muted mb-4">
            <p className="mb-0">
              {t("This will create bets and the business will move to the execution phase. Is it ok to proceed?")}
            </p>
          </div>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="outline-secondary" onClick={() => setShowNoCollaboratorsModal(false)} disabled={kickstarting} className="w-50 py-2 fw-semibold">
              {t("No")}
            </Button>
            <Button variant="success" onClick={confirmKickstart} disabled={kickstarting} className="w-50 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold" style={{ backgroundColor: '#0284c7', border: 'none' }}>
              {kickstarting ? <Spinner size="sm" /> : null}
              {kickstarting ? t("Building...") : t("Yes")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};
export default PrioritiesProjects;
