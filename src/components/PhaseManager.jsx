import { useState, useEffect, useRef } from 'react';

const PhaseManager = ({
    questions,
    questionsLoaded,
    completedQuestions,
    userAnswers,
    selectedBusinessId,
    onCompletedQuestionsUpdate,
    onCompletedPhasesUpdate,
    onAnalysisGeneration,
    onFullSwotGeneration,
    onAnalysisDataLoad,
    API_BASE_URL,
    getAuthToken
}) => {
    // FIX: Ensure completedPhases is properly defined in state
    const [completedPhases, setCompletedPhases] = useState(new Set());
    const isRegeneratingRef = useRef(false);

    const PHASES = {
        INITIAL: "initial",
        ESSENTIAL: "essential",
        GOOD: "good",
        EXCELLENT: "excellent",
    };

    // Check if a phase is completed
    const isPhaseCompleted = (phase) => {
        const mandatoryQuestions = questions.filter(
            (q) => q.phase === phase && q.severity === "mandatory"
        );

        if (mandatoryQuestions.length === 0) return false;

        return mandatoryQuestions.every((q) => {
            const questionId = q._id;
            return (userAnswers[questionId] && userAnswers[questionId].trim()) ||
                completedQuestions.has(questionId);
        });
    };

    // Get unlocked features based on phase completion
    const getUnlockedFeatures = () => {
        if (!questions.length) return { brief: true, analysis: false, fullSwot: false };

        const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
        const essentialQuestions = questions.filter(q => q.phase === 'essential'); // All essential questions regardless of severity

        const completedInitial = initialQuestions.filter(q => completedQuestions.has(q._id));
        const completedEssential = essentialQuestions.filter(q => completedQuestions.has(q._id));

        const isInitialComplete = initialQuestions.length > 0 && completedInitial.length === initialQuestions.length;

        // FIX: Essential phase complete ONLY when ALL essential questions are answered
        const isEssentialComplete = essentialQuestions.length > 0 && completedEssential.length === essentialQuestions.length;

        return {
            brief: true,
            analysis: isInitialComplete,
            fullSwot: isEssentialComplete
        };
    };

    // Load completed questions from API conversations
    const loadCompletedQuestionsFromAPI = (conversations) => {
        const completedSet = new Set();
        const answersMap = {};

        conversations.forEach(conversation => {
            if (conversation.completion_status === 'complete' || conversation.completion_status === 'skipped') {
                const questionId = conversation.question_id;
                completedSet.add(questionId);

                if (conversation.completion_status === 'skipped' || conversation.is_skipped) {
                    answersMap[questionId] = '[Question Skipped]';
                } else {
                    const allAnswers = conversation.conversation_flow
                        .filter(item => item.type === 'answer')
                        .map(a => a.text.trim())
                        .filter(text => text.length > 0 && text !== '[Question Skipped]');

                    if (allAnswers.length > 0) {
                        answersMap[questionId] = allAnswers.join('. ');
                    }
                }
            }
        });

        return { completedSet, answersMap };
    };

    // Load existing analysis from API
    const loadExistingAnalysis = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Load completed questions and answers from conversations
                if (data.conversations && data.conversations.length > 0) {
                    const { completedSet, answersMap } = loadCompletedQuestionsFromAPI(data.conversations);

                    onCompletedQuestionsUpdate(completedSet, answersMap);

                    const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
                    const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL && q.severity === "mandatory");

                    const completedInitialQuestions = initialQuestions.filter(q => completedSet.has(q._id));
                    const completedEssentialQuestions = essentialQuestions.filter(q => completedSet.has(q._id));

                    const newCompletedPhases = new Set();

                    if (completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0) {
                        newCompletedPhases.add('initial');
                    }

                    if (essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length) {
                        newCompletedPhases.add('essential');
                    }

                    setCompletedPhases(newCompletedPhases);
                    onCompletedPhasesUpdate(newCompletedPhases);
                }

                // Load existing analysis data if available - NEW FORMAT
                if (data.phase_analysis && typeof data.phase_analysis === 'object') {
                    // Handle new phase-organized structure
                    const analysisArray = [];

                    // Convert phase-organized data back to array format for compatibility
                    Object.values(data.phase_analysis).forEach(phaseData => {
                        if (phaseData.analyses && Array.isArray(phaseData.analyses)) {
                            analysisArray.push(...phaseData.analyses);
                        }
                    });

                    // Call the callback to load analysis data in the main component
                    if (onAnalysisDataLoad && analysisArray.length > 0) {
                        onAnalysisDataLoad(analysisArray);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading existing analysis:', error);
        }
    };

    // FIX: Handle question completion with proper completedPhases access
    const handleQuestionCompleted = async (questionId) => {
        const newCompletedSet = new Set([...completedQuestions, questionId]);

        const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
        const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL); // All essential questions regardless of severity

        const completedInitialQuestions = initialQuestions.filter(q => newCompletedSet.has(q._id));
        const completedEssentialQuestions = essentialQuestions.filter(q => newCompletedSet.has(q._id));

        const isInitialCompleted = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;

        // FIX: Essential phase complete ONLY when ALL essential questions are answered
        const isEssentialCompleted = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

        // Only trigger phase completion if the phase wasn't already marked as completed
        if (isInitialCompleted && !completedPhases.has('initial')) {
            const newPhases = new Set([...completedPhases, 'initial']);
            setCompletedPhases(newPhases);
            onCompletedPhasesUpdate(newPhases);
            await handlePhaseCompleted('initial', newCompletedSet);
        }

        // Essential phase completion - must complete ALL essential questions
        if (isEssentialCompleted && !completedPhases.has('essential')) {
            const newPhases = new Set([...completedPhases, 'initial', 'essential']);
            setCompletedPhases(newPhases);
            onCompletedPhasesUpdate(newPhases);
            await handlePhaseCompleted('essential', newCompletedSet);
        }

        return newCompletedSet;
    };

    // Handle phase completion
    const handlePhaseCompleted = async (phase, updatedCompletedSet) => {
        if (phase === 'initial') {
            await onAnalysisGeneration(updatedCompletedSet);
        } else if (phase === 'essential') {
            await onFullSwotGeneration(updatedCompletedSet);
        }
    };

    // Check if current phase allows analysis regeneration
    const canRegenerateAnalysis = () => {
        const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
        const completedInitialQuestions = initialQuestions.filter(q => completedQuestions.has(q._id));
        return completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
    };

    // Check if full SWOT can be generated
    const canGenerateFullSwot = () => {
        const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL); // All essential questions regardless of severity
        const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));

        // Must complete ALL essential questions
        return essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
    };

    // Load existing analysis when component mounts and questions are loaded
    useEffect(() => {
        if (selectedBusinessId && questionsLoaded && questions.length > 0) {
            loadExistingAnalysis();
        }
    }, [selectedBusinessId, questionsLoaded, questions]);

    return {
        // State
        completedPhases,
        PHASES,

        // Functions
        isPhaseCompleted,
        getUnlockedFeatures,
        handleQuestionCompleted,
        canRegenerateAnalysis,
        canGenerateFullSwot,
        loadExistingAnalysis,

        // Refs
        isRegeneratingRef
    };
};

export default PhaseManager;