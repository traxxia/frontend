import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from "./useTranslation";
import { useAuthStore, useBusinessStore, useUIStore, useAnalysisStore, useProjectStore } from "../store";
import { AnalysisApiService } from '../services/analysisApiService';
import { getUserLimits } from '../utils/authUtils';
import PhaseManager from "../components/PhaseManager";

const CARD_ID_MAP = {
  "swot_analysis": "swot",
  "Purchase_Criteria": "purchase-criteria",
  "Loyalty_&_NPS": "loyalty-nps",
  "Porters_Five_Forces": "porters",
  "PESTEL_Analysis": "pestel",
  "Full_SWOT_Portfolio": "full-swot",
  "Competitive_Advantage_Matrix": "competitive-advantage",
  "Capability_Heatmap": "expanded-capability",
  "Strategic_Positioning_Radar": "strategic-radar",
  "Productivity_Metrics": "productivity",
  "Maturity_Score": "maturity",
  "Profitability_Analysis": "profitability-analysis",
  "Growth_Tracker": "growth-tracker",
  "Liquidity_Efficiency": "liquidity-efficiency",
  "Investment_Performance": "investment-performance",
  "Leverage_Risk": "leverage-risk",
  "Competitive_Landscape": "competitive-landscape",
  "Core": "core-adjacency",
};

