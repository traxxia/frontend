import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader } from "lucide-react";
import ChatComponent from "../components/ChatComponent";
import SwotAnalysis from "../components/SwotAnalysis";
import StrategicAcronym from "../components/StrategicAcronym";
import "../styles/businesspage.css";
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import { useAnalysisData } from "../hooks/useAnalysisData";
import { ChevronDown, Download } from "lucide-react";

const BusinessSetupPage = () => {
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

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Go to section");
  const dropdownRef = useRef(null);

  // PDF Export states
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const swotRef = useRef(null);
  const pestleRef = useRef(null);
  const porterRef = useRef(null);
  const strategicRef = useRef(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);

    setTimeout(() => {
      if (option === "SWOT" && swotRef.current) {
        swotRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "PESTLE" && pestleRef.current) {
        pestleRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "Porter's Five Forces" && porterRef.current) {
        porterRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (option === "S.T.R.A.T.E.G.I.C") {
        setActiveTab("strategic");
        setTimeout(() => {
          if (strategicRef.current) {
            strategicRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 200);
      }
    }, 100);
  };

  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // New state for slide effect
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [phases, setPhases] = useState({});
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [businessData, setBusinessData] = useState({
    name: "Your Business",
    whatWeDo:
      "Business description will appear here after answering questions in the chat.",
    products: "",
    targetAudience: "",
    uniqueValue: "",
  });

  const { generateAnalysis } = useAnalysisData();

  // Calculated values
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const actualProgress =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

  // Phase management
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
      strategic: false,
    };

    if (isPhaseCompleted(PHASES.INITIAL)) {
      features.analysis = true;
      features.strategic = true;
    }

    return features;
  };

  const unlockedFeatures = getUnlockedFeatures();

  // Enhanced PDF Export Functions
  const exportCompleteToPDF = async (elementId, filename, businessName, title) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Dynamic import for PDF libraries
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Show loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'pdf-loading-indicator';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
      `;
      loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          Generating PDF...
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      `;

      // Clone the content and clean it up for PDF
      const clonedElement = element.cloneNode(true);
      
      // Remove interactive elements and edit buttons
      const elementsToRemove = clonedElement.querySelectorAll(
        '.edit-button, .save-button, .cancel-button, .edit-actions, .download-pdf-btn, button, .simple-toast'
      );
      elementsToRemove.forEach(el => el.remove());

      // Style improvements for PDF
      const styles = document.createElement('style');
      styles.textContent = `
        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007bff;
        }
        .pdf-title {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .pdf-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 5px;
        }
        .pdf-date {
          font-size: 12px;
          color: #999;
        }
        .analysis-section, .strategic-section {
          margin-bottom: 30px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
          vertical-align: top;
        }
        .table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .analysis-box {
          margin-bottom: 8px;
          padding: 8px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
          background-color: #f8f9fa;
        }
        .analysis-table {
          width: 100%;
          margin-bottom: 20px;
        }
        .analysis-row {
          display: flex;
          width: 100%;
        }
        .analysis-cell {
          flex: 1;
          padding: 15px;
          margin: 5px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .strengths-bg { border-left-color: #28a745; background-color: #d4edda; }
        .weaknesses-bg { border-left-color: #dc3545; background-color: #f8d7da; }
        .opportunities-bg { border-left-color: #007bff; background-color: #d1ecf1; }
        .threats-bg { border-left-color: #ffc107; background-color: #fff3cd; }
        .strategic-item {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        h1, h2, h3, h4, h5 {
          color: #007bff;
          margin-bottom: 15px;
        }
        .conclusion-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }
      `;

      pdfContainer.appendChild(styles);

      // Add header
      const header = document.createElement('div');
      header.className = 'pdf-header';
      header.innerHTML = `
        <div class="pdf-title">${title}</div>
        <div class="pdf-subtitle">${businessName}</div>
        <div class="pdf-date">Generated on ${new Date().toLocaleDateString()}</div>
      `;
      pdfContainer.appendChild(header);

      // Add the cleaned content
      pdfContainer.appendChild(clonedElement);

      // Add footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 12px;
        color: #666;
      `;
      footer.innerHTML = `
        <p>This report was generated by Traxia AI - Your Strategic Business Advisor</p>
        <p>© ${new Date().getFullYear()} Traxia AI. All rights reserved.</p>
      `;
      pdfContainer.appendChild(footer);

      document.body.appendChild(pdfContainer);

      // Generate PDF
      const canvas = await html2canvas(pdfContainer, {
        width: 800,
        height: pdfContainer.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / pdfHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(pdfHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }

      // Clean up
      document.body.removeChild(pdfContainer);
      document.body.removeChild(loadingDiv);

      // Save the PDF
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Remove loading indicator if it exists
      const loadingDiv = document.getElementById('pdf-loading-indicator');
      if (loadingDiv) {
        document.body.removeChild(loadingDiv);
      }
      
      throw error;
    }
  };

  const handleDownloadAnalysis = async () => {
    if (!analysisResult) {
      showToastMessage("No analysis available to export", "warning");
      return;
    }

    try {
      setIsExportingPDF(true);
      showToastMessage("Generating comprehensive analysis PDF...", "info");
      
      const filename = `${businessData.name.replace(/[^a-z0-9]/gi, '_')}_Complete_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await exportCompleteToPDF(
        'analysis-pdf-content', 
        filename, 
        businessData.name, 
        'Complete Business Analysis Report'
      );
      
      showToastMessage("📄 Complete analysis PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("Error exporting analysis PDF:", error);
      showToastMessage("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadStrategic = async () => {
    if (!strategicAnalysisResult) {
      showToastMessage("No strategic analysis available to export", "warning");
      return;
    }

    try {
      setIsExportingPDF(true);
      showToastMessage("Generating strategic analysis PDF...", "info");
      
      const filename = `${businessData.name.replace(/[^a-z0-9]/gi, '_')}_Strategic_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await exportCompleteToPDF(
        'strategic-pdf-content', 
        filename, 
        businessData.name, 
        'S.T.R.A.T.E.G.I.C Analysis Report'
      );
      
      showToastMessage("📄 Strategic analysis PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("Error exporting strategic PDF:", error);
      showToastMessage("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);

      if (newIsMobile && (activeTab === "strategic" || activeTab === "brief")) {
        setActiveTab("chat");
      } else if (!newIsMobile && activeTab === "chat") {
        setActiveTab("brief");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  // Handle analysis tab click with slide effect
  const handleAnalysisTabClick = () => {
    if (!unlockedFeatures.analysis) return;

    if (isMobile) {
      setActiveTab("analysis");
    } else {
      if (!isAnalysisExpanded) {
        // Expand to full screen
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("analysis");

        // Animation duration should match CSS transition
        setTimeout(() => {
          setIsSliding(false);
        }, 1000);
      }
    }
  };

  // Handle strategic tab click with slide effect
  const handleStrategicTabClick = () => {
    if (!unlockedFeatures.strategic) return;

    if (isMobile) {
      setActiveTab("strategic");
    } else {
      if (!isAnalysisExpanded) {
        // Expand to full screen
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab("strategic");

        // Animation duration should match CSS transition
        setTimeout(() => {
          setIsSliding(false);
        }, 1000);
      }
    }
  };

  // Handle back from expanded analysis
  const handleBackFromAnalysis = () => {
    if (isAnalysisExpanded) {
      setIsSliding(true);
      setIsAnalysisExpanded(false);
      setActiveTab("brief"); // Return to brief tab

      setTimeout(() => {
        setIsSliding(false);
      }, 1000);
    }
  };

  // Callback when ChatComponent loads questions
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

  const createBusinessDataForAnalysis = () => {
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);

    let businessName = "Your Business";

    if (sortedQuestions[0] && userAnswers[sortedQuestions[0].id]) {
      const firstAnswer = userAnswers[sortedQuestions[0].id];
      const extractedName = extractBusinessName(firstAnswer);
      if (extractedName) {
        businessName = extractedName;
      }
    }

    const questionsWithAnswers = sortedQuestions
      .filter((question) => {
        const hasAnswer =
          userAnswers[question.id] &&
          typeof userAnswers[question.id] === "string" &&
          userAnswers[question.id].trim() !== "";

        return hasAnswer;
      })
      .map((question) => ({
        question_id: question.id,
        question_text: question.question,
        title: question.question,
        question: question.question,
        question_type: "open-ended",
        type: "open-ended",
        phase: question.phase,
        severity: question.severity,
        placeholder: question.question,
        nested: { question: question.question },
        answer: {
          description: userAnswers[question.id],
        },
        user_answer: {
          answer: userAnswers[question.id],
        },
        answered: true,
      }));

    const totalAnsweredQuestions = Object.keys(userAnswers).length;
    if (questionsWithAnswers.length !== totalAnsweredQuestions) {
      console.warn(
        `⚠️ Mismatch: Expected ${totalAnsweredQuestions} questions, but only ${questionsWithAnswers.length} passed filtering`
      );
    }

    const categories = [
      {
        category_id: 1,
        category_name: "Business Survey",
        name: "Business Survey",
        questions_answered: questionsWithAnswers.length,
        total_questions: questions.length,
        questions: questionsWithAnswers,
      },
    ];

    return {
      id: "chatbot-session",
      name: businessName,
      totalQuestions: questions.length,
      categories: categories,
      user: {
        name: businessName,
        company: businessName,
      },
      survey: {
        total_questions: questions.length,
      },
    };
  };

  // Analysis regeneration function
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

      const businessData = createBusinessDataForAnalysis();
      const strategicBooks = { part1: "", part2: "" };

      const analysisResult = await generateAnalysis(
        "swot",
        "chatbot-session",
        businessData,
        strategicBooks,
        true
      );

      if (analysisResult && !analysisResult.startsWith("Error")) {
        setAnalysisResult(analysisResult);
        showToastMessage(
          "📊 SWOT analysis regenerated successfully!",
          "success"
        );

        setTimeout(async () => {
          const strategicResult = await generateAnalysis(
            "strategic",
            "chatbot-session-strategic",
            businessData,
            strategicBooks,
            true
          );

          if (strategicResult && !strategicResult.startsWith("Error")) {
            setStrategicAnalysisResult(strategicResult);
            showToastMessage(
              "🎯 STRATEGIC analysis regenerated successfully!",
              "success"
            );
          } else {
            console.error("❌ Strategic analysis error:", strategicResult);
          }
        }, 2000);
      } else {
        console.error("❌ SWOT analysis error:", analysisResult);
        showToastMessage(
          "Failed to regenerate SWOT analysis. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Error regenerating analysis:", error);
      showToastMessage(
        "Failed to regenerate analysis. Please try again.",
        "error"
      );
    } finally {
      setIsAnalysisRegenerating(false);
    }
  };

  // Manual analysis generation
  const handleManualAnalysisGeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage(
        "Complete the initial phase to generate analysis.",
        "warning"
      );
      return;
    }

    try {
      setIsLoadingAnalysis(true);
      showToastMessage("Generating analysis...", "info");

      const businessData = createBusinessDataForAnalysis();
      const strategicBooks = { part1: "", part2: "" };

      const analysisResult = await generateAnalysis(
        "swot",
        "chatbot-session",
        businessData,
        strategicBooks,
        true
      );

      if (analysisResult && !analysisResult.startsWith("Error")) {
        setAnalysisResult(analysisResult);
        showToastMessage("📊 SWOT analysis generated successfully!", "success");

        setTimeout(async () => {
          const strategicResult = await generateAnalysis(
            "strategic",
            "chatbot-session-strategic",
            businessData,
            strategicBooks,
            true
          );

          if (strategicResult && !strategicResult.startsWith("Error")) {
            setStrategicAnalysisResult(strategicResult);
            showToastMessage(
              "🎯 STRATEGIC analysis generated successfully!",
              "success"
            );
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      showToastMessage(
        "Failed to generate analysis. Please try again.",
        "error"
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Get completed phases for the EditableBriefSection
  const completedPhases = new Set();
  if (isPhaseCompleted(PHASES.INITIAL)) completedPhases.add("initial");
  if (isPhaseCompleted(PHASES.ESSENTIAL)) completedPhases.add("essential");
  if (isPhaseCompleted(PHASES.GOOD)) completedPhases.add("good");
  if (isPhaseCompleted(PHASES.EXCELLENT)) completedPhases.add("excellent");

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="business-setup-container">
      <MenuBar />

      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

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

      {isMobile && questionsLoaded && (
        <>
          {/* ✅ Show progress at the top ONLY for brief, analysis, strategic tabs */}
          {["chat", "brief", "analysis", "strategic"].includes(activeTab) && (
            <div className="progress-area">
              <div className="progress-label">
                Progress: {actualProgress}% ({answeredQuestions}/{totalQuestions})
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${actualProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Assistant
            </button>

            <button
              className={`mobile-tab ${activeTab === "brief" ? "active" : ""}`}
              onClick={() => setActiveTab("brief")}
            >
              Brief
            </button>

            {unlockedFeatures.analysis && (
              <button
                className={`mobile-tab ${activeTab === "analysis" ? "active" : ""}`}
                onClick={handleAnalysisTabClick}
              >
                Analysis
              </button>
            )}

            {unlockedFeatures.strategic && (
              <button
                className={`mobile-tab ${activeTab === "strategic" ? "active" : ""}`}
                onClick={handleStrategicTabClick}
              >
                S.T.R.A.T.E.G.I.C
              </button>
            )}
          </div>
        </>
      )}

      <div
        className={`main-container ${
          isAnalysisExpanded && !isMobile ? "analysis-expanded" : ""
        } ${isSliding ? "sliding" : ""}`}
      >
        <div
          className={`chat-section ${
            isMobile && activeTab !== "chat" ? "hidden" : ""
          } ${isAnalysisExpanded && !isMobile ? "slide-out" : ""}`}
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
            <h2 className="welcome-heading">Let's begin!</h2>
            <p className="welcome-text">
              Welcome to Traxia AI - Your Strategic Business Advisor!
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
            className={`info-panel ${
              isMobile
                ? activeTab === "brief" ||
                  activeTab === "analysis" ||
                  activeTab === "strategic"
                  ? "active"
                  : ""
                : ""
            } ${isAnalysisExpanded && !isMobile ? "expanded" : ""}`}
          >
            {/* Desktop Analysis Expanded View */}
            {!isMobile && isAnalysisExpanded && (
              <div className="desktop-expanded-analysis">
                <div className="expanded-analysis-view">
                  {/* Use same header structure as normal view */}
                  <div className="desktop-tabs">
                    <button
                      className="desktop-tab"
                      onClick={handleBackFromAnalysis}
                      disabled={isSliding}
                    >
                      ← Back to Overview
                    </button>

                    {unlockedFeatures.analysis && (
                      <button
                        className={`desktop-tab ${
                          activeTab === "analysis" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("analysis")}
                      >
                        Analysis
                      </button>
                    )}

                    {unlockedFeatures.strategic && (
                      <button
                        className={`desktop-tab ${
                          activeTab === "strategic" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("strategic")}
                      >
                        S.T.R.A.T.E.G.I.C
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="expanded-analysis-content">
                    <div style={{ padding: "1rem", background: "#ffffffff" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "12px",
                          position: "relative",
                        }}
                      >
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
                                left: 0,
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                minWidth: "180px",
                                zIndex: 1000,
                              }}
                            >
                              {[
                                "SWOT",
                                "PESTLE",
                                "Porter's Five Forces",
                              ].map((item) => (
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
                                    (e.currentTarget.style.backgroundColor =
                                      "#f1f5f9")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      "transparent")
                                  }
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={activeTab === "analysis" ? handleDownloadAnalysis : handleDownloadStrategic}
                          disabled={isExportingPDF || (activeTab === "analysis" ? !analysisResult : !strategicAnalysisResult)}
                          style={{
                            backgroundColor: "#1a73e8",
                            color: "#fff",
                            border: "none",
                            borderRadius: "13px",
                            padding: "10px 18px",
                            fontSize: "14px",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            cursor: isExportingPDF ? "not-allowed" : "pointer",
                            opacity: isExportingPDF || (activeTab === "analysis" ? !analysisResult : !strategicAnalysisResult) ? 0.6 : 1,
                          }}
                        >
                          {isExportingPDF ? (
                            <>
                              <Loader size={16} className="spinner" style={{ marginRight: 8 }} />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              Download {activeTab === "analysis" ? "analysis" : "strategic"}
                              <Download size={16} style={{ marginLeft: 8 }} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="expanded-analysis-main">
                      {activeTab === "analysis" && (
                        <div className="analysis-section">
                          <div className="analysis-content">
                            {isLoadingAnalysis || isAnalysisRegenerating ? (
                              <div className="analysis-loading">
                                <Loader size={24} className="spinner" />
                                <span>
                                  {isAnalysisRegenerating
                                    ? "Regenerating your business analysis..."
                                    : "Generating your business analysis..."}
                                </span>
                              </div>
                            ) : analysisResult ? (
                              <>
                                <div id="analysis-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
                                  <div ref={swotRef}>
                                    <SwotAnalysis
                                      analysisResult={analysisResult}
                                      businessName={businessData.name}
                                    />
                                  </div>
                                  {/* Additional Analysis Below SWOT */}
                                  <div ref={pestleRef} className="analysis-section">
                                    <h2>PESTLE Analysis</h2>
                                    <div className="analysis-table">
                                      <div className="analysis-row">
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#fde2e2" }}
                                        >
                                          <strong>Political</strong>
                                          <br />
                                          Government policies, taxation, trade
                                          regulations, and political stability.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#d1f0f0" }}
                                        >
                                          <strong>Economic</strong>
                                          <br />
                                          Interest rates, inflation, GDP growth,
                                          and consumer spending.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#e3e0fb" }}
                                        >
                                          <strong>Social</strong>
                                          <br />
                                          Demographics, lifestyle changes,
                                          education, and social trends.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#fbe8d3" }}
                                        >
                                          <strong>Technological</strong>
                                          <br />
                                          Innovation, automation, R&D, and digital
                                          transformation.
                                        </div>
                                      </div>
                                      <div className="analysis-row">
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#fff6d1" }}
                                        >
                                          <strong>Legal</strong>
                                          <br />
                                          Employment law, health regulations, and
                                          consumer protection.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#d6f5d6" }}
                                        >
                                          <strong>Environmental</strong>
                                          <br />
                                          Sustainability, climate change policies,
                                          and waste management.
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div ref={porterRef} className="analysis-section">
                                    <h2>Porter's Five Forces</h2>
                                    <div className="analysis-table">
                                      <div className="analysis-row">
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#e0f7fa" }}
                                        >
                                          <strong>Competitive Rivalry</strong>
                                          <br />
                                          Market competition intensity and
                                          differentiation.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#ffe0b2" }}
                                        >
                                          <strong>Supplier Power</strong>
                                          <br />
                                          Number of suppliers, uniqueness, and
                                          switching costs.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#e1bee7" }}
                                        >
                                          <strong>Buyer Power</strong>
                                          <br />
                                          Customer influence, price sensitivity,
                                          and volume.
                                        </div>
                                      </div>
                                      <div className="analysis-row">
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#dcedc8" }}
                                        >
                                          <strong>Threat of Substitution</strong>
                                          <br />
                                          Availability of alternative products or
                                          services.
                                        </div>
                                        <div
                                          className="analysis-cell"
                                          style={{ backgroundColor: "#ffcdd2" }}
                                        >
                                          <strong>Threat of New Entry</strong>
                                          <br />
                                          Barriers to entry and potential for new
                                          competitors.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="analysis-empty">
                                <p>
                                  Your SWOT analysis will appear here once
                                  generated.
                                </p>
                                <p>
                                  Continue the conversation to trigger analysis
                                  generation.
                                </p>
                                {isPhaseCompleted(PHASES.INITIAL) && (
                                  <button
                                    className="generate-analysis-btn"
                                    onClick={handleManualAnalysisGeneration}
                                    disabled={isLoadingAnalysis}
                                  >
                                    {isLoadingAnalysis
                                      ? "Generating..."
                                      : "Generate Analysis Now"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "strategic" && (
                        <div ref={strategicRef} className="strategic-section">
                          <div className="strategic-content">
                            {isLoadingAnalysis || isAnalysisRegenerating ? (
                              <div className="strategic-loading">
                                <Loader size={24} className="spinner" />
                                <span>
                                  {isAnalysisRegenerating
                                    ? "Regenerating your strategic analysis..."
                                    : "Generating your strategic analysis..."}
                                </span>
                              </div>
                            ) : strategicAnalysisResult ? (
                              <div id="strategic-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
                                <StrategicAcronym
                                  analysisResult={strategicAnalysisResult}
                                  businessName={businessData.name}
                                />
                              </div>
                            ) : (
                              <div className="strategic-empty">
                                <p>
                                  Your STRATEGIC analysis will appear here once
                                  generated.
                                </p>
                                <p>
                                  Continue the conversation to trigger analysis
                                  generation.
                                </p>
                                {isPhaseCompleted(PHASES.INITIAL) && (
                                  <button
                                    className="generate-analysis-btn"
                                    onClick={handleManualAnalysisGeneration}
                                    disabled={isLoadingAnalysis}
                                  >
                                    {isLoadingAnalysis
                                      ? "Generating..."
                                      : "Generate Strategic Analysis Now"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Normal Desktop Tabs */}
            {!isMobile && !isAnalysisExpanded && (
              <div className="desktop-tabs">
                <button
                  className={`desktop-tab ${
                    activeTab === "brief" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("brief")}
                >
                  Brief
                </button>

                {unlockedFeatures.analysis && (
                  <button
                    className={`desktop-tab ${
                      activeTab === "analysis" ? "active" : ""
                    }`}
                    onClick={handleAnalysisTabClick}
                  >
                    Analysis
                  </button>
                )}

                {unlockedFeatures.strategic && (
                  <button
                    className={`desktop-tab ${
                      activeTab === "strategic" ? "active" : ""
                    }`}
                    onClick={handleStrategicTabClick}
                  >
                    S.T.R.A.T.E.G.I.C
                  </button>
                )}
              </div>
            )}

            {/* Normal Info Panel Content */}
            {(!isAnalysisExpanded || isMobile) && (
              <div className="info-panel-content">
                {activeTab === "analysis" && (
                  <div style={{ padding: "1rem", background: "#ffffffff" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                        position: "relative",
                      }}
                    >
                      {/* Dropdown */}
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
                              left: 0,
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              minWidth: "180px",
                              zIndex: 1000,
                            }}
                          >
                            {["SWOT", "PESTLE", "Porter's Five Forces"].map((item) => (
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

                      {/* Download Button */}
                      <button
                        onClick={handleDownloadAnalysis}
                        disabled={isExportingPDF || !analysisResult}
                        style={{
                          backgroundColor: "#1a73e8",
                          color: "#fff",
                          border: "none",
                          borderRadius: "13px",
                          padding: "10px 18px",
                          fontSize: "14px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          cursor: isExportingPDF || !analysisResult ? "not-allowed" : "pointer",
                          opacity: isExportingPDF || !analysisResult ? 0.6 : 1,
                        }}
                      >
                        {isExportingPDF ? (
                          <>
                            <Loader size={16} className="spinner" style={{ marginRight: 8 }} />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            Download analysis
                            <Download size={16} style={{ marginLeft: 8 }} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "brief" && (
                  <div className="brief-section">
                    {!unlockedFeatures.analysis && (
                      <div className="unlock-hint">
                        <h4>🔒 Unlock Business Analysis</h4>
                        <p>
                          Complete all initial phase questions to unlock SWOT
                          analysis and strategic insights!
                        </p>
                      </div>
                    )}

                    {!isMobile && (
                      <div className="progress-area">
                        <div className="progress-label">
                          Progress: {actualProgress}% ({answeredQuestions}/
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
                    <div className="analysis-content">
                      {isLoadingAnalysis || isAnalysisRegenerating ? (
                        <div className="analysis-loading">
                          <Loader size={24} className="spinner" />
                          <span>
                            {isAnalysisRegenerating
                              ? "Regenerating your business analysis..."
                              : "Generating your business analysis..."}
                          </span>
                        </div>
                      ) : analysisResult ? (
                        <>
                          <div id="analysis-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
                            <div ref={swotRef}>
                              <SwotAnalysis
                                analysisResult={analysisResult}
                                businessName={businessData.name}
                              />
                            </div>
                            {/* Additional Analysis Below SWOT */}
                            <div ref={pestleRef} className="analysis-section">
                              <h2>PESTLE Analysis</h2>
                              <div className="analysis-table">
                                <div className="analysis-row">
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#fde2e2" }}
                                  >
                                    <strong>Political</strong>
                                    <br />
                                    Government policies, taxation, trade
                                    regulations, and political stability.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#d1f0f0" }}
                                  >
                                    <strong>Economic</strong>
                                    <br />
                                    Interest rates, inflation, GDP growth,
                                    and consumer spending.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#e3e0fb" }}
                                  >
                                    <strong>Social</strong>
                                    <br />
                                    Demographics, lifestyle changes,
                                    education, and social trends.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#fbe8d3" }}
                                  >
                                    <strong>Technological</strong>
                                    <br />
                                    Innovation, automation, R&D, and digital
                                    transformation.
                                  </div>
                                </div>
                                <div className="analysis-row">
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#fff6d1" }}
                                  >
                                    <strong>Legal</strong>
                                    <br />
                                    Employment law, health regulations, and
                                    consumer protection.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#d6f5d6" }}
                                  >
                                    <strong>Environmental</strong>
                                    <br />
                                    Sustainability, climate change policies,
                                    and waste management.
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div ref={porterRef} className="analysis-section">
                              <h2>Porter's Five Forces</h2>
                              <div className="analysis-table">
                                <div className="analysis-row">
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#e0f7fa" }}
                                  >
                                    <strong>Competitive Rivalry</strong>
                                    <br />
                                    Market competition intensity and
                                    differentiation.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#ffe0b2" }}
                                  >
                                    <strong>Supplier Power</strong>
                                    <br />
                                    Number of suppliers, uniqueness, and
                                    switching costs.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#e1bee7" }}
                                  >
                                    <strong>Buyer Power</strong>
                                    <br />
                                    Customer influence, price sensitivity,
                                    and volume.
                                  </div>
                                </div>
                                <div className="analysis-row">
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#dcedc8" }}
                                  >
                                    <strong>Threat of Substitution</strong>
                                    <br />
                                    Availability of alternative products or
                                    services.
                                  </div>
                                  <div
                                    className="analysis-cell"
                                    style={{ backgroundColor: "#ffcdd2" }}
                                  >
                                    <strong>Threat of New Entry</strong>
                                    <br />
                                    Barriers to entry and potential for new
                                    competitors.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="analysis-empty">
                          <p>
                            Your SWOT analysis will appear here once generated.
                          </p>
                          <p>
                            Continue the conversation to trigger analysis
                            generation.
                          </p>
                          {isPhaseCompleted(PHASES.INITIAL) && (
                            <button
                              className="generate-analysis-btn"
                              onClick={handleManualAnalysisGeneration}
                              disabled={isLoadingAnalysis}
                            >
                              {isLoadingAnalysis
                                ? "Generating..."
                                : "Generate Analysis Now"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "strategic" && unlockedFeatures.strategic && (
                  <div className="strategic-section">
                    <div className="strategic-content">
                      {isLoadingAnalysis || isAnalysisRegenerating ? (
                        <div className="strategic-loading">
                          <Loader size={24} className="spinner" />
                          <span>
                            {isAnalysisRegenerating
                              ? "Regenerating your strategic analysis..."
                              : "Generating your strategic analysis..."}
                          </span>
                        </div>
                      ) : strategicAnalysisResult ? (
                        <div id="strategic-pdf-content" style={{ backgroundColor: 'white', padding: '0' }}>
                          <StrategicAcronym
                            analysisResult={strategicAnalysisResult}
                            businessName={businessData.name}
                          />
                        </div>
                      ) : (
                        <div className="strategic-empty">
                          <p>
                            Your STRATEGIC analysis will appear here once
                            generated.
                          </p>
                          <p>
                            Continue the conversation to trigger analysis
                            generation.
                          </p>
                          {isPhaseCompleted(PHASES.INITIAL) && (
                            <button
                              className="generate-analysis-btn"
                              onClick={handleManualAnalysisGeneration}
                              disabled={isLoadingAnalysis}
                            >
                              {isLoadingAnalysis
                                ? "Generating..."
                                : "Generate Strategic Analysis Now"}
                            </button>
                          )}
                        </div>
                      )}
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