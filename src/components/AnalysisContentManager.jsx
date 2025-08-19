import React, { useState } from "react";
import { 
  Target, Award, TrendingDown, TrendingUp, DollarSign, Zap, 
  CheckCircle, Loader, Lock, ChevronDown, ChevronUp, AlertCircle, XCircle 
} from "lucide-react";

// Import all analysis components
import SwotAnalysis from "./SwotAnalysis";
import CustomerSegmentation from "./CustomerSegmentation";
import PurchaseCriteria from "./PurchaseCriteria";
import ChannelHeatmap from "./ChannelHeatmap";
import LoyaltyNPS from "./LoyaltyNPS";
import CapabilityHeatmap from "./CapabilityHeatmap";
import PortersFiveForces from "./PortersFiveForces";
import PestelAnalysis from "./PestelAnalysis";
import FullSWOTPortfolio from "./FullSWOTPortfolio";
import CompetitiveAdvantageMatrix from "./CompetitiveAdvantageMatrix";
import ChannelEffectivenessMap from "./ChannelEffectivenessMap";
import ExpandedCapabilityHeatmap from "./ExpandedCapabilityHeatmap";
import StrategicGoals from "./StrategicGoals";
import StrategicPositioningRadar from "./StrategicPositioningRadar";
import OrganizationalCultureProfile from "./OrganizationalCultureProfile";
import ProductivityMetrics from "./ProductivityMetrics";
import MaturityScoreLight from "./MaturityScoreLight";
import CostEfficiencyInsight from "./CostEfficiencyInsight";
import FinancialPerformance from "./FinancialPerformance";
import FinancialBalanceInsight from "./FinancialBalanceInsight";
import OperationalEfficiencyInsight from "./OperationalEfficiencyInsight";
import RegenerateButton from "./RegenerateButton";

