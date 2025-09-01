import React, { useState, useEffect, useRef } from "react";
import { Send, Loader, SkipForward, Upload, FileText, Database } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';
import { detectTemplateType, validateAgainstTemplate, formatValidationResults } from '../utils/templateValidator';

const ChatComponent = ({
  selectedBusinessId,
  userAnswers = {},
  onNewAnswer,
  onQuestionsLoaded,
  onQuestionCompleted,
  onPhaseCompleted,
  onFileUploaded
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
  const [isValidating, setIsValidating] = useState(false);
  // File upload states
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);

  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const processingAnswer = useRef(false);
  const fileInputRef = useRef(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [businessUploadDecision, setBusinessUploadDecision] = useState({
    upload_decision_made: false,
    upload_decision: null
  });
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
  useEffect(() => {
    // Only run this effect after businessUploadDecision is loaded and we have questions
    if (questions.length > 0 && completedQuestions.size > 0) {
      const essentialQuestions = questions.filter(q => q.phase === 'essential');
      const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
      const isEssentialComplete = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

      // If essential is complete and we haven't made an upload decision AND no document has been uploaded
      if (isEssentialComplete &&
        !businessUploadDecision.upload_decision_made &&
        !hasUploadedDocument &&
        !nextQuestion &&
        businessUploadDecision.upload_decision !== 'upload') { // Add this check

        // Check if upload decision message is already shown
        const hasUploadDecisionMessage = messages.some(msg => msg.questionId === 'upload_option');
        if (!hasUploadDecisionMessage) {
          addMessageLocally('bot',
            'Great! You\'ve completed the Essential phase. Would you like to upload financial data for enhanced analysis, or skip and continue with the remaining questions?',
            {
              questionId: 'upload_option',
              phase: 'upload_decision',
              severity: 'optional',
              showUploadButtons: true
            }
          );
        }
      }
    }
  }, [questions, completedQuestions, businessUploadDecision, hasUploadedDocument, nextQuestion, messages]);

  // Check if user is in good phase
  const isInGoodPhase = () => {
    if (!nextQuestion) return false;
    return nextQuestion.phase === 'good';
  };

  // Check if good phase is unlocked (user has completed essential phase)
  const isGoodPhaseUnlocked = () => {
    const essentialQuestions = questions.filter(q => q.phase === 'essential');
    const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
    return essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
  };

  useEffect(() => {
    setShowFileUpload(isGoodPhaseUnlocked() && isInGoodPhase());
  }, [questions, completedQuestions, nextQuestion]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      showToastMessage('Please upload Excel (.xlsx, .xls) or CSV files only.', 'error');
      return;
    }

    try {
      setIsFileUploading(true);
      setIsValidating(true);

      // Use the new detection method
      const detection = await detectTemplateType(file);

      if (detection.confidence === 'none' || detection.score < 0.3) {
        const errorMessage = `Unable to identify template type. Please ensure your file is based on one of our template files.`;
        throw new Error(errorMessage);
      }

      const validation = await validateAgainstTemplate(file, detection.type);

      if (!validation.isValid) {
        let errorMessage = `Your file doesn't match the ${validation.templateName} format:\n\n`;
        validation.errors.forEach(error => errorMessage += `• ${error}\n`);
        throw new Error(errorMessage);
      }

      const validationResult = {
        templateType: detection.type,
        templateName: validation.templateName,
        validation: validation,
        confidence: detection.confidence,
        uploadMode: 'auto-detect'
      };

      setIsValidating(false);
      const dbResult = await saveFileToDatabase(file, validationResult);
      setUploadedFileForAnalysis(file);

      if (onFileUploaded) {
        onFileUploaded(file, {
          ...validationResult,
          dbResult: dbResult
        });
      }

      showToastMessage(
        `✅ File uploaded successfully! Detected as ${validation.templateName}.`,
        'success'
      );

    } catch (error) {
      console.error('File upload/validation error:', error);
      showToastMessage(error.message || 'Failed to process file. Please try again.', 'error');
    } finally {
      setIsFileUploading(false);
      setIsValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const loadQuestionsAndConversations = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
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
      await checkExistingDocument();
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

    // Check if essential phase is complete
    const essentialQuestions = availableQuestions.filter(q => q.phase === 'essential');
    const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestionIds.has(q._id));
    const isEssentialComplete = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

    // Determine current state
    const lastConversation = conversationsData.conversations
      .filter(conv => conv.conversation_flow.length > 0 || conv.is_skipped)
      .sort((a, b) => new Date(b.last_updated || b.created_at) - new Date(a.last_updated || a.created_at))[0];

    // Handle essential completion and upload decision logic
    if (isEssentialComplete && !businessUploadDecision.upload_decision_made && !hasUploadedDocument) {
      // Check if there's already an upload decision message in chat
      const hasUploadDecisionMessage = conversationsData?.document_info?.file_content_available ? true : false;

      if (!hasUploadDecisionMessage) {
        // Add upload decision message
        chatMessages.push({
          id: 'upload_decision_message',
          type: 'bot',
          text: 'Great! You\'ve completed the Essential phase. Would you like to upload financial data for enhanced analysis, or skip and continue with the remaining questions?',
          timestamp: new Date(),
          questionId: 'upload_option',
          phase: 'upload_decision',
          severity: 'optional',
          showUploadButtons: true
        });

        // Update messages with the new upload decision message
        setMessages([...chatMessages]);
        setNextQuestion(null);
        return;
      }
    }

    // If essential is complete and upload decision was made or document uploaded, continue to good phase
    if (isEssentialComplete && (businessUploadDecision.upload_decision === 'skip' || hasUploadedDocument)) {
      const goodQuestions = availableQuestions.filter(q => q.phase === 'good');
      if (goodQuestions.length > 0) {
        const firstGoodQuestion = goodQuestions.find(q => !completedQuestionIds.has(q._id));
        if (firstGoodQuestion && !askedQuestions.has(firstGoodQuestion._id)) {
          setNextQuestion(firstGoodQuestion);
          addMessageLocally('bot', firstGoodQuestion.question_text, {
            questionId: firstGoodQuestion._id,
            phase: firstGoodQuestion.phase,
            severity: firstGoodQuestion.severity
          });
          return;
        }
      }
    }

    // Handle incomplete conversation state
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
      msg.isFollowUp === (metadata.isFollowUp || false) &&
      !metadata.isFileUpload
    );

    if (isDuplicate && !metadata.isFileUpload) return null;

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

  const saveFileToDatabase = async (file, validationResult) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      if (!selectedBusinessId) {
        throw new Error('No business selected');
      }
      const formData = new FormData();
      formData.append('document', file);
      const templateComplexityMap = {
        'simplified': 'simple',
        'standard': 'medium',
        'detailed': 'medium'
      };
      const backendTemplateType = templateComplexityMap[validationResult.templateType] || 'simple';
      formData.append('template_type', backendTemplateType);
      formData.append('template_name', validationResult.templateName || '');
      formData.append('validation_confidence', validationResult.confidence || 'high');
      formData.append('upload_mode', validationResult.uploadMode || 'auto-detect');

      const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save file to database');
      }

      setHasUploadedDocument(true);
      setShowSuccessAlert(true);

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);

      return result;
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const checkExistingDocument = async () => {
    if (!selectedBusinessId) {
      setHasUploadedDocument(false);
      setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();

        const documentExists = result.has_document === true;
        setHasUploadedDocument(documentExists);
        const uploadDecisionMade = result.upload_decision_made === true;
        const uploadDecision = result.upload_decision || null;

        setBusinessUploadDecision({
          upload_decision_made: uploadDecisionMade,
          upload_decision: uploadDecision
        });

        if (documentExists && !showSuccessAlert) {
          setShowSuccessAlert(true);
          setTimeout(() => {
            setShowSuccessAlert(false);
          }, 5000);
        }
      } else {
        setHasUploadedDocument(false);
        setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
      }
    } catch (error) {
      console.error('Error checking existing document:', error);
      setHasUploadedDocument(false);
      setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
    }
  };

  useEffect(() => {
    checkExistingDocument();
  }, [selectedBusinessId]);

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

  const moveToNextQuestion = async (updatedCompletedSet = null) => {
    try {
      const currentCompleted = updatedCompletedSet || completedQuestions;
      const essentialQuestions = questions.filter(q => q.phase === 'essential');
      const completedEssentialQuestions = essentialQuestions.filter(q => currentCompleted.has(q._id));
      const justCompletedEssential = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

      if (justCompletedEssential &&
        !businessUploadDecision.upload_decision_made &&
        !hasUploadedDocument &&
        businessUploadDecision.upload_decision !== 'upload') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/upload-decision`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ decision: 'pending' })
          });

          if (response.ok) {
            setBusinessUploadDecision({
              upload_decision_made: false,
              upload_decision: 'pending'
            });
          }
        } catch (error) {
          console.error('Failed to initialize upload decision:', error);
        }
        addMessageLocally('bot',
          'Great! You\'ve completed the Essential phase. Would you like to upload financial data for enhanced analysis, or skip and continue with the remaining questions?',
          {
            questionId: 'upload_option',
            phase: 'upload_decision',
            severity: 'optional',
            showUploadButtons: true
          }
        );
        setNextQuestion(null);
        return;
      }
      if (businessUploadDecision.upload_decision === 'skip') {
        const advancedQuestions = questions.filter(q => q.phase === 'advanced');
        if (advancedQuestions.length > 0) {
          const firstAdvancedQuestion = advancedQuestions.find(q => !currentCompleted.has(q._id));
          if (firstAdvancedQuestion) {
            setNextQuestion(firstAdvancedQuestion);
            addMessageLocally('bot', firstAdvancedQuestion.question_text, {
              questionId: firstAdvancedQuestion._id,
              phase: firstAdvancedQuestion.phase,
              severity: firstAdvancedQuestion.severity
            });
            return;
          }
        } else {
          showToastMessage('All available questions completed!', 'success');
          return;
        }
      }

      if (businessUploadDecision.upload_decision === 'upload' || hasUploadedDocument) {
        const advancedQuestions = questions.filter(q => q.phase === 'advanced');
        if (advancedQuestions.length > 0) {
          const firstAdvancedQuestion = advancedQuestions.find(q => !currentCompleted.has(q._id));
          if (firstAdvancedQuestion) {
            setNextQuestion(firstAdvancedQuestion);
            addMessageLocally('bot', firstAdvancedQuestion.question_text, {
              questionId: firstAdvancedQuestion._id,
              phase: firstAdvancedQuestion.phase,
              severity: firstAdvancedQuestion.severity
            });
            return;
          }
        }
      }

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

  const handleUploadDecision = async (decision) => {
    if (decision === 'upload') {
      setShowTemplatesPopup(true);
    } else if (decision === 'skip') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/upload-decision`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ decision: 'skip' })
        });

        if (response.ok) {
          setBusinessUploadDecision({
            upload_decision_made: true,
            upload_decision: 'skip'
          });

          const advancedQuestions = questions.filter(q => q.phase === 'advanced');
          if (advancedQuestions.length > 0) {
            const firstAdvancedQuestion = advancedQuestions.find(q => !completedQuestions.has(q._id));
            if (firstAdvancedQuestion) {
              setNextQuestion(firstAdvancedQuestion);
              addMessageLocally('bot', firstAdvancedQuestion.question_text, {
                questionId: firstAdvancedQuestion._id,
                phase: firstAdvancedQuestion.phase,
                severity: firstAdvancedQuestion.severity
              });
            }
          } else {
            addMessageLocally('bot', 'All available questions have been completed!', {
              questionId: 'completion',
              phase: 'complete',
              severity: 'info'
            });
          }

          showToastMessage('Continuing to Advanced phase questions', 'info');
        }
      } catch (error) {
        showToastMessage('Failed to save decision', 'error');
      }
    }
  };

  const handleSkip = async () => {
    if (isSkipping || (!nextQuestion && !pendingValidation)) return;

    try {
      setIsSkipping(true);

      const essentialQuestions = questions.filter(q => q.phase === 'essential');
      const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
      const isEssentialComplete = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

      if (isEssentialComplete && !hasUploadedDocument && !nextQuestion && !businessUploadDecision.upload_decision_made) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/upload-decision`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ decision: 'skip' })
          });

          if (response.ok) {
            setBusinessUploadDecision({
              upload_decision_made: true,
              upload_decision: 'skip'
            });
            const advancedQuestions = questions.filter(q => q.phase === 'advanced');
            if (advancedQuestions.length > 0) {
              const firstAdvancedQuestion = advancedQuestions.find(q => !completedQuestions.has(q._id));
              if (firstAdvancedQuestion) {
                setNextQuestion(firstAdvancedQuestion);
                addMessageLocally('bot', firstAdvancedQuestion.question_text, {
                  questionId: firstAdvancedQuestion._id,
                  phase: firstAdvancedQuestion.phase,
                  severity: firstAdvancedQuestion.severity
                });
                showToastMessage('Proceeding to Advanced phase questions', 'info');
              }
            } else {
              showToastMessage('All available questions completed!', 'success');
            }
          }
        } catch (error) {
          showToastMessage('Failed to skip upload decision', 'error');
        }
        return;
      }
      if (pendingValidation) {
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
  const handleSubmit = async () => {
    if (!currentInput.trim() || processingAnswer.current) return;

    processingAnswer.current = true;
    const answer = currentInput.trim();
    setCurrentInput('');

    try {
      if (pendingValidation) {
        await handleFollowupAnswer(answer);
        return;
      }
      await handleMainAnswer(answer);

    } finally {
      processingAnswer.current = false;
    }
  };

  const handleFileUploadFromPopup = async (file, expectedTemplateType = null) => {
    try {
      setIsFileUploading(true);
      setIsValidating(true);

      addMessageLocally('user', `Uploaded file: ${file.name}`, {
        questionId: 'upload_option',
        phase: 'upload_decision',
        isFileUpload: true
      });

      let detectedTemplateType = null;
      let validationResult = null;

      if (expectedTemplateType) {
        const validation = await validateAgainstTemplate(file, expectedTemplateType);

        if (!validation.isValid) {
          let errorMessage = `File doesn't match the ${validation.templateName} template exactly:\n\n`;

          if (validation.details && validation.details.sheetComparison) {
            Object.entries(validation.details.sheetComparison).forEach(([sheetName, details]) => {
              if (details.missingColumns.length > 0) {
                errorMessage += `Sheet "${sheetName}":\n`;
                errorMessage += `  Missing columns: ${details.missingColumns.join(', ')}\n`;
              }
              if (details.mismatchedColumns.length > 0) {
                errorMessage += `Sheet "${sheetName}" column mismatches:\n`;
                details.mismatchedColumns.forEach(({ expected, found }) => {
                  errorMessage += `  "${found}" should be "${expected}"\n`;
                });
              }
            });
          }

          errorMessage += `\nTo fix this:\n`;
          errorMessage += `1. Download the ${validation.templateName} template again\n`;
          errorMessage += `2. Copy your data to the new template\n`;
          errorMessage += `3. Don't modify any sheet names or column headers\n`;
          errorMessage += `4. Upload the completed template`;

          throw new Error(errorMessage);
        }

        validationResult = {
          templateType: expectedTemplateType,
          templateName: validation.templateName,
          validation: validation,
          uploadMode: 'template-specific',
          confidence: 'high'
        };

      } else {
        // Auto-detect logic
        const detection = await detectTemplateType(file);

        if (detection.confidence === 'none' || detection.score < 0.3) {
          const errorMessage = `Unable to identify template type. Please use template-specific upload or ensure your file is based on one of our templates.`;
          throw new Error(errorMessage);
        }

        const validation = await validateAgainstTemplate(file, detection.type);

        if (!validation.isValid) {
          const errorMessage = `File validation failed: ${validation.errors.join(', ')}`;
          throw new Error(errorMessage);
        }

        validationResult = {
          templateType: detection.type,
          templateName: validation.templateName,
          validation: validation,
          confidence: detection.confidence,
          uploadMode: 'auto-detect'
        };
      }
      setIsValidating(false);
      const dbResult = await saveFileToDatabase(file, validationResult);
      setUploadedFileForAnalysis(file);
      setShowTemplatesPopup(false);

      if (onFileUploaded) {
        onFileUploaded(file, {
          ...validationResult,
          dbResult: dbResult
        });
      }
      try {
        await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/upload-decision`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ decision: 'upload' })
        });

        setBusinessUploadDecision({
          upload_decision_made: true,
          upload_decision: 'upload'
        });
      } catch (error) {
        console.error('Failed to save upload decision:', error);
      }

      if (onPhaseCompleted) {
        try {
          await onPhaseCompleted('good', completedQuestions);

          setTimeout(async () => {
            const advancedQuestions = questions.filter(q => q.phase === 'advanced');
            if (advancedQuestions.length > 0) {
              const firstAdvancedQuestion = advancedQuestions.find(q => !completedQuestions.has(q._id));
              if (firstAdvancedQuestion) {
                setNextQuestion(firstAdvancedQuestion);
                addMessageLocally('bot', firstAdvancedQuestion.question_text, {
                  questionId: firstAdvancedQuestion._id,
                  phase: firstAdvancedQuestion.phase,
                  severity: firstAdvancedQuestion.severity
                });
              }
            }
          }, 1000);

        } catch (phaseError) {
          console.error('Error generating good phase analysis:', phaseError);
          showToastMessage('File uploaded but analysis generation failed', 'warning');
        }
      }

      showToastMessage(
        `File uploaded successfully as ${validationResult.templateName}.`,
        'success'
      );

    } catch (error) {
      console.error('File upload error:', error);
      showToastMessage(error.message || 'Failed to process file. Please try again.', 'error');
    } finally {
      setIsFileUploading(false);
      setIsValidating(false);
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

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 5000);
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

  const isInputDisabled = (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping ||
    isFileUploading;

  const isSubmitDisabled = !currentInput.trim() ||
    (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping ||
    isFileUploading;

  const isSkipDisabled = (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping ||
    isFileUploading;

  const canShowSkipButton = (nextQuestion || pendingValidation) &&
    !isSaving &&
    !isValidatingAnswer &&
    !processingAnswer.current &&
    !isFileUploading;

  return (
    <div className="chat-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

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

                {/* Add upload decision buttons */}
                {message.showUploadButtons && !hasUploadedDocument && (
                  <div className="upload-decision-buttons" style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleUploadDecision('upload')}
                      disabled={isFileUploading}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Database size={16} />
                      Upload Financial Data
                    </button>
                    <button
                      onClick={() => handleUploadDecision('skip')}
                      disabled={isFileUploading}
                      style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Skip & Continue
                    </button>
                  </div>
                )}

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

        {(isSaving || isValidatingAnswer || isSkipping || isFileUploading) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
              {isSaving && 'Saving your answer...'}
              {isValidatingAnswer && 'Validating your answer...'}
              {isSkipping && 'Please Wait...'}
              {isFileUploading && 'Uploading file...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Skip Button */}
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
              {(isSaving || isValidatingAnswer || isSkipping || isFileUploading) && ' • Processing...'}
            </span>
          ) : nextQuestion ? (
            <span>
              Question {completedQuestions.size + 1} of {questions.length} •
              Phase: {nextQuestion.phase.toUpperCase()}

              {isSaving && ` • Saving...`}
              {isValidatingAnswer && ` • Validating...`}
              {processingAnswer.current && ` • Processing...`}
              {isSkipping && ` • Skipping...`}
              {isFileUploading && ` • Uploading...`}
            </span>
          ) : (
            <span>All questions completed!</span>
          )}
        </div>
      </div>
      <FinancialTemplatesPopup
        isOpen={showTemplatesPopup}
        onClose={() => setShowTemplatesPopup(false)}
        onFileUploaded={handleFileUploadFromPopup}
        isFileUploading={isFileUploading}
      />
      {showSuccessAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '24px' }}>🎉</span>
          Financial document uploaded successfully!
          <button
            onClick={() => setShowSuccessAlert(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              marginLeft: '8px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;