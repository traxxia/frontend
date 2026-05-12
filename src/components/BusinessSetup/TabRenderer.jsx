import React from 'react';
import { useBusinessSetupContext } from "../../context/BusinessSetupContext";
import PMFInsightsTab from "../PMFInsightsTab";
import ExecutiveSummary from "../ExecutiveSummary";
import EditableBriefSection from "../EditableBriefSection";
import AnalysisContentManager from "../AnalysisContentManager";
import StrategicAnalysis from "../StrategicAnalysis.jsx";
import ProjectsSection from "../ProjectsSection";
import RankingSection from "../RankingSection";
import BusinessDecisionLogs from "../BusinessDecisionLogs";
import PrioritiesProjects from "../PrioritiesProjects";

const TabRenderer = () => {
  const {
    activeTab,
    hasPmfAccess,
    pmfRefreshTrigger,
    openModal,
    selectedBusinessId,
    questions,
    userAnswers,
    businessData,
    questionsLoaded,
    handleBusinessDataUpdate,
    handleAnswerUpdate,
    handleRegenerateAllAnalysis,
    setUploadedFile,
    isAnalysisRegenerating,
    isStrategicRegenerating,
    isFinancialRegenerating,
    isEssentialPhaseGenerating,
    isTypeRegenerating,
    highlightedMissingQuestions,
    setHighlightedMissingQuestions,
    isLaunchedStatus,
    documentInfo,
    answerIds,
    setAnswerIds,
    hasInsightAccess,
    analysisProps,
    canShowRegenerateButtons,
    hasStrategicAccess,
    handleStrategicAnalysisRegenerate,
    phaseManager,
    apiService,
    handleRedirectToBrief,
    showProjectsTab,
    showToastMessage,
    hasProjectAccess,
    handleProjectCountChange,
    companyAdminIds,
    isArchived,
    setActiveTab,
    handleKickstartSuccess,
    handleStayOnPriorities,
    unlockedFeatures,
    completedQuestions,
    t,
    streamingManager,
    triggerConfirmation,
    strategicData,
    phaseAnalysisArray
  } = useBusinessSetupContext();

  return (
    <div className="tab-renderer-content">
      {hasPmfAccess && activeTab === "aha" && (
        <PMFInsightsTab
          refreshTrigger={pmfRefreshTrigger}
          onStartOnboarding={() => openModal('pmfOnboarding')}
        />
      )}
      {hasPmfAccess && activeTab === "executive" && (
        <ExecutiveSummary
          businessId={selectedBusinessId}
          onStartOnboarding={() => openModal('pmfOnboarding')}
          refreshTrigger={pmfRefreshTrigger}
        />
      )}
      {activeTab === "advanced" && (
        <div className="brief-section">
          {!unlockedFeatures.analysis && completedQuestions && completedQuestions.length > 0 && (
            <div className="unlock-hint">
              <h4>🔒 {t("unlockBusinessAnalysis")}</h4>
              <p>{t("completePhaseMessage")}</p>
            </div>
          )}
          <EditableBriefSection
            selectedBusinessId={selectedBusinessId}
            questions={questions}
            userAnswers={userAnswers}
            businessData={businessData}
            isLoading={!questionsLoaded}
            onBusinessDataUpdate={handleBusinessDataUpdate}
            onAnswerUpdate={async (questionId, newAnswer) => {
              handleAnswerUpdate(questionId, newAnswer);
              window.dispatchEvent(
                new CustomEvent("conversationUpdated", {
                  detail: { questionId, businessId: selectedBusinessId },
                })
              );
            }}
            onAnalysisRegenerate={handleRegenerateAllAnalysis}
            onUploadedFileUpdate={setUploadedFile}
            isAnalysisRegenerating={isAnalysisRegenerating}
            isStrategicRegenerating={isStrategicRegenerating}
            isFinancialRegeneratingProp={isFinancialRegenerating}
            isEssentialPhaseGenerating={isEssentialPhaseGenerating}
            highlightedMissingQuestions={highlightedMissingQuestions}
            onClearHighlight={() => setHighlightedMissingQuestions(null)}
            isLaunchedStatus={isLaunchedStatus}
            documentInfo={documentInfo}
            answerIds={answerIds}
            setAnswerIds={setAnswerIds}
            hasPmfAccess={hasPmfAccess}
          />
        </div>
      )}
      {activeTab === "insights" && (
        <div className="analysis-section">
          <AnalysisContentManager />
        </div>
      )}
      {activeTab === "strategic" && (
        <div className="strategic-section">
          <StrategicAnalysis
            onRegenerate={handleStrategicAnalysisRegenerate}
            isRegenerating={isStrategicRegenerating || isTypeRegenerating('strategic')}
            canRegenerate={canShowRegenerateButtons && !isAnalysisRegenerating && unlockedFeatures.analysis}
            selectedBusinessId={selectedBusinessId}
            phaseManager={phaseManager}
            saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
            hideDownload={false}
            onRedirectToBrief={handleRedirectToBrief}
            isExpanded={true}
            onKickstartProjects={() => setActiveTab("bets")}
            hasProjectsTab={showProjectsTab}
            onToastMessage={showToastMessage}
            hasStrategicAccess={hasStrategicAccess}
            isAnalysisRegenerating={isAnalysisRegenerating}
            isStrategicRegenerating={isStrategicRegenerating}
            questionsLoaded={questionsLoaded}
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            strategicData={strategicData}
            phaseAnalysisArray={phaseAnalysisArray}
            streamingManager={streamingManager}
            triggerConfirmation={triggerConfirmation}
          />
        </div>
      )}
      {(activeTab === "bets" || activeTab === "ranking" || activeTab === "decision-logs") && (hasProjectAccess || showProjectsTab) && (
        <>
          {activeTab === "bets" && (
            <ProjectsSection
              onProjectCountChange={handleProjectCountChange}
              companyAdminIds={companyAdminIds}
              isArchived={isArchived}
            />
          )}
          {activeTab === "ranking" && (
            <RankingSection
              isArchived={isArchived}
              companyAdminIds={companyAdminIds}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "decision-logs" && (
            <BusinessDecisionLogs businessId={selectedBusinessId} />
          )}
        </>
      )}
      {hasPmfAccess && activeTab === "priorities" && (
        <PrioritiesProjects
          selectedBusinessId={selectedBusinessId}
          companyAdminIds={companyAdminIds}
          onSuccess={handleKickstartSuccess}
          onStayOnPriorities={handleStayOnPriorities}
          onToastMessage={showToastMessage}
          onStartOnboarding={() => openModal('pmfOnboarding')}
          refreshTrigger={pmfRefreshTrigger}
        />
      )}
    </div>
  );
};

export default TabRenderer;
