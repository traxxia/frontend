import React, { useMemo, useCallback } from "react";
import { Target, Award, TrendingUp, Users, Building, Zap, Loader, Lock, ChevronDown, ChevronUp } from "lucide-react";
import SwotAnalysis from "./SwotAnalysis";
import PortersFiveForces from "./PortersFiveForces";
import PestelAnalysis from "./PestelAnalysis";
import FullSWOTPortfolio from "./FullSWOTPortfolio";
import { BusinessSetupContext } from "../context/BusinessSetupContext";
import CompetitiveAdvantageMatrix from "./CompetitiveAdvantageMatrix";
import ExpandedCapabilityHeatmap from "./ExpandedCapabilityHeatmap";
import StrategicPositioningRadar from "./StrategicPositioningRadar";
import ProductivityMetrics from "./ProductivityMetrics";
import MaturityScoreLight from "./MaturityScoreLight";
import RegenerateButton from "./RegenerateButton";
import ProfitabilityAnalysis from "./ProfitabilityAnalysis";
import GrowthTracker from "./GrowthTracker";
import LiquidityEfficiency from "./LiquidityEfficiency";
import InvestmentPerformance from "./InvestmentPerformance";
import LeverageRisk from "./LeverageRisk";
import CompetitiveLandscape from "./CompetitiveLandscape";
import CoreAdjacency from "./CoreAdjacency";
import { useStreamingManager } from './StreamingManager';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from "../store";
import '../styles/Analytics.css';
const MemoizedAnalysisCard = React.memo(({
  id,
  title,
  description,
  children,
  onRegenerate,
  isRegenerating,
  hasData,
  isLoading,
  isExpanded,
  isHighlighted,
  onToggleCard,
  streamingManager,
  hideRegenerateButtons,
  canRegenerate,
  hasInsightAccess
}) => {
  const getStatusIcon = () => {
    if (isRegenerating || isLoading) {
      return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
    }
    return null;
  };
  const getActualStatus = () => {
    if (isRegenerating || isLoading) return 'loading';
    if (hasData) return 'completed';
    return 'empty';
  };
  return <div id={id} className={`modern-analysis-card ${getActualStatus()} ${isHighlighted ? 'highlighted' : ''}`}>
        <div className={`modern-card-header ${isExpanded ? 'expanded' : ''}`} onClick={() => onToggleCard(id)}>
          <div className="modern-card-header-left">
            <div className="modern-card-text">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>

          <div className="modern-card-header-right">
            {getStatusIcon()}
            {hasInsightAccess && <div onClick={e => e.stopPropagation()}>
                <RegenerateButton onRegenerate={() => {
            if (!canRegenerate) return;
            streamingManager.startStreaming(id);
            onRegenerate?.();
          }} isRegenerating={isRegenerating || isLoading} canRegenerate={canRegenerate} sectionName={title} size="small" hideRegenerateButtons={hideRegenerateButtons} />
              </div>}
            <button className="modern-expand-btn">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className={`modern-card-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="modern-card-content-inner">
            {!hasInsightAccess ? <div className="locked-analysis-placeholder analysis-content-manager--s1">
                <Lock size={32} className="analysis-content-manager--s2" />
                <p className="analysis-content-manager--s3">Access Restricted</p>
                <p className="analysis-content-manager--s4">You do not have permission to view or regenerate this insight please upgrade your plan.</p>
              </div> : (isLoading || isRegenerating) && !hasData ? <div className="loading-placeholder">
                <Loader className="antigravity-rotating" size={24} />
                <p>Generating Insight...</p>
              </div> : children}
          </div>
        </div>
      </div>;
}, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id && prevProps.isExpanded === nextProps.isExpanded && prevProps.isRegenerating === nextProps.isRegenerating && prevProps.isLoading === nextProps.isLoading && prevProps.hasData === nextProps.hasData && prevProps.title === nextProps.title && prevProps.description === nextProps.description && prevProps.hideRegenerateButtons === nextProps.hideRegenerateButtons && prevProps.hasInsightAccess === nextProps.hasInsightAccess;
});
MemoizedAnalysisCard.displayName = 'MemoizedAnalysisCard';
const CategorySection = React.memo(({
  id,
  title,
  subtitle,
  icon: IconComponent,
  children,
  isCollapsed,
  onToggle
}) => {
  return <div className="analysis-category">
        <div className="category-header" onClick={() => onToggle(id)}>
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <div className="category-title-group">
              <h2 className="category-title">{title}</h2>
              {}
            </div>
          </div>
          <div className="category-toggle">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="category-grid">{children}</div>
        </div>
      </div>;
}, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id && prevProps.isCollapsed === nextProps.isCollapsed && prevProps.children === nextProps.children;
});
CategorySection.displayName = 'CategorySection';
const AnalysisContentManager = (props) => {
  const {
    t
  } = useTranslation();
  const contextFromProvider = React.useContext(BusinessSetupContext) || {};
  const context = { ...contextFromProvider, ...props };
  const [includeFullTimeline, setIncludeFullTimeline] = React.useState(false);
  const [localExpandedCards, setLocalExpandedCards] = React.useState(new Set());
  const [localCollapsedCategories, setLocalCollapsedCategories] = React.useState(new Set());
  const CATEGORIES = useMemo(() => [{
    id: 'current-strategy',
    title: t('Current Strategy'),
    subtitle: t('Strategic_focus_areas_and_growth_opportunities'),
    icon: Target
  }, {
    id: 'costs-financial',
    title: t('Costs/Financial'),
    subtitle: t('Financial_performance,_profitability,_and_resource_efficiency_metrics'),
    icon: TrendingUp
  }, {
    id: 'context-industry',
    title: t('Context/Industry'),
    subtitle: t('External_environment,_market_forces,_and_industry_dynamics'),
    icon: Building
  }, {
    id: 'customer',
    title: t('Customer'),
    subtitle: t('Customer_behavior,_loyalty,_and_purchase_decision_factors'),
    icon: Users
  }, {
    id: 'capabilities',
    title: t('Capabilities'),
    subtitle: t('Organizational_strengths,_maturity,_and_operational_capabilities'),
    icon: Zap
  }, {
    id: 'competition',
    title: t('Competition'),
    subtitle: t('Competitive_landscape_and_market_positioning_analysis'),
    icon: Award
  }], [t]);
  const ANALYSIS_CONFIG = useMemo(() => ({
    swot: {
      slug: "swot",
      component: SwotAnalysis,
      title: t("swot_analysis"),
      description: "Comprehensive strengths, weaknesses, opportunities, and threats analysis",
      category: "context-industry",
      dataKey: "swotAnalysisResult",
      refKey: "swotRef",
      pdfComponent: "swot-analysis"
    },
    profitabilityAnalysis: {
      slug: "profitability-analysis",
      component: ProfitabilityAnalysis,
      title: t("Profitability_Analysis"),
      description: t("Detailed_profitability_margins_with_industry_benchmark_comparisons"),
      category: "costs-financial",
      dataKey: "profitabilityData",
      refKey: "profitabilityRef",
      pdfComponent: "profitability-analysis"
    },
    growthTracker: {
      slug: "growth-tracker",
      component: GrowthTracker,
      title: t("Growth_Tracker"),
      description: t("Revenue_and_net_income_trends_with_growth_pattern_analysis"),
      category: "costs-financial",
      dataKey: "growthTrackerData",
      refKey: "growthTrackerRef",
      pdfComponent: "growth-tracker"
    },
    liquidityEfficiency: {
      slug: "liquidity-efficiency",
      component: LiquidityEfficiency,
      title: t("Liquidity_Efficiency"),
      description: t("Financial_ratios_with_gauges_and_color-coded_risk_indicators"),
      category: "costs-financial",
      dataKey: "liquidityEfficiencyData",
      refKey: "liquidityEfficiencyRef",
      pdfComponent: "liquidity-efficiency"
    },
    investmentPerformance: {
      slug: "investment-performance",
      component: InvestmentPerformance,
      title: t("Investment_Performance"),
      description: t("ROA_ROE_ROIC_analysis_with_benchmark_comparisons_and_trend_charts"),
      category: "costs-financial",
      dataKey: "investmentPerformanceData",
      refKey: "investmentPerformanceRef",
      pdfComponent: "investment-performance"
    },
    leverageRisk: {
      slug: "leverage-risk",
      component: LeverageRisk,
      title: t("Leverage_Risk"),
      description: t("Financial_risk_assessment_with_traffic_light_risk_indicators"),
      category: "costs-financial",
      dataKey: "leverageRiskData",
      refKey: "leverageRiskRef",
      pdfComponent: "leverage-risk"
    },
    /* productivityMetrics: {
      slug: "productivity",
      component: ProductivityMetrics,
      title: t("Productivity_Metrics"),
      description: t("Analysis_of_organizational_productivity_and_efficiency_metrics"),
      category: "costs-financial",
      dataKey: "productivityData",
      refKey: "productivityRef",
      pdfComponent: "productivity"
    }, */
    fullSwot: {
      slug: "full-swot",
      component: FullSWOTPortfolio,
      title: t("Full_SWOT_Portfolio"),
      description: t("Comprehensive_SWOT_analysis_with_strategic_recommendations"),
      category: "context-industry",
      dataKey: "fullSwotData",
      refKey: "fullSwotRef",
      pdfComponent: "full-swot"
    },
    strategicRadar: {
      slug: "strategic-radar",
      component: StrategicPositioningRadar,
      title: t("Strategic_Positioning_Radar"),
      description: t("Visual_representation_of_strategic_positioning_across_key_dimensions"),
      category: "context-industry",
      dataKey: "strategicRadarData",
      refKey: "strategicRadarRef",
      pdfComponent: "strategic-radar"
    },
    porters: {
      slug: "porters",
      component: PortersFiveForces,
      title: t("Porters_Five_Forces"),
      description: t("Competitive_analysis_using_Porters_strategic_framework"),
      category: "context-industry",
      dataKey: "portersData",
      refKey: "portersRef",
      pdfComponent: "porters-analysis"
    },
    pestel: {
      slug: "pestel",
      component: PestelAnalysis,
      title: t("PESTEL_Analysis"),
      description: t("External_environment_analysis_covering_political_economic_social_technological_environmental_and_legal_factors"),
      category: "context-industry",
      dataKey: "pestelData",
      refKey: "pestelRef",
      pdfComponent: "pestel-analysis"
    },
    competitiveAdvantage: {
      slug: "competitive-advantage",
      component: CompetitiveAdvantageMatrix,
      title: t("Competitive_Advantage_Matrix"),
      description: t("Analysis_of_competitive_positioning_and_advantages"),
      category: "customer",
      dataKey: "competitiveAdvantageData",
      refKey: "competitiveAdvantageRef",
      pdfComponent: "competitive-advantage"
    },
    expandedCapability: {
      slug: "expanded-capability",
      component: ExpandedCapabilityHeatmap,
      title: t("Capability_Heatmap"),
      description: t("Advanced_organizational_capability_analysis"),
      category: "capabilities",
      dataKey: "expandedCapabilityData",
      refKey: "expandedCapabilityRef",
      pdfComponent: "expanded-capability"
    },
    maturityScore: {
      slug: "maturity",
      component: MaturityScoreLight,
      title: t("Maturity_Score"),
      description: t("Business_maturity_assessment_and_scoring"),
      category: "capabilities",
      dataKey: "maturityData",
      refKey: "maturityScoreRef",
      pdfComponent: "maturity"
    },
    competitiveLandscape: {
      slug: "competitive-landscape",
      component: CompetitiveLandscape,
      title: t("Competitive_Landscape"),
      description: t("Comprehensive_analysis_of_key_competitors_using_SWOT_framework"),
      category: "competition",
      dataKey: "competitiveLandscapeData",
      refKey: "competitiveLandscapeRef",
      pdfComponent: "competitive-landscape"
    },
    coreAdjacency: {
      slug: "core-adjacency",
      component: CoreAdjacency,
      title: t("Core"),
      description: t("Strategic_analysis_of_core_business_areas_and_adjacent_growth_opportunities"),
      category: "current-strategy",
      dataKey: "coreAdjacencyData",
      refKey: "coreAdjacencyRef",
      pdfComponent: "core-adjacency"
    }
  }), [t]);
  const API_TO_ANALYSIS_MAP = useMemo(() => ({
    'find': 'swot',
    'porter-analysis': 'porters',
    'pestel-analysis': 'pestel',
    'full-swot-portfolio': 'fullSwot',
    'competitive-advantage': 'competitiveAdvantage',
    'expanded-capability-heatmap': 'expandedCapability',
    'strategic-positioning-radar': 'strategicRadar',
    // 'productivity-metrics': 'productivityMetrics',
    'maturity-scoring': 'maturityScore',
    'simple-swot-portfolio': 'competitiveLandscape',
    'core-adjacency': 'coreAdjacency',
    'excel-analysis-profitability': 'profitabilityAnalysis',
    'excel-analysis-growth': 'growthTracker',
    'excel-analysis-liquidity': 'liquidityEfficiency',
    'excel-analysis-investment': 'investmentPerformance',
    'excel-analysis-leverage': 'leverageRisk'
  }), []);
  const {
    phaseManager,
    apiLoadingStates = {},
    expandedCards = localExpandedCards,
    setExpandedCards = setLocalExpandedCards,
    collapsedCategories = localCollapsedCategories,
    setCollapsedCategories = setLocalCollapsedCategories,
    highlightedCard,
    hideRegenerateButtons = false,
    hasInsightAccess = true,
    isAnalysisRegenerating,
    isStrategicRegenerating,
    selectedBusinessId,
    handleRedirectToBrief,
    triggerConfirmation,
    questions: propsQuestions,
    userAnswers: propsUserAnswers,
    businessData: propsBusinessData,
    swotAnalysisResult,
    portersData: propsPortersData,
    pestelData: propsPestelData,
    fullSwotData: propsFullSwotData,
    competitiveAdvantageData,
    expandedCapabilityData,
    strategicRadarData,
    productivityData: propsProductivityData,
    maturityData: propsMaturityData,
    competitiveLandscapeData,
    coreAdjacencyData,
    profitabilityData: propsProfitabilityData,
    growthTrackerData: propsGrowthTrackerData,
    liquidityEfficiencyData: propsLiquidityEfficiencyData,
    investmentPerformanceData: propsInvestmentPerformanceData,
    leverageRiskData: propsLeverageRiskData,
    strategicData: propsStrategicData,
    questionsLoaded,
    canRegenerate = true,
    hideImproveButton,
    showImproveButton,
    readOnly,
    apiService,
    uploadedFileForAnalysis,
    onRedirectToChat,
    isMobile,
    setActiveTab,
    hasUploadedDocument,
    documentInfo,
    showToastMessage = () => {},
    swotRef,
    portersRef,
    pestelRef,
    fullSwotRef,
    competitiveAdvantageRef,
    expandedCapabilityRef,
    strategicRadarRef,
    productivityRef,
    maturityScoreRef,
    profitabilityRef,
    growthTrackerRef,
    liquidityEfficiencyRef,
    investmentPerformanceRef,
    leverageRiskRef,
    competitiveLandscapeRef,
    coreAdjacencyRef
  } = context;

  const {
    swotAnalysis,
    portersData,
    pestelData,
    fullSwotData,
    competitiveAdvantage,
    strategicData,
    expandedCapability,
    strategicRadar,
    productivityData,
    maturityData,
    competitiveLandscape,
    coreAdjacency,
    profitabilityData,
    growthTrackerData,
    liquidityEfficiencyData,
    investmentPerformanceData,
    leverageRiskData,
    isRegenerating: isTypeRegenerating,
    questions: storeQuestions,
    userAnswers: storeUserAnswers,
    regenerateIndividualAnalysis
  } = useAnalysisStore();
  const questions = propsQuestions || storeQuestions;
  const userAnswers = propsUserAnswers || storeUserAnswers;
  const businessName = propsBusinessData?.name || "";
  const streamingManager = useStreamingManager();
  const isAnalysisLoading = useCallback(analysisType => {
    if (isTypeRegenerating(analysisType)) return true;
    const excelAnalysisTypes = ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'];
    
    if (excelAnalysisTypes.includes(analysisType)) {
      const apiKeyMap = {
        'profitabilityAnalysis': 'excel-analysis-profitability',
        'growthTracker': 'excel-analysis-growth',
        'liquidityEfficiency': 'excel-analysis-liquidity',
        'investmentPerformance': 'excel-analysis-investment',
        'leverageRisk': 'excel-analysis-leverage'
      };
      const apiKey = apiKeyMap[analysisType];
      const prefixedKey = selectedBusinessId ? `${selectedBusinessId}_${apiKey}` : apiKey;
      return apiLoadingStates[prefixedKey] || apiLoadingStates[apiKey] || false;
    }
    const relevantEndpoints = Object.entries(API_TO_ANALYSIS_MAP).filter(([_, analysis]) => analysis === analysisType).map(([endpoint]) => endpoint);
    return relevantEndpoints.some(endpoint => {
      const prefixedKey = selectedBusinessId ? `${selectedBusinessId}_${endpoint}` : endpoint;
      return apiLoadingStates[prefixedKey] || apiLoadingStates[endpoint];
    });
  }, [apiLoadingStates, isTypeRegenerating, API_TO_ANALYSIS_MAP, selectedBusinessId]);
  const toggleCard = useCallback(cardId => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(cardId);
      if (wasExpanded) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, [setExpandedCards]);
  const toggleCategory = useCallback(categoryId => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, [setCollapsedCategories]);
  const createSimpleRegenerationHandler = useCallback(analysisKey => () => {
    const cardId = analysisKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    const config = ANALYSIS_CONFIG[analysisKey];
    const sectionName = config?.title || t("Analysis");
    const onConfirm = () => {
      streamingManager.startStreaming(cardId);
      regenerateIndividualAnalysis(analysisKey, questions, userAnswers, selectedBusinessId, showToastMessage, uploadedFileForAnalysis, { includeFullTimeline });
    };
    if (triggerConfirmation) {
      triggerConfirmation(t("confirm_regeneration_title"), t("confirm_regeneration_message", {
        section: sectionName
      }), onConfirm);
    } else {
      onConfirm();
    }
  }, [triggerConfirmation, ANALYSIS_CONFIG, t, streamingManager, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId, showToastMessage, uploadedFileForAnalysis]);
  const renderAnalysisCard = useCallback((analysisKey, config) => {
    const dataMap = {
      swot: swotAnalysisResult || swotAnalysis,
      porters: propsPortersData || portersData,
      pestel: propsPestelData || pestelData,
      fullSwot: propsFullSwotData || fullSwotData,
      competitiveAdvantage: competitiveAdvantageData || competitiveAdvantage,
      expandedCapability: expandedCapabilityData || expandedCapability,
      strategicRadar: strategicRadarData || strategicRadar,
      productivityMetrics: propsProductivityData || productivityData,
      maturityScore: propsMaturityData || maturityData,
      competitiveLandscape: competitiveLandscapeData || competitiveLandscape,
      coreAdjacency: coreAdjacencyData || coreAdjacency,
      profitabilityAnalysis: propsProfitabilityData || profitabilityData,
      growthTracker: propsGrowthTrackerData || growthTrackerData,
      liquidityEfficiency: propsLiquidityEfficiencyData || liquidityEfficiencyData,
      investmentPerformance: propsInvestmentPerformanceData || investmentPerformanceData,
      leverageRisk: propsLeverageRiskData || leverageRiskData,
      strategic: propsStrategicData || strategicData
    };
    const data = dataMap[analysisKey];
    const Component = config.component;
    const refsMap = {
      swotRef,
      portersRef,
      pestelRef,
      fullSwotRef,
      competitiveAdvantageRef,
      expandedCapabilityRef,
      strategicRadarRef,
      productivityRef,
      maturityScoreRef,
      profitabilityRef,
      growthTrackerRef,
      liquidityEfficiencyRef,
      investmentPerformanceRef,
      leverageRiskRef,
      competitiveLandscapeRef,
      coreAdjacencyRef
    };
    const ref = refsMap[config.refKey];
    const pdfComponent = config.pdfComponent;
    const isRegenerating = isTypeRegenerating(analysisKey);
    const cardId = config.slug || analysisKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    return <MemoizedAnalysisCard key={analysisKey} id={cardId} title={config.title} description={config.description} hasData={!!data} onRegenerate={createSimpleRegenerationHandler(analysisKey)} isRegenerating={isRegenerating} isLoading={isAnalysisLoading(analysisKey)} isExpanded={expandedCards.has(cardId)} isHighlighted={highlightedCard === cardId} onToggleCard={toggleCard} streamingManager={streamingManager} hideRegenerateButtons={hideRegenerateButtons} canRegenerate={canRegenerate && (!!data || config.category !== 'costs-financial' || analysisKey === 'productivityMetrics')} hasInsightAccess={hasInsightAccess}>
        <div ref={ref} data-component={pdfComponent}>
          <Component questions={questions} userAnswers={userAnswers} businessName={businessName} onRegenerate={createSimpleRegenerationHandler(analysisKey)} isRegenerating={isRegenerating || isAnalysisLoading(analysisKey)} canRegenerate={canRegenerate && !!data} {...{
          [config.dataKey]: data
        }} selectedBusinessId={selectedBusinessId} onRedirectToBrief={handleRedirectToBrief} isExpanded={expandedCards.has(cardId)} streamingManager={streamingManager} cardId={cardId} hideImproveButton={hideImproveButton} showImproveButton={showImproveButton} readOnly={readOnly} {...analysisKey === 'swot' && {
          analysisResult: data,
          saveAnalysisToBackend: (d, type) => apiService.saveAnalysisToBackend(d, type, selectedBusinessId)
        }} {...config.category === 'costs-financial' && {
          uploadedFile: uploadedFileForAnalysis,
          onRedirectToChat: onRedirectToChat,
          isMobile: isMobile,
          setActiveTab: setActiveTab,
          hasUploadedDocument: hasUploadedDocument,
          readOnly: readOnly,
          documentInfo: documentInfo
        }} />
        </div>
      </MemoizedAnalysisCard>;
  }, [questions, userAnswers, businessName, selectedBusinessId, swotAnalysis, portersData, pestelData, fullSwotData, competitiveAdvantage, strategicData, expandedCapability, strategicRadar, productivityData, maturityData, competitiveLandscape, coreAdjacency, profitabilityData, growthTrackerData, liquidityEfficiencyData, investmentPerformanceData, leverageRiskData, isTypeRegenerating, isAnalysisLoading, expandedCards, highlightedCard, toggleCard, streamingManager, hideRegenerateButtons, canRegenerate, hasInsightAccess, handleRedirectToBrief, createSimpleRegenerationHandler, hideImproveButton, showImproveButton, readOnly, apiService, uploadedFileForAnalysis, onRedirectToChat, isMobile, setActiveTab, hasUploadedDocument, documentInfo, swotRef, portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef, productivityRef, maturityScoreRef, profitabilityRef, growthTrackerRef, liquidityEfficiencyRef, investmentPerformanceRef, leverageRiskRef, competitiveLandscapeRef, coreAdjacencyRef, swotAnalysisResult, propsPortersData, propsPestelData, propsFullSwotData, competitiveAdvantageData, expandedCapabilityData, strategicRadarData, propsProductivityData, propsMaturityData, competitiveLandscapeData, coreAdjacencyData, propsProfitabilityData, propsGrowthTrackerData, propsLiquidityEfficiencyData, propsInvestmentPerformanceData, propsLeverageRiskData, propsStrategicData]);
  const unlockedFeatures = useMemo(() => phaseManager?.getUnlockedFeatures?.() || {}, [phaseManager]);
  const currentAnalyses = useMemo(() => {
    if (props.singleCategory) {
      const activeAnalyses = new Set();
      Object.keys(ANALYSIS_CONFIG).forEach(key => {
        if (ANALYSIS_CONFIG[key].category === props.singleCategory) {
          activeAnalyses.add(key);
        }
      });
      return Array.from(activeAnalyses);
    }

    const sets = {
      initial: ['swot', 'porters', 'pestel'],
      essential: ['porters', 'pestel', 'fullSwot', 'competitiveAdvantage', 'expandedCapability', 'strategicRadar', 'maturityScore', 'competitiveLandscape', 'coreAdjacency'],
      advanced: ['porters', 'pestel', 'fullSwot', 'competitiveAdvantage', 'expandedCapability', 'strategicRadar', 'maturityScore', 'competitiveLandscape', 'coreAdjacency'],
      financial: ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk']
    };
    const activeAnalyses = new Set();
    if (unlockedFeatures.hasDocument) {
      sets.financial.forEach(a => activeAnalyses.add(a));
    }
    if (unlockedFeatures.advancedPhase) {
      sets.advanced.forEach(a => activeAnalyses.add(a));
    } else if (unlockedFeatures.essentialPhase) {
      sets.essential.forEach(a => activeAnalyses.add(a));
    } else if (unlockedFeatures.initialPhase) {
      sets.initial.forEach(a => activeAnalyses.add(a));
    }
    // Fallback: If no phases are unlocked but we have data, default to showing the advanced set
    // This ensures data is visible even if the questions API call was skipped.
    if (activeAnalyses.size === 0 && (swotAnalysis || portersData || pestelData || strategicData || competitiveAdvantage || fullSwotData)) {
      sets.advanced.forEach(a => activeAnalyses.add(a));
    }

    return Array.from(activeAnalyses);
  }, [unlockedFeatures, swotAnalysis, portersData, pestelData, strategicData, competitiveAdvantage, fullSwotData, props.singleCategory, ANALYSIS_CONFIG]);
  const categorizedAnalyses = useMemo(() => {
    const result = {};
    CATEGORIES.forEach(cat => {
      result[cat.id] = [];
    });
    currentAnalyses.forEach(analysisKey => {
      const config = ANALYSIS_CONFIG[analysisKey];
      if (config) {
        result[config.category].push(renderAnalysisCard(analysisKey, config));
      }
    });
    return result;
  }, [currentAnalyses, renderAnalysisCard, CATEGORIES, ANALYSIS_CONFIG]);
  if (!questionsLoaded && !props.singleCategory) {
    return <div className="modern-locked-state">
        <Loader size={60} className="modern-locked-icon antigravity-rotating" />
        <h3>{t("Preparing Analysis...")}</h3>
        <p>{t("We're gathering the latest data to build your insights.")}</p>
      </div>;
  }
  const hasAnyData = swotAnalysis || portersData || pestelData || strategicData || competitiveAdvantage || fullSwotData;
  if (!unlockedFeatures.analysis && !hasAnyData && !props.singleCategory) {
    return <div className="modern-locked-state">
        <Lock size={60} className="modern-locked-icon" />
        <h3>{t("Analysis Locked")}</h3>
        <p>{t("Start answering questions in the business brief to unlock your comprehensive business analysis.")}</p>
      </div>;
  }
  const financialAnalyses = ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'];
  const isFinancialRegenerating = financialAnalyses.some(type => isAnalysisLoading(type)) || isTypeRegenerating('financial');
  const isMainAnalysisRegenerating = ['swot', 'porters', 'pestel', 'fullSwot', 'competitiveAdvantage', 'expandedCapability', 'strategicRadar', 'maturityScore', 'competitiveLandscape', 'coreAdjacency'].some(type => isAnalysisLoading(type)) || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
  return <div className="modern-analysis-container">
      {(isFinancialRegenerating || isMainAnalysisRegenerating) && <div className="analysis-regenerating-banner analysis-content-manager--s5">
          <Loader size={16} className="antigravity-rotating" />
          <span>
            {isMainAnalysisRegenerating && isFinancialRegenerating ? t("Generating all Insights...") : 
             isFinancialRegenerating ? t("Regenerating financial insights...") : 
             isAnalysisRegenerating && isStrategicRegenerating ? t("Generating all Insights...") : 
             (isStrategicRegenerating && !isAnalysisRegenerating) ? 
                (regenerationStatus === 'insights' ? t("regeneration_step_insights") : 
                 regenerationStatus === 'strategic' ? t("regeneration_step_strategic") : 
                 t("Generating Strategic Analysis...")) : 
             t("Generating Insight...")}
          </span>
        </div>}

      {/* {!props.singleCategory && (
        <div className="timeline-toggle-container mb-4" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="includeFullTimelineToggle" 
            checked={includeFullTimeline} 
            onChange={(e) => setIncludeFullTimeline(e.target.checked)} 
            style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="includeFullTimelineToggle" style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', margin: 0, cursor: 'pointer' }}>
              {t("Include full financial history in strategic analysis")}
            </label>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {t("(Default: last 5 periods to optimize prompt size and focus recommendations)")}
            </span>
          </div>
        </div>
      )} */}

      {!props.singleCategory && (
        <div className="six-cs-framework-overview mb-4">
          <p className="overview-description text-muted mb-4">Your business analyzed across six key dimensions — the starting point for everything that follows.</p>
          <div className="overview-bullets-grid">
            <div className="overview-bullet-column">
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Current Strategy:</span>
                <span className="bullet-desc">Core business and growth options.</span>
              </div>
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Context/Industry:</span>
                <span className="bullet-desc">Market forces and industry dynamics.</span>
              </div>
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Capabilities:</span>
                <span className="bullet-desc">Internal strengths and maturity.</span>
              </div>
            </div>
            <div className="overview-bullet-column">
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Costs/Financial:</span>
                <span className="bullet-desc">Profitability and financial efficiency.</span>
              </div>
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Customer:</span>
                <span className="bullet-desc">Loyalty and purchase criteria.</span>
              </div>
              <div className="overview-bullet-item">
                <span className="bullet-dot"></span>
                <span className="bullet-title">Competition:</span>
                <span className="bullet-desc">Landscape and market positioning.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="modern-analysis-content">

        <div className="categorized-analysis">
          {CATEGORIES.filter(c => !props.singleCategory || c.id === props.singleCategory).map(category => {
          const analyses = categorizedAnalyses[category.id];
          if (analyses.length === 0) return null;
          return <CategorySection key={category.id} id={category.id} title={category.title} subtitle={category.subtitle} icon={category.icon} isCollapsed={collapsedCategories.has(category.id)} onToggle={toggleCategory}>
                {analyses}
              </CategorySection>;
        })}
        </div>
      </div>
    </div>;
};
export default AnalysisContentManager;
