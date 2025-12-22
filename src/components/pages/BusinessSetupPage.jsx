import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, Loader, RefreshCw, ChevronDown } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";
import ChatComponent from "../components/ChatComponent";
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

  const loggedInRole = getLoggedInRole();
  const canRegenerate = !["viewer"].includes(loggedInRole);
  const businessStatus = (() => {
    try {
      return (
        sessionStorage.getItem("selectedBusinessStatus") ||
        business?.status ||
        ""
      );
    } catch {
      return business?.status || "";
    }
  })();
  const isLaunchedStatus = businessStatus === "launched";
  const canShowRegenerateButtons = canRegenerate && !isLaunchedStatus;
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [shouldScrollToUpload, setShouldScrollToUpload] = useState(false);
  const [selectedDropdownValue, setSelectedDropdownValue] = useState("Go to Section");
  const hasLoadedAnalysis = useRef(false);
  const streamingManager = useStreamingManager();
  const [showProjectsTab, setShowProjectsTab] = useState(false);

  const setApiLoading = (apiEndpoint, isLoading) => {
    setApiLoadingStates(prev => ({ ...prev, [apiEndpoint]: isLoading }));
  };

  const apiService = new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    getAuthToken,
    setApiLoading
  );

  const state = useBusinessSetup(business, selectedBusinessId);
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
    } catch {}
  }, [selectedBusinessId]);

  // Ensure Projects tab button appears once projects is active
  useEffect(() => {
    if (activeTab === 'projects' && !showProjectsTab) {
      setShowProjectsTab(true);
      try {
        if (selectedBusinessId) {
          sessionStorage.setItem(`showProjectsTab_${selectedBusinessId}`, 'true');
        }
      } catch {}
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
        } catch {}
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

  const handleFileUploaded = (file, validationResult) => {
    setUploadedFileForAnalysis(file);
    setHasUploadedDocument(true);
  };

  const handleRedirectToBrief = (missingQuestionsData) => {
    setHighlightedMissingQuestions(missingQuestionsData);
    if (isMobile) {
      setActiveTab("brief");
    } else {
      console.log("enter")
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

  const getCurrentPhase = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    if (unlockedFeatures.advancedPhase) return 'advanced';
    if (unlockedFeatures.goodPhase) return 'good';
    if (unlockedFeatures.fullSwot) return 'essential';
    return 'initial';
  };

  const handleRegeneratePhase = async (phaseOverride = null) => {
    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
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
    } catch (error) {
      console.error(`Error regenerating phase:`, error);
      showToastMessage(`Failed to regenerate phase.`, "error");
    } finally {
      isRegeneratingRef.current = false;
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

      const setterMap = {
        'swot': setSwotAnalysisResult,
        'strategic': setStrategicData,
        'fullSwot': setFullSwotData,
        'competitiveAdvantage': setCompetitiveAdvantageData,
        'expandedCapability': setExpandedCapabilityData,
        'strategicRadar': setStrategicRadarData,
        'productivityMetrics': setProductivityData,
        'maturityScore': setMaturityData,
        'purchaseCriteria': setPurchaseCriteriaData,
        'loyaltyNPS': setLoyaltyNPSData,
        'porters': setPortersData,
        'pestel': setPestelData,
        'profitabilityAnalysis': setProfitabilityData,
        'growthTracker': setGrowthTrackerData,
        'liquidityEfficiency': setLiquidityEfficiencyData,
        'investmentPerformance': setInvestmentPerformanceData,
        'leverageRisk': setLeverageRiskData,
        'competitiveLandscape': setCompetitiveLandscapeData,
        'coreAdjacency': setCoreAdjacencyData,
      };

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

  const handleStrategicAnalysisRegenerate = async () => {
    if (!phaseManager.canRegenerateAnalysis() || isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
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
      isRegeneratingRef.current = false;
      setIsStrategicRegenerating(false);
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
        setIsSliding(false);
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
      setIsSliding(false);
    }
  };

  const handleBack = () => window.history.back();

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

  const handleRedirectToChat = (params = {}) => {
    if (isMobile) {
      setActiveTab("chat");
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
    if (params.scrollToUploadCard) {
      setShouldScrollToUpload(true);
    }
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
    onRedirectToChat: handleRedirectToChat, isMobile, setActiveTab,
    hasUploadedDocument, documentInfo, collapsedCategories, setCollapsedCategories,
    readOnly: false,isCardExpanded: (cardId) => expandedCards.has(cardId),
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
    } catch {}
  };

  return (
    <div className="business-setup-container">
      <MenuBar />

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
        <div className="mobile-tabs">
          <button className={`mobile-tab ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
            {t("assistant")}
          </button>
          <button className={`mobile-tab ${activeTab === "brief" ? "active" : ""}`} onClick={() => setActiveTab("brief")}>
            {t("brief")}
          </button>
          {unlockedFeatures.analysis && (
            <button className={`mobile-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
              {t("analysis")}
            </button>
          )}
          {unlockedFeatures.analysis && (
            <button className={`mobile-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
              {t("strategic")}
            </button>
          )}
          {showProjectsTab && (
            <button
              className={`mobile-tab ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              {t("Projects")}
            </button>
          )}
        </div>
      )}

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""}`}>
        <div className={`chat-section ${isMobile && activeTab !== "chat" ? "hidden" : ""} ${isAnalysisExpanded && !isMobile ? "slide-out" : ""}`}>
          <div className="welcome-area">
            <div className="header-section">
              <button className="back-button" onClick={handleBack} aria-label="Go Back">
                <ArrowLeft size={18} />
              </button>
            </div>
            <h2 className="welcome-heading">{selectedBusinessName || 'Business Analysis'}</h2>
            <p className="welcome-text">{t("letsBegin")} {t("welcomeToTraxia")}</p>
          </div>

          <ChatComponent
            selectedBusinessId={selectedBusinessId}
            userAnswers={userAnswers}
            onBusinessDataUpdate={handleBusinessDataUpdate}
            onNewAnswer={handleNewAnswer}
            onQuestionsLoaded={(loadedQuestions) => {
              setQuestions(loadedQuestions);
              setQuestionsLoaded(true);
            }}
            onQuestionCompleted={handleQuestionCompleted}
            onPhaseCompleted={async (phase) => {
              if (phase === 'good') {
                try {
                  await apiService.handlePhaseCompletion('good', questions, userAnswers, selectedBusinessId, stateSetters, showToastMessage);
                  showToastMessage('Good Phase completed! Next: Advanced Phase.', 'success');
                } catch (error) {
                  console.error('Error generating Good phase analysis:', error);
                  showToastMessage('File uploaded but analysis generation failed', 'error');
                }
              }
            }}
            onFileUploaded={handleFileUploaded}
            scrollToUploadCard={shouldScrollToUpload}
            onScrollCompleted={() => setShouldScrollToUpload(false)}
          />
        </div>

        {questionsLoaded && (
          <div className={`info-panel ${isMobile ? (activeTab === "brief" || activeTab === "analysis" || activeTab === "strategic" || activeTab === "projects" ? "active" : "") : ""} ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}>
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  <div className="desktop-tabs">
                    <div className="desktop-tabs-left">
                      <button className="back-button" onClick={handleBackFromAnalysis} aria-label="Go Back">
                        <ArrowLeft size={18} />
                        {t("backToOverview")}
                      </button>
                      {unlockedFeatures.analysis && (
                        <button className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>
                          {t("analysis")}
                        </button>
                      )}
                      {unlockedFeatures.analysis && (
                        <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={() => setActiveTab("strategic")}>
                          {t("strategic")}
                        </button>
                      )}
                      {showProjectsTab && (
                        <button className={`desktop-tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>
                          {t("Projects")}
                        </button>
                      )}
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
                      {activeTab === "analysis" && 
                        <AnalysisContentManager 
                          {...analysisProps}
                          canRegenerate={canRegenerate}  />}
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
                            phaseAnalysisArray={phaseAnalysisArray}
                            onRedirectToChat={handleRedirectToChat}
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
                    <button className={`desktop-tab ${activeTab === "brief" ? "active" : ""}`} onClick={() => setActiveTab("brief")}>
                      {t("brief")}
                    </button>
                    {unlockedFeatures.analysis && (
                      <button className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`} onClick={handleAnalysisTabClick}>
                        {t("analysis")}
                      </button>
                    )}
                    {unlockedFeatures.analysis && (
                      <button className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`} onClick={handleStrategicTabClick}>
                        {t("strategic")}
                      </button>
                    )}
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



                        onAnalysisRegenerate={() => handleRegeneratePhase(currentPhase)}
                        isAnalysisRegenerating={isAnalysisRegenerating}
                        isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                        highlightedMissingQuestions={highlightedMissingQuestions}
                        onClearHighlight={() => setHighlightedMissingQuestions(null)}
                      />
                    </div>
                  )}
                  {activeTab === "analysis" && (
                    <div className="analysis-section">
                      <div className="analysis-content">
                        <AnalysisContentManager 
                          {...analysisProps}
                          canRegenerate={canRegenerate}  />
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
                      />
                    </div>
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

                      onAnalysisRegenerate={() => handleRegeneratePhase(currentPhase)}
                      isAnalysisRegenerating={isAnalysisRegenerating}
                      isEssentialPhaseGenerating={isFullSwotRegenerating || isCompetitiveAdvantageRegenerating || isExpandedCapabilityRegenerating || isStrategicRadarRegenerating || isProductivityRegenerating || isMaturityRegenerating}
                      highlightedMissingQuestions={highlightedMissingQuestions}
                      onClearHighlight={() => setHighlightedMissingQuestions(null)}
                    />
                  </div>
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
                        canRegenerate={canRegenerate}  />
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
                  />
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
