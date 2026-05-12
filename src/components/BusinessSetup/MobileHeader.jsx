import React from 'react';
import { ArrowLeft, Menu, X, ChevronDown, Loader, RefreshCw, LayoutDashboard, HelpCircle, TrendingUp, Target, ListTodo, Briefcase, BarChart4, FileText } from "lucide-react";
import CustomTooltip from "../CustomTooltip";
import PDFExportButton from "../PDFExportButton";
import { useProjectStore } from "../../store";
import { useBusinessSetupContext } from "../../context/BusinessSetupContext";

const MobileHeader = () => {
  const {
    handleBack,
    selectedBusinessName,
    isModalOpen,
    closeModal,
    openModal,
    activeTab,
    t,
    hasInsightAccess,
    hasStrategicAccess,
    hasPmfAccess,
    hasProjectAccess,
    showProjectsTab,
    setActiveTab,
    dropdownRef,
    setShowDropdown,
    showDropdown,
    selectedDropdownValue,
    getPhaseSpecificOptions,
    currentPhase,
    handleOptionClick,
    showToastMessage,
    businessData,
    isAnalysisRegenerating,
    unlockedFeatures,
    fullSwotData,
    competitiveAdvantageData,
    expandedCapabilityData,
    strategicRadarData,
    productivityData,
    maturityData,
    profitabilityData,
    growthTrackerData,
    liquidityEfficiencyData,
    investmentPerformanceData,
    leverageRiskData,
    canShowRegenerateButtons,
    handleRegenerateAllAnalysis,
    hasUploadedDocument,
    isStrategicRegenerating,
    strategicData,
    handleStrategicAnalysisRegenerate,
    handleExecutiveTabClick,
    handleBriefTabClick,
    handleAnalysisTabClick,
    handleStrategicTabClick,
    triggerConfirmation
  } = useBusinessSetupContext();

  const canRegenerate = canShowRegenerateButtons;

  return (
    <>
      <div className="mobile-header">
        <div className="mobile-header-top">
          <button
            className="mobile-back-button"
            onClick={handleBack}
            aria-label="Go Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="mobile-business-name">
            {selectedBusinessName}
          </div>

          <button
            className="mobile-menu-trigger"
            onClick={() => isModalOpen('mobileMenu') ? closeModal('mobileMenu') : openModal('mobileMenu')}
            aria-label="Toggle Menu"
          >
            {isModalOpen('mobileMenu') ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="mobile-active-tab">
          {(['executive', 'advanced', 'insights', 'strategic', 'priorities', 'bets', 'ranking', 'decision-logs'].includes(activeTab)) ? (
            <div className="mobile-tab-selector">
              <div className="mobile-tab-trigger no-dropdown">
                <span>
                  {activeTab === "executive" && t("Executive Summary")}
                  {activeTab === "priorities" && t("Priorities")}
                  {activeTab === "advanced" && (hasInsightAccess || hasStrategicAccess) && t("Answers/Brief")}
                  {activeTab === "insights" && (hasPmfAccess ? t("insights") : "Insights")}
                  {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
                  {(activeTab === "bets" || activeTab === "ranking") && t("Bets")}
                  {activeTab === "decision-logs" && (t("Decision_Logs") || "Decision Logs")}
                </span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "aha" && t("aha")}
              {activeTab === "executive" && t("Executive Summary")}
              {activeTab === "priorities" && t("Priorities & Projects")}
              {activeTab === "advanced" && (hasInsightAccess || hasStrategicAccess) && t("Questions and Answers")}
              {activeTab === "insights" && (hasPmfAccess ? t("Insights") : "Insights")}
              {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
              {(activeTab === "bets" || activeTab === "ranking") && t("Bets")}
              {activeTab === "decision-logs" && (t("Decision_Logs") || "Decision Logs")}
            </>
          )}
        </div>

        <div className="mobile-action-bar">
          {activeTab === "insights" && (
            <>
              <div ref={dropdownRef} className="dropdown-wrapper">
                <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                  <span>{selectedDropdownValue}</span>
                  <ChevronDown size={14} className={`chevron ${showDropdown ? 'open' : ''}`} />
                </button>
                {showDropdown && (() => {
                  const categoryOptions = getPhaseSpecificOptions(currentPhase);
                  return Object.keys(categoryOptions).length > 0 && (
                    <div className="dropdown-menu-options">
                      <div className="dropdown-main-header">{t("Insights & Recommendations")}</div>
                      {Object.entries(categoryOptions).map(([category, items]) =>
                        items.length > 0 && (
                          <div key={category}>
                            <div className="dropdown-category-header">{t(category)}</div>
                            {items.map((item) => (
                              <div key={item} onClick={() => {
                                handleOptionClick(item);
                              }} className="dropdown-option dropdown-sub-option">
                                <span className="bullet"></span>
                                {t(item)}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  );
                })()}
              </div>

              <CustomTooltip align="right" message={t("download_insights_tooltip") || "Export the insights into PDF report."}>
                <PDFExportButton
                  className="pdf-export-button"
                  businessName={businessData.name}
                  onToastMessage={showToastMessage}
                  currentPhase={currentPhase}
                  disabled={isAnalysisRegenerating}
                  unlockedFeatures={unlockedFeatures}
                  fullSwotData={fullSwotData}
                  competitiveAdvantageData={competitiveAdvantageData}
                  expandedCapabilityData={expandedCapabilityData}
                  strategicRadarData={strategicRadarData}
                  productivityData={productivityData}
                  maturityData={maturityData}
                  profitabilityData={profitabilityData}
                  growthTrackerData={growthTrackerData}
                  liquidityEfficiencyData={liquidityEfficiencyData}
                  investmentPerformanceData={investmentPerformanceData}
                  leverageRiskData={leverageRiskData}
                />
              </CustomTooltip>

              {canShowRegenerateButtons && unlockedFeatures.analysis && hasInsightAccess && (
                <CustomTooltip align="right" message={t("regenerate_all_tooltip") || "Re-generate all insights."}>
                  <button
                    onClick={() => canRegenerate && handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument })}
                    disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate || !hasInsightAccess}
                    className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
                  >
                    {isAnalysisRegenerating ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                </CustomTooltip>
              )}
            </>
          )}

          {activeTab === "strategic" && (
            <>
              {unlockedFeatures.analysis && (
                <CustomTooltip align="right" message={t("download_strategic_tooltip") || "Export the strategic into PDF report."}>
                  <PDFExportButton
                    className="pdf-export-button"
                    businessName={businessData.name}
                    onToastMessage={showToastMessage}
                    disabled={isAnalysisRegenerating || isStrategicRegenerating}
                    exportType="strategic"
                    strategicData={strategicData}
                  />
                </CustomTooltip>
              )}
              {unlockedFeatures.analysis && hasStrategicAccess && (
                <CustomTooltip align="right" message={t("regenerate_strategic_tooltip") || "Re-generate the S.T.R.A.T.E.G.I.C. analysis."}>
                  <button
                    onClick={() => {
                      if (!canRegenerate) return;
                      triggerConfirmation(
                        t("confirm_regeneration_title", { section: 'S.T.R.A.T.E.G.I.C.' }),
                        t("confirm_regeneration_message", { section: 'S.T.R.A.T.E.G.I.C.' }),
                        () => handleStrategicAnalysisRegenerate()
                      );
                    }}
                    disabled={isStrategicRegenerating || isAnalysisRegenerating || !canRegenerate || !unlockedFeatures.analysis || !hasStrategicAccess}
                    className={`regenerate-button ${isStrategicRegenerating || isAnalysisRegenerating || !unlockedFeatures.analysis ? 'disabled' : ''}`}
                  >
                    {isStrategicRegenerating ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                </CustomTooltip>
              )}
            </>
          )}

          {activeTab === "executive" && (
            <CustomTooltip align="right" message={t("download_executive_tooltip") || "Export the executive summary into PDF report."}>
              <PDFExportButton
                className="pdf-export-button"
                businessName={businessData.name}
                onToastMessage={showToastMessage}
                exportType="executive"
              />
            </CustomTooltip>
          )}
        </div>
      </div>

      {isModalOpen('mobileMenu') && (
        <div className="mobile-menu-overlay" onClick={() => closeModal('mobileMenu')}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h5>{t("Navigation")}</h5>
              <button className="close-menu" onClick={() => closeModal('mobileMenu')}>
                <X size={24} />
              </button>
            </div>
            <div className="mobile-nav-groups">
              <div className="mobile-nav-group">
                <div className="mobile-nav-group-header">{t("Insights & Recommendations")}</div>

                <div className="mobile-nav-sub-group">
                  <div className="mobile-nav-sub-group-header">{t("Basic")}</div>
                  {hasPmfAccess && (
                    <button
                      className={`mobile-menu-item ${activeTab === "executive" ? "active" : ""}`}
                      onClick={() => { handleExecutiveTabClick(); closeModal('mobileMenu'); }}
                    >
                      <LayoutDashboard size={18} />
                      <span>{t("Executive Summary")}</span>
                    </button>
                  )}
                </div>

                <div className="mobile-nav-sub-group mt-3">
                  {(hasInsightAccess || hasStrategicAccess) && (
                    <>
                      <div className="mobile-nav-sub-group-header">{t("Advanced")}</div>
                      <button
                        className={`mobile-menu-item ${activeTab === "advanced" ? "active" : ""}`}
                        onClick={() => { handleBriefTabClick(); closeModal('mobileMenu'); }}
                      >
                        <HelpCircle size={18} />
                        <span>{t("Answers/Brief")}</span>
                      </button>
                    </>
                  )}
                  {hasInsightAccess && (
                    <button
                      className={`mobile-menu-item ${activeTab === "insights" ? "active" : ""}`}
                      onClick={() => { handleAnalysisTabClick(); closeModal('mobileMenu'); }}
                    >
                      <TrendingUp size={18} />
                      <span>{t("Insights")}</span>
                    </button>
                  )}
                  {hasStrategicAccess && (
                    <button
                      className={`mobile-menu-item ${activeTab === "strategic" ? "active" : ""}`}
                      onClick={() => { handleStrategicTabClick(); closeModal('mobileMenu'); }}
                    >
                      <Target size={18} />
                      <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mobile-nav-group mt-4">
                <div className="mobile-nav-group-header">{t("Projects")}</div>
                {hasPmfAccess && (
                  <button
                    className={`mobile-menu-item ${activeTab === "priorities" ? "active" : ""}`}
                    onClick={() => { setActiveTab("priorities"); closeModal('mobileMenu'); }}
                  >
                    <ListTodo size={18} />
                    <span>{t("Priorities")}</span>
                  </button>
                )}
                {hasProjectAccess && (
                  <div className="mobile-nav-sub-group mt-3">
                    <div className="mobile-nav-sub-group-header">{t("Projects")}</div>
                    <button
                      className={`mobile-menu-item ${activeTab === 'bets' && useProjectStore.getState().viewMode === 'projects' ? 'active' : ''}`}
                      onClick={() => {
                        useProjectStore.getState().setViewMode('projects');
                        setActiveTab('bets');
                        closeModal('mobileMenu');
                      }}
                    >
                      <Briefcase size={18} />
                      <span>{t("Bets")}</span>
                    </button>

                    <button
                      className={`mobile-menu-item ${activeTab === 'ranking' ? 'active' : ''}`}
                      onClick={() => {
                        useProjectStore.getState().setViewMode('ranking');
                        useProjectStore.getState().clearCache(businessData.business_id);
                        setActiveTab('ranking');
                        closeModal('mobileMenu');
                      }}
                    >
                      <BarChart4 size={18} />
                      <span>{t("Ranking")}</span>
                    </button>

                    <button
                      className={`mobile-menu-item ${activeTab === 'decision-logs' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTab('decision-logs');
                        closeModal('mobileMenu');
                      }}
                    >
                      <FileText size={18} />
                      <span>{t("Decision_Logs") || "Decision Logs"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
