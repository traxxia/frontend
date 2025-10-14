import React from "react";
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

const ANALYSIS_CONFIG = {
  swot: {
    component: SwotAnalysis,
    title: "SWOT Analysis",
    description: "Comprehensive strengths, weaknesses, opportunities, and threats analysis",
    category: "context-industry",
    dataKey: "swotAnalysisResult",
    refKey: "swotRef",
    pdfComponent: "swot-analysis"
  },
  profitabilityAnalysis: {
    component: ProfitabilityAnalysis,
    title: "Profitability Analysis",
    description: "Detailed profitability margins with industry benchmark comparisons",
    category: "costs-financial",
    dataKey: "profitabilityData",
    refKey: "profitabilityRef",
    pdfComponent: "profitability-analysis"
  },
  growthTracker: {
    component: GrowthTracker,
    title: "Growth Tracker",
    description: "Revenue and net income trends with growth pattern analysis",
    category: "costs-financial",
    dataKey: "growthTrackerData",
    refKey: "growthTrackerRef",
    pdfComponent: "growth-tracker"
  },
  liquidityEfficiency: {
    component: LiquidityEfficiency,
    title: "Liquidity & Efficiency",
    description: "Financial ratios with gauges and color-coded risk indicators",
    category: "costs-financial",
    dataKey: "liquidityEfficiencyData",
    refKey: "liquidityEfficiencyRef",
    pdfComponent: "liquidity-efficiency"
  },
  investmentPerformance: {
    component: InvestmentPerformance,
    title: "Investment Performance",
    description: "ROA, ROE, ROIC analysis with benchmark comparisons and trend charts",
    category: "costs-financial",
    dataKey: "investmentPerformanceData",
    refKey: "investmentPerformanceRef",
    pdfComponent: "investment-performance"
  },
  leverageRisk: {
    component: LeverageRisk,
    title: "Leverage & Risk",
    description: "Financial risk assessment with traffic light risk indicators",
    category: "costs-financial",
    dataKey: "leverageRiskData",
    refKey: "leverageRiskRef",
    pdfComponent: "leverage-risk"
  },
  productivity: {
    component: ProductivityMetrics,
    title: "Productivity Metrics",
    description: "Analysis of organizational productivity and efficiency metrics",
    category: "costs-financial",
    dataKey: "productivityData",
    refKey: "productivityRef",
    pdfComponent: "productivity"
  },
  fullSwot: {
    component: FullSWOTPortfolio,
    title: "Full SWOT Portfolio",
    description: "Comprehensive SWOT analysis with strategic recommendations",
    category: "context-industry",
    dataKey: "fullSwotData",
    refKey: "fullSwotRef",
    pdfComponent: "full-swot"
  },
  strategicRadar: {
    component: StrategicPositioningRadar,
    title: "Strategic Positioning Radar",
    description: "Visual representation of strategic positioning across key dimensions",
    category: "context-industry",
    dataKey: "strategicRadarData",
    refKey: "strategicRadarRef",
    pdfComponent: "strategic-radar"
  },
  porters: {
    component: PortersFiveForces,
    title: "Porter's Five Forces",
    description: "Competitive analysis using Porter's strategic framework",
    category: "context-industry",
    dataKey: "portersData",
    refKey: "portersRef",
    pdfComponent: "porters-analysis"
  },
  pestel: {
    component: PestelAnalysis,
    title: "PESTEL Analysis",
    description: "External environment analysis covering political, economic, social, technological, environmental, and legal factors",
    category: "context-industry",
    dataKey: "pestelData",
    refKey: "pestelRef",
    pdfComponent: "pestel-analysis"
  },
  competitiveAdvantage: {
    component: CompetitiveAdvantageMatrix,
    title: "Competitive Advantage Matrix",
    description: "Analysis of competitive positioning and advantages",
    category: "customer",
    dataKey: "competitiveAdvantageData",
    refKey: "competitiveAdvantageRef",
    pdfComponent: "competitive-advantage"
  },
  purchaseCriteria: {
    component: PurchaseCriteria,
    title: "Purchase Criteria",
    description: "Key factors influencing customer buying decisions",
    category: "customer",
    dataKey: "purchaseCriteriaData",
    refKey: "purchaseCriteriaRef",
    pdfComponent: "purchase-criteria"
  },
  loyaltyNPS: {
    component: LoyaltyNPS,
    title: "Loyalty & NPS",
    description: "Customer loyalty metrics and Net Promoter Score analysis",
    category: "customer",
    dataKey: "loyaltyNPSData",
    refKey: "loyaltyNpsRef",
    pdfComponent: "loyalty-nps"
  },
  expandedCapability: {
    component: ExpandedCapabilityHeatmap,
    title: "Capability Heatmap",
    description: "Advanced organizational capability analysis",
    category: "capabilities",
    dataKey: "expandedCapabilityData",
    refKey: "expandedCapabilityRef",
    pdfComponent: "expanded-capability"
  },
  maturity: {
    component: MaturityScoreLight,
    title: "Maturity Score",
    description: "Business maturity assessment and scoring",
    category: "capabilities",
    dataKey: "maturityData",
    refKey: "maturityScoreRef",
    pdfComponent: "maturity"
  },
  competitiveLandscape: {
    component: CompetitiveLandscape,
    title: "Competitive Landscape",
    description: "Comprehensive analysis of key competitors using SWOT framework",
    category: "competition",
    dataKey: "competitiveLandscapeData",
    refKey: "competitiveLandscapeRef",
    pdfComponent: "competitive-landscape"
  },
  coreAdjacency: {
    component: CoreAdjacency,
    title: "Core",
    description: "Strategic analysis of core business areas and adjacent growth opportunities",
    category: "current-strategy",
    dataKey: "coreAdjacencyData",
    refKey: "coreAdjacencyRef",
    pdfComponent: "core-adjacency"
  }
};

