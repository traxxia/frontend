import React, { useState, useEffect, useRef } from "react";
import { Send, Loader, SkipForward, Upload, FileText, Database, BotMessageSquare, Sparkles, Zap, Brain } from "lucide-react";
import "../styles/ChatComponent.css";
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';
import { detectTemplateType, validateAgainstTemplate, formatValidationResults } from '../utils/templateValidator';
import { formatDate } from '../utils/dateUtils';

const ChatComponent = ({
  selectedBusinessId,
  userAnswers = {},
  onNewAnswer,
  onQuestionsLoaded,
  onQuestionCompleted,
  onPhaseCompleted,
  onFileUploaded,
  scrollToUploadCard = false,
  onScrollCompleted = null,
  isArchived = false
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [nextQuestion, setNextQuestion] = useState(null);
  const [pendingValidation, setPendingValidation] = useState(null);
  const [followupAttempts, setFollowupAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingAnswer, setIsValidatingAnswer] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const processingAnswer = useRef(false);
  const fileInputRef = useRef(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');
  const [uploadedFileForAnalysis, setUploadedFileForAnalysis] = useState(null);
  const [businessUploadDecision, setBusinessUploadDecision] = useState({
    upload_decision_made: false,
    upload_decision: null
  });
  const uploadedFileCardRef = useRef(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isViewer = userRole === "viewer";

  useEffect(() => {
    const handleConversationUpdate = async (event) => {
      const { questionId, businessId } = event.detail;
      await loadQuestionsAndConversations(businessId);
    };
    window.addEventListener("conversationUpdated", handleConversationUpdate);

    return () => window.removeEventListener("conversationUpdated", handleConversationUpdate);
  }, []);


  useEffect(() => {
    if (selectedBusinessId) {
      loadQuestionsAndConversations();
    }
  }, [selectedBusinessId]);


  useEffect(() => {
    if (uploadedFileForAnalysis) {
      setUploadedFileInfo({
        name: uploadedFileForAnalysis.name || 'Financial Document',
        size: uploadedFileForAnalysis.size,
        uploadDate: new Date().toLocaleDateString()
      });
    }
  }, [uploadedFileForAnalysis]);

  useEffect(() => {
    if (questions.length === 0 || Object.keys(userAnswers).length === 0) return;

    let newMessages = [...messages];
    let messageChanged = false;

    questions.forEach((q, index) => {
      const qId = q._id || q.question_id;
      const newAnswerText = userAnswers[qId];

      if (newAnswerText && newAnswerText.trim() && newAnswerText.trim() !== '[Question Skipped]') {
        const existingUserMessageIndex = newMessages.findIndex(
          (msg) =>
            msg.questionId === qId &&
            msg.type === "user" &&
            !msg.isFollowUp &&
            !msg.isSkipped &&
            !msg.isFileUpload
        );

        if (existingUserMessageIndex !== -1) {
          const hasFollowUpsInMessages = newMessages.some(
            (msg) => msg.questionId === qId && msg.isFollowUp
          );

          if (!hasFollowUpsInMessages && newMessages[existingUserMessageIndex].text !== newAnswerText) {
            newMessages[existingUserMessageIndex].text = newAnswerText;
            messageChanged = true;
          }
        } else {
          // Remove any skip indicator for this question if it now has an answer
          newMessages = newMessages.filter(
            (msg) =>
              !(
                msg.questionId === qId &&
                msg.type === "user" &&
                msg.isSkipped === true
              )
          );

          const relatedBotQuestion = [...newMessages].reverse().find(
            (msg) => msg.questionId === qId && msg.type === "bot" && !msg.isFollowUp
          );

          const newMsg = {
            id: `sync_${qId}_${Date.now()}`,
            type: "user",
            text: newAnswerText,
            timestamp: new Date(),
            questionId: qId,
            phase: q.phase,
            order: (q.order || 0) + index * 0.01 + 0.0001,
            isFollowUp: false,
            isSkipped: false,
          };

          if (relatedBotQuestion) {
            const botIndex = newMessages.indexOf(relatedBotQuestion);
            newMessages.splice(botIndex + 1, 0, newMsg);
          } else {
            newMessages.push(newMsg);
          }

          messageChanged = true;
        }
      }
    });

    if (messageChanged) {
      setMessages(newMessages);
    }
  }, [userAnswers, questions]);


  useEffect(() => {
    if (scrollToUploadCard && uploadedFileCardRef.current) {
      setTimeout(() => {
        if (uploadedFileCardRef.current) {
          uploadedFileCardRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          uploadedFileCardRef.current.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.3)';
          setTimeout(() => {
            if (uploadedFileCardRef.current) {
              uploadedFileCardRef.current.style.boxShadow = '';
            }
          }, 2000);

          if (onScrollCompleted) {
            onScrollCompleted();
          }
        }
      }, 500);
    }
  }, [scrollToUploadCard, uploadedFileInfo, hasUploadedDocument]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (questions.length > 0 && completedQuestions.size > 0) {
      const essentialQuestions = questions.filter(q => q.phase === 'essential');
      const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
      const isEssentialComplete = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
      if (isEssentialComplete &&
        !businessUploadDecision.upload_decision_made &&
        !hasUploadedDocument &&
        !nextQuestion) {
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

  const handleFileReplace = () => {
    setShowTemplatesPopup(true);
  };

  const isInGoodPhase = () => {
    if (!nextQuestion) return false;
    return nextQuestion.phase === 'good';
  };

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
      const conversationUrl = `${API_BASE_URL}/api/conversations${selectedBusinessId ? `?business_id=${selectedBusinessId}` : ''}`;

      const conversationsResponse = await fetch(conversationUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        const documentExists = conversationsData.document_info?.has_document === true;
        setHasUploadedDocument(documentExists);

        if (documentExists && conversationsData.document_info) {
          setUploadedFileInfo({
            name: conversationsData.document_info.filename || 'Financial Document',
            size: conversationsData.document_info.file_size || 0,
            uploadDate: conversationsData.document_info.upload_date ?
              new Date(conversationsData.document_info.upload_date).toLocaleDateString() :
              'Previously uploaded'
          });
        } else {
          setUploadedFileInfo(null);
        }
        const businessInfo = conversationsData.business_info;
        if (businessInfo) {
          const uploadDecisionMade = businessInfo.upload_decision_made === true;
          const uploadDecision = businessInfo.upload_decision || null;

          setBusinessUploadDecision({
            upload_decision_made: uploadDecisionMade,
            upload_decision: uploadDecision
          });
        } else {
          setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
        }

        if (conversationsData.conversations?.length > 0) {
          processConversationsData(conversationsData, availableQuestions);
        } else {
          startFreshConversation(availableQuestions);
        }
      } else {
        setHasUploadedDocument(false);
        setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
        setUploadedFileInfo(null);
        startFreshConversation(availableQuestions);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showToastMessage('Error loading data. Please refresh the page.', 'error');
      setHasUploadedDocument(false);
      setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
      setUploadedFileInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

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
    const initialMessages = [];
    const essentialMessages = [];
    const advancedMessages = [];
    const completedQuestionIds = new Set();
    const askedQuestions = new Set();
    const questionMap = availableQuestions.reduce((map, q) => {
      map[q._id] = q;
      return map;
    }, {});

    conversationsData.conversations.forEach((conversation, index) => {
      const questionId = conversation.question_id;
      const question = questionMap[questionId];

      if (!question) {
        return;
      }
      if (conversation.completion_status === "complete" || conversation.completion_status === "skipped") {
        completedQuestionIds.add(questionId);

        if (conversation.completion_status === "skipped") {
          onNewAnswer?.(questionId, "[Question Skipped]");
        } else {
          const allAnswers = conversation.conversation_flow
            .filter((item) => item.type === "answer")
            .map((a) => a.text.trim())
            .filter((text) => text.length > 0 && text !== "[Question Skipped]");
          if (allAnswers.length > 0) {
            onNewAnswer?.(questionId, allAnswers.join(". "));
          }
        }
      }
      let messagesArray;
      switch (question.phase) {
        case 'initial':
          messagesArray = initialMessages;
          break;
        case 'essential':
          messagesArray = essentialMessages;
          break;
        case 'advanced':
          messagesArray = advancedMessages;
          break;
        default:
          messagesArray = advancedMessages;
      }
      if (conversation.conversation_flow.length > 0 || conversation.is_skipped) {
        const mainMsg = {
          id: `${questionId}_main_question`,
          type: "bot",
          text: question.question_text,
          timestamp: new Date(
            conversation.conversation_flow[0]?.timestamp ||
            conversation.last_updated ||
            new Date()
          ),
          questionId,
          phase: question.phase,
          // Add a small offset based on conversation index to handle duplicate orders
          order: (question.order || 0) + index * 0.01,
          isFollowUp: false,
        };
        messagesArray.push(mainMsg);
        askedQuestions.add(questionId);
      }
      if (conversation.conversation_flow && conversation.conversation_flow.length > 0) {

        const sortedFlow = [...conversation.conversation_flow].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        sortedFlow.forEach((interaction, idx) => {
          // Deduplicate: If it's a bot question identical to the main question text, skip it
          if (interaction.type === "question" &&
            interaction.text?.trim() === question.question_text?.trim() &&
            !interaction.is_followup) {
            return;
          }

          const messageId = `${questionId}_${interaction.timestamp}_${idx}`;
          const msg = {
            id: messageId,
            type: interaction.type === "question" ? "bot" : "user",
            text: interaction.text,
            timestamp: new Date(interaction.timestamp),
            questionId,
            phase: question.phase,
            isFollowUp: !!interaction.is_followup,
            // Keep the interaction within high-level question order
            order: (question.order || 0) + index * 0.01 + (idx + 1) * 0.0001,
          };
          messagesArray.push(msg);
        });
      }

      if (conversation.is_skipped) {
        const lastFlowItem =
          conversation.conversation_flow?.[conversation.conversation_flow.length - 1] || null;
        const lastIsSkipAnswer =
          lastFlowItem &&
          lastFlowItem.type === "answer" &&
          lastFlowItem.text?.trim() === "[Question Skipped]";
        if (!lastIsSkipAnswer) {
          const skippedTs =
            conversation.last_updated ||
            lastFlowItem?.timestamp ||
            new Date().toISOString();
          const skipMsg = {
            id: `${questionId}_skipped`,
            type: "user",
            text: "[Question Skipped]",
            timestamp: new Date(skippedTs),
            questionId,
            phase: question.phase,
            order: (question.order || 0) + index * 0.01 + 0.0002,
            isFollowUp: false,
            isSkipped: true,
          };
          messagesArray.push(skipMsg);
        }
      }

    });

    const sortByOrderThenTime = (a, b) => {
      const orderA = a.order !== undefined ? a.order : 999999;
      const orderB = b.order !== undefined ? b.order : 999999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    };

    initialMessages.sort(sortByOrderThenTime);
    essentialMessages.sort(sortByOrderThenTime);
    advancedMessages.sort(sortByOrderThenTime);
    const essentialQuestions = availableQuestions.filter((q) => q.phase === "essential");
    const completedEssentialQuestions = essentialQuestions.filter((q) =>
      completedQuestionIds.has(q._id)
    );
    const isEssentialComplete =
      essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

    const businessInfo = conversationsData.business_info;
    const uploadDecisionMade = businessInfo?.upload_decision_made === true;
    const uploadDecision = businessInfo?.upload_decision || null;
    const hasDocument = conversationsData.document_info?.has_document === true;

    if (businessInfo) {
      setBusinessUploadDecision({
        upload_decision_made: uploadDecisionMade,
        upload_decision: uploadDecision,
      });
    }

    if (hasDocument) {
      setHasUploadedDocument(true);
      if (conversationsData.document_info) {
        setUploadedFileInfo({
          name: conversationsData.document_info.filename || "Financial Document",
          size: conversationsData.document_info.file_size || 0,
          uploadDate: conversationsData.document_info.upload_date
            ? new Date(conversationsData.document_info.upload_date).toLocaleDateString()
            : "Previously uploaded",
        });
      }
    } else {
      setHasUploadedDocument(false);
      setUploadedFileInfo(null);
    }
    let finalMessages = [...initialMessages, ...essentialMessages];
    const uploadDecisionMessages = [];

    if (isEssentialComplete) {
      if (!uploadDecisionMade && !hasDocument) {
        uploadDecisionMessages.push({
          id: "upload_decision_message",
          type: "bot",
          text: "Great! You've completed the Essential phase. Would you like to upload financial data for enhanced analysis, or skip and continue with the remaining questions?",
          timestamp: new Date(),
          questionId: "upload_option",
          phase: "upload_decision",
          order: 1000,
          severity: "optional",
          showUploadButtons: true,
        });
      } else if (uploadDecision === "skip" && !hasDocument) {
        uploadDecisionMessages.push({
          id: "upload_skipped_message",
          type: "bot",
          text: "Financial data upload skipped. You can continue with the remaining questions. If you change your mind later, you can still upload your financial data using the button below.",
          timestamp: new Date(),
          questionId: "upload_skipped",
          phase: "upload_decision",
          order: 1001,
          severity: "info",
          showUploadButton: true,
        });
      }
    }

    finalMessages = [...finalMessages, ...uploadDecisionMessages, ...advancedMessages];
    setMessages(finalMessages);
    setCompletedQuestions(completedQuestionIds);
    if (isEssentialComplete && !uploadDecisionMade && !hasDocument) {
      setNextQuestion(null);
      return;
    }

    if (isEssentialComplete && uploadDecisionMade) {
      const advancedQuestions = availableQuestions.filter((q) => q.phase === "advanced");
      if (advancedQuestions.length > 0) {
        const firstAdvancedQuestion = advancedQuestions.find((q) => !completedQuestionIds.has(q._id));
        if (firstAdvancedQuestion && !askedQuestions.has(firstAdvancedQuestion._id)) {
          setNextQuestion(firstAdvancedQuestion);
          addMessageLocally("bot", firstAdvancedQuestion.question_text, {
            questionId: firstAdvancedQuestion._id,
            phase: firstAdvancedQuestion.phase,
            severity: firstAdvancedQuestion.severity,
          });
          return;
        }
      }
    }
    const lastConversation = conversationsData.conversations
      .filter((conv) => conv.conversation_flow.length > 0 || conv.is_skipped)
      .sort((a, b) => new Date(b.last_updated || b.created_at) - new Date(a.last_updated || a.created_at))[0];


    if (lastConversation?.completion_status === "incomplete" && !lastConversation.is_skipped) {
      handleIncompleteConversation(
        lastConversation,
        questionMap,
        availableQuestions,
        completedQuestionIds,
        askedQuestions
      );
    } else {
      showNextQuestion(availableQuestions, completedQuestionIds, askedQuestions);
    }
  };

  const handleIncompleteConversation = (lastConversation, questionMap, availableQuestions, completedQuestionIds, askedQuestions) => {
    const lastFlow = lastConversation.conversation_flow;
    const lastInteraction = lastFlow[lastFlow.length - 1];

    if (lastInteraction?.type === 'question' && lastInteraction.is_followup) {
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

  const findNextUnansweredQuestion = (availableQuestions, completedQuestionIds) => {
    const sortedQuestions = [...availableQuestions].sort((a, b) => a.order - b.order);
    return sortedQuestions.find(question => !completedQuestionIds.has(question._id));
  };

  const addMessageLocally = (type, text, metadata = {}) => {
    const isFileUpload = !!metadata.isFileUpload;
    let isDuplicate = false;

    if (!isFileUpload) {
      if (!metadata.isFollowUp) {
        isDuplicate = messages.some(msg =>
          msg.type === type &&
          msg.text === text &&
          msg.questionId === metadata.questionId &&
          (msg.isFollowUp || false) === (metadata.isFollowUp || false)
        );
      } else {
        isDuplicate = false;
      }
    }

    // Attempt to determine order if not provided
    let order = metadata.order;
    if (order === undefined && metadata.questionId) {
      const qIndex = questions.findIndex(qu => qu._id === metadata.questionId);
      const q = questions[qIndex];
      if (q) {
        order = (q.order || 0) + qIndex * 0.01 + (type === 'user' ? 0.0001 : 0);
        if (metadata.isFollowUp) order += 0.0002;
      }
    }

    const newMessage = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      text,
      timestamp: new Date(),
      order,
      ...metadata
    };

    if (isDuplicate) return null;

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };


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
        if (isComplete) {
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
              const allAnswers = questionConversation.conversation_flow
                .filter(item => item.type === 'answer')
                .map(a => a.text.trim())
                .filter(text => text.length > 0);

              const concatenatedAnswer = allAnswers.join('. ');
              onNewAnswer?.(questionId, concatenatedAnswer);
            }
          } else {
            onNewAnswer?.(questionId, answerText);
          }
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to skip question');
      }
      let canonicalAnswer = '[Question Skipped]';
      if (selectedBusinessId) {
        try {
          const convResp = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (convResp.ok) {
            const convData = await convResp.json();
            const questionConversation = (convData.conversations || []).find(conv => conv.question_id === questionId);

            if (questionConversation) {
              const allAnswers = (questionConversation.conversation_flow || [])
                .filter(item => item.type === 'answer')
                .map(a => (a.text || '').trim())
                .filter(text => text.length > 0 && text !== '[Question Skipped]');

              if (allAnswers.length > 0) {
                canonicalAnswer = allAnswers.join('. ');
              } else {
                canonicalAnswer = '[Question Skipped]';
              }
            } else {
              canonicalAnswer = '[Question Skipped]';
            }
          } else {
            canonicalAnswer = '[Question Skipped]';
          }
        } catch (err) {
          console.error('Failed to re-fetch conversations after skip:', err);
          canonicalAnswer = '[Question Skipped]';
        }
      }

      onNewAnswer?.(questionId, canonicalAnswer);

      if (onQuestionCompleted) {
        try {
          await onQuestionCompleted(questionId);
        } catch (qcErr) {
          console.error('onQuestionCompleted handler failed:', qcErr);
        }
      }
      const newCompletedSet = new Set([...completedQuestions, questionId]);
      setCompletedQuestions(newCompletedSet);

      try {
        const question = questions.find(q => q._id === questionId);
        const questionPhase = question ? question.phase : null;
        if (onPhaseCompleted && questionPhase) {
          await onPhaseCompleted(questionPhase, new Set(newCompletedSet));
        }
      } catch (phaseNotifyErr) {
        console.error('Failed to notify phase completion (skip):', phaseNotifyErr);
      }

      return { ...result, updatedCompleted: newCompletedSet, wasCompleted: true };
    } catch (error) {
      console.error('Error in saveSkippedQuestion:', error);
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

      return {
        ...result,
        documentInfo: {
          has_document: true,
          filename: file.name,
          file_size: file.size,
          upload_date: new Date().toISOString(),
          template_name: validationResult.templateName,
          template_type: validationResult.templateType
        }
      };
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const checkExistingDocument = async () => {
    if (checkExistingDocument.isRunning) return;
    checkExistingDocument.isRunning = true;

    if (!selectedBusinessId) {
      setHasUploadedDocument(false);
      setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
      setUploadedFileInfo(null);
      checkExistingDocument.isRunning = false;
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const documentExists = result.document_info?.has_document === true;
        setHasUploadedDocument(documentExists);

        if (documentExists && result.document_info) {
          setUploadedFileInfo({
            name: result.document_info.filename || 'Financial Document',
            size: result.document_info.file_size || 0,
            uploadDate: result.document_info.upload_date ?
              new Date(result.document_info.upload_date).toLocaleDateString() :
              'Previously uploaded'
          });
        } else {
          setUploadedFileInfo(null);
        }

        const businessInfo = result.business_info;
        if (businessInfo) {
          const uploadDecisionMade = businessInfo.upload_decision_made === true;
          const uploadDecision = businessInfo.upload_decision || null;

          setBusinessUploadDecision({
            upload_decision_made: uploadDecisionMade,
            upload_decision: uploadDecision
          });
        } else {
          setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
        }
      } else {
        setHasUploadedDocument(false);
        setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
        setUploadedFileInfo(null);
      }
    } catch (error) {
      console.error('Error in checkExistingDocument:', error);
      setHasUploadedDocument(false);
      setBusinessUploadDecision({ upload_decision_made: false, upload_decision: null });
      setUploadedFileInfo(null);
    } finally {
      checkExistingDocument.isRunning = false;
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
          message_text: followupText,
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
      const isEssentialComplete = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
      if (isEssentialComplete &&
        !businessUploadDecision.upload_decision_made &&
        !hasUploadedDocument) {

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
      if (isEssentialComplete) {
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

  const removeUploadDecisionMessages = () => {
    setMessages(prev =>
      prev.filter(m =>
        m.questionId !== 'upload_option' &&
        m.questionId !== 'upload_skipped' &&
        m.id !== 'upload_decision_message' &&
        m.id !== 'upload_skipped_message'
      )
    );
  };

  const handleUploadDecision = async (decision) => {
    if (decision === 'upload') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/upload-decision`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ decision: 'upload' })
        });

        if (response.ok) {
          setBusinessUploadDecision({
            upload_decision_made: true,
            upload_decision: 'upload'
          });
          setShowTemplatesPopup(true);
        } else {
          throw new Error('Failed to save upload decision');
        }
      } catch (error) {
        console.error('Failed to save upload decision:', error);
        showToastMessage('Failed to save decision', 'error');
        return;
      }

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
          removeUploadDecisionMessages();

          addMessageLocally('bot',
            'Financial data upload skipped. You can continue with the remaining questions. If you change your mind later, you can still upload your financial data using the button below.',
            {
              questionId: 'upload_skipped',
              phase: 'upload_decision',
              severity: 'info',
              showUploadButton: true
            }
          );
          setTimeout(() => {
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
          }, 1000);

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
      setHasUploadedDocument(true);
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString(),
        template_name: validationResult.templateName,
        template_type: validationResult.templateType
      });

      if (onFileUploaded) {
        onFileUploaded(file, {
          ...validationResult,
          dbResult: dbResult,
          documentInfo: {
            has_document: true,
            filename: file.name,
            file_size: file.size,
            upload_date: new Date().toISOString(),
            template_name: validationResult.templateName,
            template_type: validationResult.templateType
          }
        });
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
          severity: nextQuestion.severity,
          order: nextQuestion.order
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

  const isInputDisabled = isArchived ||
    (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping ||
    isFileUploading;

  const isSubmitDisabled = isArchived ||
    !currentInput.trim() ||
    (!nextQuestion && !pendingValidation) ||
    isSaving ||
    isValidatingAnswer ||
    processingAnswer.current ||
    isSkipping ||
    isFileUploading;

  const isSkipDisabled = isArchived ||
    (!nextQuestion && !pendingValidation) ||
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


  const UploadedFileCard = () => {
    if (!uploadedFileInfo && !hasUploadedDocument) return null;

    const displayInfo = uploadedFileInfo || {
      name: 'Financial Document',
      uploadDate: 'Previously uploaded'
    };

    return (<div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
      <div ref={uploadedFileCardRef}
        style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid rgb(26, 115, 232)',
          borderRadius: '8px',
          padding: '5px',
          margin: '5px 0',
          width: 'max-content',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="rgb(26, 115, 232)" />
          <div>
            <div style={{ fontWeight: '500', color: '#0f172a' }}>
              {displayInfo.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Uploaded: {displayInfo.uploadDate}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleFileReplace}
            style={{
              backgroundColor: 'rgb(26, 115, 232)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              margin: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Upload size={14} />
            Change
          </button>
        </div>
      </div></div>
    );
  };

  return (
    <div className="chat-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}
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
          .map((message, index) => {
            const isEssentialPhaseComplete = () => {
              const essentialQuestions = questions.filter(q => q.phase === 'essential');
              const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
              return essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
            };

            const shouldShowFileCardAfter = (
              (message.phase === 'essential' || message.questionId === 'upload_option' || message.questionId === 'upload_skipped') &&
              isEssentialPhaseComplete() &&
              (uploadedFileInfo || hasUploadedDocument) &&
              (index === messages.length - 1 ||
                messages[index + 1]?.phase === 'advanced' ||
                !messages.slice(index + 1).some(m => m.phase === 'essential' || m.questionId === 'upload_option' || m.questionId === 'upload_skipped'))
            );

            return (
              <React.Fragment key={message.id}>
                <div className={`message-wrapper ${message.type}`}>
                  {message.type === 'bot' && (
                    <div className="bot-avatar">
                      <BotMessageSquare size={18} color="white" />
                    </div>
                  )}

                  <div className={`message-bubble ${message.type} ${message.isFollowUp ? 'follow-up' : ''} ${message.isSkipped ? 'skipped' : ''}`}>
                    <div className="message-text">
                      {message.text}
                      {message.isSkipped && <span className="skip-indicator"></span>}
                    </div>

                    {!isViewer && message.showUploadButtons && !hasUploadedDocument && (
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

                    {!isViewer && message.showUploadButton && !hasUploadedDocument && (
                      <div style={{
                        display: 'flex',
                        marginTop: '12px'
                      }}>
                        <button
                          onClick={() => setShowTemplatesPopup(true)}
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
                      </div>
                    )}

                    <div className="message-timestamp">
                      {formatDate(message.timestamp)}
                      {message.type === 'bot' && message.phase && (
                        <span style={{ fontStyle: 'italic' }}>
                          - {message.phase} phase{message.isFollowUp && ' followup'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isViewer && shouldShowFileCardAfter && <UploadedFileCard />}
              </React.Fragment>
            );
          })}

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
      {canShowSkipButton && !isViewer && (
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
        {isArchived ? (
          <div className="input-wrapper archived-notice" style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', textAlign: 'center' }}>
            <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '500' }}>
              Chat is disabled because this workspace is Archived (Read-Only).
            </span>
          </div>
        ) : !isViewer && (
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
                    : t("All_questions_completed!")
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
        )}

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
            <span>{t("All_questions_completed!")}</span>
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