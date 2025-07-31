import React, { useState, useEffect, useRef } from "react";
import { Send, Loader } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";

const ChatComponent = ({
  userAnswers = {},
  onBusinessDataUpdate,
  onNewAnswer,
  onAnalysisGenerated,
  onCustomerSegmentationGenerated, // Add this prop
  onPurchaseCriteriaGenerated, // Add this prop
  onChannelHeatmapGenerated, // Add this prop
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
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [currentProgress, setCurrentProgress] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [followupAttempts, setFollowupAttempts] = useState(0);
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

  // Check if initial phase is completed
  const isInitialPhaseCompleted = () => {
    if (!questions || questions.length === 0) return false;

    const initialMandatoryQuestions = questions.filter(
      (q) => q.phase === PHASES.INITIAL && q.severity === "mandatory"
    );

    return initialMandatoryQuestions.every((q) => userAnswers[q.question_id]);
  };

  // Show session history in brief section - removed since we're using simplified approach
  const renderSessionHistory = () => {
    return null; // Removed complex session history for simplified approach
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    loadLatestProgress();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user's latest progress and chat history
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
        console.log('Loaded latest progress:', data);

        // Set questions and call parent callback
        setQuestions(data.available_questions || []);

        // Group questions by phase
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

        // Restore chat history
        const chatMessages = data.chat_history?.map(msg => ({
          id: `${msg.timestamp}_${Math.random()}`,
          type: msg.message_type,
          text: msg.message_text,
          timestamp: new Date(msg.timestamp),
          questionId: msg.question_id,
          metadata: msg.metadata || {}
        })) || [];

        setMessages(chatMessages);
        setCurrentProgress(data.progress);
        setNextQuestion(data.next_question);

        // Update parent with user answers
        if (data.user_answers && Object.keys(data.user_answers).length > 0) {
          Object.entries(data.user_answers).forEach(([questionId, answer]) => {
            if (onNewAnswer) {
              onNewAnswer(parseInt(questionId), answer);
            }
          });
        }

        // If we have a next question and no recent bot message asking it, ask the next question
        if (data.next_question) {
          const lastBotMessage = chatMessages.filter(msg => msg.type === 'bot').pop();
          const shouldAskNext = !lastBotMessage ||
            lastBotMessage.questionId !== data.next_question.question_id;

          if (shouldAskNext) {
            await addMessage('bot', data.next_question.question_text, {
              questionId: data.next_question.question_id,
              phase: data.next_question.phase,
              severity: data.next_question.severity
            });
          }
        } else if (chatMessages.length === 0 && data.available_questions?.length > 0) {
          // No chat history, start with first question
          const firstQuestion = data.available_questions[0];
          await addMessage('bot', firstQuestion.question_text, {
            questionId: firstQuestion.question_id,
            phase: firstQuestion.phase,
            severity: firstQuestion.severity
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

  // Add message to chat and save to backend
  const addMessage = async (type, text, metadata = {}) => {
    const messageData = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      text,
      timestamp: new Date(),
      ...metadata
    };

    setMessages(prev => [...prev, messageData]);

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
            ...metadata
          }
        })
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  // Call ML API to validate answer
  const validateAnswerWithML = async (questionText, answerText) => {
    try {
      console.log('🤖 Calling ML API for validation...');

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
        console.log('🤖 ML Analysis result:', {
          valid: mlValidation.valid,
          has_feedback: !!mlValidation.feedback,
          needs_followup: mlValidation.needs_followup
        });
        return mlValidation;
      } else {
        console.error('❌ ML API failed:', mlResponse.status, mlResponse.statusText);
        // Return default valid response if ML API fails
        return { valid: true, feedback: null, needs_followup: false };
      }
    } catch (error) {
      console.error('❌ ML API call error:', error.message);
      // Return default valid response if ML API fails
      return { valid: true, feedback: null, needs_followup: false };
    }
  };

  // Save user answer to backend (without ML analysis)
  const saveAnswer = async (questionId, questionText, answerText, isFollowup = false, followupParentId = null) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      console.log('Saving answer:', {
        question_id: questionId,
        question_text: questionText,
        answer_text: answerText,
        is_followup: isFollowup,
        followup_parent_id: followupParentId
      });

      const response = await fetch(`${API_BASE_URL}/api/user/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          question_text: questionText,
          answer_text: answerText,
          is_followup: isFollowup,
          followup_parent_id: followupParentId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Answer saved:', result);

        // Update parent component with the answer (only for main questions)
        if (onNewAnswer && !isFollowup) {
          onNewAnswer(questionId, answerText);
        }

        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save answer');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const generateChannelHeatmapAnalysis = async () => {
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping channel heatmap analysis generation');
      return;
    }

    try {
      showToastMessage('Generating your channel heatmap analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          // Clean and sanitize text to avoid encoding issues
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
        // Save the channel heatmap analysis as chat message
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

  // Add the generateCapabilityHeatmapAnalysis function to your ChatComponent
  const generateCapabilityHeatmapAnalysis = async () => {
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping capability heatmap analysis generation');
      return;
    }

    try {
      showToastMessage('Generating your capability heatmap analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          // Clean and sanitize text to avoid encoding issues
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
        // Save the capability heatmap analysis as chat message
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
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping loyalty NPS analysis generation');
      return;
    }

    try {
      showToastMessage('Generating your loyalty & NPS analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          // Clean and sanitize text to avoid encoding issues
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
        // Save the loyalty NPS analysis as chat message
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
  // Generate SWOT analysis - ONLY if initial phase is completed
  const generateSWOTAnalysis = async () => {
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping SWOT analysis generation');
      return;
    }

    try {
      setIsGeneratingAnalysis(true);
      showToastMessage('Generating your SWOT analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question.question_id]);
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

  // Generate Customer Segmentation analysis - ONLY if initial phase is completed
  const generateCustomerSegmentationAnalysis = async () => {
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping customer segmentation analysis generation');
      return;
    }

    try {
      showToastMessage('Generating your customer segmentation analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          // Clean and sanitize text to avoid encoding issues
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
        // Save the customer segmentation analysis as chat message
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

  // Generate Purchase Criteria analysis - ONLY if initial phase is completed
  const generatePurchaseCriteriaAnalysis = async () => {
    // Check if initial phase is completed before generating analysis
    if (!isInitialPhaseCompleted()) {
      console.log('🚫 Initial phase not completed yet, skipping purchase criteria analysis generation');
      return;
    }

    try {
      showToastMessage('Generating your purchase criteria analysis...', 'info');

      // Get all answered questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions.forEach(question => {
        if (userAnswers[question.question_id]) {
          // Clean and sanitize text to avoid encoding issues
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
        // Save the purchase criteria analysis as chat message
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

      // Use the simplified chat message save endpoint
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
        console.log(`📊 ${analysisType} analysis saved as chat message`);
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentInput.trim()) {
      return;
    }

    const answer = currentInput.trim();
    setCurrentInput('');

    // Handle followup questions differently
    if (pendingValidation) {
      console.log('Handling followup answer:', answer, 'Attempt:', followupAttempts + 1);

      // This is a followup answer
      await addMessage('user', answer, {
        questionId: pendingValidation.questionId,
        phase: pendingValidation.phase,
        isFollowUp: true
      });

      try {
        // Save followup answer to backend
        const result = await saveAnswer(
          pendingValidation.questionId,
          pendingValidation.followupQuestion,
          answer,
          true, // is_followup = true
          pendingValidation.progressId // followup_parent_id
        );

        console.log('Followup answer saved:', result);

        // Increment followup attempts
        const newAttemptCount = followupAttempts + 1;
        setFollowupAttempts(newAttemptCount);

        // If we've reached maximum attempts (2), move to next question regardless
        if (newAttemptCount >= 2) {
          console.log('Maximum followup attempts reached (2), moving to next question');
          setPendingValidation(null);
          setFollowupAttempts(0);
          await moveToNextQuestion();
          return;
        }

        // Validate the followup answer with ML API
        setIsValidatingAnswer(true);
        const mlValidation = await validateAnswerWithML(pendingValidation.questionText, answer);
        setIsValidatingAnswer(false);

        // Check if the followup answer is now valid
        if (mlValidation.valid) {
          console.log('Followup answer is valid, moving to next question');
          setPendingValidation(null);
          setFollowupAttempts(0);
          await moveToNextQuestion();
        } else {
          console.log('Followup answer still invalid, asking another followup');
          // Ask another followup question
          const followupQuestion = mlValidation.feedback || 'Could you provide more specific details?';

          await addMessage('bot', followupQuestion, {
            questionId: pendingValidation.questionId,
            phase: pendingValidation.phase,
            severity: pendingValidation.severity,
            isFollowUp: true
          });

          showToastMessage(`Please provide more details (${newAttemptCount}/2 attempts)`, 'info');
        }

      } catch (error) {
        showToastMessage('Failed to save followup answer. Please try again.', 'error');
        setIsValidatingAnswer(false);
      }
      return;
    }

    // This is a main question answer
    if (!nextQuestion) {
      console.log('No next question available');
      return;
    }

    const currentQuestion = nextQuestion;
    console.log('Handling main question answer:', { question: currentQuestion, answer });

    // Add user message to chat
    await addMessage('user', answer, {
      questionId: currentQuestion.question_id,
      phase: currentQuestion.phase
    });

    try {
      // First, save the answer to backend
      const result = await saveAnswer(
        currentQuestion.question_id,
        currentQuestion.question_text,
        answer,
        false, // is_followup = false
        null   // followup_parent_id = null
      );

      console.log('Answer saved:', result);

      // Then, validate with ML API (only for main questions)
      setIsValidatingAnswer(true);
      const mlValidation = await validateAnswerWithML(currentQuestion.question_text, answer);
      setIsValidatingAnswer(false);

      // Check if ML analysis indicates we need a followup question
      if (!mlValidation.valid && mlValidation.feedback) {
        console.log('ML analysis requires followup:', mlValidation);

        // ML analysis says we need more info - ask followup question
        const followupQuestion = mlValidation.feedback || 'Could you provide more details about this?';

        await addMessage('bot', followupQuestion, {
          questionId: currentQuestion.question_id,
          phase: currentQuestion.phase,
          severity: currentQuestion.severity,
          isFollowUp: true
        });

        // Set pending validation state and initialize attempt counter
        setPendingValidation({
          questionId: currentQuestion.question_id,
          questionText: currentQuestion.question_text,
          originalAnswer: answer,
          followupQuestion: followupQuestion,
          phase: currentQuestion.phase,
          progressId: result.progress_id
        });
        setFollowupAttempts(0); // Reset counter for new question

        showToastMessage('Please provide more details to complete your answer (1/2 attempts)', 'info');
        return;
      }

      console.log('Answer is valid, moving to next question');

      // Answer is valid, move to next question
      await moveToNextQuestion();

      // Check if we should generate analysis - ONLY after initial phase is completed
      if (isInitialPhaseCompleted()) {
        console.log('✅ Initial phase completed, triggering analysis generation');

        // Generate all analyses in parallel
        await Promise.all([
          generateSWOTAnalysis(),
          generateCustomerSegmentationAnalysis(),
          generatePurchaseCriteriaAnalysis(),
          generateLoyaltyNPSAnalysis(),
          generateChannelHeatmapAnalysis(), // Add this line
          generateCapabilityHeatmapAnalysis()
        ]);
      } else {
        console.log('⏳ Initial phase not yet completed, analysis generation will be triggered later');
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showToastMessage('Failed to save answer. Please try again.', 'error');
      setIsValidatingAnswer(false);
    }
  };

  // Move to next question
  const moveToNextQuestion = async () => {
    console.log('Moving to next question...');

    // Reload progress to get updated next question
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
        console.log('Updated progress:', data.progress);
        console.log('Next question:', data.next_question);

        setCurrentProgress(data.progress);
        setNextQuestion(data.next_question);

        // Update user answers in parent
        if (data.user_answers && Object.keys(data.user_answers).length > 0) {
          Object.entries(data.user_answers).forEach(([questionId, answer]) => {
            if (onNewAnswer) {
              onNewAnswer(parseInt(questionId), answer);
            }
          });
        }

        if (data.next_question) {
          await addMessage('bot', data.next_question.question_text, {
            questionId: data.next_question.question_id,
            phase: data.next_question.phase,
            severity: data.next_question.severity
          });
        } else {
          showToastMessage('🎉 All questions completed!', 'success');

          // Check if initial phase is completed and generate analysis if not already done
          if (isInitialPhaseCompleted() && !isGeneratingAnalysis) {
            console.log('✅ All questions completed and initial phase done, generating final analysis');

            // Generate all analyses
            await Promise.all([
              generateSWOTAnalysis(),
              generateCustomerSegmentationAnalysis(),
              generatePurchaseCriteriaAnalysis(),
              generateLoyaltyNPSAnalysis(),
              generateChannelHeatmapAnalysis(), // Add this line
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
          .filter((message) => message.type !== 'system') // Exclude system messages
          .map((message) => (
            <div key={message.id} className={`message-wrapper ${message.type}`}>
              {message.type === 'bot' && (
                <div className="bot-avatar">
                  <img src="/chat-bot.png" alt="Bot Avatar" />
                </div>
              )}

              <div className={`message-bubble ${message.type} ${message.metadata?.isFollowUp ? 'follow-up' : ''}`}>
                <div className="message-text">
                  {message.text}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.type === 'bot' && message.phase && (
                    <span style={{ fontStyle: 'italic' }}>
                      - {message.phase} phase
                      {message.metadata?.isFollowUp && ' followup'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}


        {(isGeneratingAnalysis || isSaving || isValidatingAnswer) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isSaving && 'Saving your answer...'}
              {isValidatingAnswer && 'Validating your answer...'}
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
              pendingValidation
                ? "Please provide more details..."
                : nextQuestion
                  ? t("typeYourAnswer")
                  : "All questions completed!"
            }
            disabled={!nextQuestion || isSaving || isValidatingAnswer}
            className="message-input"
            rows="2"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentInput.trim() || (!nextQuestion && !pendingValidation) || isSaving || isValidatingAnswer}
            className={`send-button ${(!currentInput.trim() || (!nextQuestion && !pendingValidation) || isSaving || isValidatingAnswer) ? 'disabled' : ''}`}
          >
            {(isSaving || isValidatingAnswer) ? <Loader size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </div>

        <div className="status-text">
          {pendingValidation ? (
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