import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader, RefreshCw, ChevronDown } from "lucide-react";
import ChatComponent from "../components/ChatComponent";
import SwotAnalysis from "../components/SwotAnalysis";
import "../styles/businesspage.css";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import CustomerSegmentation from "../components/CustomerSegmentation";
import PurchaseCriteria from "../components/PurchaseCriteria";
import ChannelHeatmap from "../components/ChannelHeatmap";
import LoyaltyNPS from "../components/LoyaltyNPS";
import CapabilityHeatmap from "../components/CapabilityHeatmap";
import PDFExportButton from "../components/PDFExportButton";
import { useTranslation } from "../hooks/useTranslation";
import { useLocation } from 'react-router-dom';
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

  // UI State
  const [activeTab, setActiveTab] = useState(() => {
    const isMobileView = window.innerWidth <= 768;
    return isMobileView ? "chat" : "brief";
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // Data State
  const [questions, setQuestions] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [businessData, setBusinessData] = useState({
    name: business?.business_name || "",
    whatWeDo: business?.business_purpose || "",
    products: "",
    targetAudience: "",
    uniqueValue: "",
  });

  // Analysis State
  const [hasAnalysisData, setHasAnalysisData] = useState(false);
  const [isAnalysisRegenerating, setIsAnalysisRegenerating] = useState(false);
  const [swotAnalysisResult, setSwotAnalysisResult] = useState("");
  const [customerSegmentationData, setCustomerSegmentationData] = useState(null);
  const [purchaseCriteriaData, setPurchaseCriteriaData] = useState(null);
  const [channelHeatmapData, setChannelHeatmapData] = useState(null);
  const [loyaltyNPSData, setLoyaltyNPSData] = useState(null);
  const [capabilityHeatmapData, setCapabilityHeatmapData] = useState(null);
  const [strategicData, setStrategicData] = useState(null);
  const [portersData, setPortersData] = useState(null);
  const [pestelData, setPestelData] = useState(null);
  const [fullSwotData, setFullSwotData] = useState(null);
  const competitiveAdvantageRef = useRef(null);
  const [competitiveAdvantageData, setCompetitiveAdvantageData] = useState(null);
  const [isCompetitiveAdvantageRegenerating, setIsCompetitiveAdvantageRegenerating] = useState(false);

  // Individual component regenerating states
  const [isCustomerSegmentationRegenerating, setIsCustomerSegmentationRegenerating] = useState(false);
  const [isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating] = useState(false);
  const [isChannelHeatmapRegenerating, setIsChannelHeatmapRegenerating] = useState(false);
  const [isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating] = useState(false);
  const [isCapabilityHeatmapRegenerating, setIsCapabilityHeatmapRegenerating] = useState(false);
  const [isStrategicRegenerating, setIsStrategicRegenerating] = useState(false);
  const [isPortersRegenerating, setIsPortersRegenerating] = useState(false);
  const [isPestelRegenerating, setIsPestelRegenerating] = useState(false);
  const [isFullSwotRegenerating, setIsFullSwotRegenerating] = useState(false);
  const [channelEffectivenessData, setChannelEffectivenessData] = useState(null);
  const [isChannelEffectivenessRegenerating, setIsChannelEffectivenessRegenerating] = useState(false);
  const [expandedCapabilityData, setExpandedCapabilityData] = useState(null);
  const [isExpandedCapabilityRegenerating, setIsExpandedCapabilityRegenerating] = useState(false);
  const [strategicGoalsData, setStrategicGoalsData] = useState(null);
  const [isStrategicGoalsRegenerating, setIsStrategicGoalsRegenerating] = useState(false);
  const [strategicRadarData, setStrategicRadarData] = useState(null);
  const [isStrategicRadarRegenerating, setIsStrategicRadarRegenerating] = useState(false);
  const [cultureProfileData, setCultureProfileData] = useState(null);
  const [isCultureProfileRegenerating, setIsCultureProfileRegenerating] = useState(false);
  const [productivityData, setProductivityData] = useState(null);
  const [isProductivityRegenerating, setIsProductivityRegenerating] = useState(false);
  const [maturityData, setMaturityData] = useState(null);
  const [isMaturityRegenerating, setIsMaturityRegenerating] = useState(false);
  const [highlightedMissingQuestions, setHighlightedMissingQuestions] = useState(null);

  // Refs
  const cultureProfileRef = useRef(null);
  const productivityRef = useRef(null);
  const maturityScoreRef = useRef(null);
  const strategicGoalsRef = useRef(null);
  const strategicRadarRef = useRef(null);
  const expandedCapabilityRef = useRef(null);
  const channelEffectivenessRef = useRef(null);

  const [selectedPhase, setSelectedPhase] = useState('initial');
  // Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState(() => t('goToSection') || 'Go to Section');

  // Toast State
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Refs
  const swotRef = useRef(null);
  const customerSegmentationRef = useRef(null);
  const purchaseCriteriaRef = useRef(null);
  const channelHeatmapRef = useRef(null);
  const loyaltyNpsRef = useRef(null);
  const capabilityHeatmapRef = useRef(null);
  const dropdownRef = useRef(null);
  const isRegeneratingRef = useRef(false);
  const strategicRef = useRef(null);
  const portersRef = useRef(null);
  const pestelRef = useRef(null);
  const fullSwotRef = useRef(null);

  const getAvailablePhases = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    const phases = [];

    // Always show initial phase if analysis is unlocked
    if (unlockedFeatures.analysis) {
      phases.push({
        key: 'initial',
        name: 'Initial Phase',
        unlocked: true
      });
    }

    // Only show essential phase if it's actually unlocked
    if (unlockedFeatures.fullSwot) {
      phases.push({
        key: 'essential',
        name: 'Essential Phase',
        unlocked: true
      });
    }

    return phases;
  };

  const handleRedirectToBrief = (missingQuestionsData) => {
    // Store the missing questions data
    setHighlightedMissingQuestions(missingQuestionsData);

    // Switch to brief tab
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

    // Show toast message
    showToastMessage(
      `Please answer ${missingQuestionsData.missing_count} more question${missingQuestionsData.missing_count > 1 ? 's' : ''} to generate this analysis.`,
      "warning"
    );

    // Auto-clear highlighting after 10 seconds
    setTimeout(() => {
      setHighlightedMissingQuestions(null);
    }, 30000);
  };

  // Phase Tabs Component
  const PhaseTabsComponent = () => {
    const availablePhases = getAvailablePhases();

    if (availablePhases.length === 0) return null;

    // Get phase-specific dropdown options
    const getPhaseSpecificOptions = (phase) => {
      const baseOptions = {
        initial: [
          "SWOT",
          "Purchase Criteria",
          "Channel Heatmap",
          "Loyalty/NPS",
          "Capability Heatmap",
          "Porter's Five Forces",
          "PESTEL Analysis"
        ],
        essential: [
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
        ]
      };

      return baseOptions[phase] || [];
    };

    const currentPhaseOptions = getPhaseSpecificOptions(selectedPhase);
    const currentPhaseLabel = selectedPhase === 'initial' ? 'Initial Phase' : 'Essential Phase';

    return (
      <>
        <div className="phase-tabs-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="phase-tabs-nav">
              {availablePhases.map(phase => (
                <button
                  key={phase.key}
                  onClick={() => setSelectedPhase(phase.key)}
                  className={`phase-tab ${selectedPhase === phase.key ? 'active' : ''}`}
                >
                  {phase.name}
                </button>
              ))}
            </div>
          </div>

          <div className="phase-dropdown-section">
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
                <span>Go to Section</span>
                <ChevronDown
                  size={16}
                  style={{
                    marginLeft: 8,
                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {showDropdown && (
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
                    backgroundColor: selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: selectedPhase === 'essential' ? "#92400e" : "#1e40af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {currentPhaseLabel} Sections
                  </div>

                  {/* Options */}
                  {currentPhaseOptions.map((item, index) => (
                    <div
                      key={item}
                      onClick={() => handleOptionClick(item)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        fontWeight: 500,
                        borderBottom: index < currentPhaseOptions.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe";
                        e.currentTarget.style.color = selectedPhase === 'essential' ? "#92400e" : "#1e40af";
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
                        backgroundColor: selectedPhase === 'essential' ? "#f59e0b" : "#3b82f6",
                        flexShrink: 0
                      }}></span>
                      {item}
                    </div>
                  ))}

                  {currentPhaseOptions.length === 0 && (
                    <div style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                      fontStyle: "italic"
                    }}>
                      No sections available for this phase
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  // Strategic Analysis Generation - Simplified
  const generateStrategicAnalysis = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for strategic analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/strategic-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strategic API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const strategicContent = result.strategic_analysis || result.strategic || result;

      // Always overwrite existing strategic data
      setStrategicData(strategicContent);
      await saveAnalysisToBackend(strategicContent, 'strategic');

    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      throw error;
    }
  };

  // Simplified Strategic Analysis Regeneration Handler
  const handleStrategicAnalysisRegenerate = async () => {
    if (!phaseManager.canRegenerateAnalysis() || isRegeneratingRef.current) return;

    try {
      setIsStrategicRegenerating(true);
      showToastMessage("Regenerating Strategic Analysis...", "info");
      setStrategicData(null);
      await new Promise(resolve => setTimeout(resolve, 200));

      await generateStrategicAnalysis(userAnswers);
      showToastMessage("Strategic Analysis regenerated successfully!", "success");
    } catch (error) {
      console.error('Error regenerating Strategic Analysis:', error);
      showToastMessage("Failed to regenerate Strategic Analysis.", "error");
    } finally {
      setIsStrategicRegenerating(false);
    }
  };

  // Functions for phase completion auto-generation
  const regenerateAllAnalysisForCompletion = async (completedSet = null) => {
    if (isRegeneratingRef.current) return;

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      showToastMessage("Initial phase completed! Generating analysis...", "info");

      clearAllAnalysisData();
      const freshAnswers = await getFreshConversationData();

      const analysisPromises = [
        generateSWOTAnalysisWithData(freshAnswers),
        generateSingleAnalysisWithData('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData, freshAnswers),
        generateSingleAnalysisWithData('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData, freshAnswers),
        generateSingleAnalysisWithData('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData, freshAnswers),
        generateSingleAnalysisWithData('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData, freshAnswers),
        generateStrategicAnalysis(freshAnswers), // Simplified call
        generatePortersAnalysis(freshAnswers),
        generatePestelAnalysis(freshAnswers)
      ];

      const results = await Promise.allSettled(analysisPromises);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${analysisPromises.length - failures.length}/${analysisPromises.length} analyses completed successfully.`,
          failures.length < analysisPromises.length ? "warning" : "error"
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

  const generateFullSwotPortfolioForCompletion = async (completedSet = null) => {
    if (isRegeneratingRef.current) {
      return;
    }

    try {
      isRegeneratingRef.current = true;
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

      // Clear existing data (except strategic - we'll overwrite it)
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

      const freshAnswers = await getFreshConversationData();

      // Generate ALL essential phase analyses INCLUDING Strategic Analysis (overwrite)
      const analysisPromises = [
        generateFullSwotPortfolio(freshAnswers),
        generateCompetitiveAdvantage(freshAnswers),
        generateChannelEffectiveness(freshAnswers),
        generateExpandedCapability(freshAnswers),
        generateStrategicGoals(freshAnswers),
        generateStrategicRadar(freshAnswers),
        generateCultureProfile(freshAnswers),
        generateProductivityMetrics(freshAnswers),
        generateMaturityScore(freshAnswers),
        generateSingleAnalysisWithData('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData, freshAnswers),
        generateStrategicAnalysis(freshAnswers) // Overwrite strategic analysis with essential phase data
      ];

      const results = await Promise.allSettled(analysisPromises);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${analysisPromises.length - failures.length}/${analysisPromises.length} essential analyses completed successfully.`,
          failures.length < analysisPromises.length ? "warning" : "error"
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

  // Load existing analysis data
  const loadExistingAnalysisData = (phaseAnalysisArray) => {
    try {
      const latestAnalysisByType = {};

      // Group by analysis type, keeping the latest for each
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

        switch (analysis_type) {
          case 'swot':
            setSwotAnalysisResult(typeof analysis_data === 'string' ? analysis_data : JSON.stringify(analysis_data));
            break;
          case 'strategic':
            // Always use the latest strategic analysis regardless of phase
            setStrategicData(analysis_data);
            break;
          case 'fullSwot':
            setFullSwotData(analysis_data);
            break;
          case 'competitiveAdvantage':
            setCompetitiveAdvantageData(analysis_data);
            break;
          case 'expandedCapability':
            setExpandedCapabilityData(analysis_data);
            break;
          case 'strategicGoals':
            setStrategicGoalsData(analysis_data);
            break;
          case 'strategicRadar':
            setStrategicRadarData(analysis_data);
            break;
          case 'customerSegmentation':
            setCustomerSegmentationData(analysis_data);
            break;
          case 'cultureProfile':
            setCultureProfileData(analysis_data);
            break;
          case 'productivityMetrics':
            setProductivityData(analysis_data);
            break;
          case 'maturityScore':
            setMaturityData(analysis_data);
            break;
          case 'purchaseCriteria':
            setPurchaseCriteriaData(analysis_data);
            break;
          case 'channelHeatmap':
            setChannelHeatmapData(analysis_data);
            break;
          case 'loyaltyNPS':
            setLoyaltyNPSData(analysis_data);
            break;
          case 'capabilityHeatmap':
            setCapabilityHeatmapData(analysis_data);
            break;
          case 'porters':
            setPortersData(analysis_data);
            break;
          case 'pestel':
            setPestelData(analysis_data);
            break;
          case 'channelEffectiveness':
            setChannelEffectivenessData(analysis_data);
            break;
        }
      });

      setHasAnalysisData(hasAnyAnalysis);
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };

  // Initialize PhaseManager
  const phaseManager = PhaseManager({
    questions,
    questionsLoaded,
    completedQuestions,
    userAnswers,
    selectedBusinessId,
    onCompletedQuestionsUpdate: (completedSet, answersMap) => {
      setCompletedQuestions(completedSet);
      setUserAnswers(prev => ({ ...prev, ...answersMap }));
    },
    onCompletedPhasesUpdate: (phases) => {
      // Handle phase updates if needed
    },
    onAnalysisGeneration: regenerateAllAnalysisForCompletion,
    onFullSwotGeneration: generateFullSwotPortfolioForCompletion,
    onAnalysisDataLoad: loadExistingAnalysisData,
    API_BASE_URL,
    getAuthToken
  });

  // Load existing analysis on component mount
  useEffect(() => {
    if (selectedBusinessId && questionsLoaded && questions.length > 0) {
      // Small delay to ensure all states are initialized
      setTimeout(() => {
        phaseManager.loadExistingAnalysis();
      }, 100);
    }
  }, [selectedBusinessId, questionsLoaded, questions.length]);

  // Handle window resize
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
  }, [activeTab]);

  // Handle dropdown clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper Functions
  const showToastMessage = (message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const extractBusinessName = (text) => {
    const patterns = [
      /(?:we are|i am|this is|called|business is|company is)\s+([A-Z][a-zA-Z\s&.-]+?)(?:\.|,|$)/i,
      /^([A-Z][a-zA-Z\s&.-]+?)\s+(?:is|provides|offers|teaches)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length <= 50) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData, analysisType) => {
    try {
      const token = getAuthToken();

      // Define which analysis types belong to which phases
      const analysisPhaseMap = {
        // Initial Phase analyses
        'swot': 'initial',
        'purchaseCriteria': 'initial',
        'channelHeatmap': 'initial',
        'loyaltyNPS': 'initial',
        'capabilityHeatmap': 'initial',
        'porters': 'initial',
        'pestel': 'initial',
        'strategic': 'strategic', // Simplified - no phase distinction

        // Essential Phase analyses  
        'fullSwot': 'essential',
        'customerSegmentation': 'essential',
        'competitiveAdvantage': 'essential',
        'channelEffectiveness': 'essential',
        'expandedCapability': 'essential',
        'strategicGoals': 'essential',
        'strategicRadar': 'essential',
        'cultureProfile': 'essential',
        'productivityMetrics': 'essential',
        'maturityScore': 'essential'
      };

      // Determine the correct phase
      const phase = analysisPhaseMap[analysisType] || 'initial';

      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: phase,
          analysis_type: analysisType,
          analysis_name: `${analysisType.toUpperCase()} Analysis`,
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            phase: phase,
            generation_context: 'regular_generation'
          }
        })
      });

      if (!response.ok) {
        console.error(`Failed to save ${analysisType} analysis:`, response.statusText);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  };

  // Generate individual analysis functions
  const generateChannelEffectiveness = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for channel effectiveness analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/channel-effectiveness`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Channel Effectiveness API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      let channelContent = null;
      if (result.channelEffectiveness) {
        channelContent = result;
      } else if (result.channel_effectiveness) {
        channelContent = { channelEffectiveness: result.channel_effectiveness };
      } else {
        channelContent = { channelEffectiveness: result };
      }

      setChannelEffectivenessData(channelContent);
      await saveAnalysisToBackend(channelContent, 'channelEffectiveness');
      return channelContent;
    } catch (error) {
      console.error('Error generating Channel Effectiveness Map:', error);
      throw error;
    }
  };

  const generateExpandedCapability = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for expanded capability analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/expanded-capability-heatmap`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Expanded Capability API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      let expandedCapabilityContent = null;
      if (result.expandedCapabilityHeatmap) {
        expandedCapabilityContent = result;
      } else if (result.expanded_capability_heatmap) {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result.expanded_capability_heatmap };
      } else {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result };
      }

      setExpandedCapabilityData(expandedCapabilityContent);
      await saveAnalysisToBackend(expandedCapabilityContent, 'expandedCapability');
      return expandedCapabilityContent;
    } catch (error) {
      console.error('Error generating Expanded Capability Heatmap:', error);
      throw error;
    }
  };

  const generateStrategicGoals = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for strategic goals analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/strategic-goals`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strategic Goals API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setStrategicGoalsData(result);
      await saveAnalysisToBackend(result, 'strategicGoals');
      return result;
    } catch (error) {
      console.error('Error generating Strategic Goals:', error);
      throw error;
    }
  };

  const generateStrategicRadar = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for strategic positioning radar analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/strategic-positioning-radar`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strategic Positioning Radar API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      let strategicRadarContent = null;
      if (result.strategicRadar) {
        strategicRadarContent = result;
      } else if (result.strategic_radar) {
        strategicRadarContent = { strategicRadar: result.strategic_radar };
      } else {
        strategicRadarContent = { strategicRadar: result };
      }

      setStrategicRadarData(strategicRadarContent);
      await saveAnalysisToBackend(strategicRadarContent, 'strategicRadar');
      return strategicRadarContent;
    } catch (error) {
      console.error('Error generating Strategic Positioning Radar:', error);
      throw error;
    }
  };

  const generateCultureProfile = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for culture profile analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/culture-profile`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Culture Profile API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      let cultureContent = null;
      if (result.cultureProfile) {
        cultureContent = result;
      } else if (result.culture_profile) {
        cultureContent = { cultureProfile: result.culture_profile };
      } else {
        cultureContent = { cultureProfile: result };
      }

      setCultureProfileData(cultureContent);
      await saveAnalysisToBackend(cultureContent, 'cultureProfile');
      return cultureContent;
    } catch (error) {
      console.error('Error generating Culture Profile:', error);
      throw error;
    }
  };

  const generateProductivityMetrics = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for productivity metrics analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/productivity-metrics`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Productivity Metrics API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      let productivityContent = null;
      if (result.productivityMetrics) {
        productivityContent = result;
      } else if (result.productivity_metrics) {
        productivityContent = { productivityMetrics: result.productivity_metrics };
      } else {
        productivityContent = { productivityMetrics: result };
      }

      setProductivityData(productivityContent);
      await saveAnalysisToBackend(productivityContent, 'productivityMetrics');
      return productivityContent;
    } catch (error) {
      console.error('Error generating Productivity Metrics:', error);
      throw error;
    }
  };

  const generateMaturityScore = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for maturity score analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/maturity-scoring`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Maturity Score API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Fix: The API returns the maturity data directly, so we need to wrap it properly
      let maturityContent = null;

      // Check if the result already has the expected structure
      if (result.maturityScore || result.maturity_score) {
        maturityContent = result;
      } else if (result.dimensions && result.overallMaturity) {
        // API returns data directly in root - wrap it in maturityScore property
        maturityContent = {
          maturityScore: result
        };
      } else {
        // Fallback - assume the whole result is the maturity data
        maturityContent = {
          maturityScore: result
        };
      }

      setMaturityData(maturityContent);
      await saveAnalysisToBackend(maturityContent, 'maturityScore');
      return maturityContent;
    } catch (error) {
      console.error('Error generating Maturity Score:', error);
      throw error;
    }
  };
  const generateCompetitiveAdvantage = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for competitive advantage analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/competitive-advantage`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Competitive Advantage API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setCompetitiveAdvantageData(result);
      await saveAnalysisToBackend(result, 'competitiveAdvantage');
      return result;
    } catch (error) {
      console.error('Error generating Competitive Advantage Matrix:', error);
      throw error;
    }
  };

  // Main function to regenerate all analysis
  const regenerateAllAnalysis = async (updatedQuestionId = null, updatedAnswer = null, forceRegenerate = false) => {
    if (!phaseManager.canRegenerateAnalysis() && !forceRegenerate) {
      showToastMessage("Initial phase must be completed to regenerate analysis.", "warning");
      return;
    }

    if (isRegeneratingRef.current) {
      return;
    }

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);

      if (forceRegenerate || (updatedQuestionId && updatedAnswer)) {
        showToastMessage("Regenerating all analysis components...", "info");
      }

      clearAllAnalysisData();
      await new Promise(resolve => setTimeout(resolve, 200));

      let answersToUse = { ...userAnswers };
      if (updatedQuestionId && updatedAnswer) {
        answersToUse[updatedQuestionId] = updatedAnswer;
      }

      // Generate initial phase analysis
      const analysisPromises = [
        generateSWOTAnalysisWithAnswers(answersToUse),
        generateSingleAnalysisWithAnswers('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData, answersToUse),
        generateSingleAnalysisWithAnswers('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData, answersToUse),
        generateSingleAnalysisWithAnswers('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData, answersToUse),
        generateSingleAnalysisWithAnswers('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData, answersToUse),
        generateStrategicAnalysisWithAnswers(answersToUse), // Simplified call
        generatePortersAnalysisWithAnswers(answersToUse),
        generatePestelAnalysisWithAnswers(answersToUse)
      ];

      if (phaseManager.canGenerateFullSwot()) {
        analysisPromises.push(generateFullSwotPortfolio(answersToUse));
        analysisPromises.push(generateSingleAnalysisWithAnswers('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData, answersToUse));
      }

      const results = await Promise.allSettled(analysisPromises);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${analysisPromises.length - failures.length}/${analysisPromises.length} analyses completed successfully.`,
          failures.length < analysisPromises.length ? "warning" : "error"
        );
      } else {
        if (forceRegenerate || (updatedQuestionId && updatedAnswer)) {
          showToastMessage("All analysis components regenerated successfully!", "success");
        }
      }

    } catch (error) {
      console.error('Error regenerating all analysis:', error);
      showToastMessage("Failed to regenerate analysis components. Please try again.", "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
    }
  };

  // Clear all analysis data
  const clearAllAnalysisData = () => {
    setSwotAnalysisResult("");
    setPurchaseCriteriaData(null);
    setChannelHeatmapData(null);
    setLoyaltyNPSData(null);
    setCapabilityHeatmapData(null);
    setStrategicData(null); // Clear strategic data too
    setPortersData(null);
    setPestelData(null);

    if (phaseManager.canGenerateFullSwot()) {
      setFullSwotData(null);
      setCompetitiveAdvantageData(null);
      setChannelEffectivenessData(null);
      setExpandedCapabilityData(null);
      setStrategicGoalsData(null);
      setStrategicRadarData(null);
      setCustomerSegmentationData(null);
      setCultureProfileData(null);
      setProductivityData(null);
      setMaturityData(null);
    }
  };

  // Event Handlers
  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions);
    setQuestionsLoaded(true);
  };

  const handleNewAnswer = async (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

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
    // Update completed questions first
    const newCompletedSet = new Set([...completedQuestions, questionId]);
    setCompletedQuestions(newCompletedSet);

    // Check phases AFTER updating state
    setTimeout(async () => {
      const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
      const essentialQuestions = questions.filter(q => q.phase === 'essential');

      const completedInitial = initialQuestions.filter(q => newCompletedSet.has(q._id));
      const completedEssential = essentialQuestions.filter(q => newCompletedSet.has(q._id));


      // Get the phase of the completed question
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
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));

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

  const handleBack = () => {
    window.history.back();
  };

  // Analysis generation functions  
  const generateSWOTAnalysisWithAnswers = async (answersToUse) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (answersToUse[question._id]) {
          questionsArray.push(question.question_text);
          answersArray.push(answersToUse[question._id]);
        }
      });

      const response = await fetch(`${ML_API_BASE_URL}/find`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`SWOT API returned ${response.status}`);
      }

      const result = await response.json();
      const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);

      setSwotAnalysisResult(analysisContent);
      await saveAnalysisToBackend(analysisContent, 'swot');
    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      throw error;
    }
  };

  const generateSingleAnalysisWithAnswers = async (analysisType, endpoint, dataKey, setter, answersToUse) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => {
          const hasAnswer = answersToUse[q._id] && answersToUse[q._id].trim();
          return hasAnswer;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(answersToUse[question._id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        });

      if (questionsArray.length === 0) {
        throw new Error(`No questions available for ${analysisType} analysis`);
      }

      const response = await fetch(`${ML_API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`${analysisType} API returned ${response.status}`);
      }

      const result = await response.json();
      let dataToSave = null;

      if (analysisType === 'capabilityHeatmap') {
        dataToSave = result.capabilities ? result : result[dataKey];
      } else if (result && result[dataKey]) {
        dataToSave = result[dataKey];
      } else {
        throw new Error(`Invalid response structure from ${analysisType} API`);
      }

      if (dataToSave) {
        setter(dataToSave);
        await saveAnalysisToBackend(dataToSave, analysisType);
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw error;
    }
  };

  const generateStrategicAnalysisWithAnswers = async (answersToUse) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => answersToUse[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(answersToUse[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for strategic analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/strategic-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strategic API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const strategicContent = result.strategic_analysis || result.strategic || result;

      setStrategicData(strategicContent);
      await saveAnalysisToBackend(strategicContent, 'strategic');
    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      throw error;
    }
  };

  const generatePortersAnalysisWithAnswers = async (answersToUse) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => answersToUse[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(answersToUse[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for Porter\'s Five Forces analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/porter-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`Porter's API returned ${response.status}`);
      }

      const result = await response.json();
      const portersContent = result.porters_analysis || result.porters || result;

      setPortersData(portersContent);
      await saveAnalysisToBackend(portersContent, 'porters');
    } catch (error) {
      console.error('Error generating Porter\'s Five Forces analysis:', error);
      throw error;
    }
  };

  const generatePestelAnalysisWithAnswers = async (answersToUse) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => answersToUse[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(answersToUse[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for PESTEL analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/pestel-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PESTEL API Error Response:', errorText);
        throw new Error(`PESTEL API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setPestelData(result);
      await saveAnalysisToBackend(result, 'pestel');

      return result;
    } catch (error) {
      console.error('Error generating PESTEL analysis:', error);
      throw error;
    }
  };

  const generateFullSwotPortfolio = async (freshAnswers = null) => {
    try {
      const questionsArray = [];
      const answersArray = [];
      const dataSource = freshAnswers || userAnswers;

      questions
        .filter(q => dataSource[q._id] && dataSource[q._id].trim() !== '')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(dataSource[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for Full SWOT Portfolio analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/full-swot-portfolio`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Full SWOT Portfolio API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setFullSwotData(result);
      await saveAnalysisToBackend(result, 'fullSwot');
      return result;
    } catch (error) {
      console.error('Error generating Full SWOT Portfolio analysis:', error);
      throw error;
    }
  };

  const getFreshConversationData = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fresh conversation data');
      }

      const data = await response.json();
      const freshAnswers = {};
      const freshCompletedSet = new Set();

      data.conversations?.forEach(conversation => {
        if (conversation.completion_status === 'complete' || conversation.completion_status === 'skipped') {
          const questionId = conversation.question_id;
          freshCompletedSet.add(questionId);

          if (conversation.completion_status === 'skipped' || conversation.is_skipped) {
            freshAnswers[questionId] = '[Question Skipped]';
          } else {
            const allAnswers = conversation.conversation_flow
              .filter(item => item.type === 'answer')
              .map(a => a.text.trim())
              .filter(text => text.length > 0 && text !== '[Question Skipped]');

            if (allAnswers.length > 0) {
              freshAnswers[questionId] = allAnswers.join('. ');
            }
          }
        }
      });

      setUserAnswers(prev => ({ ...prev, ...freshAnswers }));
      setCompletedQuestions(prev => new Set([...prev, ...freshCompletedSet]));

      return freshAnswers;
    } catch (error) {
      console.error('Error fetching fresh conversation data:', error);
      return userAnswers;
    }
  };

  const generateSWOTAnalysisWithData = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (freshAnswers[question._id]) {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        }
      });

      const response = await fetch(`${ML_API_BASE_URL}/find`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`SWOT API returned ${response.status}`);
      }

      const result = await response.json();
      const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);

      setSwotAnalysisResult(analysisContent);
      await saveAnalysisToBackend(analysisContent, 'swot');
    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      throw error;
    }
  };

  const generateSingleAnalysisWithData = async (analysisType, endpoint, dataKey, setter, freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error(`No questions available for ${analysisType} analysis`);
      }

      const response = await fetch(`${ML_API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`${analysisType} API returned ${response.status}`);
      }

      const result = await response.json();
      let dataToSave = null;

      if (analysisType === 'capabilityHeatmap') {
        dataToSave = result.capabilities ? result : result[dataKey];
      } else if (result && result[dataKey]) {
        dataToSave = result[dataKey];
      } else {
        throw new Error(`Invalid response structure from ${analysisType} API`);
      }

      if (dataToSave) {
        setter(dataToSave);
        await saveAnalysisToBackend(dataToSave, analysisType);
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw error;
    }
  };

  const generatePortersAnalysis = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for Porter\'s Five Forces analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/porter-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`Porter's API returned ${response.status}`);
      }

      const result = await response.json();
      const portersContent = result.porters_analysis || result.porters || result;

      setPortersData(portersContent);
      await saveAnalysisToBackend(portersContent, 'porters');
    } catch (error) {
      console.error('Error generating Porter\'s Five Forces analysis:', error);
      throw error;
    }
  };

  const generatePestelAnalysis = async (freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No questions available for PESTEL analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/pestel-analysis`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PESTEL API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setPestelData(result);
      await saveAnalysisToBackend(result, 'pestel');
      return result;
    } catch (error) {
      console.error('Error generating PESTEL analysis:', error);
      throw error;
    }
  };

  // Update the createIndividualRegenerationHandler function
  const createIndividualRegenerationHandler = (analysisType, endpoint, dataKey, setter, displayName, setIsRegenerating) => {
    return async () => {
      if (!phaseManager.canRegenerateAnalysis() || isRegeneratingRef.current) return;

      try {
        setIsRegenerating(true);
        showToastMessage(`Regenerating ${displayName}...`, "info");
        setter(null);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Handle special cases that have custom generation functions
        if (analysisType === 'porters') {
          await generatePortersAnalysisWithAnswers(userAnswers);
        } else if (analysisType === 'pestel') {
          await generatePestelAnalysisWithAnswers(userAnswers);
        } else if (analysisType === 'strategic') {
          await generateStrategicAnalysisWithAnswers(userAnswers);
        } else if (analysisType === 'fullSwot') {
          await generateFullSwotPortfolio();
        } else if (analysisType === 'competitiveAdvantage') {
          await generateCompetitiveAdvantage(userAnswers);
        } else if (analysisType === 'channelEffectiveness') {
          await generateChannelEffectiveness(userAnswers);
        } else if (analysisType === 'expandedCapability') {
          await generateExpandedCapability(userAnswers);
        } else if (analysisType === 'strategicGoals') {
          await generateStrategicGoals(userAnswers);
        } else if (analysisType === 'strategicRadar') {
          await generateStrategicRadar(userAnswers);
        } else if (analysisType === 'cultureProfile') {
          await generateCultureProfile(userAnswers);
        } else if (analysisType === 'productivityMetrics') {
          await generateProductivityMetrics(userAnswers);
        } else if (analysisType === 'maturityScore') {
          // Use the custom maturity score function
          await generateMaturityScore(userAnswers);
        } else {
          // Use the generic function for standard analyses
          await generateSingleAnalysis(analysisType, endpoint, dataKey, setter);
        }

        showToastMessage(`${displayName} regenerated successfully!`, "success");
      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        showToastMessage(`Failed to regenerate ${displayName}.`, "error");
      } finally {
        setIsRegenerating(false);
      }
    };
  };

  const generateSingleAnalysis = async (analysisType, endpoint, dataKey, setter) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => {
          const hasAnswer = userAnswers[q._id] && userAnswers[q._id].trim();
          return hasAnswer;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question._id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        });

      if (questionsArray.length === 0) {
        throw new Error(`No questions available for ${analysisType} analysis`);
      }

      const response = await fetch(`${ML_API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        throw new Error(`${analysisType} API returned ${response.status}`);
      }

      const result = await response.json();
      let dataToSave = null;

      if (analysisType === 'capabilityHeatmap') {
        dataToSave = result.capabilities ? result : result[dataKey];
      } else if (result && result[dataKey]) {
        dataToSave = result[dataKey];
      } else {
        throw new Error(`Invalid response structure from ${analysisType} API`);
      }

      if (dataToSave) {
        setter(dataToSave);
        await saveAnalysisToBackend(dataToSave, analysisType);
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw error;
    }
  };

  const handleOptionClick = (option) => {
    setShowDropdown(false);

    setTimeout(() => {
      const refMap = {
        // Initial Phase Refs
        "SWOT": swotRef,
        "Purchase Criteria": purchaseCriteriaRef,
        "Channel Heatmap": channelHeatmapRef,
        "Loyalty/NPS": loyaltyNpsRef,
        "Capability Heatmap": capabilityHeatmapRef,
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
        "Maturity Score": maturityScoreRef
      };

      const targetRef = refMap[option];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 100);
  };

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
          onMouseEnter={(e) => {
            if (!isAnalysisRegenerating) {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
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

        <PDFExportButton
          analysisResult={swotAnalysisResult}
          businessName={businessData.name}
          onToastMessage={showToastMessage}
        />
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
          <span>Regenerating all analysis components...</span>
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
            saveAnalysisToBackend={saveAnalysisToBackend}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={purchaseCriteriaRef}>
          <PurchaseCriteria
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setPurchaseCriteriaData}
            onRegenerate={createIndividualRegenerationHandler(
              'purchaseCriteria',
              'purchase-criteria',
              'purchaseCriteria',
              setPurchaseCriteriaData,
              'Purchase criteria',
              setIsPurchaseCriteriaRegenerating
            )}
            isRegenerating={isPurchaseCriteriaRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            purchaseCriteriaData={purchaseCriteriaData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={channelHeatmapRef}>
          <ChannelHeatmap
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setChannelHeatmapData}
            onRegenerate={createIndividualRegenerationHandler(
              'channelHeatmap',
              'channel-heatmap',
              'channelHeatmap',
              setChannelHeatmapData,
              'Channel heatmap',
              setIsChannelHeatmapRegenerating
            )}
            isRegenerating={isChannelHeatmapRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            channelHeatmapData={channelHeatmapData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={loyaltyNpsRef}>
          <LoyaltyNPS
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setLoyaltyNPSData}
            onRegenerate={createIndividualRegenerationHandler(
              'loyaltyNPS',
              'loyalty-metrics',
              'loyaltyMetrics',
              setLoyaltyNPSData,
              'Loyalty NPS',
              setIsLoyaltyNPSRegenerating
            )}
            isRegenerating={isLoyaltyNPSRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            loyaltyNPSData={loyaltyNPSData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={capabilityHeatmapRef}>
          <CapabilityHeatmap
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onDataGenerated={setCapabilityHeatmapData}
            onRegenerate={createIndividualRegenerationHandler(
              'capabilityHeatmap',
              'capability-heatmap',
              'capabilityHeatmap',
              setCapabilityHeatmapData,
              'Capability heatmap',
              setIsCapabilityHeatmapRegenerating
            )}
            isRegenerating={isCapabilityHeatmapRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            capabilityHeatmapData={capabilityHeatmapData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={portersRef}>
          <PortersFiveForces
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createIndividualRegenerationHandler(
              'porters',
              'porters-five-forces',
              'porters',
              setPortersData,
              'Porter\'s Five Forces',
              setIsPortersRegenerating
            )}
            isRegenerating={isPortersRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            portersData={portersData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>

        <div ref={pestelRef}>
          <PestelAnalysis
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessData.name}
            onRegenerate={createIndividualRegenerationHandler(
              'pestel',
              'pestel-analysis',
              'pestel',
              setPestelData,
              'PESTEL Analysis',
              setIsPestelRegenerating
            )}
            isRegenerating={isPestelRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            pestelData={pestelData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>
      </div>
    );

    // Essential Phase Components
    const essentialPhaseComponents = (
      <div id="analysis-pdf-content" style={{ backgroundColor: 'white' }}>
        {unlockedFeatures.fullSwot && (
          <div ref={fullSwotRef}>
            <FullSWOTPortfolio
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              canRegenerate={true}
              fullSwotData={fullSwotData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={customerSegmentationRef}>
            <CustomerSegmentation
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={setCustomerSegmentationData}
              onRegenerate={createIndividualRegenerationHandler(
                'customerSegmentation',
                'customer-segment',
                'customerSegmentation',
                setCustomerSegmentationData,
                'Customer segmentation',
                setIsCustomerSegmentationRegenerating
              )}
              isRegenerating={isCustomerSegmentationRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              customerSegmentationData={customerSegmentationData}
              selectedBusinessId={selectedBusinessId}
              onRedirectToBrief={handleRedirectToBrief}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={competitiveAdvantageRef}>
            <CompetitiveAdvantageMatrix
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              canRegenerate={true}
              competitiveAdvantageData={competitiveAdvantageData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={channelEffectivenessRef}>
            <ChannelEffectivenessMap
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'channelEffectiveness',
                'channel-effectiveness',
                'channelEffectiveness',
                setChannelEffectivenessData,
                'Channel Effectiveness Map',
                setIsChannelEffectivenessRegenerating
              )}
              isRegenerating={isChannelEffectivenessRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              channelEffectivenessData={channelEffectivenessData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={expandedCapabilityRef}>
            <ExpandedCapabilityHeatmap
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'expandedCapability',
                'expanded-capability-heatmap',
                'expandedCapabilityHeatmap',
                setExpandedCapabilityData,
                'Expanded Capability Heatmap',
                setIsExpandedCapabilityRegenerating
              )}
              isRegenerating={isExpandedCapabilityRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              expandedCapabilityData={expandedCapabilityData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={strategicGoalsRef}>
            <StrategicGoals
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'strategicGoals',
                'strategic-goals',
                'strategicGoals',
                setStrategicGoalsData,
                'Strategic Goals',
                setIsStrategicGoalsRegenerating
              )}
              isRegenerating={isStrategicGoalsRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              strategicGoalsData={strategicGoalsData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={strategicRadarRef}>
            <StrategicPositioningRadar
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'strategicRadar',
                'strategic-positioning-radar',
                'strategicRadar',
                setStrategicRadarData,
                'Strategic Positioning Radar',
                setIsStrategicRadarRegenerating
              )}
              isRegenerating={isStrategicRadarRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              strategicRadarData={strategicRadarData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={cultureProfileRef}>
            <OrganizationalCultureProfile
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'cultureProfile',
                'culture-profile',
                'cultureProfile',
                setCultureProfileData,
                'Organizational Culture Profile',
                setIsCultureProfileRegenerating
              )}
              isRegenerating={isCultureProfileRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              cultureProfileData={cultureProfileData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={productivityRef}>
            <ProductivityMetrics
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'productivityMetrics',
                'productivity-metrics',
                'productivityMetrics',
                setProductivityData,
                'Productivity Metrics',
                setIsProductivityRegenerating
              )}
              isRegenerating={isProductivityRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              productivityData={productivityData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}

        {unlockedFeatures.fullSwot && (
          <div ref={maturityScoreRef}>
            <MaturityScoreLight
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onRegenerate={createIndividualRegenerationHandler(
                'maturityScore',
                'maturity-scoring',
                'maturityScore',
                setMaturityData,
                'Maturity Score',
                setIsMaturityRegenerating
              )}
              isRegenerating={isMaturityRegenerating}
              canRegenerate={!isAnalysisRegenerating}
              maturityData={maturityData}
              selectedBusinessId={selectedBusinessId}
            />
          </div>
        )}
      </div>
    );

    return (
      <div>
        <PhaseTabsComponent />
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
                      <AnalysisControls />
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
                            saveAnalysisToBackend={saveAnalysisToBackend}
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
                  <AnalysisControls />
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
                      highlightedMissingQuestions={highlightedMissingQuestions} // Add this prop
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
                      saveAnalysisToBackend={saveAnalysisToBackend}
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