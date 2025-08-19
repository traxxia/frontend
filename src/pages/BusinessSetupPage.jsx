import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

// Import components
import ChatComponent from "../components/ChatComponent";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import StrategicAnalysis from "../components/StrategicAnalysis";
import PhaseManager from "../components/PhaseManager";
import AnalysisContentManager from "../components/AnalysisContentManager";

// Import existing hooks
import { useBusinessSetup } from '../hooks/useBusinessSetup';
import PhaseTabsComponent from '../components/PhaseTabsComponent';
import { extractBusinessName, showToastMessage as createToastMessage } from '../utils/businessHelpers';

import "../styles/businesspage.css";
import "../styles/business.css";
import RegenerateButton from "../components/RegenerateButton";
import PDFExportButton from "../components/PDFExportButton";

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

  const [apiLoadingStates, setApiLoadingStates] = useState({});
  const setApiLoading = (apiEndpoint, isLoading) => {
    setApiLoadingStates(prev => ({
      ...prev,
      [apiEndpoint]: isLoading
    }));
  };

  // Initialize simplified API service
  const apiService = new AnalysisApiService(
    ML_API_BASE_URL, 
    API_BASE_URL, 
    getAuthToken,
    setApiLoading // Pass the loading tracker function
  );


  // Use our custom hooks
  const state = useBusinessSetup(business, selectedBusinessId);
  const [currentPhase, setCurrentPhase] = useState('initial');
