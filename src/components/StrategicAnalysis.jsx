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
  const { token, userId, userRole } = useAuthStore();
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
      if (displayStrategicData._isFreshGeneration && calculateTotalRows(displayStrategicData) > 0) {
        setCollapsedCategories(new Set([]));
      } else if (!hasInitialized.current) {
        hasInitialized.current = true;
      }
    }
  }, [displayStrategicData]);

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
    if (onRegenerate) {
      try {
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

  const handleKickstart = async () => {
     // Kickstart logic... (kept simple for this example, usually involves multiple API calls)
     setHasKickstarted(true);
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
              {description && <p className="strategic-analysis--s1">{description}</p>}
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
        </CategorySection>

        <CategorySection id="execution-block" title={t("execution_block_title")} icon={CheckCircle} description={t("execution_desc")}>
           <AnalysisDataPillar analysisData={recommendations.execution_block?.A_analysis_data} isExpanded={expandedPillar === 'analysis'} onToggle={() => setExpandedPillar(prev => prev === 'analysis' ? null : 'analysis')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
           <TechnologyPillar tech={recommendations.execution_block?.T_technology_digitalization} isExpanded={expandedPillar === 'tech'} onToggle={() => setExpandedPillar(prev => prev === 'tech' ? null : 'tech')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
           <ExecutionPillar execution={recommendations.execution_block?.E_execution} isExpanded={expandedPillar === 'execution'} onToggle={() => setExpandedPillar(prev => prev === 'execution' ? null : 'execution')} visibleRows={visibleRows} lastRowRef={lastRowRef} streamingManager={streamingManager} cardId={cardId} isExportActive={isExportActive} />
        </CategorySection>

        <CategorySection id="sustainability-block" title={t("sustainability-block_title")} icon={Shield} description={t("sustainability_desc")}>
           <GovernancePillar governance={recommendations.sustainability_block?.G_governance} isExpanded={expandedPillar === 'gov'} onToggle={() => setExpandedPillar(prev => prev === 'gov' ? null : 'gov')} />
           <InnovationPillar innovation={recommendations.sustainability_block?.I_innovation} isExpanded={expandedPillar === 'inn'} onToggle={() => setExpandedPillar(prev => prev === 'inn' ? null : 'inn')} />
           <CulturePillar culture={recommendations.sustainability_block?.C_culture} isExpanded={expandedPillar === 'culture'} onToggle={() => setExpandedPillar(prev => prev === 'culture' ? null : 'culture')} />
        </CategorySection>
      </div>
    );
  };

  if (isRegenerating || isLoading) {
    return <div className="strategic-analysis-container"><div className="loading-state"><Loader className="animate-spin" size={24} /><span>{t("Generating Strategic Analysis...")}</span></div></div>;
  }

  if (errorMessage) {
    return <div className="strategic-analysis-container"><div className="error-state"><h3>Action Required</h3><p>{errorMessage}</p><button onClick={handleRegenerate} className="retry-button">Retry Generation</button></div></div>;
  }

  if (!questionsLoaded) {
    return <div className="strategic-analysis-container"><div className="modern-locked-state"><Loader size={60} className="antigravity-rotating" /><h3 className="mt-4">{t("Preparing Strategic Analysis...")}</h3></div></div>;
  }

  const unlockedFeatures = phaseManager?.getUnlockedFeatures?.() || {};
  if (!unlockedFeatures.analysis) {
    return <div className="strategic-analysis-container"><div className="modern-locked-state"><Lock size={60} /><h3 className="mt-4">Strategic Analysis Locked</h3><p>{t("Complete business brief to unlock.")}</p></div></div>;
  }

  return (
    <div className="strategic-analysis-container">
      {!ENABLE_PMF && !hideKickstart && hasStrategicAccess && !hasKickstarted && <KickstartProjectsCard onKickstart={handleKickstart} />}
      <div className="dashboard-container">{renderStrategicContent()}</div>
      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} />
      <PlanLimitModal show={showPlanLimitModal} onHide={() => setShowPlanLimitModal(false)} usage={usage} />
    </div>
  );
};

export default StrategicAnalysis;