import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader, RefreshCw, ChevronDown } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";
import ChatComponent from "../components/ChatComponent";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PhaseManager from "../components/PhaseManager";
import AnalysisContentManager from "../components/AnalysisContentManager";
import { useBusinessSetup } from '../hooks/useBusinessSetup';
import { extractBusinessName, showToastMessage as createToastMessage } from '../utils/businessHelpers';
import "../styles/businesspage.css";
import "../styles/business.css";
import PDFExportButton from "../components/PDFExportButton";
import { AnalysisApiService } from '../services/analysisApiService';


const createAnalysisContentManagerProps = (state, props) => {
  const {
    swotAnalysisResult, purchaseCriteriaData, loyaltyNPSData, strategicData,
    portersData, pestelData, fullSwotData, competitiveAdvantageData,
    expandedCapabilityData, strategicRadarData, productivityData, maturityData,
    profitabilityData, growthTrackerData, liquidityEfficiencyData,
    investmentPerformanceData, leverageRiskData,
    setSwotAnalysisResult, setPurchaseCriteriaData, setLoyaltyNPSData,
    setPortersData, setPestelData, setFullSwotData, setCompetitiveAdvantageData,
    setExpandedCapabilityData, setStrategicRadarData, setProductivityData,
    setMaturityData, setProfitabilityData, setGrowthTrackerData,
    setLiquidityEfficiencyData, setInvestmentPerformanceData, setLeverageRiskData,
    isSwotAnalysisRegenerating, isPurchaseCriteriaRegenerating, isLoyaltyNPSRegenerating,
    isPortersRegenerating, isPestelRegenerating, isFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, isExpandedCapabilityRegenerating,
    isStrategicRadarRegenerating, isProductivityRegenerating, isMaturityRegenerating,
    isProfitabilityRegenerating, isGrowthTrackerRegenerating, isLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, isLeverageRiskRegenerating, isAnalysisRegenerating,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, portersRef, pestelRef, fullSwotRef,
    competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef, productivityRef,
    maturityScoreRef, profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef
  } = state;

  const {
    phaseManager, businessData, questions, userAnswers, selectedBusinessId,
    handleRedirectToBrief, showToastMessage, apiService, createSimpleRegenerationHandler,
    apiLoadingStates, uploadedFileForAnalysis,
    highlightedCard, expandedCards, setExpandedCards
  } = props;

  return {
    phaseManager,
    apiLoadingStates,
    businessData,
    questions,
    userAnswers,
    selectedBusinessId,
    swotAnalysisResult,
    purchaseCriteriaData,
    loyaltyNPSData,
    strategicData,
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
    isLeverageRiskRegenerating,
    isLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating,
    isAnalysisRegenerating,
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
    highlightedCard,
    expandedCards,
    setExpandedCards
  };
};
const BusinessSetupPage = () => {
  const location = useLocation();
  const business = location.state?.business;
  const selectedBusinessId = location.state?.business?._id;
  const selectedBusinessName = location.state?.business?.business_name;
  const { t } = useTranslation();
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');
  const [apiLoadingStates, setApiLoadingStates] = useState({});
  const setApiLoading = (apiEndpoint, isLoading) => {
    setApiLoadingStates(prev => ({
      ...prev,
      [apiEndpoint]: isLoading
    }));
  };
  const apiService = new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  );
  const state = useBusinessSetup(business, selectedBusinessId);
  const [currentPhase, setCurrentPhase] = useState('initial');
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const { activeTab, setActiveTab, isMobile, setIsMobile, isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding,
    questions, setQuestions, questionsLoaded, setQuestionsLoaded,
    userAnswers, setUserAnswers, completedQuestions, setCompletedQuestions,
    businessData, setBusinessData, hasAnalysisData, setHasAnalysisData,
    isAnalysisRegenerating, setIsAnalysisRegenerating, selectedPhase, setSelectedPhase,
    showDropdown, setShowDropdown, showToast, setShowToast,
    swotAnalysisResult, setSwotAnalysisResult,
    purchaseCriteriaData, setPurchaseCriteriaData,
    loyaltyNPSData, setLoyaltyNPSData,
    strategicData, setStrategicData,
    portersData, setPortersData,
    pestelData, setPestelData,
    fullSwotData, setFullSwotData,
    competitiveAdvantageData, setCompetitiveAdvantageData,
    expandedCapabilityData, setExpandedCapabilityData,
    strategicRadarData, setStrategicRadarData,
    productivityData, setProductivityData,
    maturityData, setMaturityData,
    profitabilityData, setProfitabilityData,
    growthTrackerData, setGrowthTrackerData,
    liquidityEfficiencyData, setLiquidityEfficiencyData,
    investmentPerformanceData, setInvestmentPerformanceData,
    leverageRiskData, setLeverageRiskData,
    isSwotAnalysisRegenerating, setIsSwotAnalysisRegenerating,
    isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating,
    isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating,
    isStrategicRegenerating, setIsStrategicRegenerating,
    isPortersRegenerating, setIsPortersRegenerating,
    isPestelRegenerating, setIsPestelRegenerating,
    isFullSwotRegenerating, setIsFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating,
    isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating,
    isStrategicRadarRegenerating, setIsStrategicRadarRegenerating,
    isProductivityRegenerating, setIsProductivityRegenerating,
    isMaturityRegenerating, setIsMaturityRegenerating,
    isProfitabilityRegenerating, setIsProfitabilityRegenerating,
    isGrowthTrackerRegenerating, setIsGrowthTrackerRegenerating,
    isLiquidityEfficiencyRegenerating, setIsLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, setIsInvestmentPerformanceRegenerating,
    isLeverageRiskRegenerating, setIsLeverageRiskRegenerating,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, dropdownRef, isRegeneratingRef,
    portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef,
    productivityRef, maturityScoreRef, strategicRadarRef, expandedCapabilityRef,
    profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef
  } = state;
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const [selectedDropdownValue, setSelectedDropdownValue] = useState("Go to Section");
  const hasLoadedAnalysis = useRef(false);
  useEffect(() => {
    setHasUploadedDocument(!!uploadedFileForAnalysis);
  }, [uploadedFileForAnalysis]);
  // Create toast message helper
  const showToastMessage = createToastMessage(setShowToast);

  const stateSetters = {
    // Initial phase setters
    setSwotAnalysisResult,
    setPurchaseCriteriaData,
    setLoyaltyNPSData,
    setPortersData,
    setPestelData,

    // Essential phase setters
    setFullSwotData,
    setCompetitiveAdvantageData,
    setExpandedCapabilityData,
    setStrategicRadarData,
    setProductivityData,
    setMaturityData,

    // Good phase setters
    setProfitabilityData,
    setGrowthTrackerData,
    setLiquidityEfficiencyData,
    setInvestmentPerformanceData,
    setLeverageRiskData,

    // File upload support
    uploadedFile: uploadedFileForAnalysis,
  };

  const handleFileUploaded = (file, validationResult) => {
    setUploadedFileForAnalysis(file);
    setHasUploadedDocument(true);
  };
  // Handle redirect to brief tab
  const handleRedirectToBrief = (missingQuestionsData) => {
    setHighlightedMissingQuestions(missingQuestionsData);

    if (isMobile) {
      setActiveTab("brief");
    } else {
      if (isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(false);
        setActiveTab("brief");
        setTimeout(() => setIsSliding(false), 1000);
      } else {
        setActiveTab("brief");
      }
    }

    showToastMessage(
      `Please answer ${missingQuestionsData.missing_count} more question${missingQuestionsData.missing_count > 1 ? 's' : ''} to generate this analysis.`,
      "warning"
    );

    setTimeout(() => setHighlightedMissingQuestions(null), 30000);
  };

  const handleRegeneratePhase = async (phaseOverride = null) => {
    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);

      // Use the phaseOverride if provided, otherwise calculate current phase
      const targetPhase = phaseOverride || getCurrentPhase();

      await apiService.handlePhaseCompletion(
        targetPhase,
        questions,
        userAnswers,
        selectedBusinessId,
        stateSetters,
        showToastMessage
      );
    } catch (error) {
      console.error(`Error regenerating phase:`, error);
      showToastMessage(`Failed to regenerate phase.`, "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
    }
  };

  // Load existing analysis data
  const loadExistingAnalysisData = (phaseAnalysisArray) => {
    try {
      const latestAnalysisByType = {};

      phaseAnalysisArray
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach(analysis => {
          const key = analysis.analysis_type;
          if (!latestAnalysisByType[key]) {
            latestAnalysisByType[key] = analysis;
          }
        });

      let hasAnyAnalysis = false;

      Object.values(latestAnalysisByType).forEach(analysis => {
        const { analysis_type, analysis_data } = analysis;
        hasAnyAnalysis = true;

        const setterMap = {
          'swot': () => setSwotAnalysisResult(typeof analysis_data === 'string' ? analysis_data : JSON.stringify(analysis_data)),
          'strategic': () => setStrategicData(analysis_data),
          'fullSwot': () => setFullSwotData(analysis_data),
          'competitiveAdvantage': () => setCompetitiveAdvantageData(analysis_data),
          'expandedCapability': () => setExpandedCapabilityData(analysis_data),
          'strategicRadar': () => setStrategicRadarData(analysis_data),
          'productivityMetrics': () => setProductivityData(analysis_data),
          'maturityScore': () => setMaturityData(analysis_data),
          'purchaseCriteria': () => setPurchaseCriteriaData(analysis_data),
          'loyaltyNPS': () => setLoyaltyNPSData(analysis_data),
          'porters': () => setPortersData(analysis_data),
          'pestel': () => setPestelData(analysis_data),
          'profitabilityAnalysis': () => setProfitabilityData(analysis_data),
          'growthTracker': () => setGrowthTrackerData(analysis_data),
          'liquidityEfficiency': () => setLiquidityEfficiencyData(analysis_data),
          'investmentPerformance': () => setInvestmentPerformanceData(analysis_data),
          'leverageRisk': () => setLeverageRiskData(analysis_data),
        };

        const setter = setterMap[analysis_type];
        if (setter) {
          setter();
        } else {
          console.warn(`No setter found for analysis type: ${analysis_type}`);
        }
      });

      setHasAnalysisData(hasAnyAnalysis);
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };
  const phaseManager = PhaseManager({
    questions,
    questionsLoaded,
    completedQuestions,
    userAnswers,
    selectedBusinessId,
    hasUploadedDocument, setHasUploadedDocument,
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      setCompletedQuestions(completedSet);
      setUserAnswers(prev => ({ ...prev, ...answersMap }));
    },
    onCompletedPhasesUpdate: (phases) => { },
    onAnalysisGeneration: () => handleRegeneratePhase('initial'),
    onFullSwotGeneration: () => handleRegeneratePhase('essential'),
    onGoodPhaseGeneration: () => handleRegeneratePhase('good'),
    onAdvancedPhaseGeneration: () => handleRegeneratePhase('advanced'),
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL,
    getAuthToken,
    apiService,
    stateSetters,
    showToastMessage
  });

  const handleStrategicAnalysisRegenerate = async () => {
    if (!phaseManager.canRegenerateAnalysis() || isRegeneratingRef.current) return;

    try {
      setIsStrategicRegenerating(true);
      showToastMessage("Regenerating Strategic Analysis...", "info");
      setStrategicData(null);
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = await apiService.generateStrategicAnalysis(questions, userAnswers, selectedBusinessId);
      setStrategicData(result);
      showToastMessage("Strategic Analysis regenerated successfully!", "success");
    } catch (error) {
      console.error('Error regenerating Strategic Analysis:', error);
      showToastMessage("Failed to regenerate Strategic Analysis.", "error");
    } finally {
      setIsStrategicRegenerating(false);
    }
  };

  // Event Handlers
  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions);
    setQuestionsLoaded(true);
  };

  const handleNewAnswer = async (questionId, answer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Update business data based on specific questions
    const updates = {};
    if (questionId === 1) {
      const businessName = extractBusinessName(answer);
      if (businessName) updates.name = businessName;
      updates.whatWeDo = answer;
    } else if (questionId === 3) {
      updates.targetAudience = answer;
    } else if (questionId === 4) {
      updates.products = answer;
    }

    if (Object.keys(updates).length > 0) {
      setBusinessData(prev => ({ ...prev, ...updates }));
    }
  };

  // Question completion handler
  const handleQuestionCompleted = async (questionId) => {
    const newCompletedSet = new Set([...completedQuestions, questionId]);
    setCompletedQuestions(newCompletedSet);

    // Use phase manager's simplified question completion handler
    return await phaseManager.handleQuestionCompleted(questionId);
  };

  const handleBusinessDataUpdate = (updates) => {
    setBusinessData(prev => ({ ...prev, ...updates }));
  };

  const handleAnswerUpdate = (questionId, newAnswer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: newAnswer }));

    // Update business data
    const updates = {};
    if (questionId === 1) {
      const businessName = extractBusinessName(newAnswer);
      if (businessName) updates.name = businessName;
      updates.whatWeDo = newAnswer;
    } else if (questionId === 3) {
      updates.targetAudience = newAnswer;
    } else if (questionId === 4) {
      updates.products = newAnswer;
    }

    if (Object.keys(updates).length > 0) {
      setBusinessData(prev => ({ ...prev, ...updates }));
    }
  };

  // Navigation handlers
  const handleAnalysisTabClick = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    if (!unlockedFeatures.analysis) return;

    if (isMobile) {
      setActiveTab("analysis");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("analysis");
      }
    }
  };

  const handleStrategicTabClick = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    if (!unlockedFeatures.analysis) return;

    if (isMobile) {
      setActiveTab("strategic");
    } else {
      if (!isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("strategic");
        setIsSliding(false)
      } else {
        setActiveTab("strategic");
      }
    }
  };

  const handleBackFromAnalysis = () => {
    if (isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(false);
      setActiveTab("brief");
      setIsSliding(false)
    }
  };

  const handleBack = () => window.history.back();

  // Handle option click for dropdown navigation 
  const handleOptionClick = (option) => {
    setShowDropdown(false);

    // Set the highlighted card
    const cardIdMap = {
      "SWOT": "swot",
      "Purchase Criteria": "purchase-criteria",
      "Loyalty/NPS": "loyalty-nps",
      "Porter's Five Forces": "porters",
      "PESTEL Analysis": "pestel",
      "Full SWOT Portfolio": "full-swot",
      "Competitive Advantage": "competitive-advantage",
      "Capability Heatmap": "expanded-capability",
      "Strategic Positioning Radar": "strategic-radar",
      "Productivity Metrics": "productivity",
      "Maturity Score": "maturity",
      "Profitability Analysis": "profitability-analysis",
      "Growth Tracker": "growth-tracker",
      "Liquidity & Efficiency": "liquidity-efficiency",
      "Investment Performance": "investment-performance",
      "Leverage & Risk": "leverage-risk",
    };

    const cardId = cardIdMap[option];
    if (cardId) {
      // Set highlight
      setHighlightedCard(cardId);

      // Auto-expand the card
      setExpandedCards(prev => new Set([...prev, cardId]));

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedCard(null);
      }, 3000);
    }

    setTimeout(() => {
      const refMap = {
        "SWOT": swotRef,
        "Purchase Criteria": purchaseCriteriaRef,
        "Loyalty/NPS": loyaltyNpsRef,
        "Porter's Five Forces": portersRef,
        "PESTEL Analysis": pestelRef,
        "Full SWOT Portfolio": fullSwotRef,
        "Competitive Advantage": competitiveAdvantageRef,
        "Capability Heatmap": expandedCapabilityRef,
        "Strategic Positioning Radar": strategicRadarRef,
        "Productivity Metrics": productivityRef,
        "Maturity Score": maturityScoreRef,
        "Profitability Analysis": profitabilityRef,
        "Growth Tracker": growthTrackerRef,
        "Liquidity & Efficiency": liquidityEfficiencyRef,
        "Investment Performance": investmentPerformanceRef,
        "Leverage & Risk": leverageRiskRef,
      };

      const targetRef = refMap[option];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }, 100);
  };


  const createSimpleRegenerationHandler = (analysisType) => {
    return async () => {
      const regeneratingStateMap = {
        'swot': setIsSwotAnalysisRegenerating,
        'purchaseCriteria': setIsPurchaseCriteriaRegenerating,
        'loyaltyNPS': setIsLoyaltyNPSRegenerating,
        'porters': setIsPortersRegenerating,
        'pestel': setIsPestelRegenerating,
        'fullSwot': setIsFullSwotRegenerating,
        'competitiveAdvantage': setIsCompetitiveAdvantageRegenerating,
        'expandedCapability': setIsExpandedCapabilityRegenerating,
        'strategicRadar': setIsStrategicRadarRegenerating,
        'productivityMetrics': setIsProductivityRegenerating,
        'maturityScore': setIsMaturityRegenerating,
        'profitabilityAnalysis': setIsProfitabilityRegenerating,
        'growthTracker': setIsGrowthTrackerRegenerating,
        'liquidityEfficiency': setIsLiquidityEfficiencyRegenerating,
        'investmentPerformance': setIsInvestmentPerformanceRegenerating,
        'leverageRisk': setIsLeverageRiskRegenerating,
      };

      const dataStateMap = {
        'swot': setSwotAnalysisResult,
        'purchaseCriteria': setPurchaseCriteriaData,
        'loyaltyNPS': setLoyaltyNPSData,
        'porters': setPortersData,
        'pestel': setPestelData,
        'fullSwot': setFullSwotData,
        'competitiveAdvantage': setCompetitiveAdvantageData,
        'expandedCapability': setExpandedCapabilityData,
        'strategicRadar': setStrategicRadarData,
        'productivityMetrics': setProductivityData,
        'maturityScore': setMaturityData,
        'profitabilityAnalysis': setProfitabilityData,
        'growthTracker': setGrowthTrackerData,
        'liquidityEfficiency': setLiquidityEfficiencyData,
        'investmentPerformance': setInvestmentPerformanceData,
        'leverageRisk': setLeverageRiskData,
      };

      const displayNameMap = {
        'swot': 'SWOT Analysis',
        'purchaseCriteria': 'Purchase Criteria',
        'loyaltyNPS': 'Loyalty & NPS',
        'porters': "Porter's Five Forces",
        'pestel': 'PESTEL Analysis',
        'fullSwot': 'Full SWOT Portfolio',
        'competitiveAdvantage': 'Competitive Advantage Matrix',
        'expandedCapability': 'Capability Heatmap',
        'strategicRadar': 'Strategic Positioning Radar',
        'productivityMetrics': 'Productivity Metrics',
        'maturityScore': 'Maturity Score',
        'profitabilityAnalysis': 'Profitability Analysis',
        'growthTracker': 'Growth Tracker',
        'liquidityEfficiency': 'Liquidity & Efficiency',
        'investmentPerformance': 'Investment Performance',
        'leverageRisk': 'Leverage & Risk'
      };

      const setIsRegenerating = regeneratingStateMap[analysisType];
      const setData = dataStateMap[analysisType];
      const displayName = displayNameMap[analysisType] || analysisType;

      if (!setIsRegenerating) {
        console.error(`No regenerating state setter found for analysis type: ${analysisType}`);
        showToastMessage(`Cannot regenerate ${displayName} - missing regeneration handler`, "error");
        return;
      }

      if (!setData) {
        console.error(`No data state setter found for analysis type: ${analysisType}`);
        showToastMessage(`Cannot regenerate ${displayName} - missing data handler`, "error");
        return;
      }

      if (isRegeneratingRef.current) {
        return;
      }

      try {
        setIsRegenerating(true);
        isRegeneratingRef.current = true;
        showToastMessage(`Regenerating ${displayName}...`, "info");
        setData(null);
        await new Promise(resolve => setTimeout(resolve, 200));

        let result;

        try {
          // Use individual API methods instead of handlePhaseCompletion
          switch (analysisType) {
            case 'swot':
              result = await apiService.generateSWOTAnalysis(questions, userAnswers, selectedBusinessId);
              break;

            case 'purchaseCriteria':
              result = await apiService.generatePurchaseCriteria(questions, userAnswers, selectedBusinessId);
              break;

            case 'loyaltyNPS':
              result = await apiService.generateLoyaltyNPS(questions, userAnswers, selectedBusinessId);
              break;

            case 'porters':
              result = await apiService.generatePortersAnalysis(questions, userAnswers, selectedBusinessId);
              break;

            case 'pestel':
              result = await apiService.generatePestelAnalysis(questions, userAnswers, selectedBusinessId);
              break;

            case 'fullSwot':
              result = await apiService.generateFullSwotPortfolio(questions, userAnswers, selectedBusinessId);
              break;

            case 'competitiveAdvantage':
              result = await apiService.generateCompetitiveAdvantage(questions, userAnswers, selectedBusinessId);
              break;

            case 'expandedCapability':
              result = await apiService.generateExpandedCapability(questions, userAnswers, selectedBusinessId);
              break;

            case 'strategicRadar':
              result = await apiService.generateStrategicRadar(questions, userAnswers, selectedBusinessId);
              break;

            case 'productivityMetrics':
              result = await apiService.generateProductivityMetrics(questions, userAnswers, selectedBusinessId);
              break;

            case 'maturityScore':
              result = await apiService.generateMaturityScore(questions, userAnswers, selectedBusinessId);
              break;

            case 'profitabilityAnalysis':
              result = await apiService.generateProfitabilityAnalysis(questions, userAnswers, selectedBusinessId, uploadedFileForAnalysis);
              break;

            case 'growthTracker':
              result = await apiService.generateGrowthTracker(questions, userAnswers, selectedBusinessId, uploadedFileForAnalysis);
              break;

            case 'liquidityEfficiency':
              result = await apiService.generateLiquidityEfficiency(questions, userAnswers, selectedBusinessId, uploadedFileForAnalysis);
              break;

            case 'investmentPerformance':
              result = await apiService.generateInvestmentPerformance(questions, userAnswers, selectedBusinessId, uploadedFileForAnalysis);
              break;

            case 'leverageRisk':
              result = await apiService.generateLeverageRisk(questions, userAnswers, selectedBusinessId, uploadedFileForAnalysis);
              break;

            default:
              throw new Error(`Unknown analysis type: ${analysisType}`);
          }

          if (result) {
            setData(result);
          } else {
            console.warn(`No result returned for ${analysisType}`);
          }

          showToastMessage(`${displayName} regenerated successfully!`, "success");

        } catch (apiError) {
          console.error(`API error regenerating ${analysisType}:`, apiError);
          throw apiError;
        }

      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        const errorMessage = error.message || `Failed to regenerate ${displayName}`;
        showToastMessage(errorMessage, "error");

      } finally {
        setIsRegenerating(false);
        isRegeneratingRef.current = false;
      }
    };
  };


  const analysisProps = createAnalysisContentManagerProps(state, {
    phaseManager,
    businessData,
    questions,
    userAnswers,
    selectedBusinessId,
    handleRedirectToBrief,
    showToastMessage,
    apiService,
    createSimpleRegenerationHandler,
    apiLoadingStates,
    uploadedFileForAnalysis,
    highlightedCard, // Add this
    expandedCards,    // Add this
    setExpandedCards
  });

  useEffect(() => {
    setSelectedDropdownValue("Go to Section");
  }, [selectedPhase]);

  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    const baseOptions = {
      initial: [
        "Purchase Criteria",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ],
      essential: [
        "Full SWOT Portfolio",
        "Competitive Advantage",
        "Capability Heatmap",
        "Strategic Positioning Radar",
        "Productivity Metrics",
        "Maturity Score",
        "Purchase Criteria",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ],
      good: [
        "Profitability Analysis",
        "Growth Tracker",
        "Liquidity & Efficiency",
        "Investment Performance",
        "Leverage & Risk",
        "Full SWOT Portfolio",
        "Competitive Advantage",
        "Capability Heatmap",
        "Strategic Positioning Radar",
        "Productivity Metrics",
        "Maturity Score",
        "Purchase Criteria",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ],
      advanced: [
        "Profitability Analysis",
        "Growth Tracker",
        "Liquidity & Efficiency",
        "Investment Performance",
        "Leverage & Risk",
        "Full SWOT Portfolio",
        "Competitive Advantage",
        "Capability Heatmap",
        "Strategic Positioning Radar",
        "Productivity Metrics",
        "Maturity Score",
        "Purchase Criteria",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ]
    };

    if (phase === 'initial' && !unlockedFeatures.fullSwot) {
      return [
        "SWOT",
        ...baseOptions.initial
      ];
    }

    return baseOptions[phase] || [];
  };

  // Add this function to determine the current phase based on unlocked features
  const getCurrentPhase = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    if (unlockedFeatures.advancedPhase) {
      return 'advanced';
    } else if (unlockedFeatures.goodPhase) {
      return 'good';
    } else if (unlockedFeatures.fullSwot) {
      return 'essential';
    } else {
      return 'initial';
    }
  };

  useEffect(() => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    if (unlockedFeatures.advancedPhase) {
      setCurrentPhase('advanced');
    } else if (unlockedFeatures.goodPhase) {
      setCurrentPhase('good');
    } else if (unlockedFeatures.fullSwot) {
      setCurrentPhase('essential');
    } else {
      setCurrentPhase('initial');
    }
  }, [phaseManager, hasAnalysisData, fullSwotData, profitabilityData]);

  // Analysis Controls Component
  const AnalysisControls = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    const currentPhase = getCurrentPhase();

    return (
      <div className="analysis-controls-wrapper">
        <button
          onClick={() => handleRegeneratePhase(getCurrentPhase())}
          disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
          className={`regenerate-button ${(isAnalysisRegenerating) ? 'disabled' : ''}`}
        >
          {isAnalysisRegenerating ? (
            <>
              <Loader size={16} className="animate-spin" />
              Regenerating {currentPhase}...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Regenerate All
            </>
          )}
        </button>
      </div>
    );
  };

  // Effects
  useEffect(() => {
    if (selectedBusinessId && questionsLoaded && questions.length > 0 && !hasLoadedAnalysis.current) {
      hasLoadedAnalysis.current = true;
      setTimeout(() => {
        phaseManager.loadExistingAnalysis();
      }, 100);
    }
  }, [selectedBusinessId, questionsLoaded, questions.length, phaseManager]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      if (newIsMobile && activeTab === "brief") {
        setActiveTab("chat");
      } else if (!newIsMobile && activeTab === "chat") {
        setActiveTab("brief");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, setIsMobile, setActiveTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, setShowDropdown]);

  const totalQuestions = questions.length;
  const answeredQuestions = completedQuestions.size;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const unlockedFeatures = phaseManager.getUnlockedFeatures();

  return (
    <div className="business-setup-container">
      <MenuBar />

      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {isMobile && questionsLoaded && (
        <>
          {["chat", "brief", "analysis", "strategic"].includes(activeTab) && (
            <div className="progress-area">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${actualProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              {t("assistant")}
            </button>

            <button
              className={`mobile-tab ${activeTab === "brief" ? "active" : ""}`}
              onClick={() => setActiveTab("brief")}
            >
              {t("brief")}
            </button>

            {unlockedFeatures.analysis && (
              <button
                className={`mobile-tab ${activeTab === "analysis" ? "active" : ""}`}
                onClick={handleAnalysisTabClick}
              >
                {t("analysis")}
              </button>
            )}

            {unlockedFeatures.analysis && (
              <button
                className={`mobile-tab ${activeTab === "strategic" ? "active" : ""}`}
                onClick={handleStrategicTabClick}
              >
                Strategic
              </button>
            )}
          </div>
        </>
      )}

      <div
        className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""} `}
      >
        <div
          className={`chat-section ${isMobile && activeTab !== "chat" ? "hidden" : ""} ${isAnalysisExpanded && !isMobile ? "slide-out" : ""}`}
        >
          <div className="welcome-area">
            <div className="header-section">
              <button
                className="back-button"
                onClick={handleBack}
                aria-label="Go Back"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            <h2 className="welcome-heading">{selectedBusinessName || 'Business Analysis'}</h2>
            <p className="welcome-text">
              {t("letsBegin")} {t("welcomeToTraxia")}
            </p>
          </div>

          <ChatComponent
            selectedBusinessId={selectedBusinessId}
            userAnswers={userAnswers}
            onBusinessDataUpdate={handleBusinessDataUpdate}
            onNewAnswer={handleNewAnswer}
            onQuestionsLoaded={handleQuestionsLoaded}
            onQuestionCompleted={handleQuestionCompleted}
            // Alternative approach using phase manager directly:

            onPhaseCompleted={async (phase, completedSet) => {

              if (phase === 'good') {
                try {
                  await apiService.handlePhaseCompletion(
                    'good',
                    questions,
                    userAnswers,
                    selectedBusinessId,
                    stateSetters,
                    showToastMessage
                  );

                } catch (error) {
                  console.error('Error generating Good phase analysis:', error);
                  showToastMessage('File uploaded but analysis generation failed', 'error');
                }
              }
            }}
            onFileUploaded={handleFileUploaded}
          />
        </div>
        {questionsLoaded && (
          <div
            className={`info-panel ${isMobile
              ? activeTab === "brief" || activeTab === "analysis" || activeTab === "strategic"
                ? "active"
                : ""
              : ""
              } ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}
          >
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  <div className="desktop-tabs">
                    <div className="desktop-tabs-left">
                      <button
                        className="back-button"
                        onClick={handleBackFromAnalysis}
                        aria-label="Go Back"
                      >
                        <ArrowLeft size={18} />
                        {t("backToOverview")}
                      </button>

                      {unlockedFeatures.analysis && (
                        <button
                          className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`}
                          onClick={() => setActiveTab("analysis")}
                        >
                          {t("analysis")}
                        </button>
                      )}

                      {unlockedFeatures.analysis && (
                        <button
                          className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`}
                          onClick={() => setActiveTab("strategic")}
                        >
                          {t("strategic")}
                        </button>
                      )}
                    </div>

                    <div className="desktop-tabs-buttons">
                      {activeTab === "analysis" && (
                        <>
                          <div ref={dropdownRef} className="dropdown-wrapper">
                            <button
                              className="dropdown-button"
                              onClick={() => setShowDropdown(prev => !prev)}
                            >
                              <span>{selectedDropdownValue}</span>
                              <ChevronDown
                                size={16}
                                className={`chevron ${showDropdown ? 'open' : ''}`}
                              />
                            </button>

                            {showDropdown && (() => {
                              const options = getPhaseSpecificOptions(currentPhase);
                              const phaseLabels = {
                                initial: 'Initial Phase',
                                essential: 'Essential Phase',
                                good: 'Good Phase'
                              };

                              return options.length > 0 && (
                                <div className="dropdown-menu-options">
                                  <div className="dropdown-phase-header">
                                    {phaseLabels[currentPhase]} Sections
                                  </div>

                                  {options.map((item, index) => (
                                    <div
                                      key={item}
                                      onClick={() => {
                                        handleOptionClick(item);
                                        setSelectedDropdownValue(item);
                                      }}
                                      className={`dropdown-option ${index < options.length - 1 ? 'has-border' : ''}`}
                                    >
                                      <span className="bullet"></span>
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          <PDFExportButton
                            className="pdf-export-button"
                            businessName={businessData.name}
                            onToastMessage={showToastMessage}
                            currentPhase={currentPhase}
                            disabled={isAnalysisRegenerating}
                            unlockedFeatures={unlockedFeatures}
                            fullSwotData={fullSwotData}
                            competitiveAdvantageData={competitiveAdvantageData}
                            expandedCapabilityData={expandedCapabilityData}
                            strategicRadarData={strategicRadarData}
                            productivityData={productivityData}
                            maturityData={maturityData}
                            profitabilityData={profitabilityData}
                            growthTrackerData={growthTrackerData}
                            liquidityEfficiencyData={liquidityEfficiencyData}
                            investmentPerformanceData={investmentPerformanceData}
                            leverageRiskData={leverageRiskData}
                          />

                          <button
                            onClick={() => handleRegeneratePhase(getCurrentPhase())}
                            disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
                            className={`regenerate-button ${(isAnalysisRegenerating) ? 'disabled' : ''}`}
                          >
                            {isAnalysisRegenerating ? (
                              <>
                                <Loader size={16} className="animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={16} />
                                {t('RegenerateAll') || 'Regenerate All'}
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {activeTab === "strategic" && (
                        <>
                          <PDFExportButton
                            className="pdf-export-button"
                            businessName={businessData.name}
                            onToastMessage={showToastMessage}
                            disabled={isAnalysisRegenerating || isStrategicRegenerating}
                            exportType="strategic"
                            strategicData={strategicData}
                          />

                          <button
                            onClick={handleStrategicAnalysisRegenerate}
                            disabled={isStrategicRegenerating || isAnalysisRegenerating}
                            className={`regenerate-button ${(isStrategicRegenerating || isAnalysisRegenerating) ? 'disabled' : ''}`}
                          >
                            {isStrategicRegenerating ? (
                              <>
                                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={16} />
                                Regenerate
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {activeTab === "analysis" && (
                        <AnalysisContentManager {...analysisProps} />
                      )}

                      {activeTab === "strategic" && (
                        <div className="strategic-section">
                          <StrategicAnalysis
                            questions={questions}
                            userAnswers={userAnswers}
                            businessName={businessData.name}
                            onRegenerate={handleStrategicAnalysisRegenerate}
                            isRegenerating={isStrategicRegenerating}
                            canRegenerate={!isAnalysisRegenerating}
                            strategicData={strategicData}
                            selectedBusinessId={selectedBusinessId}
                            phaseManager={phaseManager}
                            saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                            hideDownload={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isMobile && !isAnalysisExpanded && (
              <div className="desktop-tabs">
                <div className="desktop-tabs-controls">
                  <button
                    className={`desktop-tab ${activeTab === "brief" ? "active" : ""}`}
                    onClick={() => setActiveTab("brief")}
                  >
                    {t("brief")}
                  </button>

                  {unlockedFeatures.analysis && (
                    <button
                      className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`}
                      onClick={handleAnalysisTabClick}
                    >
                      {t("analysis")}
                    </button>
                  )}

                  {unlockedFeatures.analysis && (
                    <button
                      className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`}
                      onClick={handleStrategicTabClick}
                    >
                      {t("strategic")}
                    </button>
                  )}
                </div>

                {activeTab === "analysis" && unlockedFeatures.analysis && (
                  <div className="desktop-tabs-buttons">
                    <button
                      onClick={() => handleRegeneratePhase(getCurrentPhase())}
                      disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
                      className={`regenerate-button ${(isAnalysisRegenerating) ? 'disabled' : ''}`}
                    >
                      {isAnalysisRegenerating ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          {t('RegenerateAll') || 'Regenerate All'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {(!isAnalysisExpanded || isMobile) && (
              <div className="info-panel-content">
                {activeTab === "brief" && (
                  <div className="brief-section">
                    {!unlockedFeatures.analysis && (
                      <div className="unlock-hint">
                        <h4>🔒 {t("unlockBusinessAnalysis")}</h4>
                        <p>{t("completePhaseMessage")}</p>
                      </div>
                    )}

                    <EditableBriefSection
                      selectedBusinessId={selectedBusinessId}
                      questions={questions}
                      userAnswers={userAnswers}
                      businessData={businessData}
                      onBusinessDataUpdate={handleBusinessDataUpdate}
                      onAnswerUpdate={handleAnswerUpdate}
                      onAnalysisRegenerate={() => handleRegeneratePhase(selectedPhase)}
                      isAnalysisRegenerating={isAnalysisRegenerating}
                      isEssentialPhaseGenerating={
                        isFullSwotRegenerating ||
                        isCompetitiveAdvantageRegenerating ||
                        isExpandedCapabilityRegenerating ||
                        isStrategicRadarRegenerating ||
                        isProductivityRegenerating ||
                        isMaturityRegenerating
                      }
                      highlightedMissingQuestions={highlightedMissingQuestions}
                      onClearHighlight={() => setHighlightedMissingQuestions(null)}
                    />
                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="analysis-section">
                    {isMobile && unlockedFeatures.analysis && (
                      <div className="analysis-section-mobile-controls">
                        <AnalysisControls />
                      </div>
                    )}

                    <div className="analysis-content">
                      <AnalysisContentManager {...analysisProps} />
                    </div>
                  </div>
                )}
                {activeTab === "strategic" && (
                  <div className="strategic-section">
                    <StrategicAnalysis
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={handleStrategicAnalysisRegenerate}
                      isRegenerating={isStrategicRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      strategicData={strategicData}
                      selectedBusinessId={selectedBusinessId}
                      phaseManager={phaseManager}
                      saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                      hideDownload={false}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSetupPage;