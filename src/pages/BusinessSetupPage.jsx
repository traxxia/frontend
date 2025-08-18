import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader, RefreshCw, DollarSign, Zap, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Target, Award, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

// Import components
import ChatComponent from "../components/ChatComponent";
import SwotAnalysis from "../components/SwotAnalysis";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import CustomerSegmentation from "../components/CustomerSegmentation";
import PurchaseCriteria from "../components/PurchaseCriteria";
import ChannelHeatmap from "../components/ChannelHeatmap";
import LoyaltyNPS from "../components/LoyaltyNPS";
import CapabilityHeatmap from "../components/CapabilityHeatmap";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PortersFiveForces from "../components/PortersFiveForces";
import PestelAnalysis from "../components/PestelAnalysis";
import FullSWOTPortfolio from "../components/FullSWOTPortfolio";
import PhaseManager from "../components/PhaseManager";
import CompetitiveAdvantageMatrix from "../components/CompetitiveAdvantageMatrix";
import ChannelEffectivenessMap from "../components/ChannelEffectivenessMap";
import ExpandedCapabilityHeatmap from "../components/ExpandedCapabilityHeatmap";
import StrategicGoals from "../components/StrategicGoals";
import StrategicPositioningRadar from "../components/StrategicPositioningRadar";
import OrganizationalCultureProfile from "../components/OrganizationalCultureProfile";
import ProductivityMetrics from "../components/ProductivityMetrics";
import MaturityScoreLight from "../components/MaturityScoreLight";

// Import existing hooks
import { useBusinessSetup } from '../hooks/useBusinessSetup';
import PhaseTabsComponent from '../components/PhaseTabsComponent';
import { extractBusinessName, showToastMessage as createToastMessage } from '../utils/businessHelpers';

import "../styles/businesspage.css";
import "../styles/business.css";
import RegenerateButton from "../components/RegenerateButton";
import PDFExportButton from "../components/PDFExportButton";
import CostEfficiencyInsight from "../components/CostEfficiencyInsight";
import FinancialPerformance from "../components/FinancialPerformance";
import FinancialBalanceInsight from "../components/FinancialBalanceInsight";
import OperationalEfficiencyInsight from "../components/OperationalEfficiencyInsight";

// Import simplified API service
import { AnalysisApiService, PHASE_API_CONFIG } from '../services/analysisApiService';

