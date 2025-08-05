import React, { useState, useEffect, useRef, useMemo } from "react";
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

const BusinessSetupPage = () => {
  const location = useLocation();
  const business = location.state?.business;
  const selectedBusinessId = location.state?.business?._id;
  const selectedBusinessName = location.state?.business?.business_name;
  const { t } = useTranslation();

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
  const [customerSegmentationData, setCustomerSegmentationData] = useState(null);
  const [purchaseCriteriaData, setPurchaseCriteriaData] = useState(null);
  const [channelHeatmapData, setChannelHeatmapData] = useState(null);
  const [loyaltyNPSData, setLoyaltyNPSData] = useState(null);
  const [capabilityHeatmapData, setCapabilityHeatmapData] = useState(null);
  const [swotAnalysisResult, setSwotAnalysisResult] = useState("");
  const [isAnalysisRegenerating, setIsAnalysisRegenerating] = useState(false);

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

  // Constants
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const PHASES = {
    INITIAL: "initial",
    ESSENTIAL: "essential",
    GOOD: "good",
    EXCELLENT: "excellent",
  };

  // Load existing analysis on component mount
  useEffect(() => {
    if (selectedBusinessId && questionsLoaded) {
      loadExistingAnalysis();
    }
  }, [selectedBusinessId, questionsLoaded]);

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

  const isPhaseCompleted = (phase) => {
    const mandatoryQuestions = questions.filter(
      (q) => q.phase === phase && q.severity === "mandatory"
    );
    
    if (mandatoryQuestions.length === 0) return false;
    
    return mandatoryQuestions.every((q) => {
      const questionId = q._id;
      return userAnswers[questionId] && userAnswers[questionId].trim();
    });
  };

  const getUnlockedFeatures = () => {
    // Check using completedQuestions set which is more reliable
    const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
    const completedInitialQuestions = initialQuestions.filter(q => completedQuestions.has(q._id));
    const isInitialComplete = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
    
    return {
      brief: true,
      analysis: isInitialComplete
    };
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

  // Load existing analysis from API
  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.phase_analysis && data.phase_analysis.length > 0) {
          loadExistingAnalysisData(data.phase_analysis);
        }
      }
    } catch (error) {
      console.error('Error loading existing analysis:', error);
    }
  };

  const loadExistingAnalysisData = (phaseAnalysisArray) => {
    try {
      // Get the most recent analysis for each type
      const latestAnalysisByType = {};
      phaseAnalysisArray
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach(analysis => {
          const type = analysis.analysis_type;
          if (!latestAnalysisByType[type]) {
            latestAnalysisByType[type] = analysis;
          }
        });

      // Load each analysis type
      Object.values(latestAnalysisByType).forEach(analysis => {
        const { analysis_type, analysis_data } = analysis;

        switch (analysis_type) {
          case 'swot':
            setSwotAnalysisResult(typeof analysis_data === 'string' ? analysis_data : JSON.stringify(analysis_data));
            break;
          case 'customerSegmentation':
            setCustomerSegmentationData(analysis_data);
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
        }
      });

      const analysisCount = Object.keys(latestAnalysisByType).length;
      if (analysisCount > 0) {
        showToastMessage(`✅ Loaded ${analysisCount} existing analysis components`, 'success');
      }
    } catch (error) {
      console.error('Error loading existing analysis data:', error);
    }
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData, analysisType) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: 'initial',
          analysis_type: analysisType,
          analysis_name: `${analysisType.toUpperCase()} Analysis`,
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: { generated_at: new Date().toISOString() }
        })
      });
      return response.ok;
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  };

  // Generate individual analysis
  const generateSingleAnalysis = async (analysisType, endpoint, dataKey, setter) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id])
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
        throw new Error(`No answered questions available for ${analysisType} analysis`);
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

  // Generate SWOT analysis
  const generateSWOTAnalysis = async () => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question._id]) {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
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

  // Main function to regenerate all analysis
  const regenerateAllAnalysis = async () => {
    // Check current phase completion status
    const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
    const completedInitialQuestions = initialQuestions.filter(q => {
      return userAnswers[q._id] && userAnswers[q._id].trim();
    });
    
    const isInitialComplete = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
    
    if (!isInitialComplete) {
      showToastMessage("Initial phase must be completed to regenerate analysis.", "warning");
      return;
    }

    if (isRegeneratingRef.current) {
      return;
    }

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      showToastMessage("Regenerating all analysis components...", "info");

      // Clear existing data
      setSwotAnalysisResult("");
      setCustomerSegmentationData(null);
      setPurchaseCriteriaData(null);
      setChannelHeatmapData(null);
      setLoyaltyNPSData(null);
      setCapabilityHeatmapData(null);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate all analysis
      const analysisPromises = [
        generateSWOTAnalysis(),
        generateSingleAnalysis('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData),
        generateSingleAnalysis('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData),
        generateSingleAnalysis('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData),
        generateSingleAnalysis('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData),
        generateSingleAnalysis('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData)
      ];

      const results = await Promise.allSettled(analysisPromises);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        showToastMessage(
          `${analysisPromises.length - failures.length}/${analysisPromises.length} analyses completed successfully.`,
          failures.length < analysisPromises.length ? "warning" : "error"
        );
      } else {
        showToastMessage("All analysis components regenerated successfully!", "success");
      }

    } catch (error) {
      console.error('Error regenerating all analysis:', error);
      showToastMessage("Failed to regenerate analysis components. Please try again.", "error");
    } finally {
      isRegeneratingRef.current = false;
      setIsAnalysisRegenerating(false);
    }
  };

  // Event Handlers
  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions);
    setQuestionsLoaded(true);
  };

  const handleNewAnswer = (questionId, answer) => {
    console.log('New answer received:', { questionId, answer: answer.substring(0, 50) + '...' });
    
    setUserAnswers(prev => {
      const updatedAnswers = {
        ...prev,
        [questionId]: answer
      };
      
      console.log('Updated userAnswers:', Object.keys(updatedAnswers));
      return updatedAnswers;
    });

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

  const handleQuestionCompleted = (questionId) => {
    setCompletedQuestions(prev => {
      const newCompletedSet = new Set([...prev, questionId]);
      
      // Check if initial phase is completed with the updated set
      const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
      const completedInitialQuestions = initialQuestions.filter(q => newCompletedSet.has(q._id));
      
      console.log('Phase completion check:', {
        totalInitialQuestions: initialQuestions.length,
        completedInitialQuestions: completedInitialQuestions.length,
        questionJustCompleted: questionId,
        allCompletedQuestions: Array.from(newCompletedSet)
      });
      
      if (completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0) {
        // Initial phase just completed, trigger analysis generation
        console.log('Initial phase completed, triggering analysis generation');
        setTimeout(() => {
          regenerateAllAnalysisForCompletion();
        }, 100);
      }
      
      return newCompletedSet;
    });
  };

  // Special function for auto-generation when phase is completed
  const regenerateAllAnalysisForCompletion = async () => {
    if (isRegeneratingRef.current) {
      return;
    }

    try {
      isRegeneratingRef.current = true;
      setIsAnalysisRegenerating(true);
      showToastMessage("Initial phase completed! Generating analysis...", "info");

      // Clear existing data
      setSwotAnalysisResult("");
      setCustomerSegmentationData(null);
      setPurchaseCriteriaData(null);
      setChannelHeatmapData(null);
      setLoyaltyNPSData(null);
      setCapabilityHeatmapData(null);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate all analysis
      const analysisPromises = [
        generateSWOTAnalysis(),
        generateSingleAnalysis('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData),
        generateSingleAnalysis('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData),
        generateSingleAnalysis('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData),
        generateSingleAnalysis('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData),
        generateSingleAnalysis('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData)
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

  const handleAnalysisTabClick = () => {
    const unlockedFeatures = getUnlockedFeatures();
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

  // Dropdown handlers
  const dropdownOptions = [
    "SWOT",
    "Customer Segmentation", 
    "Purchase Criteria",
    "Channel Heatmap",
    "Loyalty/NPS",
    "Capability Heatmap"
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);

    setTimeout(() => {
      const refMap = {
        "SWOT": swotRef,
        "Customer Segmentation": customerSegmentationRef,
        "Purchase Criteria": purchaseCriteriaRef,
        "Channel Heatmap": channelHeatmapRef,
        "Loyalty/NPS": loyaltyNpsRef,
        "Capability Heatmap": capabilityHeatmapRef
      };

      const targetRef = refMap[option];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Individual regeneration handlers
  const createIndividualRegenerationHandler = (analysisType, endpoint, dataKey, setter, displayName) => {
    return async () => {
      // Check current phase completion using completedQuestions set
      const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
      const completedInitialQuestions = initialQuestions.filter(q => completedQuestions.has(q._id));
      const isInitialComplete = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
      
      if (!isInitialComplete || isRegeneratingRef.current) return;

      try {
        showToastMessage(`Regenerating ${displayName} analysis...`, "info");
        setter(null);
        await new Promise(resolve => setTimeout(resolve, 200));
        await generateSingleAnalysis(analysisType, endpoint, dataKey, setter);
        showToastMessage(`${displayName} analysis regenerated successfully!`, "success");
      } catch (error) {
        showToastMessage(`Failed to regenerate ${displayName} analysis.`, "error");
      }
    };
  };

  // Analysis Controls Component
  const AnalysisControls = () => {
    const unlockedFeatures = getUnlockedFeatures();
    
    return (
      <div className="analysis-controls-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div ref={dropdownRef} className="dropdown-wrapper" style={{ position: "relative" }}>
          <button
            className="dropdown-button"
            onClick={() => setShowDropdown(prev => !prev)}
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
            <div style={{
              position: "absolute",
              top: "110%",
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: "180px",
              zIndex: 1000,
            }}>
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
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={regenerateAllAnalysis}
          disabled={isAnalysisRegenerating || !unlockedFeatures.analysis}
          style={{
            backgroundColor: (isAnalysisRegenerating) ? "#f3f4f6" : "#10b981",
            color: (isAnalysisRegenerating) ? "#6b7280" : "#fff",
            border: "none",
            borderRadius: "13px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            cursor: (isAnalysisRegenerating) ? "not-allowed" : "pointer",
            gap: "8px",
            transition: "all 0.2s ease"
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
    const unlockedFeatures = getUnlockedFeatures();

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

    return (
      <div id="analysis-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
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
              'Customer segmentation'
            )}
            isRegenerating={false}
            canRegenerate={!isAnalysisRegenerating}
            customerSegmentationData={customerSegmentationData}
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
              'Purchase criteria'
            )}
            isRegenerating={false}
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
              'Channel heatmap'
            )}
            isRegenerating={false}
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
              'Loyalty NPS'
            )}
            isRegenerating={false}
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
              'Capability heatmap'
            )}
            isRegenerating={false}
            canRegenerate={!isAnalysisRegenerating}
            capabilityHeatmapData={capabilityHeatmapData}
            selectedBusinessId={selectedBusinessId}
          />
        </div>
      </div>
    );
  };

  // Calculate progress
  const totalQuestions = questions.length;
  const answeredQuestions = completedQuestions.size;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const unlockedFeatures = getUnlockedFeatures();

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
            <div className="header-section">
              <button
                className="back-button"
                onClick={handleBack}
                aria-label="Go Back"
                style={{
                  position: "absolute",
                  top: "0",
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSetupPage;