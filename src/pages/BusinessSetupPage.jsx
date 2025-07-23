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
  const [isAnalysisRegenerating, setIsAnalysisRegenerating] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  
  // New state for slide effect
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  
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

  const { generateAnalysis } = useAnalysisData();

  // Calculated values
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const actualProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Phase management
  const PHASES = {
    INITIAL: 'initial',
    ESSENTIAL: 'essential', 
    GOOD: 'good',
    EXCELLENT: 'excellent'
  };

  const getMandatoryQuestionsByPhase = (phase) => {
    return questions.filter(q => q.phase === phase && q.severity === 'mandatory');
  };

  const isPhaseCompleted = (phase) => {
    const mandatoryQuestions = getMandatoryQuestionsByPhase(phase);
    return mandatoryQuestions.every(q => userAnswers[q.id]);
  };

  const getUnlockedFeatures = () => {
    const features = {
      brief: true,
      analysis: false,
      strategic: false
    };

    if (isPhaseCompleted(PHASES.INITIAL)) {
      features.analysis = true;
      features.strategic = true;
    }

    return features;
  };

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

  // Handle analysis tab click with slide effect
  const handleAnalysisTabClick = () => {
    if (!unlockedFeatures.analysis) return;
    
    if (isMobile) {
      setActiveTab('analysis');
    } else {
      if (!isAnalysisExpanded) {
        // Expand to full screen
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab('analysis');
        
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
      setActiveTab('strategic');
    } else {
      if (!isAnalysisExpanded) {
        // Expand to full screen
        setIsSliding(true);
        setIsAnalysisExpanded(true);
        setActiveTab('strategic');
        
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
      setActiveTab('brief'); // Return to brief tab
      
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

  const handleBusinessDataUpdate = (updates) => {
    setBusinessData(prev => ({ ...prev, ...updates })); 
  };

  const handleNewAnswer = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
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
      setBusinessData(prev => ({ ...prev, ...updates }));
    }
  };

  const handleAnswerUpdate = (questionId, newAnswer) => {  
    
    setUserAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: newAnswer
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
      const extractedName = extractBusinessName(firstAnswer);
      if (extractedName) {
        businessName = extractedName;
      }
    } 
    
    const questionsWithAnswers = sortedQuestions
      .filter(question => {
        const hasAnswer = userAnswers[question.id] && 
                          typeof userAnswers[question.id] === 'string' && 
                          userAnswers[question.id].trim() !== '';
         
        
        return hasAnswer;
      })
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
      }));
 

    const totalAnsweredQuestions = Object.keys(userAnswers).length;
    if (questionsWithAnswers.length !== totalAnsweredQuestions) {
      console.warn(`⚠️ Mismatch: Expected ${totalAnsweredQuestions} questions, but only ${questionsWithAnswers.length} passed filtering`);
    }

    const categories = [{
      category_id: 1,
      category_name: 'Business Survey',
      name: 'Business Survey',
      questions_answered: questionsWithAnswers.length,
      total_questions: questions.length,
      questions: questionsWithAnswers
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

  // Analysis regeneration function
  const handleAnalysisRegeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage('Initial phase must be completed to regenerate analysis.', 'warning');
      return;
    }

    try {
      setIsAnalysisRegenerating(true);
      showToastMessage('Regenerating analysis with updated answers...', 'info');

      await new Promise(resolve => setTimeout(resolve, 100));

      const businessData = createBusinessDataForAnalysis();
      const strategicBooks = { part1: '', part2: '' };

      const analysisResult = await generateAnalysis(
        'swot',
        'chatbot-session',
        businessData,
        strategicBooks,
        true
      );
      
      if (analysisResult && !analysisResult.startsWith('Error')) {
        setAnalysisResult(analysisResult);
        showToastMessage('📊 SWOT analysis regenerated successfully!', 'success');

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
            showToastMessage('🎯 STRATEGIC analysis regenerated successfully!', 'success');
          } else {
            console.error('❌ Strategic analysis error:', strategicResult);
          }
        }, 2000);
      } else {
        console.error('❌ SWOT analysis error:', analysisResult);
        showToastMessage('Failed to regenerate SWOT analysis. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ Error regenerating analysis:', error);
      showToastMessage('Failed to regenerate analysis. Please try again.', 'error');
    } finally {
      setIsAnalysisRegenerating(false);
    }
  };

  // Manual analysis generation
  const handleManualAnalysisGeneration = async () => {
    if (!isPhaseCompleted(PHASES.INITIAL)) {
      showToastMessage('Complete the initial phase to generate analysis.', 'warning');
      return;
    }

    try {
      setIsLoadingAnalysis(true);
      showToastMessage('Generating analysis...', 'info');

      const businessData = createBusinessDataForAnalysis();
      const strategicBooks = { part1: '', part2: '' };

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
    } catch (error) {
      console.error('Error generating analysis:', error);
      showToastMessage('Failed to generate analysis. Please try again.', 'error');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Get completed phases for the EditableBriefSection
  const completedPhases = new Set();
  if (isPhaseCompleted(PHASES.INITIAL)) completedPhases.add('initial');
  if (isPhaseCompleted(PHASES.ESSENTIAL)) completedPhases.add('essential');
  if (isPhaseCompleted(PHASES.GOOD)) completedPhases.add('good');
  if (isPhaseCompleted(PHASES.EXCELLENT)) completedPhases.add('excellent');

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
                onClick={handleAnalysisTabClick}
              >
                Analysis
              </button>
            )}

            {unlockedFeatures.strategic && (
              <button
                className={`mobile-tab ${activeTab === 'strategic' ? 'active' : ''}`}
                onClick={handleStrategicTabClick}
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

      <div className={`main-container ${isAnalysisExpanded && !isMobile ? 'analysis-expanded' : ''} ${isSliding ? 'sliding' : ''}`}>
        <div className={`chat-section ${isMobile && activeTab !== 'chat' ? 'hidden' : ''} ${isAnalysisExpanded && !isMobile ? 'slide-out' : ''}`}>
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
          <div className={`info-panel ${isMobile ? (activeTab === 'brief' || activeTab === 'analysis' || activeTab === 'strategic' ? 'active' : '') : ''} ${isAnalysisExpanded && !isMobile ? 'expanded' : ''}`}>
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
                        className={`desktop-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analysis')}
                      >
                        Analysis
                      </button>
                    )}

                    {unlockedFeatures.strategic && (
                      <button
                        className={`desktop-tab ${activeTab === 'strategic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('strategic')}
                      >
                        S.T.R.A.T.E.G.I.C
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="expanded-analysis-content">
                    <div className="expanded-analysis-main">
                      {activeTab === 'analysis' && (
                        <div className="analysis-section">
                          <div className="analysis-content">
                            {isLoadingAnalysis || isAnalysisRegenerating ? (
                              <div className="analysis-loading">
                                <Loader size={24} className="spinner" />
                                <span>
                                  {isAnalysisRegenerating 
                                    ? 'Regenerating your business analysis...' 
                                    : 'Generating your business analysis...'
                                  }
                                </span>
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

                      {activeTab === 'strategic' && (
                        <div className="strategic-section">
                          <div className="strategic-content">
                            {isLoadingAnalysis || isAnalysisRegenerating ? (
                              <div className="strategic-loading">
                                <Loader size={24} className="spinner" />
                                <span>
                                  {isAnalysisRegenerating 
                                    ? 'Regenerating your strategic analysis...' 
                                    : 'Generating your strategic analysis...'
                                  }
                                </span>
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
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Normal Desktop Tabs */}
            {!isMobile && !isAnalysisExpanded && (
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
                    onClick={handleAnalysisTabClick}
                  >
                    Analysis
                  </button>
                )}

                {unlockedFeatures.strategic && (
                  <button
                    className={`desktop-tab ${activeTab === 'strategic' ? 'active' : ''}`}
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
                {activeTab === 'brief' && (
                  <div className="brief-section">
                    {!unlockedFeatures.analysis && (
                      <div className="unlock-hint">
                        <h4>🔒 Unlock Business Analysis</h4>
                        <p>Complete all initial phase questions to unlock SWOT analysis and strategic insights!</p>
                      </div>
                    )}

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
                      onAnalysisRegenerate={handleAnalysisRegeneration}
                      isAnalysisRegenerating={isAnalysisRegenerating}
                      completedPhases={completedPhases}
                    /> 
                  </div>
                )}

                {activeTab === 'analysis' && unlockedFeatures.analysis && (
                  <div className="analysis-section">
                    <div className="analysis-content">
                      {isLoadingAnalysis || isAnalysisRegenerating ? (
                        <div className="analysis-loading">
                          <Loader size={24} className="spinner" />
                          <span>
                            {isAnalysisRegenerating 
                              ? 'Regenerating your business analysis...' 
                              : 'Generating your business analysis...'
                            }
                          </span>
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

                {activeTab === 'strategic' && unlockedFeatures.strategic && (
                  <div className="strategic-section">
                    <div className="strategic-content">
                      {isLoadingAnalysis || isAnalysisRegenerating ? (
                        <div className="strategic-loading">
                          <Loader size={24} className="spinner" />
                          <span>
                            {isAnalysisRegenerating 
                              ? 'Regenerating your strategic analysis...' 
                              : 'Generating your strategic analysis...'
                            }
                          </span>
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
                      Current Progress: {actualProgress}% ({answeredQuestions}/{totalQuestions})
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