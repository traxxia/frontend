import React, { useState, useEffect, useRef } from "react";
import { Send, Loader } from "lucide-react";
import { useAnalysisData } from "../hooks/useAnalysisData";
import "../styles/ChatComponent.css";

const ChatComponent = ({ 
  userAnswers = {},
  onBusinessDataUpdate, 
  onNewAnswer, 
  onAnalysisGenerated, 
  onStrategicAnalysisGenerated,
  onQuestionsLoaded
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [phases, setPhases] = useState({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidatingPhase, setIsValidatingPhase] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isGeneratingStrategic, setIsGeneratingStrategic] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [phaseValidationPending, setPhaseValidationPending] = useState(false);
  
  const { generateAnalysis } = useAnalysisData();
  const messagesEndRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');

  const getPhaseQuestions = (phaseName) => {
    return phases[phaseName] || [];
  };

  const getPhaseProgress = (phaseName) => {
    const phaseQuestions = getPhaseQuestions(phaseName);
    const answeredInPhase = phaseQuestions.filter(q => userAnswers[q.id]);
    return {
      answered: answeredInPhase.length,
      total: phaseQuestions.length,
      percentage: phaseQuestions.length > 0 ? (answeredInPhase.length / phaseQuestions.length) * 100 : 0
    };
  };

  const getCurrentPhase = () => {
    const phaseOrder = ['initial', 'essential', 'good', 'excellent'];
    
    for (const phaseName of phaseOrder) {
      const phaseQuestions = getPhaseQuestions(phaseName);
      const mandatoryQuestions = phaseQuestions.filter(q => q.severity === 'mandatory');
      const answeredMandatory = mandatoryQuestions.filter(q => userAnswers[q.id]);
      
      if (answeredMandatory.length < mandatoryQuestions.length) {
        return phaseName;
      }
    }
    
    return 'completed';
  };

  const isLastMandatoryQuestionOfPhase = (question) => {
    if (!question) return false;
    
    const phaseQuestions = getPhaseQuestions(question.phase);
    const mandatoryQuestions = phaseQuestions.filter(q => q.severity === 'mandatory');
    const sortedMandatoryQuestions = mandatoryQuestions.sort((a, b) => a.id - b.id);
    
    const lastMandatoryQuestion = sortedMandatoryQuestions[sortedMandatoryQuestions.length - 1];
    return lastMandatoryQuestion && lastMandatoryQuestion.id === question.id;
  };

  const buildPhaseConversationPayload = (phaseName, messagesOverride = null) => {
    const messagesToUse = messagesOverride || messages;
    const phaseMessages = messagesToUse.filter(msg => 
      msg.phase === phaseName || 
      (msg.questionId && (
        msg.questionId.includes(`${phaseName}_phase_followup`) ||
        msg.questionId === `${phaseName}_phase_followup` ||
        msg.questionId === `${phaseName}_phase_followup_2`
      ))
    );
    
    const sortedMessages = phaseMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    const questions = [];
    const answers = [];
    
    let currentQuestion = null;
    let currentAnswers = [];
    
    sortedMessages.forEach(msg => {
      if (msg.type === 'bot') {
        if (currentQuestion && currentAnswers.length > 0) {
          questions.push(currentQuestion);
          answers.push(currentAnswers.join(' '));
        }
        
        currentQuestion = msg.text;
        currentAnswers = [];
      } else if (msg.type === 'user') {
        currentAnswers.push(msg.text);
      }
    });
    
    if (currentQuestion && currentAnswers.length > 0) {
      questions.push(currentQuestion);
      answers.push(currentAnswers.join(' '));
    }
    
    return { questions, answers };
  };

  const getOverallProgress = () => {
    const phaseOrder = ['initial', 'essential', 'good', 'excellent'];
    const progressByPhase = {};
    
    phaseOrder.forEach(phaseName => {
      progressByPhase[phaseName] = getPhaseProgress(phaseName);
    });
    
    return progressByPhase;
  };

  useEffect(() => {
    loadQuestionsFromAPI();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && !isInitialized) {
      const currentQ = getCurrentQuestion();
      if (currentQ) {
        addMessage('bot', currentQ.question, {
          questionId: currentQ.id,
          phase: currentQ.phase,
          severity: currentQ.severity
        });
        setIsInitialized(true);
      }
    }
  }, [questions, isInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
  if (!phaseValidationPending && !pendingValidation) {
    // Phase validation just completed, proceed to next question
    const nextQ = getCurrentQuestion();
    if (nextQ && !messages.some(msg => msg.type === 'bot' && msg.questionId === nextQ.id)) {
      addMessage('bot', nextQ.question, {
        questionId: nextQ.id,
        phase: nextQ.phase,
        severity: nextQ.severity
      });
    }
  }
}, [phaseValidationPending, pendingValidation]);
  const loadQuestionsFromAPI = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedQuestions = data.questions || [];
        
        setQuestions(loadedQuestions);
        
        const phaseGroups = {};
        loadedQuestions.forEach(question => {
          if (!phaseGroups[question.phase]) {
            phaseGroups[question.phase] = [];
          }
          phaseGroups[question.phase].push(question);
        });
        setPhases(phaseGroups);

        if (onQuestionsLoaded) {
          onQuestionsLoaded(loadedQuestions, phaseGroups);
        }
      } else {
        showToastMessage('Failed to load questions. Please refresh the page.', 'error');
      }
    } catch (error) {
      showToastMessage('Error loading questions. Please check your connection.', 'error');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const validateAnswerWithML = async (question, answer) => {
    try {
      setIsValidating(true);

      const response = await fetch(`${ML_API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: question,
          answer: answer
        })
      });

      if (!response.ok) {
        throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      showToastMessage('Failed to validate answer. Continuing without validation.', 'warning');
      return { valid: true };
    } finally {
      setIsValidating(false);
    }
  };

  const validatePhaseWithML = async (phaseName, phaseAnswers, messagesOverride = null) => {
    try {
      setIsValidatingPhase(true);

      const conversationPayload = buildPhaseConversationPayload(phaseName, messagesOverride);
      
      if (conversationPayload.questions.length === 0) {
        const phaseQuestions = getPhaseQuestions(phaseName);
        const mandatoryQuestions = phaseQuestions.filter(q => q.severity === 'mandatory');

        const questionsArray = [];
        const answersArray = [];

        mandatoryQuestions.forEach(question => {
          const answer = phaseAnswers[question.id];
          if (answer) {
            questionsArray.push(question.question);
            answersArray.push(answer);
          }
        });

        conversationPayload.questions = questionsArray;
        conversationPayload.answers = answersArray;
      }

      const response = await fetch(`${ML_API_BASE_URL}/analyze_all`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: conversationPayload.questions,
          answers: conversationPayload.answers
        })
      });

      if (!response.ok) {
        throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      showToastMessage(`Failed to validate ${phaseName} phase completion. Continuing to next phase.`, 'warning');
      return { valid: true };
    } finally {
      setIsValidatingPhase(false);
    }
  };

  const getCurrentQuestion = () => {
  if (Object.keys(phases).length === 0) return null;
  
  const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
  const answeredCount = Object.keys(userAnswers).length;
  
  if (pendingValidation) {
    return pendingValidation.question;
  }
  
  // Simple check: if we're waiting for phase validation response, don't show next question
  if (phaseValidationPending) {
    return null;
  }
  
  // Return next unanswered question
  if (answeredCount < sortedQuestions.length) {
    return sortedQuestions[answeredCount];
  }
  
  return null;
};


  const addMessage = (type, text, metadata = {}) => {
    if (type === 'bot' && metadata.questionId) {
      const existingBotMessage = messages.find(msg => 
        msg.type === 'bot' && msg.questionId === metadata.questionId && !msg.isFollowUp
      );
      if (existingBotMessage && !metadata.isFollowUp) {
        return;
      }
    }

    const message = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date(),
      ...metadata
    };
    
    setMessages(prev => [...prev, message]);
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    // Only keep timeout for toast message
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const triggerAnalysisGeneration = () => {
    if (completedPhases.has('initial')) {
      generateAndShowAnalysis();
    } else {
      showToastMessage('Complete the initial phase to generate analysis.', 'warning');
    }
  };

  useEffect(() => {
    window.triggerChatAnalysis = triggerAnalysisGeneration;
  }, [completedPhases]);

  const generateAndShowAnalysis = async () => {
    try {
      setIsGeneratingAnalysis(true);

      const businessData = createBusinessDataForAnalysisHelper();
      const strategicBooks = { part1: '', part2: '' };

      const analysisResult = await generateAnalysis(
        'swot',
        'chatbot-session',
        businessData,
        strategicBooks,
        true
      );
      
      if (analysisResult && !analysisResult.startsWith('Error')) {
        if (onAnalysisGenerated) {
          onAnalysisGenerated(analysisResult);
        }
        
        showToastMessage('📊 SWOT analysis generated successfully! Check the Analysis tab.', 'success');
        generateAndShowStrategicAnalysis();
      } else {
        throw new Error(analysisResult || 'Failed to generate analysis');
      }
    } catch (error) {
      showToastMessage('Failed to generate SWOT analysis. Please try again.', 'error');
      generateAndShowStrategicAnalysis();
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const generateAndShowStrategicAnalysis = async () => {
    try {
      setIsGeneratingStrategic(true);

      const businessData = createBusinessDataForAnalysisHelper();
      const strategicBooks = { part1: '', part2: '' };

      const strategicResult = await generateAnalysis(
        'strategic',
        'chatbot-session-strategic',
        businessData,
        strategicBooks,
        true
      );
      
      if (strategicResult && !strategicResult.startsWith('Error')) {
        if (onStrategicAnalysisGenerated) {
          onStrategicAnalysisGenerated(strategicResult);
        }
        
        showToastMessage('🎯 STRATEGIC analysis generated successfully! Check the S.T.R.A.T.E.G.I.C tab.', 'success');
      } else {
        throw new Error(strategicResult || 'Failed to generate strategic analysis');
      }
    } catch (error) {
      showToastMessage('Failed to generate strategic analysis. Please try again.', 'error');
    } finally {
      setIsGeneratingStrategic(false);
    }
  };

  const createBusinessDataForAnalysisHelper = () => {
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

  // Dynamic handler for phase followup responses
  const handlePhaseFollowup = async (answer, currentPhaseBeingValidated) => {
  addMessage('user', answer, { 
    questionId: `${currentPhaseBeingValidated}_phase_followup`,
    phase: currentPhaseBeingValidated
  });
  
  setCurrentInput('');
  
  const phaseValidation = await validatePhaseWithML(currentPhaseBeingValidated, userAnswers);
  
  if (!phaseValidation.valid) {
    addMessage('bot', phaseValidation.feedback || `I still need more specific information about the ${currentPhaseBeingValidated} phase. Can you elaborate further?`, {
      questionId: `${currentPhaseBeingValidated}_phase_followup_2`,
      isFollowUp: true,
      phase: currentPhaseBeingValidated,
      severity: 'mandatory',
      isPhaseValidation: true
    });
    showToastMessage(`Please provide more specific details for the ${currentPhaseBeingValidated} phase.`, 'info');
    return;
  }
  
  // Phase validation passed
  setPhaseValidationPending(false);
  setCompletedPhases(prev => new Set([...prev, currentPhaseBeingValidated]));
  
  const phaseDisplayName = currentPhaseBeingValidated.charAt(0).toUpperCase() + currentPhaseBeingValidated.slice(1);
  showToastMessage(`🎉 ${phaseDisplayName} phase completed successfully!`, 'success');
  
  if (currentPhaseBeingValidated === 'initial') {
    generateAndShowAnalysis();
  }
  
  // Directly add next question
  const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
  const answeredCount = Object.keys(userAnswers).length;
  
  if (answeredCount < sortedQuestions.length) {
    const nextQuestion = sortedQuestions[answeredCount];
    addMessage('bot', nextQuestion.question, { 
      questionId: nextQuestion.id,
      phase: nextQuestion.phase,
      severity: nextQuestion.severity
    });
  }
};

  // Dynamic handler for phase validation with updated messages
  const handlePhaseValidation = async (currentQuestion, answer, finalAnswer, updatedMessages) => {
  setPhaseValidationPending(true);
  
  const phaseValidation = await validatePhaseWithML(currentQuestion.phase, userAnswers, updatedMessages);
  
  if (!phaseValidation.valid) {
    addMessage('bot', phaseValidation.feedback || `I need more information to complete the ${currentQuestion.phase} phase. Can you provide additional details?`, {
      questionId: `${currentQuestion.phase}_phase_followup`,
      isFollowUp: true,
      phase: currentQuestion.phase,
      severity: 'mandatory',
      isPhaseValidation: true
    });
    
    showToastMessage(`Please provide additional details to complete the ${currentQuestion.phase} phase.`, 'info');
    return;
  }
  
  // Phase completed successfully
  setPhaseValidationPending(false);
  setCompletedPhases(prev => new Set([...prev, currentQuestion.phase]));
  
  const phaseDisplayName = currentQuestion.phase.charAt(0).toUpperCase() + currentQuestion.phase.slice(1);
  showToastMessage(`🎉 ${phaseDisplayName} phase completed successfully!`, 'success');
  
  if (currentQuestion.phase === 'initial') {
    generateAndShowAnalysis();
  }
  
  // Directly add next question
  const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
  const answeredCount = Object.keys(userAnswers).length;
  
  if (answeredCount < sortedQuestions.length) {
    const nextQuestion = sortedQuestions[answeredCount];
    addMessage('bot', nextQuestion.question, { 
      questionId: nextQuestion.id,
      phase: nextQuestion.phase,
      severity: nextQuestion.severity
    });
  }
};
  const handleSubmit = async () => {
    const currentQuestion = getCurrentQuestion();

    if (!currentInput.trim() || (!currentQuestion && !phaseValidationPending)) {
      return;
    }

    const answer = currentInput.trim();
    
    if (phaseValidationPending && !currentQuestion) {
      const lastPhaseValidationMessage = messages
        .filter(msg => msg.type === 'bot' && msg.isPhaseValidation)
        .pop();
      
      const currentPhaseBeingValidated = lastPhaseValidationMessage ? lastPhaseValidationMessage.phase : 'initial';
      
      // Use dynamic handler instead of timeout
      await handlePhaseFollowup(answer, currentPhaseBeingValidated);
      return;
    }

    if (!currentQuestion) {
      return;
    }

    addMessage('user', answer, { 
      questionId: currentQuestion.id,
      phase: currentQuestion.phase
    });
    
    setCurrentInput('');

    // FIXED: For follow-up questions, use the follow-up question text and only the current answer
    let questionTextForML = currentQuestion.question;
    let answerTextForML = answer;
    
    if (pendingValidation) {
      // Find the last follow-up question from the bot
      const lastBotMessage = messages
        .filter(msg => msg.type === 'bot' && msg.isFollowUp && msg.questionId === currentQuestion.id)
        .pop();
      
      if (lastBotMessage) {
        // Use the follow-up question text and only the current answer
        questionTextForML = lastBotMessage.text;
        answerTextForML = answer; // Only the current follow-up answer, not combined
      }
    }

    const validationResult = await validateAnswerWithML(questionTextForML, answerTextForML);
    
    if (!validationResult.valid) {
      addMessage('bot', validationResult.feedback, {
        questionId: currentQuestion.id,
        isFollowUp: true,
        phase: currentQuestion.phase,
        severity: currentQuestion.severity
      });
      
      setPendingValidation({
        question: pendingValidation ? pendingValidation.question : currentQuestion,
        originalAnswer: pendingValidation ? pendingValidation.originalAnswer : answer
      });
      
      showToastMessage('Please provide more details to complete your answer.', 'info');
      return;
    }
    
    // For the brief section and storage, combine answers if it's a follow-up
    const finalAnswer = pendingValidation ? `${pendingValidation.originalAnswer} ${answer}` : answer;
    setPendingValidation(null);
    
    if (onNewAnswer) {
      onNewAnswer(currentQuestion.id, finalAnswer);
    }
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const firstQuestion = sortedQuestions[0];
    if (firstQuestion && currentQuestion.id === firstQuestion.id && onBusinessDataUpdate) {
      const businessName = extractBusinessName(finalAnswer);
      if (businessName) {
        onBusinessDataUpdate({ name: businessName, whatWeDo: finalAnswer });
      }
    }

    const isLastMandatory = isLastMandatoryQuestionOfPhase(currentQuestion);
    
    if (isLastMandatory) {
      // Create updated messages array that includes the current answer for phase validation
      const updatedMessages = [...messages];
      
      // If this was a follow-up answer, add the follow-up question and only the current answer
      if (pendingValidation) {
        const lastBotMessage = messages
          .filter(msg => msg.type === 'bot' && msg.isFollowUp && msg.questionId === currentQuestion.id)
          .pop();
        
        if (lastBotMessage) {
          // Add the follow-up question
          updatedMessages.push(lastBotMessage);
          // Add only the current follow-up answer (not the combined answer)
          updatedMessages.push({
            id: Date.now() + Math.random(),
            type: 'user',
            text: answer, // Use the current answer, not finalAnswer
            timestamp: new Date(),
            questionId: currentQuestion.id,
            phase: currentQuestion.phase
          });
        }
      } else {
        // For non-follow-up answers, add the answer normally
        updatedMessages.push({
          id: Date.now() + Math.random(),
          type: 'user',
          text: answer,
          timestamp: new Date(),
          questionId: currentQuestion.id,
          phase: currentQuestion.phase
        });
      }
      
      // Use dynamic handler instead of direct async call
      await handlePhaseValidation(currentQuestion, answer, finalAnswer, updatedMessages);
      return;
    }

    const answeredCount = Object.keys(userAnswers).length + 1;
    if (answeredCount < sortedQuestions.length) {
      const nextQuestion = sortedQuestions[answeredCount];
      
      addMessage('bot', nextQuestion.question, { 
        questionId: nextQuestion.id,
        phase: nextQuestion.phase,
        severity: nextQuestion.severity
      });
    } else {
      showToastMessage('🎉 Survey completed! Well done!', 'success');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoadingQuestions) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <div>Loading questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="loading-container">
        <div>❌ Failed to load questions</div>
        <button onClick={loadQuestionsFromAPI} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="chat-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message-wrapper ${message.type}`}>
            {message.type === 'bot' && (
              <div className="bot-avatar">
                <img src="/chat-bot.png" alt="Bot Avatar" />
              </div>
            )}
            
            <div className={`message-bubble ${message.type} ${message.isSystemMessage ? 'system' : ''} ${message.isFollowUp ? 'follow-up' : ''} ${message.isPhaseValidation ? 'phase-validation' : ''}`}>
              <div className="message-text">{message.text}</div>
               
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                {message.type === 'bot' && message.phase && (
                  <span style={{ fontStyle: 'italic' }}>
                    - {message.phase} phase
                    {message.isFollowUp && ' (follow-up)'}
                    {message.isPhaseValidation && ' (phase validation)'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(isGeneratingAnalysis || isGeneratingStrategic || isValidating || isValidatingPhase) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isValidating && 'Validating your answer...'}
              {isValidatingPhase && 'Validating phase completion...'}
              {isGeneratingAnalysis && 'Generating your business analysis...'}
              {isGeneratingStrategic && 'Generating your strategic analysis...'}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              phaseValidationPending 
                ? "Please provide additional details about your business..." 
                : currentQuestion 
                  ? (pendingValidation ? "Please provide additional details..." : "Type your answer here...") 
                  : "All questions completed!"
            }
            disabled={(!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase}
            className="message-input"
            rows="2"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentInput.trim() || ((!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase)}
            className={`send-button ${(!currentInput.trim() || ((!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase)) ? 'disabled' : ''}`}
          >
            {(isValidating || isValidatingPhase) ? <Loader size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </div>
        
        <div className="status-text">
          {phaseValidationPending ? (
            <span>
              Phase validation pending • Please provide more details
              {isValidatingPhase && ' • Validating...'}
            </span>
          ) : currentQuestion ? (
            <span>
              Question {Object.keys(userAnswers).length + 1} of {questions.length} • 
              Phase: {currentQuestion.phase.toUpperCase()}
              {pendingValidation && ' • Follow-up required'}
              {isValidating && ' • Validating...'}
            </span>
          ) : (
            <span>✅ All questions completed!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;