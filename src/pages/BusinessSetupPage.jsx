import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader } from "lucide-react";
import ChatComponent from "../components/ChatComponent";
import SwotAnalysis from "../components/SwotAnalysis";
import StrategicAcronym from "../components/StrategicAcronym";
import "../styles/businesspage.css"; 
import MenuBar from "../components/MenuBar";
import EditableBriefSection from "../components/EditableBriefSection";
import { useAnalysisData } from "../hooks/useAnalysisData";

const BusinessSetupPage = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const isMobileView = window.innerWidth <= 768;
    return isMobileView ? 'chat' : 'brief';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userAnswers, setUserAnswers] = useState({});
  const [analysisResult, setAnalysisResult] = useState('');
  const [strategicAnalysisResult, setStrategicAnalysisResult] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  
  // Questions will be received from ChatComponent
  const [questions, setQuestions] = useState([]);
  const [phases, setPhases] = useState({});
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [businessData, setBusinessData] = useState({
    name: 'Your Business',
    whatWeDo: 'Business description will appear here after answering questions in the chat.',
    products: '',
    targetAudience: '',
    uniqueValue: ''
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');
  const { generateAnalysis } = useAnalysisData();

  // Calculated values from questions and answers
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Phase management logic
  const PHASES = {
    INITIAL: 'initial',
    ESSENTIAL: 'essential', 
    GOOD: 'good',
    EXCELLENT: 'excellent'
  };

  const getQuestionsByPhase = (phase) => {
    return questions.filter(q => q.phase === phase);
  };

  const getMandatoryQuestionsByPhase = (phase) => {
    return questions.filter(q => q.phase === phase && q.severity === 'mandatory');
  };

  const isPhaseCompleted = (phase) => {
    const mandatoryQuestions = getMandatoryQuestionsByPhase(phase);
    return mandatoryQuestions.every(q => userAnswers[q.id]);
  };

  const getCurrentPhase = () => {
    const phaseOrder = [PHASES.INITIAL, PHASES.ESSENTIAL, PHASES.GOOD, PHASES.EXCELLENT];
    
    for (let i = phaseOrder.length - 1; i >= 0; i--) {
      if (isPhaseCompleted(phaseOrder[i])) {
        return phaseOrder[i];
      }
    }
    return PHASES.INITIAL;
  };

  const getUnlockedFeatures = () => {
    const features = {
      brief: true, // Always available
      analysis: false,
      swot: false,
      financial: false,
      strategic: false
    };

    // Unlock analysis after initial phase
    if (isPhaseCompleted(PHASES.INITIAL)) {
      features.analysis = true;
      features.swot = true;
    }

    // Unlock financial analysis after good phase
    if (isPhaseCompleted(PHASES.GOOD)) {
      features.financial = true;
    }

    // Unlock strategic analysis after excellent phase
    if (isPhaseCompleted(PHASES.EXCELLENT)) {
      features.strategic = true;
    }

    return features;
  };

  const currentPhase = getCurrentPhase();
  const unlockedFeatures = getUnlockedFeatures();

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);

      if (newIsMobile && (activeTab === 'strategic' || activeTab === 'brief')) {
        setActiveTab('chat');
      } else if (!newIsMobile && activeTab === 'chat') {
        setActiveTab('brief');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Callback when ChatComponent loads questions
  const handleQuestionsLoaded = (loadedQuestions, loadedPhases) => { 
    setQuestions(loadedQuestions);
    setPhases(loadedPhases);
    setQuestionsLoaded(true);
  };

  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/analysis/history?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analyses && data.analyses.length > 0) {
          const analysisId = data.analyses[0]._id;
          const analysisResponse = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setAnalysisResult(analysisData.analysis_result);
          }
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const extractBusinessName = (text) => {
    const patterns = [
      /(?:we are|i am|this is|called|business is|company is)\s+([A-Z][a-zA-Z\s&.-]+?)(?:\.|,|$)/i,
      /^([A-Z][a-zA-Z\s&.-]+?)\s+(?:is|provides|offers|teaches)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length <= 50) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Updated function without API call
  const handleBusinessDataUpdate = (updates) => {
    setBusinessData(prev => ({ ...prev, ...updates })); 
  };

  const handleNewAnswer = (questionId, answer) => {
    setUserAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      return newAnswers;
    });

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

  // Add this new method to handle answer updates from EditableBriefSection
  const handleAnswerUpdate = (questionId, newAnswer) => { 
    
    // Update the userAnswers state immediately
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));

    // Update business data if it's a relevant question
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

  const handleAnalysisGenerated = (analysis) => { 
    setAnalysisResult(analysis);
    setIsLoadingAnalysis(false);
  };

  const handleStrategicAnalysisGenerated = (strategicAnalysis) => { 
    setStrategicAnalysisResult(strategicAnalysis);
    setIsLoadingAnalysis(false);
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const createBusinessDataForAnalysis = () => {
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    
    let businessName = 'Your Business';
    
    if (sortedQuestions[0] && userAnswers[sortedQuestions[0].id]) {
      const firstAnswer = userAnswers[sortedQuestions[0].id];
      
      const namePatterns = [
        /(?:we are|i am|this is|called|business is|company is)\s+([A-Z][a-zA-Z\s&.-]+?)(?:\.|,|$)/i,
        /^([A-Z][a-zA-Z\s&.-]+?)\s+(?:is|provides|offers|teaches)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = firstAnswer.match(pattern);
        if (match && match[1] && match[1].length <= 50) {
          businessName = match[1].trim();
          break;
        }
      }
    }

    const categories = [{
      category_id: 1,
      category_name: 'Business Survey',
      name: 'Business Survey',
      questions_answered: Object.keys(userAnswers).length,
      total_questions: questions.length,
      questions: sortedQuestions
        .filter(question => userAnswers[question.id])
        .map(question => ({
          question_id: question.id,
          question_text: question.question,
          title: question.question,
          question: question.question,
          question_type: 'open-ended',
          type: 'open-ended',
          phase: question.phase,
          severity: question.severity,
          placeholder: question.question,
          nested: { question: question.question },
          answer: {
            description: userAnswers[question.id]
          },
          user_answer: {
            answer: userAnswers[question.id]
          },
          answered: true
        }))
    }];

    return {
      id: 'chatbot-session',
      name: businessName,
      totalQuestions: questions.length,
      categories: categories,
      user: {
        name: businessName,
        company: businessName
      },
      survey: {
        total_questions: questions.length
      }
    };
  };

  // Manual trigger for generating analyses
  const handleManualAnalysisGeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage('Complete the initial phase to generate analysis.', 'warning');
      return;
    }

    try {
      setIsLoadingAnalysis(true);
      showToastMessage('Generating analysis...', 'info');

      // Trigger analysis generation from ChatComponent
      if (window.triggerChatAnalysis) { 
        window.triggerChatAnalysis();
      } else { 
        const businessData = createBusinessDataForAnalysis();
        const strategicBooks = { part1: '', part2: '' };

        // Generate SWOT analysis
        const analysisResult = await generateAnalysis(
          'swot',
          'chatbot-session',
          businessData,
          strategicBooks,
          true
        );
        
        if (analysisResult && !analysisResult.startsWith('Error')) {
          setAnalysisResult(analysisResult);
          showToastMessage('📊 SWOT analysis generated successfully!', 'success');

          // Generate strategic analysis
          setTimeout(async () => {
            const strategicResult = await generateAnalysis(
              'strategic',
              'chatbot-session-strategic',
              businessData,
              strategicBooks,
              true
            );
            
            if (strategicResult && !strategicResult.startsWith('Error')) {
              setStrategicAnalysisResult(strategicResult);
              showToastMessage('🎯 STRATEGIC analysis generated successfully!', 'success');
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error generating analysis manually:', error);
      showToastMessage('Failed to generate analysis. Please try again.', 'error');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

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
          <button className="back-button" onClick={handleBack} aria-label="Go Back">
            <ArrowLeft size={18} />
          </button>
          <span className="business-name">{businessData.name}</span>
          <div className="header-spacer"></div>
        </div>
      </div>

      {isMobile && questionsLoaded && (
        <>
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Assistant
            </button>

            <button
              className={`mobile-tab ${activeTab === 'brief' ? 'active' : ''}`}
              onClick={() => setActiveTab('brief')}
            >
              Brief
            </button>

            {unlockedFeatures.analysis && (
              <button
                className={`mobile-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                Analysis
              </button>
            )}

            {unlockedFeatures.analysis && unlockedFeatures.strategic && (
              <button
                className={`mobile-tab ${activeTab === 'strategic' ? 'active' : ''}`}
                onClick={() => setActiveTab('strategic')}
              >
                S.T.R.A.T.E.G.I.C
              </button>
            )}
          </div>

          {activeTab !== 'chat' && activeTab !== 'analysis' && activeTab !== 'strategic' && (
            <div className="mobile-progress">
              <div className="mobile-progress-label">
                Progress: {actualProgress}% ({answeredQuestions}/{totalQuestions})
              </div>
              <div className="mobile-progress-track">
                <div
                  className="mobile-progress-fill"
                  style={{ width: `${actualProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="main-container">
        <div className={`chat-section ${isMobile && activeTab !== 'chat' ? 'hidden' : ''}`}>
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
            <p className="welcome-text">Welcome to Traxia AI - Your Strategic Business Advisor!</p>
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
          <div className={`info-panel ${isMobile ? (activeTab === 'brief' || activeTab === 'analysis' || activeTab === 'strategic' ? 'active' : '') : ''}`}>
            {!isMobile && (
              <div className="desktop-tabs">
                <button
                  className={`desktop-tab ${activeTab === 'brief' ? 'active' : ''}`}
                  onClick={() => setActiveTab('brief')}
                >
                  Brief
                </button>

                {unlockedFeatures.analysis && (
                  <button
                    className={`desktop-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                  >
                    Analysis
                  </button>
                )}

                {unlockedFeatures.analysis && unlockedFeatures.strategic && (
                  <button
                    className={`desktop-tab ${activeTab === 'strategic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('strategic')}
                  >
                    S.T.R.A.T.E.G.I.C
                  </button>
                )}
              </div>
            )}

            <div className="info-panel-content">
              {activeTab === 'brief' && (
                <div className="brief-section">
                  {!unlockedFeatures.analysis && (
                    <div className="unlock-hint">
                      <h4>🔒 Unlock Business Analysis</h4>
                      <p>Complete all initial phase questions to unlock SWOT analysis and strategic insights!</p>
                    </div>
                  )}<br></br>

                  {!isMobile && (
                    <div className="progress-area">
                      <div className="progress-label">Progress: {actualProgress}% ({answeredQuestions}/{totalQuestions})</div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${actualProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <EditableBriefSection
                    questions={questions}
                    userAnswers={userAnswers}
                    businessData={businessData}
                    onBusinessDataUpdate={handleBusinessDataUpdate}
                    onAnswerUpdate={handleAnswerUpdate}
                  /> 
                </div>
              )}

              {activeTab === 'analysis' && unlockedFeatures.analysis && (
                <div className="analysis-section">
                  <div className="analysis-content">
                    {isLoadingAnalysis ? (
                      <div className="analysis-loading">
                        <Loader size={24} className="spinner" />
                        <span>Generating your business analysis...</span>
                      </div>
                    ) : analysisResult ? (
                      <SwotAnalysis analysisResult={analysisResult} />
                    ) : (
                      <div className="analysis-empty">
                        <p>Your SWOT analysis will appear here once generated.</p>
                        <p>Continue the conversation to trigger analysis generation.</p>
                        {isPhaseCompleted(PHASES.INITIAL) && (
                          <button 
                            className="generate-analysis-btn"
                            onClick={handleManualAnalysisGeneration}
                            disabled={isLoadingAnalysis}
                          >
                            {isLoadingAnalysis ? 'Generating...' : 'Generate Analysis Now'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'strategic' && unlockedFeatures.analysis && unlockedFeatures.strategic && (
                <div className="strategic-section">
                  <div className="strategic-content">
                    {isLoadingAnalysis ? (
                      <div className="strategic-loading">
                        <Loader size={24} className="spinner" />
                        <span>Generating your strategic analysis...</span>
                      </div>
                    ) : strategicAnalysisResult ? (
                      <StrategicAcronym analysisResult={strategicAnalysisResult} />
                    ) : (
                      <div className="strategic-empty">
                        <p>Your STRATEGIC analysis will appear here once generated.</p>
                        <p>Continue the conversation to trigger analysis generation.</p>
                        {isPhaseCompleted(PHASES.INITIAL) && (
                          <button 
                            className="generate-analysis-btn"
                            onClick={handleManualAnalysisGeneration}
                            disabled={isLoadingAnalysis}
                          >
                            {isLoadingAnalysis ? 'Generating...' : 'Generate Strategic Analysis Now'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && !unlockedFeatures.analysis && (
                <div className="locked-analysis">
                  <div className="lock-icon">🔒</div>
                  <h3>Analysis Locked</h3>
                  <p className="description">
                    Complete all initial phase questions to unlock your business analysis.
                  </p>
                  <p className="progress-info">
                    Current Progress: {actualProgress}% ({answeredQuestions}/{totalQuestions}) • Phase: {currentPhase.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSetupPage;