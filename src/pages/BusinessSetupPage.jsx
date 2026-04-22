import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Loader,
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
  BarChart4
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useBusinessStore, useUIStore, useAnalysisStore, useProjectStore } from "../store";
import { useShallow } from 'zustand/shallow';

import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PhaseManager from "../components/PhaseManager";
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
import { answerService } from "../services/answerService";
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";
import { getUserLimits } from '../utils/authUtils';
import CustomTooltip from "../components/CustomTooltip";
import PlanLimitModal from "../components/PlanLimitModal";

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
  "purchase-criteria": "customer",
  "loyalty-nps": "customer",
  "expanded-capability": "capabilities",
  "maturity": "capabilities",
  "competitive-landscape": "competition",
  "core-adjacency": "current-strategy",
};

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

// Helper: turn a business name into a URL-safe slug
const toSlug = (name = '') =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


const BusinessSetupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { pmf: hasPmfAccess, insight: hasInsightAccess, strategic: hasStrategicAccess, project: hasProjectAccess } = getUserLimits();

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
      console.log("Navigation-driven business context switch to:", location.state.businessId);
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
  const getAuthToken = useCallback(() => token, [token]);
  const getLoggedInRole = () => (userRole || "").toLowerCase();
  const loggedInRole = getLoggedInRole();

  const canRegenerate = !["viewer"].includes(loggedInRole);
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
    swotAnalysis, purchaseCriteria, loyaltyNPS, portersData, pestelData,
    fullSwotData, competitiveAdvantage, strategicData, expandedCapability,
    strategicRadar, productivityData, maturityData, competitiveLandscape,
    coreAdjacency, profitabilityData, growthTrackerData, liquidityEfficiencyData,
    investmentPerformanceData, leverageRiskData,
    isRegenerating: isTypeRegenerating,
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
    purchaseCriteria: state.purchaseCriteria,
    loyaltyNPS: state.loyaltyNPS,
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
    isRegenerating: state.isRegenerating,
    setQuestionsLoaded: state.setQuestionsLoaded,
    initializeBusinessData: state.initializeBusinessData,
    resetAnalysis: state.resetAnalysis,
  })));

  // Regenerating flag aliases
  const isAnalysisRegenerating = isTypeRegenerating('swot') || isTypeRegenerating('purchaseCriteria') || isTypeRegenerating('loyaltyNPS') || isTypeRegenerating('porters') || isTypeRegenerating('pestel') || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
  const isStrategicRegenerating = isTypeRegenerating('strategic') || isTypeRegenerating('initial') || isTypeRegenerating('essential') || isTypeRegenerating('advanced');
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
    const { pmf: hasPmfAccess, insight: hasInsightAccess, strategic: hasStrategicAccess, project: hasProjectAccess } = getUserLimits();
    if (hasPmfAccess) return "executive";
    if (hasInsightAccess || hasStrategicAccess) return "advanced";
    if (hasProjectAccess) return "projects";
    
    return "advanced"; // Ultimate fallback
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
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
      // Clear the local fetch cache when business changes so we re-fetch everything for the new business
      fetchedAnalysisKeys.current.clear();
      fetchAnalysisData(selectedBusinessId);
    }
  }, [selectedBusinessId, fetchAnalysisData]);

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

    if (initialTab) {
      // Check if user has access to the requested initial tab
      const isPmfTab = ["executive", "priorities"].includes(initialTab);
      const isProjectTab = initialTab === "projects";

    if (targetTab !== activeTab) {
      // Check access before switching
      const isPmfTab = ["executive", "priorities"].includes(targetTab);
      const isProjectTab = targetTab === "projects" || targetTab === "ranking";
      
      if ((isPmfTab && !hasPmfAccess) || (isProjectTab && !hasProjectAccess)) {
        console.warn("Blocking access to unauthorized tab:", targetTab);
        
        const isAdminRole = ['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase());
        const subMessageKey = isAdminRole ? "no_access_modal_sub_admin" : "no_access_modal_sub_user";
        
        setAccessModalMessage(t('no_access_modal_msg'));
        setAccessModalSubMessage(t(subMessageKey));
        openModal('noFeatureAccess');
        
        // Redirect to a safe tab
        const safeTab = hasPmfAccess ? "executive" : (hasInsightAccess || hasStrategicAccess ? "advanced" : "advanced");
        setActiveTab(safeTab);
        return;
      } else {
        setActiveTab(targetTab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.key, location.state, hasPmfAccess, hasProjectAccess]); // location.key firmly triggers this on any navigation
  
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
        if ((activeTab === 'priorities' || activeTab === 'projects' || activeTab === 'ranking') && selectedBusinessName && selectedBusinessName !== "") {
          console.log("Skipping business recovery fetch for tab:", activeTab);
          return;
        }

        if (isBusinessFetching.current) {
          console.log("Business fetch already in progress for:", selectedBusinessId);
          return;
        }

        try {
          isBusinessFetching.current = true;
          console.log("Recovering business data for:", selectedBusinessId);
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
    const tabsNeedingQuestions = ['advanced', 'insights', 'strategic'];
    if (!tabsNeedingQuestions.includes(activeTab)) {
      // For non-question tabs, just mark as loaded if not already done
      if (!useAnalysisStore.getState().questionsLoaded) {
        useAnalysisStore.setState({ questionsLoaded: true });
      }
      return;
    }

    // Guard: don't re-run if already loaded for this business
    const loadKey = `${selectedBusinessId}-${activeTab}`;
    if (hasLoadedQuestionsRef.current === loadKey) return;

    const loadQuestions = async () => {
      if (!selectedBusinessId) return;
      try {
        if (!token) return;
        setQuestionsLoaded(false);
        setApiLoading('fetchAnalysisDataThroughBackend', true);
        hasLoadedQuestionsRef.current = loadKey;

        // Use the enhanced Answers API universally for all tabs to get questions and answers
        const responseData = await answerService.getAnswersByBusiness(selectedBusinessId);

        if (responseData) {
          // 1. Handle Document Info
          const documentExists = responseData.document_info?.has_document === true;
          setHasUploadedDocument(documentExists);

          if (responseData.document_info && responseData.document_info.has_document) {
            setDocumentInfo(responseData.document_info);
          } else {
            // Use the service which now has local promise-caching to avoid duplicate requests
            const doc = await apiService.fetchFinancialDocument(selectedBusinessId);
            if (doc) {
              setDocumentInfo(doc);
            } else {
              setDocumentInfo({ has_document: false });
            }
          }
          setDocumentInfo(responseData.document_info || { has_document: false });

          // 2. Handle Questions and Answers mapping
          let finalAnswers = {};
          let finalCompleted = [];

          if (responseData.questions?.length > 0) {
            setQuestions(responseData.questions); // This internally sets questionsLoaded: true

            const answersMap = {};
            const answerIdsMap = {};

            responseData.data?.forEach(ans => {
              if (ans.question_id && ans.answer) {
                const qIdStr = String(ans.question_id);
                answersMap[qIdStr] = ans.answer;
                answerIdsMap[qIdStr] = ans._id;
              }
            });

            if (Object.keys(answersMap).length > 0) {
              Object.entries(answersMap).forEach(([qId, ans]) => setUserAnswer(qId, ans));
              setAnswerIds(answerIdsMap);
            }
          } else {
            useAnalysisStore.setState({ questionsLoaded: true });
            finalAnswers = answersMap;
            finalCompleted = Object.keys(answersMap);
            setAnswerIds(answerIdsMap);
          }

          // 3. Fetch analysis results silently (don't set loaded=true inside fetchAnalysisData)
          let analysisUpdates = {};
          if (Object.keys(finalAnswers).length > 0) {
            analysisUpdates = await fetchAnalysisData(selectedBusinessId, true);
          }

          // 4. ATOMIC INITIALIZATION
          initializeBusinessData({
            questions: responseData.questions || [],
            userAnswers: finalAnswers,
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
  }, [selectedBusinessId, API_BASE_URL, activeTab, token, setQuestions, setUserAnswer, setAnswerIds]);

  useEffect(() => {
    setHasUploadedDocument(!!uploadedFileForAnalysis);
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
    if ((activeTab === 'projects' || activeTab === 'ranking') && !showProjectsTab && hasProjectAccess) {
      setShowProjectsTab(true);
      if (selectedBusinessId) {
        setBusinessSetting(selectedBusinessId, 'showProjectsTab', true);
      }
    }
  }, [activeTab, showProjectsTab, selectedBusinessId, hasProjectAccess, setBusinessSetting]);

  // Automatically show Projects tab if this business already has projects
  // Skip this check when on the projects tab itself (handled by ProjectsSection) or if already visible
  useEffect(() => {
    if (showProjectsTab || !selectedBusinessId || activeTab === 'projects' || activeTab === 'ranking') return;

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

    triggerConfirmation(
      t("Regenerate Phase Analysis?"),
      t("Are you sure you want to regenerate the insights for this phase? All existing analysis data for this phase will be permanently overwritten. This action cannot be undone as version history is not maintained."),
      async () => {
        // Merge uploadedFile from options into userAnswers context for the store
        const mergedAnswers = { ...userAnswers };
        if (options?.uploadedFile) {
          mergedAnswers.uploadedFile = options.uploadedFile;
        } else if (uploadedFileForAnalysis) {
          mergedAnswers.uploadedFile = uploadedFileForAnalysis;
        }

        await regeneratePhase(targetPhase, questions, mergedAnswers, selectedBusinessId, showToastMessage);
        if (alsoRegenerateStrategic && targetPhase !== 'advanced') {
          await handleStrategicAnalysisRegenerate(true);
        }
      }
    );
  };

  const setUploadedFile = (file) => {
    setUploadedFileForAnalysis(file);
  };

  const loadExistingAnalysisData = useCallback((phaseAnalysisArray) => {
    setPhaseAnalysisArray(phaseAnalysisArray);
    // Data mapping is now handled inside fetchAnalysisData in the store
  }, []);

  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    hasUploadedDocument, setHasUploadedDocument,
    onDocumentInfoLoad: (docInfo) => setDocumentInfo(docInfo),
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      useAnalysisStore.setState({ completedQuestions: Array.from(completedSet) });
      Object.entries(answersMap).forEach(([qId, ans]) => setUserAnswer(qId, ans));
    },
    onCompletedPhasesUpdate: () => { },
    onAnalysisGeneration: () => handleRegeneratePhase('initial'),
    onFullSwotGeneration: () => handleRegeneratePhase('essential'),
    onGoodPhaseGeneration: () => handleRegeneratePhase('good'),
    onAdvancedPhaseGeneration: () => handleRegeneratePhase('advanced'),
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL, getAuthToken, apiService, stateSetters, showToastMessage
  });

  const handleStrategicAnalysisRegenerate = (skipConfirmation = false) => {
    const action = async () => {
      if (!phaseManager.canRegenerateAnalysis()) return;
      await regenerateIndividualAnalysis('strategic', questions, userAnswers, selectedBusinessId, showToastMessage);
    };

    if (skipConfirmation) {
      action();
    } else {
      triggerConfirmation(
        t("Regenerate Strategic Analysis?"),
        t("Are you sure you want to regenerate the S.T.R.A.T.E.G.I.C. analysis? Your existing strategic insights will be permanently overwritten. This action cannot be undone as version history is not maintained."),
        action
      );
    }
  };

  const handleRegenerateAllAnalysis = (options = {}) => {
    triggerConfirmation(
      t("Regenerate All Analysis?"),
      t("Are you sure you want to regenerate all insights? This will permanently overwrite all your current analysis data across all phases. This action cannot be undone as version history is not maintained."),
      async () => {
        if (isRegeneratingRef.current) return;
        isRegeneratingRef.current = true;
        try {
          if (options?.onlyFinancial) {
            await handleRegeneratePhase('financial', false, options);
            return;
          }

          const findHighestAnsweredPhase = () => {
            // If we have specific updated questions, prioritize based on them first
            if (options?.updatedQuestionIds && options.updatedQuestionIds.length > 0) {
              const updatedPhases = questions
                .filter(q => options.updatedQuestionIds.includes(q._id || q.question_id))
                .map(q => q.phase);

              if (updatedPhases.includes('advanced')) return 'advanced';
              if (updatedPhases.includes('essential')) return 'essential';
              if (updatedPhases.includes('initial')) return 'initial';
            }

            const phases = ['advanced', 'essential', 'initial'];
            return phases.find(phase =>
              questions.some(q => q.phase === phase && userAnswers[q._id]?.trim())
            ) || 'initial';
          };

          const targetPhase = findHighestAnsweredPhase();

          // Removed the 'targetPhase !== advanced' restriction to allow financial regeneration in all phases
          if (options?.includeFinancial) {
            await handleRegeneratePhase('financial', false);
          }

          await handleRegeneratePhase(targetPhase, true);
        } finally {
          isRegeneratingRef.current = false;
        }
      }
    );
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
    // Removed unlockedFeatures.analysis check to make it always accessible
    if (isMobile) {
      setActiveTab("strategic");
    } else {
      if (!isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("strategic");
        setIsSliding(false);
      } else {
        setActiveTab("strategic");
      }
    }
  };

  const handleBackFromAnalysis = () => {
    navigate("/dashboard");
  };

  const handleBack = () => navigate("/dashboard");

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
    useProjectStore.getState().setViewMode('projects');
    setShowProjectsTab(true);
    setActiveTab("projects");
  };

  const handleStayOnPriorities = () => {
    setShowProjectsTab(true);
  };


  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    // Label to Data Availability mapping
    const dataAvailabilityMap = {
      "swot_analysis": !!swotAnalysis,
      "Porters_Five_Forces": !!portersData,
      "PESTEL_Analysis": !!pestelData,
      "Purchase_Criteria": !!purchaseCriteria,
      "Loyalty_&_NPS": !!loyaltyNPS,
      "Full_SWOT_Portfolio": !!fullSwotData,
      "Strategic_Positioning_Radar": !!strategicRadar,
      "Competitive_Advantage_Matrix": !!competitiveAdvantage,
      "Capability_Heatmap": !!expandedCapability,
      "Maturity_Score": !!maturityData,
      "Competitive_Landscape": !!competitiveLandscape,
      "Core": !!coreAdjacency,
      "Productivity_Metrics": !!productivityData,
      "Profitability_Analysis": !!profitabilityData,
      "Growth_Tracker": !!growthTrackerData,
      "Liquidity_Efficiency": !!liquidityEfficiencyData,
      "Investment_Performance": !!investmentPerformanceData,
      "Leverage_Risk": !!leverageRiskData
    };

    const categoryOptions = {
      initial: {
        "Context/Industry": ["swot_analysis", "Porters_Five_Forces", "PESTEL_Analysis"],
        "Customer": ["Purchase_Criteria", "Loyalty_&_NPS"]
      },
      essential: {
        "Current Strategy": ["Core"],
        "Costs/Financial": ["Productivity_Metrics"],
        "Context/Industry": ["Porters_Five_Forces", "PESTEL_Analysis", "Full_SWOT_Portfolio", "Strategic_Positioning_Radar"],
        "Customer": ["Purchase_Criteria", "Loyalty_&_NPS", "Competitive_Advantage_Matrix"],
        "Capabilities": ["Capability_Heatmap", "Maturity_Score"],
        "Competition": ["Competitive_Landscape"]
      },
      advanced: {
        "Current Strategy": ["Core"],
        "Costs/Financial": ["Productivity_Metrics"],
        "Context/Industry": ["Porters_Five_Forces", "PESTEL_Analysis", "Full_SWOT_Portfolio", "Strategic_Positioning_Radar"],
        "Customer": ["Purchase_Criteria", "Loyalty_&_NPS", "Competitive_Advantage_Matrix"],
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
    
    // Filter out options that don't have data
    const filteredOptions = {};
    Object.entries(selectedOptions).forEach(([category, items]) => {
      // Keep only items that have analysis data available
      const filteredItems = items.filter(item => dataAvailabilityMap[item]);
      
      // Only include the category if it has at least one item with data
      if (filteredItems.length > 0) {
        filteredOptions[category] = filteredItems;
      }
    });

    return filteredOptions;
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
    if (activeTab) params.tab = activeTab;
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedBusinessName, selectedBusinessId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchedAnalysisKeys = useRef(new Set());

  // Only load stored analysis data when user visits the insights or strategic tab
  useEffect(() => {
    if (activeTab !== 'insights' && activeTab !== 'strategic') return;
    
    // Check if we need to force a refresh for the strategic tab
    const forceRefresh = activeTab === 'strategic';

    const fetchKey = `${selectedBusinessId}-${activeTab}`;
    if (selectedBusinessId && questionsLoaded && !fetchedAnalysisKeys.current.has(fetchKey)) {
      fetchedAnalysisKeys.current.add(fetchKey);
      setTimeout(() => {
        // Use the store's fetchAnalysisData directly with forceRefresh if needed
        // This ensures the store is updated and the backend is hit
        if (forceRefresh) {
          fetchAnalysisData(selectedBusinessId, true, true);
        } else {
          phaseManager.loadExistingAnalysis();
        }
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

  const hasAnalysisData = !!(swotAnalysis || purchaseCriteria || loyaltyNPS || portersData ||
    pestelData || fullSwotData || competitiveAdvantage || expandedCapability ||
    strategicRadar || productivityData || maturityData || competitiveLandscape ||
    coreAdjacency || profitabilityData || growthTrackerData);

  const analysisProps = {
    triggerConfirmation,
    isAnalysisRegenerating, isStrategicRegenerating,
    isFullSwotRegenerating, isCompetitiveAdvantageRegenerating,
    isExpandedCapabilityRegenerating, isStrategicRadarRegenerating,
    isProductivityRegenerating, isMaturityRegenerating,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
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

  return (
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

              <button
                className="mobile-menu-trigger"
                onClick={() => isModalOpen('mobileMenu') ? closeModal('mobileMenu') : openModal('mobileMenu')}
                aria-label="Toggle Menu"
              >
                {isModalOpen('mobileMenu') ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            <div className="mobile-active-tab">
              {(['executive', 'advanced', 'insights', 'strategic', 'priorities', 'projects', 'ranking'].includes(activeTab)) ? (
                <div className="mobile-tab-selector">
                  <div className="mobile-tab-trigger no-dropdown">
                    <span>
                      {activeTab === "executive" && t("Executive Summary")}
                      {activeTab === "priorities" && t("Priorities")}
                      {activeTab === "advanced" && (hasInsightAccess || hasStrategicAccess) && t("Answers/Brief")}
                      {activeTab === "insights" && (hasPmfAccess ? t("insights") : "Insights")}
                      {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
                      {(activeTab === "projects" || activeTab === "ranking") && t("Projects")}
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
                  {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
                  {(activeTab === "projects" || activeTab === "ranking") && t("Projects")}
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
                        onClick={() => {
                          if (!canRegenerate) return;
                          triggerConfirmation(
                            t("confirm_regeneration_all_title"),
                            t("confirm_regeneration_all_message"),
                            () => handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument })
                          );
                        }}
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
                    <CustomTooltip align="right" message={t("regenerate_strategic_tooltip") || "Re-generate the S.T.R.A.T.E.G.I.C. analysis."}>
                      <button
                        onClick={() => {
                          if (!canRegenerate) return;
                          triggerConfirmation(
                            t("confirm_regeneration_title", { section: 'S.T.R.A.T.E.G.I.C.' }),
                            t("confirm_regeneration_message", { section: 'S.T.R.A.T.E.G.I.C.' }),
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

              {activeTab === "executive" && (
                <CustomTooltip align="right" message={t("download_executive_tooltip") || "Export the executive summary into PDF report."}>
                  <PDFExportButton
                    className="pdf-export-button"
                    businessName={businessData.name}
                    onToastMessage={showToastMessage}
                    exportType="executive"
                  />
                </CustomTooltip>
              )}
            </div>
          </div>

          {isModalOpen('mobileMenu') && (
            <div className="mobile-menu-overlay" onClick={() => closeModal('mobileMenu')}>
              <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <h5>{t("Navigation")}</h5>
                  <button className="close-menu" onClick={() => closeModal('mobileMenu')}>
                    <X size={24} />
                  </button>
                </div>
                <div className="mobile-nav-groups">
                  <div className="mobile-nav-group">
                    <div className="mobile-nav-group-header">{t("Insights & Recommendations")}</div>

                    <div className="mobile-nav-sub-group">
                      <div className="mobile-nav-sub-group-header">{t("Basic")}</div>
                      {hasPmfAccess && (
                        <button
                          className={`mobile-menu-item ${activeTab === "executive" ? "active" : ""}`}
                          onClick={() => { handleExecutiveTabClick(); closeModal('mobileMenu'); }}
                        >
                          <LayoutDashboard size={18} />
                          <span>{t("Executive Summary")}</span>
                        </button>
                      )}
                    </div>

                    <div className="mobile-nav-sub-group mt-3">
                      {(hasInsightAccess || hasStrategicAccess) && (
                        <>
                          <div className="mobile-nav-sub-group-header">{t("Advanced")}</div>
                          <button
                            className={`mobile-menu-item ${activeTab === "advanced" ? "active" : ""}`}
                            onClick={() => { handleBriefTabClick(); closeModal('mobileMenu'); }}
                          >
                            <HelpCircle size={18} />
                            <span>{t("Answers/Brief")}</span>
                          </button>
                        </>
                      )}
                      {hasInsightAccess && (
                        <button
                          className={`mobile-menu-item ${activeTab === "insights" ? "active" : ""}`}
                          onClick={() => { handleAnalysisTabClick(); closeModal('mobileMenu'); }}
                        >
                          <TrendingUp size={18} />
                          <span>{t("Insights")}</span>
                        </button>
                      )}
                      {hasStrategicAccess && (
                        <button
                          className={`mobile-menu-item ${activeTab === "strategic" ? "active" : ""}`}
                          onClick={() => { handleStrategicTabClick(); closeModal('mobileMenu'); }}
                        >
                          <Target size={18} />
                          <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mobile-nav-group mt-4">
                    <div className="mobile-nav-group-header">{t("Execution")}</div>
                    {hasPmfAccess && (
                      <button
                        className={`mobile-menu-item ${activeTab === "priorities" ? "active" : ""}`}
                        onClick={() => { setActiveTab("priorities"); closeModal('mobileMenu'); }}
                      >
                        <ListTodo size={18} />
                        <span>{t("Priorities")}</span>
                      </button>
                    )}
                    {showProjectsTab && hasProjectAccess && (
                      <div className="mobile-nav-sub-group mt-3">
                        <div className="mobile-nav-sub-group-header">{t("Projects")}</div>
                        <button
                          className={`mobile-menu-item ${activeTab === 'projects' && useProjectStore.getState().viewMode === 'projects' ? 'active' : ''}`}
                          onClick={() => {
                            useProjectStore.getState().setViewMode('projects');
                            setActiveTab('projects');
                            closeModal('mobileMenu');
                          }}
                        >
                          <Briefcase size={18} />
                          <span>{t("Projects_View")}</span>
                        </button>

                        <button
                          className={`mobile-menu-item ${activeTab === 'ranking' ? 'active' : ''}`}
                          onClick={() => {
                            useProjectStore.getState().setViewMode('ranking');
                            useProjectStore.getState().clearCache(selectedBusinessId);
                            if (activeTab === 'ranking') {
                              useProjectStore.getState().checkAllAccess(selectedBusinessId);
                              useProjectStore.getState().fetchTeamRankings(selectedBusinessId);
                            } else {
                              setActiveTab('ranking');
                            }
                            closeModal('mobileMenu');
                          }}
                        >
                          <BarChart4 size={18} />
                          <span>{t("Ranking")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>

        <div className={`info-panel ${isMobile ? (['advanced', 'insights', 'strategic', 'projects', 'ranking', 'priorities', 'aha', 'executive'].includes(activeTab) ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  <div className="desktop-tabs" ref={navDropdownRef}>
                    <div className="desktop-tabs-main">
                      <div className="business-header-container">
                        <button className="back-button" onClick={handleBackFromAnalysis} aria-label="Go Back">
                          <ArrowLeft size={18} />
                          <span className="breadcrumb-back">{t("backToDashboard_B3") || "Back to Dashboard"}</span>
                        </button>
                        {selectedBusinessName && (
                          <div className="business-breadcrumb">
                            <span className="breadcrumb-separator">/</span>
                            <span className="business-header-name">{selectedBusinessName}</span>
                          </div>
                        )}
                      </div>

                      <div className="desktop-nav-main">
                        {/* Insights & Recommendations Dropdown */}
                        <div className={`nav-dropdown-wrapper ${activeNavDropdown === 'insights' ? 'open' : ''}`}>
                          <button
                            className={`nav-dropdown-trigger ${['executive', 'advanced', 'insights', 'strategic'].includes(activeTab) ? 'active' : ''}`}
                            onClick={() => setActiveNavDropdown(activeNavDropdown === 'insights' ? null : 'insights')}
                          >
                            {/* Dynamically show active tab target name or category name */}
                            {(() => {
                              if (activeTab === "executive") return t("Executive Summary");
                              if (activeTab === "advanced") return t("Answers/Brief");
                              if (activeTab === "insights") return t("Insights");
                              if (activeTab === "strategic") return t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C.";
                              return t("Insights & Recommendations");
                            })()}
                            <ChevronDown size={14} className={`chevron-icon ${activeNavDropdown === 'insights' ? 'rotated' : ''}`} />
                          </button>
                          {activeNavDropdown === 'insights' && (
                            <div className={`nav-dropdown-menu ${!(hasPmfAccess || (showProjectsTab && hasProjectAccess)) ? 'align-right' : ''}`}>
                              <div className="dropdown-main-header">{t("Insights & Recommendations")}</div>
                              {hasPmfAccess && (
                                <>
                                  <div className="dropdown-section-label">{t("Basic")}</div>
                                  <button
                                    className={`dropdown-item ${activeTab === 'executive' ? 'active' : ''}`}
                                    onClick={() => { handleExecutiveTabClick(); setActiveNavDropdown(null); }}
                                  >
                                    <LayoutDashboard size={14} />
                                    <span>{t("Executive Summary")}</span>
                                  </button>
                                </>
                              )}

                              <div className="dropdown-section-label mt-2">{t("Advanced")}</div>
                              <button
                                className={`dropdown-item ${activeTab === 'advanced' ? 'active' : ''}`}
                                onClick={() => { handleBriefTabClick(); setActiveNavDropdown(null); }}
                              >
                                <HelpCircle size={14} />
                                <span>{t("Answers/Brief")}</span>
                              </button>
                              {(hasInsightAccess || hasStrategicAccess) && (
                                <>
                                  <div className="dropdown-section-label mt-2">{t("Advanced")}</div>
                                  <button 
                                    className={`dropdown-item ${activeTab === 'advanced' ? 'active' : ''}`} 
                                    onClick={() => { handleBriefTabClick(); setActiveNavDropdown(null); }}
                                  >
                                    <HelpCircle size={14} />
                                    <span>{t("Answers/Brief")}</span>
                                  </button>
                                </>
                              )}
                              {hasInsightAccess && (
                                <button
                                  className={`dropdown-item ${activeTab === 'insights' ? 'active' : ''}`}
                                  onClick={() => { setActiveTab('insights'); setActiveNavDropdown(null); }}
                                >
                                  <TrendingUp size={14} />
                                  <span>{t("Insights")}</span>
                                </button>
                              )}
                              {hasStrategicAccess && (
                                <button
                                  className={`dropdown-item ${activeTab === 'strategic' ? 'active' : ''}`}
                                  onClick={() => { setActiveTab('strategic'); setActiveNavDropdown(null); }}
                                >
                                  <Target size={14} />
                                  <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Execution Dropdown */}
                        {(hasPmfAccess || (showProjectsTab && hasProjectAccess)) && (
                          <div className={`nav-dropdown-wrapper ${activeNavDropdown === 'execution' ? 'open' : ''}`}>
                            <button
                              className={`nav-dropdown-trigger ${['priorities', 'projects'].includes(activeTab) ? 'active' : ''}`}
                            <button 
                              className={`nav-dropdown-trigger ${['priorities', 'projects', 'ranking'].includes(activeTab) ? 'active' : ''}`}
                              onClick={() => setActiveNavDropdown(activeNavDropdown === 'execution' ? null : 'execution')}
                            >
                              {/* Dynamically show active tab target name or category name */}
                              {(() => {
                                if (activeTab === "priorities") return t("Priorities");
                                if (activeTab === "projects" || activeTab === "ranking") {
                                  return activeTab === "ranking" ? t("Ranking") : t("Projects");
                                }
                                return t("Execution");
                              })()}
                              <ChevronDown size={14} className={`chevron-icon ${activeNavDropdown === 'execution' ? 'rotated' : ''}`} />
                            </button>
                            {activeNavDropdown === 'execution' && (
                              <div className="nav-dropdown-menu align-right">
                                <div className="dropdown-main-header">{t("Execution")}</div>
                                {hasPmfAccess && (
                                  <button
                                    className={`dropdown-item ${activeTab === 'priorities' ? 'active' : ''}`}
                                    onClick={() => { handlePrioritiesTabClick(); setActiveNavDropdown(null); }}
                                  >
                                    <ListTodo size={14} />
                                    <span>{t("Priorities")}</span>
                                  </button>
                                )}
                                {showProjectsTab && hasProjectAccess && (
                                  <>
                                    <div className="dropdown-section-label">{t("Projects")}</div>
                                    <button
                                      className={`dropdown-item ${activeTab === 'projects' && useProjectStore.getState().viewMode === 'projects' ? 'active' : ''}`}
                                  <button 
                                      className={`dropdown-item ${activeTab === 'projects' ? 'active' : ''}`} 
                                      onClick={() => {
                                        useProjectStore.getState().setViewMode('projects');
                                        setActiveTab('projects');
                                        setActiveNavDropdown(null);
                                      }}
                                    >
                                      <Briefcase size={14} />
                                      <span>{t("Projects_View")}</span>
                                    </button>

                                    <button
                                      className={`dropdown-item ${activeTab === 'projects' && useProjectStore.getState().viewMode === 'ranking' ? 'active' : ''}`}
                                    
                                    <button 
                                      className={`dropdown-item ${activeTab === 'ranking' ? 'active' : ''}`} 
                                      onClick={() => {
                                        useProjectStore.getState().setViewMode('ranking');
                                        setActiveTab('ranking');
                                        setActiveNavDropdown(null);
                                      }}
                                    >
                                      <BarChart4 size={14} />
                                      <span>{t("Ranking")}</span>
                                    </button>
                                  </>
                                )}
                              </div>
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
                            <CustomTooltip align="right" message={t("regenerate_all_tooltip") || "Re-generate all insights."}>
                              <button
                                onClick={() => canRegenerate && handleRegenerateAllAnalysis({ includeFinancial: hasUploadedDocument })}
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
                            <CustomTooltip align="right" message={t("regenerate_strategic_tooltip") || "Re-generate the S.T.R.A.T.E.G.I.C. analysis."}>
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

                      {activeTab === "executive" && (
                        <CustomTooltip align="right" message={t("download_executive_tooltip") || "Export the executive summary into PDF report."}>
                          <PDFExportButton
                            className="pdf-export-button"
                            businessName={businessData.name}
                            onToastMessage={showToastMessage}
                            exportType="executive"
                          />
                        </CustomTooltip>
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
                          businessId={selectedBusinessId}
                          onStartOnboarding={() => openModal('pmfOnboarding')}
                          refreshTrigger={pmfRefreshTrigger}
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
                      {activeTab === "insights" && hasInsightAccess &&
                        <AnalysisContentManager
                          phaseManager={phaseManager}
                          apiLoadingStates={storeLoadingStates}
                          expandedCards={expandedCards}
                          setExpandedCards={setExpandedCards}
                          collapsedCategories={collapsedCategories}
                          setCollapsedCategories={setCollapsedCategories}
                          highlightedCard={highlightedCard}
                          selectedBusinessId={selectedBusinessId}
                          handleRedirectToBrief={handleRedirectToBrief}
                          showToastMessage={showToastMessage}
                          apiService={apiService}
                          triggerConfirmation={triggerConfirmation}
                          canRegenerate={canShowRegenerateButtons}
                          hasInsightAccess={hasInsightAccess}
                          swotRef={swotRef}
                          purchaseCriteriaRef={purchaseCriteriaRef}
                          loyaltyNpsRef={loyaltyNpsRef}
                          portersRef={portersRef}
                          pestelRef={pestelRef}
                          fullSwotRef={fullSwotRef}
                          competitiveAdvantageRef={competitiveAdvantageRef}
                          expandedCapabilityRef={expandedCapabilityRef}
                          strategicRadarRef={strategicRadarRef}
                          productivityRef={productivityRef}
                          maturityScoreRef={maturityScoreRef}
                          profitabilityRef={profitabilityRef}
                          growthTrackerRef={growthTrackerRef}
                          liquidityEfficiencyRef={liquidityEfficiencyRef}
                          investmentPerformanceRef={investmentPerformanceRef}
                          leverageRiskRef={leverageRiskRef}
                          competitiveLandscapeRef={competitiveLandscapeRef}
                          coreAdjacencyRef={coreAdjacencyRef}
                          questionsLoaded={questionsLoaded}
                        />}
                      {activeTab === "strategic" && hasStrategicAccess && (
                        <div className="strategic-section">
                          <StrategicAnalysis
                            onRegenerate={handleStrategicAnalysisRegenerate}
                            isRegenerating={isTypeRegenerating('strategic') || isAnalysisRegenerating}
                            canRegenerate={canShowRegenerateButtons && strategicData && !isAnalysisRegenerating && unlockedFeatures.analysis}
                            selectedBusinessId={selectedBusinessId}
                            phaseManager={phaseManager}
                            saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                            hideDownload={false}
                            onRedirectToBrief={handleRedirectToBrief}
                            isExpanded={true}
                            onKickstartProjects={() => setActiveTab("projects")}
                            hasProjectsTab={showProjectsTab}
                            onToastMessage={showToastMessage}
                            hasStrategicAccess={hasStrategicAccess}
                            questionsLoaded={questionsLoaded}
                          />
                        </div>
                      )}
                      {activeTab === "projects" && hasProjectAccess && (
                        <ProjectsSection
                          onProjectCountChange={handleProjectCountChange}
                          companyAdminIds={companyAdminIds}
                          isArchived={isArchived}
                        />
                      )}
                      {activeTab === "ranking" && hasProjectAccess && (
                        <RankingSection
                          isArchived={isArchived}
                          companyAdminIds={companyAdminIds}
                          setActiveTab={setActiveTab}
                        />
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
                      <button
                        className={`desktop-tab ${activeTab === "advanced" ? "active" : ""}`}
                        onClick={handleBriefTabClick}
                      >
                        <HelpCircle size={16} />
                        <span>{t("Answers/Brief")}</span>
                      </button>
                      {hasInsightAccess && (
                        <button className={`desktop-tab ${activeTab === "insights" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
                          <TrendingUp size={16} />
                          <span>{t("Insights")}</span>
                        </button>
                      )}
                      {hasStrategicAccess && (
                        <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
                          <Target size={16} />
                          <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
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
                        <button className={`desktop-tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>
                          <Briefcase size={16} />
                          <span>{t("Projects")}</span>
                        </button>
                      )}
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
                        {hasStrategicAccess && (
                          <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
                            <Target size={16} />
                            <span>{t("STRATEGIC_LABEL") || "S.T.R.A.T.E.G.I.C."}</span>
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
                          <button className={`desktop-tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>
                            <Briefcase size={16} />
                            <span>{t("Projects")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeTab === "insights" && unlockedFeatures.analysis && (
                    <div className="desktop-tabs-buttons">
                      {canShowRegenerateButtons && hasAnalysisData && (
                        <CustomTooltip align="right" message={t("regenerate_all_tooltip") || "Re-generate all insights."}>
                          <button
                            onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
                            disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate}
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
                      />
                    </div>
                  )}
                  {activeTab === "aha" && (
                    <PMFInsightsTab
                      selectedBusinessId={selectedBusinessId}
                      refreshTrigger={pmfRefreshTrigger}
                      onStartOnboarding={() => setShowPMFOnboarding(true)}
                    />
                  )}
                  {hasPmfAccess && activeTab === "executive" && (
                    <ExecutiveSummary
                      businessId={selectedBusinessId}
                      onStartOnboarding={() => setShowPMFOnboarding(true)}
                      refreshTrigger={pmfRefreshTrigger}
                    />
                  )}
                  {activeTab === "insights" && hasInsightAccess && (
                    <div className="analysis-section">
                      <div className="analysis-content">
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons}
                          questionsLoaded={questionsLoaded} />
                      </div>
                    </div>
                  )}
                  {activeTab === "strategic" && hasStrategicAccess && (
                    <div className="strategic-section">
                      <StrategicAnalysis
                        questions={questions}
                        userAnswers={userAnswers}
                        businessName={businessData.name}
                        onRegenerate={handleStrategicAnalysisRegenerate}
                        isRegenerating={isStrategicRegenerating || isAnalysisRegenerating}
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
                        hasProjectsTab={showProjectsTab}
                        questionsLoaded={questionsLoaded}
                      />
                    </div>
                  )}
                  {activeTab === "projects" && hasProjectAccess && (
                    <div className="projects-container">
                      <ProjectsSection
                        onProjectCountChange={handleProjectCountChange}
                        companyAdminIds={companyAdminIds}
                        isArchived={isArchived}
                      />
                    </div>
                  )}
                  {hasPmfAccess && activeTab === "priorities" && (
                    <PrioritiesProjects
                      selectedBusinessId={selectedBusinessId}
                      companyAdminIds={companyAdminIds}
                      onSuccess={handleKickstartSuccess}
                      onStayOnPriorities={handleStayOnPriorities}
                      onToastMessage={showToastMessage}
                      onStartOnboarding={() => setShowPMFOnboarding(true)}
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
                    />
                  </div>
                )}
                {hasPmfAccess && activeTab === "aha" && (
                  <PMFInsightsTab
                    selectedBusinessId={selectedBusinessId}
                    refreshTrigger={pmfRefreshTrigger}
                    onStartOnboarding={() => setShowPMFOnboarding(true)}
                  />
                )}
                {hasPmfAccess && activeTab === "executive" && (
                  <ExecutiveSummary
                    businessId={selectedBusinessId}
                    onStartOnboarding={() => setShowPMFOnboarding(true)}
                    refreshTrigger={pmfRefreshTrigger}
                  />
                )}
                {activeTab === "insights" && hasInsightAccess && (
                  <div className="analysis-section">
                    <div className="analysis-content">
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons}
                          questionsLoaded={questionsLoaded} />
                    </div>
                  </div>
                )}
                {activeTab === "strategic" && hasStrategicAccess && (
                  <div className="strategic-section">
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
                      onKickstartProjects={() => setActiveTab("projects")}
                      hasProjectsTab={showProjectsTab}
                      questionsLoaded={questionsLoaded}
                    />
                  </div>
                )}
                {activeTab === "projects" && hasProjectAccess && (
                  <ProjectsSection
                    onProjectCountChange={handleProjectCountChange}
                    companyAdminIds={companyAdminIds}
                    isArchived={isArchived}
                  />
                )}
                {activeTab === "ranking" && hasProjectAccess && (
                  <RankingSection
                    isArchived={isArchived}
                    companyAdminIds={companyAdminIds}
                  />
                )}
                {hasPmfAccess && activeTab === "priorities" && (
                  <PrioritiesProjects
                    selectedBusinessId={selectedBusinessId}
                    companyAdminIds={companyAdminIds}
                    onSuccess={handleKickstartSuccess}
                    onStayOnPriorities={handleStayOnPriorities}
                    onToastMessage={showToastMessage}
                    onStartOnboarding={() => setShowPMFOnboarding(true)}
                    refreshTrigger={pmfRefreshTrigger}
                  />
                )}
          </div>
        )}
      </div>
    </div>
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
            setActiveTab("executive");
            setPmfRefreshTrigger(prev => prev + 1);
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

      <PlanLimitModal
        show={isModalOpen('noFeatureAccess')}
        onHide={() => closeModal('noFeatureAccess')}
        title={t('no_access_modal_title')}
        message={accessModalMessage}
        subMessage={accessModalSubMessage}
        isAdmin={['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase())}
      />
    </div>
  );
};

export default BusinessSetupPage;
