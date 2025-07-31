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
    return mandatoryQuestions.every((q) => userAnswers[q.question_id]);
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

  // Load latest analysis from chat history
const loadLatestAnalysis = async () => {
  try {
    setIsLoadingLatestAnalysis(true);
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/user/conversation-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      
      // Load SWOT analysis
      const swotMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'swot' && msg.metadata?.analysisData
      );
      
      if (swotMessages && swotMessages.length > 0) {
        const latestSwot = swotMessages[swotMessages.length - 1];
        setAnalysisResult(latestSwot.metadata.analysisData);
      }

      // Load Customer Segmentation analysis
      const customerSegmentationMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'customerSegmentation' && msg.metadata?.analysisData
      );
      
      if (customerSegmentationMessages && customerSegmentationMessages.length > 0) {
        const latestCustomerSegmentation = customerSegmentationMessages[customerSegmentationMessages.length - 1];
        setCustomerSegmentationData(latestCustomerSegmentation.metadata.analysisData);
      }

      // Load Purchase Criteria analysis
      const purchaseCriteriaMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'purchaseCriteria' && msg.metadata?.analysisData
      );
      
      if (purchaseCriteriaMessages && purchaseCriteriaMessages.length > 0) {
        const latestPurchaseCriteria = purchaseCriteriaMessages[purchaseCriteriaMessages.length - 1];
        setPurchaseCriteriaData(latestPurchaseCriteria.metadata.analysisData);
      }

      // Load Loyalty NPS analysis
      const loyaltyNPSMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'loyaltyNPS' && msg.metadata?.analysisData
      );
      
      if (loyaltyNPSMessages && loyaltyNPSMessages.length > 0) {
        const latestLoyaltyNPS = loyaltyNPSMessages[loyaltyNPSMessages.length - 1];
        setLoyaltyNPSData(latestLoyaltyNPS.metadata.analysisData);
      }

      // Load Channel Heatmap analysis
      const channelHeatmapMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'channelHeatmap' && msg.metadata?.analysisData
      );
      
      if (channelHeatmapMessages && channelHeatmapMessages.length > 0) {
        const latestChannelHeatmap = channelHeatmapMessages[channelHeatmapMessages.length - 1];
        setChannelHeatmapData(latestChannelHeatmap.metadata.analysisData);
      }

      // Load Capability Heatmap analysis
      const capabilityHeatmapMessages = result.chat_messages?.filter(msg => 
        msg.metadata?.analysisType === 'capabilityHeatmap' && msg.metadata?.analysisData
      );
      
      if (capabilityHeatmapMessages && capabilityHeatmapMessages.length > 0) {
        const latestCapabilityHeatmap = capabilityHeatmapMessages[capabilityHeatmapMessages.length - 1];
        setCapabilityHeatmapData(latestCapabilityHeatmap.metadata.analysisData);
      }
    }
  } catch (error) {
    console.error('Error loading latest analysis:', error);
  } finally {
    setIsLoadingLatestAnalysis(false);
  }
};
  // Save analysis using chat message system
  const saveAnalysisToBackend = async (analysisData, analysisType = 'swot') => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/user/save-chat-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_type: 'system',
          message_text: `${analysisType.toUpperCase()} analysis generated`,
          question_id: null,
          metadata: {
            analysisType: analysisType,
            analysisData: analysisData,
            isAnalysisGeneration: true
          }
        })
      });

      if (response.ok) {
        console.log(`📊 ${analysisType} analysis saved to backend`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  };

  const generateAnalysisWithFind = async () => {
    try {
      setIsLoadingAnalysis(true);
      showToastMessage('Generating your business analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

      sortedQuestions.forEach(question => {
        if (userAnswers[question.question_id]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.question_id])
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

  // Generate Customer Segmentation analysis
  const generateCustomerSegmentationAnalysis = async () => {
    try {
      showToastMessage('Generating customer segmentation analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

      sortedQuestions.forEach(question => {
        if (userAnswers[question.question_id]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.question_id])
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
        throw new Error('No answered questions available for customer segmentation analysis');
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
        throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result && result.customerSegmentation) {
        setCustomerSegmentationData(result.customerSegmentation);
        
        // Save the customer segmentation analysis to backend
        await saveAnalysisToBackend(result.customerSegmentation, 'customerSegmentation');
        
        showToastMessage('📊 Customer segmentation analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from customer segmentation API');
      }

    } catch (error) {
      console.error('Error generating customer segmentation analysis:', error);
      showToastMessage('Failed to generate customer segmentation analysis. Please try again.', 'error');
    }
  };

  // Generate Purchase Criteria analysis
  const generatePurchaseCriteriaAnalysis = async () => {
    try {
      showToastMessage('Generating purchase criteria analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

      sortedQuestions.forEach(question => {
        if (userAnswers[question.question_id]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.question_id])
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
        throw new Error('No answered questions available for purchase criteria analysis');
      }

      const response = await fetch(`${ML_API_BASE_URL}/purchase-criteria`, {
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
        throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result && result.purchaseCriteria) {
        setPurchaseCriteriaData(result.purchaseCriteria);
        
        // Save the purchase criteria analysis to backend
        await saveAnalysisToBackend(result.purchaseCriteria, 'purchaseCriteria');
        
        showToastMessage('📊 Purchase criteria analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from purchase criteria API');
      }

    } catch (error) {
      console.error('Error generating purchase criteria analysis:', error);
      showToastMessage('Failed to generate purchase criteria analysis. Please try again.', 'error');
    }
  };

  const generateLoyaltyNPSAnalysis = async () => {
  try {
    showToastMessage('Generating loyalty & NPS analysis...', 'info');

    const questionsArray = [];
    const answersArray = [];

    const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

    sortedQuestions.forEach(question => {
      if (userAnswers[question.question_id]) {
        const cleanQuestion = String(question.question_text)
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/[\u2026]/g, '...')
          .replace(/[^\x00-\x7F]/g, '')
          .trim();

        const cleanAnswer = String(userAnswers[question.question_id])
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
      throw new Error('No answered questions available for loyalty NPS analysis');
    }

    const response = await fetch(`${ML_API_BASE_URL}/loyalty-metrics`, {
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
      throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result && result.loyaltyMetrics) {
      setLoyaltyNPSData(result.loyaltyMetrics);
      
      // Save the loyalty NPS analysis to backend
      await saveAnalysisToBackend(result.loyaltyMetrics, 'loyaltyNPS');
      
      showToastMessage('📊 Loyalty & NPS analysis generated successfully!', 'success');
    } else {
      throw new Error('Invalid response structure from loyalty NPS API');
    }

  } catch (error) {
    console.error('Error generating loyalty NPS analysis:', error);
    showToastMessage('Failed to generate loyalty NPS analysis. Please try again.', 'error');
  }
};
const generateChannelHeatmapAnalysis = async () => {
  try {
    showToastMessage('Generating channel heatmap analysis...', 'info');

    const questionsArray = [];
    const answersArray = [];

    const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

    sortedQuestions.forEach(question => {
      if (userAnswers[question.question_id]) {
        const cleanQuestion = String(question.question_text)
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/[\u2026]/g, '...')
          .replace(/[^\x00-\x7F]/g, '')
          .trim();

        const cleanAnswer = String(userAnswers[question.question_id])
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
      throw new Error('No answered questions available for channel heatmap analysis');
    }

    const response = await fetch(`${ML_API_BASE_URL}/channel-heatmap`, {
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
      throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result && result.channelHeatmap) {
      setChannelHeatmapData(result.channelHeatmap);
      
      // Save the channel heatmap analysis to backend
      await saveAnalysisToBackend(result.channelHeatmap, 'channelHeatmap');
      
      showToastMessage('📊 Channel heatmap analysis generated successfully!', 'success');
    } else {
      throw new Error('Invalid response structure from channel heatmap API');
    }

  } catch (error) {
    console.error('Error generating channel heatmap analysis:', error);
    showToastMessage('Failed to generate channel heatmap analysis. Please try again.', 'error');
  }
};

// Generate Capability Heatmap analysis
const generateCapabilityHeatmapAnalysis = async () => {
  try {
    showToastMessage('Generating capability heatmap analysis...', 'info');

    const questionsArray = [];
    const answersArray = [];

    const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

    sortedQuestions.forEach(question => {
      if (userAnswers[question.question_id]) {
        const cleanQuestion = String(question.question_text)
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/[\u2026]/g, '...')
          .replace(/[^\x00-\x7F]/g, '')
          .trim();

        const cleanAnswer = String(userAnswers[question.question_id])
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
      throw new Error('No answered questions available for capability heatmap analysis');
    }

    const response = await fetch(`${ML_API_BASE_URL}/capability-heatmap`, {
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
      throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle both possible response formats
    let dataToSave = null;
    if (result && result.capabilityHeatmap) {
      dataToSave = result.capabilityHeatmap;
    } else if (result && result.capabilities) {
      dataToSave = result;
    } else {
      throw new Error('Invalid response structure from capability heatmap API');
    }

    if (dataToSave) {
      setCapabilityHeatmapData(dataToSave);
      
      // Save the capability heatmap analysis to backend
      await saveAnalysisToBackend(dataToSave, 'capabilityHeatmap');
      
      showToastMessage('📊 Capability heatmap analysis generated successfully!', 'success');
    }

  } catch (error) {
    console.error('Error generating capability heatmap analysis:', error);
    showToastMessage('Failed to generate capability heatmap analysis. Please try again.', 'error');
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

    // Regenerate all analyses
    await Promise.all([
      generateAnalysisWithFind(),
      generateCustomerSegmentationAnalysis(),
      generatePurchaseCriteriaAnalysis(),
      generateLoyaltyNPSAnalysis(),
      generateChannelHeatmapAnalysis(),
      generateCapabilityHeatmapAnalysis()
    ]);

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

  // Generate unique keys for regeneration
  const getRegenerationKey = (componentName) => {
    return isRegeneratingAll ? Date.now() : 'normal';
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

  // Component for Analysis Controls (Dropdown + Regenerate All + PDF Export)
  const AnalysisControls = () => (
    <div className="analysis-controls-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <div ref={dropdownRef} className="dropdown-wrapper" style={{ position: "relative" }}>
        <button
          className="dropdown-button"
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

  const handleCustomerSegmentationGeneratedFromChat = (customerSegmentationData) => {
    setCustomerSegmentationData(customerSegmentationData);
    // Data is already saved in chat component, no need to save again
  };

  const handlePurchaseCriteriaGeneratedFromChat = (purchaseCriteriaData) => {
    setPurchaseCriteriaData(purchaseCriteriaData);
    // Data is already saved in chat component, no need to save again
  };

  const handleLoyaltyNPSGeneratedFromChat = (loyaltyNPSData) => {
  setLoyaltyNPSData(loyaltyNPSData);
  // Data is already saved in chat component, no need to save again
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

    await Promise.all([
      generateAnalysisWithFind(),
      generateCustomerSegmentationAnalysis(),
      generatePurchaseCriteriaAnalysis(),
      generateLoyaltyNPSAnalysis(),
      generateChannelHeatmapAnalysis(),
      generateCapabilityHeatmapAnalysis()
    ]);

  } catch (error) {
    showToastMessage(
      "Failed to regenerate analysis. Please try again.",
      "error"
    );
  } finally {
    setIsAnalysisRegenerating(false);
  }
};
const handleChannelHeatmapGeneratedFromChat = (channelHeatmapData) => {
  setChannelHeatmapData(channelHeatmapData);
  // Data is already saved in chat component, no need to save again
};

const handleCapabilityHeatmapGeneratedFromChat = (capabilityHeatmapData) => {
  setCapabilityHeatmapData(capabilityHeatmapData);
  // Data is already saved in chat component, no need to save again
};

 const handleManualAnalysisGeneration = async () => {
  if (!isPhaseCompleted(PHASES.INITIAL)) {
    showToastMessage(
      "Complete the initial phase to generate analysis.",
      "warning"
    );
    return;
  }

  await Promise.all([
    generateAnalysisWithFind(),
    generateCustomerSegmentationAnalysis(),
    generatePurchaseCriteriaAnalysis(),
    generateLoyaltyNPSAnalysis(),
    generateChannelHeatmapAnalysis(),
    generateCapabilityHeatmapAnalysis()
  ]);
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
              customerSegmentationData={customerSegmentationData}
              key={`customer-segmentation-${getRegenerationKey('customerSegmentation')}`}
            />
          </div>
          <div ref={purchaseCriteriaRef}>
            <PurchaseCriteria
              questions={questions}
              userAnswers={userAnswers}
              businessName={businessData.name}
              onDataGenerated={handlePurchaseCriteriaGenerated}
              purchaseCriteriaData={purchaseCriteriaData}
              key={`purchase-criteria-${getRegenerationKey('purchaseCriteria')}`}
            />
          </div>
          <div ref={channelHeatmapRef}>
  <ChannelHeatmap
    questions={questions}
    userAnswers={userAnswers}
    businessName={businessData.name}
    onDataGenerated={handleChannelHeatmapGenerated}
    onRegenerate={() => {
      // Clear data and regenerate
      setChannelHeatmapData(null);
      generateChannelHeatmapAnalysis();
    }}
    isRegenerating={isRegeneratingAll} 
    channelHeatmapData={channelHeatmapData}
    key={`channel-heatmap-${getRegenerationKey('channelHeatmap')}`}
  />
</div>
          <div ref={loyaltyNpsRef}>
  <LoyaltyNPS
    questions={questions}
    userAnswers={userAnswers}
    businessName={businessData.name}
    onDataGenerated={handleLoyaltyNPSGenerated}
    onRegenerate={() => { 
      setLoyaltyNPSData(null);
      generateLoyaltyNPSAnalysis();
    }}
    isRegenerating={isRegeneratingAll} 
    loyaltyNPSData={loyaltyNPSData}
    key={`loyalty-nps-${getRegenerationKey('loyaltyNPS')}`}
  />
</div>
          <div ref={capabilityHeatmapRef}>
  <CapabilityHeatmap
    questions={questions}
    userAnswers={userAnswers}
    businessName={businessData.name}
    onDataGenerated={handleCapabilityHeatmapGenerated}
    onRegenerate={() => {
      // Clear data and regenerate
      setCapabilityHeatmapData(null);
      generateCapabilityHeatmapAnalysis();
    }}
    isRegenerating={isRegeneratingAll} 
    capabilityHeatmapData={capabilityHeatmapData}
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
            {/* Back button moved inside welcome area */}
            <button
              className="back-button"
              onClick={handleBack}
              aria-label="Go Back"
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
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
  onCustomerSegmentationGenerated={handleCustomerSegmentationGeneratedFromChat}
  onPurchaseCriteriaGenerated={handlePurchaseCriteriaGeneratedFromChat}
  onLoyaltyNPSGenerated={handleLoyaltyNPSGeneratedFromChat} // Add this line
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