import React, { useState, useEffect, useRef } from "react";
import { Send, Loader, SkipForward } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";

const ChatComponent = ({
  selectedBusinessId,
  userAnswers = {},
  onNewAnswer,
  onQuestionsLoaded,
  onQuestionCompleted,
  onPhaseCompleted
}) => {
  // Core state
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [nextQuestion, setNextQuestion] = useState(null);

  // Follow-up state
  const [pendingValidation, setPendingValidation] = useState(null);
  const [followupAttempts, setFollowupAttempts] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingAnswer, setIsValidatingAnswer] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const processingAnswer = useRef(false);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    loadQuestionsAndConversations();
  }, [selectedBusinessId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial data
  const loadQuestionsAndConversations = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      // Load questions
      const questionsResponse = await fetch(`${API_BASE_URL}/api/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!questionsResponse.ok) throw new Error('Failed to load questions');

      const questionsData = await questionsResponse.json();
      const availableQuestions = questionsData.questions || [];

      setQuestions(availableQuestions);
      onQuestionsLoaded?.(availableQuestions);

      // Load existing conversations
      const conversationUrl = `${API_BASE_URL}/api/conversations${selectedBusinessId ? `?business_id=${selectedBusinessId}` : ''}`;

      const conversationsResponse = await fetch(conversationUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        if (conversationsData.conversations?.length > 0) {
          processConversationsData(conversationsData, availableQuestions);
        } else {
          startFreshConversation(availableQuestions);
        }
      } else {
        startFreshConversation(availableQuestions);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showToastMessage('Error loading data. Please refresh the page.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Start fresh conversation with first question
  const startFreshConversation = (availableQuestions) => {
    const firstQuestion = findNextUnansweredQuestion(availableQuestions, new Set());
    if (firstQuestion) {
      setNextQuestion(firstQuestion);
      addMessageLocally('bot', firstQuestion.question_text, {
        questionId: firstQuestion._id,
        phase: firstQuestion.phase,
        severity: firstQuestion.severity
      });
    }
  };

  // Process existing conversations data
  const processConversationsData = (conversationsData, availableQuestions) => {
    const chatMessages = [];
    const completedQuestionIds = new Set();
    const askedQuestions = new Set();

    // Create question lookup map
    const questionMap = availableQuestions.reduce((map, q) => {
      map[q._id] = q;
      return map;
    }, {});

    // Process each conversation
    conversationsData.conversations.forEach((conversation) => {
      const questionId = conversation.question_id;
      const question = questionMap[questionId];

      if (!question) return;

      // Track completed and skipped questions
      if (conversation.completion_status === 'complete' || conversation.completion_status === 'skipped') {
        completedQuestionIds.add(questionId);

        // Handle skipped questions
        if (conversation.completion_status === 'skipped') {
          onNewAnswer?.(questionId, '[Question Skipped]');
        } else {
          // Get all answers for completed questions and concatenate them
          const allAnswers = conversation.conversation_flow
            .filter(item => item.type === 'answer')
            .map(a => a.text.trim())
            .filter(text => text.length > 0 && text !== '[Question Skipped]');

          if (allAnswers.length > 0) {
            const concatenatedAnswer = allAnswers.join('. ');
            onNewAnswer?.(questionId, concatenatedAnswer);
          }
        }
      }

      // Add main question if there are interactions or if it's skipped
      if (conversation.conversation_flow.length > 0 || conversation.is_skipped) {
        chatMessages.push({
          id: `${questionId}_main_question`,
          type: 'bot',
          text: question.question_text,
          timestamp: new Date(conversation.conversation_flow[0]?.timestamp || new Date()),
          questionId: questionId,
          phase: conversation.phase,
          isFollowUp: false
        });
        askedQuestions.add(questionId);

        // If question is skipped, add the skip message
        if (conversation.is_skipped) {
          chatMessages.push({
            id: `${questionId}_skipped`,
            type: 'user',
            text: '[Question Skipped]',
            timestamp: new Date(conversation.last_updated || new Date()),
            questionId: questionId,
            phase: conversation.phase,
            isFollowUp: false,
            isSkipped: true
          });
        }
      }

      // Process conversation flow for non-skipped questions
      if (!conversation.is_skipped) {
        let followupQuestionCount = 0;

        conversation.conversation_flow.forEach((interaction, index) => {
          const messageId = `${questionId}_${interaction.timestamp}_${index}`;

          if (interaction.type === 'question') {
            // Follow-up question
            followupQuestionCount++;
            chatMessages.push({
              id: messageId,
              type: 'bot',
              text: interaction.text,
              timestamp: new Date(interaction.timestamp),
              questionId: questionId,
              phase: conversation.phase,
              isFollowUp: true
            });
          } else if (interaction.type === 'answer') {
            // Answer (main or follow-up)
            const isFollowupAnswer = followupQuestionCount > 0;

            chatMessages.push({
              id: messageId,
              type: 'user',
              text: interaction.text,
              timestamp: new Date(interaction.timestamp),
              questionId: questionId,
              phase: conversation.phase,
              isFollowUp: isFollowupAnswer
            });
          }
        });
      }
    });

    // Sort messages chronologically and update state
    chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setMessages(chatMessages);
    setCompletedQuestions(completedQuestionIds);

    // Determine current state
    const lastConversation = conversationsData.conversations
      .filter(conv => conv.conversation_flow.length > 0 || conv.is_skipped)
      .sort((a, b) => new Date(b.last_updated || b.created_at) - new Date(a.last_updated || a.created_at))[0];

    if (lastConversation?.completion_status === 'incomplete' && !lastConversation.is_skipped) {
      handleIncompleteConversation(lastConversation, questionMap, availableQuestions, completedQuestionIds, askedQuestions);
    } else {
      showNextQuestion(availableQuestions, completedQuestionIds, askedQuestions);
    }
  };

  // Handle incomplete conversation state
  const handleIncompleteConversation = (lastConversation, questionMap, availableQuestions, completedQuestionIds, askedQuestions) => {
    const lastFlow = lastConversation.conversation_flow;
    const lastInteraction = lastFlow[lastFlow.length - 1];

    if (lastInteraction?.type === 'question' && lastInteraction.is_followup) {
      // Resume follow-up state
      const questionId = lastConversation.question_id;
      const question = questionMap[questionId];

      if (question) {
        const followupCount = lastFlow.filter((interaction, index) =>
          interaction.type === 'answer' && index > 0
        ).length;

        setPendingValidation({
          questionId,
          originalQuestionText: question.question_text,
          followupQuestion: lastInteraction.text,
          phase: question.phase,
          severity: question.severity
        });
        setFollowupAttempts(followupCount);
      }
    } else {
      showNextQuestion(availableQuestions, completedQuestionIds, askedQuestions);
    }
  };

  // Show next unanswered question
  const showNextQuestion = (availableQuestions, completedQuestionIds, askedQuestions) => {
    const nextQuestion = findNextUnansweredQuestion(availableQuestions, completedQuestionIds);
    setNextQuestion(nextQuestion);

    if (nextQuestion && !askedQuestions.has(nextQuestion._id)) {
      addMessageLocally('bot', nextQuestion.question_text, {
        questionId: nextQuestion._id,
        phase: nextQuestion.phase,
        severity: nextQuestion.severity
      });
    }
  };

  // Find next unanswered question
  const findNextUnansweredQuestion = (availableQuestions, completedQuestionIds) => {
    const sortedQuestions = [...availableQuestions].sort((a, b) => a.order - b.order);
    return sortedQuestions.find(question => !completedQuestionIds.has(question._id));
  };

  // Add message to local state
  const addMessageLocally = (type, text, metadata = {}) => {
    // Prevent duplicates
    const isDuplicate = messages.some(msg =>
      msg.type === type &&
      msg.text === text &&
      msg.questionId === metadata.questionId &&
      msg.isFollowUp === (metadata.isFollowUp || false)
    );

    if (isDuplicate) return null;

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

  // API calls
  const validateAnswerWithML = async (questionText, answerText) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/analyze`, {
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

      return response.ok ? await response.json() : { valid: true, feedback: null };
    } catch (error) {
      return { valid: true, feedback: null };
    }
  };

  const saveAnswer = async (questionId, answerText, isComplete = false) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          answer_text: answerText,
          business_id: selectedBusinessId,
          is_complete: isComplete,
          metadata: { timestamp: new Date().toISOString() }
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Only call onNewAnswer and onQuestionCompleted when question is complete
        if (isComplete) {
          // Load the complete conversation to get all answers for this question
          const conversationResponse = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (conversationResponse.ok) {
            const conversationData = await conversationResponse.json();
            const questionConversation = conversationData.conversations.find(conv => conv.question_id === questionId);

            if (questionConversation) {
              // Get all answers for this question and concatenate them
              const allAnswers = questionConversation.conversation_flow
                .filter(item => item.type === 'answer')
                .map(a => a.text.trim())
                .filter(text => text.length > 0);

              const concatenatedAnswer = allAnswers.join('. ');
              onNewAnswer?.(questionId, concatenatedAnswer);
            }
          } else {
            // Fallback: just use the current answer
            onNewAnswer?.(questionId, answerText);
          }

          // Notify parent about completed question
          if (onQuestionCompleted) { 
            await onQuestionCompleted(questionId);
          }

          const newCompletedSet = new Set([...completedQuestions, questionId]);
          setCompletedQuestions(newCompletedSet);
          return { ...result, updatedCompleted: newCompletedSet, wasCompleted: true };
        }

        return { ...result, wasCompleted: false };
      } else {
        throw new Error(result.error || 'Failed to save answer');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Phase constants
  const PHASES = {
    INITIAL: "initial",
    ESSENTIAL: "essential",
    GOOD: "good",
    EXCELLENT: "excellent",
  };

  // Updated skip function to use the new API endpoint
  const saveSkippedQuestion = async (questionId) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations/skip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          business_id: selectedBusinessId
        })
      });

      const result = await response.json();
      if (response.ok) {
        // Notify parent about skipped question
        onNewAnswer?.(questionId, '[Question Skipped]');
        if (onQuestionCompleted) { 
          await onQuestionCompleted(questionId);
        }

        const newCompletedSet = new Set([...completedQuestions, questionId]);
        setCompletedQuestions(newCompletedSet);
        return { ...result, updatedCompleted: newCompletedSet, wasCompleted: true };
      } else {
        throw new Error(result.error || 'Failed to skip question');
      }
    } catch (error) {
      throw error;
    }
  };

  const saveFollowupQuestion = async (questionId, followupText) => {
    try {
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/api/conversations/followup-question`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          followup_question_text: followupText,
          business_id: selectedBusinessId,
          metadata: { generated_by_ml: true }
        })
      });
    } catch (error) {
      console.error('Failed to save followup question:', error);
    }
  };

  // Move to next question after completion
  const moveToNextQuestion = async (updatedCompletedSet = null) => {
    try {
      const currentCompleted = updatedCompletedSet || completedQuestions;
      const nextQuestionCandidate = findNextUnansweredQuestion(questions, currentCompleted);

      setNextQuestion(nextQuestionCandidate);

      if (nextQuestionCandidate) {
        addMessageLocally('bot', nextQuestionCandidate.question_text, {
          questionId: nextQuestionCandidate._id,
          phase: nextQuestionCandidate.phase,
          severity: nextQuestionCandidate.severity
        });
      } else {
        showToastMessage('🎉 All questions completed!', 'success');
      }
    } catch (error) {
      console.error('Error in moveToNextQuestion:', error);
      showToastMessage('Error loading next question. Please try again.', 'error');
    }
  };

  // Handle skip functionality
  const handleSkip = async () => {
    if (isSkipping || (!nextQuestion && !pendingValidation)) return;

    try {
      setIsSkipping(true);

      if (pendingValidation) {
        // Skip follow-up question
        addMessageLocally('user', '[Question Skipped]', {
          questionId: pendingValidation.questionId,
          phase: pendingValidation.phase,
          isFollowUp: true,
          isSkipped: true
        });

        const saveResult = await saveSkippedQuestion(pendingValidation.questionId);

        setPendingValidation(null);
        setFollowupAttempts(0);

        await moveToNextQuestion(saveResult.updatedCompleted);
        showToastMessage('Question skipped', 'info');
      } else if (nextQuestion) {
        // Skip main question
        addMessageLocally('user', '[Question Skipped]', {
          questionId: nextQuestion._id,
          phase: nextQuestion.phase,
          isSkipped: true
        });

        const saveResult = await saveSkippedQuestion(nextQuestion._id);
        await moveToNextQuestion(saveResult.updatedCompleted);
        showToastMessage('Question skipped', 'info');
      }
    } catch (error) {
      console.error('Error skipping question:', error);
      showToastMessage('Failed to skip question. Please try again.', 'error');
    } finally {
      setIsSkipping(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentInput.trim() || processingAnswer.current) return;

    processingAnswer.current = true;
    const answer = currentInput.trim();
    setCurrentInput('');

    try {
      // Handle follow-up answer
      if (pendingValidation) {
        await handleFollowupAnswer(answer);
        return;
      }

      // Handle main question answer
      await handleMainAnswer(answer);

    } finally {
      processingAnswer.current = false;
    }
  };

  const handleFollowupAnswer = async (answer) => {
    addMessageLocally('user', answer, {
      questionId: pendingValidation.questionId,
      phase: pendingValidation.phase,
      isFollowUp: true
    });

    try {
      setIsValidatingAnswer(true);
      const mlValidation = await validateAnswerWithML(pendingValidation.followupQuestion, answer);
      setIsValidatingAnswer(false);

      const newAttemptCount = followupAttempts + 1;
      setFollowupAttempts(newAttemptCount);
      const shouldComplete = mlValidation.valid || newAttemptCount >= 2;

      const saveResult = await saveAnswer(pendingValidation.questionId, answer, shouldComplete);

      if (shouldComplete) {
        setPendingValidation(null);
        setFollowupAttempts(0);
        await moveToNextQuestion(saveResult.updatedCompleted);
      } else {
        // Continue with more follow-up questions
        const newFollowupQuestion = mlValidation.feedback;

        addMessageLocally('bot', newFollowupQuestion, {
          questionId: pendingValidation.questionId,
          phase: pendingValidation.phase,
          severity: pendingValidation.severity,
          isFollowUp: true
        });

        await saveFollowupQuestion(pendingValidation.questionId, newFollowupQuestion);

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
  };

  const handleMainAnswer = async (answer) => {
    if (!nextQuestion?._id) {
      showToastMessage('Unable to submit answer: Question is missing', 'error');
      return;
    }

    const questionId = nextQuestion._id;
    const questionText = nextQuestion.question_text; 

    addMessageLocally('user', answer, {
      questionId,
      phase: nextQuestion.phase
    });

    try {
      setIsValidatingAnswer(true);
      const mlValidation = await validateAnswerWithML(questionText, answer);
      setIsValidatingAnswer(false);

      if (!mlValidation.valid && mlValidation.feedback) {
        // Need follow-up
        await saveAnswer(questionId, answer, false);

        const followupQuestion = mlValidation.feedback;
        addMessageLocally('bot', followupQuestion, {
          questionId,
          phase: nextQuestion.phase,
          severity: nextQuestion.severity,
          isFollowUp: true
        });

        await saveFollowupQuestion(questionId, followupQuestion);

        setPendingValidation({
          questionId,
          originalQuestionText: questionText,
          followupQuestion,
          phase: nextQuestion.phase,
          severity: nextQuestion.severity
        });

        setFollowupAttempts(0);
      } else { 
        const saveResult = await saveAnswer(questionId, answer, true);

        await moveToNextQuestion(saveResult.updatedCompleted);
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to submit your answer', 'error');
    }
  };

  // Utility functions
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

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <div>Loading your progress...</div>
      </div>
    );
  }

  const isInputDisabled = (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping;

  const isSubmitDisabled = !currentInput.trim() ||
    (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping;

  const isSkipDisabled = (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping;

  const canShowSkipButton = (nextQuestion || pendingValidation) &&
    !isSaving &&
    !isValidatingAnswer &&
    !processingAnswer.current;

  return (
    <div className="chat-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      <div className="messages-container">
        {messages
          .filter(message => message.type !== 'system')
          .map(message => (
            <div key={message.id} className={`message-wrapper ${message.type}`}>
              {message.type === 'bot' && (
                <div className="bot-avatar">
                  <img src="/chat-bot.png" alt="Bot Avatar" />
                </div>
              )}

              <div className={`message-bubble ${message.type} ${message.isFollowUp ? 'follow-up' : ''} ${message.isSkipped ? 'skipped' : ''}`}>
                <div className="message-text">
                  {message.text}
                  {message.isSkipped && <span className="skip-indicator"></span>}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.type === 'bot' && message.phase && (
                    <span style={{ fontStyle: 'italic' }}>
                      - {message.phase} phase{message.isFollowUp && ' followup'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

        {(isSaving || isValidatingAnswer || isSkipping) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isSaving && 'Saving your answer...'}
              {isValidatingAnswer && 'Validating your answer...'}
              {isSkipping && 'Please Wait...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Skip Button in chat area */}
      {canShowSkipButton && (
        <button
          onClick={handleSkip}
          disabled={isSkipDisabled}
          className="floating-skip-button"
          title="Skip this question"
        >
          <SkipForward size={18} />
          <span className="skip-text">Skip</span>
        </button>
      )}

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
            disabled={isInputDisabled}
            className="message-input"
            rows="2"
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`send-button ${isSubmitDisabled ? 'disabled' : ''}`}
          >
            {(isSaving || isValidatingAnswer || processingAnswer.current) ?
              <Loader size={16} className="spinner" /> :
              <Send size={16} />
            }
          </button>
        </div>

        <div className="status-text">
          {pendingValidation ? (
            <span>
              Follow-up required • Please provide more details ({followupAttempts + 1}/2 attempts)
              {(isSaving || isValidatingAnswer || isSkipping) && ' • Processing...'}
            </span>
          ) : nextQuestion ? (
            <span>
              Question {completedQuestions.size + 1} of {questions.length} •
              Phase: {nextQuestion.phase.toUpperCase()}
              {isSaving && ` • Saving...`}
              {isValidatingAnswer && ` • Validating...`}
              {processingAnswer.current && ` • Processing...`}
              {isSkipping && ` • Skipping...`}
            </span>
          ) : (
            <span>All questions completed!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;