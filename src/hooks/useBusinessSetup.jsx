import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from "./useTranslation";
import { useAuthStore, useBusinessStore, useUIStore, useAnalysisStore, useProjectStore } from "../store";
import { AnalysisApiService, PHASE_API_CONFIG } from '../services/analysisApiService';
import { useQueryClient } from "@tanstack/react-query";
import { getUserLimits } from '../utils/authUtils';
import PhaseManager, { getUnlockedFeatures } from "../components/PhaseManager";
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";

const CARD_ID_MAP = {
  "swot_analysis": "swot",
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
  const queryClient = useQueryClient();

  const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const swotRef = useRef(null);
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
  const isArchived = (currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden');
  const getAuthToken = useCallback(() => token, [token]);

  // AI Context Synchronization
  useEffect(() => {
    let pageContext = null;
    if (activeTab === "executive") pageContext = AI_PAGE_CONTEXTS.EXECUTIVE_SUMMARY;
    else if (activeTab === "priorities") pageContext = AI_PAGE_CONTEXTS.PRIORITIES;
    else if (activeTab === "advanced") pageContext = AI_PAGE_CONTEXTS.ADVANCED;
    else if (activeTab === "insights") pageContext = AI_PAGE_CONTEXTS.INSIGHTS;
    else if (activeTab === "strategic") pageContext = AI_PAGE_CONTEXTS.STRATEGIC;
    else if (activeTab === "decision-logs" || activeTab === "bets") pageContext = AI_PAGE_CONTEXTS.PROJECTS;
    else if (activeTab === "ranking") pageContext = AI_PAGE_CONTEXTS.RANKING;

    let contextPayload = { ...pageContext };

    if (activeTab === "advanced" && questions && questions.length > 0) {
      const qaData = questions.map(q => ({
        question: q.question_text,
        answer: userAnswers[q._id || q.question_id] || "Not Answered"
      }));
      contextPayload.page_content = qaData;
    }

    const isStrategicTab = ["executive", "priorities"].includes(activeTab);
    const isDisabled = isStrategicTab && !isPmfOnboardingComplete;

    window.dispatchEvent(
      new CustomEvent("ai_context_changed", {
        detail: { pageContext: contextPayload, isArchived, isDisabled }
      })
    );
  }, [activeTab, questions, userAnswers, isArchived, isPmfOnboardingComplete]);

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

  // Reset refresh trigger when business changes to avoid stale force-refresh state
  useEffect(() => {
    setPmfRefreshTrigger(0);
  }, [selectedBusinessId]);

  const [answerIds, setAnswerIds] = useState({});
  const [isPmfOnboardingComplete, setIsPmfOnboardingComplete] = useState(true);

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
  const swotAnalysisResult = useAnalysisStore(state => state.swotAnalysis);
  const portersData = useAnalysisStore(state => state.portersData);
  const pestelData = useAnalysisStore(state => state.pestelData);
  const fullSwotData = useAnalysisStore(state => state.fullSwotData);
  const competitiveAdvantageData = useAnalysisStore(state => state.competitiveAdvantage);
  const strategicData = useAnalysisStore(state => state.strategicData);
  const expandedCapabilityData = useAnalysisStore(state => state.expandedCapability);
  const strategicRadarData = useAnalysisStore(state => state.strategicRadar);
  const productivityData = useAnalysisStore(state => state.productivityData);
  const maturityData = useAnalysisStore(state => state.maturityData);
  const competitiveLandscapeData = useAnalysisStore(state => state.competitiveLandscape);
  const coreAdjacencyData = useAnalysisStore(state => state.coreAdjacency);
  const profitabilityData = useAnalysisStore(state => state.profitabilityData);
  const growthTrackerData = useAnalysisStore(state => state.growthTrackerData);
  const liquidityEfficiencyData = useAnalysisStore(state => state.liquidityEfficiencyData);
  const investmentPerformanceData = useAnalysisStore(state => state.investmentPerformanceData);
  const leverageRiskData = useAnalysisStore(state => state.leverageRiskData);

  const isAnalysisRegenerating = isTypeRegenerating('swot') || isTypeRegenerating('porters') || isTypeRegenerating('pestel') || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
  const isStrategicRegenerating = isTypeRegenerating('strategic');
  const [regenerationStatus, setRegenerationStatus] = useState(null);
  const isFinancialRegenerating = isTypeRegenerating('financial') || isTypeRegenerating('profitability') || isTypeRegenerating('growth') || isTypeRegenerating('liquidity') || isTypeRegenerating('investment') || isTypeRegenerating('leverage');
  const isEssentialPhaseGenerating = isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced') || isTypeRegenerating('fullSwot') || isTypeRegenerating('competitiveAdvantage') || isTypeRegenerating('expandedCapability') || isTypeRegenerating('strategicRadar') || isTypeRegenerating('productivity') || isTypeRegenerating('maturity');
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "success" });
  const showToastMessage = useCallback((message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: "success" }), 3000);
  }, []);

  const stateSetters = useMemo(() => ({
    setSwotAnalysisResult: (d) => setAnalysisData('swot', d),
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

  const isViewer = (userRole || "").toLowerCase() === "viewer";
  const readOnly = isArchived || isViewer;
  const canRegenerate = !isArchived && !isViewer && unlockedFeatures?.analysis;
  const companyAdminIds = currentBusiness?.company_admin_ids || [];

  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);
  const [showPMFOnboarding, setShowPMFOnboarding] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: currentBusiness?.business_name || "",
    purpose: currentBusiness?.business_purpose || "",
    business_id: selectedBusinessId
  });

  // Sync businessData in useBusinessSetup when currentBusiness changes
  useEffect(() => {
    if (currentBusiness) {
      setBusinessData({
        name: currentBusiness.business_name || "",
        purpose: currentBusiness.business_purpose || "",
        business_id: currentBusiness._id || currentBusiness.id || selectedBusinessId
      });
    }
  }, [currentBusiness, selectedBusinessId]);

  // Initialize Projects tab visibility from UI Store (scoped per business)
  useEffect(() => {
    if (!selectedBusinessId) return;
    const storedVisibility = getBusinessSetting(selectedBusinessId, 'showProjectsTab');
    // Only restore the tab if the user has project access on their current plan
    if (storedVisibility === true && hasProjectAccess) {
      setShowProjectsTab(true);
    } else {
      setShowProjectsTab(false);
    }
  }, [selectedBusinessId, hasProjectAccess, getBusinessSetting]);

  // Ensure Projects tab button appears once projects is active (only if user has project access)
  useEffect(() => {
    if ((activeTab === 'bets' || activeTab === 'ranking' || activeTab === 'decision-logs') && !showProjectsTab && hasProjectAccess) {
      setShowProjectsTab(true);
      if (selectedBusinessId) {
        setBusinessSetting(selectedBusinessId, 'showProjectsTab', true);
      }
    }
  }, [activeTab, showProjectsTab, selectedBusinessId, hasProjectAccess, setBusinessSetting]);

  // Automatically show Projects tab if this business already has projects
  // Skip this check when on the projects tab itself (handled by ProjectsSection) or if already visible
  useEffect(() => {
    if (showProjectsTab || !selectedBusinessId || activeTab === 'bets' || activeTab === 'ranking' || activeTab === 'decision-logs') return;

    const fetchProjectsForBusiness = async () => {
      try {
        // Use the synchronized store method which handles promise caching
        const data = await useProjectStore.getState().fetchProjects(selectedBusinessId, { silent: true });
        const hasProjects = (data?.projects || []).length > 0;

        if (hasProjects && hasProjectAccess) {
          setShowProjectsTab(true);
          setBusinessSetting(selectedBusinessId, 'showProjectsTab', true);
        }
      } catch (err) {
        console.error('Failed to check existing projects for business:', err);
      }
    };

    fetchProjectsForBusiness();
  }, [selectedBusinessId, hasProjectAccess, activeTab, showProjectsTab, setBusinessSetting]);

  
  useEffect(() => {
    if (!searchParams.get('tab') && activeTab) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', activeTab);
        return next;
      }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

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
    queryClient.invalidateQueries({
      queryKey: ["projects", selectedBusinessId]
    });
    queryClient.invalidateQueries({
      queryKey: ["rankingsSummary", selectedBusinessId]
    });
    queryClient.invalidateQueries({
      queryKey: ["teamRankings", selectedBusinessId]
    });
    useProjectStore.getState().setViewMode('projects');
    setShowProjectsTab(true);
    setActiveTab("bets");
  }, [selectedBusinessId, queryClient]);

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

  const lastBusinessId = useRef(selectedBusinessId);

  useEffect(() => {
    if (selectedBusinessId) {
      // Clear document state if business changed
      if (lastBusinessId.current !== selectedBusinessId) {
        setDocumentInfo(null);
        setHasUploadedDocument(false);
        lastBusinessId.current = selectedBusinessId;
      }

      // Clear analysis keys for the new business
      fetchedAnalysisKeys.current.clear();
      
      // OPTIMIZATION: Only fetch legacy analysis data if on analysis-heavy tabs
      const needsLegacyAnalysis = ['insights', 'strategic'].includes(activeTab);
      if (needsLegacyAnalysis) {
        fetchAnalysisData(selectedBusinessId);
      }
      
      // OPTIMIZATION: Only fetch financial document/questions if on onboarding/analysis tabs
      // These tabs no longer trigger these calls to reduce unwanted network traffic.
      const skipFinancial = ['executive', 'priorities', 'bets', 'ranking', 'decision-logs', 'strategic', 'insights'].includes(activeTab);
      const skipQuestions = ['executive', 'priorities', 'bets', 'ranking', 'decision-logs', 'strategic', 'insights'].includes(activeTab);
      
      if (!skipFinancial || !skipQuestions) {
        fetchInitialSetupData(selectedBusinessId, { skipFinancial, skipQuestions }).then(result => {
          if (result?.docInfo) {
            setDocumentInfo(result.docInfo);
            setHasUploadedDocument(true);
          } else if (!skipFinancial) {
            setHasUploadedDocument(false);
            setDocumentInfo(null);
          }
        });
      }
    }
  }, [selectedBusinessId, activeTab]); // Include activeTab to re-fetch if we enter a tab that needs it


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
      try {
        setRegenerationStatus('insights');
        const state = useAnalysisStore.getState();
        await state.regeneratePhase(targetPhase, state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
        if (alsoRegenerateStrategic) {
          setRegenerationStatus('strategic');
          await regenerateIndividualAnalysis('strategic', state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
        }
      } finally {
        setRegenerationStatus(null);
      }
    };
    if (skipConfirmation) perform();
    else triggerConfirmation(t("Regenerate Phase Analysis?"), t("Are you sure?"), perform);
  };

  const handleRegenerateAllAnalysis = async (options = {}) => {
    const perform = async () => {
      try {
        const state = useAnalysisStore.getState();
        
        // Force recalculate phase to handle newly applied AI answers
        const unlocked = getUnlockedFeatures(state.questions, state.userAnswers, state.completedQuestions, hasUploadedDocument);
        const targetPhase = unlocked.advancedPhase ? 'advanced' : (unlocked.essentialPhase ? 'essential' : 'initial');
  
        // Collect unique types based on the detected targetPhase
        const typesToRun = new Set();
        
        // Use the specific configuration for the detected phase
        if (PHASE_API_CONFIG[targetPhase]) { 
            PHASE_API_CONFIG[targetPhase].forEach(t => typesToRun.add(t));
        }
        
        // Optionally add financial types if doc exists and requested
        if ((options.includeFinancial || options.onlyFinancial) && hasUploadedDocument && !options.skipFinancial) {
            PHASE_API_CONFIG.financial.forEach(t => typesToRun.add(t));
        }
  
        const typesArray = Array.from(typesToRun);
  
        // 1. Step 1: Bulk Insights
        setRegenerationStatus('insights');
        // Execute bulk regeneration
        await state.regenerateCustomTypes(typesArray, state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
  
        // 2. Step 2: Strategic Analysis (which encompasses multiple pillars)
        if (options.alsoRegenerateStrategic !== false) {
          setRegenerationStatus('strategic');
          await regenerateIndividualAnalysis('strategic', state.questions, state.userAnswers, selectedBusinessId, showToastMessage);
        }
      } finally {
        setRegenerationStatus(null);
      }
    };

    if (options?.skipConfirmation) perform();
    else triggerConfirmation(t("Regenerate All Analysis?"), t("This will regenerate everything."), perform);
  };

  const commonProps = useMemo(() => ({
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
    swotAnalysisResult,
    portersData,
    pestelData,
    competitiveLandscapeData,
    coreAdjacencyData,
    isViewer,
    readOnly,
    canRegenerate,
    hideImproveButton: readOnly,
    showImproveButton: !readOnly,
    uploadedFileForAnalysis,
    onRedirectToChat: (businessId) => {
        setActiveTab('advanced');
        // Additional logic if needed to focus on chat
    },
    accessModalMessage, accessModalSubMessage,
    handleAnswerUpdate: (qId, ans) => setUserAnswer(qId, ans),
    handleRegeneratePhase,
    handleStrategicAnalysisRegenerate: () => regenerateIndividualAnalysis('strategic', questions, userAnswers, selectedBusinessId, showToastMessage),
    handleRegenerateAllAnalysis,
    questions, questionsLoaded, userAnswers, completedQuestions,
    apiService, phaseManager,
    t,
    swotRef, portersRef, pestelRef,
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
        swotRef, portersRef, pestelRef,
        fullSwotRef, competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef,
        productivityRef, maturityScoreRef, profitabilityRef, growthTrackerRef,
        liquidityEfficiencyRef, investmentPerformanceRef, leverageRiskRef,
        competitiveLandscapeRef, coreAdjacencyRef,
        currentPhase,
        swotAnalysisResult,
        portersData,
        pestelData,
        fullSwotData,
        competitiveAdvantageData,
        expandedCapabilityData,
        strategicRadarData,
        productivityData,
        maturityData,
        competitiveLandscapeData,
        coreAdjacencyData,
        profitabilityData,
        growthTrackerData,
        liquidityEfficiencyData,
        investmentPerformanceData,
        leverageRiskData,
        strategicData
    }
  }), [
    activeTab, setActiveTab, isMobile, setIsMobile, isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding, currentBusiness, selectedBusinessId, businessData,
    showConfirmModal, setShowConfirmModal, confirmConfig, triggerConfirmation,
    activeNavDropdown, setActiveNavDropdown, navDropdownRef, showToast, setShowToast,
    showToastMessage, showDropdown, setShowDropdown, highlightedMissingQuestions,
    setHighlightedMissingQuestions, showPMFOnboarding, setShowPMFOnboarding,
    isPmfOnboardingComplete, setIsPmfOnboardingComplete, documentInfo, setDocumentInfo,
    hasUploadedDocument, setHasUploadedDocument, isAnalysisRegenerating,
    isStrategicRegenerating, regenerationStatus, isStoreLoading, fullSwotData, competitiveAdvantageData,
    expandedCapabilityData, strategicRadarData, productivityData, maturityData,
    profitabilityData, growthTrackerData, liquidityEfficiencyData,
    investmentPerformanceData, leverageRiskData, strategicData, accessModalMessage,
    accessModalSubMessage, setUserAnswer, handleRegeneratePhase,
    regenerateIndividualAnalysis, questions, userAnswers, handleRegenerateAllAnalysis,
    questionsLoaded, completedQuestions, apiService, phaseManager, t, swotRef,
    portersRef, pestelRef, fullSwotRef,
    competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef, productivityRef,
    maturityScoreRef, profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef, competitiveLandscapeRef, coreAdjacencyRef,
    highlightedCard, setHighlightedCard, expandedCards, setExpandedCards,
    collapsedCategories, setCollapsedCategories, selectedDropdownValue,
    setSelectedDropdownValue, handleOptionClick, handleScrollToSection,
    handleExecutiveTabClick, handlePrioritiesTabClick, handleBriefTabClick,
    handleAnalysisTabClick, handleStrategicTabClick, handleProjectCountChange,
    handleKickstartSuccess, handleStayOnPriorities, handleBack, showProjectsTab,
    hasPmfAccess, hasInsightAccess, hasStrategicAccess, hasProjectAccess, isArchived,
    openModal, closeModal, isModalOpen, pmfRefreshTrigger, setPmfRefreshTrigger,
    isFinancialRegenerating, isEssentialPhaseGenerating, isTypeRegenerating,
    unlockedFeatures, companyAdminIds, phaseAnalysisArray, currentPhase,
    setUploadedFileForAnalysis, setBusinessData, handleRedirectToBrief
  ]);

  return commonProps;
};
