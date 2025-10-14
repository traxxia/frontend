// Simplified PhaseManager - Questions are passed in instead of loaded via API
export const PHASES = {
  INITIAL: 'initial',
  ESSENTIAL: 'essential', 
  GOOD: 'good',
  EXCELLENT: 'excellent'
};

class PhaseManager {
  // Get questions by phase
  static getQuestionsByPhase(questions, phase) {
    return questions.filter(q => q.phase === phase);
  }

  // Get mandatory questions by phase
  static getMandatoryQuestionsByPhase(questions, phase) {
    return questions.filter(q => q.phase === phase && q.severity === 'mandatory');
  }

  // Check if phase is completed
  static isPhaseCompleted(questions, phase, userAnswers) {
    const mandatoryQuestions = this.getMandatoryQuestionsByPhase(questions, phase);
    return mandatoryQuestions.every(q => userAnswers[q.id]);
  }

  // Get current phase based on completed answers
  static getCurrentPhase(questions, userAnswers) {
    const phaseOrder = [PHASES.INITIAL, PHASES.ESSENTIAL, PHASES.GOOD, PHASES.EXCELLENT];
    
    for (let i = phaseOrder.length - 1; i >= 0; i--) {
      if (this.isPhaseCompleted(questions, phaseOrder[i], userAnswers)) {
        return phaseOrder[i];
      }
    }
    return PHASES.INITIAL;
  }

  // Get next unanswered question
  static getNextQuestion(questions, userAnswers) {
    const phaseOrder = [PHASES.INITIAL, PHASES.ESSENTIAL, PHASES.GOOD, PHASES.EXCELLENT];
    
    for (const phase of phaseOrder) {
      const phaseQuestions = this.getQuestionsByPhase(questions, phase);
      // First check mandatory questions
      for (const question of phaseQuestions.filter(q => q.severity === 'mandatory')) {
        if (!userAnswers[question.id]) {
          return question;
        }
      }
      // Then check optional questions  
      for (const question of phaseQuestions.filter(q => q.severity === 'optional')) {
        if (!userAnswers[question.id]) {
          return question;
        }
      }
    }
    return null; // All questions answered
  }

  // Get progress percentage
  static getProgress(questions, userAnswers) {
    const totalMandatory = questions.filter(q => q.severity === 'mandatory').length;
    const answeredMandatory = questions.filter(q => 
      q.severity === 'mandatory' && userAnswers[q.id]
    ).length;
    
    return totalMandatory > 0 ? Math.round((answeredMandatory / totalMandatory) * 100) : 0;
  }

  // Check what analysis features should be unlocked
  static getUnlockedFeatures(questions, userAnswers) {
    const features = {
      brief: true, // Always available
      analysis: false,
      swot: false,
      financial: false,
      strategic: false
    };

    // Unlock analysis after initial phase
    if (this.isPhaseCompleted(questions, PHASES.INITIAL, userAnswers)) {
      features.analysis = true;
      features.swot = true;
    }

    // Unlock financial analysis after good phase
    if (this.isPhaseCompleted(questions, PHASES.GOOD, userAnswers)) {
      features.financial = true;
    }

    // Unlock strategic analysis after excellent phase
    if (this.isPhaseCompleted(questions, PHASES.EXCELLENT, userAnswers)) {
      features.strategic = true;
    }

    return features;
  }
}

// React Hook for using Phase Manager - now takes questions as parameter
export const usePhaseManager = (questions, userAnswers) => {
  const currentPhase = PhaseManager.getCurrentPhase(questions, userAnswers);
  const nextQuestion = PhaseManager.getNextQuestion(questions, userAnswers);
  const progress = PhaseManager.getProgress(questions, userAnswers);
  const unlockedFeatures = PhaseManager.getUnlockedFeatures(questions, userAnswers);

  return {
    questions,
    currentPhase,
    nextQuestion,
    progress,
    unlockedFeatures,
    isLoading: false, // No loading since questions are passed in
    isPhaseCompleted: (phase) => PhaseManager.isPhaseCompleted(questions, phase, userAnswers),
    getQuestionsByPhase: (phase) => PhaseManager.getQuestionsByPhase(questions, phase)
  };
};

export default PhaseManager;