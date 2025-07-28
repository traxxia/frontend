import React, { useState, useEffect, useRef } from "react";
import { Send, Loader } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";

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
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [phaseValidationPending, setPhaseValidationPending] = useState(false);
  const { t } = useTranslation();
  
  // Auto-save state
  const [sessionId, setSessionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // API call tracking state
  const [questionApiCalls, setQuestionApiCalls] = useState({});
  const [phaseApiCalls, setPhaseApiCalls] = useState({});
  
  // Prevent multiple initializations
  const hasInitialized = useRef(false);
  
  const messagesEndRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');
 
  const MAX_QUESTION_API_CALLS = 2;
  const MAX_PHASE_API_CALLS = 2;

  // NEW: Generate analysis using /find API
  const generateAnalysisWithFind = async () => {
    try {
      setIsGeneratingAnalysis(true);
      showToastMessage('Generating your business analysis...', 'info');

      // Prepare questions and answers arrays
      const questionsArray = [];
      const answersArray = [];

      // Sort questions by ID to maintain order
      const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
      
      // Only include answered questions
      sortedQuestions.forEach(question => {
        if (userAnswers[question.id]) {
          questionsArray.push(question.question);
          answersArray.push(userAnswers[question.id]);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for analysis');
      }

      console.log('Sending to /find API:', {
        questions: questionsArray,
        answers: answersArray
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
        throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Received from /find API:', result);

      // The API should return analysis content that we can pass to SwotAnalysis
      if (result && onAnalysisGenerated) {
        // Assuming the API returns analysis in a format compatible with SwotAnalysis
        // You may need to adjust this based on the actual API response structure
        const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);
        onAnalysisGenerated(analysisContent);
        showToastMessage('📊 Business analysis generated successfully! Check the Analysis tab.', 'success');
      } else {
        throw new Error('Invalid response from analysis API');
      }

    } catch (error) {
      console.error('Error generating analysis:', error);
      showToastMessage('Failed to generate analysis. Please try again.', 'error');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };
 
  const autoSaveMessage = async (messageData) => {
    try { 
      setIsSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversation/save-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: messageData
        })
      });

      if (response.ok) {
        const result = await response.json(); 
        if (!sessionId && result.sessionId) { 
          setSessionId(result.sessionId);
        } 
        return result;
      } else {
        console.error('❌ Failed to save message:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Auto-save message error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Finalize answer after ML validation passes
  const finalizeAnswer = async (questionId, finalAnswer, attemptCount = 1) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversation/finalize-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          questionId: questionId,
          finalAnswer: finalAnswer,
          attemptCount: attemptCount
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (onNewAnswer) {
          onNewAnswer(questionId, finalAnswer);
        }

        if (result.businessData && onBusinessDataUpdate) {
          onBusinessDataUpdate(result.businessData);
        }

        return result;
      } else {
        console.error('Failed to finalize answer:', response.statusText);
      }
    } catch (error) {
      console.error('Finalize answer error:', error);
    }
  };

  // Complete phase
  const completePhase = async (phase) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversation/complete-phase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          phase: phase
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCompletedPhases(new Set(result.completedPhases));
        return result;
      }
    } catch (error) {
      console.error('Complete phase error:', error);
    }
  };

  // Load current conversation on component mount
  const loadCurrentConversation = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversation/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const conversation = await response.json();
        
        if (conversation.sessionId) { 
          setSessionId(conversation.sessionId);
          
          if (conversation.messages && conversation.messages.length > 0) {
            setMessages(conversation.messages);
          }
          
          setCompletedPhases(new Set(conversation.progress?.completedPhases || []));
          
          if (conversation.questionApiCalls) {
            setQuestionApiCalls(conversation.questionApiCalls);
          }
          if (conversation.phaseApiCalls) {
            setPhaseApiCalls(conversation.phaseApiCalls);
          }
          
          if (conversation.businessData && onBusinessDataUpdate) {
            onBusinessDataUpdate(conversation.businessData);
          }

          if (conversation.finalAnswers && onNewAnswer) {
            Object.values(conversation.finalAnswers).forEach(answer => {
              onNewAnswer(answer.questionId, answer.finalAnswer);
            });
          }
        }
        
        return conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Load conversation error:', error);
      return null;
    }
  };

  const getPhaseQuestions = (phaseName) => {
    return phases[phaseName] || [];
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

  const getCurrentQuestion = () => {
    if (Object.keys(phases).length === 0) return null;
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const answeredCount = Object.keys(userAnswers).length;
    
    if (pendingValidation) {
      return pendingValidation.question;
    }
    
    if (phaseValidationPending) {
      return null;
    }
    
    if (answeredCount < sortedQuestions.length) {
      return sortedQuestions[answeredCount];
    }
    
    return null;
  };

  const addMessage = async (type, text, metadata = {}, skipAutoSave = false) => {
    if (type === 'bot' && metadata.questionId) {
      const existingBotMessage = messages.find(msg => 
        msg.type === 'bot' && msg.questionId === metadata.questionId && !msg.isFollowUp
      );
      if (existingBotMessage && !metadata.isFollowUp) {
        return;
      }
    }

    const messageData = {
      id: Date.now() + Math.random().toString(),
      type,
      text,
      timestamp: new Date(),
      ...metadata
    };
    
    setMessages(prev => [...prev, messageData]);
    
    if (!skipAutoSave) {
      await autoSaveMessage(messageData);
    }
  };
 
  useEffect(() => { 
    if (hasInitialized.current) { 
      return;
    }

    const initializeChat = async () => { 
      hasInitialized.current = true;  
      
      try { 
        const loadedQuestions = await loadQuestionsFromAPI();
         
        const conversation = await loadCurrentConversation(); 
        const hasExistingMessages = conversation && conversation.messages && conversation.messages.length > 0;
 
        if (!hasExistingMessages && loadedQuestions.length > 0) {
          const firstQuestion = loadedQuestions.find(q => q.id === 1) || loadedQuestions[0];
          
          const firstMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'bot',
            text: firstQuestion.question,
            timestamp: new Date(),
            questionId: firstQuestion.id,
            phase: firstQuestion.phase,
            severity: firstQuestion.severity,
            isFollowUp: false,
            isPhaseValidation: false
          };
          
          setMessages([firstMessage]);
          await autoSaveMessage(firstMessage);
        }  
        
      } catch (error) {
        console.error('❌ Initialization error:', error);
        hasInitialized.current = false;
      }
    };
    
    initializeChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        
        return loadedQuestions;
      } else {
        showToastMessage('Failed to load questions. Please refresh the page.', 'error');
        return [];
      }
    } catch (error) {
      showToastMessage('Error loading questions. Please check your connection.', 'error');
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Updated validateAnswerWithML with call limit tracking
  const validateAnswerWithML = async (question, answer, questionId) => {
    try {
      const currentCalls = questionApiCalls[questionId] || 0;
      if (currentCalls >= MAX_QUESTION_API_CALLS) { 
        return { valid: true, maxCallsReached: true };
      }

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
      
      setQuestionApiCalls(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + 1
      }));

      return result;
    } catch (error) {
      showToastMessage('Failed to validate answer. Continuing without validation.', 'warning');
      return { valid: true };
    } finally {
      setIsValidating(false);
    }
  };

  // Updated validatePhaseWithML with call limit tracking
  const validatePhaseWithML = async (phaseName, phaseAnswers, messagesOverride = null) => {
    try {
      const currentCalls = phaseApiCalls[phaseName] || 0;
      if (currentCalls >= MAX_PHASE_API_CALLS) { 
        return { valid: true, maxCallsReached: true };
      }

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
      
      setPhaseApiCalls(prev => ({
        ...prev,
        [phaseName]: (prev[phaseName] || 0) + 1
      }));

      return result;
    } catch (error) {
      showToastMessage(`Failed to validate ${phaseName} phase completion. Continuing to next phase.`, 'warning');
      return { valid: true };
    } finally {
      setIsValidatingPhase(false);
    }
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

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const triggerAnalysisGeneration = () => {
    if (completedPhases.has('initial')) {
      generateAnalysisWithFind(); // Use new function
    } else {
      showToastMessage('Complete the initial phase to generate analysis.', 'warning');
    }
  };

  useEffect(() => {
    window.triggerChatAnalysis = triggerAnalysisGeneration;
  }, [completedPhases]);

  // Updated handlers with API call limit checking
  const handlePhaseFollowup = async (answer, currentPhaseBeingValidated) => {
    await addMessage('user', answer, { 
      questionId: `${currentPhaseBeingValidated}_phase_followup`,
      phase: currentPhaseBeingValidated
    });
    
    setCurrentInput('');
    
    const phaseValidation = await validatePhaseWithML(currentPhaseBeingValidated, userAnswers);
    
    if (!phaseValidation.valid && !phaseValidation.maxCallsReached) {
      await addMessage('bot', phaseValidation.feedback || `I still need more specific information about the ${currentPhaseBeingValidated} phase. Can you elaborate further?`, {
        questionId: `${currentPhaseBeingValidated}_phase_followup_2`,
        isFollowUp: true,
        phase: currentPhaseBeingValidated,
        severity: 'mandatory',
        isPhaseValidation: true
      });
      showToastMessage(`Please provide more specific details for the ${currentPhaseBeingValidated} phase.`, 'info');
      return;
    }
     
    setPhaseValidationPending(false);
    await completePhase(currentPhaseBeingValidated);
    
    const phaseDisplayName = currentPhaseBeingValidated.charAt(0).toUpperCase() + currentPhaseBeingValidated.slice(1);
    showToastMessage(`🎉 ${phaseDisplayName} phase completed successfully!`, 'success');
    
    if (currentPhaseBeingValidated === 'initial') {
      generateAnalysisWithFind(); // Use new function
    }
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const answeredCount = Object.keys(userAnswers).length;
    
    if (answeredCount < sortedQuestions.length) {
      const nextQuestion = sortedQuestions[answeredCount];
      await addMessage('bot', nextQuestion.question, { 
        questionId: nextQuestion.id,
        phase: nextQuestion.phase,
        severity: nextQuestion.severity
      });
    }
  };

  const handlePhaseValidation = async (currentQuestion, answer, finalAnswer, updatedMessages) => {
    setPhaseValidationPending(true);
    
    const phaseValidation = await validatePhaseWithML(currentQuestion.phase, userAnswers, updatedMessages);
    
    if (!phaseValidation.valid && !phaseValidation.maxCallsReached) {
      await addMessage('bot', phaseValidation.feedback || `I need more information to complete the ${currentQuestion.phase} phase. Can you provide additional details?`, {
        questionId: `${currentQuestion.phase}_phase_followup`,
        isFollowUp: true,
        phase: currentQuestion.phase,
        severity: 'mandatory',
        isPhaseValidation: true
      });
      
      showToastMessage(`Please provide additional details to complete the ${currentQuestion.phase} phase.`, 'info');
      return;
    }
 
    setPhaseValidationPending(false);
    await completePhase(currentQuestion.phase);
    
    const phaseDisplayName = currentQuestion.phase.charAt(0).toUpperCase() + currentQuestion.phase.slice(1);
    showToastMessage(`🎉 ${phaseDisplayName} phase completed successfully!`, 'success');
    
    if (currentQuestion.phase === 'initial') {
      generateAnalysisWithFind(); // Use new function
    }
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const answeredCount = Object.keys(userAnswers).length;
    
    if (answeredCount < sortedQuestions.length) {
      const nextQuestion = sortedQuestions[answeredCount];
      await addMessage('bot', nextQuestion.question, { 
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
      
      await handlePhaseFollowup(answer, currentPhaseBeingValidated);
      return;
    }

    if (!currentQuestion) {
      return;
    }

    await addMessage('user', answer, { 
      questionId: currentQuestion.id,
      phase: currentQuestion.phase
    });
    
    setCurrentInput('');

    let questionTextForML = currentQuestion.question;
    let answerTextForML = answer;
    
    if (pendingValidation) {
      const lastBotMessage = messages
        .filter(msg => msg.type === 'bot' && msg.isFollowUp && msg.questionId === currentQuestion.id)
        .pop();
      
      if (lastBotMessage) {
        questionTextForML = lastBotMessage.text;
        answerTextForML = answer;
      }
    }

    const validationResult = await validateAnswerWithML(questionTextForML, answerTextForML, currentQuestion.id);
    
    if (!validationResult.valid && !validationResult.maxCallsReached) {
      await addMessage('bot', validationResult.feedback, {
        questionId: currentQuestion.id,
        isFollowUp: true,
        phase: currentQuestion.phase,
        severity: currentQuestion.severity,
        mlValidation: {
          validated: true,
          valid: false,
          feedback: validationResult.feedback,
          attempt: pendingValidation ? pendingValidation.attempt + 1 : 2
        }
      });
      
      setPendingValidation({
        question: pendingValidation ? pendingValidation.question : currentQuestion,
        originalAnswer: pendingValidation ? pendingValidation.originalAnswer : answer,
        attempt: pendingValidation ? pendingValidation.attempt + 1 : 2
      });
      
      showToastMessage('Please provide more details to complete your answer.', 'info');
      return;
    }
 
    const finalAnswer = pendingValidation ? `${pendingValidation.originalAnswer} ${answer}` : answer;
    const attemptCount = pendingValidation ? pendingValidation.attempt : 1;
    
    setPendingValidation(null);
    
    await finalizeAnswer(currentQuestion.id, finalAnswer, attemptCount);
    
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
      const updatedMessages = [...messages];
      
      if (pendingValidation) {
        const lastBotMessage = messages
          .filter(msg => msg.type === 'bot' && msg.isFollowUp && msg.questionId === currentQuestion.id)
          .pop();
        
        if (lastBotMessage) {
          updatedMessages.push(lastBotMessage);
          updatedMessages.push({
            id: Date.now() + Math.random(),
            type: 'user',
            text: answer,
            timestamp: new Date(),
            questionId: currentQuestion.id,
            phase: currentQuestion.phase
          });
        }
      } else {
        updatedMessages.push({
          id: Date.now() + Math.random(),
          type: 'user',
          text: answer,
          timestamp: new Date(),
          questionId: currentQuestion.id,
          phase: currentQuestion.phase
        });
      }
      
      await handlePhaseValidation(currentQuestion, answer, finalAnswer, updatedMessages);
      return;
    }

    const answeredCount = Object.keys(userAnswers).length + 1;
    if (answeredCount < sortedQuestions.length) {
      const nextQuestion = sortedQuestions[answeredCount];
      
      await addMessage('bot', nextQuestion.question, { 
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
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                {message.type === 'bot' && message.phase && (
                  <span style={{ fontStyle: 'italic' }}>
                    - {message.phase} phase
                    {message.isFollowUp && ' (follow-up)'}
                    {message.isPhaseValidation && ' (phase validation)'}
                  </span>
                )}
                {isSaving && message.id === messages[messages.length - 1]?.id && (
                  <span style={{ color: '#666', fontSize: '12px' }}> • saving...</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(isGeneratingAnalysis || isValidating || isValidatingPhase) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isValidating && 'Validating your answer...'}
              {isValidatingPhase && 'Validating phase completion...'}
              {isGeneratingAnalysis && 'Generating your business analysis...'}
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
                  ? (pendingValidation ? "Please provide additional details..." : t("typeYourAnswer")) 
                  : "All questions completed!"
            }
            disabled={(!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase || isSaving}
            className="message-input"
            rows="2"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentInput.trim() || ((!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase || isSaving)}
            className={`send-button ${(!currentInput.trim() || ((!currentQuestion && !phaseValidationPending) || isValidating || isValidatingPhase || isSaving)) ? 'disabled' : ''}`}
          >
            {(isValidating || isValidatingPhase || isSaving) ? <Loader size={16} className="spinner" /> : <Send size={16} />}
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
              {t("question")} {Object.keys(userAnswers).length + 1} {t("of")} {questions.length} • 
              {t("phase")}: {currentQuestion.phase.toUpperCase()}
              {pendingValidation && ` • ${t("followUpRequired")}`}
              {isValidating && ` • ${t("validating")}`}
              {isSaving && ' • Auto-saving...'}
              {process.env.NODE_ENV === 'development' && (
                <span style={{ fontSize: '10px', color: '#999' }}>
                  {' '}• API calls: Q{questionApiCalls[currentQuestion.id] || 0}/{MAX_QUESTION_API_CALLS}, P{phaseApiCalls[currentQuestion.phase] || 0}/{MAX_PHASE_API_CALLS}
                </span>
              )}
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