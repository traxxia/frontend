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
  isExportActive = () => false
}) => {
  const { token, userId } = useAuthStore();
  const { strategicData: storeStrategicData, pestelData: storePestelData, portersData: storePortersData, isRegenerating: isTypeRegenerating } = useAnalysisStore();
  
  const displayStrategicData = propsStrategicData || storeStrategicData;
  const pestelData = propsPestelData || storePestelData;
  const portersData = propsPortersData || storePortersData;
  
  const [localStrategicData, setLocalStrategicData] = useState(displayStrategicData);
  const isRegenerating = propsIsRegenerating || isTypeRegenerating('strategic');
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

  const CategorySection = ({ id, title, icon: IconComponent, children, description }) => {
    const isCollapsed = collapsedCategories.has(id);
    return (
      <div className="analysis-category">
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
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    const recommendations = analysisData?.strategic_recommendations; 
    if (!recommendations) return null;

    return (
      <div className="strategic-content">
        <CategorySection id="strategy-block" title={t("strategy_block_title")} icon={Target} description={t("strategy_desc")}>
          {!hasStrategicAccess ? (
            <div className="restricted-access-placeholder">
              <Lock size={32} className="restricted-icon" />
              <p className="restricted-title">{t("Action Restricted")}</p>
              <p className="restricted-text">{t("execution_upgrade_msg")}</p>
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

        <CategorySection id="execution-block" title={t("execution_block_title")} icon={CheckCircle} description={t("execution_desc")}>
          {!hasStrategicAccess ? (
            <div className="restricted-access-placeholder">
              <Lock size={32} className="restricted-icon" />
              <p className="restricted-title">{t("Action Restricted")}</p>
            </div>
          ) : (
            <>
              <AnalysisDataPillar analysisData={recommendations.execution_block?.A_analysis_data} isExpanded={expandedPillar === 'analysis'} onToggle={() => setExpandedPillar(prev => prev === 'analysis' ? null : 'analysis')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
              <TechnologyPillar tech={recommendations.execution_block?.T_technology_digitalization} isExpanded={expandedPillar === 'tech'} onToggle={() => setExpandedPillar(prev => prev === 'tech' ? null : 'tech')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
              <ExecutionPillar execution={recommendations.execution_block?.E_execution} isExpanded={expandedPillar === 'execution'} onToggle={() => setExpandedPillar(prev => prev === 'execution' ? null : 'execution')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
            </>
          )}
        </CategorySection>

        <CategorySection id="sustainability-block" title={t("sustainability-block_title")} icon={Shield} description={t("sustainability_desc")}>
          {!hasStrategicAccess ? (
            <div className="restricted-access-placeholder">
              <Lock size={32} className="restricted-icon" />
              <p className="restricted-title">{t("Action Restricted")}</p>
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

  if (isRegenerating || isLoading) {
    return <div className="strategic-analysis-container"><div className="loading-state"><Loader className="animate-spin" size={24} /><span>{t("generating_analysis")}</span></div></div>;
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
      </div>
    );
  }

  if (!questionsLoaded) {
    return (
      <div className="strategic-analysis-container">
        <div className="locked-state-card">
          <Loader size={60} className="locked-state-icon antigravity-rotating" />
          <h3 className="locked-state-title">{t("preparing_analysis") || "Preparing Analysis..."}</h3>
          <p className="locked-state-text">{t("analysis_loading_text")}</p>
        </div>
      </div>
    );
  }

  const unlockedFeatures = phaseManager?.getUnlockedFeatures?.() || {};
  if (!unlockedFeatures.analysis) {
    return (
      <div className="strategic-analysis-container">
        <div className="locked-state-card">
          <Lock size={60} className="locked-state-icon" />
          <h3 className="locked-state-title">{t("Action Restricted")}</h3>
          <p className="locked-state-text">{t("complete_questions_to_unlock")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="strategic-analysis-container">
      {!ENABLE_PMF && !hideKickstart && hasStrategicAccess && !hasKickstarted && (
        <KickstartProjectsCard onKickstart={handleKickstart} />
      )}

      {kickstartError && <div className="kickstart-error-message">{kickstartError}</div>}
      <div className="dashboard-container">{renderStrategicContent()}</div>
      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} />
      <PlanLimitModal show={showPlanLimitModal} onHide={() => setShowPlanLimitModal(false)} usage={usage} />
    </div>
  );
};

export default StrategicAnalysis;