const BusinessSetupPage = () => {
  const location = useLocation();
  const business = location.state?.business;
  const selectedBusinessId = location.state?.business?._id;
  const selectedBusinessName = location.state?.business?.business_name;
  const { t } = useTranslation();

  // Constants
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Initialize simplified API service
  const apiService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  // Use our custom hooks
  const state = useBusinessSetup(business, selectedBusinessId);
  const [currentPhase, setCurrentPhase] = useState('initial');
  // Extract state
  const {
    activeTab, setActiveTab, isMobile, setIsMobile, isAnalysisExpanded, setIsAnalysisExpanded,
    isSliding, setIsSliding, questions, setQuestions, questionsLoaded, setQuestionsLoaded,
    userAnswers, setUserAnswers, completedQuestions, setCompletedQuestions,
    businessData, setBusinessData, hasAnalysisData, setHasAnalysisData,
    isAnalysisRegenerating, setIsAnalysisRegenerating, selectedPhase, setSelectedPhase,
    showDropdown, setShowDropdown, showToast, setShowToast,
    // Analysis data states
    swotAnalysisResult, setSwotAnalysisResult, customerSegmentationData, setCustomerSegmentationData,
    purchaseCriteriaData, setPurchaseCriteriaData, channelHeatmapData, setChannelHeatmapData,
    loyaltyNPSData, setLoyaltyNPSData, capabilityHeatmapData, setCapabilityHeatmapData,
    strategicData, setStrategicData, portersData, setPortersData, pestelData, setPestelData,
    fullSwotData, setFullSwotData, competitiveAdvantageData, setCompetitiveAdvantageData,
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
    isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating,
    highlightedMissingQuestions, setHighlightedMissingQuestions,
    isChannelHeatmapReady, setIsChannelHeatmapReady,
    isCapabilityHeatmapReady, setIsCapabilityHeatmapReady,

    costEfficiencyData, setCostEfficiencyData,
    setFinancialPerformanceData, financialPerformanceData,
    setIsCostEfficiencyRegenerating, isCostEfficiencyRegenerating,
    setIsFinancialPerformanceRegenerating, isFinancialPerformanceRegenerating,
    // Refs
    swotRef, customerSegmentationRef, purchaseCriteriaRef, channelHeatmapRef,
    loyaltyNpsRef, capabilityHeatmapRef, dropdownRef, isRegeneratingRef,
    portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef,
    cultureProfileRef, productivityRef, maturityScoreRef, strategicGoalsRef,
    strategicRadarRef, expandedCapabilityRef, channelEffectivenessRef,
    costEfficiencyRef, financialPerformanceRef,
    financialBalanceData, setFinancialBalanceData,
    operationalEfficiencyData, setOperationalEfficiencyData,
    isFinancialBalanceRegenerating, setIsFinancialBalanceRegenerating,
    isOperationalEfficiencyRegenerating, setIsOperationalEfficiencyRegenerating,
    financialBalanceRef, operationalEfficiencyRef
  } = state;
  const [selectedDropdownValue, setSelectedDropdownValue] = useState("Go to Section");
  const hasLoadedAnalysis = useRef(false);

  // Add state for expand/collapse functionality
  const [expandedPhases, setExpandedPhases] = useState(new Set(['initial'])); // Initial phase expanded by default
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Create toast message helper
  const showToastMessage = createToastMessage(setShowToast);

  // NEW: Create state setters object for simplified API approach
  const stateSetters = {
    setSwotAnalysisResult,
    setPurchaseCriteriaData,
    setChannelHeatmapData,
    setLoyaltyNPSData,
    setCapabilityHeatmapData,
    setPortersData,
    setPestelData,
    setFullSwotData,
    setCustomerSegmentationData,
    setCompetitiveAdvantageData,
    setChannelEffectivenessData,
    setExpandedCapabilityData,
    setStrategicGoalsData,
    setStrategicRadarData,
    setCultureProfileData,
    setProductivityData,
    setMaturityData,
    setCostEfficiencyData,
    setFinancialPerformanceData,
    setFinancialBalanceData,
    setOperationalEfficiencyData
  };

  // Toggle functions for expand/collapse
  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const toggleCard = (cardId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
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

      console.log('Regenerating phase:', targetPhase);

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
      showToastMessage(`Failed to regenerate  phase.`, "error");
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
          'strategicGoals': () => setStrategicGoalsData(analysis_data),
          'strategicRadar': () => setStrategicRadarData(analysis_data),
          'customerSegmentation': () => setCustomerSegmentationData(analysis_data),
          'cultureProfile': () => setCultureProfileData(analysis_data),
          'productivityMetrics': () => setProductivityData(analysis_data),
          'maturityScore': () => setMaturityData(analysis_data),
          'purchaseCriteria': () => setPurchaseCriteriaData(analysis_data),
          'channelHeatmap': () => setChannelHeatmapData(analysis_data),
          'loyaltyNPS': () => setLoyaltyNPSData(analysis_data),
          'capabilityHeatmap': () => setCapabilityHeatmapData(analysis_data),
          'porters': () => setPortersData(analysis_data),
          'pestel': () => setPestelData(analysis_data),
          'channelEffectiveness': () => setChannelEffectivenessData(analysis_data),
          'costEfficiency': () => setCostEfficiencyData(analysis_data),
          'financialPerformance': () => setFinancialPerformanceData(analysis_data),
          'financialBalance': () => setFinancialBalanceData(analysis_data),
          'operationalEfficiency': () => setOperationalEfficiencyData(analysis_data)
        };

        const setter = setterMap[analysis_type];
        if (setter) setter();
      });

      setHasAnalysisData(hasAnyAnalysis);
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };

  // Initialize PhaseManager with simplified approach
  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      setCompletedQuestions(completedSet);
      setUserAnswers(prev => ({ ...prev, ...answersMap }));
    },
    onCompletedPhasesUpdate: (phases) => { },
    onAnalysisGeneration: () => handleRegeneratePhase('initial'),
    onFullSwotGeneration: () => handleRegeneratePhase('essential'),
    onGoodPhaseGeneration: () => handleRegeneratePhase('good'),
    onAdvancedPhaseGeneration: () => handleRegeneratePhase('advanced'), // NEW: Add advanced phase handler
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL, getAuthToken,
    apiService,
    stateSetters,
    showToastMessage
  });

  // Strategic Analysis Regeneration Handler
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

    setTimeout(() => {
      const refMap = {
        "SWOT": swotRef,
        "Capability Heatmap": capabilityHeatmapRef,
        "Purchase Criteria": purchaseCriteriaRef,
        "Channel Heatmap": channelHeatmapRef,
        "Loyalty/NPS": loyaltyNpsRef,
        "Porter's Five Forces": portersRef,
        "PESTEL Analysis": pestelRef,

        // Essential Phase Refs
        "Full SWOT Portfolio": fullSwotRef,
        "Customer Segmentation": customerSegmentationRef,
        "Competitive Advantage": competitiveAdvantageRef,
        "Channel Effectiveness": channelEffectivenessRef,
        "Expanded Capability Heatmap": expandedCapabilityRef,
        "Strategic Goals": strategicGoalsRef,
        "Strategic Positioning Radar": strategicRadarRef,
        "Organizational Culture Profile": cultureProfileRef,
        "Productivity Metrics": productivityRef,
        "Maturity Score": maturityScoreRef,

        // Good Phase Refs
        "Cost Efficiency Insight": costEfficiencyRef,
        "Financial Performance & Growth Trajectory": financialPerformanceRef,
        "Financial Health Insight": financialBalanceRef,
        "Operational Efficiency Insight": operationalEfficiencyRef
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

  // Complete createSimpleRegenerationHandler function for BusinessSetupPage.js

  const createSimpleRegenerationHandler = (analysisType) => {
    return async () => {
      // Map analysis types to their corresponding regenerating state setters
      const regeneratingStateMap = {
        'fullSwot': setIsFullSwotRegenerating,
        'swot': setIsSwotAnalysisRegenerating,
        'purchaseCriteria': setIsPurchaseCriteriaRegenerating,
        'channelHeatmap': setIsChannelHeatmapRegenerating,
        'loyaltyNPS': setIsLoyaltyNPSRegenerating,
        'capabilityHeatmap': setIsCapabilityHeatmapRegenerating,
        'porters': setIsPortersRegenerating,
        'pestel': setIsPestelRegenerating,
        'customerSegmentation': setIsCustomerSegmentationRegenerating,
        'competitiveAdvantage': setIsCompetitiveAdvantageRegenerating,
        'channelEffectiveness': setIsChannelEffectivenessRegenerating,
        'expandedCapability': setIsExpandedCapabilityRegenerating,
        'strategicGoals': setIsStrategicGoalsRegenerating,
        'strategicRadar': setIsStrategicRadarRegenerating,
        'cultureProfile': setIsCultureProfileRegenerating,
        'productivityMetrics': setIsProductivityRegenerating,
        'maturityScore': setIsMaturityRegenerating,
        'costEfficiency': setIsCostEfficiencyRegenerating,
        'financialPerformance': setIsFinancialPerformanceRegenerating,
        'financialHealth': setIsFinancialBalanceRegenerating,
        'operationalEfficiency': setIsOperationalEfficiencyRegenerating
      };

      // Map analysis types to their corresponding data state setters
      const dataStateMap = {
        'fullSwot': setFullSwotData,
        'swot': setSwotAnalysisResult,
        'purchaseCriteria': setPurchaseCriteriaData,
        'channelHeatmap': setChannelHeatmapData,
        'loyaltyNPS': setLoyaltyNPSData,
        'capabilityHeatmap': setCapabilityHeatmapData,
        'porters': setPortersData,
        'pestel': setPestelData,
        'customerSegmentation': setCustomerSegmentationData,
        'competitiveAdvantage': setCompetitiveAdvantageData,
        'channelEffectiveness': setChannelEffectivenessData,
        'expandedCapability': setExpandedCapabilityData,
        'strategicGoals': setStrategicGoalsData,
        'strategicRadar': setStrategicRadarData,
        'cultureProfile': setCultureProfileData,
        'productivityMetrics': setProductivityData,
        'maturityScore': setMaturityData,
        'costEfficiency': setCostEfficiencyData,
        'financialPerformance': setFinancialPerformanceData,
        'financialHealth': setFinancialBalanceData,
        'operationalEfficiency': setOperationalEfficiencyData
      };

      // Map analysis types to display names
      const displayNameMap = {
        'fullSwot': 'Full SWOT Portfolio',
        'swot': 'SWOT Analysis',
        'purchaseCriteria': 'Purchase Criteria',
        'channelHeatmap': 'Channel Heatmap',
        'loyaltyNPS': 'Loyalty & NPS',
        'capabilityHeatmap': 'Capability Heatmap',
        'porters': "Porter's Five Forces",
        'pestel': 'PESTEL Analysis',
        'customerSegmentation': 'Customer Segmentation',
        'competitiveAdvantage': 'Competitive Advantage',
        'channelEffectiveness': 'Channel Effectiveness',
        'expandedCapability': 'Expanded Capability Heatmap',
        'strategicGoals': 'Strategic Goals',
        'strategicRadar': 'Strategic Positioning Radar',
        'cultureProfile': 'Organizational Culture Profile',
        'productivityMetrics': 'Productivity Metrics',
        'maturityScore': 'Maturity Score',
        'costEfficiency': 'Cost Efficiency Insight',
        'financialPerformance': 'Financial Performance',
        'financialHealth': 'Financial Health Insight',
        'operationalEfficiency': 'Operational Efficiency Insight'
      };

      // Get the state setters and display name
      const setIsRegenerating = regeneratingStateMap[analysisType];
      const setData = dataStateMap[analysisType];
      const displayName = displayNameMap[analysisType] || analysisType;

      // Validation
      if (!setIsRegenerating) {
        console.error(`No regenerating state setter found for analysis type: ${analysisType}`);
        showToastMessage(`Cannot regenerate ${displayName} - missing state handler`, "error");
        return;
      }

      if (!setData) {
        console.error(`No data state setter found for analysis type: ${analysisType}`);
        showToastMessage(`Cannot regenerate ${displayName} - missing data handler`, "error");
        return;
      }

      // Prevent multiple simultaneous regenerations
      if (isRegeneratingRef.current) {
        console.log(`Regeneration already in progress for ${analysisType}`);
        return;
      }

      try {
        console.log(`Starting regeneration for ${analysisType}`);

        // Set the specific regenerating state to true
        setIsRegenerating(true);
        isRegeneratingRef.current = true;

        // Show loading message
        showToastMessage(`Regenerating ${displayName}...`, "info");

        // Clear existing data to show loading state
        setData(null);

        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 200));

        // Call the appropriate API service method based on analysis type
        let result;

        try {
          switch (analysisType) {
            case 'fullSwot':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setFullSwotData },
                showToastMessage
              );
              // Extract fullSwot data if using phase completion
              if (result && result.fullSwot) {
                result = result.fullSwot;
              }
              break;

            case 'swot':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setSwotAnalysisResult },
                showToastMessage
              );
              // Extract swot data if using phase completion
              if (result && result.swot) {
                result = result.swot;
              }
              break;

            case 'purchaseCriteria':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setPurchaseCriteriaData },
                showToastMessage
              );
              // Extract purchase criteria data
              if (result && result.purchaseCriteria) {
                result = result.purchaseCriteria;
              }
              break;

            case 'channelHeatmap':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setChannelHeatmapData },
                showToastMessage
              );
              if (result && result.channelHeatmap) {
                result = result.channelHeatmap;
              }
              break;

            case 'loyaltyNPS':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setLoyaltyNPSData },
                showToastMessage
              );
              if (result && result.loyaltyNPS) {
                result = result.loyaltyNPS;
              }
              break;

            case 'capabilityHeatmap':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setCapabilityHeatmapData },
                showToastMessage
              );
              if (result && result.capabilityHeatmap) {
                result = result.capabilityHeatmap;
              }
              break;

            case 'porters':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setPortersData },
                showToastMessage
              );
              if (result && result.porters) {
                result = result.porters;
              }
              break;

            case 'pestel':
              result = await apiService.handlePhaseCompletion(
                'initial',
                questions,
                userAnswers,
                selectedBusinessId,
                { setPestelData },
                showToastMessage
              );
              if (result && result.pestel) {
                result = result.pestel;
              }
              break;

            case 'customerSegmentation':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setCustomerSegmentationData },
                showToastMessage
              );
              if (result && result.customerSegmentation) {
                result = result.customerSegmentation;
              }
              break;

            case 'competitiveAdvantage':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setCompetitiveAdvantageData },
                showToastMessage
              );
              if (result && result.competitiveAdvantage) {
                result = result.competitiveAdvantage;
              }
              break;

            case 'channelEffectiveness':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setChannelEffectivenessData },
                showToastMessage
              );
              if (result && result.channelEffectiveness) {
                result = result.channelEffectiveness;
              }
              break;

            case 'expandedCapability':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setExpandedCapabilityData },
                showToastMessage
              );
              if (result && result.expandedCapability) {
                result = result.expandedCapability;
              }
              break;

            case 'strategicGoals':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setStrategicGoalsData },
                showToastMessage
              );
              if (result && result.strategicGoals) {
                result = result.strategicGoals;
              }
              break;

            case 'strategicRadar':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setStrategicRadarData },
                showToastMessage
              );
              if (result && result.strategicRadar) {
                result = result.strategicRadar;
              }
              break;

            case 'cultureProfile':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setCultureProfileData },
                showToastMessage
              );
              if (result && result.cultureProfile) {
                result = result.cultureProfile;
              }
              break;

            case 'productivityMetrics':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setProductivityData },
                showToastMessage
              );
              if (result && result.productivityMetrics) {
                result = result.productivityMetrics;
              }
              break;

            case 'maturityScore':
              result = await apiService.handlePhaseCompletion(
                'essential',
                questions,
                userAnswers,
                selectedBusinessId,
                { setMaturityData },
                showToastMessage
              );
              if (result && result.maturityScore) {
                result = result.maturityScore;
              }
              break;

            case 'costEfficiency':
              result = await apiService.handlePhaseCompletion(
                'good',
                questions,
                userAnswers,
                selectedBusinessId,
                { setCostEfficiencyData },
                showToastMessage
              );
              if (result && result.costEfficiency) {
                result = result.costEfficiency;
              }
              break;

            case 'financialPerformance':
              result = await apiService.handlePhaseCompletion(
                'good',
                questions,
                userAnswers,
                selectedBusinessId,
                { setFinancialPerformanceData },
                showToastMessage
              );
              if (result && result.financialPerformance) {
                result = result.financialPerformance;
              }
              break;

            case 'financialHealth':
              result = await apiService.handlePhaseCompletion(
                'good',
                questions,
                userAnswers,
                selectedBusinessId,
                { setFinancialBalanceData },
                showToastMessage
              );
              if (result && result.financialBalance) {
                result = result.financialBalance;
              }
              break;

            case 'operationalEfficiency':
              result = await apiService.handlePhaseCompletion(
                'good',
                questions,
                userAnswers,
                selectedBusinessId,
                { setOperationalEfficiencyData },
                showToastMessage
              );
              if (result && result.operationalEfficiency) {
                result = result.operationalEfficiency;
              }
              break;

            default:
              throw new Error(`Unknown analysis type: ${analysisType}`);
          }

          // Update the data state if we got a result
          if (result) {
            console.log(`Setting data for ${analysisType}:`, result);
            setData(result);
          } else {
            console.warn(`No result returned for ${analysisType}`);
          }

          // Show success message
          showToastMessage(`${displayName} regenerated successfully!`, "success");

        } catch (apiError) {
          console.error(`API error regenerating ${analysisType}:`, apiError);

          // Re-throw to be caught by outer catch block
          throw apiError;
        }

      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);

        // Show error message
        const errorMessage = error.message || `Failed to regenerate ${displayName}`;
        showToastMessage(errorMessage, "error");

        // Optionally set some error state or retry mechanism
        // You could add error states to your components if needed

      } finally {
        // Always reset the regenerating state
        console.log(`Finishing regeneration for ${analysisType}`);
        setIsRegenerating(false);
        isRegeneratingRef.current = false;
      }
    };
  };

  const ModernAnalysisCard = ({
    id,
    title,
    description,
    icon: IconComponent,
    children,
    onRegenerate,
    isRegenerating = false,
    hasData = false,
    category = 'initial',
    status = 'completed' // 'completed', 'loading', 'locked', 'error'
  }) => {
    const isExpanded = expandedCards.has(id);

    const getStatusIcon = () => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="modern-status-icon completed" size={16} />;
        case 'loading':
          return <Loader className="modern-status-icon loading modern-animate-spin" size={16} />;
        case 'locked':
          return <Lock className="modern-status-icon locked" size={16} />;
        case 'error':
          return <Loader className="modern-status-icon error modern-animate-spin" size={16} />;
        default:
          return null;
      }
    };

    return (
      <div className={`modern-analysis-card ${status}`}>
        <div
          className={`modern-card-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleCard(id)}
        >
          <div className="modern-card-header-left">
            <div className="modern-card-icon">
              <IconComponent size={20} />
            </div>
            <div className="modern-card-text">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>

          <div className="modern-card-header-right">

            {getStatusIcon()}

            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <RegenerateButton
                onRegenerate={onRegenerate}
                isRegenerating={isRegenerating}
                canRegenerate={status === 'completed' && hasData && onRegenerate}
                sectionName={title}
                size="small"
              />
            </div>

            <button className="modern-expand-btn">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className={`modern-card-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="modern-card-content-inner">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const ModernPhaseSection = ({
    phaseId,
    title,
    description,
    icon: IconComponent,
    children,
    completedCount,
    totalCount,
    onRegenerateAll,
    isRegeneratingAll = false,
    category = 'initial'
  }) => {
    const isExpanded = expandedPhases.has(phaseId);
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div className={`modern-phase-section ${category}-phase`}>
        <div
          className={`modern-phase-header ${isExpanded ? 'expanded' : 'collapsed'}`}
          onClick={() => togglePhase(phaseId)}
        >
          <div className="modern-phase-title">
            <div className="modern-phase-icon">
              <IconComponent size={24} />
            </div>
            <div className="modern-phase-info">
              <h6>{title}</h6>
            </div>
            <div className="modern-phase-controls">
              {/* Add PDF Export Button */}
              <div onClick={(e) => e.stopPropagation()}>
                <PDFExportButton
                  className="pdf-export-button"
                  style={{
                    marginRight: "10px"
                  }}
                  businessName={businessData.name}
                  onToastMessage={showToastMessage}
                  currentPhase={category} // Use category (initial/essential/good) as currentPhase
                  disabled={isAnalysisRegenerating}
                  isChannelHeatmapReady={isChannelHeatmapReady}
                  isCapabilityHeatmapReady={isCapabilityHeatmapReady}
                  // NEW: Add required props for dynamic phase detection
                  unlockedFeatures={unlockedFeatures}
                  fullSwotData={fullSwotData}
                  customerSegmentationData={customerSegmentationData}
                  competitiveAdvantageData={competitiveAdvantageData}
                  channelEffectivenessData={channelEffectivenessData}
                  expandedCapabilityData={expandedCapabilityData}
                  strategicGoalsData={strategicGoalsData}
                  strategicRadarData={strategicRadarData}
                  cultureProfileData={cultureProfileData}
                  productivityData={productivityData}
                  maturityData={maturityData}
                  costEfficiencyData={costEfficiencyData}
                  financialPerformanceData={financialPerformanceData}
                  financialBalanceData={financialBalanceData}
                  operationalEfficiencyData={operationalEfficiencyData}
                />
              </div>

              {/* Replace the old regenerate all button with RegenerateButton component */}
              <div onClick={(e) => e.stopPropagation()}>
                <RegenerateButton
                  onRegenerate={onRegenerateAll}
                  isRegenerating={isRegeneratingAll}
                  canRegenerate={completedCount > 0}
                  sectionName={`All ${title}`}
                  size="medium"
                />
              </div>

              <button className="modern-expand-toggle">
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className={`modern-phase-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="modern-analysis-grid">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Analysis Controls Component
  const AnalysisControls = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    const currentPhase = getCurrentPhase(); // Get current phase

    return (
      <div className="analysis-controls-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={() => handleRegeneratePhase(getCurrentPhase())}  // Use currentPhase
          disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
          style={{
            backgroundColor: (isAnalysisRegenerating) ? "#f3f4f6" : "#10b981",
            color: (isAnalysisRegenerating) ? "#6b7280" : "#fff",
            border: "none", borderRadius: "10px", padding: "10px 18px",
            fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center",
            cursor: (isAnalysisRegenerating) ? "not-allowed" : "pointer",
            gap: "8px", transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
          }}
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

  const renderModernAnalysisContent = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    if (!unlockedFeatures.analysis) {
      return (
        <div className="modern-locked-state">
          <Lock size={60} className="modern-locked-icon" />
          <h3>Analysis Locked</h3>
          <p>Complete all initial phase questions to unlock your comprehensive business analysis.</p>
        </div>
      );
    }

    return (
      <div className="modern-analysis-container">
        <div className="modern-analysis-content">
          <div className="modern-analysis-grid">
            {/* SWOT Analysis Card - Only show if essential phase is not unlocked */}
            {!unlockedFeatures.fullSwot && (
              <ModernAnalysisCard
                id="swot"
                title="SWOT Analysis"
                description="Comprehensive strengths, weaknesses, opportunities, and threats analysis"
                icon={Target}
                hasData={!!swotAnalysisResult}
                onRegenerate={createSimpleRegenerationHandler('swot')}
                isRegenerating={isSwotAnalysisRegenerating}
                status={swotAnalysisResult ? 'completed' : 'error'}
                category="initial"
              >
                <div ref={swotRef} data-component="swot-analysis">
                  <SwotAnalysis
                    analysisResult={swotAnalysisResult}
                    businessName={businessData.name}
                    questions={questions}
                    userAnswers={userAnswers}
                    saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
                    selectedBusinessId={selectedBusinessId}
                    onRedirectToBrief={handleRedirectToBrief}
                    onDataGenerated={setSwotAnalysisResult}
                    onRegenerate={createSimpleRegenerationHandler('swot')}
                    isRegenerating={isSwotAnalysisRegenerating}
                    canRegenerate={!isAnalysisRegenerating}
                  />
                </div>
              </ModernAnalysisCard>
            )}
            {/* Purchase Criteria Card */}
            <ModernAnalysisCard
              id="purchase-criteria"
              title="Purchase Criteria"
              description="Key factors influencing customer buying decisions"
              icon={Target}
              hasData={!!purchaseCriteriaData}
              onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
              isRegenerating={isPurchaseCriteriaRegenerating}
              status={purchaseCriteriaData ? 'completed' : 'error'}
              category="initial"
            >
              <div ref={purchaseCriteriaRef} data-component="purchase-criteria" >
                <PurchaseCriteria
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={setPurchaseCriteriaData}
                  onRegenerate={createSimpleRegenerationHandler('purchaseCriteria')}
                  isRegenerating={isPurchaseCriteriaRegenerating}
                  canRegenerate={!isAnalysisRegenerating}
                  purchaseCriteriaData={purchaseCriteriaData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Channel Heatmap Card */}
            <ModernAnalysisCard
              id="channel-heatmap"
              title="Channel Heatmap"
              description="Visual representation of channel effectiveness and reach"
              icon={Target}
              hasData={!!channelHeatmapData}
              onRegenerate={createSimpleRegenerationHandler('channelHeatmap')}
              isRegenerating={isChannelHeatmapRegenerating}
              status={channelHeatmapData ? 'completed' : 'error'}
              category="initial"
            >
              <div ref={channelHeatmapRef} data-component="channel-heatmap">
                <ChannelHeatmap
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={(data) => {
                    setChannelHeatmapData(data);
                    if (data && data.matrix && data.matrix.length > 0) {
                      setIsChannelHeatmapReady(true);
                    }
                  }}
                  onRegenerate={createSimpleRegenerationHandler('channelHeatmap')}
                  isRegenerating={isChannelHeatmapRegenerating}
                  canRegenerate={!isAnalysisRegenerating}
                  channelHeatmapData={channelHeatmapData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Loyalty NPS Card */}
            <ModernAnalysisCard
              id="loyalty-nps"
              title="Loyalty & NPS"
              description="Customer loyalty metrics and Net Promoter Score analysis"
              icon={Target}
              hasData={!!loyaltyNPSData}
              onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
              isRegenerating={isLoyaltyNPSRegenerating}
              status={loyaltyNPSData ? 'completed' : 'error'}
              category="initial"
            >
              <div ref={loyaltyNpsRef} data-component="loyalty-nps">
                <LoyaltyNPS
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onDataGenerated={setLoyaltyNPSData}
                  onRegenerate={createSimpleRegenerationHandler('loyaltyNPS')}
                  isRegenerating={isLoyaltyNPSRegenerating}
                  canRegenerate={!isAnalysisRegenerating}
                  loyaltyNPSData={loyaltyNPSData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Capability Heatmap Card - Only show if essential phase is not unlocked */}
            {!unlockedFeatures.fullSwot && (
              <ModernAnalysisCard
                id="capability-heatmap"
                title="Capability Heatmap"
                description="Visual analysis of organizational capabilities and strengths"
                icon={Target}
                hasData={!!capabilityHeatmapData}
                onRegenerate={createSimpleRegenerationHandler('capabilityHeatmap')}
                isRegenerating={isCapabilityHeatmapRegenerating}
                status={capabilityHeatmapData ? 'completed' : 'error'}
                category="initial"
              >
                <div ref={capabilityHeatmapRef} data-component="capability-heatmap">
                  <CapabilityHeatmap
                    questions={questions}
                    userAnswers={userAnswers}
                    businessName={businessData.name}
                    onDataGenerated={(data) => {
                      setCapabilityHeatmapData(data);
                      if (data && data.capabilities && data.capabilities.length > 0) {
                        setIsCapabilityHeatmapReady(true);
                      }
                    }}
                    onRegenerate={createSimpleRegenerationHandler('capabilityHeatmap')}
                    isRegenerating={isCapabilityHeatmapRegenerating}
                    canRegenerate={!isAnalysisRegenerating}
                    capabilityHeatmapData={capabilityHeatmapData}
                    selectedBusinessId={selectedBusinessId}
                    onRedirectToBrief={handleRedirectToBrief}
                  />
                </div>
              </ModernAnalysisCard>
            )}

            {/* Porter's Five Forces Card */}
            <ModernAnalysisCard
              id="porters"
              title="Porter's Five Forces"
              description="Competitive analysis using Porter's strategic framework"
              icon={Target}
              hasData={!!portersData}
              onRegenerate={createSimpleRegenerationHandler('porters')}
              isRegenerating={isPortersRegenerating}
              status={portersData ? 'completed' : 'error'}
              category="initial"
            >
              <div ref={portersRef} data-component="porters-analysis">
                <PortersFiveForces
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onRegenerate={createSimpleRegenerationHandler('porters')}
                  isRegenerating={isPortersRegenerating}
                  canRegenerate={!isAnalysisRegenerating}
                  portersData={portersData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* PESTEL Analysis Card */}
            <ModernAnalysisCard
              id="pestel"
              title="PESTEL Analysis"
              description="External environment analysis covering political, economic, social, technological, environmental, and legal factors"
              icon={Target}
              hasData={!!pestelData}
              onRegenerate={createSimpleRegenerationHandler('pestel')}
              isRegenerating={isPestelRegenerating}
              status={pestelData ? 'completed' : 'error'}
              category="initial"
            >
              <div ref={pestelRef} data-component="pestel-analysis">
                <PestelAnalysis
                  questions={questions}
                  userAnswers={userAnswers}
                  businessName={businessData.name}
                  onRegenerate={createSimpleRegenerationHandler('pestel')}
                  isRegenerating={isPestelRegenerating}
                  canRegenerate={!isAnalysisRegenerating}
                  pestelData={pestelData}
                  selectedBusinessId={selectedBusinessId}
                  onRedirectToBrief={handleRedirectToBrief}
                />
              </div>
            </ModernAnalysisCard>

            {/* Essential Phase Components - Show only if unlocked */}
            {unlockedFeatures.fullSwot && (
              <>
                {/* Full SWOT Portfolio Card */}
                <ModernAnalysisCard
                  id="full-swot"
                  title="Full SWOT Portfolio"
                  description="Comprehensive SWOT analysis with strategic recommendations"
                  icon={Award}
                  hasData={!!fullSwotData}
                  onRegenerate={createSimpleRegenerationHandler('fullSwot')}
                  isRegenerating={isFullSwotRegenerating}
                  status={fullSwotData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={fullSwotRef} data-component="full-swot">
                    <FullSWOTPortfolio
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      isRegenerating={isFullSwotRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      fullSwotData={fullSwotData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      onRegenerate={createSimpleRegenerationHandler('fullSwot')}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Customer Segmentation Card */}
                <ModernAnalysisCard
                  id="customer-segmentation"
                  title="Customer Segmentation"
                  description="Detailed analysis of customer segments and personas"
                  icon={Award}
                  hasData={!!customerSegmentationData}
                  onRegenerate={createSimpleRegenerationHandler('customerSegmentation')}
                  isRegenerating={isCustomerSegmentationRegenerating}
                  status={customerSegmentationData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={customerSegmentationRef} data-component="customer-segmentation">
                    <CustomerSegmentation
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onDataGenerated={setCustomerSegmentationData}
                      onRegenerate={createSimpleRegenerationHandler('customerSegmentation')}
                      isRegenerating={isCustomerSegmentationRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      customerSegmentationData={customerSegmentationData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Competitive Advantage Card */}
                <ModernAnalysisCard
                  id="competitive-advantage"
                  title="Competitive Advantage Matrix"
                  description="Analysis of competitive positioning and advantages"
                  icon={Award}
                  hasData={!!competitiveAdvantageData}
                  onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
                  isRegenerating={isCompetitiveAdvantageRegenerating}
                  status={competitiveAdvantageData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={competitiveAdvantageRef} data-component="competitive-advantage">
                    <CompetitiveAdvantageMatrix
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      isRegenerating={isCompetitiveAdvantageRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      competitiveAdvantageData={competitiveAdvantageData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      onRegenerate={createSimpleRegenerationHandler('competitiveAdvantage')}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Channel Effectiveness Card */}
                <ModernAnalysisCard
                  id="channel-effectiveness"
                  title="Channel Effectiveness Map"
                  description="Analysis of channel performance and effectiveness"
                  icon={Award}
                  hasData={!!channelEffectivenessData}
                  onRegenerate={createSimpleRegenerationHandler('channelEffectiveness')}
                  isRegenerating={isChannelEffectivenessRegenerating}
                  status={channelEffectivenessData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={channelEffectivenessRef} data-component="channel-effectiveness">
                    <ChannelEffectivenessMap
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('channelEffectiveness')}
                      isRegenerating={isChannelEffectivenessRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      channelEffectivenessData={channelEffectivenessData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      isPhaseRegenerating={isAnalysisRegenerating}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Expanded Capability Heatmap Card */}
                <ModernAnalysisCard
                  id="expanded-capability"
                  title="Expanded Capability Heatmap"
                  description="Advanced organizational capability analysis"
                  icon={Award}
                  hasData={!!expandedCapabilityData}
                  onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
                  isRegenerating={isExpandedCapabilityRegenerating}
                  status={expandedCapabilityData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={expandedCapabilityRef} data-component="expanded-capability">
                    <ExpandedCapabilityHeatmap
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('expandedCapability')}
                      isRegenerating={isExpandedCapabilityRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      expandedCapabilityData={expandedCapabilityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Strategic Goals Card */}
                <ModernAnalysisCard
                  id="strategic-goals"
                  title="Strategic Goals"
                  description="Strategic goal setting and planning framework"
                  icon={Award}
                  hasData={!!strategicGoalsData}
                  onRegenerate={createSimpleRegenerationHandler('strategicGoals')}
                  isRegenerating={isStrategicGoalsRegenerating}
                  status={strategicGoalsData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={strategicGoalsRef} data-component="strategic-goals">
                    <StrategicGoals
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('strategicGoals')}
                      isRegenerating={isStrategicGoalsRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      strategicGoalsData={strategicGoalsData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Strategic Positioning Radar Card */}
                <ModernAnalysisCard
                  id="strategic-radar"
                  title="Strategic Positioning Radar"
                  description="Visual representation of strategic positioning across key dimensions"
                  icon={Award}
                  hasData={!!strategicRadarData}
                  onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
                  isRegenerating={isStrategicRadarRegenerating}
                  status={strategicRadarData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={strategicRadarRef} data-component="strategic-radar">
                    <StrategicPositioningRadar
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('strategicRadar')}
                      isRegenerating={isStrategicRadarRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      strategicRadarData={strategicRadarData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Organizational Culture Profile Card */}
                <ModernAnalysisCard
                  id="culture-profile"
                  title="Organizational Culture Profile"
                  description="Analysis of organizational culture and values"
                  icon={Award}
                  hasData={!!cultureProfileData}
                  onRegenerate={createSimpleRegenerationHandler('cultureProfile')}
                  isRegenerating={isCultureProfileRegenerating}
                  status={cultureProfileData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={cultureProfileRef} data-component="culture-profile">
                    <OrganizationalCultureProfile
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('cultureProfile')}
                      isRegenerating={isCultureProfileRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      cultureProfileData={cultureProfileData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Productivity Metrics Card */}
                <ModernAnalysisCard
                  id="productivity"
                  title="Productivity Metrics"
                  description="Analysis of organizational productivity and efficiency metrics"
                  icon={Award}
                  hasData={!!productivityData}
                  onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
                  isRegenerating={isProductivityRegenerating}
                  status={productivityData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={productivityRef} data-component="productivity">
                    <ProductivityMetrics
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('productivityMetrics')}
                      isRegenerating={isProductivityRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      productivityData={productivityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                      isPhaseRegenerating={isAnalysisRegenerating}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Maturity Score Card */}
                <ModernAnalysisCard
                  id="maturity"
                  title="Maturity Score"
                  description="Business maturity assessment and scoring"
                  icon={Award}
                  hasData={!!maturityData}
                  onRegenerate={createSimpleRegenerationHandler('maturityScore')}
                  isRegenerating={isMaturityRegenerating}
                  status={maturityData ? 'completed' : 'error'}
                  category="essential"
                >
                  <div ref={maturityScoreRef} data-component="maturity">
                    <MaturityScoreLight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('maturityScore')}
                      isRegenerating={isMaturityRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      maturityData={maturityData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>
              </>
            )}

            {/* Good Phase Components - Show only if unlocked */}
            {unlockedFeatures.goodPhase && (
              <>
                {/* Cost Efficiency Insight Card */}
                <ModernAnalysisCard
                  id="cost-efficiency"
                  title="Cost Efficiency Insight"
                  description="Unit economics and cost optimization analysis"
                  icon={TrendingDown}
                  hasData={!!costEfficiencyData}
                  onRegenerate={createSimpleRegenerationHandler('costEfficiency')}
                  isRegenerating={isCostEfficiencyRegenerating}
                  status={costEfficiencyData ? 'completed' : 'error'}
                  category="good"
                >
                  <div ref={costEfficiencyRef} data-component="cost-efficiency">
                    <CostEfficiencyInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('costEfficiency')}
                      isRegenerating={isCostEfficiencyRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      costEfficiencyData={costEfficiencyData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Financial Performance Card */}
                <ModernAnalysisCard
                  id="financial-performance"
                  title="Financial Performance & Growth Trajectory"
                  description="Multi-line chart with growth rate indicators and financial metrics analysis"
                  icon={TrendingUp}
                  hasData={!!financialPerformanceData}
                  onRegenerate={createSimpleRegenerationHandler('financialPerformance')}
                  isRegenerating={isFinancialPerformanceRegenerating}
                  status={financialPerformanceData ? 'completed' : 'error'}
                  category="good"
                >
                  <div ref={financialPerformanceRef} data-component="financial-performance">
                    <FinancialPerformance
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('financialPerformance')}
                      isRegenerating={isFinancialPerformanceRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      financialPerformanceData={financialPerformanceData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Financial Health Insight Card */}
                <ModernAnalysisCard
                  id="financial-health"
                  title="Financial Health Insight"
                  description="Balance sheet analysis with financial ratios and innovation investment tracking"
                  icon={DollarSign}
                  hasData={!!financialBalanceData}
                  onRegenerate={createSimpleRegenerationHandler('financialHealth')}
                  isRegenerating={isFinancialBalanceRegenerating}
                  status={financialBalanceData ? 'completed' : 'error'}
                  category="good"
                >
                  <div ref={financialBalanceRef} data-component="financial-health">
                    <FinancialBalanceInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('financialHealth')}
                      isRegenerating={isFinancialBalanceRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      financialBalanceData={financialBalanceData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>

                {/* Operational Efficiency Insight Card */}
                <ModernAnalysisCard
                  id="operational-efficiency"
                  title="Operational Efficiency Insight"
                  description="Resource utilization analysis with capability performance and efficiency trends"
                  icon={Zap}
                  hasData={!!operationalEfficiencyData}
                  onRegenerate={createSimpleRegenerationHandler('operationalEfficiency')}
                  isRegenerating={isOperationalEfficiencyRegenerating}
                  status={operationalEfficiencyData ? 'completed' : 'error'}
                  category="good"
                >
                  <div ref={operationalEfficiencyRef} data-component="operational-efficiency">
                    <OperationalEfficiencyInsight
                      questions={questions}
                      userAnswers={userAnswers}
                      businessName={businessData.name}
                      onRegenerate={createSimpleRegenerationHandler('operationalEfficiency')}
                      isRegenerating={isOperationalEfficiencyRegenerating}
                      canRegenerate={!isAnalysisRegenerating}
                      operationalEfficiencyData={operationalEfficiencyData}
                      selectedBusinessId={selectedBusinessId}
                      onRedirectToBrief={handleRedirectToBrief}
                    />
                  </div>
                </ModernAnalysisCard>
              </>
            )}

          </div>
        </div>
      </div>
    );
  };
  useEffect(() => {
    setSelectedDropdownValue("Go to Section");
  }, [selectedPhase]);
  const getPhaseSpecificOptions = (phase) => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    const baseOptions = {
      initial: [
        "Purchase Criteria",
        "Channel Heatmap",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ],
      essential: [
        "Purchase Criteria",
        "Channel Heatmap",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis",
        "Full SWOT Portfolio",
        "Customer Segmentation",
        "Competitive Advantage",
        "Channel Effectiveness",
        "Expanded Capability Heatmap",
        "Strategic Goals",
        "Strategic Positioning Radar",
        "Organizational Culture Profile",
        "Productivity Metrics",
        "Maturity Score"
      ],
      good: [
        "Purchase Criteria",
        "Channel Heatmap",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis",
        "Full SWOT Portfolio",
        "Customer Segmentation",
        "Competitive Advantage",
        "Channel Effectiveness",
        "Expanded Capability Heatmap",
        "Strategic Goals",
        "Strategic Positioning Radar",
        "Organizational Culture Profile",
        "Productivity Metrics",
        "Maturity Score",
        "Cost Efficiency Insight",
        "Financial Performance & Growth Trajectory",
        "Financial Health Insight",
        "Operational Efficiency Insight"
      ],
      advanced: [
        "Purchase Criteria",
        "Channel Heatmap",
        "Loyalty/NPS",
        "Porter's Five Forces",
        "PESTEL Analysis",
        "Full SWOT Portfolio",
        "Customer Segmentation",
        "Competitive Advantage",
        "Channel Effectiveness",
        "Expanded Capability Heatmap",
        "Strategic Goals",
        "Strategic Positioning Radar",
        "Organizational Culture Profile",
        "Productivity Metrics",
        "Maturity Score",
        "Cost Efficiency Insight",
        "Financial Performance & Growth Trajectory",
        "Financial Health Insight",
        "Operational Efficiency Insight"
      ]
    };

    // Add SWOT and Capability Heatmap only for initial phase when essential phase is not unlocked
    if (phase === 'initial' && !unlockedFeatures.fullSwot) {
      return [
        "SWOT",
        "Capability Heatmap",
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
  }; useEffect(() => {
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
  }, [phaseManager, hasAnalysisData, fullSwotData, costEfficiencyData, financialPerformanceData]);

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

  // Calculate progress
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
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "0",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#374151",
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
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
            onPhaseCompleted={async (phase, completedSet) => {
              console.log('ChatComponent phase completed:', phase);
            }}
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
                  <div className="desktop-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      position: "relative"
                    }}>
                      <button
                        className="back-button"
                        onClick={handleBackFromAnalysis}
                        aria-label="Go Back"
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#374151",
                          fontSize: "14px",
                          gap: "6px"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
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
                          Strategic
                        </button>
                      )}
                    </div>

                    {/* ADD THIS: Right side controls */}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {activeTab === "analysis" && (<><div ref={dropdownRef} className="dropdown-wrapper" style={{ position: "relative" }}>
                        <button
                          className="dropdown-button"
                          onClick={() => setShowDropdown(prev => !prev)}
                          style={{
                            backgroundColor: "#fff",
                            color: "#3b82f6",
                            border: "1px solid #e1e5e9",
                            borderRadius: "10px",
                            padding: "10px 18px",
                            fontSize: "14px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
                            minWidth: "180px",
                            justifyContent: "space-between"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          <span>{selectedDropdownValue}</span>
                          <ChevronDown
                            size={16}
                            style={{
                              marginLeft: 8,
                              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
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
                            <div style={{
                              position: "absolute",
                              top: "110%",
                              right: 0,
                              backgroundColor: "#fff",
                              border: "2px solid #e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                              minWidth: "220px",
                              zIndex: 1000,
                              maxHeight: "300px",
                              overflowY: "scroll",
                              backdropFilter: "blur(20px)"
                            }}>
                              {/* Phase Header */}
                              <div style={{
                                padding: "12px 16px",
                                backgroundColor: "#dbeafe",
                                borderBottom: "1px solid #e2e8f0",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#1e40af",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                {phaseLabels[currentPhase]} Sections
                              </div>

                              {/* Options */}
                              {options.map((item, index) => (
                                <div
                                  key={item}
                                  onClick={() => {
                                    handleOptionClick(item);
                                    setSelectedDropdownValue(item);
                                  }}
                                  style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    color: "#374151",
                                    fontWeight: 500,
                                    borderBottom: index < options.length - 1 ? "1px solid #f1f5f9" : "none",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#dbeafe";
                                    e.currentTarget.style.color = "#1e40af";
                                    e.currentTarget.style.paddingLeft = "20px";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#374151";
                                    e.currentTarget.style.paddingLeft = "16px";
                                  }}
                                >
                                  <span style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: "#3b82f6",
                                    flexShrink: 0
                                  }}></span>
                                  {item}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div> <PDFExportButton
                          className="pdf-export-button"
                          businessName={businessData.name}
                          onToastMessage={showToastMessage}
                          currentPhase={selectedPhase}
                          disabled={isAnalysisRegenerating}
                          isChannelHeatmapReady={isChannelHeatmapReady}
                          isCapabilityHeatmapReady={isCapabilityHeatmapReady}
                          // NEW: Add required props for dynamic phase detection
                          unlockedFeatures={unlockedFeatures}
                          fullSwotData={fullSwotData}
                          customerSegmentationData={customerSegmentationData}
                          competitiveAdvantageData={competitiveAdvantageData}
                          channelEffectivenessData={channelEffectivenessData}
                          expandedCapabilityData={expandedCapabilityData}
                          strategicGoalsData={strategicGoalsData}
                          strategicRadarData={strategicRadarData}
                          cultureProfileData={cultureProfileData}
                          productivityData={productivityData}
                          maturityData={maturityData}
                          costEfficiencyData={costEfficiencyData}
                          financialPerformanceData={financialPerformanceData}
                          financialBalanceData={financialBalanceData}
                          operationalEfficiencyData={operationalEfficiencyData}
                        />

                        {/* Regenerate All Button */}
                        <button
                          onClick={() => handleRegeneratePhase(getCurrentPhase())} // Use getCurrentPhase() instead of selectedPhase
                          disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
                          style={{
                            backgroundColor: (isAnalysisRegenerating) ? "#f3f4f6" : "#10b981",
                            color: (isAnalysisRegenerating) ? "#6b7280" : "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "10px 18px",
                            fontSize: "14px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            cursor: (isAnalysisRegenerating) ? "not-allowed" : "pointer",
                            gap: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                          }}
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
                        </button></>)}




                    </div>
                  </div>

                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {activeTab === "analysis" && renderModernAnalysisContent()}

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
              <div className="desktop-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0" }}>
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
                      Strategic
                    </button>
                  )}
                </div>

                {activeTab === "analysis" && unlockedFeatures.analysis && (
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      onClick={() => handleRegeneratePhase(getCurrentPhase())} // Use getCurrentPhase() instead of selectedPhase
                      disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
                      style={{
                        backgroundColor: (isAnalysisRegenerating) ? "#f3f4f6" : "#10b981",
                        color: (isAnalysisRegenerating) ? "#6b7280" : "#fff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 18px",
                        fontSize: "14px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        cursor: (isAnalysisRegenerating) ? "not-allowed" : "pointer",
                        gap: "8px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                      }}
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
                        isChannelEffectivenessRegenerating ||
                        isExpandedCapabilityRegenerating ||
                        isStrategicGoalsRegenerating ||
                        isStrategicRadarRegenerating ||
                        isCultureProfileRegenerating ||
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
                      <div style={{ padding: "1rem", background: "#ffffffff" }}>
                        <AnalysisControls />
                      </div>
                    )}

                    <div className="analysis-content">
                      {renderModernAnalysisContent()}
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