import { useMemo, useCallback } from 'react';

export const useProgressTracking = (businessData) => {
  const progressData = useMemo(() => {
    if (!businessData) return { answeredQuestions: 0, totalQuestions: 0, progress: 0 };
    
    let totalAnswered = 0;
    
    businessData.categories.forEach(category => {
      category.questions.forEach(question => {
        if (question.answer && question.answer.trim() !== '') {
          totalAnswered++;
        }
      });
    });
    
    const progress = businessData.totalQuestions > 0 
      ? Math.round((totalAnswered / businessData.totalQuestions) * 100)
      : 0;
    
    return {
      answeredQuestions: totalAnswered,
      totalQuestions: businessData.totalQuestions,
      progress: progress
    };
  }, [businessData]);

  const isCategoryComplete = useCallback((category) => {
    return category.questions.every(question => 
      question.answer && question.answer.trim() !== ''
    );
  }, []);

  const getAnsweredQuestionsInCategory = useCallback((category) => {
    return category.questions.filter(question => 
      question.answer && question.answer.trim() !== ''
    ).length;
  }, []);

  const areAllQuestionsAnswered = useCallback(() => {
    if (!businessData || !businessData.categories) return false;
    
    return businessData.categories.every(category => 
      category.questions.every(question => 
        question.answer && question.answer.trim() !== ''
      )
    );
  }, [businessData]);

  return {
    progressData,
    isCategoryComplete,
    getAnsweredQuestionsInCategory,
    areAllQuestionsAnswered
  };
};