const AnalysisContentManager = ({
  // Phase Manager
  phaseManager,
  
  // Business Data
  businessData,
  questions,
  userAnswers,
  selectedBusinessId,
  
  // Analysis Data States
  swotAnalysisResult,
  customerSegmentationData,
  purchaseCriteriaData,
  channelHeatmapData,
  loyaltyNPSData,
  capabilityHeatmapData,
  strategicData,
  portersData,
  pestelData,
  fullSwotData,
  competitiveAdvantageData,
  channelEffectivenessData,
  expandedCapabilityData,
  strategicGoalsData,
  strategicRadarData,
  cultureProfileData,
  productivityData,
  maturityData,
  costEfficiencyData,
  financialPerformanceData,
  financialBalanceData,
  operationalEfficiencyData,
  
  // Data Setters
  setSwotAnalysisResult,
  setCustomerSegmentationData,
  setPurchaseCriteriaData,
  setChannelHeatmapData,
  setLoyaltyNPSData,
  setCapabilityHeatmapData,
  setPortersData,
  setPestelData,
  setFullSwotData,
  setCompetitiveAdvantageData,
  setChannelEffectivenessData,
  setExpandedCapabilityData,
  setStrategicGoalsData,
  setStrategicRadarData,
  setCultureProfileData,
  setProductivityData,
  setMaturityData,
  setCostEfficiencyData,
  setFinancialPerformanceData,
  setFinancialBalanceData,
  setOperationalEfficiencyData,
  
  // Regenerating States
  isSwotAnalysisRegenerating,
  isCustomerSegmentationRegenerating,
  isPurchaseCriteriaRegenerating,
  isChannelHeatmapRegenerating,
  isLoyaltyNPSRegenerating,
  isCapabilityHeatmapRegenerating,
  isPortersRegenerating,
  isPestelRegenerating,
  isFullSwotRegenerating,
  isCompetitiveAdvantageRegenerating,
  isChannelEffectivenessRegenerating,
  isExpandedCapabilityRegenerating,
  isStrategicGoalsRegenerating,
  isStrategicRadarRegenerating,
  isCultureProfileRegenerating,
  isProductivityRegenerating,
  isMaturityRegenerating,
  isCostEfficiencyRegenerating,
  isFinancialPerformanceRegenerating,
  isFinancialBalanceRegenerating,
  isOperationalEfficiencyRegenerating,
  
  // Other States
  isAnalysisRegenerating,
  isChannelHeatmapReady,
  setIsChannelHeatmapReady,
  isCapabilityHeatmapReady,
  setIsCapabilityHeatmapReady,
  
  // API Loading States - NEW
  apiLoadingStates = {},
  
  // Refs
  swotRef,
  customerSegmentationRef,
  purchaseCriteriaRef,
  channelHeatmapRef,
  loyaltyNpsRef,
  capabilityHeatmapRef,
  portersRef,
  pestelRef,
  fullSwotRef,
  competitiveAdvantageRef,
  channelEffectivenessRef,
  expandedCapabilityRef,
  strategicGoalsRef,
  strategicRadarRef,
  cultureProfileRef,
  productivityRef,
  maturityScoreRef,
  costEfficiencyRef,
  financialPerformanceRef,
  financialBalanceRef,
  operationalEfficiencyRef,
  
  // Handlers
  handleRedirectToBrief,
  showToastMessage,
  apiService,
  createSimpleRegenerationHandler,
  hideRegenerateButtons = false,
}) => {
  // Local state for expand/collapse functionality
  const [expandedCards, setExpandedCards] = useState(new Set());

  // API to Analysis mapping - NEW
  const API_TO_ANALYSIS_MAP = {
    'find': 'swot',
    'purchase-criteria': 'purchaseCriteria',
    'channel-heatmap': 'channelHeatmap',
    'loyalty-metrics': 'loyaltyNPS',
    'capability-heatmap': 'capabilityHeatmap',
    'porter-analysis': 'porters',
    'pestel-analysis': 'pestel',
    'full-swot-portfolio': 'fullSwot',
    'customer-segment': 'customerSegmentation',
    'competitive-advantage': 'competitiveAdvantage',
    'channel-effectiveness': 'channelEffectiveness',
    'expanded-capability-heatmap': 'expandedCapability',
    'strategic-goals': 'strategicGoals',
    'strategic-positioning-radar': 'strategicRadar',
    'culture-profile': 'cultureProfile',
    'productivity-metrics': 'productivityMetrics',
    'maturity-scoring': 'maturityScore',
    'cost-efficiency-competitive-position': 'costEfficiency',
    'financial-performance': 'financialPerformance',
    'financial-health': 'financialHealth',
    'operational-efficiency': 'operationalEfficiency'
  };

  // Helper function to check if a specific analysis is loading - NEW
  const isAnalysisLoading = (analysisType) => {
    const relevantEndpoints = Object.entries(API_TO_ANALYSIS_MAP)
      .filter(([endpoint, analysis]) => analysis === analysisType)
      .map(([endpoint]) => endpoint);
    
    return relevantEndpoints.some(endpoint => apiLoadingStates[endpoint]);
  };

  // Toggle functions for expand/collapse
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
    status = 'completed', // 'completed', 'loading', 'locked', 'error'
    isLoading = false // NEW - API loading state
  }) => {
    const isExpanded = expandedCards.has(id);

    const getStatusIcon = () => {
      // If currently regenerating OR API loading, always show loading spinner - UPDATED
      if (isRegenerating || isLoading) {
        return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
      }

      // Otherwise, show status based on the current state
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

    // Determine the actual status based on data and regenerating state - UPDATED
    const getActualStatus = () => {
      if (isRegenerating || isLoading) return 'loading';
      if (hasData) return 'completed';
      return 'error';
    };

    const actualStatus = getActualStatus();

    return (
      <div className={`modern-analysis-card ${actualStatus}`}>
        <div
          className={`modern-card-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleCard(id)}
        >
          <div className="modern-card-header-left">
            <div className="modern-card-icon">
              <IconComponent size={20} />
            </div>
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
                isRegenerating={isRegenerating || isLoading} // UPDATED - disable during API loading
                canRegenerate={actualStatus === 'completed' && hasData && onRegenerate}
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
            {/* Show loading placeholder when API is loading and no data exists - NEW */}
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

    return (
      <div className="modern-analysis-container">
        <div className="modern-analysis-content">
          <div className="modern-analysis-grid">
            {/* SWOT Analysis Card - Only show if essential phase is not unlocked */}
            {!unlockedFeatures.fullSwot && (
              <ModernAnalysisCard
                id="swot"
                title="SWOT Analysis"
                description="Comprehensive strengths, weaknesses, opportunities, and threats analysis"
                icon={Target}
                hasData={!!swotAnalysisResult}
                onRegenerate={createSimpleRegenerationHandler('swot')}
                isRegenerating={isSwotAnalysisRegenerating}
                isLoading={isAnalysisLoading('swot')} // NEW - API loading check
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
                    isRegenerating={isSwotAnalysisRegenerating || isAnalysisLoading('swot')} // UPDATED
                    canRegenerate={!isAnalysisRegenerating}
                  />
                </div>
              </ModernAnalysisCard>
            )}

            {/* Purchase Criteria Card */}
            <ModernAnalysisCard
              id="purchase-criteria"
              title="Purchase Criteria"
              description="Key factors influencing customer buying decisions"
              icon={Target}
              hasData={!!purchaseCriteriaData}
              onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
              isRegenerating={isPurchaseCriteriaRegenerating}
              isLoading={isAnalysisLoading('purchaseCriteria')} // NEW
              category="initial"
            >
              <div ref={purchaseCriteriaRef} data-component="purchase-criteria" >
                <PurchaseCriteria
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={setPurchaseCriteriaData}
                  onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
                  isRegenerating={isPurchaseCriteriaRegenerating || isAnalysisLoading('purchaseCriteria')} // UPDATED
                  canRegenerate={!isAnalysisRegenerating}
                  purchaseCriteriaData={purchaseCriteriaData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Channel Heatmap Card */}
            <ModernAnalysisCard
              id="channel-heatmap"
              title="Channel Heatmap"
              description="Visual representation of channel effectiveness and reach"
              icon={Target}
              hasData={!!channelHeatmapData}
              onRegenerate={createSimpleRegenerationHandler('channelHeatmap')}
              isRegenerating={isChannelHeatmapRegenerating}
              isLoading={isAnalysisLoading('channelHeatmap')} // NEW
              category="initial"
            >
              <div ref={channelHeatmapRef} data-component="channel-heatmap">
                <ChannelHeatmap
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={(data) => {
                    setChannelHeatmapData(data);
                    if (data && data.matrix && data.matrix.length > 0) {
                      setIsChannelHeatmapReady(true);
                    }
                  }}
                  onRegenerate={createSimpleRegenerationHandler('channelHeatmap')}
                  isRegenerating={isChannelHeatmapRegenerating || isAnalysisLoading('channelHeatmap')} // UPDATED
                  canRegenerate={!isAnalysisRegenerating}
                  channelHeatmapData={channelHeatmapData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Loyalty NPS Card */}
            <ModernAnalysisCard
              id="loyalty-nps"
              title="Loyalty & NPS"
              description="Customer loyalty metrics and Net Promoter Score analysis"
              icon={Target}
              hasData={!!loyaltyNPSData}
              onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
              isRegenerating={isLoyaltyNPSRegenerating}
              isLoading={isAnalysisLoading('loyaltyNPS')} // NEW
              category="initial"
            >
              <div ref={loyaltyNpsRef} data-component="loyalty-nps">
                <LoyaltyNPS
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={setLoyaltyNPSData}
                  onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
                  isRegenerating={isLoyaltyNPSRegenerating || isAnalysisLoading('loyaltyNPS')} // UPDATED
                  canRegenerate={!isAnalysisRegenerating}
                  loyaltyNPSData={loyaltyNPSData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Capability Heatmap Card - Only show if essential phase is not unlocked */}
            {!unlockedFeatures.fullSwot && (
              <ModernAnalysisCard
                id="capability-heatmap"
                title="Capability Heatmap"
                description="Visual analysis of organizational capabilities and strengths"
                icon={Target}
                hasData={!!capabilityHeatmapData}
                onRegenerate={createSimpleRegenerationHandler('capabilityHeatmap')}
                isRegenerating={isCapabilityHeatmapRegenerating}
                isLoading={isAnalysisLoading('capabilityHeatmap')} // NEW
                category="initial"
              >
                <div ref={capabilityHeatmapRef} data-component="capability-heatmap">
                  <CapabilityHeatmap
                    questions={questions}
                    userAnswers={userAnswers}
                    businessName={businessData.name}
                    onDataGenerated={(data) => {
                      setCapabilityHeatmapData(data);
                      if (data && data.capabilities && data.capabilities.length > 0) {
                        setIsCapabilityHeatmapReady(true);
                      }
                    }}
                    onRegenerate={createSimpleRegenerationHandler('capabilityHeatmap')}
                    isRegenerating={isCapabilityHeatmapRegenerating || isAnalysisLoading('capabilityHeatmap')} // UPDATED
                    canRegenerate={!isAnalysisRegenerating}
                    capabilityHeatmapData={capabilityHeatmapData}
                    selectedBusinessId={selectedBusinessId}
                    onRedirectToBrief={handleRedirectToBrief}
                  />
                </div>
              </ModernAnalysisCard>
            )}

            {/* Porter's Five Forces Card */}
            <ModernAnalysisCard
              id="porters"
              title="Porter's Five Forces"
              description="Competitive analysis using Porter's strategic framework"
              icon={Target}
              hasData={!!portersData}
              onRegenerate={createSimpleRegenerationHandler('porters')}
              isRegenerating={isPortersRegenerating}
              isLoading={isAnalysisLoading('porters')} // NEW
              category="initial"
            >
              <div ref={portersRef} data-component="porters-analysis">
                <PortersFiveForces
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onRegenerate={createSimpleRegenerationHandler('porters')}
                  isRegenerating={isPortersRegenerating || isAnalysisLoading('porters')} // UPDATED
                  canRegenerate={!isAnalysisRegenerating}
                  portersData={portersData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* PESTEL Analysis Card */}
            <ModernAnalysisCard
              id="pestel"
              title="PESTEL Analysis"
              description="External environment analysis covering political, economic, social, technological, environmental, and legal factors"
              icon={Target}
              hasData={!!pestelData}
              onRegenerate={createSimpleRegenerationHandler('pestel')}
              isRegenerating={isPestelRegenerating}
              isLoading={isAnalysisLoading('pestel')} // NEW
              category="initial"
            >
              <div ref={pestelRef} data-component="pestel-analysis">
                <PestelAnalysis
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onRegenerate={createSimpleRegenerationHandler('pestel')}
                  isRegenerating={isPestelRegenerating || isAnalysisLoading('pestel')} // UPDATED
                  canRegenerate={!isAnalysisRegenerating}
                  pestelData={pestelData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Essential Phase Components - Show only if unlocked */}
            {unlockedFeatures.fullSwot && (
              <>
                {/* Full SWOT Portfolio Card */}
                <ModernAnalysisCard
                  id="full-swot"
                  title="Full SWOT Portfolio"
                  description="Comprehensive SWOT analysis with strategic recommendations"
                  icon={Award}
                  hasData={!!fullSwotData}
                  onRegenerate={createSimpleRegenerationHandler('fullSwot')}
                  isRegenerating={isFullSwotRegenerating}
                  isLoading={isAnalysisLoading('fullSwot')} // NEW
                  category="essential"
                >
                  <div ref={fullSwotRef} data-component="full-swot">
                    <FullSWOTPortfolio
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      isRegenerating={isFullSwotRegenerating || isAnalysisLoading('fullSwot')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      fullSwotData={fullSwotData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      onRegenerate={createSimpleRegenerationHandler('fullSwot')}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Customer Segmentation Card */}
                <ModernAnalysisCard
                  id="customer-segmentation"
                  title="Customer Segmentation"
                  description="Detailed analysis of customer segments and personas"
                  icon={Award}
                  hasData={!!customerSegmentationData}
                  onRegenerate={createSimpleRegenerationHandler('customerSegmentation')}
                  isRegenerating={isCustomerSegmentationRegenerating}
                  isLoading={isAnalysisLoading('customerSegmentation')} // NEW
                  category="essential"
                >
                  <div ref={customerSegmentationRef} data-component="customer-segmentation">
                    <CustomerSegmentation
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onDataGenerated={setCustomerSegmentationData}
                      onRegenerate={createSimpleRegenerationHandler('customerSegmentation')}
                      isRegenerating={isCustomerSegmentationRegenerating || isAnalysisLoading('customerSegmentation')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      customerSegmentationData={customerSegmentationData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Competitive Advantage Card */}
                <ModernAnalysisCard
                  id="competitive-advantage"
                  title="Competitive Advantage Matrix"
                  description="Analysis of competitive positioning and advantages"
                  icon={Award}
                  hasData={!!competitiveAdvantageData}
                  onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
                  isRegenerating={isCompetitiveAdvantageRegenerating}
                  isLoading={isAnalysisLoading('competitiveAdvantage')} // NEW
                  category="essential"
                >
                  <div ref={competitiveAdvantageRef} data-component="competitive-advantage">
                    <CompetitiveAdvantageMatrix
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      isRegenerating={isCompetitiveAdvantageRegenerating || isAnalysisLoading('competitiveAdvantage')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      competitiveAdvantageData={competitiveAdvantageData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Channel Effectiveness Card */}
                <ModernAnalysisCard
                  id="channel-effectiveness"
                  title="Channel Effectiveness Map"
                  description="Analysis of channel performance and effectiveness"
                  icon={Award}
                  hasData={!!channelEffectivenessData}
                  onRegenerate={createSimpleRegenerationHandler('channelEffectiveness')}
                  isRegenerating={isChannelEffectivenessRegenerating}
                  isLoading={isAnalysisLoading('channelEffectiveness')} // NEW
                  category="essential"
                >
                  <div ref={channelEffectivenessRef} data-component="channel-effectiveness">
                    <ChannelEffectivenessMap
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('channelEffectiveness')}
                      isRegenerating={isChannelEffectivenessRegenerating || isAnalysisLoading('channelEffectiveness')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      channelEffectivenessData={channelEffectivenessData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief} 
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Expanded Capability Heatmap Card */}
                <ModernAnalysisCard
                  id="expanded-capability"
                  title="Expanded Capability Heatmap"
                  description="Advanced organizational capability analysis"
                  icon={Award}
                  hasData={!!expandedCapabilityData}
                  onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
                  isRegenerating={isExpandedCapabilityRegenerating}
                  isLoading={isAnalysisLoading('expandedCapability')} // NEW
                  category="essential"
                >
                  <div ref={expandedCapabilityRef} data-component="expanded-capability">
                    <ExpandedCapabilityHeatmap
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
                      isRegenerating={isExpandedCapabilityRegenerating || isAnalysisLoading('expandedCapability')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      expandedCapabilityData={expandedCapabilityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Strategic Goals Card */}
                <ModernAnalysisCard
                  id="strategic-goals"
                  title="Strategic Goals"
                  description="Strategic goal setting and planning framework"
                  icon={Award}
                  hasData={!!strategicGoalsData}
                  onRegenerate={createSimpleRegenerationHandler('strategicGoals')}
                  isRegenerating={isStrategicGoalsRegenerating}
                  isLoading={isAnalysisLoading('strategicGoals')} // NEW
                  category="essential"
                >
                  <div ref={strategicGoalsRef} data-component="strategic-goals">
                    <StrategicGoals
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('strategicGoals')}
                      isRegenerating={isStrategicGoalsRegenerating || isAnalysisLoading('strategicGoals')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      strategicGoalsData={strategicGoalsData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Strategic Positioning Radar Card */}
                <ModernAnalysisCard
                  id="strategic-radar"
                  title="Strategic Positioning Radar"
                  description="Visual representation of strategic positioning across key dimensions"
                  icon={Award}
                  hasData={!!strategicRadarData}
                  onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
                  isRegenerating={isStrategicRadarRegenerating}
                  isLoading={isAnalysisLoading('strategicRadar')} // NEW
                  category="essential"
                >
                  <div ref={strategicRadarRef} data-component="strategic-radar">
                    <StrategicPositioningRadar
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
                      isRegenerating={isStrategicRadarRegenerating || isAnalysisLoading('strategicRadar')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      strategicRadarData={strategicRadarData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Organizational Culture Profile Card */}
                <ModernAnalysisCard
                  id="culture-profile"
                  title="Organizational Culture Profile"
                  description="Analysis of organizational culture and values"
                  icon={Award}
                  hasData={!!cultureProfileData}
                  onRegenerate={createSimpleRegenerationHandler('cultureProfile')}
                  isRegenerating={isCultureProfileRegenerating}
                  isLoading={isAnalysisLoading('cultureProfile')} // NEW
                  category="essential"
                >
                  <div ref={cultureProfileRef} data-component="culture-profile">
                    <OrganizationalCultureProfile
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('cultureProfile')}
                      isRegenerating={isCultureProfileRegenerating || isAnalysisLoading('cultureProfile')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      cultureProfileData={cultureProfileData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Productivity Metrics Card */}
                <ModernAnalysisCard
                  id="productivity"
                  title="Productivity Metrics"
                  description="Analysis of organizational productivity and efficiency metrics"
                  icon={Award}
                  hasData={!!productivityData}
                  onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
                  isRegenerating={isProductivityRegenerating}
                  isLoading={isAnalysisLoading('productivityMetrics')} // NEW
                  category="essential"
                >
                  <div ref={productivityRef} data-component="productivity">
                    <ProductivityMetrics
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
                      isRegenerating={isProductivityRegenerating || isAnalysisLoading('productivityMetrics')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      productivityData={productivityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief} 
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Maturity Score Card */}
                <ModernAnalysisCard
                  id="maturity"
                  title="Maturity Score"
                  description="Business maturity assessment and scoring"
                  icon={Award}
                  hasData={!!maturityData}
                  onRegenerate={createSimpleRegenerationHandler('maturityScore')}
                  isRegenerating={isMaturityRegenerating}
                  isLoading={isAnalysisLoading('maturityScore')} // NEW
                  category="essential"
                >
                  <div ref={maturityScoreRef} data-component="maturity">
                    <MaturityScoreLight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('maturityScore')}
                      isRegenerating={isMaturityRegenerating || isAnalysisLoading('maturityScore')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      maturityData={maturityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>
              </>
            )}

            {/* Good Phase Components - Show only if unlocked */}
            {unlockedFeatures.goodPhase && (
              <>
                {/* Cost Efficiency Insight Card */}
                <ModernAnalysisCard
                  id="cost-efficiency"
                  title="Cost Efficiency Insight"
                  description="Unit economics and cost optimization analysis"
                  icon={TrendingDown}
                  hasData={!!costEfficiencyData}
                  onRegenerate={createSimpleRegenerationHandler('costEfficiency')}
                  isRegenerating={isCostEfficiencyRegenerating}
                  isLoading={isAnalysisLoading('costEfficiency')} // NEW
                  category="good"
                >
                  <div ref={costEfficiencyRef} data-component="cost-efficiency">
                    <CostEfficiencyInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('costEfficiency')}
                      isRegenerating={isCostEfficiencyRegenerating || isAnalysisLoading('costEfficiency')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      costEfficiencyData={costEfficiencyData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Financial Performance Card */}
                <ModernAnalysisCard
                  id="financial-performance"
                  title="Financial Performance & Growth Trajectory"
                  description="Multi-line chart with growth rate indicators and financial metrics analysis"
                  icon={TrendingUp}
                  hasData={!!financialPerformanceData}
                  onRegenerate={createSimpleRegenerationHandler('financialPerformance')}
                  isRegenerating={isFinancialPerformanceRegenerating}
                  isLoading={isAnalysisLoading('financialPerformance')} // NEW
                  category="good"
                >
                  <div ref={financialPerformanceRef} data-component="financial-performance">
                    <FinancialPerformance
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('financialPerformance')}
                      isRegenerating={isFinancialPerformanceRegenerating || isAnalysisLoading('financialPerformance')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      financialPerformanceData={financialPerformanceData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Financial Health Insight Card */}
                <ModernAnalysisCard
                  id="financial-health"
                  title="Financial Health Insight"
                  description="Balance sheet analysis with financial ratios and innovation investment tracking"
                  icon={DollarSign}
                  hasData={!!financialBalanceData}
                  onRegenerate={createSimpleRegenerationHandler('financialHealth')}
                  isRegenerating={isFinancialBalanceRegenerating}
                  isLoading={isAnalysisLoading('financialHealth')} // NEW
                  category="good"
                >
                  <div ref={financialBalanceRef} data-component="financial-health">
                    <FinancialBalanceInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('financialHealth')}
                      isRegenerating={isFinancialBalanceRegenerating || isAnalysisLoading('financialHealth')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      financialBalanceData={financialBalanceData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Operational Efficiency Insight Card */}
                <ModernAnalysisCard
                  id="operational-efficiency"
                  title="Operational Efficiency Insight"
                  description="Resource utilization analysis with capability performance and efficiency trends"
                  icon={Zap}
                  hasData={!!operationalEfficiencyData}
                  onRegenerate={createSimpleRegenerationHandler('operationalEfficiency')}
                  isRegenerating={isOperationalEfficiencyRegenerating}
                  isLoading={isAnalysisLoading('operationalEfficiency')} // NEW
                  category="good"
                >
                  <div ref={operationalEfficiencyRef} data-component="operational-efficiency">
                    <OperationalEfficiencyInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('operationalEfficiency')}
                      isRegenerating={isOperationalEfficiencyRegenerating || isAnalysisLoading('operationalEfficiency')} // UPDATED
                      canRegenerate={!isAnalysisRegenerating}
                      operationalEfficiencyData={operationalEfficiencyData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>
              </>
            )}

          </div>
        </div>
      </div>
    );
  };

  return renderModernAnalysisContent();
};

export default AnalysisContentManager;