const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);

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

  // Create toast message helper
  const showToastMessage = createToastMessage(setShowToast);

  // NEW: Create state setters object for simplified API approach
  const stateSetters = {
    // Initial phase setters
    setSwotAnalysisResult,
    setPurchaseCriteriaData,
    setChannelHeatmapData,
    setLoyaltyNPSData,
    setCapabilityHeatmapData,
    setPortersData,
    setPestelData,

    // Essential phase setters
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

    // Good phase setters
    setCostEfficiencyData,
    setFinancialPerformanceData,
    setFinancialBalanceData,
    setOperationalEfficiencyData,
    uploadedFile: uploadedFileForAnalysis
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
    onAdvancedPhaseGeneration: () => handleRegeneratePhase('advanced'),
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
          throw apiError;
        }

      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        const errorMessage = error.message || `Failed to regenerate ${displayName}`;
        showToastMessage(errorMessage, "error");

      } finally {
        console.log(`Finishing regeneration for ${analysisType}`);
        setIsRegenerating(false);
        isRegeneratingRef.current = false;
      }
    };
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
  }, [phaseManager, hasAnalysisData, fullSwotData, costEfficiencyData, financialPerformanceData]);

  // Analysis Controls Component
  const AnalysisControls = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    const currentPhase = getCurrentPhase();

    return (
      <div className="analysis-controls-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={() => handleRegeneratePhase(getCurrentPhase())}
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
  onFileUploaded={setUploadedFileForAnalysis}
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

                    {/* Right side controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {activeTab === "analysis" && (
                        <>
                          <div ref={dropdownRef} className="dropdown-wrapper" style={{ position: "relative" }}>
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
                          </div>

                          <PDFExportButton
                            className="pdf-export-button"
                            businessName={businessData.name}
                            onToastMessage={showToastMessage}
                            currentPhase={currentPhase}
                            disabled={isAnalysisRegenerating}
                            isChannelHeatmapReady={isChannelHeatmapReady}
                            isCapabilityHeatmapReady={isCapabilityHeatmapReady}
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
                            onClick={() => handleRegeneratePhase(getCurrentPhase())}
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
                            style={{
                              backgroundColor: (isStrategicRegenerating || isAnalysisRegenerating) ? "#f3f4f6" : "#10b981",
                              color: (isStrategicRegenerating || isAnalysisRegenerating) ? "#6b7280" : "#fff",
                              border: "none",
                              borderRadius: "10px",
                              padding: "10px 18px",
                              fontSize: "14px",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              cursor: (isStrategicRegenerating || isAnalysisRegenerating) ? "not-allowed" : "pointer",
                              gap: "8px",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                            }}
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
                        <AnalysisContentManager
                          // Phase Manager
                          phaseManager={phaseManager}
 apiLoadingStates={apiLoadingStates}
                          // Business Data
                          businessData={businessData}
                          questions={questions}
                          userAnswers={userAnswers}
                          selectedBusinessId={selectedBusinessId}

                          // Analysis Data States
                          swotAnalysisResult={swotAnalysisResult}
                          customerSegmentationData={customerSegmentationData}
                          purchaseCriteriaData={purchaseCriteriaData}
                          channelHeatmapData={channelHeatmapData}
                          loyaltyNPSData={loyaltyNPSData}
                          capabilityHeatmapData={capabilityHeatmapData}
                          strategicData={strategicData}
                          portersData={portersData}
                          pestelData={pestelData}
                          fullSwotData={fullSwotData}
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

                          // Data Setters
                          setSwotAnalysisResult={setSwotAnalysisResult}
                          setCustomerSegmentationData={setCustomerSegmentationData}
                          setPurchaseCriteriaData={setPurchaseCriteriaData}
                          setChannelHeatmapData={setChannelHeatmapData}
                          setLoyaltyNPSData={setLoyaltyNPSData}
                          setCapabilityHeatmapData={setCapabilityHeatmapData}
                          setPortersData={setPortersData}
                          setPestelData={setPestelData}
                          setFullSwotData={setFullSwotData}
                          setCompetitiveAdvantageData={setCompetitiveAdvantageData}
                          setChannelEffectivenessData={setChannelEffectivenessData}
                          setExpandedCapabilityData={setExpandedCapabilityData}
                          setStrategicGoalsData={setStrategicGoalsData}
                          setStrategicRadarData={setStrategicRadarData}
                          setCultureProfileData={setCultureProfileData}
                          setProductivityData={setProductivityData}
                          setMaturityData={setMaturityData}
                          setCostEfficiencyData={setCostEfficiencyData}
                          setFinancialPerformanceData={setFinancialPerformanceData}
                          setFinancialBalanceData={setFinancialBalanceData}
                          setOperationalEfficiencyData={setOperationalEfficiencyData}

                          // Regenerating States
                          isSwotAnalysisRegenerating={isSwotAnalysisRegenerating}
                          isCustomerSegmentationRegenerating={isCustomerSegmentationRegenerating}
                          isPurchaseCriteriaRegenerating={isPurchaseCriteriaRegenerating}
                          isChannelHeatmapRegenerating={isChannelHeatmapRegenerating}
                          isLoyaltyNPSRegenerating={isLoyaltyNPSRegenerating}
                          isCapabilityHeatmapRegenerating={isCapabilityHeatmapRegenerating}
                          isPortersRegenerating={isPortersRegenerating}
                          isPestelRegenerating={isPestelRegenerating}
                          isFullSwotRegenerating={isFullSwotRegenerating}
                          isCompetitiveAdvantageRegenerating={isCompetitiveAdvantageRegenerating}
                          isChannelEffectivenessRegenerating={isChannelEffectivenessRegenerating}
                          isExpandedCapabilityRegenerating={isExpandedCapabilityRegenerating}
                          isStrategicGoalsRegenerating={isStrategicGoalsRegenerating}
                          isStrategicRadarRegenerating={isStrategicRadarRegenerating}
                          isCultureProfileRegenerating={isCultureProfileRegenerating}
                          isProductivityRegenerating={isProductivityRegenerating}
                          isMaturityRegenerating={isMaturityRegenerating}
                          isCostEfficiencyRegenerating={isCostEfficiencyRegenerating}
                          isFinancialPerformanceRegenerating={isFinancialPerformanceRegenerating}
                          isFinancialBalanceRegenerating={isFinancialBalanceRegenerating}
                          isOperationalEfficiencyRegenerating={isOperationalEfficiencyRegenerating}

                          // Other States
                          isAnalysisRegenerating={isAnalysisRegenerating}
                          isChannelHeatmapReady={isChannelHeatmapReady}
                          setIsChannelHeatmapReady={setIsChannelHeatmapReady}
                          isCapabilityHeatmapReady={isCapabilityHeatmapReady}
                          setIsCapabilityHeatmapReady={setIsCapabilityHeatmapReady}

                          // Refs
                          swotRef={swotRef}
                          customerSegmentationRef={customerSegmentationRef}
                          purchaseCriteriaRef={purchaseCriteriaRef}
                          channelHeatmapRef={channelHeatmapRef}
                          loyaltyNpsRef={loyaltyNpsRef}
                          capabilityHeatmapRef={capabilityHeatmapRef}
                          portersRef={portersRef}
                          pestelRef={pestelRef}
                          fullSwotRef={fullSwotRef}
                          competitiveAdvantageRef={competitiveAdvantageRef}
                          channelEffectivenessRef={channelEffectivenessRef}
                          expandedCapabilityRef={expandedCapabilityRef}
                          strategicGoalsRef={strategicGoalsRef}
                          strategicRadarRef={strategicRadarRef}
                          cultureProfileRef={cultureProfileRef}
                          productivityRef={productivityRef}
                          maturityScoreRef={maturityScoreRef}
                          costEfficiencyRef={costEfficiencyRef}
                          financialPerformanceRef={financialPerformanceRef}
                          financialBalanceRef={financialBalanceRef}
                          operationalEfficiencyRef={operationalEfficiencyRef}

                          // Handlers
                          handleRedirectToBrief={handleRedirectToBrief}
                          showToastMessage={showToastMessage}
                          apiService={apiService}
                          createSimpleRegenerationHandler={createSimpleRegenerationHandler}
                        />
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
                      onClick={() => handleRegeneratePhase(getCurrentPhase())}
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
                      <AnalysisContentManager
                        // Phase Manager
                        phaseManager={phaseManager}

                        // Business Data
                        businessData={businessData}
                        questions={questions}
                        userAnswers={userAnswers}
                        selectedBusinessId={selectedBusinessId}

                        // Analysis Data States
                        swotAnalysisResult={swotAnalysisResult}
                        customerSegmentationData={customerSegmentationData}
                        purchaseCriteriaData={purchaseCriteriaData}
                        channelHeatmapData={channelHeatmapData}
                        loyaltyNPSData={loyaltyNPSData}
                        capabilityHeatmapData={capabilityHeatmapData}
                        strategicData={strategicData}
                        portersData={portersData}
                        pestelData={pestelData}
                        fullSwotData={fullSwotData}
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

                        // Data Setters
                        setSwotAnalysisResult={setSwotAnalysisResult}
                        setCustomerSegmentationData={setCustomerSegmentationData}
                        setPurchaseCriteriaData={setPurchaseCriteriaData}
                        setChannelHeatmapData={setChannelHeatmapData}
                        setLoyaltyNPSData={setLoyaltyNPSData}
                        setCapabilityHeatmapData={setCapabilityHeatmapData}
                        setPortersData={setPortersData}
                        setPestelData={setPestelData}
                        setFullSwotData={setFullSwotData}
                        setCompetitiveAdvantageData={setCompetitiveAdvantageData}
                        setChannelEffectivenessData={setChannelEffectivenessData}
                        setExpandedCapabilityData={setExpandedCapabilityData}
                        setStrategicGoalsData={setStrategicGoalsData}
                        setStrategicRadarData={setStrategicRadarData}
                        setCultureProfileData={setCultureProfileData}
                        setProductivityData={setProductivityData}
                        setMaturityData={setMaturityData}
                        setCostEfficiencyData={setCostEfficiencyData}
                        setFinancialPerformanceData={setFinancialPerformanceData}
                        setFinancialBalanceData={setFinancialBalanceData}
                        setOperationalEfficiencyData={setOperationalEfficiencyData}

                        // Regenerating States
                        isSwotAnalysisRegenerating={isSwotAnalysisRegenerating}
                        isCustomerSegmentationRegenerating={isCustomerSegmentationRegenerating}
                        isPurchaseCriteriaRegenerating={isPurchaseCriteriaRegenerating}
                        isChannelHeatmapRegenerating={isChannelHeatmapRegenerating}
                        isLoyaltyNPSRegenerating={isLoyaltyNPSRegenerating}
                        isCapabilityHeatmapRegenerating={isCapabilityHeatmapRegenerating}
                        isPortersRegenerating={isPortersRegenerating}
                        isPestelRegenerating={isPestelRegenerating}
                        isFullSwotRegenerating={isFullSwotRegenerating}
                        isCompetitiveAdvantageRegenerating={isCompetitiveAdvantageRegenerating}
                        isChannelEffectivenessRegenerating={isChannelEffectivenessRegenerating}
                        isExpandedCapabilityRegenerating={isExpandedCapabilityRegenerating}
                        isStrategicGoalsRegenerating={isStrategicGoalsRegenerating}
                        isStrategicRadarRegenerating={isStrategicRadarRegenerating}
                        isCultureProfileRegenerating={isCultureProfileRegenerating}
                        isProductivityRegenerating={isProductivityRegenerating}
                        isMaturityRegenerating={isMaturityRegenerating}
                        isCostEfficiencyRegenerating={isCostEfficiencyRegenerating}
                        isFinancialPerformanceRegenerating={isFinancialPerformanceRegenerating}
                        isFinancialBalanceRegenerating={isFinancialBalanceRegenerating}
                        isOperationalEfficiencyRegenerating={isOperationalEfficiencyRegenerating}

                        // Other States
                        isAnalysisRegenerating={isAnalysisRegenerating}
                        isChannelHeatmapReady={isChannelHeatmapReady}
                        setIsChannelHeatmapReady={setIsChannelHeatmapReady}
                        isCapabilityHeatmapReady={isCapabilityHeatmapReady}
                        setIsCapabilityHeatmapReady={setIsCapabilityHeatmapReady}

                        // Refs
                        swotRef={swotRef}
                        customerSegmentationRef={customerSegmentationRef}
                        purchaseCriteriaRef={purchaseCriteriaRef}
                        channelHeatmapRef={channelHeatmapRef}
                        loyaltyNpsRef={loyaltyNpsRef}
                        capabilityHeatmapRef={capabilityHeatmapRef}
                        portersRef={portersRef}
                        pestelRef={pestelRef}
                        fullSwotRef={fullSwotRef}
                        competitiveAdvantageRef={competitiveAdvantageRef}
                        channelEffectivenessRef={channelEffectivenessRef}
                        expandedCapabilityRef={expandedCapabilityRef}
                        strategicGoalsRef={strategicGoalsRef}
                        strategicRadarRef={strategicRadarRef}
                        cultureProfileRef={cultureProfileRef}
                        productivityRef={productivityRef}
                        maturityScoreRef={maturityScoreRef}
                        costEfficiencyRef={costEfficiencyRef}
                        financialPerformanceRef={financialPerformanceRef}
                        financialBalanceRef={financialBalanceRef}
                        operationalEfficiencyRef={operationalEfficiencyRef}

                        // Handlers
                        handleRedirectToBrief={handleRedirectToBrief}
                        showToastMessage={showToastMessage}
                        apiService={apiService}
                        createSimpleRegenerationHandler={createSimpleRegenerationHandler}
                      />
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