import React, { useState } from "react";
import {
  Target, Award, TrendingUp, Users, Building, Zap,
  CheckCircle, Loader, Lock, ChevronDown, ChevronUp,
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

const AnalysisContentManager = ({
  phaseManager,
  businessData,
  questions,
  userAnswers,
  selectedBusinessId,
  swotAnalysisResult,
  purchaseCriteriaData,
  loyaltyNPSData,
  portersData,
  pestelData,
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
  setSwotAnalysisResult,
  setPurchaseCriteriaData,
  setLoyaltyNPSData,
  setPortersData,
  setPestelData,
  setFullSwotData,
  setCompetitiveAdvantageData,
  setExpandedCapabilityData,
  setStrategicRadarData,
  setProductivityData,
  setMaturityData,
  setProfitabilityData,
  setGrowthTrackerData,
  setLiquidityEfficiencyData,
  setInvestmentPerformanceData,
  setLeverageRiskData,
  isSwotAnalysisRegenerating,
  isPurchaseCriteriaRegenerating,
  isLoyaltyNPSRegenerating,
  isPortersRegenerating,
  isPestelRegenerating,
  isFullSwotRegenerating,
  isCompetitiveAdvantageRegenerating,
  isExpandedCapabilityRegenerating,
  isStrategicRadarRegenerating,
  isProductivityRegenerating,
  isMaturityRegenerating,
  isProfitabilityRegenerating,
  isGrowthTrackerRegenerating,
  isLiquidityEfficiencyRegenerating,
  isInvestmentPerformanceRegenerating,
  isLeverageRiskRegenerating,
  isAnalysisRegenerating,
  apiLoadingStates = {},
  swotRef,
  purchaseCriteriaRef,
  loyaltyNpsRef,
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
  uploadedFileForAnalysis,
  handleRedirectToBrief,
  showToastMessage,
  apiService,
  createSimpleRegenerationHandler,
  hideRegenerateButtons = false,
  highlightedCard,
  expandedCards,
  setExpandedCards,
  onRedirectToChat,
  isMobile,
  setActiveTab,
  hasUploadedDocument
}) => {
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
    'excel-analysis': 'profitabilityAnalysis',
    'excel-analysis-growth': 'growthTracker',
    'excel-analysis-liquidity': 'liquidityEfficiency',
    'excel-analysis-investment': 'investmentPerformance',
    'excel-analysis-leverage': 'leverageRisk'
  };

  // Category collapse state
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  const isAnalysisLoading = (analysisType) => {
    const excelAnalysisTypes = ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'];

    if (excelAnalysisTypes.includes(analysisType)) {
      return apiLoadingStates['excel-analysis'];
    }

    const relevantEndpoints = Object.entries(API_TO_ANALYSIS_MAP)
      .filter(([endpoint, analysis]) => analysis === analysisType)
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
    icon: IconComponent,
    children,
    onRegenerate,
    isRegenerating = false,
    hasData = false,
    category = 'initial',
    status = 'completed',
    isLoading = false,
  }) => {
    const isExpanded = expandedCards.has(id);
    const isHighlighted = highlightedCard === id;
    const getStatusIcon = () => {
      if (isRegenerating || isLoading) {
        return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
      }

      switch (status) {
        case 'completed':
          return <CheckCircle className="modern-status-icon completed" size={16} />;
        case 'loading':
          return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
        case 'locked':
          return <Lock className="modern-status-icon locked" size={16} />;
        case 'error':
          return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
        default:
          return null;
      }
    };

    const getActualStatus = () => {
      if (isRegenerating || isLoading) return 'loading';
      if (hasData) return 'completed';
      return 'error';
    };

    const actualStatus = getActualStatus();

    return (
      <div className={`modern-analysis-card ${actualStatus} ${isHighlighted ? 'highlighted' : ''}`}>
        <div
          className={`modern-card-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleCard(id)}
        >
          <div className="modern-card-header-left">
            {/* <div className="modern-card-icon">
              <IconComponent size={20} />
            </div> */}
            <div className="modern-card-text">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>

          <div className="modern-card-header-right">
            {getStatusIcon()}

            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
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

  const CategorySection = ({ id, title, icon: IconComponent, children, count = 0 }) => {
    const isCollapsed = collapsedCategories.has(id);

    return (
      <div className="analysis-category">
        <div
          className="category-header"
          onClick={() => toggleCategory(id)}
        >
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <h2 className="category-title">{title}</h2> 
          </div>
          <div className="category-toggle">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="category-grid">
            {children}
          </div>
        </div>
      </div>
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

    const categories = [
      {
        id: 'costs-financial',
        title: 'Costs/Financial',
        icon: TrendingUp,
        analyses: []
      },
      {
        id: 'context-industry',
        title: 'Context/Industry',
        icon: Building,
        analyses: []
      },
      {
        id: 'customer',
        title: 'Customer',
        icon: Users,
        analyses: []
      },
      {
        id: 'capabilities',
        title: 'Capabilities',
        icon: Zap,
        analyses: []
      },
      {
        id: 'competition',
        title: 'Competition',
        icon: Award,
        analyses: []
      },
      {
        id: 'current-strategy',
        title: 'Current Strategy',
        icon: Target,
        analyses: []
      }
    ];

    if (unlockedFeatures.goodPhase) {
      categories[0].analyses.push(
        <ModernAnalysisCard
          key="profitability-analysis"
          id="profitability-analysis"
          title="Profitability Analysis"
          description="Detailed profitability margins with industry benchmark comparisons"
          icon={TrendingUp}
          hasData={!!profitabilityData}
          onRegenerate={createSimpleRegenerationHandler('profitabilityAnalysis')}
          isRegenerating={isProfitabilityRegenerating}
          isLoading={isAnalysisLoading('profitabilityAnalysis')}
          category="good"
        >
          <div ref={profitabilityRef} data-component="profitability-analysis">
            <ProfitabilityAnalysis
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('profitabilityAnalysis')}
              isRegenerating={isProfitabilityRegenerating || isAnalysisLoading('profitabilityAnalysis')}
              canRegenerate={!isAnalysisRegenerating}
              profitabilityData={profitabilityData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToChat={onRedirectToChat}
              isMobile={isMobile}
              setActiveTab={setActiveTab}
              hasUploadedDocument={hasUploadedDocument}
              onRedirectToBrief={handleRedirectToBrief}
              uploadedFile={uploadedFileForAnalysis}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="growth-tracker"
          id="growth-tracker"
          title="Growth Tracker"
          description="Revenue and net income trends with growth pattern analysis"
          icon={TrendingUp}
          hasData={!!growthTrackerData}
          onRegenerate={createSimpleRegenerationHandler('growthTracker')}
          isRegenerating={isGrowthTrackerRegenerating}
          isLoading={isAnalysisLoading('growthTracker')}
          category="good"
        >
          <div ref={growthTrackerRef} data-component="growth-tracker">
            <GrowthTracker
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('growthTracker')}
              isRegenerating={isGrowthTrackerRegenerating || isAnalysisLoading('growthTracker')}
              canRegenerate={!isAnalysisRegenerating}
              growthData={growthTrackerData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              uploadedFile={uploadedFileForAnalysis}
              onRedirectToChat={onRedirectToChat}
              isMobile={isMobile}
              setActiveTab={setActiveTab}
              hasUploadedDocument={hasUploadedDocument}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="liquidity-efficiency"
          id="liquidity-efficiency"
          title="Liquidity & Efficiency"
          description="Financial ratios with gauges and color-coded risk indicators"
          icon={TrendingUp}
          hasData={!!liquidityEfficiencyData}
          onRegenerate={createSimpleRegenerationHandler('liquidityEfficiency')}
          isRegenerating={isLiquidityEfficiencyRegenerating}
          isLoading={isAnalysisLoading('liquidityEfficiency')}
          category="good"
        >
          <div ref={liquidityEfficiencyRef} data-component="liquidity-efficiency">
            <LiquidityEfficiency
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('liquidityEfficiency')}
              isRegenerating={isLiquidityEfficiencyRegenerating || isAnalysisLoading('liquidityEfficiency')}
              canRegenerate={!isAnalysisRegenerating}
              liquidityData={liquidityEfficiencyData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              uploadedFile={uploadedFileForAnalysis}
              onRedirectToChat={onRedirectToChat}
              isMobile={isMobile}
              setActiveTab={setActiveTab}
              hasUploadedDocument={hasUploadedDocument}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="investment-performance"
          id="investment-performance"
          title="Investment Performance"
          description="ROA, ROE, ROIC analysis with benchmark comparisons and trend charts"
          icon={TrendingUp}
          hasData={!!investmentPerformanceData}
          onRegenerate={createSimpleRegenerationHandler('investmentPerformance')}
          isRegenerating={isInvestmentPerformanceRegenerating}
          isLoading={isAnalysisLoading('investmentPerformance')}
          category="good"
        >
          <div ref={investmentPerformanceRef} data-component="investment-performance">
            <InvestmentPerformance
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('investmentPerformance')}
              isRegenerating={isInvestmentPerformanceRegenerating || isAnalysisLoading('investmentPerformance')}
              canRegenerate={!isAnalysisRegenerating}
              investmentData={investmentPerformanceData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              uploadedFile={uploadedFileForAnalysis}
              onRedirectToChat={onRedirectToChat}
              isMobile={isMobile}
              setActiveTab={setActiveTab}
              hasUploadedDocument={hasUploadedDocument}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="leverage-risk"
          id="leverage-risk"
          title="Leverage & Risk"
          description="Financial risk assessment with traffic light risk indicators"
          icon={TrendingUp}
          hasData={!!leverageRiskData}
          onRegenerate={createSimpleRegenerationHandler('leverageRisk')}
          isRegenerating={isLeverageRiskRegenerating}
          isLoading={isAnalysisLoading('leverageRisk')}
          category="good"
        >
          <div ref={leverageRiskRef} data-component="leverage-risk">
            <LeverageRisk
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('leverageRisk')}
              isRegenerating={isLeverageRiskRegenerating || isAnalysisLoading('leverageRisk')}
              canRegenerate={!isAnalysisRegenerating}
              leverageData={leverageRiskData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              uploadedFile={uploadedFileForAnalysis}
              onRedirectToChat={onRedirectToChat}
              isMobile={isMobile}
              setActiveTab={setActiveTab}
              hasUploadedDocument={hasUploadedDocument}
            />
          </div>
        </ModernAnalysisCard>
      );

      if (unlockedFeatures.fullSwot) {
        categories[0].analyses.push(
          <ModernAnalysisCard
            key="productivity"
            id="productivity"
            title="Productivity Metrics"
            description="Analysis of organizational productivity and efficiency metrics"
            icon={TrendingUp}
            hasData={!!productivityData}
            onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
            isRegenerating={isProductivityRegenerating}
            isLoading={isAnalysisLoading('productivityMetrics')}
            category="essential"
          >
            <div ref={productivityRef} data-component="productivity">
              <ProductivityMetrics
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
                isRegenerating={isProductivityRegenerating || isAnalysisLoading('productivityMetrics')}
                canRegenerate={!isAnalysisRegenerating}
                productivityData={productivityData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>
          </ModernAnalysisCard>
        );
      }
    }

    if (unlockedFeatures.fullSwot) {
      categories[1].analyses.push(
        <ModernAnalysisCard
          key="full-swot"
          id="full-swot"
          title="Full SWOT Portfolio"
          description="Comprehensive SWOT analysis with strategic recommendations"
          icon={Building}
          hasData={!!fullSwotData}
          onRegenerate={createSimpleRegenerationHandler('fullSwot')}
          isRegenerating={isFullSwotRegenerating}
          isLoading={isAnalysisLoading('fullSwot')}
          category="essential"
        >
          <div ref={fullSwotRef} data-component="full-swot">
            <FullSWOTPortfolio
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              isRegenerating={isFullSwotRegenerating || isAnalysisLoading('fullSwot')}
              canRegenerate={!isAnalysisRegenerating}
              fullSwotData={fullSwotData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              onRegenerate={createSimpleRegenerationHandler('fullSwot')}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="strategic-radar"
          id="strategic-radar"
          title="Strategic Positioning Radar"
          description="Visual representation of strategic positioning across key dimensions"
          icon={Building}
          hasData={!!strategicRadarData}
          onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
          isRegenerating={isStrategicRadarRegenerating}
          isLoading={isAnalysisLoading('strategicRadar')}
          category="essential"
        >
          <div ref={strategicRadarRef} data-component="strategic-radar">
            <StrategicPositioningRadar
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
              isRegenerating={isStrategicRadarRegenerating || isAnalysisLoading('strategicRadar')}
              canRegenerate={!isAnalysisRegenerating}
              strategicRadarData={strategicRadarData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
            />
          </div>
        </ModernAnalysisCard>
      );
    }

    if (!unlockedFeatures.fullSwot) {
      categories[1].analyses.push(
        <ModernAnalysisCard
          key="swot"
          id="swot"
          title="SWOT Analysis"
          description="Comprehensive strengths, weaknesses, opportunities, and threats analysis"
          icon={Building}
          hasData={!!swotAnalysisResult}
          onRegenerate={createSimpleRegenerationHandler('swot')}
          isRegenerating={isSwotAnalysisRegenerating}
          isLoading={isAnalysisLoading('swot')}
          category="initial"
        >
          <div ref={swotRef} data-component="swot-analysis">
            <SwotAnalysis
              analysisResult={swotAnalysisResult}
              businessName={businessData.name}
              questions={questions}
              userAnswers={userAnswers}
              saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              onDataGenerated={setSwotAnalysisResult}
              onRegenerate={createSimpleRegenerationHandler('swot')}
              isRegenerating={isSwotAnalysisRegenerating || isAnalysisLoading('swot')}
              canRegenerate={!isAnalysisRegenerating}
            />
          </div>
        </ModernAnalysisCard>
      );
    }

    categories[1].analyses.push(
      <ModernAnalysisCard
        key="porters"
        id="porters"
        title="Porter's Five Forces"
        description="Competitive analysis using Porter's strategic framework"
        icon={Building}
        hasData={!!portersData}
        onRegenerate={createSimpleRegenerationHandler('porters')}
        isRegenerating={isPortersRegenerating}
        isLoading={isAnalysisLoading('porters')}
        category="initial"
      >
        <div ref={portersRef} data-component="porters-analysis">
          <PortersFiveForces
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createSimpleRegenerationHandler('porters')}
            isRegenerating={isPortersRegenerating || isAnalysisLoading('porters')}
            canRegenerate={!isAnalysisRegenerating}
            portersData={portersData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>
      </ModernAnalysisCard>,

      <ModernAnalysisCard
        key="pestel"
        id="pestel"
        title="PESTEL Analysis"
        description="External environment analysis covering political, economic, social, technological, environmental, and legal factors"
        icon={Building}
        hasData={!!pestelData}
        onRegenerate={createSimpleRegenerationHandler('pestel')}
        isRegenerating={isPestelRegenerating}
        isLoading={isAnalysisLoading('pestel')}
        category="initial"
      >
        <div ref={pestelRef} data-component="pestel-analysis">
          <PestelAnalysis
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createSimpleRegenerationHandler('pestel')}
            isRegenerating={isPestelRegenerating || isAnalysisLoading('pestel')}
            canRegenerate={!isAnalysisRegenerating}
            pestelData={pestelData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>
      </ModernAnalysisCard>
    );
    if (unlockedFeatures.fullSwot) {
      categories[2].analyses.push(
        <ModernAnalysisCard
          key="competitive-advantage"
          id="competitive-advantage"
          title="Competitive Advantage Matrix"
          description="Analysis of competitive positioning and advantages"
          icon={Users}
          hasData={!!competitiveAdvantageData}
          onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
          isRegenerating={isCompetitiveAdvantageRegenerating}
          isLoading={isAnalysisLoading('competitiveAdvantage')}
          category="essential"
        >
          <div ref={competitiveAdvantageRef} data-component="competitive-advantage">
            <CompetitiveAdvantageMatrix
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              isRegenerating={isCompetitiveAdvantageRegenerating || isAnalysisLoading('competitiveAdvantage')}
              canRegenerate={!isAnalysisRegenerating}
              competitiveAdvantageData={competitiveAdvantageData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
              onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
            />
          </div>
        </ModernAnalysisCard>
      );
    }

    categories[2].analyses.push(
      <ModernAnalysisCard
        key="purchase-criteria"
        id="purchase-criteria"
        title="Purchase Criteria"
        description="Key factors influencing customer buying decisions"
        icon={Users}
        hasData={!!purchaseCriteriaData}
        onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
        isRegenerating={isPurchaseCriteriaRegenerating}
        isLoading={isAnalysisLoading('purchaseCriteria')}
        category="initial"
      >
        <div ref={purchaseCriteriaRef} data-component="purchase-criteria">
          <PurchaseCriteria
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setPurchaseCriteriaData}
            onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
            isRegenerating={isPurchaseCriteriaRegenerating || isAnalysisLoading('purchaseCriteria')}
            canRegenerate={!isAnalysisRegenerating}
            purchaseCriteriaData={purchaseCriteriaData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>
      </ModernAnalysisCard>,

      <ModernAnalysisCard
        key="loyalty-nps"
        id="loyalty-nps"
        title="Loyalty & NPS"
        description="Customer loyalty metrics and Net Promoter Score analysis"
        icon={Users}
        hasData={!!loyaltyNPSData}
        onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
        isRegenerating={isLoyaltyNPSRegenerating}
        isLoading={isAnalysisLoading('loyaltyNPS')}
        category="initial"
      >
        <div ref={loyaltyNpsRef} data-component="loyalty-nps">
          <LoyaltyNPS
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setLoyaltyNPSData}
            onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
            isRegenerating={isLoyaltyNPSRegenerating || isAnalysisLoading('loyaltyNPS')}
            canRegenerate={!isAnalysisRegenerating}
            loyaltyNPSData={loyaltyNPSData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>
      </ModernAnalysisCard>
    );

    if (unlockedFeatures.fullSwot) {
      categories[3].analyses.push(
        <ModernAnalysisCard
          key="expanded-capability"
          id="expanded-capability"
          title="Capability Heatmap"
          description="Advanced organizational capability analysis"
          icon={Zap}
          hasData={!!expandedCapabilityData}
          onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
          isRegenerating={isExpandedCapabilityRegenerating}
          isLoading={isAnalysisLoading('expandedCapability')}
          category="essential"
        >
          <div ref={expandedCapabilityRef} data-component="expanded-capability">
            <ExpandedCapabilityHeatmap
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
              isRegenerating={isExpandedCapabilityRegenerating || isAnalysisLoading('expandedCapability')}
              canRegenerate={!isAnalysisRegenerating}
              expandedCapabilityData={expandedCapabilityData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
            />
          </div>
        </ModernAnalysisCard>,

        <ModernAnalysisCard
          key="maturity"
          id="maturity"
          title="Maturity Score"
          description="Business maturity assessment and scoring"
          icon={Zap}
          hasData={!!maturityData}
          onRegenerate={createSimpleRegenerationHandler('maturityScore')}
          isRegenerating={isMaturityRegenerating}
          isLoading={isAnalysisLoading('maturityScore')}
          category="essential"
        >
          <div ref={maturityScoreRef} data-component="maturity">
            <MaturityScoreLight
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createSimpleRegenerationHandler('maturityScore')}
              isRegenerating={isMaturityRegenerating || isAnalysisLoading('maturityScore')}
              canRegenerate={!isAnalysisRegenerating}
              maturityData={maturityData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
            />
          </div>
        </ModernAnalysisCard>
      );
    }

    return (
      <div className="modern-analysis-container">
        <div className="modern-analysis-content">
          <div className="categorized-analysis">
            {categories.map(category => {
              const analysisCount = category.analyses.length;
              if (analysisCount === 0) return null;

              return (
                <CategorySection
                  key={category.id}
                  id={category.id}
                  title={category.title}
                  icon={category.icon}
                  count={analysisCount}
                >
                  {category.analyses}
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