const CATEGORIES = [
  {
    id: 'costs-financial',
    title: 'Costs/Financial',
    subtitle: 'Financial performance, profitability, and resource efficiency metrics',
    icon: TrendingUp
  },
  {
    id: 'context-industry',
    title: 'Context/Industry',
    subtitle: 'External environment, market forces, and industry dynamics',
    icon: Building
  },
  {
    id: 'customer',
    title: 'Customer',
    subtitle: 'Customer behavior, loyalty, and purchase decision factors',
    icon: Users
  },
  {
    id: 'capabilities',
    title: 'Capabilities',
    subtitle: 'Organizational strengths, maturity, and operational capabilities',
    icon: Zap
  },
  {
    id: 'competition',
    title: 'Competition',
    subtitle: 'Competitive landscape and market positioning analysis',
    icon: Award
  },
  {
    id: 'current-strategy',
    title: 'Current Strategy',
    subtitle: 'Strategic focus areas and growth opportunities',
    icon: Target
  }
];

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
  'productivity-metrics': 'productivity',
  'maturity-scoring': 'maturity',
  'simple-swot-portfolio': 'competitiveLandscape',
  'core-adjacency': 'coreAdjacency',
  'excel-analysis': 'profitabilityAnalysis',
  'excel-analysis-growth': 'growthTracker',
  'excel-analysis-liquidity': 'liquidityEfficiency',
  'excel-analysis-investment': 'investmentPerformance',
  'excel-analysis-leverage': 'leverageRisk'
};

const AnalysisContentManager = (props) => {
  const {
    phaseManager,
    apiLoadingStates = {},
    expandedCards,
    setExpandedCards,
    collapsedCategories,
    setCollapsedCategories,
    highlightedCard,
    hideRegenerateButtons = false
  } = props;

  const isAnalysisLoading = (analysisType) => {
    const excelAnalysisTypes = ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'];

    if (excelAnalysisTypes.includes(analysisType)) {
      const apiKeyMap = {
        'profitabilityAnalysis': 'excel-analysis',
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
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
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
                onRegenerate={onRegenerate}
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
                <p>Generating analysis...</p>
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

  const renderAnalysisCard = (analysisKey, config) => {
    const Component = config.component;
    const dataKey = config.dataKey;
    const refKey = config.refKey;
    const pdfComponent = config.pdfComponent;
    const regeneratingKey = `is${analysisKey.charAt(0).toUpperCase() + analysisKey.slice(1)}Regenerating`;

    const data = props[dataKey];
    const ref = props[refKey];
    const isRegenerating = props[regeneratingKey];

    return (
      <ModernAnalysisCard
        key={analysisKey}
        id={analysisKey.replace(/([A-Z])/g, '-$1').toLowerCase()}
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
            onRegenerate={props.createSimpleRegenerationHandler(analysisKey)}
            isRegenerating={isRegenerating || isAnalysisLoading(analysisKey)}
            canRegenerate={!props.isAnalysisRegenerating}
            {...{ [dataKey]: data }}
            selectedBusinessId={props.selectedBusinessId}
            onRedirectToBrief={props.handleRedirectToBrief}
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
      essential: ['fullSwot', 'strategicRadar', 'porters', 'pestel', 'competitiveAdvantage', 'purchaseCriteria', 'loyaltyNPS', 'expandedCapability', 'maturity', 'competitiveLandscape', 'coreAdjacency', 'productivity'],
      good: ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk', 'productivity', 'fullSwot', 'strategicRadar', 'porters', 'pestel', 'competitiveAdvantage', 'purchaseCriteria', 'loyaltyNPS', 'expandedCapability', 'maturity', 'competitiveLandscape', 'coreAdjacency']
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