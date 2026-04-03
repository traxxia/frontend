import React, { useEffect, useRef, useState } from "react";
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
  Layers,
  MessageSquare
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PhaseManager from "../components/PhaseManager";
import PhaseUnlockToast from "../components/PhaseUnlockToast";
import AnalysisContentManager from "../components/AnalysisContentManager";
import { useBusinessSetup } from '../hooks/useBusinessSetup';
import { extractBusinessName } from '../utils/businessHelpers';
import PDFExportButton from "../components/PDFExportButton";
import { AnalysisApiService } from '../services/analysisApiService';
import "../styles/businesspage.css";
import "../styles/business.css";
import { useStreamingManager } from '../components/StreamingManager';
import ProjectsSection from "../components/ProjectsSection";
import PMFInsightsTab from "../components/PMFInsightsTab";
import ExecutiveSummary from "../components/ExecutiveSummary";
import PrioritiesProjects from "../components/PrioritiesProjects";
import UpgradeModal from "../components/UpgradeModal";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import { answerService } from "../services/answerService";
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";
import { getUserLimits } from '../utils/authUtils';
import CustomTooltip from "../components/CustomTooltip";

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

// Module-level cache to deduplicate project requests across re-renders
const projectRequestCache = new Map();

const BusinessSetupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { pmf: hasPmfAccess, insight: hasInsightAccess, strategic: hasStrategicAccess, project: hasProjectAccess } = getUserLimits();

  // State management for business context
  const [currentBusiness, setCurrentBusiness] = useState(location.state?.business || null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(() => {
    const id = location.state?.business?._id || sessionStorage.getItem('activeBusinessId');
    return id === "null" ? null : id;
  });

  // Keep state and sessionStorage in sync
  useEffect(() => {
    if (selectedBusinessId) {
      sessionStorage.setItem('activeBusinessId', selectedBusinessId);
    } else {
      const storedId = sessionStorage.getItem('activeBusinessId');
      if (storedId && storedId !== "null") {
        console.log("BusinessSetupPage: Recovering ID from storage:", storedId);
        setSelectedBusinessId(storedId);
      }
    }
  }, [selectedBusinessId]);
  const [selectedBusinessName, setSelectedBusinessName] = useState(location.state?.business?.business_name || "");
  const [companyAdminIds, setCompanyAdminIds] = useState(location.state?.business?.company_admin_id || []);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const [apiLoadingStates, setApiLoadingStates] = useState({});
  const [documentInfo, setDocumentInfo] = useState(null);
  const [phaseAnalysisArray, setPhaseAnalysisArray] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState(
    new Set(['current-strategy', 'costs-financial', 'context-industry', 'customer', 'capabilities', 'competition'])
  );

  const getLoggedInRole = () => {
    return (
      sessionStorage.getItem("role") ||
      sessionStorage.getItem("userRole") ||
      ""
    ).toLowerCase();
  };

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userPlan = sessionStorage.getItem("userPlan");
  const loggedInRole = getLoggedInRole();
  const [showPMFOnboarding, setShowPMFOnboarding] = useState(false);
  const canRegenerate = !["viewer"].includes(loggedInRole);
  const [businessStatus, setBusinessStatus] = useState(currentBusiness?.status || "");
  const isLaunchedStatus = businessStatus === "launched";
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [shouldScrollToUpload, setShouldScrollToUpload] = useState(false);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState(t("Go_to_Section"));
  const streamingManager = useStreamingManager();
  const isBusinessFetching = useRef(false);
  const isPmfFetching = useRef(false);
  const [showProjectsTab, setShowProjectsTab] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pmfRefreshTrigger, setPmfRefreshTrigger] = useState(0);
  const [answerIds, setAnswerIds] = useState({}); // Mapping of question_id to answer document _id
  const [isPmfOnboardingComplete, setIsPmfOnboardingComplete] = useState(true);

  // hasInsightAccess and hasStrategicAccess are now derived from getUserLimits() above (line 79)

  const setApiLoading = (apiEndpoint, isLoading) => {
    setApiLoadingStates(prev => ({ ...prev, [apiEndpoint]: isLoading }));
  };

  const apiService = new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  );

  // Write nav state synchronously before useBusinessSetup so its useState() initializer
  // can read the correct initial tab on first render
  const _navInitialTab = location.state?.initialTab;
  if (_navInitialTab) {
    window.__businessPageNavState = { initialTab: _navInitialTab };
  }

  const state = useBusinessSetup(currentBusiness, selectedBusinessId);
  const {
    activeTab, setActiveTab, isMobile, setIsMobile, isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding, questions, setQuestions, questionsLoaded, setQuestionsLoaded,
    userAnswers, setUserAnswers, completedQuestions, setCompletedQuestions,
    businessData, setBusinessData, hasAnalysisData, setHasAnalysisData,
    isAnalysisRegenerating, setIsAnalysisRegenerating, showToast, setShowToast,
    swotAnalysisResult, setSwotAnalysisResult, purchaseCriteriaData, setPurchaseCriteriaData,
    loyaltyNPSData, setLoyaltyNPSData, strategicData, setStrategicData,
    portersData, setPortersData, pestelData, setPestelData,
    fullSwotData, setFullSwotData, competitiveAdvantageData, setCompetitiveAdvantageData,
    expandedCapabilityData, setExpandedCapabilityData, strategicRadarData, setStrategicRadarData,
    productivityData, setProductivityData, maturityData, setMaturityData,
    profitabilityData, setProfitabilityData, growthTrackerData, setGrowthTrackerData,
    liquidityEfficiencyData, setLiquidityEfficiencyData,
    investmentPerformanceData, setInvestmentPerformanceData,
    leverageRiskData, setLeverageRiskData,
    competitiveLandscapeData, setCompetitiveLandscapeData,
    coreAdjacencyData, setCoreAdjacencyData,
    isSwotAnalysisRegenerating, isPurchaseCriteriaRegenerating,
    isLoyaltyNPSRegenerating, isStrategicRegenerating, setIsStrategicRegenerating,
    isPortersRegenerating, isPestelRegenerating,
    isFullSwotRegenerating, isCompetitiveAdvantageRegenerating,
    isExpandedCapabilityRegenerating, isStrategicRadarRegenerating,
    isProductivityRegenerating, isMaturityRegenerating,
    isProfitabilityAnalysisRegenerating, setIsProfitabilityAnalysisRegenerating,
    isGrowthTrackerRegenerating, setIsGrowthTrackerRegenerating,
    isLiquidityEfficiencyRegenerating, setIsLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, setIsInvestmentPerformanceRegenerating,
    isLeverageRiskRegenerating, setIsLeverageRiskRegenerating,
    isCompetitiveLandscapeRegenerating,
    isCoreAdjacencyRegenerating, highlightedMissingQuestions, setHighlightedMissingQuestions,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, dropdownRef, isRegeneratingRef,
    portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef,
    productivityRef, maturityScoreRef, strategicRadarRef, expandedCapabilityRef,
    profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef, competitiveLandscapeRef, coreAdjacencyRef,
    showDropdown, setShowDropdown
  } = state;

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

  // Set initial tab from URL query param (?tab=executive) or navigation state.
  // URL param takes priority so page refresh / shared URLs restore the correct tab.
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const initialTab = urlTab || location.state?.initialTab;

    // Helper to determine the best default tab based on plan limits
    const getDefaultTab = () => {
      if (hasPmfAccess) return "executive";
      if (hasProjectAccess) return "projects";
      return "advanced";
    };

    if (initialTab) {
      // Check if user has access to the requested initial tab
      const isPmfTab = ["executive", "priorities"].includes(initialTab);
      const isProjectTab = initialTab === "projects";
      
      if ((isPmfTab && !hasPmfAccess) || (isProjectTab && !hasProjectAccess)) {
        setActiveTab(getDefaultTab());
      } else {
        setActiveTab(initialTab);
      }
    } else {
      setActiveTab(getDefaultTab());
    }

    // Clean up the temporary window flag used by useBusinessSetup's initializer
    delete window.__businessPageNavState;
    // Always expand the analysis panel (no chat section)
    if (window.innerWidth > 768) {
      setIsAnalysisExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // If no ID at all, we might need to go back to dashboard
        console.error("No business ID found for context.");
        return;
      }

      // Store ID for future refreshes
      sessionStorage.setItem('activeBusinessId', selectedBusinessId);

      // If we don't have the full business object, fetch it
      if (!currentBusiness) {
        // Skip fetch if we are on Priorities tab and already have basic info or if tab is projects (as requested for optimization)
        if ((activeTab === 'priorities' || activeTab === 'projects') && selectedBusinessName && selectedBusinessName !== "") {
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
          const businessDataResult = await apiService.getBusiness(selectedBusinessId);
          if (businessDataResult) {
            setCurrentBusiness(businessDataResult);
            setSelectedBusinessName(businessDataResult.business_name);
            setCompanyAdminIds(businessDataResult.company_admin_id || []);
            setBusinessStatus(businessDataResult.status || "");
          }
        } catch (error) {
          console.error("Failed to recover business context:", error);
        } finally {
          isBusinessFetching.current = false;
        }
      }
    };

    recoverBusinessContext();
  }, [selectedBusinessId, currentBusiness]); // Minimal dependencies to prevent redundant calls on tab switch

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
  }, [selectedBusinessId, pmfRefreshTrigger]);

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
  // Only needed for tabs that use the question/answer/analysis workflow
  useEffect(() => {
    const tabsNeedingQuestions = ['advanced', 'insights', 'strategic'];
    if (!tabsNeedingQuestions.includes(activeTab)) {
      // Mark questionsLoaded so the UI doesn't stay blank on AHA/executive/priorities tabs
      if (!questionsLoaded) setQuestionsLoaded(true);
      return;
    }

    const loadQuestions = async () => {
      if (!selectedBusinessId) return;
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        // Use the enhanced Answers API universally for all tabs to get questions and answers
        const responseData = await answerService.getAnswersByBusiness(selectedBusinessId);

        if (responseData) {
          // 1. Handle Document Info
          const documentExists = responseData.document_info?.has_document === true;
          setHasUploadedDocument(documentExists);
          
          if (responseData.document_info && responseData.document_info.has_document) {
            // Enhanced API returns document info directly
            setDocumentInfo(responseData.document_info);
          } else {
            // Retain legacy financial-document fetch as a fallback, as requested
            try {
              const docResponse = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (docResponse.ok) {
                const docData = await docResponse.json();
                setDocumentInfo(docData.has_document && docData.document ? docData.document : { has_document: false });
              } else {
                setDocumentInfo({ has_document: false });
              }
            } catch (docError) {
              console.error('Error calling financial-document API:', docError);
              setDocumentInfo({ has_document: false });
            }
          }

          // 2. Handle Questions and Answers mapping universally
          if (responseData.questions?.length > 0) {
            setQuestions(responseData.questions);
            
            const answersMap = {};
            const answerIdsMap = {};
            const completedSet = new Set();
            
            // New API returns answers in 'data' array
            responseData.data?.forEach(ans => {
              if (ans.question_id && ans.answer) {
                const qIdStr = String(ans.question_id);
                answersMap[qIdStr] = ans.answer;
                answerIdsMap[qIdStr] = ans._id;
                completedSet.add(qIdStr);
              }
            });
            
            if (Object.keys(answersMap).length > 0) {
              setUserAnswers(prev => ({ ...prev, ...answersMap }));
              setAnswerIds(answerIdsMap);
              setCompletedQuestions(prev => new Set([...prev, ...completedSet]));
            }
          }
        }
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setQuestionsLoaded(true);
      }
    };

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessId, API_BASE_URL, activeTab]);

  useEffect(() => {
    setHasUploadedDocument(!!uploadedFileForAnalysis);
  }, [uploadedFileForAnalysis]);

  const showToastMessage = (message, type = "success", options = {}) => {
    const { duration = 4000 } = options;
    setShowToast({ show: true, message, type });

    if (duration > 0) {
      setTimeout(() => {
        setShowToast({ show: false, message: "", type: "success" });
      }, duration);
    }
  };

  // Initialize Projects tab visibility from sessionStorage (scoped per business)
  useEffect(() => {
    if (!selectedBusinessId) return;
    try {
      const stored = sessionStorage.getItem(`showProjectsTab_${selectedBusinessId}`);
      // Only restore the tab if the user has project access on their current plan
      if (stored === 'true' && hasProjectAccess) {
        setShowProjectsTab(true);
      }
      // Set active business ID for AI Assistant fallback
      sessionStorage.setItem("activeBusinessId", selectedBusinessId);
    } catch { }
  }, [selectedBusinessId, hasProjectAccess]);

  // Ensure Projects tab button appears once projects is active (only if user has project access)
  useEffect(() => {
    if (activeTab === 'projects' && !showProjectsTab && hasProjectAccess) {
      setShowProjectsTab(true);
      try {
        if (selectedBusinessId) {
          sessionStorage.setItem(`showProjectsTab_${selectedBusinessId}`, 'true');
        }
      } catch { }
    }
  }, [activeTab, showProjectsTab, selectedBusinessId, hasProjectAccess]);

  // Automatically show Projects tab if this business already has projects
  // Skip this check when on the projects tab itself (handled by ProjectsSection) or if already visible
  useEffect(() => {
    if (showProjectsTab || !selectedBusinessId || activeTab === 'projects') return;

    const fetchProjectsForBusiness = async () => {
      if (!selectedBusinessId) return;

      const cacheKey = `projects-${selectedBusinessId}`;
      if (projectRequestCache.has(cacheKey)) {
        const projects = await projectRequestCache.get(cacheKey);
        const hasProjects = projects.length > 0;
        setShowProjectsTab(hasProjects && hasProjectAccess);
        return;
      }

      const fetchPromise = (async () => {
        try {
          const token = sessionStorage.getItem('token');
          if (!token) return [];

          const res = await axios.get(
            `${API_BASE_URL}/api/projects`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              },
              params: {
                business_id: selectedBusinessId
              }
            }
          );

          const projects = res.data?.projects || [];
          const hasProjects = projects.length > 0;
          
          // SIDE EFFECT: Still need to update tab visibility for the initiating instance
          setShowProjectsTab(hasProjects && hasProjectAccess);
          
          try {
            if (selectedBusinessId) {
              const key = `showProjectsTab_${selectedBusinessId}`;
              if (hasProjects) {
                sessionStorage.setItem(key, 'true');
              } else {
                sessionStorage.removeItem(key);
              }
            }
          } catch { }
          
          return projects;
        } catch (err) {
          console.error('Failed to check existing projects for business:', err);
          return [];
        }
      })();

      projectRequestCache.set(cacheKey, fetchPromise);
      await fetchPromise;
      // After promise settles, we might want to keep it or clear it.
      // Keeping it is fine as it acts as a per-session cache.
    };

    fetchProjectsForBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessId, API_BASE_URL]);

  //const showToastMessage = createToastMessage(setShowToast);

  const stateSetters = {
    setSwotAnalysisResult, setPurchaseCriteriaData, setLoyaltyNPSData,
    setPortersData, setPestelData, setFullSwotData, setCompetitiveAdvantageData,
    setExpandedCapabilityData, setStrategicRadarData, setProductivityData,
    setMaturityData, setProfitabilityData, setGrowthTrackerData,
    setLiquidityEfficiencyData, setInvestmentPerformanceData, setLeverageRiskData,
    setCompetitiveLandscapeData, setCoreAdjacencyData, setStrategicData,
    uploadedFile: uploadedFileForAnalysis,
  };

  const handleFileUploaded = async (file, validationResult) => {
    setUploadedFileForAnalysis(file);
    setHasUploadedDocument(true);

    try {
      showToastMessage("Generating financial analyses from your document...", "info");

      // Pass the new file directly in stateSetters to avoid stale state issues
      const stateSettersWithFile = {
        ...stateSetters,
        uploadedFile: file
      };

      await apiService.handlePhaseCompletion(
        'financial',
        questions,
        userAnswers,
        selectedBusinessId,
        stateSettersWithFile,
        showToastMessage
      );
    } catch (error) {
      console.error("Error generating financial analysis after upload:", error);
      showToastMessage("Failed to generate financial analysis from the uploaded document.", "error");
    }
  };

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

  const handleRegeneratePhase = async (phaseOverride = null, alsoRegenerateStrategic = false, ignoreGuard = false) => {
    if (isRegeneratingRef.current && !alsoRegenerateStrategic && !ignoreGuard) return;

    try {
      if (!alsoRegenerateStrategic) isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      const targetPhase = phaseOverride || getCurrentPhase();

      if (targetPhase === 'financial') {
        setIsProfitabilityAnalysisRegenerating(true);
        setIsGrowthTrackerRegenerating(true);
        setIsLiquidityEfficiencyRegenerating(true);
        setIsInvestmentPerformanceRegenerating(true);
        setIsLeverageRiskRegenerating(true);
      }

      const regenerationPromises = [];

      // Add Phase (Insight) regeneration to promises
      regenerationPromises.push(
        apiService.handlePhaseCompletion(
          targetPhase,
          questions,
          userAnswers,
          selectedBusinessId,
          stateSetters,
          showToastMessage
        )
      );

      // Add Strategic regeneration to promises if requested AND not already included in phase
      if (alsoRegenerateStrategic && targetPhase !== 'advanced') {
        regenerationPromises.push(handleStrategicAnalysisRegenerate(true));
      }

      // Execute all in parallel
      await Promise.all(regenerationPromises);
    } catch (error) {
      console.error(`Error regenerating phase:`, error);
      showToastMessage(`Failed to regenerate phase.`, "error");
    } finally {
      if (!alsoRegenerateStrategic) isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
      setIsProfitabilityAnalysisRegenerating(false);
      setIsGrowthTrackerRegenerating(false);
      setIsLiquidityEfficiencyRegenerating(false);
      setIsInvestmentPerformanceRegenerating(false);
      setIsLeverageRiskRegenerating(false);
    }
  };

  const loadExistingAnalysisData = (phaseAnalysisArray) => {
    try {
      setPhaseAnalysisArray(phaseAnalysisArray);
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

        const setterName = apiService.getStateSetterName(analysis_type);
        const setter = stateSetters[setterName];

        if (setter) {
          const data = analysis_type === 'swot'
            ? (typeof analysis_data === 'string' ? analysis_data : JSON.stringify(analysis_data))
            : analysis_data;
          setter(data);
        } else {
          console.warn(`No setter found for analysis type: ${analysis_type} (expected ${setterName})`);
        }
      });

      setHasAnalysisData(hasAnyAnalysis);
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };

  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    hasUploadedDocument, setHasUploadedDocument,
    onDocumentInfoLoad: (docInfo) => setDocumentInfo(docInfo),
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      setCompletedQuestions(completedSet);
      setUserAnswers(prev => ({ ...prev, ...answersMap }));
    },
    onCompletedPhasesUpdate: () => { },
    onAnalysisGeneration: () => handleRegeneratePhase('initial'),
    onFullSwotGeneration: () => handleRegeneratePhase('essential'),
    onGoodPhaseGeneration: () => handleRegeneratePhase('good'),
    onAdvancedPhaseGeneration: () => handleRegeneratePhase('advanced'),
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL, getAuthToken, apiService, stateSetters, showToastMessage
  });

  const handleStrategicAnalysisRegenerate = async (bypassRef = false) => {
    if (!phaseManager.canRegenerateAnalysis() || (isRegeneratingRef.current && !bypassRef)) return;

    try {
      if (!bypassRef) isRegeneratingRef.current = true;
      setIsStrategicRegenerating(true);
      showToastMessage("Regenerating Strategic Analysis...", "info");

      // Clear data and reset streaming
      setStrategicData(null);
      if (streamingManager) {
        streamingManager.resetCard('strategic-analysis');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Call API
      const result = await apiService.generateStrategicAnalysis(questions, userAnswers, selectedBusinessId);

      // Set flag to trigger streaming, then set data
      result._isFreshGeneration = true; // Add flag to result
      setStrategicData(result);

      showToastMessage("Strategic Analysis regenerated successfully!", "success");
    } catch (error) {
      console.error('Error regenerating Strategic Analysis:', error);
      showToastMessage("Failed to regenerate Strategic Analysis.", "error");
    } finally {
      if (!bypassRef) isRegeneratingRef.current = false;
      setIsStrategicRegenerating(false);
    }
  };

  const handleRegenerateAllAnalysis = async (options = {}) => {
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    try {
      if (options?.onlyFinancial) {
        await handleRegeneratePhase('financial', false, true);
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

      if (options?.includeFinancial && targetPhase !== 'advanced') {
        await handleRegeneratePhase('financial', false, true);
      }

      await handleRegeneratePhase(targetPhase, true, true);
    } finally {
      isRegeneratingRef.current = false;
    }
  };

  const handleNewAnswer = async (questionId, answer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
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

  const handleQuestionCompleted = async (questionId) => {
    const newCompletedSet = new Set([...completedQuestions, questionId]);
    setCompletedQuestions(newCompletedSet);
    return await phaseManager.handleQuestionCompleted(questionId);
  };

  const handleBusinessDataUpdate = (updates) => {
    setBusinessData(prev => ({ ...prev, ...updates }));
  };

  const handleAnswerUpdate = (questionId, newAnswer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: newAnswer }));
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
  }, [activeTab]); // Only run when tab changes to avoid fighting with immediate clicks

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



  const handleAhaTabClick = () => {
    const currentIdInStorage = sessionStorage.getItem('activeBusinessId');
    console.log("AHA tab clicked, business ID in state:", selectedBusinessId, "in storage:", currentIdInStorage);

    // Safety check: if state is null but storage has it, recover it
    if (!selectedBusinessId && currentIdInStorage && currentIdInStorage !== "null") {
      console.log("Recovering ID on tab click...");
      setSelectedBusinessId(currentIdInStorage);
    }

    setPmfRefreshTrigger(prev => prev + 1);
    if (isMobile) {
      setActiveTab("aha");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("aha");
      } else {
        setActiveTab("aha");
      }
    }
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

  const handleKickstartSuccess = () => {
    setShowProjectsTab(true);
    setActiveTab("projects");
    try {
      if (selectedBusinessId) {
        sessionStorage.setItem(`showProjectsTab_${selectedBusinessId}`, 'true');
      }
    } catch { }
  };

  const handleStayOnPriorities = () => {
    setShowProjectsTab(true);
    try {
      if (selectedBusinessId) {
        sessionStorage.setItem(`showProjectsTab_${selectedBusinessId}`, 'true');
      }
    } catch { }
  };


  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

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

    return categoryOptions[phase] || {};
  };

  useEffect(() => {
    setSelectedDropdownValue(t("Go_to_Section"));
  }, []);

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
    
    const fetchKey = `${selectedBusinessId}-${activeTab}`;
    if (selectedBusinessId && questionsLoaded && !fetchedAnalysisKeys.current.has(fetchKey)) {
      fetchedAnalysisKeys.current.add(fetchKey);
      setTimeout(() => phaseManager.loadExistingAnalysis(), 100);
    }
  }, [selectedBusinessId, questionsLoaded, activeTab]); // Intentionally not including phaseManager to avoid infinite loops

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
  }, [dropdownRef]);

  const totalQuestions = questions.length;
  const answeredQuestions = completedQuestions.size;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const unlockedFeatures = phaseManager.getUnlockedFeatures();
  const currentPhase = getCurrentPhase();

  const analysisProps = {
    phaseManager, apiLoadingStates, businessData, questions, userAnswers, answerIds, setAnswerIds, selectedBusinessId,
    swotAnalysisResult, purchaseCriteriaData, loyaltyNPSData, portersData, pestelData,
    fullSwotData, competitiveAdvantageData, expandedCapabilityData, strategicRadarData,
    productivityData, maturityData, profitabilityData, growthTrackerData,
    liquidityEfficiencyData, investmentPerformanceData, leverageRiskData,
    competitiveLandscapeData, coreAdjacencyData,
    isSwotAnalysisRegenerating, isPurchaseCriteriaRegenerating, isLoyaltyNPSRegenerating,
    isPortersRegenerating, isPestelRegenerating, isFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, isExpandedCapabilityRegenerating,
    isStrategicRadarRegenerating, isProductivityRegenerating, isMaturityRegenerating,
    isProfitabilityAnalysisRegenerating, isGrowthTrackerRegenerating, isLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, isLeverageRiskRegenerating,
    isCompetitiveLandscapeRegenerating, isCoreAdjacencyRegenerating,
    isAnalysisRegenerating, isStrategicRegenerating,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, portersRef, pestelRef, fullSwotRef,
    competitiveAdvantageRef, expandedCapabilityRef, strategicRadarRef, productivityRef,
    maturityScoreRef, profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef, competitiveLandscapeRef, coreAdjacencyRef,
    uploadedFileForAnalysis, handleRedirectToBrief, showToastMessage, apiService,
    createSimpleRegenerationHandler, highlightedCard, expandedCards, setExpandedCards,
    isMobile, setActiveTab,
    hasUploadedDocument, documentInfo, collapsedCategories, setCollapsedCategories,
    readOnly: false, isCardExpanded: (cardId) => expandedCards.has(cardId),
  };

  const handleProjectCountChange = (count) => {
    const hasProjects = count > 0;
    setShowProjectsTab(hasProjects);
    try {
      if (!selectedBusinessId) return;
      const key = `showProjectsTab_${selectedBusinessId}`;
      if (hasProjects) {
        sessionStorage.setItem(key, 'true');
      } else {
        sessionStorage.removeItem(key);
      }
    } catch { }
  };

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
          <div className="ms-3 d-flex gap-2">
            {!getUserLimits().project && (
              <button
                className="btn btn-warning btn-sm fw-bold border-dark"
                onClick={() => {
                  if (loggedInRole === 'company_admin' || loggedInRole === 'admin') {
                    navigate('/admin?tab=subscription');
                  } else {
                    showToastMessage("Contact admin for upgradation", "warning");
                  }
                }}
              >
                Upgrade Now
              </button>
            )}
            {getUserLimits().project && (
              <button
                className="btn btn-outline-dark btn-sm fw-bold"
                onClick={() => {
                  if (loggedInRole === 'company_admin' || loggedInRole === 'admin') {
                    setShowUpgradeModal({ mode: 'downgrade' });
                  } else {
                    showToastMessage("Contact admin for downgradation", "warning");
                  }
                }}
              >
                Downgrade
              </button>
            )}
          </div>
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

      {isMobile && questionsLoaded && (
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
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle Menu"
              >
                {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            <div className="mobile-active-tab">
              {(['executive', 'advanced', 'insights', 'strategic', 'priorities', 'projects'].includes(activeTab)) ? (
                <div className="mobile-tab-selector">
                  <div className="mobile-tab-trigger no-dropdown">
                    <span>
                      {activeTab === "executive" && t("Executive Summary")}
                      {activeTab === "priorities" && t("Priorities")}
                      {activeTab === "advanced" && t("Answers/Brief")}
                      {activeTab === "insights" && (hasPmfAccess ? t("insights") : "Insights")}
                      {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
                      {activeTab === "projects" && t("Projects")}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "aha" && t("aha")}
                  {activeTab === "executive" && t("Executive Summary")}
                  {activeTab === "priorities" && t("Priorities & Projects")}
                  {activeTab === "advanced" && t("Questions and Answers")}
                  {activeTab === "insights" && (hasPmfAccess ? t("Insights") : "Insights")}
                  {activeTab === "strategic" && (hasPmfAccess ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
                  {activeTab === "projects" && t("Projects")}
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
                        onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
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
            </div>
          </div>

          {showMobileMenu && (
            <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
              <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <h5>{t("Navigation")}</h5>
                  <button className="close-menu" onClick={() => setShowMobileMenu(false)}>
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
                          onClick={() => { handleExecutiveTabClick(); setShowMobileMenu(false); }}
                        >
                          <LayoutDashboard size={18} />
                          <span>{t("Executive Summary")}</span>
                        </button>
                      )}
                    </div>

                    <div className="mobile-nav-sub-group mt-3">
                      <div className="mobile-nav-sub-group-header">{t("Advanced")}</div>
                      <button
                        className={`mobile-menu-item ${activeTab === "advanced" ? "active" : ""}`}
                        onClick={() => { handleBriefTabClick(); setShowMobileMenu(false); }}
                      >
                        <HelpCircle size={18} />
                        <span>{t("Answers/Brief")}</span>
                      </button>
                      {hasInsightAccess && (
                        <button
                          className={`mobile-menu-item ${activeTab === "insights" ? "active" : ""}`}
                          onClick={() => { handleAnalysisTabClick(); setShowMobileMenu(false); }}
                        >
                          <TrendingUp size={18} />
                          <span>{t("Insights")}</span>
                        </button>
                      )}
                      {hasStrategicAccess && (
                        <button
                          className={`mobile-menu-item ${activeTab === "strategic" ? "active" : ""}`}
                          onClick={() => { handleStrategicTabClick(); setShowMobileMenu(false); }}
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
                        onClick={() => { setActiveTab("priorities"); setShowMobileMenu(false); }}
                      >
                        <ListTodo size={18} />
                        <span>{t("Priorities")}</span>
                      </button>
                    )}
                    {showProjectsTab && hasProjectAccess && (
                      <button
                        className={`mobile-menu-item ${activeTab === "projects" ? "active" : ""}`}
                        onClick={() => { setActiveTab("projects"); setShowMobileMenu(false); }}
                      >
                        <Briefcase size={18} />
                        <span>{t("Projects")}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>

        {questionsLoaded && (
          <div className={`info-panel ${isMobile ? (activeTab === "advanced" || activeTab === "insights" || activeTab === "strategic" || activeTab === "projects" || activeTab === "priorities" || activeTab === "aha" || activeTab === "executive" ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
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
                              onClick={() => setActiveNavDropdown(activeNavDropdown === 'execution' ? null : 'execution')}
                            >
                              {/* Dynamically show active tab target name or category name */}
                              {(() => {
                                if (activeTab === "priorities") return t("Priorities");
                                if (activeTab === "projects") return t("Projects");
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
                                  <button 
                                    className={`dropdown-item ${activeTab === 'projects' ? 'active' : ''}`} 
                                    onClick={() => { setActiveTab('projects'); setActiveNavDropdown(null); }}
                                  >
                                    <Briefcase size={14} />
                                    <span>{t("Projects")}</span>
                                  </button>
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
                                onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
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
                    </div>
                  </div>

                  {isArchived && <div className="archived-overlay" />}

                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
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
                            isAnalysisRegenerating={isAnalysisRegenerating}
                            isStrategicRegenerating={isStrategicRegenerating}
                            isFinancialRegeneratingProp={isProfitabilityAnalysisRegenerating || isGrowthTrackerRegenerating || isLiquidityEfficiencyRegenerating || isInvestmentPerformanceRegenerating || isLeverageRiskRegenerating}
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
                      {activeTab === "insights" && hasInsightAccess &&
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons}
                          hasInsightAccess={hasInsightAccess} />}
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
                            streamingManager={streamingManager}  // ADD THIS LINE
                            isExpanded={true}
                            onKickstartProjects={() => setActiveTab("projects")}
                            hasProjectsTab={showProjectsTab}
                            onToastMessage={showToastMessage}
                            hasStrategicAccess={hasStrategicAccess}
                          />
                        </div>
                      )}
                      {activeTab === "projects" && hasProjectAccess && (
                        <ProjectsSection
                          selectedBusinessId={selectedBusinessId}
                          onProjectCountChange={handleProjectCountChange}
                          onBusinessStatusChange={setBusinessStatus}
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
                    />
                  )}
                  {activeTab === "insights" && hasInsightAccess && (
                    <div className="analysis-section">
                      <div className="analysis-content">
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons} />
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
                        streamingManager={streamingManager}  // ADD THIS LINE
                        isExpanded={true}                      // ADD THIS LINE
                        hasProjectsTab={showProjectsTab}
                      />
                    </div>
                  )}
                  {activeTab === "projects" && hasProjectAccess && (
                    <div className="projects-container">
                      <ProjectsSection
                        selectedBusinessId={selectedBusinessId}
                        onProjectCountChange={handleProjectCountChange}
                        onBusinessStatusChange={setBusinessStatus}
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
                  />
                )}
                {activeTab === "insights" && hasInsightAccess && (
                  <div className="analysis-section">
                    <div className="analysis-content">
                      <AnalysisContentManager
                        {...analysisProps}
                        canRegenerate={canShowRegenerateButtons} />
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
                      streamingManager={streamingManager}  // ADD THIS LINE
                      isExpanded={true}
                      onKickstartProjects={() => setActiveTab("projects")}
                      hasProjectsTab={showProjectsTab}
                    />
                  </div>
                )}
                {activeTab === "projects" && hasProjectAccess && (
                  <ProjectsSection
                    selectedBusinessId={selectedBusinessId}
                    onProjectCountChange={handleProjectCountChange}
                    onBusinessStatusChange={setBusinessStatus}
                    companyAdminIds={companyAdminIds}
                    isArchived={isArchived}
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
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <UpgradeModal
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={() => window.location.reload()}
      />

      {hasPmfAccess && (
        <PMFOnboardingModal
          show={showPMFOnboarding}
          onHide={() => setShowPMFOnboarding(false)}
          businessId={selectedBusinessId}
          onToastMessage={showToastMessage}
          onSubmit={() => {
            setShowPMFOnboarding(false);
            setPmfRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default BusinessSetupPage;
