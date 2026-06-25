import React from 'react';
import { ArrowLeft, ChevronDown, LayoutDashboard, HelpCircle, TrendingUp, Target, ListTodo, Briefcase, BarChart4, FileText, Loader, RefreshCw } from "lucide-react";
import CustomTooltip from "../CustomTooltip";
import PDFExportButton from "../PDFExportButton";
import { useProjectStore } from "../../store";
import { useBusinessSetupContext } from "../../context/BusinessSetupContext";

const DesktopHeader = () => {
  const {
    handleBack,
    selectedBusinessName,
    activeNavDropdown,
    setActiveNavDropdown,
    activeTab,
    t,
    hasPmfAccess,
    hasInsightAccess,
    hasStrategicAccess,
    showProjectsTab,
    hasProjectAccess,
    handleExecutiveTabClick,
    handleBriefTabClick,
    setActiveTab,
    handlePrioritiesTabClick,
    dropdownRef,
    setShowDropdown,
    showDropdown,
    selectedDropdownValue,
    getPhaseSpecificOptions,
    currentPhase,
    handleOptionClick,
    businessData,
    showToastMessage,
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
    navDropdownRef,
    selectedBusinessId
  } = useBusinessSetupContext();

  const canRegenerate = canShowRegenerateButtons;

  return (
    <div className="desktop-tabs" ref={navDropdownRef}>
      <div className="desktop-tabs-main">
        <div className="business-header-container">
          <button className="back-button" onClick={handleBack} aria-label="Go Back">
            <ArrowLeft size={18} />
            <span className="breadcrumb-back">{t("backToDashboard_B3") || "Back to Dashboard"}</span>
          </button>
          {selectedBusinessName && (
            <div className="business-breadcrumb">
              <span className="breadcrumb-separator">/</span>
              <span className="business-header-name">{selectedBusinessName}</span>
            </div>
          )}
        </div>

        <div className="desktop-nav-main">
          {}
          <div className={`nav-dropdown-wrapper ${activeNavDropdown === 'insights' ? 'open' : ''}`}>
            <button
              className={`nav-dropdown-trigger ${['executive', 'advanced', 'insights', 'strategic'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setActiveNavDropdown(activeNavDropdown === 'insights' ? null : 'insights')}
            >
              {(() => {
                if (activeTab === "executive") return t("Executive Summary");
                if (activeTab === "advanced") return t("Answers/Brief");
                if (activeTab === "insights") return t("Insights");
                if (activeTab === "strategic") return <span className="notranslate">S.T.R.A.T.E.G.I.C.</span>;
                return t("Insights & Recommendations");
              })()}
              <ChevronDown size={14} className={`chevron-icon ${activeNavDropdown === 'insights' ? 'rotated' : ''}`} />
            </button>
            {activeNavDropdown === 'insights' && (
              <div className={`nav-dropdown-menu ${!(hasPmfAccess || hasProjectAccess) ? 'align-right' : ''}`}>
                <div className="dropdown-main-header">{t("Insights & Recommendations")}</div>
                {hasPmfAccess && (
                  <>
                    <div className="dropdown-section-label">{t("Basic")}</div>
                    <button
                      className={`dropdown-item ${activeTab === 'executive' ? 'active' : ''}`}
                      onClick={() => { handleExecutiveTabClick(); setActiveNavDropdown(null); }}
                    >
                      <LayoutDashboard size={14} />
                      <span>{t("Executive Summary")}</span>
                    </button>
                  </>
                )}

                {(hasInsightAccess || hasStrategicAccess) && (
                  <>
                    <div className="dropdown-section-label mt-2">{t("Advanced")}</div>
                    <button
                      className={`dropdown-item ${activeTab === 'advanced' ? 'active' : ''}`}
                      onClick={() => { handleBriefTabClick(); setActiveNavDropdown(null); }}
                    >
                      <HelpCircle size={14} />
                      <span>{t("Answers/Brief")}</span>
                    </button>
                  </>
                )}
                {hasInsightAccess && (
                  <button
                    className={`dropdown-item ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('insights'); setActiveNavDropdown(null); }}
                  >
                    <TrendingUp size={14} />
                    <span>{t("Insights")}</span>
                  </button>
                )}
                {hasStrategicAccess && (
                  <button
                    className={`dropdown-item ${activeTab === 'strategic' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('strategic'); setActiveNavDropdown(null); }}
                  >
                    <Target size={14} />
                    <span className="notranslate">S.T.R.A.T.E.G.I.C.</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {}
          {(hasPmfAccess || (hasProjectAccess && showProjectsTab)) && (
            <div className={`nav-dropdown-wrapper ${activeNavDropdown === 'execution' ? 'open' : ''}`}>
              <button
                className={`nav-dropdown-trigger ${['priorities', 'bets', 'ranking', 'decision-logs'].includes(activeTab) ? 'active' : ''}`}
                onClick={() => setActiveNavDropdown(activeNavDropdown === 'execution' ? null : 'execution')}
              >
                {(() => {
                  if (activeTab === "priorities") return t("Priorities");
                  if (activeTab === "ranking") return t("Ranking");
                  if (activeTab === "bets" || activeTab === "projects") return t("Bets");
                  if (activeTab === "decision-logs") return t("Decision_Logs") || "Decision Logs";
                  return t("Projects");
                })()}
                <ChevronDown size={14} className={`chevron-icon ${activeNavDropdown === 'execution' ? 'rotated' : ''}`} />
              </button>
              {activeNavDropdown === 'execution' && (
                <div className="nav-dropdown-menu align-right">
                  <div className="dropdown-main-header">{t("Projects")}</div>
                  {hasPmfAccess && (
                    <button
                      className={`dropdown-item ${activeTab === 'priorities' ? 'active' : ''}`}
                      onClick={() => { handlePrioritiesTabClick(); setActiveNavDropdown(null); }}
                    >
                      <ListTodo size={14} />
                      <span>{t("Priorities")}</span>
                    </button>
                  )}
                  {hasProjectAccess && showProjectsTab && (
                    <>
                      <div className="dropdown-section-label">{t("Projects")}</div>
                      <button
                        className={`dropdown-item ${activeTab === 'bets' ? 'active' : ''}`}
                        onClick={() => {
                          useProjectStore.getState().setViewMode('projects');
                          setActiveTab('bets');
                          setActiveNavDropdown(null);
                        }}
                      >
                        <Briefcase size={14} />
                        <span>{t("Bets")}</span>
                      </button>

                      <button
                        className={`dropdown-item ${activeTab === 'ranking' ? 'active' : ''}`}
                        onClick={() => {
                          useProjectStore.getState().setViewMode('ranking');
                          useProjectStore.getState().clearCache(selectedBusinessId);
                          if (activeTab === 'ranking') {
                            useProjectStore.getState().checkAllAccess(selectedBusinessId);
                            useProjectStore.getState().fetchTeamRankings(selectedBusinessId);
                          } else {
                            setActiveTab('ranking');
                          }
                          setActiveNavDropdown(null);
                        }}
                      >
                        <BarChart4 size={14} />
                        <span>{t("Ranking")}</span>
                      </button>

                      <button
                        className={`dropdown-item ${activeTab === 'decision-logs' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab('decision-logs');
                          setActiveNavDropdown(null);
                        }}
                      >
                        <FileText size={14} />
                        <span>{t("Decision_Logs") || "Decision Logs"}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="desktop-tabs-buttons">
        {activeTab === "insights" && (
          <>
            <div ref={dropdownRef} className="dropdown-wrapper">
              <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                <span>{selectedDropdownValue}</span>
                <ChevronDown size={16} className={`chevron ${showDropdown ? 'open' : ''}`} />
              </button>
              {showDropdown && (() => {
                const categoryOptions = getPhaseSpecificOptions(currentPhase);
                return Object.keys(categoryOptions).length > 0 && (
                  <div className="dropdown-menu-options">
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
              <CustomTooltip align="right" message={<>Re-generate the <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> analysis.</>}>
                <button
                  onClick={() => canRegenerate && handleStrategicAnalysisRegenerate()}
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


      </div>
    </div>
  );
};

export default DesktopHeader;
