import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import { getUserLimits } from '../utils/authUtils';
import { useAuthStore, useBusinessStore, useAnalysisStore } from '../store';
import { Loader, Target, Shield, Lock, AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { usePlanDetails } from "../hooks/useQueries";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import KickstartProjectsCard from "../components/KickstartProjectsCard";
import UpgradeModal from "./UpgradeModal";
import PlanLimitModal from "./PlanLimitModal";
import '../styles/StrategicAnalysis.css';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

// Sub-components
import StrategyPillar from './StrategicAnalysisComponents/StrategyPillar';
import TacticsPillar from './StrategicAnalysisComponents/TacticsPillar';
import ExecutionPillar from './StrategicAnalysisComponents/ExecutionPillar';
import { ResourcesPillar, AnalysisDataPillar, TechnologyPillar, GovernancePillar, InnovationPillar, CulturePillar } from './StrategicAnalysisComponents/PillarList';
import { calculateTotalRows } from './StrategicAnalysisComponents/strategicUtils';

const StrategicAnalysis = ({
  onRegenerate,
  isRegenerating: propsIsRegenerating = false,
  canRegenerate = true,
  phaseManager,
  phaseAnalysisArray = [],
  selectedBusinessId,
  onRedirectToBrief,
  onKickstartProjects,
  hasProjectsTab = false,
  onToastMessage,
  hideKickstart = false,
  streamingManager,
  cardId,
  isExpanded = true,
  triggerConfirmation,
  strategicData: propsStrategicData = null,
  pestelData: propsPestelData = null,
  portersData: propsPortersData = null,
  questionsLoaded = false,
  questions = [],
  userAnswers = {},
  onContinueToExecution,
  isExportActive = () => false
}) => {
  const { token, userId } = useAuthStore();
  const { 
    strategicData: storeStrategicData, 
    pestelData: storePestelData, 
    portersData: storePortersData, 
    isRegenerating: isTypeRegenerating,
    isAnalysisLoading: isStoreLoading,
    isInitialLoading: isStoreInitialLoading 
  } = useAnalysisStore();
  
  const rawStrategicData = propsStrategicData || storeStrategicData;
  const displayStrategicData = useMemo(() => {
    if (!rawStrategicData) return null;
    if (typeof rawStrategicData === 'string') {
      try {
        return JSON.parse(rawStrategicData);
      } catch (e) {
        console.error("Failed to parse strategic data string:", e);
        return null;
      }
    }
    return rawStrategicData;
  }, [rawStrategicData]);

  const pestelData = propsPestelData || storePestelData;
  const portersData = propsPortersData || storePortersData;
  
  const [localStrategicData, setLocalStrategicData] = useState(displayStrategicData);
  const isRegenerating = propsIsRegenerating || isTypeRegenerating('strategic');
  const isLoadingData = (isStoreLoading && !displayStrategicData) || isStoreInitialLoading;
  const { t } = useTranslation();
  const ENABLE_PMF = getUserLimits().pmf;
  const hasStrategicAccess = getUserLimits().strategic;
  
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [kickstartError, setKickstartError] = useState('');
  const [hasKickstarted, setHasKickstarted] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set(['strategy-block', 'execution-block', 'sustainability-block']));
  
  const hasInitialized = useRef(false);
  const { data: usageData } = usePlanDetails();
  const usage = usageData?.usage;

  const totalRows = useMemo(() => calculateTotalRows(localStrategicData, phaseAnalysisArray), [localStrategicData, phaseAnalysisArray]);
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    if (displayStrategicData) {
      setLocalStrategicData(displayStrategicData);
      setHasGenerated(true);
      setErrorMessage('');
      setIsLoading(false);
      
      const isFresh = displayStrategicData._isFreshGeneration === true;
      if (isFresh && totalRows > 0) {
        setCollapsedCategories(new Set([]));
      } else if (!hasInitialized.current) {
        hasInitialized.current = true;
      }
    }
  }, [displayStrategicData, totalRows]);

  useEffect(() => {
    if (isRegenerating) {
      setVisibleRows(0);
    } else if (totalRows > 0) {
      if (!streamingManager?.shouldStream(cardId)) {
        setVisibleRows(totalRows);
        return;
      }
      const interval = setInterval(() => {
        setVisibleRows(prev => {
          if (prev < totalRows) return prev + 1;
          clearInterval(interval);
          streamingManager?.stopStreaming(cardId);
          return prev;
        });
      }, STREAMING_CONFIG.ROW_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isRegenerating, totalRows, streamingManager, cardId]);

  const { lastRowRef } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

  const isStrategicDataIncomplete = (data) => {
    if (!data) return true;
    const analysisData = data.strategic_analysis || data;
    if (!analysisData) return true;

    const recommendations = analysisData.strategic_recommendations;
    if (!recommendations) return true;

    const hasStrategyBlock = !!(recommendations.strategy_block &&
      (recommendations.strategy_block.S_strategy ||
        recommendations.strategy_block.T_tactics ||
        recommendations.strategy_block.R_resources));

    const hasExecutionBlock = !!(recommendations.execution_block &&
      (recommendations.execution_block.A_analysis_data ||
        recommendations.execution_block.T_technology_digitalization ||
        recommendations.execution_block.E_execution));

    const hasSustainabilityBlock = !!(recommendations.sustainability_block &&
      (recommendations.sustainability_block.G_governance ||
        recommendations.sustainability_block.I_innovation ||
        recommendations.sustainability_block.C_culture));

    return !hasStrategyBlock && !hasExecutionBlock && !hasSustainabilityBlock;
  };

  const handleRegenerate = async () => {
    const executeRegenerate = async () => {
      if (onRegenerate) {
        try {
          setCollapsedCategories(new Set(['strategy-block', 'execution-block', 'sustainability-block']));
          setLocalStrategicData(null);
          setIsLoading(true);
          await onRegenerate();
        } catch (error) {
          setErrorMessage(error.message || 'Failed to regenerate strategic analysis');
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (triggerConfirmation) {
      triggerConfirmation(
        t("confirm_regeneration_title", { section: 'Strategic Analysis' }),
        t("confirm_regeneration_message", { section: 'Strategic Analysis' }),
        executeRegenerate
      );
    } else {
      await executeRegenerate();
    }
  };

  const handleKickstart = async () => {
    try {
      if (!hasStrategicAccess) {
        setShowPlanLimitModal(true);
        return;
      }

      setKickstartError('');

      if (!token || !selectedBusinessId || !userId || !localStrategicData) {
        const msg = 'Unable to kickstart projects. Please make sure a business is selected and strategic analysis is available.';
        setKickstartError(msg);
        if (onToastMessage) onToastMessage(msg, 'error');
        return;
      }

      const analysisData = localStrategicData.strategic_analysis || localStrategicData;
      const recommendations = analysisData?.strategic_recommendations;
      const pestelRec = pestelData?.pestel_analysis?.strategic_recommendations;
      const portersRec = portersData?.porter_analysis?.strategic_recommendations;

      const itemsToCreate = [];

      const extractItems = (recs) => {
        if (!recs) return;
        (recs.immediate_actions || []).forEach(action => {
          if (!action || action === 'N/A') return;
          itemsToCreate.push({
            project_name: action.action,
            description: action.rationale,
            expected_outcome: action.expected_impact || '',
            estimated_timeline: action.timeline || '',
            success_metrics: action.success_metrics || [],
            project_type: 'immediate action'
          });
        });
        (recs.short_term_initiatives || []).forEach(initiative => {
          if (!initiative || initiative === 'N/A') return;
          itemsToCreate.push({
            project_name: initiative.initiative,
            description: initiative.expected_outcome || '',
            expected_outcome: initiative.expected_outcome || '',
            project_type: 'short term initiative'
          });
        });
        (recs.long_term_strategic_shifts || []).forEach(shift => {
          if (!shift || shift === 'N/A') return;
          itemsToCreate.push({
            project_name: shift.shift,
            description: shift.transformation_required || '',
            expected_outcome: shift.competitive_advantage || '',
            project_type: 'long term shift'
          });
        });
      };

      extractItems(pestelRec);
      extractItems(portersRec);

      if (itemsToCreate.length === 0) {
        const msg = 'No recommended projects are available to create from the strategic analysis.';
        setKickstartError(msg);
        if (onToastMessage) onToastMessage(msg, 'warning');
        return;
      }

      let hasServerError = false;
      let serverErrorMessage;

      for (const item of itemsToCreate) {
        const payload = {
          business_id: selectedBusinessId,
          user_id: userId,
          collaborators: [],
          status: "draft",
          project_name: item.project_name,
          description: item.description || '',
          project_type: item.project_type,
          expected_outcome: item.expected_outcome,
          success_metrics: item.success_metrics,
          estimated_timeline: item.estimated_timeline,
        };

        try {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/projects`, payload, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          });
        } catch (postErr) {
          serverErrorMessage = postErr?.response?.data?.error || postErr?.message || "Failed to kickstart projects.";
          hasServerError = true;
          break;
        }
      }

      if (hasServerError) {
        setKickstartError(serverErrorMessage);
        onToastMessage?.(serverErrorMessage, "error");
        return;
      }

      setHasKickstarted(true);
      if (onKickstartProjects) onKickstartProjects();
      if (onToastMessage) onToastMessage('Projects successfully kickstarted!', 'success');
      
      phaseManager?.setActiveTab?.('bets');

    } catch (e) {
      console.error("Kickstart processing failed", e);
      const msg = 'Something went wrong while kickstarting projects. Please try again.';
      setKickstartError(msg);
      if (onToastMessage) onToastMessage(msg, 'error');
    }
  };

  const toggleCategory = (id) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const CategorySection = ({ id, title, icon: IconComponent, children, description, dataComponent }) => {
    const isCollapsed = collapsedCategories.has(id);
    return (
      <div className="analysis-category" data-component={dataComponent}>
        <div className="category-header" onClick={() => toggleCategory(id)}>
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <div>
              <h2 className="category-title">{title}</h2>
              {description && <p className="category-description">{description}</p>}
            </div>
          </div>
          <div className="category-toggle">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
        <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="category-grid">{children}</div>
        </div>
      </div>
    );
  };

  const renderStrategicContent = () => {
    const analysisData = displayStrategicData?.strategic_analysis || displayStrategicData;
    const recommendations = analysisData?.strategic_recommendations; 
    if (!recommendations) return null;

    return (
      <div className="strategic-content">
        <p className="overview-description text-muted mb-4">Forward-looking recommendations across strategy, execution, and sustainability — the spine of the Bets you'll commit to.</p>
        <CategorySection id="strategy-block" dataComponent="strategic-direction" title={t("strategy_block_title")} icon={Target} description={t("strategy_desc")}>
          {!hasStrategicAccess ? (
            <div className="modern-locked-state" style={{ margin: '20px', padding: '40px' }}>
              <Lock size={32} className="modern-locked-icon" />
              <h3 style={{ fontSize: '1.2rem' }}>{t("Access Restricted")}</h3>
              <p>{t("You do not have permission to view or regenerate this insight please upgrade your plan.")}</p>
            </div>
          ) : (
            <>
              <StrategyPillar 
                strategy={recommendations.strategy_block?.S_strategy} 
                isExpanded={expandedPillar === 'strategy'} 
                onToggle={() => setExpandedPillar(prev => prev === 'strategy' ? null : 'strategy')}
                visibleRows={visibleRows}
                lastRowRef={lastRowRef}
                streamingManager={streamingManager}
                cardId={cardId}
              />
              <TacticsPillar 
                tactics={recommendations.strategy_block?.T_tactics}
                strategicLinkages={analysisData.strategic_linkages}
                pestelData={pestelData}
                portersData={portersData}
                isExpanded={expandedPillar === 'tactics'} 
                onToggle={() => setExpandedPillar(prev => prev === 'tactics' ? null : 'tactics')}
                visibleRows={visibleRows}
                lastRowRef={lastRowRef}
                streamingManager={streamingManager}
                cardId={cardId}
                isExportActive={isExportActive}
              />
              <ResourcesPillar 
                resources={recommendations.strategy_block?.R_resources}
                isExpanded={expandedPillar === 'resources'}
                onToggle={() => setExpandedPillar(prev => prev === 'resources' ? null : 'resources')}
                visibleRows={visibleRows}
                lastRowRef={lastRowRef}
                streamingManager={streamingManager}
                cardId={cardId}
                isExportActive={isExportActive}
              />
            </>
          )}
        </CategorySection>

        <CategorySection id="execution-block" dataComponent="strategic-execution" title={t("execution_block_title")} icon={CheckCircle} description={t("execution_desc")}>
          {!hasStrategicAccess ? (
            <div className="modern-locked-state" style={{ margin: '20px', padding: '40px' }}>
              <Lock size={32} className="modern-locked-icon" />
              <h3 style={{ fontSize: '1.2rem' }}>{t("Access Restricted")}</h3>
              <p>{t("You do not have permission to view or regenerate this insight please upgrade your plan.")}</p>
            </div>
          ) : (
            <>
              <AnalysisDataPillar analysisData={recommendations.execution_block?.A_analysis_data} isExpanded={expandedPillar === 'analysis'} onToggle={() => setExpandedPillar(prev => prev === 'analysis' ? null : 'analysis')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
              <TechnologyPillar tech={recommendations.execution_block?.T_technology_digitalization} isExpanded={expandedPillar === 'tech'} onToggle={() => setExpandedPillar(prev => prev === 'tech' ? null : 'tech')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
              <ExecutionPillar execution={recommendations.execution_block?.E_execution} isExpanded={expandedPillar === 'execution'} onToggle={() => setExpandedPillar(prev => prev === 'execution' ? null : 'execution')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
            </>
          )}
        </CategorySection>

        <CategorySection id="sustainability-block" dataComponent="strategic-sustainability" title={t("sustainability-block_title")} icon={Shield} description={t("sustainability_desc")}>
          {!hasStrategicAccess ? (
            <div className="modern-locked-state" style={{ margin: '20px', padding: '40px' }}>
              <Lock size={32} className="modern-locked-icon" />
              <h3 style={{ fontSize: '1.2rem' }}>{t("Access Restricted")}</h3>
              <p>{t("You do not have permission to view or regenerate this insight please upgrade your plan.")}</p>
            </div>
          ) : (
            <>
              <GovernancePillar governance={recommendations.sustainability_block?.G_governance} isExpanded={expandedPillar === 'gov'} onToggle={() => setExpandedPillar(prev => prev === 'gov' ? null : 'gov')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} />
              <InnovationPillar innovation={recommendations.sustainability_block?.I_innovation} isExpanded={expandedPillar === 'inn'} onToggle={() => setExpandedPillar(prev => prev === 'inn' ? null : 'inn')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} />
              <CulturePillar culture={recommendations.sustainability_block?.C_culture} isExpanded={expandedPillar === 'culture'} onToggle={() => setExpandedPillar(prev => prev === 'culture' ? null : 'culture')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} />
            </>
          )}
        </CategorySection>
      </div>
    );
  };

  const renderMoveToExecution = () => (
    <div className="move-to-execution-section" style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #eaeaea', marginTop: '32px' }}>
      <div className="next-step-label text-uppercase text-muted font-weight-bold mb-2" style={{fontSize: '0.75rem', letterSpacing: '1px', color: '#64748b'}}>NEXT STEP</div>
      <h3 className="mb-2" style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b'}}>Your analysis is ready - move to Execution</h3>
      <p className="text-muted mb-4" style={{color: '#64748b', fontSize: '0.9rem', maxWidth: '600px'}}>Trax now has the full picture. Lock in your priorities as tracked Bets and start running the cadences that move the business forward.</p>
      <div className="progression-visual d-flex align-items-center mb-4" style={{gap: '8px'}}>
        <div className="step completed d-flex align-items-center" style={{color: '#10b981', fontWeight: '500', fontSize: '0.9rem', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '16px'}}>
          <CheckCircle size={14} className="mr-1" style={{marginRight: '4px'}}/> Basic
        </div>
        <div className="arrow text-muted" style={{color: '#cbd5e1'}}>→</div>
        <div className="step completed d-flex align-items-center" style={{color: '#10b981', fontWeight: '500', fontSize: '0.9rem', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '16px'}}>
          <CheckCircle size={14} className="mr-1" style={{marginRight: '4px'}}/> Advanced
        </div>
        <div className="arrow text-muted" style={{color: '#cbd5e1'}}>→</div>
        <div className="step current d-flex align-items-center" style={{color: '#3b82f6', fontWeight: '500', fontSize: '0.9rem', border: '1px solid #3b82f6', borderRadius: '16px', padding: '4px 12px', backgroundColor: '#fff'}}>
          Execution
        </div>
      </div>
      <button className="continue-to-execution-btn" style={{backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center'}} onClick={() => onContinueToExecution?.()}>
        Continue to Execution <span style={{marginLeft: '8px'}}>→</span>
      </button>
    </div>
  );

  if (isRegenerating || isLoading || isLoadingData) {
    return (
      <div className="strategic-analysis-container">
        <div className="modern-locked-state">
          <Loader size={60} className="modern-locked-icon antigravity-rotating" />
          <h3>{t("Preparing Analysis...")}</h3>
          <p>{t("We're gathering the latest data to build your insights.")}</p>
        </div>
        {renderMoveToExecution()}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="strategic-analysis-container">
        <div className="error-state">
          <h3>{t("alert")}</h3>
          <p>{errorMessage}</p>
          <div className="error-actions-container">
            <button onClick={handleRegenerate} className="btn-retry">{t("regenerate")}</button>
            <button onClick={() => onRedirectToBrief?.()} className="btn-review">{t("back")}</button>
          </div>
        </div>
        {renderMoveToExecution()}
      </div>
    );
  }

  if (!questionsLoaded) {
    return (
      <div className="strategic-analysis-container">
        <div className="modern-locked-state">
          <Loader size={60} className="modern-locked-icon antigravity-rotating" />
          <h3>{t("Preparing Analysis...")}</h3>
          <p>{t("We're gathering the latest data to build your insights.")}</p>
        </div>
        {renderMoveToExecution()}
      </div>
    );
  }

  const unlockedFeatures = phaseManager?.getUnlockedFeatures?.() || {};
  if (!unlockedFeatures.analysis && !displayStrategicData) {
    return (
      <div className="strategic-analysis-container">
        <div className="modern-locked-state">
          <Lock size={60} className="modern-locked-icon" />
          <h3>{t("Analysis Locked")}</h3>
          <p>{t("Start answering questions in the business brief to unlock your comprehensive business analysis.")}</p>
        </div>
        {renderMoveToExecution()}
      </div>
    );
  }

  return (
    <div className="strategic-analysis-container">
      {!ENABLE_PMF && !hideKickstart && hasStrategicAccess && !hasKickstarted && (
        <KickstartProjectsCard onKickstart={handleKickstart} />
      )}

      {kickstartError && <div className="kickstart-error-message">{kickstartError}</div>}
      <div className="dashboard-container">
        {isStrategicDataIncomplete(displayStrategicData) ? (
          <AnalysisEmptyState
            analysisType="strategic"
            analysisDisplayName={<span className="notranslate">{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>}
            icon={Target}
            onImproveAnswers={onRedirectToBrief}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            userAnswers={userAnswers}
            minimumAnswersRequired={3}
            showImproveButton={false}
            showRegenerateButton={false}
          />
        ) : (
          renderStrategicContent()
        )}
        {renderMoveToExecution()}
      </div>
      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} />
      <PlanLimitModal show={showPlanLimitModal} onHide={() => setShowPlanLimitModal(false)} usage={usage} />
    </div>
  );
};

export default StrategicAnalysis;
