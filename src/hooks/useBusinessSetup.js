import { useState, useRef } from 'react';

export const useBusinessSetup = (business, selectedBusinessId) => {
  // UI State
  const [activeTab, setActiveTab] = useState(() => {
    const isMobileView = window.innerWidth <= 768;
    return isMobileView ? "chat" : "brief";
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // Data State
  const [questions, setQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [businessData, setBusinessData] = useState({
    name: business?.business_name || "",
    whatWeDo: business?.business_purpose || "",
    products: "",
    targetAudience: "",
    uniqueValue: "",
  });

  // Analysis State
  const [hasAnalysisData, setHasAnalysisData] = useState(false);
  const [isAnalysisRegenerating, setIsAnalysisRegenerating] = useState(false);
  const [swotAnalysisResult, setSwotAnalysisResult] = useState("");
  const [customerSegmentationData, setCustomerSegmentationData] = useState(null);
  const [purchaseCriteriaData, setPurchaseCriteriaData] = useState(null);
  const [channelHeatmapData, setChannelHeatmapData] = useState(null);
  const [loyaltyNPSData, setLoyaltyNPSData] = useState(null);
  const [capabilityHeatmapData, setCapabilityHeatmapData] = useState(null);
  const [strategicData, setStrategicData] = useState(null);
  const [portersData, setPortersData] = useState(null);
  const [pestelData, setPestelData] = useState(null);
  const [fullSwotData, setFullSwotData] = useState(null);
  const [competitiveAdvantageData, setCompetitiveAdvantageData] = useState(null);

  // NEW: Good Phase Analysis State
  const [costEfficiencyData, setCostEfficiencyData] = useState(null);

  // Individual component regenerating states
  const [isSwotAnalysisRegenerating, setIsSwotAnalysisRegenerating] = useState(false);
  const [isCustomerSegmentationRegenerating, setIsCustomerSegmentationRegenerating] = useState(false);
  const [isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating] = useState(false);
  const [isChannelHeatmapRegenerating, setIsChannelHeatmapRegenerating] = useState(false);
  const [isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating] = useState(false);
  const [isCapabilityHeatmapRegenerating, setIsCapabilityHeatmapRegenerating] = useState(false);
  const [isStrategicRegenerating, setIsStrategicRegenerating] = useState(false);
  const [isPortersRegenerating, setIsPortersRegenerating] = useState(false);
  const [isPestelRegenerating, setIsPestelRegenerating] = useState(false);
  const [isFullSwotRegenerating, setIsFullSwotRegenerating] = useState(false);
  const [isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating] = useState(false);
  const [channelEffectivenessData, setChannelEffectivenessData] = useState(null);
  const [isChannelEffectivenessRegenerating, setIsChannelEffectivenessRegenerating] = useState(false);
  const [expandedCapabilityData, setExpandedCapabilityData] = useState(null);
  const [isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating] = useState(false);
  const [strategicGoalsData, setStrategicGoalsData] = useState(null);
  const [isStrategicGoalsRegenerating, setIsStrategicGoalsRegenerating] = useState(false);
  const [strategicRadarData, setStrategicRadarData] = useState(null);
  const [isStrategicRadarRegenerating, setIsStrategicRadarRegenerating] = useState(false);
  const [cultureProfileData, setCultureProfileData] = useState(null);
  const [isCultureProfileRegenerating, setIsCultureProfileRegenerating] = useState(false);
  const [productivityData, setProductivityData] = useState(null);
  const [isProductivityRegenerating, setIsProductivityRegenerating] = useState(false);
  const [maturityData, setMaturityData] = useState(null);
  const [isMaturityRegenerating, setIsMaturityRegenerating] = useState(false);
  const [financialPerformanceData, setFinancialPerformanceData] = useState(null);

  const [isFinancialPerformanceRegenerating, setIsFinancialPerformanceRegenerating] = useState(false);

  // NEW: Good Phase regenerating states
  const [isCostEfficiencyRegenerating, setIsCostEfficiencyRegenerating] = useState(false);
  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);
  const [isChannelHeatmapReady, setIsChannelHeatmapReady] = useState(false);
  const [isCapabilityHeatmapReady, setIsCapabilityHeatmapReady] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('initial');
  const [financialBalanceData, setFinancialBalanceData] = useState(null);
  const [operationalEfficiencyData, setOperationalEfficiencyData] = useState(null);
  const [isFinancialBalanceRegenerating, setIsFinancialBalanceRegenerating] = useState(false);
  const [isOperationalEfficiencyRegenerating, setIsOperationalEfficiencyRegenerating] = useState(false);

  // Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Go to Section');

  // Toast State
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Refs
  const swotRef = useRef(null);
  const customerSegmentationRef = useRef(null);
  const purchaseCriteriaRef = useRef(null);
  const channelHeatmapRef = useRef(null);
  const loyaltyNpsRef = useRef(null);
  const capabilityHeatmapRef = useRef(null);
  const dropdownRef = useRef(null);
  const isRegeneratingRef = useRef(false);
  const portersRef = useRef(null);
  const pestelRef = useRef(null);
  const fullSwotRef = useRef(null);
  const competitiveAdvantageRef = useRef(null);
  const cultureProfileRef = useRef(null);
  const productivityRef = useRef(null);
  const maturityScoreRef = useRef(null);
  const strategicGoalsRef = useRef(null);
  const strategicRadarRef = useRef(null);
  const expandedCapabilityRef = useRef(null);
  const channelEffectivenessRef = useRef(null);

  // NEW: Good Phase refs
  const costEfficiencyRef = useRef(null);
  const financialBalanceRef = useRef(null);
  const operationalEfficiencyRef = useRef(null);
  const financialPerformanceRef = useRef(null);
  return {
    // UI State
    activeTab, setActiveTab,
    isMobile, setIsMobile,
    isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding,

    // Data State
    questions, setQuestions,
    questionsLoaded, setQuestionsLoaded,
    userAnswers, setUserAnswers,
    completedQuestions, setCompletedQuestions,
    businessData, setBusinessData,

    // Analysis State
    hasAnalysisData, setHasAnalysisData,
    isAnalysisRegenerating, setIsAnalysisRegenerating,
    swotAnalysisResult, setSwotAnalysisResult,
    customerSegmentationData, setCustomerSegmentationData,
    purchaseCriteriaData, setPurchaseCriteriaData,
    channelHeatmapData, setChannelHeatmapData,
    loyaltyNPSData, setLoyaltyNPSData,
    capabilityHeatmapData, setCapabilityHeatmapData,
    strategicData, setStrategicData,
    portersData, setPortersData,
    pestelData, setPestelData,
    fullSwotData, setFullSwotData,
    competitiveAdvantageData, setCompetitiveAdvantageData,

    // NEW: Good Phase Analysis State
    costEfficiencyData, setCostEfficiencyData,

    // Regenerating states
    isSwotAnalysisRegenerating, setIsSwotAnalysisRegenerating,
    isCustomerSegmentationRegenerating, setIsCustomerSegmentationRegenerating,
    isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating,
    isChannelHeatmapRegenerating, setIsChannelHeatmapRegenerating,
    isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating,
    isCapabilityHeatmapRegenerating, setIsCapabilityHeatmapRegenerating,
    isStrategicRegenerating, setIsStrategicRegenerating,
    isPortersRegenerating, setIsPortersRegenerating,
    isPestelRegenerating, setIsPestelRegenerating,
    isFullSwotRegenerating, setIsFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating,
    channelEffectivenessData, setChannelEffectivenessData,
    isChannelEffectivenessRegenerating, setIsChannelEffectivenessRegenerating,
    expandedCapabilityData, setExpandedCapabilityData,
    isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating,
    strategicGoalsData, setStrategicGoalsData,
    isStrategicGoalsRegenerating, setIsStrategicGoalsRegenerating,
    strategicRadarData, setStrategicRadarData,
    isStrategicRadarRegenerating, setIsStrategicRadarRegenerating,
    cultureProfileData, setCultureProfileData,
    isCultureProfileRegenerating, setIsCultureProfileRegenerating,
    productivityData, setProductivityData,
    isProductivityRegenerating, setIsProductivityRegenerating,
    maturityData, setMaturityData,
    isMaturityRegenerating, setIsMaturityRegenerating,

    // NEW: Good Phase regenerating states
    isCostEfficiencyRegenerating, setIsCostEfficiencyRegenerating,
    financialPerformanceData, setFinancialPerformanceData,
    isFinancialPerformanceRegenerating, setIsFinancialPerformanceRegenerating,
    financialPerformanceRef,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    isChannelHeatmapReady, setIsChannelHeatmapReady,
    isCapabilityHeatmapReady, setIsCapabilityHeatmapReady,
    selectedPhase, setSelectedPhase,

    // Dropdown State
    showDropdown, setShowDropdown,
    selectedOption, setSelectedOption,

    // Toast State
    showToast, setShowToast,

    // Refs
    swotRef, customerSegmentationRef, purchaseCriteriaRef,
    channelHeatmapRef, loyaltyNpsRef, capabilityHeatmapRef,
    dropdownRef, isRegeneratingRef, portersRef,
    pestelRef, fullSwotRef, competitiveAdvantageRef,
    cultureProfileRef, productivityRef, maturityScoreRef,
    strategicGoalsRef, strategicRadarRef, expandedCapabilityRef,
    channelEffectivenessRef,

    // NEW: Good Phase refs
    costEfficiencyRef,
    financialBalanceData, setFinancialBalanceData,
    operationalEfficiencyData, setOperationalEfficiencyData,
    isFinancialBalanceRegenerating, setIsFinancialBalanceRegenerating,
    isOperationalEfficiencyRegenerating, setIsOperationalEfficiencyRegenerating,
    financialBalanceRef, operationalEfficiencyRef
  };
};