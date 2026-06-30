import React, { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Loader,
  Loader2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Menu,
  X,
  LayoutDashboard,
  HelpCircle,
  TrendingUp,
  Target,
  ListTodo,
  Briefcase,
  BarChart4,
  FileText
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useBusinessStore, useUIStore, useAnalysisStore, useProjectStore } from "../store";
import { useShallow } from 'zustand/shallow';
import { useQueryClient } from "@tanstack/react-query";

import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PhaseManager, { getUnlockedFeatures } from "../components/PhaseManager";
import PhaseUnlockToast from "../components/PhaseUnlockToast";
import AnalysisContentManager from "../components/AnalysisContentManager";
import { extractBusinessName } from '../utils/businessHelpers';
import PDFExportButton from "../components/PDFExportButton";
import { AnalysisApiService } from '../services/analysisApiService';
import "../styles/businesspage.css";
import "../styles/business.css";
import { useStreamingManager } from '../components/StreamingManager';
import ProjectsSection from "../components/ProjectsSection";
import RankingSection from "../components/RankingSection";
import PMFInsightsTab from "../components/PMFInsightsTab";
import ExecutiveSummary from "../components/ExecutiveSummary";
import PrioritiesProjects from "../components/PrioritiesProjects";
import ConfirmationModal from '../components/ConfirmationModal';
import UpgradeModal from "../components/UpgradeModal";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import BusinessDecisionLogs from "../components/BusinessDecisionLogs";
import { answerService } from "../services/answerService";
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";
import { getUserLimits } from '../utils/authUtils';
import CustomTooltip from "../components/CustomTooltip";
import { BusinessSetupContext } from "../context/BusinessSetupContext";
import PlanLimitModal from "../components/PlanLimitModal";
import OnboardingChat from "../components/OnboardingChat";
import TraxSidebar from "../components/TraxSidebar";
import CadencesSection from "../components/CadencesSection";

const CARD_TO_CATEGORY_MAP = {
  "profitability-analysis": "costs-financial",
  "growth-tracker": "costs-financial",
  "liquidity-efficiency": "costs-financial",
  "investment-performance": "costs-financial",
  "leverage-risk": "costs-financial",
  "productivity": "costs-financial",
  "swot": "context-industry",
  "full-swot": "context-industry",
  "strategic-radar": "context-industry",
  "porters": "context-industry",
  "pestel": "context-industry",
  "competitive-advantage": "customer",
  "expanded-capability": "capabilities",
  "maturity": "capabilities",
  "competitive-landscape": "competition",
  "core-adjacency": "current-strategy",
};

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

// Helper: turn a business name into a URL-safe slug
const toSlug = (name = '') =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


const BusinessSetupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, currentLanguage } = useTranslation();
  const limits = getUserLimits();
  const hasPmfAccess = true;
  const hasInsightAccess = true;
  const hasStrategicAccess = true;
  const hasProjectAccess = true;
  const queryClient = useQueryClient();

  // State management for business context
  const {
    selectedBusinessId,
    selectedBusiness: currentBusiness,
    fetchBusiness,
    setSelectedBusinessId
  } = useBusinessStore();

  // Sync component state with store if we received a business from location (legacy support)
  useEffect(() => {
    if (location.state?.business?._id && location.state.business._id !== selectedBusinessId) {
      setSelectedBusinessId(location.state.business._id);
    }
  }, [location.state?.business, selectedBusinessId, setSelectedBusinessId]);

  // Handle explicit business context switch from navigation state (e.g., via Notifications)
  useEffect(() => {
    if (location.state?.businessId && location.state.businessId !== selectedBusinessId) {
      resetAnalysis(); // Clear old business data immediately
      setSelectedBusinessId(location.state.businessId);
    }
  }, [location.state?.businessId, selectedBusinessId, setSelectedBusinessId]);

  // Unified business name and admins (derived from store)
  const selectedBusinessName = currentBusiness?.business_name || "";
  const companyAdminIds = currentBusiness?.company_admin_id || [];

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;


  const [documentInfo, setDocumentInfo] = useState(null);
  const [phaseAnalysisArray, setPhaseAnalysisArray] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState(
    new Set(['current-strategy', 'costs-financial', 'context-industry', 'customer', 'capabilities', 'competition'])
  );

  const token = useAuthStore(state => state.token);
  const userRole = useAuthStore(state => state.userRole);
  const userName = useAuthStore(state => state.userName);
  const getAuthToken = useCallback(() => token, [token]);
  const getLoggedInRole = () => (userRole || "").toLowerCase();
  const loggedInRole = getLoggedInRole();


  const businessStatus = currentBusiness?.status || "";
  const isLaunchedStatus = businessStatus === "launched";
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(t("Go_to_Section"));
  const streamingManager = useStreamingManager();
  const isBusinessFetching = useRef(false);
  const isPmfFetching = useRef(false);
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
  const [answerIds, setAnswerIds] = useState({}); // Mapping of question_id to answer document _id
  const [isPmfOnboardingComplete, setIsPmfOnboardingComplete] = useState(true);

  // hasInsightAccess and hasStrategicAccess are now derived from getUserLimits() above (line 79)

  const setApiLoading = useCallback((apiEndpoint, isLoading) => {
    setStoreLoading(apiEndpoint, isLoading);
  }, [setStoreLoading]);

  const apiService = useMemo(() => new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  ), [ML_API_BASE_URL, API_BASE_URL, getAuthToken, setApiLoading]);


  const {
    questions, questionsLoaded, userAnswers, completedQuestions,
    setQuestions, setQuestionsLoaded, initializeBusinessData, setUserAnswer, setAnalysisData, fetchAnalysisData,
    regeneratePhase, regenerateIndividualAnalysis,
    resetAnalysis,
    swotAnalysis, portersData, pestelData,
    fullSwotData, competitiveAdvantage, strategicData, expandedCapability,
    strategicRadar, productivityData, maturityData, competitiveLandscape,
    coreAdjacency, profitabilityData, growthTrackerData, liquidityEfficiencyData,
    investmentPerformanceData, leverageRiskData, regenerating,
  } = useAnalysisStore(useShallow(state => ({
    questions: state.questions,
    questionsLoaded: state.questionsLoaded,
    userAnswers: state.userAnswers,
    completedQuestions: state.completedQuestions,
    setQuestions: state.setQuestions,
    setUserAnswer: state.setUserAnswer,
    setAnalysisData: state.setAnalysisData,
    fetchAnalysisData: state.fetchAnalysisData,
    regeneratePhase: state.regeneratePhase,
    regenerateIndividualAnalysis: state.regenerateIndividualAnalysis,
    swotAnalysis: state.swotAnalysis,
    portersData: state.portersData,
    pestelData: state.pestelData,
    fullSwotData: state.fullSwotData,
    competitiveAdvantage: state.competitiveAdvantage,
    strategicData: state.strategicData,
    expandedCapability: state.expandedCapability,
    strategicRadar: state.strategicRadar,
    productivityData: state.productivityData,
    maturityData: state.maturityData,
    competitiveLandscape: state.competitiveLandscape,
    coreAdjacency: state.coreAdjacency,
    profitabilityData: state.profitabilityData,
    growthTrackerData: state.growthTrackerData,
    liquidityEfficiencyData: state.liquidityEfficiencyData,
    investmentPerformanceData: state.investmentPerformanceData,
    leverageRiskData: state.leverageRiskData,
    regenerating: state.regenerating,
    setQuestionsLoaded: state.setQuestionsLoaded,
    initializeBusinessData: state.initializeBusinessData,
    resetAnalysis: state.resetAnalysis,
  })));

  const isAllMandatoryAnswered = useMemo(() => {
    if (!questions || questions.length === 0) return true;
    
    // Validate all mandatory questions across all phases
    const mandatoryFields = questions.filter(q => q.severity === 'mandatory' && q.phase && !['good'].includes(q.phase.toLowerCase()));
    
    if (mandatoryFields.length === 0) return true;

    const result = mandatoryFields.every(q => {
      const qId = q._id || q.question_id;
      const ans = userAnswers[qId] || userAnswers[String(qId)] || '';
      const cleanAns = typeof ans === 'string' ? ans.replace(/^\[AI Extraction\]\s*/i, '').trim() : '';
      return cleanAns !== '' && cleanAns !== '[Question Skipped]';
    });
    return result;
  }, [questions, userAnswers]);

  const canRegenerate = !["viewer"].includes(loggedInRole) && isAllMandatoryAnswered;

  // Regenerating flag aliases
  const isTypeRegenerating = (type) => regenerating[`${selectedBusinessId}_${type}`] || false;
  const isAnalysisRegenerating = isTypeRegenerating('swot') || isTypeRegenerating('porters') || isTypeRegenerating('pestel') || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
  const isStrategicRegenerating = isTypeRegenerating('strategic');
  const isFullSwotRegenerating = isTypeRegenerating('fullSwot');
  const isCompetitiveAdvantageRegenerating = isTypeRegenerating('competitiveAdvantage');
  const isExpandedCapabilityRegenerating = isTypeRegenerating('expandedCapability');
  const isStrategicRadarRegenerating = isTypeRegenerating('strategicRadar');
  const isProductivityRegenerating = isTypeRegenerating('productivityMetrics');
  const isMaturityRegenerating = isTypeRegenerating('maturityScore');
  const isProfitabilityAnalysisRegenerating = isTypeRegenerating('profitabilityAnalysis');
  const isGrowthTrackerRegenerating = isTypeRegenerating('growthTracker');
  const isLiquidityEfficiencyRegenerating = isTypeRegenerating('liquidityEfficiency');
  const isInvestmentPerformanceRegenerating = isTypeRegenerating('investmentPerformance');
  const isLeverageRiskRegenerating = isTypeRegenerating('leverageRisk');

  const [accessModalMessage, setAccessModalMessage] = useState('');
  const [accessModalSubMessage, setAccessModalSubMessage] = useState('');

  // Data aliases for components that expect explicit prop names
  const competitiveAdvantageData = competitiveAdvantage;
  const expandedCapabilityData = expandedCapability;
  const strategicRadarData = strategicRadar;

  const [insightsSubTab, setInsightsSubTab] = useState('diagnosis');
  const [cameFromInsights, setCameFromInsights] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Initializing state directly from URL prevents flickering on refresh
    const searchParams = new URLSearchParams(window.location.search);
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;

    // Use location state if available (for internal navigation)
    if (window.__businessPageNavState?.initialTab) return window.__businessPageNavState.initialTab;

    // Fallback to location state directly from the router
    if (window.history.state?.usr?.initialTab) return window.history.state.usr.initialTab;

    // Fallback based on user plan priority: PMF > Insights/Strategic > Projects
    const limits = getUserLimits();
    const hasPmfAccess = true;
    const hasInsightAccess = true;
    const hasStrategicAccess = true;
    const hasProjectAccess = true;

    const pathSegments = window.location.pathname.split('/');
    const currentBusinessId = pathSegments[2] || '';
    const hasSeenHistory = localStorage.getItem(`hasSeenExecutiveSummary_${currentBusinessId}`) === 'true';

    const userPlan = useAuthStore.getState().userPlan;
    const isPaidPlan = userPlan && userPlan.toLowerCase() !== 'explorer' && userPlan.toLowerCase() !== 'free' && userPlan.toLowerCase() !== 'none';

    // If on any paid plan, prioritize insights page from dashboard
    if (isPaidPlan) {
      if (hasInsightAccess || hasStrategicAccess) return "insights";
      if (hasPmfAccess) return "executive";
      if (hasProjectAccess) return "bets";
    }

    if (hasPmfAccess && !hasSeenHistory) return "executive";
    if (hasInsightAccess || hasStrategicAccess) return "insights";
    if (hasProjectAccess) return "bets";

    return "advanced"; // Ultimate fallback
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [isOnboardingStarted, setIsOnboardingStarted] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: currentBusiness?.business_name || "",
    whatWeDo: currentBusiness?.business_purpose || "",
    products: "",
    targetAudience: "",
    uniqueValue: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => { } });

  const triggerConfirmation = (title, message, onConfirm) => {
    setConfirmConfig({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const swotRef = useRef(null);
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
  const competitiveLandscapeRef = useRef(null);
  const coreAdjacencyRef = useRef(null);
  const profitabilityRef = useRef(null);
  const growthTrackerRef = useRef(null);
  const liquidityEfficiencyRef = useRef(null);
  const investmentPerformanceRef = useRef(null);
  const leverageRiskRef = useRef(null);

  const [showToast, setShowToast] = useState({ show: false, message: "", type: "success" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);
  const [showPMFOnboarding, setShowPMFOnboarding] = useState(false);
  const showToastMessage = useCallback((message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: "success" }), 3000);
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      resetAnalysis(); // Reset old business analysis data immediately on business change

      // Clear global API loading states so spinners from the previous business don't carry over
      const uiStore = useUIStore.getState();
      const analysisKeys = [
        'find', 'porter-analysis', 'pestel-analysis', 'full-swot-portfolio',
        'competitive-advantage', 'expanded-capability-heatmap', 'strategic-positioning-radar',
        'productivity-metrics', 'maturity-scoring', 'simple-swot-portfolio', 'core-adjacency',
        'excel-analysis-profitability', 'excel-analysis-growth', 'excel-analysis-liquidity',
        'excel-analysis-investment', 'excel-analysis-leverage'
      ];
      analysisKeys.forEach(key => {
        if (uiStore.loadingStates[key]) uiStore.setLoading(key, false);
      });
      // Clear the local fetch cache when business changes so we re-fetch everything for the new business
      fetchedAnalysisKeys.current.clear();
      // Only fetch if questions are NOT going to be fetched by the question loader (optimization)
      const tabsNeedingQuestions = ['advanced', 'insights', 'strategic'];
      if (!tabsNeedingQuestions.includes(activeTab)) {
        fetchAnalysisData(selectedBusinessId, false, false, false);
      }
    }
  }, [selectedBusinessId, resetAnalysis, fetchAnalysisData]);

  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const navDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setActiveNavDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isArchived = (currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden') || (businessData?.access_mode === 'archived' || businessData?.access_mode === 'hidden');
  const canShowRegenerateButtons = canRegenerate && !isArchived;

  // 1. Sync URL -> State (Initial load and Browser Back/Forward)
  useEffect(() => {
    // Prioritize explicit state passed via navigate(), fallback to URL query
    const targetTab = location.state?.initialTab || searchParams.get('tab');

    if (!targetTab) return;

    if (targetTab !== activeTab) {
      // Check access before switching
      const isPmfTab = ["executive", "priorities"].includes(targetTab);
      const isProjectTab = targetTab === "bets" || targetTab === "ranking" || targetTab === "decision-logs";

      if ((isPmfTab && !hasPmfAccess) || (isProjectTab && !hasProjectAccess)) {
        console.warn("Blocking access to unauthorized tab:", targetTab);

        const isAdminRole = ['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase());
        const subMessageKey = isAdminRole ? "no_access_modal_sub_admin" : "no_access_modal_sub_user";

        setAccessModalMessage(t('no_access_modal_msg'));
        setAccessModalSubMessage(t(subMessageKey));
        openModal('noFeatureAccess');

        // Redirect to a safe tab
        const safeTab = hasPmfAccess ? "executive" : (hasInsightAccess || hasStrategicAccess ? "advanced" : "bets");
        setActiveTab(safeTab);
        return;
      } else {
        setActiveTab(targetTab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.key, location.state, hasPmfAccess, hasProjectAccess]); // location.key firmly triggers this on any navigation

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  // 2. Sync State -> URL (When user clicks UI buttons)
  useEffect(() => {
    // ONLY push activeTab to the URL if it differs from what's already there
    // Using the function callback on setSearchParams guarantees we don't inappropriately respond to searchParams changes.
    setSearchParams(prevParams => {
      const urlTab = prevParams.get('tab');
      if (activeTab && activeTab !== urlTab) {
        const newParams = new URLSearchParams(prevParams);
        newParams.set('tab', activeTab);
        return newParams;
      }
      return prevParams; // no-op
    }, { replace: true });

    // Clean up navigation state flags
    delete window.__businessPageNavState;
    if (window.innerWidth > 768) {
      setIsAnalysisExpanded(true);
    }
  }, [activeTab, setSearchParams]); // NOTE: triggers ONLY when UI updates activeTab

  useEffect(() => {
    let pageContext = null;
    if (activeTab === "aha") pageContext = AI_PAGE_CONTEXTS.AHA;
    else if (activeTab === "executive") pageContext = AI_PAGE_CONTEXTS.EXECUTIVE_SUMMARY;
    else if (activeTab === "priorities") pageContext = AI_PAGE_CONTEXTS.PRIORITIES;
    else if (activeTab === "advanced") pageContext = AI_PAGE_CONTEXTS.ADVANCED;
    else if (activeTab === "insights") pageContext = AI_PAGE_CONTEXTS.INSIGHTS;
    else if (activeTab === "strategic") pageContext = AI_PAGE_CONTEXTS.STRATEGIC;
    else if (activeTab === "decision-logs" || activeTab === "bets" || activeTab === "cadences") pageContext = AI_PAGE_CONTEXTS.PROJECTS;
    else if (activeTab === "ranking") pageContext = AI_PAGE_CONTEXTS.RANKING;

    let contextPayload = { ...pageContext };

    if (activeTab === "advanced" && questions && questions.length > 0) {
      const qaData = questions.map(q => ({
        question: q.question_text,
        answer: userAnswers[q._id || q.question_id] || "Not Answered"
      }));
      contextPayload.page_content = qaData;
    }

    const isStrategicTab = ["aha", "executive", "priorities"].includes(activeTab);
    const isDisabled = isStrategicTab && !isPmfOnboardingComplete;

    window.dispatchEvent(
      new CustomEvent("ai_context_changed", {
        detail: { pageContext: contextPayload, isArchived, isDisabled }
      })
    );
  }, [activeTab, questions, userAnswers, isArchived, isPmfOnboardingComplete]);

  // Effect to handle business context recovery on refresh
  useEffect(() => {
    const recoverBusinessContext = async () => {
      if (!selectedBusinessId) {
        // Only log if we've had a chance to mount/hydrate (not on first tick if we expect hydration)
        // If still no ID after a short delay, it's a real issue
        return;
      }

      // Store selection is now persisted via businessStore

      // If we don't have the full business object OR it doesn't match the current ID, fetch it
      if (!currentBusiness || (currentBusiness._id !== selectedBusinessId && currentBusiness.id !== selectedBusinessId)) {
        // Skip fetch if we are on Priorities or Projects tab and already have basic info (optimization)
        if ((activeTab === 'priorities' || activeTab === 'bets' || activeTab === 'ranking' || activeTab === 'decision-logs') && selectedBusinessName && selectedBusinessName !== "") {
          return;
        }

        if (isBusinessFetching.current) {
          return;
        }

        try {
          isBusinessFetching.current = true;
          await fetchBusiness(selectedBusinessId);
        } catch (error) {
          console.error("Failed to recover business context:", error);
        } finally {
          isBusinessFetching.current = false;
        }
      }
    };

    recoverBusinessContext();
  }, [selectedBusinessId, currentBusiness, activeTab, apiService, selectedBusinessName]);

  //PMF onboarding check
  useEffect(() => {
    const checkPmf = async () => {
      if (!selectedBusinessId) return;
      if (isPmfFetching.current) return;

      try {
        isPmfFetching.current = true;
        const pmfData = await apiService.getPMFAnalysis(selectedBusinessId);
        // Onboarding is complete if we have any insights data
        const hasAha = !!pmfData && (Array.isArray(pmfData) ? pmfData.length > 0 : (pmfData.insights && (Array.isArray(pmfData.insights) ? pmfData.insights.length > 0 : (pmfData.insights.insights && pmfData.insights.insights.length > 0))));
        setIsPmfOnboardingComplete(hasAha);
      } catch (e) {
        setIsPmfOnboardingComplete(false);
      } finally {
        isPmfFetching.current = false;
      }
    };
    checkPmf();
  }, [selectedBusinessId, pmfRefreshTrigger, apiService]);

  // Sync businessData in useBusinessSetup when currentBusiness changes
  useEffect(() => {
    if (currentBusiness && setBusinessData) {
      setBusinessData({
        name: currentBusiness.business_name || "",
        whatWeDo: currentBusiness.business_purpose || "",
        products: "",
        targetAudience: "",
        uniqueValue: "",
      });
    }
  }, [currentBusiness, setBusinessData]);

  // Load questions directly (previously handled by ChatComponent)
  // Load questions directly. Only needed for tabs that use the question/answer workflow.
  // Use a ref to prevent re-running when questionsLoaded changes (avoids infinite loop).
  const hasLoadedQuestionsRef = useRef(false);
  useEffect(() => {
    const tabsNeedingQuestions = ['advanced', 'insights', 'strategic', 'onboarding'];
    if (!tabsNeedingQuestions.includes(activeTab)) {
      // For non-question tabs, just mark as loaded if not already done
      if (!useAnalysisStore.getState().questionsLoaded) {
        useAnalysisStore.setState({ questionsLoaded: true });
      }
      return;
    }

    // Guard: don't re-run if already loaded for this business
    const loadKey = `${selectedBusinessId}-${activeTab}-${currentLanguage}`;
    if (hasLoadedQuestionsRef.current === loadKey) return;

    const loadQuestions = async () => {
      if (!selectedBusinessId) return;
      try {
        if (!token) return;
        setQuestionsLoaded(false);
        setApiLoading('fetchAnalysisDataThroughBackend', true);
        hasLoadedQuestionsRef.current = loadKey;

        // Use the enhanced Answers API universally for all tabs to get questions and answers
        const responseData = await answerService.getAnswersByBusiness(selectedBusinessId, currentLanguage || 'en');

        if (responseData) {
          // 1. Handle Document Info
          let documentExists = responseData.document_info?.has_document === true;

          if (responseData.document_info && responseData.document_info.has_document) {
            setDocumentInfo(responseData.document_info);
          } else {
            setDocumentInfo({ has_document: false });
          }
          setHasUploadedDocument(documentExists);

          // 2. Handle Questions and Answers mapping
          let finalAnswers = {};
          let finalCompleted = [];
          let answersDetailsMap = {};

          if (responseData.questions?.length > 0) {
            setQuestions(responseData.questions); // This internally sets questionsLoaded: true

            const answersMap = {};
            const answerIdsMap = {};

            responseData.data?.forEach(ans => {
              if (ans.question_id && ans.answer) {
                const qIdStr = String(ans.question_id);
                answersMap[qIdStr] = ans.answer;
                answerIdsMap[qIdStr] = ans._id;
                answersDetailsMap[qIdStr] = {
                  confidence: ans.confidence,
                  status: ans.status,
                  evidence: ans.evidence,
                  ai_answer: ans.ai_answer,
                  user_answer: ans.user_answer,
                  previous_answer: ans.previous_answer
                };
              }
            });

            finalAnswers = answersMap;
            finalCompleted = Object.keys(answersMap);

            if (Object.keys(answersMap).length > 0) {
              Object.entries(answersMap).forEach(([qId, ans]) => setUserAnswer(qId, ans));
              setAnswerIds(answerIdsMap);
            }
          } else {
            useAnalysisStore.setState({ questionsLoaded: true });
            setAnswerIds({});
          }

          // 3. Fetch analysis results silently (don't set loaded=true inside fetchAnalysisData)
          let analysisUpdates = {};
          if (Object.keys(finalAnswers).length > 0) {
            analysisUpdates = await fetchAnalysisData(selectedBusinessId, true, false, true); // skipReset = true
            // Mark this tab as fetched to prevent the tab-change useEffect from redundant fetching
            const fetchKey = `${selectedBusinessId}-${activeTab}`;
            fetchedAnalysisKeys.current.add(fetchKey);
          }

          // 4. ATOMIC INITIALIZATION
          initializeBusinessData({
            questions: responseData.questions || [],
            userAnswers: finalAnswers,
            answersDetails: answersDetailsMap,
            completedQuestions: finalCompleted,
            analysisUpdates: analysisUpdates || {},
            questionsLoaded: true
          });
        } else {
          setQuestionsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setQuestionsLoaded(true);
      } finally {
        setApiLoading('fetchAnalysisDataThroughBackend', false);
      }
    };

    loadQuestions();
  }, [selectedBusinessId, API_BASE_URL, activeTab, token, setQuestions, setUserAnswer, setAnswerIds, currentLanguage]);

  useEffect(() => {
    if (uploadedFileForAnalysis) {
      setHasUploadedDocument(true);
    }
  }, [uploadedFileForAnalysis]);


  // Initialize Projects tab visibility from UI Store (scoped per business)
  useEffect(() => {
    if (!selectedBusinessId) return;
    const storedVisibility = getBusinessSetting(selectedBusinessId, 'showProjectsTab');
    // Only restore the tab if the user has project access on their current plan
    if (storedVisibility === true && hasProjectAccess) {
      setShowProjectsTab(true);
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
      if (!selectedBusinessId) return;

      try {
        // Use the synchronized store method which handles promise caching
        const data = await useProjectStore.getState().fetchProjects(selectedBusinessId, { silent: true });
        const hasProjects = (data?.projects || []).length > 0;

        setShowProjectsTab(hasProjects && hasProjectAccess);

        if (selectedBusinessId) {
          setBusinessSetting(selectedBusinessId, 'showProjectsTab', hasProjects);
        }
      } catch (err) {
        console.error('Failed to check existing projects for business:', err);
      }
    };

    fetchProjectsForBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessId, API_BASE_URL]);

  //const showToastMessage = createToastMessage(setShowToast);

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


  const handleRedirectToBrief = (missingQuestionsData) => {
    setHighlightedMissingQuestions(missingQuestionsData);
    if (isMobile) {
      setActiveTab("advanced");
    } else {
      if (isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(false);
        setActiveTab("advanced");
        setTimeout(() => setIsSliding(false), 1000);
      } else {
        setActiveTab("advanced");
      }
    }
    showToastMessage(
      `Please answer ${missingQuestionsData.missing_count} more question${missingQuestionsData.missing_count > 1 ? 's' : ''} to generate this analysis.`,
      "warning"
    );
    setTimeout(() => setHighlightedMissingQuestions(null), 30000);
  };

  const handleBriefTabClick = () => {
    if (!isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(true);
      setActiveTab("advanced");
      setTimeout(() => setIsSliding(false), 1000);
    } else {
      setActiveTab("advanced");
    }
  };

  const getCurrentPhase = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    if (unlockedFeatures.advancedPhase) return 'advanced';
    if (unlockedFeatures.essentialPhase) return 'essential';
    if (unlockedFeatures.initialPhase) return 'initial';
    return 'initial';
  };

  const handleRegeneratePhase = (phaseOverride = null, alsoRegenerateStrategic = false, options = {}) => {
    const targetPhase = phaseOverride || getCurrentPhase();
    const skipConfirmation = options?.skipConfirmation || false;

    const performPhaseRegeneration = async () => {
      const state = useAnalysisStore.getState();
      const { questions: storeQuestions, userAnswers: storeUserAnswers, regeneratePhase: storeRegeneratePhase } = state;

      const hasAnswers = Object.values(storeUserAnswers || {}).some(answer => answer && String(answer).trim().length > 0);
      if (!hasAnswers && targetPhase !== 'financial') {
        console.warn(`Skipping regeneration for phase ${targetPhase}: No answers found in store.`);
        return;
      }

      // Merge uploadedFile from options into userAnswers context for the store
      const mergedAnswers = { ...storeUserAnswers };
      if (options?.uploadedFile) {
        mergedAnswers.uploadedFile = options.uploadedFile;
      } else if (uploadedFileForAnalysis) {
        mergedAnswers.uploadedFile = uploadedFileForAnalysis;
      }

      const currentBizId = selectedBusinessId;
      await storeRegeneratePhase(targetPhase, storeQuestions, mergedAnswers, selectedBusinessId, showToastMessage);

      if (useBusinessStore.getState().selectedBusinessId !== currentBizId) return;
      if (alsoRegenerateStrategic) {
        await handleStrategicAnalysisRegenerate(true);
      }
    };

    if (skipConfirmation) {
      return performPhaseRegeneration();
    } else {
      triggerConfirmation(
        t("Regenerate Phase Analysis?"),
        t("Are you sure you want to regenerate the insights for this phase? All existing analysis data for this phase will be permanently overwritten. This action cannot be undone as version history is not maintained."),
        performPhaseRegeneration
      );
    }
  };

  const setUploadedFile = (file) => {
    setUploadedFileForAnalysis(file);
  };

  const loadExistingAnalysisData = useCallback((phaseAnalysisArray) => {
    setPhaseAnalysisArray(phaseAnalysisArray);
    // Data mapping is now handled inside fetchAnalysisData in the store
    // But we trigger it here to ensure the store is updated with the latest data
    fetchAnalysisData(selectedBusinessId, true, false, true); // skipReset = true
  }, [selectedBusinessId, fetchAnalysisData]);

  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    hasUploadedDocument, setHasUploadedDocument,
    onDocumentInfoLoad: (docInfo) => setDocumentInfo(docInfo),
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      useAnalysisStore.setState({ completedQuestions: Array.from(completedSet) });
      Object.entries(answersMap).forEach(([qId, ans]) => setUserAnswer(qId, ans));
    },
    onCompletedPhasesUpdate: () => { },
    onAnalysisGeneration: () => handleRegeneratePhase('initial', true, { skipConfirmation: true }),
    onFullSwotGeneration: () => handleRegeneratePhase('essential', true, { skipConfirmation: true }),
    onGoodPhaseGeneration: () => handleRegeneratePhase('good', true, { skipConfirmation: true }),
    onAdvancedPhaseGeneration: () => handleRegenerateAllAnalysis({ skipConfirmation: true, alsoRegenerateStrategic: true, includeFinancial: true }),
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL, getAuthToken, apiService, stateSetters, showToastMessage
  });

  const handleStrategicAnalysisRegenerate = (skipConfirmation = false) => {
    const performStrategicRegeneration = async () => {
      const state = useAnalysisStore.getState();
      const { questions: storeQuestions, userAnswers: storeUserAnswers, regenerateIndividualAnalysis: storeRegenerateIndividual } = state;

      const hasAnswers = Object.values(storeUserAnswers || {}).some(answer => answer && String(answer).trim().length > 0);

      if (!hasAnswers) {
        console.warn("Strategic Debug: No answers found in store, skipping strategic regeneration.");
        return;
      }

      await storeRegenerateIndividual('strategic', storeQuestions, storeUserAnswers, selectedBusinessId, showToastMessage);
    };

    if (skipConfirmation) {
      return performStrategicRegeneration();
    } else {
      triggerConfirmation(
        t("Regenerate Strategic Analysis?"),
        <>{t("Are you sure you want to regenerate the")} <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> {t("analysis? Your existing strategic insights will be permanently overwritten. This action cannot be undone as version history is not maintained.")}</>,
        performStrategicRegeneration
      );
    }
  };

  const handleRegenerateAllAnalysis = (options = {}) => {
    const performFullRegeneration = async () => {
      if (isRegeneratingRef.current) {
        showToastMessage(t('regeneration_in_progress'), 'info');
        return;
      }

      const latestStoreState = useAnalysisStore.getState();
      const hasAnswers = Object.values(latestStoreState.userAnswers || {}).some(answer => answer && String(answer).trim().length > 0);

      if (!hasAnswers && !options?.onlyFinancial) {
        console.warn("Skipping full insights regeneration: No answers found in store.");
        if (options?.includeFinancial || hasUploadedDocument) {
          await handleRegeneratePhase('financial', false, { ...options, skipConfirmation: true });
        }
        return;
      }

      isRegeneratingRef.current = true;
      const currentBizId = selectedBusinessId;
      try {
        if (options?.onlyFinancial) {
          await handleRegeneratePhase('financial', false, { ...options, skipConfirmation: true });
          return;
        }

        // Determine which phases to regenerate.
        // If it's a bulk "Apply All" (isBulkApply is true), we find the highest unlocked phase based on answers.
        // If not, we respect the current active phase on the Insights page.
        const isBulkApply = !!options?.alsoRegenerateStrategic;
        let phasesToRegenerate = [];

        if (isBulkApply) {
          // Get the current unlocked features based on the latest answers from the store
          // instead of relying on the stale phaseManager instance
          const latestStoreState = useAnalysisStore.getState();
          const unlockedFeatures = getUnlockedFeatures(
            latestStoreState.questions,
            latestStoreState.userAnswers,
            latestStoreState.completedQuestions,
            hasUploadedDocument
          );

          // Fallback logic: Call advanced if unlocked, else essential, else initial.
          if (unlockedFeatures.advancedPhase) {
            phasesToRegenerate = ['advanced'];
          } else if (unlockedFeatures.essentialPhase) {
            phasesToRegenerate = ['essential'];
          } else {
            phasesToRegenerate = ['initial'];
          }
        } else if (options?.onlyFinancial) {
          phasesToRegenerate = [];
        } else {
          phasesToRegenerate = [currentPhase];
        }

        const regenerationTasks = [];

        // 1. Regenerate unlocked phases concurrently
        for (const phase of phasesToRegenerate) {
          regenerationTasks.push((async () => {
            if (useBusinessStore.getState().selectedBusinessId !== currentBizId) return;
            await handleRegeneratePhase(phase, false, { skipConfirmation: true });
          })());
        }

        // 2. Include financial insights if explicitly requested, or if a document exists, or if we have existing financial data
        // Skip if explicitly requested via options (e.g. during AI answer application)
        const shouldIncludeFinancial =
          !options?.skipFinancial && (
            options?.includeFinancial === true ||
            options?.onlyFinancial === true ||
            hasUploadedDocument ||
            !!profitabilityData ||
            !!growthTrackerData ||
            !!liquidityEfficiencyData ||
            !!investmentPerformanceData ||
            !!leverageRiskData
          );

        if (shouldIncludeFinancial) {
          regenerationTasks.push((async () => {
            if (useBusinessStore.getState().selectedBusinessId !== currentBizId) return;
            await handleRegeneratePhase('financial', false, { ...options, skipConfirmation: true });
          })());
        }

        // 3. Finally, regenerate strategic analysis if requested (e.g. for "Apply All")
        if (options?.alsoRegenerateStrategic) {
          regenerationTasks.push((async () => {
            if (useBusinessStore.getState().selectedBusinessId !== currentBizId) return;
            await handleStrategicAnalysisRegenerate(true);
          })());
        }

        await Promise.all(regenerationTasks);

        // Final sync to ensure UI is perfectly updated with all regenerated results
        if (useBusinessStore.getState().selectedBusinessId !== currentBizId) return;
        await fetchAnalysisData(selectedBusinessId, true, true, true);

        //showToastMessage(t('regeneration_completed'), 'success');
      } catch (err) {
        console.error('Error in handleRegenerateAllAnalysis:', err);
        showToastMessage(t('failed_to_regenerate_analysis'), 'error');
      } finally {
        isRegeneratingRef.current = false;
      }
    };

    if (options?.skipConfirmation) {
      return performFullRegeneration();
    } else {
      triggerConfirmation(
        t("Regenerate All Analysis?"),
        t("Are you sure you want to regenerate all insights? This will permanently overwrite all your current analysis data across all phases. This action cannot be undone as version history is not maintained."),
        performFullRegeneration
      );
    }
  };


  const handleBusinessDataUpdate = (updates) => {
    setBusinessData(prev => ({ ...prev, ...updates }));
  };

  const handleAnswerUpdate = (questionId, newAnswer) => {
    setUserAnswer(questionId, newAnswer);
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

  const handleAnalysisTabClick = () => {
    // Removed unlockedFeatures.analysis check to make it always accessible
    if (isMobile) {
      setActiveTab("insights");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("insights");
      }
    }
  };

  const handleStrategicTabClick = () => {
    setInsightsSubTab('direction');
    if (isMobile) {
      setActiveTab("insights");
    } else {
      if (!isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("insights");
        setIsSliding(false);
      } else {
        setActiveTab("insights");
      }
    }
  };

  const handleBackFromAnalysis = () => {
    navigate("/dashboard");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleScrollToSection = (cardId) => {
    if (!cardId) return;

    const categoryId = CARD_TO_CATEGORY_MAP[cardId];
    if (categoryId) {
      setCollapsedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
          return newSet;
        }
        return prev;
      });
    }

    setHighlightedCard(cardId);
    setExpandedCards(prev => {
      if (prev.has(cardId)) return prev;
      return new Set([...prev, cardId]);
    });

    const performScroll = () => {
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    // Try to scroll immediately if possible
    performScroll();

    // Multiple attempts to account for category expansion / rendering delays
    [300, 600, 900, 1200].forEach(delay => {
      setTimeout(performScroll, delay);
    });

    setTimeout(() => setHighlightedCard(null), 3000);
  };

  const handleOptionClick = (option) => {
    setShowDropdown(false);
    setSelectedDropdownValue(t(option));
    const cardId = CARD_ID_MAP[option];
    if (cardId) {
      handleScrollToSection(cardId);
    }
  };

  // Auto-scroll back to selected section when returning to insights tab
  useEffect(() => {
    if (activeTab === 'insights' && selectedDropdownValue && selectedDropdownValue !== t("Go_to_Section") && selectedDropdownValue !== "Go to Section") {
      const cardId = CARD_ID_MAP[selectedDropdownValue];
      if (cardId) {
        // Delay slightly to ensure component is switched and rendered
        setTimeout(() => handleScrollToSection(cardId), 100);
      }
    }
  }, [activeTab, selectedDropdownValue, t]);

  const createSimpleRegenerationHandler = (analysisType) => {
    return apiService.createSimpleRegenerationHandler(
      analysisType,
      questions,
      userAnswers,
      selectedBusinessId,
      stateSetters,
      showToastMessage
    );
  };




  const handleExecutiveTabClick = () => {
    setCameFromInsights(false);
    if (isMobile) {
      setActiveTab("executive");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("executive");
      } else {
        setActiveTab("executive");
      }
    }
  };

  const handlePrioritiesTabClick = () => {
    if (isMobile) {
      setActiveTab("priorities");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("priorities");
      } else {
        setActiveTab("priorities");
      }
    }
  };

  const clearProjectCache = useProjectStore(state => state.clearCache);

  const handleKickstartSuccess = () => {
    // Clear project-store caches so the Projects page fetches fresh data
    clearProjectCache(selectedBusinessId);

    // Invalidate React Query projects and rankings cache so the Projects page fetches fresh data immediately
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
  };

  const handleStayOnPriorities = () => {
    setShowProjectsTab(true);
  };


  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();


    const categoryOptions = {
      initial: {
        "Context/Industry": ["swot_analysis", "Porters_Five_Forces", "PESTEL_Analysis"]
      },
      essential: {
        "Current Strategy": ["Core"],
        "Costs/Financial": ["Productivity_Metrics"],
        "Context/Industry": ["Porters_Five_Forces", "PESTEL_Analysis", "Full_SWOT_Portfolio", "Strategic_Positioning_Radar"],
        "Customer": ["Competitive_Advantage_Matrix"],
        "Capabilities": ["Capability_Heatmap", "Maturity_Score"],
        "Competition": ["Competitive_Landscape"]
      },
      advanced: {
        "Current Strategy": ["Core"],
        "Costs/Financial": ["Productivity_Metrics"],
        "Context/Industry": ["Porters_Five_Forces", "PESTEL_Analysis", "Full_SWOT_Portfolio", "Strategic_Positioning_Radar"],
        "Customer": ["Competitive_Advantage_Matrix"],
        "Capabilities": ["Capability_Heatmap", "Maturity_Score"],
        "Competition": ["Competitive_Landscape"]
      }
    };

    // If a document is uploaded, always add financial options regardless of phase
    if (unlockedFeatures.hasDocument) {
      const financialOptions = [
        "Profitability_Analysis", "Growth_Tracker", "Liquidity_Efficiency",
        "Investment_Performance", "Leverage_Risk"
      ];

      // Add to current phase
      if (categoryOptions[phase]) {
        categoryOptions[phase]["Costs/Financial"] = [
          ...financialOptions,
          ...(categoryOptions[phase]["Costs/Financial"] || [])
        ];
      }
    }

    const selectedOptions = categoryOptions[phase] || {};

    // Return all options for the phase without filtering by data availability
    return selectedOptions;
  };

  useEffect(() => {
    setSelectedDropdownValue(t("Go_to_Section"));
  }, [t]);

  // Sync URL: update ?business=slug&tab=activeTab whenever the active tab or business name changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    const slug = toSlug(selectedBusinessName || '');
    const params = {};
    if (slug) params.business = slug;

    // Redirect strategic to insights
    let tabToSet = activeTab;
    if (activeTab === 'strategic') {
      tabToSet = 'insights';
      setActiveTab('insights');
      setInsightsSubTab('direction');
    }

    if (tabToSet) params.tab = tabToSet;
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedBusinessName, selectedBusinessId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchedAnalysisKeys = useRef(new Set());

  // Only load stored analysis data when user visits the insights or strategic tab
  useEffect(() => {
    if (activeTab !== 'insights' && activeTab !== 'strategic') return;

    // We use a local ref to track which business-tab combinations have been fetched
    // to prevent redundant calls during the same session or on simple re-renders.
    const fetchKey = `${selectedBusinessId}-${activeTab}`;
    if (selectedBusinessId && questionsLoaded && !fetchedAnalysisKeys.current.has(fetchKey)) {
      fetchedAnalysisKeys.current.add(fetchKey);
      setTimeout(() => {
        // Use skipReset: true to prevent flickering when switching tabs
        // and forceRefresh: false to respect the backend/service cache.
        fetchAnalysisData(selectedBusinessId, true, false, true);
      }, 100);
    }
  }, [selectedBusinessId, questionsLoaded, activeTab, fetchAnalysisData]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, setShowDropdown]);

  const unlockedFeatures = phaseManager.getUnlockedFeatures();
  const currentPhase = getCurrentPhase();
  const storeLoadingStates = useUIStore(state => state.loadingStates);

  const hasAnalysisData = !!(swotAnalysis || portersData ||
    pestelData || fullSwotData || competitiveAdvantage || expandedCapability ||
    strategicRadar || productivityData || maturityData || competitiveLandscape ||
    coreAdjacency || profitabilityData || growthTrackerData);

  const analysisProps = {
    phaseManager,
    apiLoadingStates: storeLoadingStates,
    selectedBusinessId,
    handleRedirectToBrief,
    showToastMessage,
    apiService,
    triggerConfirmation,
    hasInsightAccess,
    isAnalysisRegenerating, isStrategicRegenerating,
    isFullSwotRegenerating, isCompetitiveAdvantageRegenerating,
    isExpandedCapabilityRegenerating, isStrategicRadarRegenerating,
    isProductivityRegenerating, isMaturityRegenerating,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    expandedCards, setExpandedCards,
    collapsedCategories, setCollapsedCategories,
    highlightedCard,
    uploadedFileForAnalysis,
    swotRef, portersRef, pestelRef,
    fullSwotRef, competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef,
    productivityRef, maturityScoreRef, profitabilityRef, growthTrackerRef,
    liquidityEfficiencyRef, investmentPerformanceRef, leverageRiskRef,
    competitiveLandscapeRef, coreAdjacencyRef
  };

  const handleProjectCountChange = useCallback((count) => {
    const hasProjects = count > 0;
    setShowProjectsTab(hasProjects);
    try {
      if (!selectedBusinessId) return;
      const key = `showProjectsTab_${selectedBusinessId}`;
      if (hasProjects) {
        setBusinessSetting(selectedBusinessId, 'showProjectsTab', true);
      } else {
        setBusinessSetting(selectedBusinessId, 'showProjectsTab', false);
      }
    } catch { }
  }, [selectedBusinessId, setBusinessSetting]);

  const setupValue = useMemo(() => ({
    selectedBusinessId,
    currentBusiness,
    isArchived,
    openModal,
    closeModal,
    isModalOpen,
    pmfRefreshTrigger,
    t,
    apiService,
    setActiveTab,
    hasPmfAccess,
    hasInsightAccess,
    hasStrategicAccess,
    hasProjectAccess,
    handleKickstartSuccess,
    handleStayOnPriorities,
    showProjectsTab
  }), [
    selectedBusinessId,
    currentBusiness,
    isArchived,
    openModal,
    closeModal,
    isModalOpen,
    pmfRefreshTrigger,
    t,
    apiService,
    setActiveTab,
    hasPmfAccess,
    hasInsightAccess,
    hasStrategicAccess,
    hasProjectAccess,
    handleKickstartSuccess,
    handleStayOnPriorities,
    showProjectsTab
  ]);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const historyFetchedRef = useRef(false);

  useEffect(() => {
    if (!historyFetchedRef.current && selectedBusinessId) {
      historyFetchedRef.current = true;
      const fetchHistory = async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history/${selectedBusinessId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.history && response.data.history.length > 0) {
            setChatMessages(response.data.history.map((msg) => ({ role: msg.role, content: msg.text })));
          }
        } catch (error) {
          console.error("Error fetching AI chat history:", error);
        }
      };
      fetchHistory();
    }
  }, [selectedBusinessId]);

  const saveMessageToHistory = async (role, text) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history`,
        { role, text, project_id: selectedBusinessId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving AI chat message:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);
    await saveMessageToHistory('user', userMessage);

    try {
      const response = await fetch(import.meta.env.VITE_AI_CHAT_URL || 'http://localhost:4111/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': selectedBusinessId || 'unknown'
        },
        body: JSON.stringify({
          message: userMessage,
          current_page: 'Business Setup Onboarding',
          page_description: 'User is filling out the 5-step PMF onboarding form to generate insights.',
          page_content: userAnswers || {}
        })
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setChatMessages(prev => [...prev, { role: 'trax', content: data.response }]);
        await saveMessageToHistory('assistant', data.response);
      } else {
        setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I encountered an error connecting to the AI assistant." }]);
        console.error("Chat API error:", data);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I couldn't reach the AI assistant." }]);
      console.error("Chat API fetch error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <BusinessSetupContext.Provider value={setupValue}>
      <div className={`business-setup-container ${isArchived ? 'is-archived' : ''}`}>
        <MenuBar />

        {/* Read-Only Banner for Archived Workspaces */}
        {(currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden') && (
          <div className="alert alert-warning mb-0 border-0 rounded-0 text-center py-2 d-flex align-items-center justify-content-center shadow-sm" style={{ zIndex: 1000, position: 'relative' }}>
            <AlertTriangle size={18} className="me-2 text-warning" />
            <span>
              This workspace has been moved to an <strong>Archived</strong> state and is currently view-only.
              Please upgrade your plan to reactivate this workspace.
            </span>
          </div>
        )}

        <PhaseUnlockToast
          phase={phaseManager.unlockedPhase}
          show={phaseManager.showUnlockToast}
          onClose={() => phaseManager.setShowUnlockToast(false)}
          autoCloseMs={2500}
        />

        {showToast.show && (
          <div className={`simple-toast ${showToast.type}`}>
            {showToast.message}
          </div>
        )}

        {activeTab === 'onboarding' || activeTab === 'advanced' ? (
          activeTab === 'onboarding' && !isOnboardingStarted ? (
            <OnboardingChat
              userName={userName}
              businessName={selectedBusinessName}
              onBack={handleBack}
              onStart={() => navigate(`/onboarding/${selectedBusinessId}`)}
            />
          ) : (
            <div className="split-onboarding-wrapper">
              {/* Top breadcrumb header */}
              <div className="split-onboarding-header">
                <button className="back-button" onClick={handleBack} aria-label="Back" style={{ display: 'contents', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} style={{ margin: '4px 10px' }} />
                  <span>
                    {t("backToDashboard_B3") || "Back to Dashboard"}
                  </span>
                </button>
                <div className="business-breadcrumb">
                  <span className="breadcrumb-separator">/</span>
                  <span
                    className="business-header-name"
                    onClick={() => setActiveTab('insights')}
                    style={{ cursor: 'pointer' }}
                    title="Go to Insights"
                  >
                    {selectedBusinessName}
                  </span>
                  <span className="breadcrumb-separator">/</span>
                  <span className="business-header-name">{activeTab === 'advanced' ? 'Advanced Insights' : 'Onboarding'}</span>
                </div>
              </div>
              {/* Advanced Insights Header - Shared across both panels */}
              {activeTab === 'advanced' && (
                <div className="advanced-insights-shared-header" style={{ maxWidth: '1200px', margin: '20px auto 24px auto', width: '100%', padding: '0' }}>
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center"
                      style={{ color: '#475569', fontWeight: '600', fontSize: '15px' }}
                      onClick={() => setActiveTab('insights')}
                    >
                      <ArrowLeft size={18} className="me-2" /> Back to analysis
                    </button>
                  </div>
                  <h5 style={{ color: '#4f46e5', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', margin: '0 0 8px 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', background: '#fef08a', borderRadius: '2px', padding: '1px 3px' }}>🔒</span> ADVANCED INSIGHTS - PRO
                  </h5>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Go <span style={{ color: '#0ea5e9' }}>deeper</span> before you commit</h2>
                  <p style={{ fontSize: '14px', color: '#475569', margin: '0', lineHeight: '1.5', maxWidth: '800px' }}>
                    A few more questions let Trax build the full picture — the 6 C's and the <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> scorecard your Bets are built from.
                  </p>
                </div>
              )}

              {/* Split layout: Left chat sidebar + Right questionnaire */}
              <div className="split-onboarding-container">
                {/* Left: Docked Trax chat sidebar */}
                <div className="split-onboarding-left">
                  <TraxSidebar
                    selectedBusinessId={selectedBusinessId}
                    selectedBusinessName={selectedBusinessName}
                    userName={userName}
                    userAnswers={userAnswers}
                    questions={questions}
                    currentPageContext={activeTab === 'advanced' ? 'Advanced Insights' : 'Business Setup Onboarding'}
                    pageDescriptionContext={activeTab === 'advanced' ? 'User is reviewing advanced insights.' : 'User is filling out the 5-step PMF onboarding form to generate insights.'}
                    documentInfo={documentInfo}
                  />
                </div>

                {/* Right: Questionnaire */}
                <div className="split-onboarding-right">
                  <EditableBriefSection
                    selectedBusinessId={selectedBusinessId}
                    isAdvancedMode={activeTab === 'advanced'}
                    questions={questions}
                    userAnswers={userAnswers}
                    businessData={businessData}
                    setActiveTab={setActiveTab}
                    isLoading={!questionsLoaded}
                    onBusinessDataUpdate={handleBusinessDataUpdate}
                    onAnswerUpdate={async (questionId, newAnswer) => {
                      handleAnswerUpdate(questionId, newAnswer);
                      window.dispatchEvent(
                        new CustomEvent("conversationUpdated", {
                          detail: { questionId, businessId: selectedBusinessId },
                        })
                      );
                    }}
                    onAnalysisRegenerate={handleRegenerateAllAnalysis}
                    onUploadedFileUpdate={setUploadedFile}
                    isAnalysisRegenerating={isAnalysisRegenerating}
                    isStrategicRegenerating={isStrategicRegenerating}
                    isFinancialRegeneratingProp={isProfitabilityAnalysisRegenerating || isGrowthTrackerRegenerating || isLiquidityEfficiencyRegenerating || isInvestmentPerformanceRegenerating || isLeverageRiskRegenerating || isTypeRegenerating('financial')}
                    isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced')}
                    highlightedMissingQuestions={highlightedMissingQuestions}
                    onClearHighlight={() => setHighlightedMissingQuestions(null)}
                    isLaunchedStatus={isLaunchedStatus}
                    documentInfo={documentInfo}
                    answerIds={answerIds}
                    setAnswerIds={setAnswerIds}
                    hasPmfAccess={hasPmfAccess}
                    isOnboarding={true}
                  />
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            {isMobile && (
              <>
                <div className="mobile-header">
                  <div className="mobile-header-top">
                    <button
                      className="mobile-back-button"
                      onClick={handleBack}
                      aria-label="Go Back"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="mobile-business-name">
                      {selectedBusinessName}
                    </div>

                  </div>

                  <div className="mobile-active-tab">
                    {(['executive', 'advanced', 'insights', 'priorities', 'bets', 'ranking', 'decision-logs', 'cadences'].includes(activeTab)) ? (
                      <div className="mobile-tab-selector">
                        <div className="mobile-tab-trigger no-dropdown">
                          <span>
                            {activeTab === "executive" && t("Executive Summary")}
                            {activeTab === "priorities" && t("Priorities")}
                            {activeTab === "advanced" && (hasInsightAccess || hasStrategicAccess) && t("Answers/Brief")}
                            {activeTab === "insights" && (hasPmfAccess ? t("insights") : "Insights")}
                            {(activeTab === "bets" || activeTab === "ranking" || activeTab === "cadences") && t("Bets")}
                            {activeTab === "decision-logs" && (t("Decision_Logs") || "Decision Logs")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {activeTab === "aha" && t("aha")}
                        {activeTab === "executive" && t("Executive Summary")}
                        {activeTab === "priorities" && t("Priorities & Projects")}
                        {activeTab === "advanced" && (hasInsightAccess || hasStrategicAccess) && t("Questions and Answers")}
                        {activeTab === "insights" && (hasPmfAccess ? t("Insights") : "Insights")}
                        {(activeTab === "bets" || activeTab === "ranking" || activeTab === "cadences") && t("Bets")}
                        {activeTab === "decision-logs" && (t("Decision_Logs") || "Decision Logs")}
                      </>
                    )}
                  </div>

                  <div className="mobile-action-bar">
                    {activeTab === "insights" && (
                      <>
                        <div ref={dropdownRef} className="dropdown-wrapper">
                          <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                            <span>{selectedDropdownValue}</span>
                            <ChevronDown size={14} className={`chevron ${showDropdown ? 'open' : ''}`} />
                          </button>
                          {showDropdown && (() => {
                            const categoryOptions = getPhaseSpecificOptions(currentPhase);
                            return Object.keys(categoryOptions).length > 0 && (
                              <div className="dropdown-menu-options">
                                <div className="dropdown-main-header">{t("Insights & Recommendations")}</div>
                                {Object.entries(categoryOptions).map(([category, items]) =>
                                  items.length > 0 && (
                                    <div key={category}>
                                      <div className="dropdown-category-header">{t(category)}</div>
                                      {items.map((item) => (
                                        <div key={item} onClick={() => {
                                          handleOptionClick(item);
                                        }} className="dropdown-option dropdown-sub-option">
                                          <span className="bullet"></span>
                                          {t(item)}
                                        </div>
                                      ))}
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <CustomTooltip align="right" message={t("download_insights_tooltip") || "Export the insights into PDF report."}>
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
                        </CustomTooltip>

                        {canShowRegenerateButtons && unlockedFeatures.analysis && hasInsightAccess && (
                          <CustomTooltip align="right" message={t("regenerate_all_tooltip") || "Re-generate all insights."}>
                            <button
                              onClick={() => canRegenerate && handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument, alsoRegenerateStrategic: true })}
                              disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate || !hasInsightAccess}
                              className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
                            >
                              {isAnalysisRegenerating ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <RefreshCw size={16} />
                              )}
                            </button>
                          </CustomTooltip>
                        )}
                      </>
                    )}

                    {activeTab === "strategic" && (
                      <>
                        {unlockedFeatures.analysis && (
                          <CustomTooltip align="right" message={t("download_strategic_tooltip") || "Export the strategic into PDF report."}>
                            <PDFExportButton
                              className="pdf-export-button"
                              businessName={businessData.name}
                              onToastMessage={showToastMessage}
                              disabled={isAnalysisRegenerating || isStrategicRegenerating}
                              exportType="strategic"
                              strategicData={strategicData}
                            />
                          </CustomTooltip>
                        )}
                        {unlockedFeatures.analysis && hasStrategicAccess && (
                          <CustomTooltip align="right" message={<>Re-generate the <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> analysis.</>}>
                            <button
                              onClick={() => {
                                if (!canRegenerate) return;
                                triggerConfirmation(
                                  t("confirm_regeneration_title", { section: 'Strategic' }),
                                  <>{t("Are you sure you want to regenerate the")} <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> {t("analysis? Your existing strategic insights will be permanently overwritten. This action cannot be undone as version history is not maintained.")}</>,
                                  () => handleStrategicAnalysisRegenerate()
                                );
                              }}
                              disabled={isStrategicRegenerating || isAnalysisRegenerating || !canRegenerate || !unlockedFeatures.analysis || !hasStrategicAccess}
                              className={`regenerate-button ${isStrategicRegenerating || isAnalysisRegenerating || !unlockedFeatures.analysis ? 'disabled' : ''}`}
                            >
                              {isStrategicRegenerating ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <RefreshCw size={16} />
                              )}
                            </button>
                          </CustomTooltip>
                        )}
                      </>
                    )}


                  </div>
                </div>

              </>
            )}

            <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>

              <div className={`info-panel ${isMobile ? (['advanced', 'insights', 'strategic', 'bets', 'ranking', 'priorities', 'aha', 'executive', 'cadences'].includes(activeTab) ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
                {!isMobile && isAnalysisExpanded && (
                  <div className="desktop-expanded-analysis">
                    <div className="expanded-analysis-view">
                      <div className="desktop-tabs" ref={navDropdownRef}>
                        <div className="desktop-tabs-main">
                          <div className="business-header-container">
                            <button
                              className="back-button"
                              onClick={() => {
                                if (activeTab === 'advanced') {
                                  setActiveTab('insights');
                                } else {
                                  handleBackFromAnalysis();
                                }
                              }}
                              aria-label="Go Back"
                            >
                              <ArrowLeft size={18} />
                              <span className="breadcrumb-back">
                                {t("backToDashboard_B3") || "Back to Dashboard"}
                              </span>
                            </button>
                            {selectedBusinessName && (
                              <div className="business-breadcrumb">
                                <span className="breadcrumb-separator">/</span>
                                <span className="business-header-name">{selectedBusinessName}</span>

                                {['executive', 'insights', 'advanced', 'strategic'].includes(activeTab) && (
                                  <>
                                    <span className="breadcrumb-separator">/</span>
                                    {activeTab === 'advanced' ? (
                                      <>
                                        <span
                                          className="business-header-name"
                                          onClick={() => setActiveTab('insights')}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          {t("Insights") || "Insights"}
                                        </span>
                                        <span className="breadcrumb-separator">/</span>
                                        <span className="business-header-name text-muted">
                                          {t("Answers/Brief") || "Answers/Brief"}
                                        </span>
                                      </>
                                    ) : activeTab === 'executive' ? (
                                      cameFromInsights ? (
                                        <>
                                          <span className="business-header-name cursor-pointer text-muted hover-primary" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('insights'); setCameFromInsights(false); }}>
                                            {t("Insights") || "Insights"}
                                          </span>
                                          <span className="breadcrumb-separator">/</span>
                                          <span className="business-header-name">
                                            {t("Executive Summary") || "Executive Summary"}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="business-header-name">
                                          {t("Executive Summary") || "Executive Summary"}
                                        </span>
                                      )
                                    ) : (
                                      <span className="business-header-name">
                                        {t("Insights") || "Insights"}
                                      </span>
                                    )}
                                  </>
                                )}

                                {['bets', 'ranking', 'decision-logs', 'priorities', 'cadences'].includes(activeTab) && (
                                  <>
                                    <span className="breadcrumb-separator">/</span>
                                    <span className="business-header-name">
                                      {t("Execution") || "Execution"}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                        <div className="desktop-tabs-buttons">
                          {activeTab === "insights" && (
                            <>
                              <div ref={dropdownRef} className="dropdown-wrapper">
                                <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                                  <span>{selectedDropdownValue}</span>
                                  <ChevronDown size={16} className={`chevron ${showDropdown ? 'open' : ''}`} />
                                </button>
                                {showDropdown && (() => {
                                  const categoryOptions = getPhaseSpecificOptions(currentPhase);
                                  return Object.keys(categoryOptions).length > 0 && (
                                    <div className="dropdown-menu-options">
                                      {Object.entries(categoryOptions).map(([category, items]) =>
                                        items.length > 0 && (
                                          <div key={category}>
                                            <div className="dropdown-category-header">{t(category)}</div>
                                            {items.map((item) => (
                                              <div key={item} onClick={() => {
                                                handleOptionClick(item);
                                              }} className="dropdown-option dropdown-sub-option">
                                                <span className="bullet"></span>
                                                {t(item)}
                                              </div>
                                            ))}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              <CustomTooltip align="right" message={t("download_insights_tooltip") || "Export the insights into PDF report."}>
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
                              </CustomTooltip>

                              {canShowRegenerateButtons && unlockedFeatures.analysis && hasInsightAccess && (
                                <CustomTooltip align="right" message={insightsSubTab === 'direction' ? (t("regenerate_strategic_tooltip") || "Re-generate strategic insights.") : (t("regenerate_all_tooltip") || "Re-generate all insights.")}>
                                  <button
                                    onClick={() => canRegenerate && (insightsSubTab === 'direction' ? handleStrategicAnalysisRegenerate() : handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument, alsoRegenerateStrategic: true }))}
                                    disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate || !hasInsightAccess}
                                    className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
                                  >
                                    {isAnalysisRegenerating ? (
                                      <Loader size={16} className="animate-spin" />
                                    ) : (
                                      <RefreshCw size={16} />
                                    )}
                                  </button>
                                </CustomTooltip>
                              )}
                            </>
                          )}

                          {activeTab === "strategic" && (
                            <>
                              {unlockedFeatures.analysis && (
                                <CustomTooltip align="right" message={t("download_strategic_tooltip") || "Export the strategic into PDF report."}>
                                  <PDFExportButton
                                    className="pdf-export-button"
                                    businessName={businessData.name}
                                    onToastMessage={showToastMessage}
                                    disabled={isAnalysisRegenerating || isStrategicRegenerating}
                                    exportType="strategic"
                                    strategicData={strategicData}
                                  />
                                </CustomTooltip>
                              )}
                              {unlockedFeatures.analysis && hasStrategicAccess && (
                                <CustomTooltip align="right" message={<>Re-generate the <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> analysis.</>}>
                                  <button
                                    onClick={() => canRegenerate && handleStrategicAnalysisRegenerate()}
                                    disabled={isStrategicRegenerating || isAnalysisRegenerating || !canRegenerate || !unlockedFeatures.analysis || !hasStrategicAccess}
                                    className={`regenerate-button ${isStrategicRegenerating || isAnalysisRegenerating || !unlockedFeatures.analysis ? 'disabled' : ''}`}
                                  >
                                    {isStrategicRegenerating ? (
                                      <Loader size={16} className="animate-spin" />
                                    ) : (
                                      <RefreshCw size={16} />
                                    )}
                                  </button>
                                </CustomTooltip>
                              )}
                            </>
                          )}



                          {(activeTab === "bets" || activeTab === "cadences") && (
                            <div className="execution-segmented-toggle ms-3" style={{ margin: 0 }}>
                              <div className={`toggle-option ${activeTab === 'bets' ? 'active' : ''}`} onClick={() => setActiveTab('bets')}>Bets</div>
                              <div className={`toggle-option ${activeTab === 'cadences' ? 'active' : ''}`} onClick={() => setActiveTab('cadences')}>Cadences</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {isArchived && <div className="archived-overlay" />}

                      <div className="expanded-analysis-content">
                        <div className="expanded-analysis-main">
                          {hasPmfAccess && activeTab === "aha" && (
                            <PMFInsightsTab
                              refreshTrigger={pmfRefreshTrigger}
                              onStartOnboarding={() => openModal('pmfOnboarding')}
                            />
                          )}
                          {hasPmfAccess && activeTab === "executive" && (
                            <ExecutiveSummary
                              hideNextStep={cameFromInsights}
                              businessId={selectedBusinessId}
                              onStartOnboarding={() => openModal('pmfOnboarding')}
                              refreshTrigger={pmfRefreshTrigger}
                              questions={questions}
                              userAnswers={userAnswers}
                            />
                          )}
                          {activeTab === "advanced" && (
                            <div className="brief-section">
                              <EditableBriefSection
                                selectedBusinessId={selectedBusinessId}
                                questions={questions}
                                userAnswers={userAnswers}
                                businessData={businessData}
                                isLoading={!questionsLoaded}
                                setActiveTab={setActiveTab}
                                onBusinessDataUpdate={handleBusinessDataUpdate}
                                onAnswerUpdate={async (questionId, newAnswer) => {
                                  handleAnswerUpdate(questionId, newAnswer);
                                  window.dispatchEvent(
                                    new CustomEvent("conversationUpdated", {
                                      detail: { questionId, businessId: selectedBusinessId },
                                    })
                                  );
                                }}
                                onAnalysisRegenerate={handleRegenerateAllAnalysis}
                                onUploadedFileUpdate={setUploadedFile}
                                isAnalysisRegenerating={isAnalysisRegenerating}
                                isStrategicRegenerating={isStrategicRegenerating}
                                isFinancialRegeneratingProp={isProfitabilityAnalysisRegenerating || isGrowthTrackerRegenerating || isLiquidityEfficiencyRegenerating || isInvestmentPerformanceRegenerating || isLeverageRiskRegenerating || isTypeRegenerating('financial')}
                                isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced')}
                                highlightedMissingQuestions={highlightedMissingQuestions}
                                onClearHighlight={() => setHighlightedMissingQuestions(null)}
                                isLaunchedStatus={isLaunchedStatus}
                                documentInfo={documentInfo}
                                answerIds={answerIds}
                                setAnswerIds={setAnswerIds}
                                hasPmfAccess={hasPmfAccess}
                              />
                            </div>
                          )}
                          {activeTab === "insights" && hasInsightAccess && (
                            <div className="analysis-section">
                              <div className="analysis-content">
                                <div className="insights-header-actions mb-4 d-flex justify-content-end gap-3">
                                  <button className="view-edit-inputs-btn" onClick={() => navigate(`/business/${selectedBusinessId}/history`)}>
                                    <i className="lucide-history" /> {t("History") || "History"}
                                  </button>
                                  <button className="view-edit-inputs-btn" onClick={() => setActiveTab('advanced')}>
                                    <i className="lucide-edit-3" /> {t("ViewEdit") || "View / Edit Inputs"}
                                  </button>
                                </div>
                                <div className="insights-segmented-toggle mb-4">
                                  <div
                                    className={`toggle-option ${insightsSubTab === 'diagnosis' ? 'active' : ''}`}
                                    onClick={() => setInsightsSubTab('diagnosis')}
                                  >
                                    <span className="toggle-label">DIAGNOSIS • WHERE YOU STAND</span>
                                    <span className="toggle-title">The 6 C's Framework</span>
                                  </div>
                                  <div
                                    className={`toggle-option ${insightsSubTab === 'direction' ? 'active' : ''} ${!hasStrategicAccess ? 'disabled' : ''}`}
                                    onClick={() => {
                                      if (hasStrategicAccess) {
                                        setInsightsSubTab('direction');
                                      }
                                    }}
                                  >
                                    <span className="toggle-label">DIRECTION • WHERE TO GO</span>
                                    <span className="toggle-title"><span className="notranslate">S.T.R.A.T.E.G.I.C.</span> Scorecard</span>
                                    {!hasStrategicAccess && <Lock size={14} className="ml-2" />}
                                  </div>
                                </div>

                                {insightsSubTab === 'diagnosis' && (
                                  <AnalysisContentManager
                                    {...analysisProps}
                                    canRegenerate={canShowRegenerateButtons}
                                    questionsLoaded={questionsLoaded} />
                                )}

                                {insightsSubTab === 'direction' && hasStrategicAccess && (
                                  <div className="strategic-section mt-4">
                                    <StrategicAnalysis
                                      onRegenerate={handleStrategicAnalysisRegenerate}
                                      isRegenerating={(() => {
                                        const isStrReg = isTypeRegenerating('strategic');
                                        return isStrReg;
                                      })()}
                                      canRegenerate={canShowRegenerateButtons && strategicData && !isAnalysisRegenerating && unlockedFeatures.analysis}
                                      selectedBusinessId={selectedBusinessId}
                                      phaseManager={phaseManager}
                                      saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                                      hideDownload={false}
                                      onRedirectToBrief={handleRedirectToBrief}
                                      isExpanded={true}
                                      onKickstartProjects={() => setActiveTab("bets")}
                                      onContinueToExecution={() => setActiveTab("priorities")}
                                      hasProjectsTab={showProjectsTab}
                                      onToastMessage={showToastMessage}
                                      hasStrategicAccess={hasStrategicAccess}
                                      isAnalysisRegenerating={isAnalysisRegenerating}
                                      isStrategicRegenerating={isStrategicRegenerating}
                                      questionsLoaded={questionsLoaded}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {activeTab === "bets" && hasProjectAccess && (
                            <ProjectsSection
                              onProjectCountChange={handleProjectCountChange}
                              companyAdminIds={companyAdminIds}
                              isArchived={isArchived}
                            />
                          )}
                          {activeTab === "cadences" && hasProjectAccess && (
                            <CadencesSection businessId={selectedBusinessId} />
                          )}
                          {activeTab === "ranking" && hasProjectAccess && (
                            <RankingSection
                              isArchived={isArchived}
                              companyAdminIds={companyAdminIds}
                              setActiveTab={setActiveTab}
                            />
                          )}
                          {activeTab === "decision-logs" && hasProjectAccess && (
                            <BusinessDecisionLogs businessId={selectedBusinessId} />
                          )}
                          {hasPmfAccess && activeTab === "priorities" && (
                            <PrioritiesProjects
                              selectedBusinessId={selectedBusinessId}
                              companyAdminIds={companyAdminIds}
                              onSuccess={handleKickstartSuccess}
                              onStayOnPriorities={handleStayOnPriorities}
                              onToastMessage={showToastMessage}
                              onStartOnboarding={() => openModal('pmfOnboarding')}
                              refreshTrigger={pmfRefreshTrigger}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isMobile && !isAnalysisExpanded && (
                  <>
                    <div className="desktop-tabs">
                      <div className="desktop-tabs-controls">
                        <div className="nav-group-minimal">
                          {hasPmfAccess && (
                            <button
                              className={`desktop-tab ${activeTab === "executive" ? "active" : ""}`}
                              onClick={handleExecutiveTabClick}
                            >
                              <LayoutDashboard size={16} />
                              <span>{t("Executive Summary")}</span>
                            </button>
                          )}
                          {(hasInsightAccess || hasStrategicAccess) && (
                            <button
                              className={`desktop-tab ${activeTab === "advanced" ? "active" : ""}`}
                              onClick={handleBriefTabClick}
                            >
                              <HelpCircle size={16} />
                              <span>{t("Answers/Brief")}</span>
                            </button>
                          )}
                          {hasInsightAccess && (
                            <button className={`desktop-tab ${activeTab === "insights" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
                              <TrendingUp size={16} />
                              <span>{t("Insights")}</span>
                            </button>
                          )}
                          {hasPmfAccess && (
                            <button
                              className={`desktop-tab ${activeTab === "priorities" ? "active" : ""}`}
                              onClick={handlePrioritiesTabClick}
                            >
                              <ListTodo size={16} />
                              <span>{t("Priorities")}</span>
                            </button>
                          )}
                          {showProjectsTab && hasProjectAccess && (
                            <button className={`desktop-tab ${activeTab === "bets" ? "active" : ""}`} onClick={() => setActiveTab("bets")}>
                              <Briefcase size={16} />
                              <span>{t("Bets")}</span>
                            </button>
                          )}
                          {showProjectsTab && hasProjectAccess && (
                            <button className={`desktop-tab ${activeTab === "decision-logs" ? "active" : ""}`} onClick={() => setActiveTab("decision-logs")}>
                              <FileText size={16} />
                              <span>{t("Decision_Logs") || "Decision Logs"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activeTab === "insights" && unlockedFeatures.analysis && (
                        <div className="desktop-tabs-buttons">
                          <div ref={dropdownRef} className="dropdown-wrapper">
                            <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                              <span>{selectedDropdownValue}</span>
                              <ChevronDown size={16} className={`chevron ${showDropdown ? 'open' : ''}`} />
                            </button>
                            {showDropdown && (() => {
                              const categoryOptions = getPhaseSpecificOptions(currentPhase);
                              return Object.keys(categoryOptions).length > 0 && (
                                <div className="dropdown-menu-options">
                                  {Object.entries(categoryOptions).map(([category, items]) =>
                                    items.length > 0 && (
                                      <div key={category}>
                                        <div className="dropdown-category-header">{t(category)}</div>
                                        {items.map((item) => (
                                          <div key={item} onClick={() => {
                                            handleOptionClick(item);
                                          }} className="dropdown-option dropdown-sub-option">
                                            <span className="bullet"></span>
                                            {t(item)}
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {canShowRegenerateButtons && unlockedFeatures.analysis && hasInsightAccess && (
                            <CustomTooltip align="right" message={t("regenerate_all_tooltip") || "Re-generate all insights."}>
                              <button
                                onClick={() => canRegenerate && handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument, alsoRegenerateStrategic: true })}
                                disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate || !hasInsightAccess}
                                className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
                              >
                                {isAnalysisRegenerating ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={16} />
                                )}
                              </button>
                            </CustomTooltip>
                          )}
                        </div>
                      )}
                    </div>

                    {activeTab === "strategic" && unlockedFeatures.analysis && (
                      <div className="desktop-tabs-buttons">
                        {canShowRegenerateButtons && hasStrategicAccess && (
                          <CustomTooltip align="right" message={<>Re-generate the <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> analysis.</>}>
                            <button
                              onClick={() => canRegenerate && handleStrategicAnalysisRegenerate()}
                              disabled={isStrategicRegenerating || isAnalysisRegenerating || !canRegenerate || !unlockedFeatures.analysis || !hasStrategicAccess}
                              className={`regenerate-button ${isStrategicRegenerating || isAnalysisRegenerating || !unlockedFeatures.analysis ? 'disabled' : ''}`}
                            >
                              {isStrategicRegenerating ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <RefreshCw size={16} />
                              )}
                            </button>
                          </CustomTooltip>
                        )}
                      </div>
                    )}

                    <div className="info-panel-content">
                      {activeTab === "advanced" && (
                        <div className="brief-section">
                          {!unlockedFeatures.analysis && completedQuestions.size > 0 && (
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
                            isLoading={!questionsLoaded}
                            setActiveTab={setActiveTab}
                            onBusinessDataUpdate={handleBusinessDataUpdate}
                            onAnswerUpdate={async (questionId, newAnswer) => {
                              handleAnswerUpdate(questionId, newAnswer);
                              window.dispatchEvent(
                                new CustomEvent("conversationUpdated", {
                                  detail: { questionId, businessId: selectedBusinessId },
                                })
                              );
                            }}



                            onAnalysisRegenerate={handleRegenerateAllAnalysis}
                            onUploadedFileUpdate={setUploadedFile}
                            isAnalysisRegenerating={isAnalysisRegenerating}
                            isStrategicRegenerating={isStrategicRegenerating}
                            isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                            highlightedMissingQuestions={highlightedMissingQuestions}
                            onClearHighlight={() => setHighlightedMissingQuestions(null)}
                            isLaunchedStatus={isLaunchedStatus}
                            documentInfo={documentInfo}
                            answerIds={answerIds}
                            setAnswerIds={setAnswerIds}
                            hasPmfAccess={hasPmfAccess}
                          />
                        </div>
                      )}
                      {activeTab === "aha" && (
                        <PMFInsightsTab
                          selectedBusinessId={selectedBusinessId}
                          refreshTrigger={pmfRefreshTrigger}
                          onStartOnboarding={() => openModal('pmfOnboarding')}
                        />
                      )}
                      {hasPmfAccess && activeTab === "executive" && (
                        <ExecutiveSummary
                          hideNextStep={cameFromInsights}
                          businessId={selectedBusinessId}
                          onStartOnboarding={() => openModal('pmfOnboarding')}
                          refreshTrigger={pmfRefreshTrigger}
                          questions={questions}
                          userAnswers={userAnswers}
                        />
                      )}
                      {activeTab === "insights" && hasInsightAccess && (
                        <div className="analysis-section">
                          <div className="analysis-content">
                            <div className="insights-header-actions mb-4 d-flex justify-content-end gap-3">
                              <button className="view-edit-inputs-btn" onClick={() => navigate(`/business/${selectedBusinessId}/history`)}>
                                <i className="lucide-history" /> {t("History") || "History"}
                              </button>
                              <button className="view-edit-inputs-btn" onClick={() => setActiveTab('advanced')}>
                                <i className="lucide-edit-3" /> {t("Edit") || "Edit"}
                              </button>
                            </div>
                            <div className="insights-segmented-toggle mb-4">
                              <div
                                className={`toggle-option ${insightsSubTab === 'diagnosis' ? 'active' : ''}`}
                                onClick={() => setInsightsSubTab('diagnosis')}
                              >
                                <span className="toggle-label">DIAGNOSIS • WHERE YOU STAND</span>
                                <span className="toggle-title">The 6 C's Framework</span>
                              </div>
                              <div
                                className={`toggle-option ${insightsSubTab === 'direction' ? 'active' : ''} ${!hasStrategicAccess ? 'disabled' : ''}`}
                                onClick={() => {
                                  if (hasStrategicAccess) {
                                    setInsightsSubTab('direction');
                                  }
                                }}
                              >
                                <span className="toggle-label">DIRECTION • WHERE TO GO</span>
                                <span className="toggle-title"><span className="notranslate">S.T.R.A.T.E.G.I.C.</span> Scorecard</span>
                                {!hasStrategicAccess && <Lock size={14} className="ml-2" />}
                              </div>
                            </div>

                            {insightsSubTab === 'diagnosis' && (
                              <AnalysisContentManager
                                {...analysisProps}
                                canRegenerate={canShowRegenerateButtons}
                                questionsLoaded={questionsLoaded} />
                            )}

                            {insightsSubTab === 'direction' && hasStrategicAccess && (
                              <div className="strategic-section mt-4">
                                <StrategicAnalysis
                                  questions={questions}
                                  userAnswers={userAnswers}
                                  businessName={businessData.name}
                                  onRegenerate={handleStrategicAnalysisRegenerate}
                                  isRegenerating={isStrategicRegenerating}
                                  canRegenerate={canShowRegenerateButtons && strategicData && !isAnalysisRegenerating && unlockedFeatures.analysis}
                                  strategicData={strategicData}
                                  selectedBusinessId={selectedBusinessId}
                                  phaseManager={phaseManager}
                                  saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                                  hideDownload={false}
                                  phaseAnalysisArray={phaseAnalysisArray}
                                  onRedirectToBrief={handleRedirectToBrief}
                                  streamingManager={streamingManager}
                                  triggerConfirmation={triggerConfirmation}
                                  isExpanded={true}
                                  onContinueToExecution={() => setActiveTab("priorities")}
                                  hasProjectsTab={showProjectsTab}
                                  isAnalysisRegenerating={isAnalysisRegenerating}
                                  isStrategicRegenerating={isStrategicRegenerating}
                                  questionsLoaded={questionsLoaded}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {activeTab === "bets" && hasProjectAccess && (
                        <div className="projects-container">
                          <ProjectsSection
                            onProjectCountChange={handleProjectCountChange}
                            companyAdminIds={companyAdminIds}
                            isArchived={isArchived}
                          />
                        </div>
                      )}
                      {activeTab === "cadences" && hasProjectAccess && (
                        <div className="projects-container">
                          <CadencesSection cadences={[]} />
                        </div>
                      )}
                      {activeTab === "decision-logs" && hasProjectAccess && (
                        <div className="decision-logs-container">
                          <BusinessDecisionLogs businessId={selectedBusinessId} />
                        </div>
                      )}
                      {hasPmfAccess && activeTab === "priorities" && (
                        <PrioritiesProjects
                          selectedBusinessId={selectedBusinessId}
                          companyAdminIds={companyAdminIds}
                          onSuccess={handleKickstartSuccess}
                          onStayOnPriorities={handleStayOnPriorities}
                          onToastMessage={showToastMessage}
                          onStartOnboarding={() => openModal('pmfOnboarding')}
                          refreshTrigger={pmfRefreshTrigger}
                        />
                      )}
                    </div>
                  </>
                )}

                {(!isAnalysisExpanded || isMobile) && isMobile && (
                  <div className="info-panel-content">
                    {activeTab === "advanced" && (
                      <div className="brief-section">
                        {!unlockedFeatures.analysis && completedQuestions.size > 0 && (
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
                          isLoading={!questionsLoaded}
                          setActiveTab={setActiveTab}
                          onBusinessDataUpdate={handleBusinessDataUpdate}
                          onAnswerUpdate={async (questionId, newAnswer) => {
                            handleAnswerUpdate(questionId, newAnswer);

                            window.dispatchEvent(
                              new CustomEvent('conversationUpdated', {
                                detail: { questionId, businessId: selectedBusinessId }
                              })
                            );
                          }}

                          onAnalysisRegenerate={handleRegenerateAllAnalysis}
                          onUploadedFileUpdate={setUploadedFile}
                          isAnalysisRegenerating={isAnalysisRegenerating}
                          isStrategicRegenerating={isStrategicRegenerating}
                          isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                          highlightedMissingQuestions={highlightedMissingQuestions}
                          onClearHighlight={() => setHighlightedMissingQuestions(null)}
                          isLaunchedStatus={isLaunchedStatus}
                          documentInfo={documentInfo}
                          answerIds={answerIds}
                          setAnswerIds={setAnswerIds}
                          hasPmfAccess={hasPmfAccess}
                        />
                      </div>
                    )}
                    {hasPmfAccess && activeTab === "aha" && (
                      <PMFInsightsTab
                        selectedBusinessId={selectedBusinessId}
                        refreshTrigger={pmfRefreshTrigger}
                        onStartOnboarding={() => openModal('pmfOnboarding')}
                      />
                    )}
                    {hasPmfAccess && activeTab === "executive" && (
                      <ExecutiveSummary
                        hideNextStep={cameFromInsights}
                        businessId={selectedBusinessId}
                        onStartOnboarding={() => openModal('pmfOnboarding')}
                        refreshTrigger={pmfRefreshTrigger}
                        questions={questions}
                        userAnswers={userAnswers}
                      />
                    )}
                    {activeTab === "insights" && hasInsightAccess && (
                      <div className="analysis-section">
                        <div className="analysis-content">
                          <div className="insights-header-actions mb-4 d-flex justify-content-end gap-3">
                            <button className="view-edit-inputs-btn" onClick={() => navigate(`/business/${selectedBusinessId}/history`)}>
                              <i className="lucide-history" /> {t("History") || "History"}
                            </button>
                            <button className="view-edit-inputs-btn" onClick={() => setActiveTab('advanced')}>
                              <i className="lucide-edit-3" /> {t("Edit") || "Edit"}
                            </button>
                          </div>
                          <div className="insights-segmented-toggle mb-4">
                            <div
                              className={`toggle-option ${insightsSubTab === 'diagnosis' ? 'active' : ''}`}
                              onClick={() => setInsightsSubTab('diagnosis')}
                            >
                              <span className="toggle-label">DIAGNOSIS • WHERE YOU STAND</span>
                              <span className="toggle-title">The 6 C's Framework</span>
                            </div>
                            <div
                              className={`toggle-option ${insightsSubTab === 'direction' ? 'active' : ''} ${!hasStrategicAccess ? 'disabled' : ''}`}
                              onClick={() => {
                                if (hasStrategicAccess) {
                                  setInsightsSubTab('direction');
                                }
                              }}
                            >
                              <span className="toggle-label">DIRECTION • WHERE TO GO</span>
                              <span className="toggle-title"><span className="notranslate">S.T.R.A.T.E.G.I.C.</span> Scorecard</span>
                              {!hasStrategicAccess && <Lock size={14} className="ml-2" />}
                            </div>
                          </div>

                          {insightsSubTab === 'diagnosis' && (
                            <AnalysisContentManager
                              {...analysisProps}
                              canRegenerate={canShowRegenerateButtons}
                              questionsLoaded={questionsLoaded} />
                          )}

                          {insightsSubTab === 'direction' && hasStrategicAccess && (
                            <div className="strategic-section mt-4">
                              <StrategicAnalysis
                                questions={questions}
                                userAnswers={userAnswers}
                                businessName={businessData.name}
                                onRegenerate={handleStrategicAnalysisRegenerate}
                                isRegenerating={isStrategicRegenerating}
                                canRegenerate={canShowRegenerateButtons && strategicData && !isAnalysisRegenerating && unlockedFeatures.analysis}
                                strategicData={strategicData}
                                selectedBusinessId={selectedBusinessId}
                                phaseManager={phaseManager}
                                saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                                hideDownload={false}
                                phaseAnalysisArray={phaseAnalysisArray}
                                onRedirectToBrief={handleRedirectToBrief}
                                streamingManager={streamingManager}
                                triggerConfirmation={triggerConfirmation}
                                isExpanded={true}
                                onKickstartProjects={() => setActiveTab("bets")}
                                onContinueToExecution={() => setActiveTab("priorities")}
                                hasProjectsTab={showProjectsTab}
                                questionsLoaded={questionsLoaded}
                                isAnalysisRegenerating={isAnalysisRegenerating}
                                isStrategicRegenerating={isStrategicRegenerating}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === "bets" && hasProjectAccess && (
                      <ProjectsSection
                        onProjectCountChange={handleProjectCountChange}
                        companyAdminIds={companyAdminIds}
                        isArchived={isArchived}
                      />
                    )}
                    {activeTab === "cadences" && hasProjectAccess && (
                      <CadencesSection cadences={[]} />
                    )}
                    {activeTab === "ranking" && hasProjectAccess && (
                      <RankingSection
                        isArchived={isArchived}
                        companyAdminIds={companyAdminIds}
                      />
                    )}
                    {activeTab === "decision-logs" && hasProjectAccess && (
                      <BusinessDecisionLogs businessId={selectedBusinessId} />
                    )}
                    {hasPmfAccess && activeTab === "priorities" && (
                      <PrioritiesProjects
                        selectedBusinessId={selectedBusinessId}
                        companyAdminIds={companyAdminIds}
                        onSuccess={handleKickstartSuccess}
                        onStayOnPriorities={handleStayOnPriorities}
                        onToastMessage={showToastMessage}
                        onStartOnboarding={() => openModal('pmfOnboarding')}
                        refreshTrigger={pmfRefreshTrigger}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <UpgradeModal
          show={isModalOpen('upgrade')}
          onHide={() => closeModal('upgrade')}
          onUpgradeSuccess={() => window.location.reload()}
        />

        {hasPmfAccess && (
          <PMFOnboardingModal
            show={isModalOpen('pmfOnboarding')}
            onHide={() => closeModal('pmfOnboarding')}
            businessId={selectedBusinessId}
            onToastMessage={showToastMessage}
            onSubmit={() => {
              closeModal('pmfOnboarding');
              handleExecutiveTabClick();
              setPmfRefreshTrigger(prev => prev + 1);
              window.dispatchEvent(new CustomEvent("pmfOnboardingCompleted"));
            }}
          />
        )}
        <ConfirmationModal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmVariant="primary"
        />

        <PlanLimitModal
          show={isModalOpen('noFeatureAccess')}
          onHide={() => closeModal('noFeatureAccess')}
          title={t('no_access_modal_title')}
          message={accessModalMessage}
          subMessage={accessModalSubMessage}
          isAdmin={['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase())}
        />
      </div>
    </BusinessSetupContext.Provider>
  );
};

export default BusinessSetupPage;



