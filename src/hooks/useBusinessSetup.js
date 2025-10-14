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
  const [purchaseCriteriaData, setPurchaseCriteriaData] = useState(null);
  const [loyaltyNPSData, setLoyaltyNPSData] = useState(null);
  const [portersData, setPortersData] = useState(null);
  const [pestelData, setPestelData] = useState(null);
  const [fullSwotData, setFullSwotData] = useState(null);
  const [competitiveAdvantageData, setCompetitiveAdvantageData] = useState(null);
  const [strategicData, setStrategicData] = useState(null);
  const [expandedCapabilityData, setExpandedCapabilityData] = useState(null);
  const [strategicRadarData, setStrategicRadarData] = useState(null);
  const [productivityData, setProductivityData] = useState(null);
  const [maturityData, setMaturityData] = useState(null);
  const [competitiveLandscapeData, setCompetitiveLandscapeData] = useState(null); // ADD THIS LINE

  // Financial analysis states (Good Phase)
  const [profitabilityData, setProfitabilityData] = useState(null);
  const [growthTrackerData, setGrowthTrackerData] = useState(null);
  const [liquidityEfficiencyData, setLiquidityEfficiencyData] = useState(null);
  const [investmentPerformanceData, setInvestmentPerformanceData] = useState(null);
  const [leverageRiskData, setLeverageRiskData] = useState(null);

  // Individual component regenerating states - Active ones only
  const [isSwotAnalysisRegenerating, setIsSwotAnalysisRegenerating] = useState(false);
  const [isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating] = useState(false);
  const [isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating] = useState(false);
  const [isPortersRegenerating, setIsPortersRegenerating] = useState(false);
  const [isPestelRegenerating, setIsPestelRegenerating] = useState(false);
  const [isFullSwotRegenerating, setIsFullSwotRegenerating] = useState(false);
  const [isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating] = useState(false);
  const [isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating] = useState(false);
  const [isStrategicRadarRegenerating, setIsStrategicRadarRegenerating] = useState(false);
  const [isProductivityRegenerating, setIsProductivityRegenerating] = useState(false);
  const [isMaturityRegenerating, setIsMaturityRegenerating] = useState(false);
  const [isCompetitiveLandscapeRegenerating, setIsCompetitiveLandscapeRegenerating] = useState(false); // ADD THIS LINE

  // Financial analysis regenerating states
  const [isProfitabilityRegenerating, setIsProfitabilityRegenerating] = useState(false);
  const [isGrowthTrackerRegenerating, setIsGrowthTrackerRegenerating] = useState(false);
  const [isLiquidityEfficiencyRegenerating, setIsLiquidityEfficiencyRegenerating] = useState(false);
  const [isInvestmentPerformanceRegenerating, setIsInvestmentPerformanceRegenerating] = useState(false);
  const [isLeverageRiskRegenerating, setIsLeverageRiskRegenerating] = useState(false);
  const [isStrategicRegenerating, setIsStrategicRegenerating] = useState(false);
  const [coreAdjacencyData, setCoreAdjacencyData] = useState(null);
  const [isCoreAdjacencyRegenerating, setIsCoreAdjacencyRegenerating] = useState(false);
  const coreAdjacencyRef = useRef(null);
  // Other states
  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState('initial');

  // Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Go to Section');

  // Toast State
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Refs - Active ones only
  const swotRef = useRef(null);
  const purchaseCriteriaRef = useRef(null);
  const loyaltyNpsRef = useRef(null);
  const dropdownRef = useRef(null);
  const isRegeneratingRef = useRef(false);
  const portersRef = useRef(null);
  const pestelRef = useRef(null);
  const fullSwotRef = useRef(null);
  const competitiveAdvantageRef = useRef(null);
  const productivityRef = useRef(null);
  const maturityScoreRef = useRef(null);
  const strategicRadarRef = useRef(null);
  const expandedCapabilityRef = useRef(null);
  const competitiveLandscapeRef = useRef(null); // ADD THIS LINE

  // Financial analysis refs
  const profitabilityRef = useRef(null);
  const growthTrackerRef = useRef(null);
  const liquidityEfficiencyRef = useRef(null);
  const investmentPerformanceRef = useRef(null);
  const leverageRiskRef = useRef(null);

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
    purchaseCriteriaData, setPurchaseCriteriaData,
    loyaltyNPSData, setLoyaltyNPSData,
    strategicData, setStrategicData, portersData, setPortersData,
    pestelData, setPestelData,
    fullSwotData, setFullSwotData,
    competitiveAdvantageData, setCompetitiveAdvantageData,
    expandedCapabilityData, setExpandedCapabilityData,
    strategicRadarData, setStrategicRadarData,
    productivityData, setProductivityData,
    maturityData, setMaturityData,
    competitiveLandscapeData, setCompetitiveLandscapeData,
    coreAdjacencyData, setCoreAdjacencyData,

    // Financial analysis states
    profitabilityData, setProfitabilityData,
    growthTrackerData, setGrowthTrackerData,
    liquidityEfficiencyData, setLiquidityEfficiencyData,
    investmentPerformanceData, setInvestmentPerformanceData,
    leverageRiskData, setLeverageRiskData,

    // Regenerating states - Active ones only
    isSwotAnalysisRegenerating, setIsSwotAnalysisRegenerating,
    isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating,
    isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating,
    isPortersRegenerating, setIsPortersRegenerating,
    isPestelRegenerating, setIsPestelRegenerating,
    isFullSwotRegenerating, setIsFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating,
    isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating,
    isStrategicRadarRegenerating, setIsStrategicRadarRegenerating,
    isProductivityRegenerating, setIsProductivityRegenerating,
    isMaturityRegenerating, setIsMaturityRegenerating,
    isCompetitiveLandscapeRegenerating, setIsCompetitiveLandscapeRegenerating,
    isCoreAdjacencyRegenerating, setIsCoreAdjacencyRegenerating,
    isStrategicRegenerating, setIsStrategicRegenerating,
    // Financial analysis regenerating states
    isProfitabilityRegenerating, setIsProfitabilityRegenerating,
    isGrowthTrackerRegenerating, setIsGrowthTrackerRegenerating,
    isLiquidityEfficiencyRegenerating, setIsLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, setIsInvestmentPerformanceRegenerating,
    isLeverageRiskRegenerating, setIsLeverageRiskRegenerating,

    // Other states
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    selectedPhase, setSelectedPhase,

    // Dropdown State
    showDropdown, setShowDropdown,
    selectedOption, setSelectedOption,

    // Toast State
    showToast, setShowToast,

    // Refs - Active ones only
    swotRef,
    purchaseCriteriaRef,
    loyaltyNpsRef,
    dropdownRef,
    isRegeneratingRef,
    portersRef,
    pestelRef,
    fullSwotRef,
    competitiveAdvantageRef,
    productivityRef,
    maturityScoreRef,
    strategicRadarRef,
    expandedCapabilityRef,
    competitiveLandscapeRef,
    coreAdjacencyRef,

    // Financial analysis refs
    profitabilityRef,
    growthTrackerRef,
    liquidityEfficiencyRef,
    investmentPerformanceRef,
    leverageRiskRef
  };
};