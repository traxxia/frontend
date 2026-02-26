import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, Loader, RefreshCw, ChevronDown, AlertTriangle, Menu, X } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';
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
  "Competitive Landscape": "competitive-landscape",
  "Core": "core-adjacency",
};

const ENABLE_PMF = process.env.REACT_APP_ENABLE_PMF === 'true';

const BusinessSetupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    new Set(['costs-financial', 'context-industry', 'customer', 'capabilities', 'competition', 'current-strategy'])
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
  const [selectedDropdownValue, setSelectedDropdownValue] = useState("Go to Section");
  const hasLoadedAnalysis = useRef(false);
  const streamingManager = useStreamingManager();
  const [showProjectsTab, setShowProjectsTab] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pmfRefreshTrigger, setPmfRefreshTrigger] = useState(0);

  const setApiLoading = (apiEndpoint, isLoading) => {
    setApiLoadingStates(prev => ({ ...prev, [apiEndpoint]: isLoading }));
  };

  const apiService = new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  );

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
    isProfitabilityRegenerating, isGrowthTrackerRegenerating,
    isLiquidityEfficiencyRegenerating, isInvestmentPerformanceRegenerating,
    isLeverageRiskRegenerating, isCompetitiveLandscapeRegenerating,
    isCoreAdjacencyRegenerating, highlightedMissingQuestions, setHighlightedMissingQuestions,
    swotRef, purchaseCriteriaRef, loyaltyNpsRef, dropdownRef, isRegeneratingRef,
    portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef,
    productivityRef, maturityScoreRef, strategicRadarRef, expandedCapabilityRef,
    profitabilityRef, growthTrackerRef, liquidityEfficiencyRef,
    investmentPerformanceRef, leverageRiskRef, competitiveLandscapeRef, coreAdjacencyRef,
    showDropdown, setShowDropdown
  } = state;

  const isArchived = (currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden') || (businessData?.access_mode === 'archived' || businessData?.access_mode === 'hidden');
  const canShowRegenerateButtons = canRegenerate && !isLaunchedStatus && !isArchived;

  // Set initial tab from navigation state (e.g. when clicking a business from the Dashboard)
  // Since chat section is removed, always expand the analysis panel
  useEffect(() => {
    const initialTab = location.state?.initialTab;
    if (ENABLE_PMF && initialTab) {
      setActiveTab(initialTab);
    } else if (ENABLE_PMF) {
      setActiveTab("aha");
    }
    // Always expand the analysis panel (no chat section)
    if (window.innerWidth > 768) {
      setIsAnalysisExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        try {
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
        }
      }
    };

    recoverBusinessContext();
  }, [selectedBusinessId, currentBusiness]);

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
  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedBusinessId) return;
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const questionsResponse = await fetch(`${API_BASE_URL}/api/questions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!questionsResponse.ok) throw new Error('Failed to load questions');

        const questionsData = await questionsResponse.json();
        const availableQuestions = questionsData.questions || [];
        setQuestions(availableQuestions);
        setQuestionsLoaded(true);

        // Also load conversation data for answers and document info
        const conversationUrl = `${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`;
        const conversationsResponse = await fetch(conversationUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          const documentExists = conversationsData.document_info?.has_document === true;
          setHasUploadedDocument(documentExists);

          // Extract answered questions from conversations
          if (conversationsData.conversations?.length > 0) {
            const answersMap = {};
            const completedSet = new Set();
            conversationsData.conversations.forEach(conv => {
              if (conv.question_id && conv.answer) {
                answersMap[conv.question_id] = conv.answer;
                if (conv.is_complete) {
                  completedSet.add(conv.question_id);
                }
              }
            });
            if (Object.keys(answersMap).length > 0) {
              setUserAnswers(prev => ({ ...prev, ...answersMap }));
              setCompletedQuestions(prev => new Set([...prev, ...completedSet]));
            }
          }
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        // Still set questionsLoaded so UI isn't blank
        setQuestionsLoaded(true);
      }
    };

    loadQuestions();
  }, [selectedBusinessId, API_BASE_URL]);

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
      if (stored === 'true') {
        setShowProjectsTab(true);
      }
      // Set active business ID for AI Assistant fallback
      sessionStorage.setItem("activeBusinessId", selectedBusinessId);
    } catch { }
  }, [selectedBusinessId]);

  // Ensure Projects tab button appears once projects is active
  useEffect(() => {
    if (activeTab === 'projects' && !showProjectsTab) {
      setShowProjectsTab(true);
      try {
        if (selectedBusinessId) {
          sessionStorage.setItem(`showProjectsTab_${selectedBusinessId}`, 'true');
        }
      } catch { }
    }
  }, [activeTab, showProjectsTab, selectedBusinessId]);

  // Automatically show Projects tab if this business already has projects
  useEffect(() => {
    const fetchProjectsForBusiness = async () => {
      if (!selectedBusinessId) return;

      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

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
        setShowProjectsTab(hasProjects);
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
      } catch (err) {
        console.error('Failed to check existing projects for business:', err);
      }
    };

    fetchProjectsForBusiness();
  }, [selectedBusinessId, API_BASE_URL]);

  //const showToastMessage = createToastMessage(setShowToast);

  const stateSetters = {
    setSwotAnalysisResult, setPurchaseCriteriaData, setLoyaltyNPSData,
    setPortersData, setPestelData, setFullSwotData, setCompetitiveAdvantageData,
    setExpandedCapabilityData, setStrategicRadarData, setProductivityData,
    setMaturityData, setProfitabilityData, setGrowthTrackerData,
    setLiquidityEfficiencyData, setInvestmentPerformanceData, setLeverageRiskData,
    setCompetitiveLandscapeData, setCoreAdjacencyData,
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

  const handleBriefTabClick = () => {
    if (!isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(true);
      setActiveTab("brief");
      setTimeout(() => setIsSliding(false), 1000);
    } else {
      setActiveTab("brief");
    }
  };

  const getCurrentPhase = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    if (unlockedFeatures.advancedPhase) return 'advanced';
    if (unlockedFeatures.goodPhase) return 'good';
    if (unlockedFeatures.fullSwot) return 'essential';
    return 'initial';
  };

  const handleRegeneratePhase = async (phaseOverride = null, alsoRegenerateStrategic = false, ignoreGuard = false) => {
    if (isRegeneratingRef.current && !alsoRegenerateStrategic && !ignoreGuard) return;

    try {
      if (!alsoRegenerateStrategic) isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      const targetPhase = phaseOverride || getCurrentPhase();

      await apiService.handlePhaseCompletion(
        targetPhase,
        questions,
        userAnswers,
        selectedBusinessId,
        stateSetters,
        showToastMessage
      );

      if (alsoRegenerateStrategic) {
        await handleStrategicAnalysisRegenerate(true);
      }
    } catch (error) {
      console.error(`Error regenerating phase:`, error);
      showToastMessage(`Failed to regenerate phase.`, "error");
    } finally {
      if (!alsoRegenerateStrategic) isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
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

      const analysisTypes = [
        'swot', 'strategic', 'fullSwot', 'competitiveAdvantage', 'expandedCapability',
        'strategicRadar', 'productivityMetrics', 'maturityScore', 'purchaseCriteria',
        'loyaltyNPS', 'porters', 'pestel', 'profitabilityAnalysis', 'growthTracker',
        'liquidityEfficiency', 'investmentPerformance', 'leverageRisk',
        'competitiveLandscape', 'coreAdjacency'
      ];

      const setterMap = analysisTypes.reduce((acc, type) => {
        const stateKey = type === 'swot' ? 'SwotAnalysisResult' : type.charAt(0).toUpperCase() + type.slice(1) + 'Data';
        const setter = stateSetters[`set${stateKey}`];
        if (setter) acc[type] = setter;
        return acc;
      }, {});

      let hasAnyAnalysis = false;
      Object.values(latestAnalysisByType).forEach(analysis => {
        const { analysis_type, analysis_data } = analysis;
        hasAnyAnalysis = true;
        const setter = setterMap[analysis_type];
        if (setter) {
          const data = analysis_type === 'swot'
            ? (typeof analysis_data === 'string' ? analysis_data : JSON.stringify(analysis_data))
            : analysis_data;
          setter(data);
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
      setActiveTab("analysis");
    } else {
      if (!isAnalysisExpanded) {
        setIsAnalysisExpanded(true);
        setActiveTab("analysis");
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

  const handleOptionClick = (option) => {
    setShowDropdown(false);
    const cardId = CARD_ID_MAP[option];

    if (cardId) {
      const categoryId = CARD_TO_CATEGORY_MAP[cardId];
      if (categoryId) {
        setCollapsedCategories(prev => {
          const newSet = new Set(prev);
          newSet.delete(categoryId);
          return newSet;
        });
      }

      setHighlightedCard(cardId);
      setExpandedCards(prev => new Set([...prev, cardId]));
      setTimeout(() => setHighlightedCard(null), 3000);
    }

    setTimeout(() => {
      const cardElement = document.getElementById(cardId);
      if (!cardElement) return;

      const getScrollParent = (el) => {
        let cur = el.parentElement;
        while (cur && cur !== document.body) {
          const style = window.getComputedStyle(cur);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll' || cur === document.scrollingElement) return cur;
          cur = cur.parentElement;
        }
        return window;
      };

      const scrollContainer = getScrollParent(cardElement);

      const headerEls = [
        document.querySelector('.traxia-navbar'),
        document.querySelector('.main-header'),
        document.querySelector('.sub-header'),
        document.querySelector('.desktop-tabs')
      ].filter(Boolean);

      const totalHeaderHeight = headerEls.reduce((sum, el) => {
        const r = el.getBoundingClientRect();
        return sum + (r.height > 0 && r.bottom > 0 ? r.height : 0);
      }, 0);

      const gap = 8;

      if (scrollContainer === window) {
        const top = cardElement.getBoundingClientRect().top + window.pageYOffset;
        const target = Math.max(0, top - totalHeaderHeight - gap);
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = cardElement.getBoundingClientRect();
        const offsetWithin = elRect.top - containerRect.top + scrollContainer.scrollTop;
        const target = Math.max(0, offsetWithin - totalHeaderHeight - gap);
        scrollContainer.scrollTo({ top: target, behavior: 'smooth' });
      }
    }, 600);
  };

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


  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    const categoryOptions = {
      initial: {
        "Context/Industry": ["Porter's Five Forces", "PESTEL Analysis"],
        "Customer": ["Purchase Criteria", "Loyalty/NPS"]
      },
      essential: {
        "Costs/Financial": ["Productivity Metrics"],
        "Context/Industry": ["Full SWOT Portfolio", "Strategic Positioning Radar", "Porter's Five Forces", "PESTEL Analysis"],
        "Customer": ["Competitive Advantage", "Purchase Criteria", "Loyalty/NPS"],
        "Capabilities": ["Capability Heatmap", "Maturity Score"],
        "Competition": ["Competitive Landscape"],
        "Current Strategy": ["Core"]
      },
      good: {
        "Costs/Financial": [
          ...(hasUploadedDocument ? [
            "Profitability Analysis", "Growth Tracker", "Liquidity & Efficiency",
            "Investment Performance", "Leverage & Risk"
          ] : []),
          "Productivity Metrics"
        ],
        "Context/Industry": ["Full SWOT Portfolio", "Strategic Positioning Radar", "Porter's Five Forces", "PESTEL Analysis"],
        "Customer": ["Competitive Advantage", "Purchase Criteria", "Loyalty/NPS"],
        "Capabilities": ["Capability Heatmap", "Maturity Score"],
        "Competition": ["Competitive Landscape"],
        "Current Strategy": ["Core"]
      },
      advanced: {
        "Costs/Financial": [
          ...(hasUploadedDocument ? [
            "Profitability Analysis", "Growth Tracker", "Liquidity & Efficiency",
            "Investment Performance", "Leverage & Risk"
          ] : []),
          "Productivity Metrics"
        ],
        "Context/Industry": ["Full SWOT Portfolio", "Strategic Positioning Radar", "Porter's Five Forces", "PESTEL Analysis"],
        "Customer": ["Competitive Advantage", "Purchase Criteria", "Loyalty/NPS"],
        "Capabilities": ["Capability Heatmap", "Maturity Score"],
        "Competition": ["Competitive Landscape"],
        "Current Strategy": ["Core"]
      }
    };

    if (!unlockedFeatures.fullSwot && categoryOptions.initial && categoryOptions.initial["Context/Industry"]) {
      categoryOptions.initial["Context/Industry"].unshift("SWOT");
    }

    return categoryOptions[phase] || {};
  };

  useEffect(() => {
    setSelectedDropdownValue(t("Go_to_Section"));
  }, []);

  useEffect(() => {
    if (selectedBusinessId && questionsLoaded && questions.length > 0 && !hasLoadedAnalysis.current) {
      hasLoadedAnalysis.current = true;
      setTimeout(() => phaseManager.loadExistingAnalysis(), 100);
    }
  }, [selectedBusinessId, questionsLoaded, questions.length, phaseManager]);

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
    phaseManager, apiLoadingStates, businessData, questions, userAnswers, selectedBusinessId,
    swotAnalysisResult, purchaseCriteriaData, loyaltyNPSData, portersData, pestelData,
    fullSwotData, competitiveAdvantageData, expandedCapabilityData, strategicRadarData,
    productivityData, maturityData, profitabilityData, growthTrackerData,
    liquidityEfficiencyData, investmentPerformanceData, leverageRiskData,
    competitiveLandscapeData, coreAdjacencyData,
    isSwotAnalysisRegenerating, isPurchaseCriteriaRegenerating, isLoyaltyNPSRegenerating,
    isPortersRegenerating, isPestelRegenerating, isFullSwotRegenerating,
    isCompetitiveAdvantageRegenerating, isExpandedCapabilityRegenerating,
    isStrategicRadarRegenerating, isProductivityRegenerating, isMaturityRegenerating,
    isProfitabilityRegenerating, isGrowthTrackerRegenerating, isLiquidityEfficiencyRegenerating,
    isInvestmentPerformanceRegenerating, isLeverageRiskRegenerating,
    isCompetitiveLandscapeRegenerating, isCoreAdjacencyRegenerating,
    isAnalysisRegenerating,
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
    <div className="business-setup-container">
      <MenuBar />

      {/* Read-Only Banner for Archived Workspaces */}
      {(currentBusiness?.access_mode === 'archived' || currentBusiness?.access_mode === 'hidden') && (
        <div className="alert alert-warning mb-0 border-0 rounded-0 text-center py-2 d-flex align-items-center justify-content-center shadow-sm" style={{ zIndex: 1000, position: 'relative' }}>
          <AlertTriangle size={18} className="me-2 text-warning" />
          <span>
            This workspace is in <strong>Read-Only</strong> mode.
            Upgrade to the Advanced plan to restore editing capabilities.
          </span>
          <div className="ms-3 d-flex gap-2">
            {userPlan?.toLowerCase() === 'essential' && (
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
            {userPlan?.toLowerCase() === 'advanced' && (
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
          <div className="mobile-menu-trigger-container">
            <button className="mobile-back-button me-2" onClick={handleBack} aria-label="Go Back">
              <ArrowLeft size={20} />
            </button>
            {selectedBusinessName && (
              <strong className="ms-1 text-truncate" style={{ maxWidth: '160px', display: 'inline-block', verticalAlign: 'middle' }}>{selectedBusinessName}</strong>
            )}
            <button
              className="mobile-menu-trigger"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              <span className="ms-2">{t("Menu")}</span>
            </button>
            <div className="active-tab-indicator ms-auto">
              {activeTab === "aha" && t("aha")}
              {activeTab === "executive" && t("Executive Summary")}
              {activeTab === "priorities" && t("Priorities & Projects")}
              {activeTab === "brief" && t("Questions and Answers")}
              {activeTab === "analysis" && (ENABLE_PMF ? t("Insight (6 C's)") : "Insights (6 Cs)")}
              {activeTab === "strategic" && (ENABLE_PMF ? t("strategic") : "S.T.R.A.T.E.G.I.C")}
              {activeTab === "projects" && t("Projects")}
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
                <div className="mobile-menu-items">
                  {ENABLE_PMF && (
                    <button
                      className={`mobile-menu-item ${activeTab === "aha" ? "active" : ""}`}
                      onClick={() => { handleAhaTabClick(); setShowMobileMenu(false); }}
                    >
                      {t("aha")}
                    </button>
                  )}
                  {ENABLE_PMF && (
                    <button
                      className={`mobile-menu-item ${activeTab === "executive" ? "active" : ""}`}
                      onClick={() => { handleExecutiveTabClick(); setShowMobileMenu(false); }}
                    >
                      {t("Executive Summary")}
                    </button>
                  )}
                  {ENABLE_PMF && (
                    <button
                      className={`mobile-menu-item ${activeTab === "priorities" ? "active" : ""}`}
                      onClick={() => { setActiveTab("priorities"); setShowMobileMenu(false); }}
                    >
                      {t("Priorities & Projects")}
                    </button>
                  )}
                  {showProjectsTab && (
                    <button
                      className={`mobile-menu-item ${activeTab === "projects" ? "active" : ""}`}
                      onClick={() => { setActiveTab("projects"); setShowMobileMenu(false); }}
                    >
                      {t("Projects")}
                    </button>
                  )}
                  {ENABLE_PMF && (
                    <button
                      className={`mobile-menu-item ${activeTab === "brief" ? "active" : ""}`}
                      onClick={() => { handleBriefTabClick(); setShowMobileMenu(false); }}
                    >
                      {t("Questions and Answers")}
                    </button>
                  )}
                  <button
                    className={`mobile-menu-item ${activeTab === "analysis" ? "active" : ""}`}
                    onClick={() => { handleAnalysisTabClick(); setShowMobileMenu(false); }}
                  >
                    {ENABLE_PMF ? t("Insight (6 C's)") : "Insights (6 Cs)"}
                  </button>
                  <button
                    className={`mobile-menu-item ${activeTab === "strategic" ? "active" : ""}`}
                    onClick={() => { handleStrategicTabClick(); setShowMobileMenu(false); }}
                  >
                    {ENABLE_PMF ? t("strategic") : "S.T.R.A.T.E.G.I.C"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>


        {questionsLoaded && (
          <div className={`info-panel ${isMobile ? (activeTab === "brief" || activeTab === "analysis" || activeTab === "strategic" || activeTab === "projects" || activeTab === "priorities" || activeTab === "aha" || activeTab === "executive" ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  <div className="desktop-tabs">
                    <div className="desktop-tabs-left">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <button className="back-button" onClick={handleBackFromAnalysis} aria-label="Go Back">
                          <ArrowLeft size={18} />
                          {t("backToOverview")}
                        </button>
                        {selectedBusinessName && (
                          <strong style={{ fontSize: '0.85rem', color: '#1a1a2e', marginTop: '2px', paddingLeft: '4px' }}>{selectedBusinessName}</strong>
                        )}
                      </div>
                      {ENABLE_PMF && (
                        <button
                          className={`desktop-tab ${activeTab === "aha" ? "active" : ""}`}
                          onClick={handleAhaTabClick}
                        >
                          {t("aha")}
                        </button>
                      )}
                      {ENABLE_PMF && (
                        <button
                          className={`desktop-tab ${activeTab === "executive" ? "active" : ""}`}
                          onClick={handleExecutiveTabClick}
                        >
                          {t("Executive Summary")}
                        </button>
                      )}
                      {ENABLE_PMF && (
                        <button
                          className={`desktop-tab ${activeTab === "priorities" ? "active" : ""}`}
                          onClick={handlePrioritiesTabClick}
                        >
                          {t("Priorities & Projects")}
                        </button>
                      )}
                      {showProjectsTab && (
                        <button className={`desktop-tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>
                          {t("Projects")}
                        </button>
                      )}
                      {ENABLE_PMF && (
                        <button
                          className={`desktop-tab ${activeTab === "brief" ? "active" : ""}`}
                          onClick={handleBriefTabClick}
                        >
                          {t("Questions and Answers")}
                        </button>
                      )}

                      <button className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>
                        {ENABLE_PMF ? t("Insight (6 C's)") : "Insights (6 Cs)"}
                      </button>
                      <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={() => setActiveTab("strategic")}>
                        {ENABLE_PMF ? t("strategic") : "S.T.R.A.T.E.G.I.C"}
                      </button>
                    </div>

                    <div className="desktop-tabs-buttons">
                      {activeTab === "analysis" && (
                        <>
                          <div ref={dropdownRef} className="dropdown-wrapper">
                            <button className="dropdown-button" onClick={() => setShowDropdown(prev => !prev)}>
                              <span>{selectedDropdownValue}</span>
                              <ChevronDown size={16} className={`chevron ${showDropdown ? 'open' : ''}`} />
                            </button>
                            {showDropdown && (() => {
                              const categoryOptions = getPhaseSpecificOptions(currentPhase);
                              return Object.keys(categoryOptions).length > 0 && (<div className="dropdown-menu-options">
                                {Object.entries(categoryOptions).map(([category, items]) =>
                                  items.length > 0 && (
                                    <div key={category}>
                                      <div className="dropdown-category-header">{category}</div>
                                      {items.map((item) => (
                                        <div key={item} onClick={() => {
                                          handleOptionClick(item);
                                          setSelectedDropdownValue(item);
                                        }} className="dropdown-option dropdown-sub-option">
                                          <span className="bullet"></span>
                                          {item}
                                        </div>
                                      ))}
                                    </div>
                                  )
                                )}
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

                          {canShowRegenerateButtons && (
                            <button
                              onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
                              disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate}
                              className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
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
                          )}
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
                          {canShowRegenerateButtons && (
                            <button
                              onClick={() => canRegenerate && handleStrategicAnalysisRegenerate()}
                              disabled={isStrategicRegenerating || isAnalysisRegenerating || !canRegenerate}
                              className={`regenerate-button ${isStrategicRegenerating || isAnalysisRegenerating ? 'disabled' : ''}`}
                            >
                              {isStrategicRegenerating ? (
                                <>
                                  <Loader size={16} className="animate-spin" />
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={16} />
                                  {t("regenerate")}
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {ENABLE_PMF && activeTab === "aha" && (
                        <PMFInsightsTab
                          selectedBusinessId={selectedBusinessId}
                          refreshTrigger={pmfRefreshTrigger}
                          onStartOnboarding={() => setShowPMFOnboarding(true)}
                        />
                      )}
                      {ENABLE_PMF && activeTab === "executive" && (
                        <ExecutiveSummary
                          businessId={selectedBusinessId}
                          onStartOnboarding={() => setShowPMFOnboarding(true)}
                        />
                      )}
                      {ENABLE_PMF && activeTab === "brief" && (
                        <div className="brief-section">
                          <EditableBriefSection
                            selectedBusinessId={selectedBusinessId}
                            questions={questions}
                            userAnswers={userAnswers}
                            businessData={businessData}
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
                            isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                            highlightedMissingQuestions={highlightedMissingQuestions}
                            onClearHighlight={() => setHighlightedMissingQuestions(null)}
                            isLaunchedStatus={isLaunchedStatus}
                          />
                        </div>
                      )}
                      {activeTab === "analysis" &&
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons} />}
                      {activeTab === "strategic" && (
                        <div className="strategic-section">
                          <StrategicAnalysis
                            questions={questions}
                            userAnswers={userAnswers}
                            businessName={businessData.name}
                            onRegenerate={handleStrategicAnalysisRegenerate}
                            isRegenerating={isStrategicRegenerating}
                            canRegenerate={canShowRegenerateButtons && !isAnalysisRegenerating}
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
                          />
                        </div>
                      )}
                      {activeTab === "projects" && (
                        <ProjectsSection
                          selectedBusinessId={selectedBusinessId}
                          onProjectCountChange={handleProjectCountChange}
                          onBusinessStatusChange={setBusinessStatus}
                          companyAdminIds={companyAdminIds}
                        />
                      )}
                      {ENABLE_PMF && activeTab === "priorities" && (
                        <PrioritiesProjects
                          selectedBusinessId={selectedBusinessId}
                          companyAdminIds={companyAdminIds}
                          onSuccess={handleKickstartSuccess}
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
                    {ENABLE_PMF && (
                      <button
                        className={`desktop-tab ${activeTab === "aha" ? "active" : ""}`}
                        onClick={handleAhaTabClick}
                      >
                        {t("aha")}
                      </button>
                    )}
                    {ENABLE_PMF && (
                      <button
                        className={`desktop-tab ${activeTab === "executive" ? "active" : ""}`}
                        onClick={handleExecutiveTabClick}
                      >
                        {t("Executive Summary")}
                      </button>
                    )}
                    {ENABLE_PMF && (
                      <button
                        className={`desktop-tab ${activeTab === "priorities" ? "active" : ""}`}
                        onClick={handlePrioritiesTabClick}
                      >
                        {t("Priorities & Projects")}
                      </button>
                    )}
                    {ENABLE_PMF && (
                      <button
                        className={`desktop-tab ${activeTab === "brief" ? "active" : ""}`}
                        onClick={handleBriefTabClick}
                      >
                        {t("Questions and Answers")}
                      </button>
                    )}
                    <button className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
                      {ENABLE_PMF ? t("Insight (6 C's)") : "Insights (6 Cs)"}
                    </button>
                    <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
                      {ENABLE_PMF ? t("strategic") : "S.T.R.A.T.E.G.I.C"}
                    </button>
                  </div>

                  {activeTab === "analysis" && unlockedFeatures.analysis && (
                    <div className="desktop-tabs-buttons">
                      {canShowRegenerateButtons && (
                        <button
                          onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
                          disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate}
                          className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
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
                      )}
                    </div>
                  )}
                </div>

                <div className="info-panel-content">
                  {activeTab === "brief" && (
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
                        isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                        highlightedMissingQuestions={highlightedMissingQuestions}
                        onClearHighlight={() => setHighlightedMissingQuestions(null)}
                        isLaunchedStatus={isLaunchedStatus}
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
                  {ENABLE_PMF && activeTab === "executive" && (
                    <ExecutiveSummary
                      businessId={selectedBusinessId}
                      onStartOnboarding={() => setShowPMFOnboarding(true)}
                    />
                  )}
                  {activeTab === "analysis" && (
                    <div className="analysis-section">
                      <div className="analysis-content">
                        <AnalysisContentManager
                          {...analysisProps}
                          canRegenerate={canShowRegenerateButtons} />
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
                        canRegenerate={canShowRegenerateButtons && !isAnalysisRegenerating}
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
                  {activeTab === "projects" && (
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
                  {ENABLE_PMF && activeTab === "priorities" && (
                    <PrioritiesProjects
                      selectedBusinessId={selectedBusinessId}
                      companyAdminIds={companyAdminIds}
                      onSuccess={handleKickstartSuccess}
                      onToastMessage={showToastMessage}
                      onStartOnboarding={() => setShowPMFOnboarding(true)}
                    />
                  )}
                </div>
              </>
            )}

            {(!isAnalysisExpanded || isMobile) && isMobile && (
              <div className="info-panel-content">
                {activeTab === "brief" && (
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
                      isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                      highlightedMissingQuestions={highlightedMissingQuestions}
                      onClearHighlight={() => setHighlightedMissingQuestions(null)}
                      isLaunchedStatus={isLaunchedStatus}
                    />
                  </div>
                )}
                {ENABLE_PMF && activeTab === "aha" && (
                  <PMFInsightsTab
                    selectedBusinessId={selectedBusinessId}
                    refreshTrigger={pmfRefreshTrigger}
                    onStartOnboarding={() => setShowPMFOnboarding(true)}
                  />
                )}
                {ENABLE_PMF && activeTab === "executive" && (
                  <ExecutiveSummary
                    businessId={selectedBusinessId}
                    onStartOnboarding={() => setShowPMFOnboarding(true)}
                  />
                )}
                {activeTab === "analysis" && (
                  <div className="analysis-section">
                    {unlockedFeatures.analysis && (
                      <div className="analysis-section-mobile-controls">
                        {canShowRegenerateButtons && (
                          <button
                            onClick={() => canRegenerate && handleRegeneratePhase(currentPhase)}
                            disabled={isAnalysisRegenerating || !unlockedFeatures.analysis || !canRegenerate}
                            className={`regenerate-button ${isAnalysisRegenerating ? 'disabled' : ''}`}
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
                        )}
                      </div>
                    )}
                    <div className="analysis-content">
                      <AnalysisContentManager
                        {...analysisProps}
                        canRegenerate={canShowRegenerateButtons} />
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
                      canRegenerate={canShowRegenerateButtons && !isAnalysisRegenerating}
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
                {activeTab === "projects" && (
                  <ProjectsSection
                    selectedBusinessId={selectedBusinessId}
                    onProjectCountChange={handleProjectCountChange}
                    onBusinessStatusChange={setBusinessStatus}
                    companyAdminIds={companyAdminIds}
                    isArchived={isArchived}
                  />
                )}
                {ENABLE_PMF && activeTab === "priorities" && (
                  <PrioritiesProjects
                    selectedBusinessId={selectedBusinessId}
                    companyAdminIds={companyAdminIds}
                    onSuccess={handleKickstartSuccess}
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

      {ENABLE_PMF && (
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
