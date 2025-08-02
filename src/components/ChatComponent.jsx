import React, { useState, useEffect, useRef } from "react";
import { Send, Loader } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";

const ChatComponent = ({
  userAnswers = {},
  onBusinessDataUpdate,
  onNewAnswer,
  onAnalysisGenerated,
  onCustomerSegmentationGenerated,
  onPurchaseCriteriaGenerated,
  onChannelHeatmapGenerated,
  onCapabilityHeatmapGenerated,
  onQuestionsLoaded,
  onLoyaltyNPSGenerated,
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [phases, setPhases] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isValidatingAnswer, setIsValidatingAnswer] = useState(false);
  const [isValidatingPhase, setIsValidatingPhase] = useState(false); // NEW: For analyze-all validation
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [currentProgress, setCurrentProgress] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [followupAttempts, setFollowupAttempts] = useState(0);
  
  // NEW: Phase validation state
  const [phaseValidationPending, setPhaseValidationPending] = useState(null);
  const [phaseValidationAttempts, setPhaseValidationAttempts] = useState(0);
  
  const { t } = useTranslation();

  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');

  // Constants for phases
  const PHASES = {
    INITIAL: "initial",
    ESSENTIAL: "essential",
    GOOD: "good",
    EXCELLENT: "excellent",
  };

  // Helper function to check completion with specific data
  const checkInitialPhaseCompletedWithData = (userAnswersData) => {
    if (!questions || questions.length === 0) return false;

    const initialMandatoryQuestions = questions.filter(
      (q) => q.phase === PHASES.INITIAL && q.severity === "mandatory"
    );

    return initialMandatoryQuestions.every((q) => {
      const questionId = q._id || q.question_id;
      return userAnswersData[questionId];
    });
  };

  // Check if initial phase is completed
  const isInitialPhaseCompleted = () => {
    if (!questions || questions.length === 0) return false;

    const initialMandatoryQuestions = questions.filter(
      (q) => q.phase === PHASES.INITIAL && q.severity === "mandatory"
    );

    return initialMandatoryQuestions.every((q) => {
      const questionId = q._id || q.question_id;
      return userAnswers[questionId];
    });
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    loadLatestProgress();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add message to chat LOCALLY ONLY (no backend save)
  const addMessageLocally = (type, text, metadata = {}) => {
    const messageData = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      text,
      timestamp: new Date(),
      ...metadata
    };

    setMessages(prev => [...prev, messageData]);
    return messageData;
  };

  // Add message to chat and save to backend
  const addMessage = async (type, text, metadata = {}) => {
    const messageData = addMessageLocally(type, text, metadata);
    // Save to backend
    try {
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/api/user/save-chat-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_type: type,
          message_text: text,
          question_id: metadata.questionId || null,
          metadata: {
            phase: metadata.phase,
            severity: metadata.severity,
            isFollowUp: metadata.isFollowUp || false,
            isPhaseValidation: metadata.isPhaseValidation || false,
            ...metadata
          }
        })
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }

    return messageData;
  };

  // Load latest progress function
  const loadLatestProgress = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/user/latest-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        setQuestions(data.available_questions || []);

        const phaseGroups = {};
        data.available_questions?.forEach(question => {
          if (!phaseGroups[question.phase]) {
            phaseGroups[question.phase] = [];
          }
          phaseGroups[question.phase].push(question);
        });
        setPhases(phaseGroups);

        if (onQuestionsLoaded) {
          onQuestionsLoaded(data.available_questions || [], phaseGroups);
        }

        // Process chat history and messages
        const chatMessages = [];
        const messageSet = new Set();

        if (data.chat_history && Array.isArray(data.chat_history)) {
          data.chat_history.forEach(msg => {
            const messageKey = `${msg.message_type}_${msg.question_id}_${msg.message_text.substring(0, 50)}_${msg.timestamp}`;

            if (!messageSet.has(messageKey)) {
              messageSet.add(messageKey);

              chatMessages.push({
                id: `${msg.timestamp}_${Math.random()}`,
                type: msg.message_type,
                text: msg.message_text,
                timestamp: new Date(msg.timestamp),
                questionId: msg.question_id,
                phase: msg.metadata?.phase || null,
                isFollowUp: msg.metadata?.isFollowUp || false,
                isPhaseValidation: msg.metadata?.isPhaseValidation || false,
                metadata: msg.metadata || {},
                fromHistory: true
              });
            }
          });
        }

        // Process final answers to create missing messages
        const userAnswerMessages = [];
        const missingBotQuestions = [];

        if (data.finalAnswers) {
          const orderToMongoIdMap = new Map();
          const questionMap = new Map();

          data.available_questions?.forEach(question => {
            const mongoId = question._id;
            const questionId = question.question_id;
            const order = question.order;

            if (mongoId) {
              questionMap.set(String(mongoId), question);
              if (order) {
                orderToMongoIdMap.set(order, mongoId);
              }
            }
            if (questionId) {
              questionMap.set(String(questionId), question);
            }
            if (order) {
              questionMap.set(String(order), question);
            }
          });

          const sortedAnswers = Object.values(data.finalAnswers).sort((a, b) => {
            return (a.questionId || 999) - (b.questionId || 999);
          });

          sortedAnswers.forEach(answerObj => {
            const questionOrder = answerObj.questionId;
            const mongoObjectId = orderToMongoIdMap.get(questionOrder);

            if (!answerObj.finalAnswer || !mongoObjectId) {
              return;
            }

            const question = questionMap.get(String(questionOrder));
            if (!question) {
              return;
            }

            // Check if bot question exists in chat history
            const botQuestionExists = chatMessages.some(msg =>
              msg.type === 'bot' &&
              String(msg.questionId) === String(mongoObjectId) &&
              !msg.isFollowUp &&
              !msg.isPhaseValidation
            );

            // Check if user answer exists in chat history
            const userAnswerExists = chatMessages.some(msg =>
              msg.type === 'user' &&
              String(msg.questionId) === String(mongoObjectId) &&
              !msg.isFollowUp &&
              !msg.isPhaseValidation
            );

            // Add missing bot question (main question only)
            if (!botQuestionExists) {
              missingBotQuestions.push({
                id: `bot_${mongoObjectId}_reconstructed`,
                type: 'bot',
                text: question.question_text,
                timestamp: new Date(),
                questionId: mongoObjectId,
                phase: question.phase,
                severity: question.severity,
                isFollowUp: false,
                isPhaseValidation: false,
                metadata: {
                  phase: question.phase,
                  severity: question.severity,
                  isFollowUp: false,
                  isPhaseValidation: false,
                  reconstructed: true
                },
                reconstructed: true
              });
            }

            // Add missing user answer (main answer only)
            if (!userAnswerExists) {
              userAnswerMessages.push({
                id: `user_${mongoObjectId}_reconstructed`,
                type: 'user',
                text: answerObj.finalAnswer,
                timestamp: new Date(),
                questionId: mongoObjectId,
                phase: answerObj.phase || question.phase,
                isFollowUp: false,
                isPhaseValidation: false,
                metadata: {
                  phase: answerObj.phase || question.phase,
                  severity: answerObj.severity || question.severity,
                  isFollowUp: false,
                  isPhaseValidation: false,
                  reconstructed: true
                },
                reconstructed: true
              });
            }
          });
        }

        // LOGIC-BASED SORTING: Build conversation flow based on question order and conversation logic
        const finalMessages = [];
        
        const allQuestionIds = new Set();
        [...chatMessages, ...userAnswerMessages, ...missingBotQuestions].forEach(msg => {
          if (msg.questionId) {
            allQuestionIds.add(String(msg.questionId));
          }
        });

        const questionMap = new Map();
        data.available_questions?.forEach(question => {
          const mongoId = question._id;
          const questionId = question.question_id;
          const order = question.order;

          if (mongoId) {
            questionMap.set(String(mongoId), question);
          }
          if (questionId) {
            questionMap.set(String(questionId), question);
          }
          if (order) {
            questionMap.set(String(order), question);
          }
        });

        const sortedQuestionIds = Array.from(allQuestionIds).sort((a, b) => {
          const questionA = questionMap.get(a);
          const questionB = questionMap.get(b);
          const orderA = questionA?.order || 999;
          const orderB = questionB?.order || 999;
          return orderA - orderB;
        });

        sortedQuestionIds.forEach(questionId => { 
          const questionMessages = [...chatMessages, ...userAnswerMessages, ...missingBotQuestions]
            .filter(msg => String(msg.questionId) === questionId);

          const mainMessages = questionMessages.filter(msg => !msg.isFollowUp && !msg.isPhaseValidation && !msg.metadata?.isFollowUp && !msg.metadata?.isPhaseValidation);
          const followUpMessages = questionMessages.filter(msg => (msg.isFollowUp || msg.metadata?.isFollowUp) && !msg.isPhaseValidation && !msg.metadata?.isPhaseValidation);
          const phaseValidationMessages = questionMessages.filter(msg => msg.isPhaseValidation || msg.metadata?.isPhaseValidation);

          const mainBotQuestion = mainMessages.find(msg => msg.type === 'bot');
          const mainUserAnswer = mainMessages.find(msg => msg.type === 'user');

          if (mainBotQuestion) {
            finalMessages.push(mainBotQuestion); 
          }

          if (mainUserAnswer) {
            finalMessages.push(mainUserAnswer); 
          }

          if (followUpMessages.length > 0) {
            const realFollowUps = followUpMessages.filter(msg => msg.fromHistory);
            const reconstructedFollowUps = followUpMessages.filter(msg => !msg.fromHistory);
            
            realFollowUps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            [...realFollowUps, ...reconstructedFollowUps].forEach(msg => {
              finalMessages.push(msg);  
            });
          }

          // Add phase validation messages
          if (phaseValidationMessages.length > 0) {
            const realPhaseValidation = phaseValidationMessages.filter(msg => msg.fromHistory);
            const reconstructedPhaseValidation = phaseValidationMessages.filter(msg => !msg.fromHistory);
            
            realPhaseValidation.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            [...realPhaseValidation, ...reconstructedPhaseValidation].forEach(msg => {
              finalMessages.push(msg);  
            });
          }
        });

        setMessages(finalMessages);

        setCurrentProgress(data.progress);
        setNextQuestion(data.next_question);

        if (data.user_answers && Object.keys(data.user_answers).length > 0) {
          Object.entries(data.user_answers).forEach(([questionId, answer]) => {
            if (onNewAnswer) {
              onNewAnswer(questionId, answer);
            }
          });
        }

        if (data.next_question) {
          const nextQuestionId = data.next_question._id || data.next_question.question_id;
          const nextQuestionIdStr = String(nextQuestionId);

          const userAlreadyAnswered = !!data.user_answers?.[nextQuestionIdStr];
          const botAlreadyAsked = finalMessages.some(
            (msg) => msg.type === 'bot' && String(msg.questionId) === nextQuestionIdStr && !msg.isFollowUp && !msg.isPhaseValidation
          );

          if (!userAlreadyAnswered && !botAlreadyAsked) {
            addMessageLocally('bot', data.next_question.question_text, {
              questionId: nextQuestionId,
              phase: data.next_question.phase,
              severity: data.next_question.severity,
              isFollowUp: false,
              isPhaseValidation: false
            });
          }
        } else if (finalMessages.length === 0 && data.available_questions?.length > 0) {
          const firstQuestion = data.available_questions[0];
          const firstQuestionId = firstQuestion._id || firstQuestion.question_id;
          addMessageLocally('bot', firstQuestion.question_text, {
            questionId: firstQuestionId,
            phase: firstQuestion.phase,
            severity: firstQuestion.severity,
            isFollowUp: false,
            isPhaseValidation: false
          });
        }

      } else {
        const errorData = await response.json();
        showToastMessage(errorData.message || 'Failed to load progress', 'error');
      }
    } catch (error) {
      console.error('Error loading latest progress:', error);
      showToastMessage('Error loading progress. Please refresh the page.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Call ML API to validate answer
  const validateAnswerWithML = async (questionText, answerText) => {
    try {
      const mlResponse = await fetch(`${ML_API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: questionText,
          answer: answerText.trim()
        })
      });

      if (mlResponse.ok) {
        const mlValidation = await mlResponse.json();
        return mlValidation;
      } else {
        console.error('❌ ML API failed:', mlResponse.status, mlResponse.statusText);
        return { valid: true, feedback: null, needs_followup: false };
      }
    } catch (error) {
      console.error('❌ ML API call error:', error.message);
      return { valid: true, feedback: null, needs_followup: false };
    }
  };

  // NEW: Validate all answers using analyze-all endpoint
  const validateAllAnswersWithML = async () => {
    try {
      setIsValidatingPhase(true);

      // Get all initial phase questions and their answers
      const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
      
      const questionsAndAnswers = initialQuestions.map(question => {
        const questionId = question._id || question.question_id;
        const answer = userAnswers[questionId];
        
        if (!answer) {
          throw new Error(`Missing answer for question ${questionId}`);
        }

        return {
          question: question.question_text,
          answer: answer
        };
      });

      if (questionsAndAnswers.length === 0) {
        throw new Error('No questions and answers found for validation');
      }

      console.log('📝 Sending to analyze-all API:', questionsAndAnswers);

      const mlResponse = await fetch(`${ML_API_BASE_URL}/analyze-all`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionsAndAnswers)
      });

      if (mlResponse.ok) {
        const mlValidation = await mlResponse.json();
        console.log('📝 Received from analyze-all API:', mlValidation);
        return mlValidation;
      } else {
        console.error('❌ analyze-all ML API failed:', mlResponse.status, mlResponse.statusText);
        return { valid: true, feedback: null };
      }
    } catch (error) {
      console.error('❌ analyze-all ML API call error:', error.message);
      return { valid: true, feedback: null };
    } finally {
      setIsValidatingPhase(false);
    }
  };

  // Save user answer to backend
  const saveAnswer = async (questionId, questionText, answerText, isFollowup = false, followupParentId = null) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      if (!questionId || !questionText || !answerText) {
        console.error('❌ Missing required fields in saveAnswer:', {
          questionId,
          questionText,
          answerText
        });
        throw new Error('Question ID, text, and answer are required.');
      }

      const payload = {
        question_id: questionId,
        question_text: questionText,
        answer_text: answerText,
        is_followup: isFollowup,
        followup_parent_id: followupParentId
      };

      const response = await fetch(`${API_BASE_URL}/api/user/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        if (onNewAnswer && !isFollowup) {
          onNewAnswer(questionId, answerText);
        }
        return result;
      } else {
        console.error('❌ Failed to save answer:', result);
        throw new Error(result.message || 'Failed to save answer.');
      }
    } catch (error) {
      console.error('❌ Error in saveAnswer:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Generate analysis functions
  const generateChannelHeatmapAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      showToastMessage('Generating your channel heatmap analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
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
        await saveAnalysisAsPhaseResult(result.channelHeatmap, 'channelHeatmap');

        if (onChannelHeatmapGenerated) {
          onChannelHeatmapGenerated(result.channelHeatmap);
        }

        showToastMessage('📊 Channel heatmap analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from channel heatmap API');
      }

    } catch (error) {
      console.error('Error generating channel heatmap analysis:', error);
      showToastMessage('Failed to generate channel heatmap analysis. Please try again.', 'error');
    }
  };

  const generateCapabilityHeatmapAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      showToastMessage('Generating your capability heatmap analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
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

      let dataToSave = null;
      if (result && result.capabilityHeatmap) {
        dataToSave = result.capabilityHeatmap;
      } else if (result && result.capabilities) {
        dataToSave = result;
      } else {
        throw new Error('Invalid response structure from capability heatmap API');
      }

      if (dataToSave) {
        await saveAnalysisAsPhaseResult(dataToSave, 'capabilityHeatmap');

        if (onCapabilityHeatmapGenerated) {
          onCapabilityHeatmapGenerated(dataToSave);
        }

        showToastMessage('📊 Capability heatmap analysis generated successfully!', 'success');
      }

    } catch (error) {
      console.error('Error generating capability heatmap analysis:', error);
      showToastMessage('Failed to generate capability heatmap analysis. Please try again.', 'error');
    }
  };

  const generateLoyaltyNPSAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      showToastMessage('Generating your loyalty & NPS analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
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
        await saveAnalysisAsPhaseResult(result.loyaltyMetrics, 'loyaltyNPS');

        if (onLoyaltyNPSGenerated) {
          onLoyaltyNPSGenerated(result.loyaltyMetrics);
        }

        showToastMessage('📊 Loyalty & NPS analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from loyalty NPS API');
      }

    } catch (error) {
      console.error('Error generating loyalty NPS analysis:', error);
      showToastMessage('Failed to generate loyalty NPS analysis. Please try again.', 'error');
    }
  };

  const generateSWOTAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      setIsGeneratingAnalysis(true);
      showToastMessage('Generating your SWOT analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[questionId]);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for analysis');
      }

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
      const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);

      if (onAnalysisGenerated) {
        onAnalysisGenerated(analysisContent);
      }

      showToastMessage('📊 SWOT analysis generated successfully!', 'success');

    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      showToastMessage('Failed to generate SWOT analysis. Please try again.', 'error');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const generateCustomerSegmentationAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      showToastMessage('Generating your customer segmentation analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
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
        await saveAnalysisAsPhaseResult(result.customerSegmentation, 'customerSegmentation');

        if (onCustomerSegmentationGenerated) {
          onCustomerSegmentationGenerated(result.customerSegmentation);
        }

        showToastMessage('📊 Customer segmentation analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from customer segmentation API');
      }

    } catch (error) {
      console.error('Error generating customer segmentation analysis:', error);
      showToastMessage('Failed to generate customer segmentation analysis. Please try again.', 'error');
    }
  };

  const generatePurchaseCriteriaAnalysis = async () => {
    if (!isInitialPhaseCompleted()) {
      return;
    }

    try {
      showToastMessage('Generating your purchase criteria analysis...', 'info');

      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
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
        await saveAnalysisAsPhaseResult(result.purchaseCriteria, 'purchaseCriteria');

        if (onPurchaseCriteriaGenerated) {
          onPurchaseCriteriaGenerated(result.purchaseCriteria);
        }

        showToastMessage('📊 Purchase criteria analysis generated successfully!', 'success');
      } else {
        throw new Error('Invalid response structure from purchase criteria API');
      }

    } catch (error) {
      console.error('Error generating purchase criteria analysis:', error);
      showToastMessage('Failed to generate purchase criteria analysis. Please try again.', 'error');
    }
  };

  const saveAnalysisAsPhaseResult = async (analysisData, analysisType = 'swot') => {
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
          message_text: `Analysis generated: ${analysisType}`,
          question_id: null,
          metadata: {
            analysisType: analysisType,
            analysisData: analysisData,
            isAnalysisGeneration: true,
            phase: 'initial'
          }
        })
      });

      if (response.ok) {
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

  // NEW: Handle phase validation followup
  const handlePhaseValidationFollowup = async () => {
    if (!phaseValidationPending) return;

    const answer = currentInput.trim();
    setCurrentInput('');

    // Add user message to chat
    await addMessage('user', answer, {
      questionId: `phase_validation_${phaseValidationAttempts + 1}`,
      phase: PHASES.INITIAL,
      isPhaseValidation: true
    });

    const newAttemptCount = phaseValidationAttempts + 1;
    setPhaseValidationAttempts(newAttemptCount);

    // If we've reached 2 attempts, proceed with analysis generation
    if (newAttemptCount >= 2) {
      setPhaseValidationPending(null);
      setPhaseValidationAttempts(0);
      
      showToastMessage('🎉 Initial phase completed! Generating analysis...', 'success');
      
      // Generate all analyses
      await Promise.all([
        generateSWOTAnalysis(),
        generateCustomerSegmentationAnalysis(),
        generatePurchaseCriteriaAnalysis(),
        generateLoyaltyNPSAnalysis(),
        generateChannelHeatmapAnalysis(),
        generateCapabilityHeatmapAnalysis()
      ]);
      
      await moveToNextQuestion();
      return;
    }

    // Validate again with ML
    const mlValidation = await validateAllAnswersWithML();

    if (mlValidation.valid) {
      // Validation passed, complete phase
      setPhaseValidationPending(null);
      setPhaseValidationAttempts(0);
      
      showToastMessage('🎉 Initial phase completed! Generating analysis...', 'success');
      
      // Generate all analyses
      await Promise.all([
        generateSWOTAnalysis(),
        generateCustomerSegmentationAnalysis(),
        generatePurchaseCriteriaAnalysis(),
        generateLoyaltyNPSAnalysis(),
        generateChannelHeatmapAnalysis(),
        generateCapabilityHeatmapAnalysis()
      ]);
      
      await moveToNextQuestion();
    } else {
      // Still needs more details
      const followupQuestion = mlValidation.feedback || 'Could you provide more specific details about your business to complete the initial analysis?';

      await addMessage('bot', followupQuestion, {
        questionId: `phase_validation_${newAttemptCount + 1}`,
        phase: PHASES.INITIAL,
        severity: 'mandatory',
        isPhaseValidation: true
      });

      showToastMessage(`Please provide more details (${newAttemptCount}/2 attempts)`, 'info');
    }
  };

  const handleSubmit = async () => {
    if (!currentInput.trim()) return;

    const answer = currentInput.trim();
    setCurrentInput('');

    // Handle phase validation followup
    if (phaseValidationPending) {
      await handlePhaseValidationFollowup();
      return;
    }

    // Handle regular follow-up answers
    if (pendingValidation) {
      await addMessage('user', answer, {
        questionId: pendingValidation.questionId,
        phase: pendingValidation.phase,
        isFollowUp: true
      });

      try {
        const result = await saveAnswer(
          pendingValidation.questionId,
          pendingValidation.followupQuestion,
          answer,
          true,
          pendingValidation.progressId
        );

        const newAttemptCount = followupAttempts + 1;
        setFollowupAttempts(newAttemptCount);

        if (newAttemptCount >= 2) {
          setPendingValidation(null);
          setFollowupAttempts(0);
          await moveToNextQuestion();
          return;
        }

        setIsValidatingAnswer(true);
        const mlValidation = await validateAnswerWithML(pendingValidation.followupQuestion, answer);
        setIsValidatingAnswer(false);

        if (mlValidation.valid) {
          setPendingValidation(null);
          setFollowupAttempts(0);
          await moveToNextQuestion();
        } else {
          const newFollowupQuestion = mlValidation.feedback || 'Could you provide more specific details?';

          await addMessage('bot', newFollowupQuestion, {
            questionId: pendingValidation.questionId,
            phase: pendingValidation.phase,
            severity: pendingValidation.severity,
            isFollowUp: true
          });

          setPendingValidation(prev => ({
            ...prev,
            followupQuestion: newFollowupQuestion
          }));

          showToastMessage(`Please provide more details (${newAttemptCount}/2 attempts)`, 'info');
        }

      } catch (error) {
        showToastMessage('Failed to save follow-up answer. Please try again.', 'error');
        setIsValidatingAnswer(false);
      }

      return;
    }

    // Handle main question answer
    if (!nextQuestion || !nextQuestion._id) {
      console.error('🚫 nextQuestion is missing or incomplete:', nextQuestion);
      showToastMessage('Unable to submit answer: Question is missing', 'error');
      return;
    }

    const questionId = nextQuestion._id;
    const questionText = nextQuestion.question_text;

    await addMessage('user', answer, {
      questionId,
      phase: nextQuestion.phase
    });

    try {
      const result = await saveAnswer(
        questionId,
        questionText,
        answer,
        false,
        null
      );

      setIsValidatingAnswer(true);
      const mlValidation = await validateAnswerWithML(questionText, answer);
      setIsValidatingAnswer(false);

      if (!mlValidation.valid && mlValidation.feedback) {
        const followupQuestion = mlValidation.feedback || 'Could you provide more details about this?';

        await addMessage('bot', followupQuestion, {
          questionId,
          phase: nextQuestion.phase,
          severity: nextQuestion.severity,
          isFollowUp: true
        });

        setPendingValidation({
          questionId,
          originalQuestionText: questionText,
          followupQuestion: followupQuestion,
          progressId: result.progress_id,
          phase: nextQuestion.phase,
          severity: nextQuestion.severity
        });

        setFollowupAttempts(0);
      } else {
        // Check if this was the last question in initial phase
        const isInitialPhaseNowComplete = checkInitialPhaseCompletedWithData({
          ...userAnswers,
          [questionId]: answer
        });

        if (isInitialPhaseNowComplete && nextQuestion.phase === PHASES.INITIAL) {
          // NEW: Trigger analyze-all validation
          const phaseValidation = await validateAllAnswersWithML();
          
          if (!phaseValidation.valid && phaseValidation.feedback) {
            // Start phase validation process
            const phaseFollowupQuestion = phaseValidation.feedback || 'To complete the initial analysis, could you provide more comprehensive details about your business?';

            await addMessage('bot', phaseFollowupQuestion, {
              questionId: `phase_validation_1`,
              phase: PHASES.INITIAL,
              severity: 'mandatory',
              isPhaseValidation: true
            });

            setPhaseValidationPending(true);
            setPhaseValidationAttempts(0);
            showToastMessage('Please provide additional details to complete the initial phase analysis.', 'info');
            return;
          } else {
            // Phase validation passed, generate analysis
            showToastMessage('🎉 Initial phase completed! Generating analysis...', 'success');
            
            await Promise.all([
              generateSWOTAnalysis(),
              generateCustomerSegmentationAnalysis(),
              generatePurchaseCriteriaAnalysis(),
              generateLoyaltyNPSAnalysis(),
              generateChannelHeatmapAnalysis(),
              generateCapabilityHeatmapAnalysis()
            ]);
          }
        }

        await moveToNextQuestion();
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showToastMessage(error.message || 'Failed to submit your answer', 'error');
    }
  };

  // Move to next question
  const moveToNextQuestion = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user/latest-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        setCurrentProgress(data.progress);
        setNextQuestion(data.next_question);

        if (data.user_answers && Object.keys(data.user_answers).length > 0) {
          Object.entries(data.user_answers).forEach(([questionId, answer]) => {
            if (onNewAnswer) {
              onNewAnswer(questionId, answer);
            }
          });
        }

        if (data.next_question) {
          await addMessage('bot', data.next_question.question_text, {
            questionId: data.next_question._id,
            phase: data.next_question.phase,
            severity: data.next_question.severity
          });
        } else {
          showToastMessage('🎉 All questions completed!', 'success');

          const freshUserAnswers = data.user_answers || {};
          const isCompleted = checkInitialPhaseCompletedWithData(freshUserAnswers);

          if (isCompleted && !isGeneratingAnalysis) {
            await Promise.all([
              generateSWOTAnalysis(),
              generateCustomerSegmentationAnalysis(),
              generatePurchaseCriteriaAnalysis(),
              generateLoyaltyNPSAnalysis(),
              generateChannelHeatmapAnalysis(),
              generateCapabilityHeatmapAnalysis()
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading next question:', error);
      showToastMessage('Error loading next question. Please try again.', 'error');
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <div>Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      <div className="messages-container">
        {messages
          .filter((message) => message.type !== 'system')
          .map((message) => (
            <div key={message.id} className={`message-wrapper ${message.type}`}>
              {message.type === 'bot' && (
                <div className="bot-avatar">
                  <img src="/chat-bot.png" alt="Bot Avatar" />
                </div>
              )}

              <div className={`message-bubble ${message.type} ${
                message.metadata?.isFollowUp || message.isFollowUp ? 'follow-up' : ''
              } ${
                message.metadata?.isPhaseValidation || message.isPhaseValidation ? 'phase-validation' : ''
              }`}>
                <div className="message-text">
                  {message.text}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.type === 'bot' && message.phase && (
                    <span style={{ fontStyle: 'italic' }}>
                      - {message.phase} phase
                      {(message.metadata?.isFollowUp || message.isFollowUp) && ' followup'}
                      {(message.metadata?.isPhaseValidation || message.isPhaseValidation) && ' validation'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

        {(isGeneratingAnalysis || isSaving || isValidatingAnswer || isValidatingPhase) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isSaving && 'Saving your answer...'}
              {isValidatingAnswer && 'Validating your answer...'}
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
                ? "Please provide more comprehensive details about your business..."
                : pendingValidation
                ? "Please provide more details..."
                : nextQuestion
                  ? t("typeYourAnswer")
                  : "All questions completed!"
            }
            disabled={!nextQuestion && !pendingValidation && !phaseValidationPending || isSaving || isValidatingAnswer || isValidatingPhase}
            className="message-input"
            rows="2"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentInput.trim() || (!nextQuestion && !pendingValidation && !phaseValidationPending) || isSaving || isValidatingAnswer || isValidatingPhase}
            className={`send-button ${(!currentInput.trim() || (!nextQuestion && !pendingValidation && !phaseValidationPending) || isSaving || isValidatingAnswer || isValidatingPhase) ? 'disabled' : ''}`}
          >
            {(isSaving || isValidatingAnswer || isValidatingPhase) ? <Loader size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </div>

        <div className="status-text">
          {phaseValidationPending ? (
            <span>
              Phase validation required • Please provide comprehensive details ({phaseValidationAttempts + 1}/2 attempts)
              {(isSaving || isValidatingPhase) && ' • Processing...'}
            </span>
          ) : pendingValidation ? (
            <span>
              Follow-up required • Please provide more details ({followupAttempts + 1}/2 attempts)
              {(isSaving || isValidatingAnswer) && ' • Processing...'}
            </span>
          ) : nextQuestion ? (
            <span>
              {t("question")} {(currentProgress?.answered_questions || 0) + 1} {t("of")} {currentProgress?.total_questions || 0} •
              {t("phase")}: {nextQuestion.phase.toUpperCase()}
              {isSaving && ` • Saving...`}
              {isValidatingAnswer && ` • Validating...`}
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