import React, { useState, useRef, useEffect } from "react";
import { Loader, SkipForward } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';

// Hooks
import { useChatManager } from '@/components/Chat/hooks/useChatManager';
import { useChatFile } from '@/components/Chat/hooks/useChatFile';

// Components
import ChatMessages from '@/components/Chat/ChatMessages';
import ChatInput from '@/components/Chat/ChatInput';
import ChatStatus from '@/components/Chat/ChatStatus';

import "../styles/ChatComponent.css";

const ChatComponent = (props) => {
  const {
    selectedBusinessId,
    isArchived,
    userAnswers,
    onNewAnswer,
    onQuestionsLoaded,
    onQuestionCompleted,
    onPhaseCompleted,
    onFileUploaded,
  } = props;

  const { t } = useTranslation();
  const [currentInput, setCurrentInput] = useState('');
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chatManager = useChatManager(selectedBusinessId, {
    onNewAnswer,
    onQuestionsLoaded,
    onQuestionCompleted,
    onPhaseCompleted,
  });

  const chatFile = useChatFile(selectedBusinessId, {
    onFileUploaded,
  });

  const {
    messages,
    questions,
    completedQuestions,
    nextQuestion,
    pendingValidation,
    followupAttempts,
    isLoading,
    isSaving,
    isValidatingAnswer,
    handleMainAnswer,
  } = chatManager;

  const {
    isFileUploading,
    isValidating,
    hasUploadedDocument,
    handleFileUpload,
  } = chatFile;

  const isProcessing = isSaving || isValidatingAnswer || isFileUploading;

  const handleSubmit = async () => {
    if (!currentInput.trim() || isProcessing) return;
    const answer = currentInput.trim();
    setCurrentInput('');
    await handleMainAnswer(answer);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".pdf,.xlsx,.xls,.csv" 
        onChange={(e) => handleFileUpload(e.target.files[0])} 
        style={{ display: 'none' }} 
      />

      <ChatMessages 
        messages={messages}
        isViewer={props.isViewer}
        isFileUploading={isFileUploading}
        hasUploadedDocument={hasUploadedDocument}
        onUploadDecision={(decision) => console.log(decision)}
        onShowTemplates={() => setShowTemplatesPopup(true)}
      />

      {isProcessing && (
        <div className="generating-analysis">
          <Loader size={16} className="spinner" />
          <span>Processing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />

      <ChatInput 
        currentInput={currentInput}
        setCurrentInput={setCurrentInput}
        onSubmit={handleSubmit}
        isInputDisabled={isArchived || isProcessing}
        isSubmitDisabled={isArchived || !currentInput.trim() || isProcessing}
        isArchived={isArchived}
        isProcessing={isProcessing}
        pendingValidation={pendingValidation}
        nextQuestion={nextQuestion}
      />

      <ChatStatus 
        pendingValidation={pendingValidation}
        nextQuestion={nextQuestion}
        completedCount={completedQuestions.size}
        totalCount={questions.length}
        followupAttempts={followupAttempts}
        isProcessing={isProcessing}
      />

      <FinancialTemplatesPopup 
        isOpen={showTemplatesPopup} 
        onClose={() => setShowTemplatesPopup(false)} 
        onFileUploaded={(file, type) => chatFile.handleFileUpload(file, type)} 
        isFileUploading={isFileUploading} 
      />
    </div>
  );
};

export default ChatComponent;
