import React, { useState, useEffect, useRef } from "react";
import { Send, Loader } from "lucide-react";
import { useAnalysisData } from "../hooks/useAnalysisData";
import "../styles/ChatComponent.css";

const ChatComponent = ({ 
  questions = [], 
  phases = {}, 
  userAnswers = {},
  onBusinessDataUpdate, 
  onNewAnswer, 
  onAnalysisGenerated, 
  onStrategicAnalysisGenerated 
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isGeneratingStrategic, setIsGeneratingStrategic] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [completedPhases, setCompletedPhases] = useState(new Set());
  
  const { generateAnalysis } = useAnalysisData();
  
  const messagesEndRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    checkPhaseCompletion();
  }, [userAnswers, questions]);

  // Initialize with current question when questions are loaded
  useEffect(() => {
    console.log('🔍 ChatComponent useEffect:', {
      questionsLength: questions.length,
      userAnswersCount: Object.keys(userAnswers).length,
      messagesLength: messages.length
    });

    // Only initialize once when questions are available and no messages exist yet
    if (questions.length > 0 && messages.length === 0) {
      const currentQ = getCurrentQuestion();
      console.log('🎯 Current question:', currentQ);
      
      if (currentQ) {
        console.log('✅ Adding question to chat:', currentQ.id);
        addMessage('bot', currentQ.question, {
          questionId: currentQ.id,
          phase: currentQ.phase,
          severity: currentQ.severity
        });
      }
    }
  }, [questions]);

  const getCurrentQuestion = () => {
    if (questions.length === 0) return null;
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const answeredCount = Object.keys(userAnswers).length;
    
    if (answeredCount < sortedQuestions.length) {
      return sortedQuestions[answeredCount];
    }
    
    return null;
  };

  const getCurrentPhase = () => {
    const currentQ = getCurrentQuestion();
    return currentQ ? currentQ.phase : 'completed';
  };

  const addMessage = (type, text, metadata = {}) => {
    // Prevent duplicate bot messages with same question ID
    if (type === 'bot' && metadata.questionId) {
      const existingBotMessage = messages.find(msg => 
        msg.type === 'bot' && msg.questionId === metadata.questionId
      );
      if (existingBotMessage) {
        console.log('🚫 Preventing duplicate bot message for question:', metadata.questionId);
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
    console.log('📝 Adding message:', { type, questionId: metadata.questionId, text: text.substring(0, 50) + '...' });
    setMessages(prev => [...prev, message]);
  };

  const saveAnswerToAPI = async (questionId, answer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/answers/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          answer: answer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      showToastMessage('Failed to save answer. Will retry automatically.', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const checkPhaseCompletion = () => {
    if (questions.length === 0) return;

    const phaseOrder = ['initial', 'essential', 'good', 'excellent'];
    
    phaseOrder.forEach(phaseName => {
      const phaseQuestions = questions.filter(q => q.phase === phaseName);
      const mandatoryQuestions = phaseQuestions.filter(q => q.severity === 'mandatory');
      const answeredMandatory = mandatoryQuestions.filter(q => userAnswers[q.id]);
      
      if (mandatoryQuestions.length > 0 && answeredMandatory.length === mandatoryQuestions.length) {
        if (!completedPhases.has(phaseName)) {
          setCompletedPhases(prev => new Set([...prev, phaseName]));
          
          const phaseDisplayName = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);
          showToastMessage(`🎉 ${phaseDisplayName} phase completed successfully!`, 'success');
          
          if (phaseName === 'initial') {
            setTimeout(() => {
              generateAndShowAnalysis();
            }, 1500);
          }
        }
      }
    });
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

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

        setTimeout(() => {
          generateAndShowStrategicAnalysis();
        }, 2000);
      } else {
        throw new Error(analysisResult || 'Failed to generate analysis');
      }
    } catch (error) {
      showToastMessage('Failed to generate analysis. Please try again.', 'error');
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

  const handleSubmit = async () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentInput.trim() || !currentQuestion) return;

    const answer = currentInput.trim();
    
    addMessage('user', answer, { 
      questionId: currentQuestion.id,
      saved: false 
    });
    
    // Update user answers and notify parent
    if (onNewAnswer) {
      onNewAnswer(currentQuestion.id, answer);
    }
    
    const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
    const firstQuestion = sortedQuestions[0];
    if (firstQuestion && currentQuestion.id === firstQuestion.id && onBusinessDataUpdate) {
      const businessName = extractBusinessName(answer);
      if (businessName) {
        onBusinessDataUpdate({ name: businessName, whatWeDo: answer });
      }
    }

    setCurrentInput('');

    try {
      await saveAnswerToAPI(currentQuestion.id, answer);
      
      setMessages(prev => prev.map(msg => 
        msg.questionId === currentQuestion.id && msg.type === 'user' 
          ? { ...msg, saved: true }
          : msg
      ));
      
      setTimeout(() => {
        const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);
        const answeredCount = Object.keys(userAnswers).length + 1; // +1 for the answer we just added
        
        if (answeredCount < sortedQuestions.length) {
          const nextQuestion = sortedQuestions[answeredCount];
          addMessage('bot', nextQuestion.question, { 
            questionId: nextQuestion.id,
            phase: nextQuestion.phase,
            severity: nextQuestion.severity
          });
        }
      }, 800);
      
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <div>Loading questions...</div>
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
                🤖
              </div>
            )}
            
            <div className={`message-bubble ${message.type} ${message.isSystemMessage ? 'system' : ''}`}>
              <div className="message-text">{message.text}</div>
               
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                {message.type === 'bot' && message.phase && (
                 <span style={{ fontStyle: 'italic' }}>- {message.phase} phase</span>
              )}
              </div>
            </div>
          </div>
        ))}
        
        {(isGeneratingAnalysis || isGeneratingStrategic) && (
          <div className="generating-analysis">
            <Loader size={16} className="spinner" />
            <span>
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
            placeholder={currentQuestion ? "Type your answer here..." : "All questions completed!"}
            disabled={!currentQuestion || isSaving}
            className="message-input"
            rows="2"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentInput.trim() || !currentQuestion || isSaving}
            className={`send-button ${(!currentInput.trim() || !currentQuestion || isSaving) ? 'disabled' : ''}`}
          >
            {isSaving ? <Loader size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </div>
        
        <div className="status-text">
          {currentQuestion ? (
            <span>
              Question {Object.keys(userAnswers).length + 1} of {questions.length} • 
              Phase: {currentQuestion.phase.toUpperCase()}
              {isSaving && ' • Saving...'}
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