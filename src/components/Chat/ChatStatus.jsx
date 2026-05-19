import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const ChatStatus = ({ pendingValidation, nextQuestion, completedCount, totalCount, followupAttempts, isProcessing }) => {
  const { t } = useTranslation();

  return (
    <div className="status-text">
      {pendingValidation ? (
        <span>
          Follow-up required • Please provide more details ({followupAttempts + 1}/2 attempts)
          {isProcessing && ' • Processing...'}
        </span>
      ) : nextQuestion ? (
        <span>
          Question {completedCount + 1} of {totalCount} • Phase: {nextQuestion.phase.toUpperCase()}
          {isProcessing && ` • Processing...`}
        </span>
      ) : (
        <span>{t("All_questions_completed!")}</span>
      )}
    </div>
  );
};

export default ChatStatus;
