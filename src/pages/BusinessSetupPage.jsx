// BusinessSetupPage.jsx - Complete Minimized Version
import React, { useEffect, useRef } from "react";
import { ArrowLeft, Loader, RefreshCw } from "lucide-react";
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

// Import our refactored components and hooks
import { useBusinessSetup } from '../hooks/useBusinessSetup';
import { useAnalysisService } from '../hooks/useAnalysisService';
import PhaseTabsComponent from '../components/PhaseTabsComponent';
import { extractBusinessName, showToastMessage as createToastMessage } from '../utils/businessHelpers';

import "../styles/businesspage.css";

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

  // Use our custom hooks
  const state = useBusinessSetup(business, selectedBusinessId);
  const { apiService, generateInitialPhaseAnalyses, generateEssentialPhaseAnalyses, createRegenerationHandler } =
    useAnalysisService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

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
    // Refs
    swotRef, customerSegmentationRef, purchaseCriteriaRef, channelHeatmapRef,
    loyaltyNpsRef, capabilityHeatmapRef, dropdownRef, isRegeneratingRef,
    portersRef, pestelRef, fullSwotRef, competitiveAdvantageRef,
    cultureProfileRef, productivityRef, maturityScoreRef, strategicGoalsRef,
    strategicRadarRef, expandedCapabilityRef, channelEffectivenessRef
  } = state;
  const hasLoadedAnalysis = useRef(false);
  // Create toast message helper
  const showToastMessage = createToastMessage(setShowToast);

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

  // Phase completion handlers using API service
  const regenerateAllAnalysisForCompletion = async () => {
    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      showToastMessage("Initial phase completed! Generating analysis...", "info");

      // Clear existing data
      clearAllAnalysisData();

      // Get fresh data
      const { freshAnswers } = await apiService.getFreshConversationData(selectedBusinessId);
      setUserAnswers(prev => ({ ...prev, ...freshAnswers }));

      // Generate all initial phase analyses
      const setters = {
        setSwotAnalysisResult, setPurchaseCriteriaData, setLoyaltyNPSData,
        setChannelHeatmapData, setCapabilityHeatmapData, setStrategicData,
        setPortersData, setPestelData
      };

      const results = await generateInitialPhaseAnalyses(questions, freshAnswers, selectedBusinessId, setters);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${results.length - failures.length}/${results.length} analyses completed successfully.`,
          failures.length < results.length ? "warning" : "error"
        );
      } else {
        showToastMessage("All analysis components generated successfully!", "success");
      }

    } catch (error) {
      console.error('Error generating analysis:', error);
      showToastMessage("Failed to generate analysis components. Please try again.", "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
    }
  };

  const generateFullSwotPortfolioForCompletion = async () => {
    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
      // Set all essential phase regenerating states
      setIsFullSwotRegenerating(true);
      setIsCompetitiveAdvantageRegenerating(true);
      setIsChannelEffectivenessRegenerating(true);
      setIsExpandedCapabilityRegenerating(true);
      setIsStrategicGoalsRegenerating(true);
      setIsStrategicRadarRegenerating(true);
      setIsCultureProfileRegenerating(true);
      setIsProductivityRegenerating(true);
      setIsMaturityRegenerating(true);
      setIsCustomerSegmentationRegenerating(true);
      setIsStrategicRegenerating(true);

      showToastMessage("Essential phase completed! Generating all essential analyses...", "info");

      // Clear existing essential data
      clearEssentialAnalysisData();

      // Get fresh data
      const { freshAnswers } = await apiService.getFreshConversationData(selectedBusinessId);
      setUserAnswers(prev => ({ ...prev, ...freshAnswers }));

      // Generate all essential phase analyses
      const setters = {
        setFullSwotData, setCustomerSegmentationData, setCompetitiveAdvantageData,
        setChannelEffectivenessData, setExpandedCapabilityData, setStrategicGoalsData,
        setStrategicRadarData, setCultureProfileData, setProductivityData,
        setMaturityData, setStrategicData
      };

      const results = await generateEssentialPhaseAnalyses(questions, freshAnswers, selectedBusinessId, setters);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${results.length - failures.length}/${results.length} essential analyses completed successfully.`,
          failures.length < results.length ? "warning" : "error"
        );
      } else {
        showToastMessage("All essential phase analyses generated successfully!", "success");
      }

    } catch (error) {
      console.error('Error generating essential phase analysis:', error);
      showToastMessage("Failed to generate essential phase analysis. Please try again.", "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsFullSwotRegenerating(false);
      setIsCompetitiveAdvantageRegenerating(false);
      setIsChannelEffectivenessRegenerating(false);
      setIsExpandedCapabilityRegenerating(false);
      setIsStrategicGoalsRegenerating(false);
      setIsStrategicRadarRegenerating(false);
      setIsCultureProfileRegenerating(false);
      setIsProductivityRegenerating(false);
      setIsMaturityRegenerating(false);
      setIsCustomerSegmentationRegenerating(false);
      setIsStrategicRegenerating(false);
    }
  };

  // Clear analysis data functions
  const clearAllAnalysisData = () => {
    setSwotAnalysisResult("");
    setPurchaseCriteriaData(null);
    setChannelHeatmapData(null);
    setLoyaltyNPSData(null);
    setCapabilityHeatmapData(null);
    setStrategicData(null);
    setPortersData(null);
    setPestelData(null);
  };

  const clearEssentialAnalysisData = () => {
    setFullSwotData(null);
    setCompetitiveAdvantageData(null);
    setChannelEffectivenessData(null);
    setExpandedCapabilityData(null);
    setStrategicGoalsData(null);
    setStrategicRadarData(null);
    setCultureProfileData(null);
    setProductivityData(null);
    setMaturityData(null);
    setCustomerSegmentationData(null);
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
          'channelEffectiveness': () => setChannelEffectivenessData(analysis_data)
        };

        const setter = setterMap[analysis_type];
        if (setter) setter();
      });

      setHasAnalysisData(hasAnyAnalysis);
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };

  // Initialize PhaseManager
  const phaseManager = PhaseManager({
    questions, questionsLoaded, completedQuestions, userAnswers, selectedBusinessId,
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      setCompletedQuestions(completedSet);
      setUserAnswers(prev => ({ ...prev, ...answersMap }));
    },
    onCompletedPhasesUpdate: (phases) => { },
    onAnalysisGeneration: regenerateAllAnalysisForCompletion,
    onFullSwotGeneration: generateFullSwotPortfolioForCompletion,
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL, getAuthToken
  });

  // Main regeneration function
  const regenerateAllAnalysis = async (updatedQuestionId = null, updatedAnswer = null, forceRegenerate = false) => {
    if (!phaseManager.canRegenerateAnalysis() && !forceRegenerate) {
      showToastMessage("Initial phase must be completed to regenerate analysis.", "warning");
      return;
    }

    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);

      if (forceRegenerate || (updatedQuestionId && updatedAnswer)) {
        showToastMessage(`Regenerating all ${selectedPhase} phase analysis components...`, "info");
      }

      // Clear data based on current phase
      if (selectedPhase === 'initial') {
        clearAllAnalysisData();
      } else if (selectedPhase === 'essential') {
        clearEssentialAnalysisData();
        setStrategicData(null); // Also regenerate strategic for essential phase
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      let answersToUse = { ...userAnswers };
      if (updatedQuestionId && updatedAnswer) {
        answersToUse[updatedQuestionId] = updatedAnswer;
      }

      let results;
      if (selectedPhase === 'initial') {
        const setters = {
          setSwotAnalysisResult, setPurchaseCriteriaData, setLoyaltyNPSData,
          setChannelHeatmapData, setCapabilityHeatmapData, setStrategicData,
          setPortersData, setPestelData
        };
        results = await generateInitialPhaseAnalyses(questions, answersToUse, selectedBusinessId, setters);
      } else if (selectedPhase === 'essential') {
        const setters = {
          setFullSwotData, setCustomerSegmentationData, setCompetitiveAdvantageData,
          setChannelEffectivenessData, setExpandedCapabilityData, setStrategicGoalsData,
          setStrategicRadarData, setCultureProfileData, setProductivityData,
          setMaturityData, setStrategicData
        };
        results = await generateEssentialPhaseAnalyses(questions, answersToUse, selectedBusinessId, setters);
      }

      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${results.length - failures.length}/${results.length} ${selectedPhase} phase analyses completed successfully.`,
          failures.length < results.length ? "warning" : "error"
        );
      } else {
        if (forceRegenerate || (updatedQuestionId && updatedAnswer)) {
          showToastMessage(`All ${selectedPhase} phase analysis components regenerated successfully!`, "success");
        }
      }

    } catch (error) {
      console.error('Error regenerating all analysis:', error);
      showToastMessage(`Failed to regenerate ${selectedPhase} phase analysis components. Please try again.`, "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
    }
  };

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

  const handleQuestionCompleted = async (questionId) => {
    const newCompletedSet = new Set([...completedQuestions, questionId]);
    setCompletedQuestions(newCompletedSet);

    // Check phases AFTER updating state
    setTimeout(async () => {
      const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
      const essentialQuestions = questions.filter(q => q.phase === 'essential');

      const completedInitial = initialQuestions.filter(q => newCompletedSet.has(q._id));
      const completedEssential = essentialQuestions.filter(q => newCompletedSet.has(q._id));

      const completedQuestion = questions.find(q => q._id === questionId);
      const completedQuestionPhase = completedQuestion?.phase;

      // Check initial phase completion
      if (completedQuestionPhase === 'initial' &&
        initialQuestions.length > 0 &&
        completedInitial.length === initialQuestions.length &&
        !hasAnalysisData) {
        await regenerateAllAnalysisForCompletion();
      }

      // Check essential phase completion  
      if (completedQuestionPhase === 'essential' &&
        essentialQuestions.length > 0 &&
        completedEssential.length === essentialQuestions.length &&
        (!fullSwotData || !competitiveAdvantageData)) {
        await generateFullSwotPortfolioForCompletion();
      }
    }, 100);

    return newCompletedSet;
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
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("analysis");
        setTimeout(() => setIsSliding(false), 1000);
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
        setTimeout(() => setIsSliding(false), 1000);
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
      setTimeout(() => setIsSliding(false), 1000);
    }
  };

  const handleBack = () => window.history.back();

  // Handle option click for dropdown navigation
  const handleOptionClick = (option) => {
    setShowDropdown(false);

    setTimeout(() => {
      const refMap = {
        // Initial Phase Refs
        "SWOT": swotRef, "Purchase Criteria": purchaseCriteriaRef,
        "Channel Heatmap": channelHeatmapRef, "Loyalty/NPS": loyaltyNpsRef,
        "Capability Heatmap": capabilityHeatmapRef, "Porter's Five Forces": portersRef,
        "PESTEL Analysis": pestelRef,
        // Essential Phase Refs
        "Full SWOT Portfolio": fullSwotRef, "Customer Segmentation": customerSegmentationRef,
        "Competitive Advantage": competitiveAdvantageRef, "Channel Effectiveness": channelEffectivenessRef,
        "Expanded Capability Heatmap": expandedCapabilityRef, "Strategic Goals": strategicGoalsRef,
        "Strategic Positioning Radar": strategicRadarRef, "Organizational Culture Profile": cultureProfileRef,
        "Productivity Metrics": productivityRef, "Maturity Score": maturityScoreRef
      };

      const targetRef = refMap[option];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Effects
  useEffect(() => {
    if (selectedBusinessId && questionsLoaded && questions.length > 0 && !hasLoadedAnalysis.current) {
      hasLoadedAnalysis.current = true;
      setTimeout(() => {
        phaseManager.loadExistingAnalysis();
      }, 100);
    }
  }, [selectedBusinessId, questionsLoaded, questions.length]);

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

  // Analysis Controls Component
  const AnalysisControls = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    return (
      <div className="analysis-controls-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={() => regenerateAllAnalysis(null, null, true)}
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
              Regenerating {selectedPhase}...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Regenerate All {selectedPhase === 'initial' ? 'Initial' : 'Essential'}
            </>
          )}
        </button>
      </div>
    );
  };

  // Render Analysis Content
  const renderAnalysisContent = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();

    if (!unlockedFeatures.analysis) {
      return (
        <div className="locked-analysis">
          <div className="lock-icon">🔒</div>
          <h3>Analysis Locked</h3>
          <p>Complete all initial phase questions to unlock your business analysis.</p>
        </div>
      );
    }

    if (isAnalysisRegenerating) {
      return (
        <div className="analysis-loading">
          <Loader size={24} className="spinner" />
          <span>Regenerating all analysis...</span>
        </div>
      );
    }

    // Initial Phase Components
    const initialPhaseComponents = (
      <div id="analysis-pdf-content" style={{ backgroundColor: 'white' }}>
        <div ref={swotRef}>
          <SwotAnalysis
            analysisResult={swotAnalysisResult}
            businessName={businessData.name}
            questions={questions}
            userAnswers={userAnswers}
            saveAnalysisToBackend={(data, type) => apiService.saveAnalysisToBackend(data, type, selectedBusinessId)}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={purchaseCriteriaRef}>
          <PurchaseCriteria
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setPurchaseCriteriaData}
            onRegenerate={createRegenerationHandler(
              'purchaseCriteria', 'purchase-criteria', 'purchaseCriteria',
              setPurchaseCriteriaData, 'Purchase criteria', setIsPurchaseCriteriaRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isPurchaseCriteriaRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            purchaseCriteriaData={purchaseCriteriaData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={channelHeatmapRef}>
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
            onRegenerate={createRegenerationHandler(
              'channelHeatmap', 'channel-heatmap', 'channelHeatmap',
              setChannelHeatmapData, 'Channel heatmap', setIsChannelHeatmapRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isChannelHeatmapRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            channelHeatmapData={channelHeatmapData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={loyaltyNpsRef}>
          <LoyaltyNPS
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setLoyaltyNPSData}
            onRegenerate={createRegenerationHandler(
              'loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics',
              setLoyaltyNPSData, 'Loyalty NPS', setIsLoyaltyNPSRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isLoyaltyNPSRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            loyaltyNPSData={loyaltyNPSData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={capabilityHeatmapRef}>
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
            onRegenerate={createRegenerationHandler(
              'capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap',
              setCapabilityHeatmapData, 'Capability heatmap', setIsCapabilityHeatmapRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isCapabilityHeatmapRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            capabilityHeatmapData={capabilityHeatmapData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={portersRef}>
          <PortersFiveForces
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createRegenerationHandler(
              'porters', 'porters-five-forces', 'porters',
              setPortersData, 'Porter\'s Five Forces', setIsPortersRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isPortersRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            portersData={portersData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>

        <div ref={pestelRef}>
          <PestelAnalysis
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createRegenerationHandler(
              'pestel', 'pestel-analysis', 'pestel',
              setPestelData, 'PESTEL Analysis', setIsPestelRegenerating,
              questions, userAnswers, selectedBusinessId, showToastMessage
            )}
            isRegenerating={isPestelRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            pestelData={pestelData}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
          />
        </div>
      </div>
    );

    // Essential Phase Components
    const essentialPhaseComponents = (
      <div id="analysis-pdf-content" style={{ backgroundColor: 'white' }}>
        {unlockedFeatures.fullSwot && (
          <>
            <div ref={fullSwotRef}>
              <FullSWOTPortfolio
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                canRegenerate={true}
                fullSwotData={fullSwotData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={customerSegmentationRef}>
              <CustomerSegmentation
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onDataGenerated={setCustomerSegmentationData}
                onRegenerate={createRegenerationHandler(
                  'customerSegmentation', 'customer-segment', 'customerSegmentation',
                  setCustomerSegmentationData, 'Customer segmentation', setIsCustomerSegmentationRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isCustomerSegmentationRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                customerSegmentationData={customerSegmentationData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={competitiveAdvantageRef}>
              <CompetitiveAdvantageMatrix
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                canRegenerate={true}
                competitiveAdvantageData={competitiveAdvantageData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={channelEffectivenessRef}>
              <ChannelEffectivenessMap
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'channelEffectiveness', 'channel-effectiveness', 'channelEffectiveness',
                  setChannelEffectivenessData, 'Channel Effectiveness Map', setIsChannelEffectivenessRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isChannelEffectivenessRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                channelEffectivenessData={channelEffectivenessData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={expandedCapabilityRef}>
              <ExpandedCapabilityHeatmap
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'expandedCapability', 'expanded-capability-heatmap', 'expandedCapabilityHeatmap',
                  setExpandedCapabilityData, 'Expanded Capability Heatmap', setIsExpandedCapabilityRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isExpandedCapabilityRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                expandedCapabilityData={expandedCapabilityData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={strategicGoalsRef}>
              <StrategicGoals
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'strategicGoals', 'strategic-goals', 'strategicGoals',
                  setStrategicGoalsData, 'Strategic Goals', setIsStrategicGoalsRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isStrategicGoalsRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                strategicGoalsData={strategicGoalsData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={strategicRadarRef}>
              <StrategicPositioningRadar
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'strategicRadar', 'strategic-positioning-radar', 'strategicRadar',
                  setStrategicRadarData, 'Strategic Positioning Radar', setIsStrategicRadarRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isStrategicRadarRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                strategicRadarData={strategicRadarData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={cultureProfileRef}>
              <OrganizationalCultureProfile
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'cultureProfile', 'culture-profile', 'cultureProfile',
                  setCultureProfileData, 'Organizational Culture Profile', setIsCultureProfileRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isCultureProfileRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                cultureProfileData={cultureProfileData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={productivityRef}>
              <ProductivityMetrics
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'productivityMetrics', 'productivity-metrics', 'productivityMetrics',
                  setProductivityData, 'Productivity Metrics', setIsProductivityRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isProductivityRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                productivityData={productivityData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>

            <div ref={maturityScoreRef}>
              <MaturityScoreLight
                questions={questions}
                userAnswers={userAnswers}
                businessName={businessData.name}
                onRegenerate={createRegenerationHandler(
                  'maturityScore', 'maturity-scoring', 'maturityScore',
                  setMaturityData, 'Maturity Score', setIsMaturityRegenerating,
                  questions, userAnswers, selectedBusinessId, showToastMessage
                )}
                isRegenerating={isMaturityRegenerating}
                canRegenerate={!isAnalysisRegenerating}
                maturityData={maturityData}
                selectedBusinessId={selectedBusinessId}
                onRedirectToBrief={handleRedirectToBrief}
              />
            </div>
          </>
        )}
      </div>
    );

    return (
      <div>
        <PhaseTabsComponent
          phaseManager={phaseManager}
          selectedPhase={selectedPhase}
          setSelectedPhase={setSelectedPhase}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          dropdownRef={dropdownRef}
          handleOptionClick={handleOptionClick}
          businessData={businessData}
          showToastMessage={showToastMessage}
          isAnalysisRegenerating={isAnalysisRegenerating}
          isChannelHeatmapReady={isChannelHeatmapReady}
          isCapabilityHeatmapReady={isCapabilityHeatmapReady}
          t={t}
        />
        {selectedPhase === 'initial' && initialPhaseComponents}
        {selectedPhase === 'essential' && essentialPhaseComponents}
      </div>
    );
  };

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
        className={`main-container ${isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""} ${isSliding ? "sliding" : ""}`}
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
                  transition: "background-color 0.2s ease"
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
                          transition: "background-color 0.2s ease",
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

                    {activeTab === "analysis" && unlockedFeatures.analysis && (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <button
                          onClick={() => regenerateAllAnalysis(null, null, true)}
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
                            transition: "all 0.2s ease",
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

                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {activeTab === "analysis" && (
                        <div className="analysis-section">
                          <div className="analysis-content">
                            {renderAnalysisContent()}
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
                      onClick={() => regenerateAllAnalysis(null, null, true)}
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
                        transition: "all 0.2s ease",
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
                      onAnalysisRegenerate={regenerateAllAnalysis}
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
                      {renderAnalysisContent()}
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