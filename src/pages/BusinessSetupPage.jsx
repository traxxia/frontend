import React from "react";
import {
  AlertTriangle,
  LayoutDashboard,
  HelpCircle,
  TrendingUp,
  Target,
  ListTodo,
  Briefcase,
  FileText
} from "lucide-react";
import { BusinessSetupProvider, useBusinessSetupContext } from "../context/BusinessSetupContext";
import { useAuthStore } from "../store";

import MenuBar from "../components/MenuBar";
import PhaseUnlockToast from "../components/PhaseUnlockToast";
import MobileHeader from "../components/BusinessSetup/MobileHeader";
import DesktopHeader from "../components/BusinessSetup/DesktopHeader";
import TabRenderer from "../components/BusinessSetup/TabRenderer";
import UpgradeModal from "../components/UpgradeModal";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import ConfirmationModal from '../components/ConfirmationModal';
import PlanLimitModal from "../components/PlanLimitModal";

import "../styles/businesspage.css";
import "../styles/business.css";

const BusinessSetupContent = () => {
  const {
    t,
    activeTab,
    setActiveTab,
    isMobile,
    isAnalysisExpanded,
    setIsAnalysisExpanded,
    currentBusiness,
    selectedBusinessId,
    showConfirmModal,
    setShowConfirmModal,
    confirmConfig,
    showToast,
    showToastMessage,
    isModalOpen,
    closeModal,
    hasPmfAccess,
    hasInsightAccess,
    hasStrategicAccess,
    hasProjectAccess,
    showProjectsTab,
    isArchived,
    phaseManager,
    accessModalMessage,
    accessModalSubMessage,
    handleExecutiveTabClick,
    handlePrioritiesTabClick,
    handleBriefTabClick,
    handleAnalysisTabClick,
    handleStrategicTabClick,
    setPmfRefreshTrigger
  } = useBusinessSetupContext();

  const userRole = useAuthStore(state => state.userRole);

  return (
    <div className={`business-setup-container ${isArchived ? 'is-archived' : ''}`}>
      <MenuBar />

      {(currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden') && (
        <div className="alert alert-warning mb-0 border-0 rounded-0 text-center py-2 d-flex align-items-center justify-content-center shadow-sm" style={{ zIndex: 1000, position: 'relative' }}>
          <AlertTriangle size={18} className="me-2 text-warning" />
          <span>
            This workspace has been moved to an <strong>Archived</strong> state and is currently view-only.
            Please upgrade your plan to reactivate this workspace.
          </span>
        </div>
      )}

      <PhaseUnlockToast
        phase={phaseManager.unlockedPhase}
        show={phaseManager.showUnlockToast}
        onClose={() => phaseManager.setShowUnlockToast(false)}
        autoCloseMs={2500}
      />

      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {isMobile && <MobileHeader />}

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>
        <div className={`info-panel ${isMobile ? (['advanced', 'insights', 'strategic', 'bets', 'ranking', 'priorities', 'aha', 'executive'].includes(activeTab) ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
          {!isMobile && isAnalysisExpanded && (
            <div className="desktop-expanded-analysis">
              <div className="expanded-analysis-view">
                <DesktopHeader />
                {isArchived && <div className="archived-overlay" />}
                <div className="expanded-analysis-content">
                  <TabRenderer />
                </div>
              </div>
            </div>
          )}

          {!isMobile && !isAnalysisExpanded && (
            <>
              <div className="desktop-tabs">
                <div className="desktop-tabs-controls">
                  <div className="nav-group-minimal">
                    {hasPmfAccess && (
                      <button className={`desktop-tab ${activeTab === "executive" ? "active" : ""}`} onClick={handleExecutiveTabClick}>
                        <LayoutDashboard size={16} />
                        <span>{t("Executive Summary")}</span>
                      </button>
                    )}
                    {(hasInsightAccess || hasStrategicAccess) && (
                      <button className={`desktop-tab ${activeTab === "advanced" ? "active" : ""}`} onClick={handleBriefTabClick}>
                        <HelpCircle size={16} />
                        <span>{t("Answers/Brief")}</span>
                      </button>
                    )}
                    {hasInsightAccess && (
                      <button className={`desktop-tab ${activeTab === "insights" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
                        <TrendingUp size={16} />
                        <span>{t("Insights")}</span>
                      </button>
                    )}
                    {hasStrategicAccess && (
                      <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
                        <Target size={16} />
                        <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
                      </button>
                    )}
                    {hasPmfAccess && (
                      <button className={`desktop-tab ${activeTab === "priorities" ? "active" : ""}`} onClick={handlePrioritiesTabClick}>
                        <ListTodo size={16} />
                        <span>{t("Priorities")}</span>
                      </button>
                    )}
                    {hasProjectAccess && (
                      <button className={`desktop-tab ${activeTab === "bets" ? "active" : ""}`} onClick={() => setActiveTab("bets")}>
                        <Briefcase size={16} />
                        <span>{t("Bets")}</span>
                      </button>
                    )}
                    {hasProjectAccess && (
                      <button className={`desktop-tab ${activeTab === "decision-logs" ? "active" : ""}`} onClick={() => setActiveTab("decision-logs")}>
                        <FileText size={16} />
                        <span>{t("Decision_Logs") || "Decision Logs"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="info-panel-content">
                <TabRenderer />
              </div>
            </>
          )}

          {isMobile && (
            <div className="info-panel-content">
              <TabRenderer />
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        show={isModalOpen('upgrade')}
        onHide={() => closeModal('upgrade')}
        onUpgradeSuccess={() => window.location.reload()}
      />

      {hasPmfAccess && (
        <PMFOnboardingModal
          show={isModalOpen('pmfOnboarding')}
          onHide={() => closeModal('pmfOnboarding')}
          businessId={selectedBusinessId}
          onToastMessage={showToastMessage}
          onSubmit={() => {
            closeModal('pmfOnboarding');
            setActiveTab("executive");
            setPmfRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmVariant="primary"
      />

      <PlanLimitModal
        show={isModalOpen('noFeatureAccess')}
        onHide={() => closeModal('noFeatureAccess')}
        title={t('no_access_modal_title')}
        message={accessModalMessage}
        subMessage={accessModalSubMessage}
        isAdmin={['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase())}
      />
    </div>
  );
};

const BusinessSetupPage = () => {
    return (
        <BusinessSetupProvider>
            <BusinessSetupContent />
        </BusinessSetupProvider>
    );
};

export default BusinessSetupPage;
