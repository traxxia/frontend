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
import StrategicAnalysis from "../components/StrategicAnalysis";
import PortersFiveForces from "../components/PortersFiveForces";
import PestelAnalysis from "../components/PestelAnalysis";

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
  const [strategicData, setStrategicData] = useState(null);

  // Individual component regenerating states
  const [isCustomerSegmentationRegenerating, setIsCustomerSegmentationRegenerating] = useState(false);
  const [isPurchaseCriteriaRegenerating, setIsPurchaseCriteriaRegenerating] = useState(false);
  const [isChannelHeatmapRegenerating, setIsChannelHeatmapRegenerating] = useState(false);
  const [isLoyaltyNPSRegenerating, setIsLoyaltyNPSRegenerating] = useState(false);
  const [isCapabilityHeatmapRegenerating, setIsCapabilityHeatmapRegenerating] = useState(false);
  const [isStrategicRegenerating, setIsStrategicRegenerating] = useState(false);
  const [portersData, setPortersData] = useState(null);
  const [pestelData, setPestelData] = useState(null);
  const [isPortersRegenerating, setIsPortersRegenerating] = useState(false);
  const [isPestelRegenerating, setIsPestelRegenerating] = useState(false);
  const portersRef = useRef(null);
  const pestelRef = useRef(null);
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
          case 'porters':
            setPortersData(analysis_data);
            break;
          case 'pestel':
            setPestelData(analysis_data);
            break;
          case 'strategic':
            setStrategicData(analysis_data);
            break;
        }
      });

      const analysisCount = Object.keys(latestAnalysisByType).length;
      // if (analysisCount > 0) {
      //   showToastMessage(`✅ Loaded ${analysisCount} existing analysis components`, 'success');
      // }
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
  const generatePortersAnalysis = async (freshAnswers = null) => {
    try {
      const questionsArray = [];
      const answersArray = [];
      const dataSource = freshAnswers || userAnswers;

      questions
        .filter(q => dataSource[q._id] && dataSource[q._id] !== '[Question Skipped]')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(dataSource[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for Porter\'s Five Forces analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/customer-segment`, {
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

  const generatePestelAnalysis = async (freshAnswers = null) => {
    try {
      const questionsArray = [];
      const answersArray = [];
      const dataSource = freshAnswers || userAnswers;

      questions
        .filter(q => dataSource[q._id] && dataSource[q._id] !== '[Question Skipped]')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(dataSource[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for PESTEL analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/customer-segment`, {
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
        throw new Error(`PESTEL API returned ${response.status}`);
      }

      const result = await response.json();
      const pestelContent = result.pestel_analysis || result.pestel || result;

      setPestelData(pestelContent);
      await saveAnalysisToBackend(pestelContent, 'pestel');
    } catch (error) {
      console.error('Error generating PESTEL analysis:', error);
      throw error;
    }
  };
  const generateStrategicAnalysis = async (freshAnswers = null) => {
    try {
      const questionsArray = [];
      const answersArray = [];
      const dataSource = freshAnswers || userAnswers;

      console.log('Generating strategic analysis with data:', Object.keys(dataSource).length, 'answers');

      questions
        .filter(q => dataSource[q._id] && dataSource[q._id] !== '[Question Skipped]')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(dataSource[question._id]);
        });

      console.log('Strategic analysis: Processing', questionsArray.length, 'Q&A pairs');

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for strategic analysis');
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
        throw new Error(`Strategic API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Strategic API response:', result);

      // The API might return the data directly or in a nested structure
      const strategicContent = result.strategic_analysis || result.strategic || result;

      setStrategicData(strategicContent);
      await saveAnalysisToBackend(strategicContent, 'strategic');
      console.log('Strategic analysis completed and saved');
    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      throw error;
    }
  };
  // Generate individual analysis
  const generateSingleAnalysis = async (analysisType, endpoint, dataKey, setter) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      console.log(`Generating ${analysisType} analysis with current userAnswers:`, Object.keys(userAnswers).length);

      questions
        .filter(q => {
          const hasAnswer = userAnswers[q._id] && userAnswers[q._id].trim();
          console.log(`Question ${q._id}: ${hasAnswer ? 'HAS' : 'NO'} answer`);
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

      console.log(`${analysisType} analysis: Processing ${questionsArray.length} Q&A pairs`);

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
        console.log(`${analysisType} analysis completed and saved`);
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
      setStrategicData(null); // Add this
      setPortersData(null);
      setPestelData(null);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate all analysis including strategic
      const analysisPromises = [
        generateSWOTAnalysis(),
        generateSingleAnalysis('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData),
        generateSingleAnalysis('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData),
        generateSingleAnalysis('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData),
        generateSingleAnalysis('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData),
        generateSingleAnalysis('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData),
        generateStrategicAnalysis(),
        generatePortersAnalysis(),
        generatePestelAnalysis()

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

      console.log('Question completed:', {
        questionId,
        totalCompleted: newCompletedSet.size,
        allCompleted: Array.from(newCompletedSet)
      });

      return newCompletedSet;
    });
  };
  const handlePhaseCompleted = async (phase, updatedCompletedSet) => {
    console.log(`Phase ${phase} completed with updated set:`, Array.from(updatedCompletedSet));

    if (phase === 'initial') {
      setCompletedQuestions(updatedCompletedSet);

      // Generate analysis with fresh data from backend
      console.log('Triggering analysis generation after phase completion');
      await regenerateAllAnalysisForCompletion();
    }
  };
  
  // Special function for auto-generation when phase is completed
  const regenerateAllAnalysisForCompletion = async () => {
    if (isRegeneratingRef.current) {
      console.log('Analysis already in progress, skipping');
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
      setStrategicData(null); // Add this
      setPortersData(null);
      setPestelData(null);

      // Fetch fresh conversation data to get all answers
      const freshAnswers = await getFreshConversationData();

      console.log('Starting analysis generation with fresh answers:', Object.keys(freshAnswers).length);

      // Generate all analysis including strategic
      const analysisPromises = [
        generateSWOTAnalysisWithData(freshAnswers),
        generateSingleAnalysisWithData('customerSegmentation', 'customer-segment', 'customerSegmentation', setCustomerSegmentationData, freshAnswers),
        generateSingleAnalysisWithData('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', setPurchaseCriteriaData, freshAnswers),
        generateSingleAnalysisWithData('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', setLoyaltyNPSData, freshAnswers),
        generateSingleAnalysisWithData('channelHeatmap', 'channel-heatmap', 'channelHeatmap', setChannelHeatmapData, freshAnswers),
        generateSingleAnalysisWithData('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', setCapabilityHeatmapData, freshAnswers),
        generateStrategicAnalysis(freshAnswers), generatePortersAnalysis(freshAnswers),
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
  
  const generateSingleAnalysisWithData = async (analysisType, endpoint, dataKey, setter, freshAnswers) => {
    try {
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => freshAnswers[q._id] && freshAnswers[q._id] !== '[Question Skipped]')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(freshAnswers[question._id]);
        });

      console.log(`${analysisType} analysis with fresh data - Q&A pairs:`, questionsArray.length);

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
        console.log(`${analysisType} analysis completed and saved`);
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
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

      // Extract all completed answers from backend
      data.conversations?.forEach(conversation => {
        if (conversation.completion_status === 'complete') {
          const questionId = conversation.question_id;
          const allAnswers = conversation.conversation_flow
            .filter(item => item.type === 'answer')
            .map(a => a.text.trim())
            .filter(text => text.length > 0 && text !== '[Question Skipped]');

          if (allAnswers.length > 0) {
            freshAnswers[questionId] = allAnswers.join('. ');
          }
        }
      });

      console.log('Fresh answers from backend:', Object.keys(freshAnswers).length);

      // Update local state with fresh data
      setUserAnswers(prev => ({ ...prev, ...freshAnswers }));

      return freshAnswers;
    } catch (error) {
      console.error('Error fetching fresh conversation data:', error);
      // Fallback to current userAnswers
      return userAnswers;
    }
  };

  // In BusinessSetupPage.js - Add functions that use fresh data
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

      console.log('SWOT analysis with fresh data - Q&A pairs:', questionsArray.length);

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
  const handleStrategicTabClick = () => {
    const unlockedFeatures = getUnlockedFeatures();
    if (!unlockedFeatures.analysis) return;

    if (isMobile) {
      setActiveTab("strategic");
    } else {
      // For desktop - always expand when clicking Strategic tab
      if (!isAnalysisExpanded) {
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("strategic");
        setTimeout(() => setIsSliding(false), 1000);
      } else {
        // If already expanded, just switch to strategic tab
        setActiveTab("strategic");
      }
    }
  };

  const handleBackFromAnalysis = () => {
    if (isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(false);
      setActiveTab("brief");  // Always go back to brief when collapsing
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
    "Capability Heatmap",
    "Porter's Five Forces",
    "PESTEL Analysis" 
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
        "Capability Heatmap": capabilityHeatmapRef,
        "Porter's Five Forces": portersRef,
        "PESTEL Analysis": pestelRef,
        "Strategic": strategicRef
      };

      const targetRef = refMap[option];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Individual regeneration handlers with loading state tracking
  const createIndividualRegenerationHandler = (analysisType, endpoint, dataKey, setter, displayName, setIsRegenerating) => {
    return async () => {
      // Check current phase completion using completedQuestions set
      const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
      const completedInitialQuestions = initialQuestions.filter(q => completedQuestions.has(q._id));
      const isInitialComplete = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;

      if (!isInitialComplete || isRegeneratingRef.current) return;

      try {
        setIsRegenerating(true);
        showToastMessage(`Regenerating ${displayName}...`, "info");
        setter(null);
        await new Promise(resolve => setTimeout(resolve, 200));

        if (analysisType === 'porters') {
          await generatePortersAnalysis();
        } else if (analysisType === 'pestel') {
          await generatePestelAnalysis();
        } else if (analysisType === 'strategic') {
          await generateStrategicAnalysis();
        } else {
          await generateSingleAnalysis(analysisType, endpoint, dataKey, setter);
        }

        showToastMessage(`${displayName} regenerated successfully!`, "success");
      } catch (error) {
        showToastMessage(`Failed to regenerate ${displayName}.`, "error");
      } finally {
        setIsRegenerating(false);
      }
    };
  };

  const handlePortersRegenerate = createIndividualRegenerationHandler(
    'porters',
    'porters-five-forces',
    'porters',
    setPortersData,
    'Porter\'s Five Forces',
    setIsPortersRegenerating
  );

  const handlePestelRegenerate = createIndividualRegenerationHandler(
    'pestel',
    'pestel-analysis',
    'pestel',
    setPestelData,
    'PESTEL Analysis',
    setIsPestelRegenerating
  );

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
  const handleStrategicRegenerate = createIndividualRegenerationHandler(
    'strategic',
    'strategic-goals',
    'strategic',
    setStrategicData,
    'Strategic analysis',
    setIsStrategicRegenerating
  );
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
              'Customer segmentation',
              setIsCustomerSegmentationRegenerating
            )}
            isRegenerating={isCustomerSegmentationRegenerating}
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
            onRegenerate={handlePortersRegenerate}
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
            onRegenerate={handlePestelRegenerate}
            isRegenerating={isPestelRegenerating}
            canRegenerate={!isAnalysisRegenerating}
            pestelData={pestelData}
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
          {["chat", "brief", "analysis", "strategic"].includes(activeTab) && (  // Add "strategic" here
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
                onClick={handleStrategicTabClick}  // Use the expansion handler for mobile too
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
            onPhaseCompleted={handlePhaseCompleted}
          />
        </div>

        {questionsLoaded && (
          <div
            className={`info-panel ${isMobile
              ? activeTab === "brief" || activeTab === "analysis" || activeTab === "strategic"  // Add "strategic" here
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

                      {/* Analysis Tab in expanded view */}
                      {unlockedFeatures.analysis && (
                        <button
                          className={`desktop-tab ${activeTab === "analysis" ? "active" : ""}`}
                          onClick={() => setActiveTab("analysis")}  // Just switch tabs, don't collapse
                        >
                          {t("analysis")}
                        </button>
                      )}

                      {/* Strategic Tab in expanded view */}
                      {unlockedFeatures.analysis && (
                        <button
                          className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`}
                          onClick={() => setActiveTab("strategic")}  // Just switch tabs, don't collapse
                        >
                          Strategic
                        </button>
                      )}
                    </div>

                    {/* Show appropriate controls based on active tab */}
                    {activeTab === "analysis" && unlockedFeatures.analysis && (
                      <AnalysisControls />
                    )}

                    {activeTab === "strategic" && unlockedFeatures.analysis && (
                      <div className="strategic-controls">
                        <button
                          onClick={handleStrategicRegenerate}
                          disabled={isStrategicRegenerating}
                          style={{
                            backgroundColor: isStrategicRegenerating ? "#f3f4f6" : "#8b5cf6",
                            color: isStrategicRegenerating ? "#6b7280" : "#fff",
                            border: "none",
                            borderRadius: "13px",
                            padding: "10px 18px",
                            fontSize: "14px",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            cursor: isStrategicRegenerating ? "not-allowed" : "pointer",
                            gap: "8px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {isStrategicRegenerating ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              Regenerate Strategic
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {/* Show Analysis content when analysis tab is active */}
                      {activeTab === "analysis" && (
                        <div className="analysis-section">
                          <div className="analysis-content">
                            {renderAnalysisContent()}
                          </div>
                        </div>
                      )}

                      {/* Show Strategic content when strategic tab is active */}
                      {activeTab === "strategic" && (
                        <div className="strategic-section">
                          <div className="strategic-content">
                            <StrategicAnalysis
                              questions={questions}
                              userAnswers={userAnswers}
                              businessName={businessData.name}
                              onRegenerate={handleStrategicRegenerate}
                              isRegenerating={isStrategicRegenerating}
                              canRegenerate={!isAnalysisRegenerating}
                              strategicData={strategicData}
                              selectedBusinessId={selectedBusinessId}
                            />
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
                      onClick={handleAnalysisTabClick}  // This already handles expansion
                    >
                      {t("analysis")}
                    </button>
                  )}

                  {unlockedFeatures.analysis && (
                    <button
                      className={`desktop-tab ${activeTab === "strategic" ? "active" : ""}`}
                      onClick={handleStrategicTabClick}  // This will now handle expansion too
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

                {/* Strategic tab content - only show when initial phase is completed */}
                {activeTab === "strategic" && unlockedFeatures.analysis && (
                  <div className="strategic-section">
                    {isMobile && (
                      <div style={{ padding: "1rem", background: "#ffffffff" }}>
                        <div className="analysis-controls-wrapper" style={{ display: "flex", justifyContent: "center" }}>
                          <button
                            onClick={handleStrategicRegenerate}
                            disabled={isStrategicRegenerating}
                            style={{
                              backgroundColor: isStrategicRegenerating ? "#f3f4f6" : "#8b5cf6",
                              color: isStrategicRegenerating ? "#6b7280" : "#fff",
                              border: "none",
                              borderRadius: "13px",
                              padding: "10px 18px",
                              fontSize: "14px",
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              cursor: isStrategicRegenerating ? "not-allowed" : "pointer",
                              gap: "8px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            {isStrategicRegenerating ? (
                              <>
                                <Loader size={16} className="animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={16} />
                                Regenerate Strategic
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="strategic-content">
                      <StrategicAnalysis
                        questions={questions}
                        userAnswers={userAnswers}
                        businessName={businessData.name}
                        onRegenerate={handleStrategicRegenerate}
                        isRegenerating={isStrategicRegenerating}
                        canRegenerate={!isAnalysisRegenerating}
                        strategicData={strategicData}
                        selectedBusinessId={selectedBusinessId}
                      />
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