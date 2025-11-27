import React, { useState } from "react";
import {
  Target, Award, TrendingUp, Users, Building, Zap,
  Loader, Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import SwotAnalysis from "./SwotAnalysis";
import PurchaseCriteria from "./PurchaseCriteria";
import LoyaltyNPS from "./LoyaltyNPS";
import PortersFiveForces from "./PortersFiveForces";
import PestelAnalysis from "./PestelAnalysis";
import FullSWOTPortfolio from "./FullSWOTPortfolio";
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

const AnalysisContentManager = (props) => {
  const { t } = useTranslation();
  const CATEGORIES = [
    {
      id: 'costs-financial',
      title: t('Costs/Financial'),
      subtitle: t('Financial_performance,_profitability,_and_resource_efficiency_metrics'),
      icon: TrendingUp
    },
    {
      id: 'context-industry',
      title: t('Context/Industry'),
      subtitle: t('External_environment,_market_forces,_and_industry_dynamics'),
      icon: Building
    },
    {
      id: 'customer',
      title: t('Customer'),
      subtitle: t('Customer_behavior,_loyalty,_and_purchase_decision_factors'),
      icon: Users
    },
    {
      id: 'capabilities',
      title: t('Capabilities'),
      subtitle: t('Organizational_strengths,_maturity,_and_operational_capabilities'),
      icon: Zap
    },
    {
      id: 'competition',
      title: t('Competition'),
      subtitle: t('Competitive_landscape_and_market_positioning_analysis'),
      icon: Award
    },
    {
      id: 'current-strategy',
      title: t('Current Strategy'),
      subtitle: t('Strategic_focus_areas_and_growth_opportunities'),
      icon: Target
    }
  ];
  const ANALYSIS_CONFIG = {
  swot: {
    slug: "swot",
    component: SwotAnalysis,
    title: "SWOT Analysis",
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
  productivityMetrics: {
    slug: "productivity",
    component: ProductivityMetrics,
    title: t("Productivity_Metrics"),
    description: t("Analysis_of_organizational_productivity_and_efficiency_metrics"),
    category: "costs-financial",
    dataKey: "productivityData",
    refKey: "productivityRef",
    pdfComponent: "productivity"
  },
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
  purchaseCriteria: {
    slug: "purchase-criteria",
    component: PurchaseCriteria,
    title: t("Purchase_Criteria"),
    description: t("Key_factors_influencing_customer_buying_decisions"),
    category: "customer",
    dataKey: "purchaseCriteriaData",
    refKey: "purchaseCriteriaRef",
    pdfComponent: "purchase-criteria"
  },
  loyaltyNPS: {
    slug: "loyalty-nps",
    component: LoyaltyNPS,
    title: t("Loyalty_&_NPS"),
    description: t("Customer_loyalty_metrics_and_Net_Promoter_Score_analysis"),
    category: "customer",
    dataKey: "loyaltyNPSData",
    refKey: "loyaltyNpsRef",
    pdfComponent: "loyalty-nps"
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
};


const API_TO_ANALYSIS_MAP = {
  'find': 'swot',
  'purchase-criteria': 'purchaseCriteria',
  'loyalty-metrics': 'loyaltyNPS',
  'porter-analysis': 'porters',
  'pestel-analysis': 'pestel',
  'full-swot-portfolio': 'fullSwot',
  'competitive-advantage': 'competitiveAdvantage',
  'expanded-capability-heatmap': 'expandedCapability',
  'strategic-positioning-radar': 'strategicRadar',
  'productivity-metrics': 'productivityMetrics',
  'maturity-scoring': 'maturityScore',
  'simple-swot-portfolio': 'competitiveLandscape',
  'core-adjacency': 'coreAdjacency',
  'excel-analysis-profitability': 'profitabilityAnalysis',
  'excel-analysis-growth': 'growthTracker',
  'excel-analysis-liquidity': 'liquidityEfficiency',
  'excel-analysis-investment': 'investmentPerformance',
  'excel-analysis-leverage': 'leverageRisk'
};
  const {
    phaseManager,
    apiLoadingStates = {},
    expandedCards,
    setExpandedCards,
    collapsedCategories,
    setCollapsedCategories,
    highlightedCard,
    hideRegenerateButtons = false,
  } = props;

  const streamingManager = useStreamingManager();

  const isAnalysisLoading = (analysisType) => {
    const excelAnalysisTypes = ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'];

    if (excelAnalysisTypes.includes(analysisType)) {
      const apiKeyMap = {
        'profitabilityAnalysis': 'excel-analysis-profitability',
        'growthTracker': 'excel-analysis-growth',
        'liquidityEfficiency': 'excel-analysis-liquidity',
        'investmentPerformance': 'excel-analysis-investment',
        'leverageRisk': 'excel-analysis-leverage'
      };

      const regeneratingKey = `is${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}Regenerating`;
      const apiKey = apiKeyMap[analysisType];

      return props[regeneratingKey] || apiLoadingStates[apiKey] || false;
    }

    const relevantEndpoints = Object.entries(API_TO_ANALYSIS_MAP)
      .filter(([_, analysis]) => analysis === analysisType)
      .map(([endpoint]) => endpoint);

    return relevantEndpoints.some(endpoint => apiLoadingStates[endpoint]);
  };

  const toggleCard = (cardId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(cardId);

      if (wasExpanded) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
        // if (!streamingManager.hasStreamed(cardId)) {
        //   streamingManager.startStreaming(cardId);
        // }
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const ModernAnalysisCard = ({
    id,
    title,
    description,
    children,
    onRegenerate,
    isRegenerating = false,
    hasData = false,
    isLoading = false,
  }) => {
    const isExpanded = expandedCards.has(id);
    const isHighlighted = highlightedCard === id;

    const getStatusIcon = () => {
      if (isRegenerating || isLoading) {
        return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
      }
      return null;
    };

    const getActualStatus = () => {
      if (isRegenerating || isLoading) return 'loading';
      if (hasData) return 'completed';
      return 'error';
    };

    return (
      <div
        id={id}
        className={`modern-analysis-card ${getActualStatus()} ${isHighlighted ? 'highlighted' : ''}`}
      >
        <div className={`modern-card-header ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleCard(id)}>
          <div className="modern-card-header-left">
            <div className="modern-card-text">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>

          <div className="modern-card-header-right">
            {getStatusIcon()}
            <div onClick={(e) => e.stopPropagation()}>
              <RegenerateButton
                onRegenerate={() => {
                  streamingManager.startStreaming(id);    // <-- start streaming here (cardId)
                  onRegenerate?.();
                }}
                isRegenerating={isRegenerating || isLoading}
                canRegenerate={!!onRegenerate}
                sectionName={title}
                size="small"
                hideRegenerateButtons={hideRegenerateButtons}
              />
            </div>
            <button className="modern-expand-btn">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className={`modern-card-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="modern-card-content-inner">
            {(isLoading || isRegenerating) && !hasData ? (
              <div className="loading-placeholder">
                <Loader className="animate-spin" size={24} />
                <p>Generating Insight...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    );
  };

  const CategorySection = ({ id, title, subtitle, icon: IconComponent, children }) => {
    const isCollapsed = collapsedCategories.has(id);

    return (
      <div className="analysis-category">
        <div className="category-header" onClick={() => toggleCategory(id)}>
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <div className="category-title-group">
              <h2 className="category-title">{title}</h2>
              {subtitle && (
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: '500' }}>
                  {subtitle}
                </p>
              )}
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

  const createSimpleRegenerationHandler = (analysisKey) => () => {
    const cardId = analysisKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    streamingManager.startStreaming(cardId);
    if (props.createSimpleRegenerationHandler) {
      props.createSimpleRegenerationHandler(analysisKey)();
    }
  };

  const renderAnalysisCard = (analysisKey, config) => {
    const Component = config.component;
    const dataKey = config.dataKey;
    const refKey = config.refKey;
    const pdfComponent = config.pdfComponent;
    const regeneratingKey = `is${analysisKey.charAt(0).toUpperCase() + analysisKey.slice(1)}Regenerating`;

    const data = props[dataKey];
    const ref = props[refKey];
    const isRegenerating = props[regeneratingKey];
    // Prefer explicit slug to ensure dropdown scrolling matches IDs
    const cardId = config.slug || analysisKey.replace(/([A-Z])/g, '-$1').toLowerCase();

    return (
      <ModernAnalysisCard
        key={analysisKey}
        id={cardId}
        title={config.title}
        description={config.description}
        hasData={!!data}
        onRegenerate={props.createSimpleRegenerationHandler(analysisKey)}
        isRegenerating={isRegenerating}
        isLoading={isAnalysisLoading(analysisKey)}
      >
        <div ref={ref} data-component={pdfComponent}>
          <Component
            questions={props.questions}
            userAnswers={props.userAnswers}
            businessName={props.businessData.name}
            onRegenerate={createSimpleRegenerationHandler(analysisKey)}
            isRegenerating={isRegenerating || isAnalysisLoading(analysisKey)}
            canRegenerate={!props.isAnalysisRegenerating}
            {...{ [dataKey]: data }}
            selectedBusinessId={props.selectedBusinessId}
            onRedirectToBrief={props.handleRedirectToBrief}
            isExpanded={expandedCards.has(cardId)}
            streamingManager={streamingManager}
            cardId={cardId}
            hideImproveButton={props.hideImproveButton}
            showImproveButton={props.showImproveButton}
            readOnly={props.readOnly}
            {...(analysisKey === 'swot' && {
              analysisResult: data,
              onDataGenerated: props.setSwotAnalysisResult,
              saveAnalysisToBackend: (d, type) => props.apiService.saveAnalysisToBackend(d, type, props.selectedBusinessId)
            })}
            {...(analysisKey === 'purchaseCriteria' && {
              onDataGenerated: props.setPurchaseCriteriaData
            })}
            {...(analysisKey === 'loyaltyNPS' && {
              onDataGenerated: props.setLoyaltyNPSData
            })}
            {...(config.category === 'costs-financial' && {
              uploadedFile: props.uploadedFileForAnalysis,
              onRedirectToChat: props.onRedirectToChat,
              isMobile: props.isMobile,
              setActiveTab: props.setActiveTab,
              hasUploadedDocument: props.hasUploadedDocument,
              readOnly: props.readOnly,
              documentInfo: props.documentInfo
            })}
          />
        </div>
      </ModernAnalysisCard>
    );
  };

  const renderModernAnalysisContent = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    if (!unlockedFeatures.analysis) {
      return (
        <div className="modern-locked-state">
          <Lock size={60} className="modern-locked-icon" />
          <h3>Analysis Locked</h3>
          <p>Complete all initial phase questions to unlock your comprehensive business analysis.</p>
        </div>
      );
    }

    const visibleAnalyses = {
      initial: ['swot', 'purchaseCriteria', 'loyaltyNPS', 'porters', 'pestel'],
      essential: ['fullSwot', 'strategicRadar', 'porters', 'pestel', 'competitiveAdvantage', 'purchaseCriteria', 'loyaltyNPS', 'expandedCapability', 'maturityScore', 'competitiveLandscape', 'coreAdjacency', 'productivityMetrics'],
      good: ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk', 'productivityMetrics', 'fullSwot', 'strategicRadar', 'porters', 'pestel', 'competitiveAdvantage', 'purchaseCriteria', 'loyaltyNPS', 'expandedCapability', 'maturityScore', 'competitiveLandscape', 'coreAdjacency']
    };

    let currentAnalyses = visibleAnalyses.initial;
    if (unlockedFeatures.goodPhase) {
      currentAnalyses = visibleAnalyses.good;
    } else if (unlockedFeatures.fullSwot) {
      currentAnalyses = visibleAnalyses.essential;
    }

    const categorizedAnalyses = {};
    CATEGORIES.forEach(cat => {
      categorizedAnalyses[cat.id] = [];
    });

    currentAnalyses.forEach(analysisKey => {
      const config = ANALYSIS_CONFIG[analysisKey];
      if (config) {
        categorizedAnalyses[config.category].push(renderAnalysisCard(analysisKey, config));
      }
    });

    return (
      <div className="modern-analysis-container">
        <div className="modern-analysis-content">
          <div className="categorized-analysis">
            {CATEGORIES.map(category => {
              const analyses = categorizedAnalyses[category.id];
              if (analyses.length === 0) return null;

              return (
                <CategorySection
                  key={category.id}
                  id={category.id}
                  title={category.title}
                  subtitle={category.subtitle}
                  icon={category.icon}
                >
                  {analyses}
                </CategorySection>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return renderModernAnalysisContent();
};

export default AnalysisContentManager;