export const useBusinessSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { pmf: hasPmfAccess, insight: hasInsightAccess, strategic: hasStrategicAccess, project: hasProjectAccess } = getUserLimits();

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const swotRef = useRef(null);
  const purchaseCriteriaRef = useRef(null);
  const loyaltyNpsRef = useRef(null);
  const portersRef = useRef(null);
  const pestelRef = useRef(null);
  const fullSwotRef = useRef(null);
  const competitiveAdvantageRef = useRef(null);
  const expandedCapabilityRef = useRef(null);
  const strategicRadarRef = useRef(null);
  const productivityRef = useRef(null);
  const maturityScoreRef = useRef(null);
  const profitabilityRef = useRef(null);
  const growthTrackerRef = useRef(null);
  const liquidityEfficiencyRef = useRef(null);
  const investmentPerformanceRef = useRef(null);
  const leverageRiskRef = useRef(null);
  const competitiveLandscapeRef = useRef(null);
  const coreAdjacencyRef = useRef(null);

  const {
    selectedBusinessId,
    selectedBusiness: currentBusiness,
    setSelectedBusinessId
  } = useBusinessStore();

  const token = useAuthStore(state => state.token);
  const userRole = useAuthStore(state => state.userRole);
  const getAuthToken = useCallback(() => token, [token]);

  const [documentInfo, setDocumentInfo] = useState(null);
  const [phaseAnalysisArray, setPhaseAnalysisArray] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState(
    new Set(['current-strategy', 'costs-financial', 'context-industry', 'customer', 'capabilities', 'competition'])
  );

  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const fetchedAnalysisKeys = useRef(new Set());

  const {
    getBusinessSetting,
    setBusinessSetting,
    openModal,
    closeModal,
    isModalOpen,
    setLoading: setStoreLoading,
    isLoading: isStoreLoading
  } = useUIStore();

  const [showProjectsTab, setShowProjectsTab] = useState(() =>
    getBusinessSetting(selectedBusinessId, 'showProjectsTab') === true
  );

  const [pmfRefreshTrigger, setPmfRefreshTrigger] = useState(0);
  const [answerIds, setAnswerIds] = useState({});
  const [isPmfOnboardingComplete, setIsPmfOnboardingComplete] = useState(true);

  const setApiLoading = useCallback((apiEndpoint, isLoading) => {
    setStoreLoading(apiEndpoint, isLoading);
  }, [setStoreLoading]);

  const apiService = useMemo(() => new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  ), [ML_API_BASE_URL, API_BASE_URL, getAuthToken, setApiLoading]);

  const questions = useAnalysisStore(state => state.questions);
  const questionsLoaded = useAnalysisStore(state => state.questionsLoaded);
  const userAnswers = useAnalysisStore(state => state.userAnswers);
  const completedQuestions = useAnalysisStore(state => state.completedQuestions);
  const setUserAnswer = useAnalysisStore(state => state.setUserAnswer);
  const setAnalysisData = useAnalysisStore(state => state.setAnalysisData);
  const fetchAnalysisData = useAnalysisStore(state => state.fetchAnalysisData);
  const fetchInitialSetupData = useAnalysisStore(state => state.fetchInitialSetupData);
  const regeneratePhase = useAnalysisStore(state => state.regeneratePhase);
  const regenerateIndividualAnalysis = useAnalysisStore(state => state.regenerateIndividualAnalysis);
  const isTypeRegenerating = useAnalysisStore(state => state.isRegenerating);
  const resetAnalysis = useAnalysisStore(state => state.resetAnalysis);
  const fullSwotData = useAnalysisStore(state => state.fullSwot);
  const competitiveAdvantageData = useAnalysisStore(state => state.competitiveAdvantage);
  const expandedCapabilityData = useAnalysisStore(state => state.expandedCapability);
  const strategicRadarData = useAnalysisStore(state => state.strategicRadar);
  const productivityData = useAnalysisStore(state => state.productivity);
  const maturityData = useAnalysisStore(state => state.maturity);
  const profitabilityData = useAnalysisStore(state => state.profitability);
  const growthTrackerData = useAnalysisStore(state => state.growth);
  const liquidityEfficiencyData = useAnalysisStore(state => state.liquidity);
  const investmentPerformanceData = useAnalysisStore(state => state.investment);
  const leverageRiskData = useAnalysisStore(state => state.leverage);
  const strategicData = useAnalysisStore(state => state.strategic);

  const isAnalysisRegenerating = isTypeRegenerating('swot') || isTypeRegenerating('purchaseCriteria') || isTypeRegenerating('loyaltyNPS') || isTypeRegenerating('porters') || isTypeRegenerating('pestel') || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
  const isStrategicRegenerating = isTypeRegenerating('strategic');
  const isFinancialRegenerating = isTypeRegenerating('financial') || isTypeRegenerating('profitability') || isTypeRegenerating('growth') || isTypeRegenerating('liquidity') || isTypeRegenerating('investment') || isTypeRegenerating('leverage');
  const isEssentialPhaseGenerating = isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced') || isTypeRegenerating('fullSwot') || isTypeRegenerating('competitiveAdvantage') || isTypeRegenerating('expandedCapability') || isTypeRegenerating('strategicRadar') || isTypeRegenerating('productivity') || isTypeRegenerating('maturity');
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "success" });
  const showToastMessage = useCallback((message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: "success" }), 3000);
  }, []);

  const stateSetters = useMemo(() => ({
    setSwotAnalysisResult: (d) => setAnalysisData('swot', d),
    setPurchaseCriteriaData: (d) => setAnalysisData('purchaseCriteria', d),
    setLoyaltyNPSData: (d) => setAnalysisData('loyaltyNPS', d),
    setPortersData: (d) => setAnalysisData('porters', d),
    setPestelData: (d) => setAnalysisData('pestel', d),
    setFullSwotData: (d) => setAnalysisData('fullSwot', d),
    setCompetitiveAdvantageData: (d) => setAnalysisData('competitiveAdvantage', d),
    setExpandedCapabilityData: (d) => setAnalysisData('expandedCapability', d),
    setStrategicRadarData: (d) => setAnalysisData('strategicRadar', d),
    setProductivityData: (d) => setAnalysisData('productivity', d),
    setMaturityData: (d) => setAnalysisData('maturity', d),
    setProfitabilityData: (d) => setAnalysisData('profitability', d),
    setGrowthTrackerData: (d) => setAnalysisData('growthTracker', d),
    setLiquidityEfficiencyData: (d) => setAnalysisData('liquidityEfficiency', d),
    setInvestmentPerformanceData: (d) => setAnalysisData('investmentPerformance', d),
    setLeverageRiskData: (d) => setAnalysisData('leverageRisk', d),
    setCompetitiveLandscapeData: (d) => setAnalysisData('competitiveLandscape', d),
    setCoreAdjacencyData: (d) => setAnalysisData('coreAdjacency', d),
    setStrategicData: (d) => setAnalysisData('strategic', d),
    uploadedFile: uploadedFileForAnalysis,
  }), [setAnalysisData, uploadedFileForAnalysis]);

  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    hasUploadedDocument, setHasUploadedDocument,
    onDocumentInfoLoad: (docInfo) => setDocumentInfo(docInfo),
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      useAnalysisStore.setState({ completedQuestions: Array.from(completedSet) });
      Object.entries(answersMap).forEach(([qId, ans]) => setUserAnswer(qId, ans));
    },
    onAnalysisDataLoad: (data) => setPhaseAnalysisArray(data),
    API_BASE_URL, getAuthToken, apiService, stateSetters, showToastMessage
  });

  const unlockedFeatures = phaseManager.getUnlockedFeatures();
  const companyAdminIds = currentBusiness?.company_admin_ids || [];

  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);
  const [showPMFOnboarding, setShowPMFOnboarding] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: currentBusiness?.business_name || "",
    purpose: currentBusiness?.business_purpose || "",
  });

  const activeTab = useMemo(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;
    if (window.__businessPageNavState?.initialTab) return window.__businessPageNavState.initialTab;
    if (window.history.state?.usr?.initialTab) return window.history.state.usr.initialTab;
    if (hasPmfAccess) return "executive";
    if (hasInsightAccess || hasStrategicAccess) return "advanced";
    if (hasProjectAccess) return "bets";
    return "advanced";
  }, [searchParams, hasPmfAccess, hasInsightAccess, hasStrategicAccess, hasProjectAccess]);

  const setActiveTab = useCallback((newTab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (next.get('tab') === newTab) return prev;
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(t("Go_to_Section"));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => { } });
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const navDropdownRef = useRef(null);

  const triggerConfirmation = (title, message, onConfirm) => {
    setConfirmConfig({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const [accessModalMessage, setAccessModalMessage] = useState('');
  const [accessModalSubMessage, setAccessModalSubMessage] = useState('');
  const handleScrollToSection = useCallback((cardId) => {
    const refs = {
      swot: swotRef,
      "purchase-criteria": purchaseCriteriaRef,
      "loyalty-nps": loyaltyNpsRef,
      porters: portersRef,
      pestel: pestelRef,
      "full-swot": fullSwotRef,
      "competitive-advantage": competitiveAdvantageRef,
      "expanded-capability": expandedCapabilityRef,
      "strategic-radar": strategicRadarRef,
      productivity: productivityRef,
      maturity: maturityScoreRef,
      "profitability-analysis": profitabilityRef,
      "growth-tracker": growthTrackerRef,
      "liquidity-efficiency": liquidityEfficiencyRef,
      "investment-performance": investmentPerformanceRef,
      "leverage-risk": leverageRiskRef,
      "competitive-landscape": competitiveLandscapeRef,
      "core-adjacency": coreAdjacencyRef
    };

    const targetRef = refs[cardId];
    if (targetRef && targetRef.current) {
      setHighlightedCard(cardId);
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedCard(null), 3000);
    }
  }, []);

  const handleOptionClick = useCallback((option) => {
    setShowDropdown(false);
    setSelectedDropdownValue(t(option));
    const cardId = CARD_ID_MAP[option];
    if (cardId) handleScrollToSection(cardId);
  }, [t, handleScrollToSection]);

  const handleExecutiveTabClick = useCallback(() => {
    if (isMobile) setActiveTab("executive");
    else {
      if (!isAnalysisExpanded) setIsAnalysisExpanded(true);
      setActiveTab("executive");
    }
  }, [isMobile, isAnalysisExpanded]);

  const handlePrioritiesTabClick = useCallback(() => {
    if (isMobile) setActiveTab("priorities");
    else {
      if (!isAnalysisExpanded) setIsAnalysisExpanded(true);
      setActiveTab("priorities");
    }
  }, [isMobile, isAnalysisExpanded]);

  const handleBriefTabClick = useCallback(() => {
    if (isMobile) setActiveTab("advanced");
    else {
      if (!isAnalysisExpanded) setIsAnalysisExpanded(true);
      setActiveTab("advanced");
    }
  }, [isMobile, isAnalysisExpanded]);

  const handleAnalysisTabClick = useCallback(() => {
    if (isMobile) setActiveTab("insights");
    else {
      if (!isAnalysisExpanded) setIsAnalysisExpanded(true);
      setActiveTab("insights");
    }
  }, [isMobile, isAnalysisExpanded]);

  const handleStrategicTabClick = useCallback(() => {
    if (isMobile) setActiveTab("strategic");
    else {
      if (!isAnalysisExpanded) setIsAnalysisExpanded(true);
      setActiveTab("strategic");
    }
  }, [isMobile, isAnalysisExpanded]);

  const handleProjectCountChange = useCallback((count) => {
    const hasProjects = count > 0;
    setShowProjectsTab(hasProjects);
    if (selectedBusinessId) {
      setBusinessSetting(selectedBusinessId, 'showProjectsTab', hasProjects);
    }
  }, [selectedBusinessId, setBusinessSetting]);

  const handleKickstartSuccess = useCallback(() => {
    const clearProjectCache = useProjectStore.getState().clearCache;
    clearProjectCache(selectedBusinessId);
    useProjectStore.getState().setViewMode('projects');
    setShowProjectsTab(true);
    setActiveTab("bets");
  }, [selectedBusinessId]);

  const handleStayOnPriorities = useCallback(() => {
    setShowProjectsTab(true);
  }, []);

  const handleRedirectToBrief = useCallback((missingData) => {
    setHighlightedMissingQuestions(missingData);
    if (isMobile) setActiveTab("advanced");
    else {
      if (isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(false);
        setActiveTab("advanced");
        setTimeout(() => setIsSliding(false), 1000);
      } else setActiveTab("advanced");
    }
    showToastMessage(`Please answer ${missingData.missing_count} more question${missingData.missing_count > 1 ? 's' : ''} to generate this analysis.`, "warning");
    setTimeout(() => setHighlightedMissingQuestions(null), 30000);
  }, [isMobile, isAnalysisExpanded, showToastMessage]);

  const handleBack = useCallback(() => navigate("/dashboard"), [navigate]);
  useEffect(() => {
    if (location.state?.business?._id && location.state.business._id !== selectedBusinessId) {
      setSelectedBusinessId(location.state.business._id);
    }
  }, [location.state?.business, selectedBusinessId, setSelectedBusinessId]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchedAnalysisKeys.current.clear();
      fetchAnalysisData(selectedBusinessId);
      fetchInitialSetupData(selectedBusinessId).then(result => {
        if (result?.docInfo) {
          setDocumentInfo(result.docInfo);
          setHasUploadedDocument(true);
        } else {
          setHasUploadedDocument(false);
        }
      });
    }
  }, [selectedBusinessId, fetchAnalysisData, fetchInitialSetupData]);

  const isArchived = (currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setActiveNavDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentPhase = useCallback(() => {
    const unlocked = phaseManager.getUnlockedFeatures();
    if (unlocked.advancedPhase) return 'advanced';
    if (unlocked.essentialPhase) return 'essential';
    return 'initial';
  }, [phaseManager]);

  const currentPhase = getCurrentPhase();

  const handleRegeneratePhase = (phaseOverride = null, alsoRegenerateStrategic = false, options = {}) => {
    const targetPhase = phaseOverride || getCurrentPhase();
    const skipConfirmation = options?.skipConfirmation || false;
    const perform = async () => {
      const state = useAnalysisStore.getState();
      await state.regeneratePhase(targetPhase, state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
      if (alsoRegenerateStrategic) await regenerateIndividualAnalysis('strategic', state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
    };
    if (skipConfirmation) perform();
    else triggerConfirmation(t("Regenerate Phase Analysis?"), t("Are you sure?"), perform);
  };

  const handleRegenerateAllAnalysis = async (options = {}) => {
    const perform = async () => {
      const state = useAnalysisStore.getState();
      await state.regeneratePhase(getCurrentPhase(), state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
      await regenerateIndividualAnalysis('strategic', state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
    };
    if (options?.skipConfirmation) perform();
    else triggerConfirmation(t("Regenerate All Analysis?"), t("This will regenerate everything."), perform);
  };

  const commonProps = {
    activeTab, setActiveTab,
    isMobile, setIsMobile,
    isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding,
    currentBusiness, selectedBusinessId,
    businessData,
    selectedBusinessName: currentBusiness?.business_name || "",
    showConfirmModal, setShowConfirmModal, confirmConfig, triggerConfirmation,
    activeNavDropdown, setActiveNavDropdown, navDropdownRef,
    showToast, setShowToast, showToastMessage,
    showDropdown, setShowDropdown,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    showPMFOnboarding, setShowPMFOnboarding,
    isPmfOnboardingComplete, setIsPmfOnboardingComplete,
    documentInfo, setDocumentInfo,
    hasUploadedDocument, setHasUploadedDocument,
    isAnalysisRegenerating, isStrategicRegenerating,
    isStoreLoading,
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
    strategicData,
    accessModalMessage, accessModalSubMessage,
    handleAnswerUpdate: (qId, ans) => setUserAnswer(qId, ans),
    handleRegeneratePhase,
    handleStrategicAnalysisRegenerate: () => regenerateIndividualAnalysis('strategic', questions, userAnswers, selectedBusinessId, showToastMessage),
    handleRegenerateAllAnalysis,
    questions, questionsLoaded, userAnswers, completedQuestions,
    apiService, phaseManager,
    t,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, portersRef, pestelRef,
    fullSwotRef, competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef,
    productivityRef, maturityScoreRef, profitabilityRef, growthTrackerRef,
    liquidityEfficiencyRef, investmentPerformanceRef, leverageRiskRef,
    competitiveLandscapeRef, coreAdjacencyRef,
    highlightedCard, setHighlightedCard,
    expandedCards, setExpandedCards,
    collapsedCategories, setCollapsedCategories,
    selectedDropdownValue, setSelectedDropdownValue,
    handleOptionClick, handleScrollToSection,
    handleExecutiveTabClick, handlePrioritiesTabClick,
    handleBriefTabClick, handleAnalysisTabClick, handleStrategicTabClick,
    handleProjectCountChange, handleKickstartSuccess, handleStayOnPriorities,
    handleBack, showProjectsTab,
    hasPmfAccess, hasInsightAccess, hasStrategicAccess, hasProjectAccess,
    isArchived,
    openModal, closeModal, isModalOpen,
    pmfRefreshTrigger, setPmfRefreshTrigger,
    isFinancialRegenerating,
    isEssentialPhaseGenerating,
    isTypeRegenerating,
    unlockedFeatures,
    companyAdminIds,
    phaseAnalysisArray,
    currentPhase,
    setUploadedFile: setUploadedFileForAnalysis,
    handleBusinessDataUpdate: (newData) => setBusinessData(prev => ({ ...prev, ...newData })),
    canShowRegenerateButtons: !isArchived && !isAnalysisRegenerating && unlockedFeatures.analysis,
    analysisProps: {
        phaseManager,
        selectedBusinessId,
        handleRedirectToBrief,
        showToastMessage,
        apiService,
        triggerConfirmation,
        hasInsightAccess,
        isAnalysisRegenerating,
        isStrategicRegenerating,
        highlightedMissingQuestions,
        setHighlightedMissingQuestions,
        swotRef, purchaseCriteriaRef, loyaltyNpsRef, portersRef, pestelRef,
        fullSwotRef, competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef,
        productivityRef, maturityScoreRef, profitabilityRef, growthTrackerRef,
        liquidityEfficiencyRef, investmentPerformanceRef, leverageRiskRef,
        competitiveLandscapeRef, coreAdjacencyRef,
        currentPhase
    }
  };

  return commonProps;
};
