import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Loader, RefreshCw } from "lucide-react";
import ChatComponent from "../components/ChatComponent";
import SwotAnalysis from "../components/SwotAnalysis";
import "../styles/businesspage.css";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import { ChevronDown } from "lucide-react";
import CustomerSegmentation from "../components/CustomerSegmentation";
import PurchaseCriteria from "../components/PurchaseCriteria";
import ChannelHeatmap from "../components/ChannelHeatmap";
import LoyaltyNPS from "../components/LoyaltyNPS";
import CapabilityHeatmap from "../components/CapabilityHeatmap";
import PDFExportButton from "../components/PDFExportButton";
import { useTranslation } from "../hooks/useTranslation";

const BusinessSetupPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => {
    const isMobileView = window.innerWidth <= 768;
    return isMobileView ? "chat" : "brief";
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userAnswers, setUserAnswers] = useState({});
  const [analysisResult, setAnalysisResult] = useState("");
  const [strategicAnalysisResult, setStrategicAnalysisResult] = useState("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalysisRegenerating, setIsAnalysisRegenerating] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [isLoadingLatestAnalysis, setIsLoadingLatestAnalysis] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState(() => t('goToSection') || 'Go to Section');
  const dropdownRef = useRef(null);
  const [customerSegmentationData, setCustomerSegmentationData] = useState(null);
  const [purchaseCriteriaData, setPurchaseCriteriaData] = useState(null);
  const [channelHeatmapData, setChannelHeatmapData] = useState(null);
  const [loyaltyNPSData, setLoyaltyNPSData] = useState(null);
  const [capabilityHeatmapData, setCapabilityHeatmapData] = useState(null);

  // Refs for scrolling to sections
  const swotRef = useRef(null);
  const customerSegmentationRef = useRef(null);
  const purchaseCriteriaRef = useRef(null);
  const channelHeatmapRef = useRef(null);
  const loyaltyNpsRef = useRef(null);
  const capabilityHeatmapRef = useRef(null);
  const strategicRef = useRef(null);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load latest analysis when analysis tab becomes active
  useEffect(() => {
    if (activeTab === "analysis" && unlockedFeatures.analysis) {
      loadLatestAnalysis();
    }
  }, [activeTab]);

  // Load latest analysis from backend
  const loadLatestAnalysis = async () => {
    try {
      setIsLoadingLatestAnalysis(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/analysis/swot`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result.analysisData);
        console.log('📊 Loaded latest analysis from backend');
      } else if (response.status === 404) {
        // No analysis found, generate new one if initial phase is completed
        if (isPhaseCompleted(PHASES.INITIAL)) {
          console.log('📊 No existing analysis found, generating new one...');
          await generateAnalysisWithFind();
        }
      } else {
        console.error('Failed to load latest analysis:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading latest analysis:', error);
      // If no analysis exists and initial phase is completed, generate new one
      if (isPhaseCompleted(PHASES.INITIAL)) {
        console.log('📊 Error loading analysis, generating new one...');
        await generateAnalysisWithFind();
      }
    } finally {
      setIsLoadingLatestAnalysis(false);
    }
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData, analysisType = 'swot') => {
    try {
      const token = getAuthToken();

      // Get current session ID
      const currentResponse = await fetch(`${API_BASE_URL}/api/conversation/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!currentResponse.ok) {
        throw new Error('Failed to get current conversation');
      }

      const conversation = await currentResponse.json();
      const sessionId = conversation.sessionId;

      if (!sessionId) {
        throw new Error('No active conversation session found');
      }

      const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          analysisType: analysisType,
          analysisData: analysisData,
          businessName: businessData.name
        })
      });

      if (response.ok) {
        console.log(`📊 ${analysisType} analysis saved to backend`);
        return true;
      } else {
        console.error(`Failed to save ${analysisType} analysis:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  };

  const handleCustomerSegmentationGenerated = (data) => {
    setCustomerSegmentationData(data);
  };

  const dropdownOptions = [
    "SWOT",
    "Customer Segmentation",
    "Purchase Criteria",
    "Channel Heatmap",
    "Loyalty/NPS",
    "Capability Heatmap"
  ];

  const handlePurchaseCriteriaGenerated = (data) => {
    setPurchaseCriteriaData(data);
  };

  const handleChannelHeatmapGenerated = (data) => {
    setChannelHeatmapData(data);
  };

  const handleLoyaltyNPSGenerated = (data) => {
    setLoyaltyNPSData(data);
  };

  const handleCapabilityHeatmapGenerated = (data) => {
    setCapabilityHeatmapData(data);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);

    setTimeout(() => {
      if (option === "SWOT" && swotRef.current) {
        swotRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Customer Segmentation" && customerSegmentationRef.current) {
        customerSegmentationRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Purchase Criteria" && purchaseCriteriaRef.current) {
        purchaseCriteriaRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Channel Heatmap" && channelHeatmapRef.current) {
        channelHeatmapRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Loyalty/NPS" && loyaltyNpsRef.current) {
        loyaltyNpsRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Capability Heatmap" && capabilityHeatmapRef.current) {
        capabilityHeatmapRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [phases, setPhases] = useState({});
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [businessData, setBusinessData] = useState({
    name: "",
    whatWeDo: "",
    products: "",
    targetAudience: "",
    uniqueValue: "",
  });

  const translatedDefaults = useMemo(() => ({
  name: t("yourBusiness"),
  whatWeDo: t("whatWeDo"),
}), [t]);
  const generateAnalysisWithFind = async () => {
    try {
      setIsLoadingAnalysis(true);
      showToastMessage('Generating your business analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);

      sortedQuestions.forEach(question => {
        if (userAnswers[question.id]) {
          const cleanQuestion = String(question.question)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      const response = await fetch(`${ML_API_BASE_URL}/find`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `ML API returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = `API Error: ${errorData.detail}`;
          }
        } catch (e) {
          errorMessage = `API Error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = responseText;
      }

      let analysisContent;
      if (typeof result === 'object' && result !== null) {
        analysisContent = JSON.stringify(result);
      } else {
        analysisContent = String(result);
      }

      if (analysisContent) {
        setAnalysisResult(analysisContent);
        
        // Save the new analysis to backend
        await saveAnalysisToBackend(analysisContent, 'swot');
        
        showToastMessage('📊 Business analysis generated successfully! Check the Analysis tab.', 'success');
      } else {
        throw new Error('Empty or invalid response from analysis API');
      }

    } catch (error) {
      if (error.message.includes('charmap')) {
        showToastMessage('Text encoding error occurred. Please check your answers for special characters.', 'error');
      } else if (error.message.includes('API Error:')) {
        showToastMessage(error.message, 'error');
      } else {
        showToastMessage('Failed to generate analysis. Please try again.', 'error');
      }
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Unified regenerate all function
  const regenerateAllAnalysis = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage(
        "Initial phase must be completed to regenerate analysis.",
        "warning"
      );
      return;
    }

    try {
      setIsRegeneratingAll(true);
      showToastMessage("Regenerating all analysis components...", "info");

      // Clear existing data to trigger re-generation
      setAnalysisResult("");
      setCustomerSegmentationData(null);
      setPurchaseCriteriaData(null);
      setChannelHeatmapData(null);
      setLoyaltyNPSData(null);
      setCapabilityHeatmapData(null);

      // Wait a moment for state to clear
      await new Promise(resolve => setTimeout(resolve, 100));

      // Regenerate SWOT analysis first
      await generateAnalysisWithFind();

      showToastMessage("All analysis components regenerated successfully!", "success");

    } catch (error) {
      console.error('Error regenerating all analysis:', error);
      showToastMessage(
        "Failed to regenerate some analysis components. Please try again.",
        "error"
      );
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const PHASES = {
    INITIAL: "initial",
    ESSENTIAL: "essential",
    GOOD: "good",
    EXCELLENT: "excellent",
  };

  const getMandatoryQuestionsByPhase = (phase) => {
    return questions.filter(
      (q) => q.phase === phase && q.severity === "mandatory"
    );
  };

  const isPhaseCompleted = (phase) => {
    const mandatoryQuestions = getMandatoryQuestionsByPhase(phase);
    return mandatoryQuestions.every((q) => userAnswers[q.id]);
  };

  const getUnlockedFeatures = () => {
    const features = {
      brief: true,
      analysis: false,
    };

    if (isPhaseCompleted(PHASES.INITIAL)) {
      features.analysis = true;
    }

    return features;
  };

  const unlockedFeatures = getUnlockedFeatures();

  // Generate unique keys for regeneration
  const getRegenerationKey = (componentName) => {
    return isRegeneratingAll ? Date.now() : 'normal';
  };

  // Component for Analysis Controls (Dropdown + Regenerate All + PDF Export)
  const AnalysisControls = () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          style={{
            backgroundColor: "#fff",
            color: "#1a73e8",
            border: "1px solid #d1d5db",
            borderRadius: "13px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          {selectedOption}
          <ChevronDown size={16} style={{ marginLeft: 8 }} />
        </button>

        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: "180px",
              zIndex: 1000,
            }}
          >
            {dropdownOptions.map((item) => (
              <div
                key={item}
                onClick={() => handleOptionClick(item)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Regenerate Button */}
      <button
        onClick={regenerateAllAnalysis}
        disabled={isRegeneratingAll || isLoadingAnalysis || !unlockedFeatures.analysis}
        style={{
          backgroundColor: isRegeneratingAll ? "#f3f4f6" : "#10b981",
          color: isRegeneratingAll ? "#6b7280" : "#fff",
          border: "none",
          borderRadius: "13px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          cursor: isRegeneratingAll ? "not-allowed" : "pointer",
          gap: "8px",
          transition: "all 0.2s ease"
        }}
      >
        {isRegeneratingAll ? (
          <>
            <Loader size={16} className="animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <RefreshCw size={16} />
            {t('RegenerateAll')}
          </>
        )}
      </button>

      <PDFExportButton
        analysisResult={analysisResult}
        businessName={businessData.name}
        onToastMessage={showToastMessage}
      />
    </div>
  );

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

  const handleAnalysisTabClick = () => {
    if (!unlockedFeatures.analysis) return;

    if (isMobile) {
      setActiveTab("analysis");
    } else {
      if (!isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("analysis");

        setTimeout(() => {
          setIsSliding(false);
        }, 1000);
      }
    }
  };

  const handleBackFromAnalysis = () => {
    if (isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(false);
      setActiveTab("brief");

      setTimeout(() => {
        setIsSliding(false);
      }, 1000);
    }
  };

  const handleQuestionsLoaded = (loadedQuestions, loadedPhases) => {
    setQuestions(loadedQuestions);
    setPhases(loadedPhases);
    setQuestionsLoaded(true);
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

  const handleBusinessDataUpdate = (updates) => {
    setBusinessData((prev) => ({ ...prev, ...updates }));
  };

  const handleNewAnswer = (questionId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

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
      setBusinessData((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleAnswerUpdate = (questionId, newAnswer) => {
    setUserAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: newAnswer,
      };
      return updated;
    });

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
      setBusinessData((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleAnalysisGenerated = (analysis) => {
    setAnalysisResult(analysis);
    setIsLoadingAnalysis(false);
    // Save to backend when analysis is generated from chat
    saveAnalysisToBackend(analysis, 'swot');
  };

  const handleStrategicAnalysisGenerated = (strategicAnalysis) => {
    setStrategicAnalysisResult(strategicAnalysis);
    setIsLoadingAnalysis(false);
  };

  const showToastMessage = (message, type = "success") => {
    setShowToast({ show: true, message, type });

    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleAnalysisRegeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage(
        "Initial phase must be completed to regenerate analysis.",
        "warning"
      );
      return;
    }

    try {
      setIsAnalysisRegenerating(true);
      showToastMessage("Regenerating analysis with updated answers...", "info");

      await new Promise((resolve) => setTimeout(resolve, 100));

      await generateAnalysisWithFind();

    } catch (error) {
      showToastMessage(
        "Failed to regenerate analysis. Please try again.",
        "error"
      );
    } finally {
      setIsAnalysisRegenerating(false);
    }
  };

  const handleManualAnalysisGeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage(
        "Complete the initial phase to generate analysis.",
        "warning"
      );
      return;
    }

    await generateAnalysisWithFind();
  };

  const completedPhases = new Set();
  if (isPhaseCompleted(PHASES.INITIAL)) completedPhases.add("initial");
  if (isPhaseCompleted(PHASES.ESSENTIAL)) completedPhases.add("essential");
  if (isPhaseCompleted(PHASES.GOOD)) completedPhases.add("good");
  if (isPhaseCompleted(PHASES.EXCELLENT)) completedPhases.add("excellent");

  const handleBack = () => {
    window.history.back();
  };

  // Render analysis content with loading state
  const renderAnalysisContent = () => {
    if (isLoadingAnalysis || isAnalysisRegenerating || isRegeneratingAll || isLoadingLatestAnalysis) {
      return (
        <div className="analysis-loading">
          <Loader size={24} className="spinner" />
          <span>
            {isLoadingLatestAnalysis
              ? "Loading latest analysis..."
              : isRegeneratingAll
              ? "Regenerating all analysis components..."
              : isAnalysisRegenerating
              ? "Regenerating your business analysis..."
              : "Generating your business analysis..."}
          </span>
        </div>
      );
    }

    if (analysisResult) {
      return (
        <div id="analysis-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
          <div ref={swotRef}>
            <SwotAnalysis
              analysisResult={analysisResult}
              businessName={businessData.name}
            />
          </div>
          <div ref={customerSegmentationRef}>
            <CustomerSegmentation
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handleCustomerSegmentationGenerated}
              key={`customer-segmentation-${getRegenerationKey('customerSegmentation')}`}
            />
          </div>
          <div ref={purchaseCriteriaRef}>
            <PurchaseCriteria
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handlePurchaseCriteriaGenerated}
              key={`purchase-criteria-${getRegenerationKey('purchaseCriteria')}`}
            />
          </div>
          <div ref={channelHeatmapRef}>
            <ChannelHeatmap
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handleChannelHeatmapGenerated}
              key={`channel-heatmap-${getRegenerationKey('channelHeatmap')}`}
            />
          </div>
          <div ref={loyaltyNpsRef}>
            <LoyaltyNPS
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handleLoyaltyNPSGenerated}
              key={`loyalty-nps-${getRegenerationKey('loyaltyNPS')}`}
            />
          </div>
          <div ref={capabilityHeatmapRef}>
            <CapabilityHeatmap
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handleCapabilityHeatmapGenerated}
              key={`capability-heatmap-${getRegenerationKey('capabilityHeatmap')}`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="analysis-empty">
        <p>
          {t("Your business analysis will appear here once generated.")}
        </p>
        <p>
          <p>{t("Continue the conversation to trigger analysis generation.")}</p>
        </p>
        {isPhaseCompleted(PHASES.INITIAL) && (
          <button
            className="generate-analysis-btn"
            onClick={handleManualAnalysisGeneration}
            disabled={isLoadingAnalysis}
          >
            {isLoadingAnalysis
              ? t("Generating...")
              : t("Generate Analysis Now")}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="business-setup-container">
      <MenuBar />

      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}
      
      {!isAnalysisExpanded && (
        <div className="sub-header">
          <div className="sub-header-content">
            <button
              className="back-button"
              onClick={handleBack}
              aria-label="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="business-name">{businessData.name}</span>
            <div className="header-spacer"></div>
          </div>
        </div>
      )}

      {isMobile && questionsLoaded && (
        <>
          {["chat", "brief", "analysis"].includes(activeTab) && (
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
            <div className="logo-circle">
              <div className="dots-grid">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
            <h2 className="welcome-heading">{t("letsBegin")}</h2>
            <p className="welcome-text">
              {t("welcomeToTraxia")}
            </p>
          </div>

          <ChatComponent
            userAnswers={userAnswers}
            onBusinessDataUpdate={handleBusinessDataUpdate}
            onNewAnswer={handleNewAnswer}
            onAnalysisGenerated={handleAnalysisGenerated}
            onStrategicAnalysisGenerated={handleStrategicAnalysisGenerated}
            onQuestionsLoaded={handleQuestionsLoaded}
          />
        </div>

        {questionsLoaded && (
          <div
            className={`info-panel ${isMobile
              ? activeTab === "brief" || activeTab === "analysis"
                ? "active"
                : ""
              : ""
              } ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}
          >
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  <div className="desktop-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "0" }}>
                      <button
                        className="desktop-tab"
                        onClick={handleBackFromAnalysis}
                        disabled={isSliding}
                      >
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
                        <p>
                          {t("completePhaseMessage")}
                        </p>
                      </div>
                    )}

                    {!isMobile && (
                      <div className="progress-area">
                        <div className="progress-label">
                          {t('progress')}: {actualProgress}% ({answeredQuestions}/
                          {totalQuestions})
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${actualProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <EditableBriefSection
                      questions={questions}
                      userAnswers={userAnswers}
                      businessData={businessData}
                      onBusinessDataUpdate={handleBusinessDataUpdate}
                      onAnswerUpdate={handleAnswerUpdate}
                      onAnalysisRegenerate={handleAnalysisRegeneration}
                      isAnalysisRegenerating={isAnalysisRegenerating}
                      completedPhases={completedPhases}
                    />
                  </div>
                )}

                {activeTab === "analysis" && unlockedFeatures.analysis && (
                  <div className="analysis-section">
                    {isMobile && (
                      <div style={{ padding: "1rem", background: "#ffffffff" }}>
                        <AnalysisControls />
                      </div>
                    )}
                    
                    <div className="analysis-content">
                      {renderAnalysisContent()}
                    </div>
                  </div>
                )}

                {activeTab === "analysis" && !unlockedFeatures.analysis && (
                  <div className="locked-analysis">
                    <div className="lock-icon">🔒</div>
                    <h3>Analysis Locked</h3>
                    <p className="description">
                      Complete all initial phase questions to unlock your
                      business analysis.
                    </p>
                    <p className="progress-info">
                      Current Progress: {actualProgress}% ({answeredQuestions}/
                      {totalQuestions})
                    </p>
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