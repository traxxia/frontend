// Fixed PhaseManager.js - Prevents advanced phase from triggering essential phase
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
    onGoodPhaseGeneration,
    onAdvancedPhaseGeneration,
    setHasUploadedDocument,
    hasUploadedDocument,
    onDocumentInfoLoad,
    onAnalysisDataLoad,
    API_BASE_URL,
    getAuthToken,
    apiService,
    stateSetters,
    showToastMessage
}) => { 
    const [completedPhases, setCompletedPhases] = useState(new Set());
    const isRegeneratingRef = useRef(false);

    const PHASES = {
        INITIAL: "initial",
        ESSENTIAL: "essential",
        GOOD: "good",
        ADVANCED: "advanced",
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
        if (!questions.length) return {
            brief: true,
            analysis: false,
            fullSwot: false,
            goodPhase: false,
            advancedPhase: false
        };

        const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
        const essentialQuestions = questions.filter(q => q.phase === 'essential');
        const advancedQuestions = questions.filter(q => q.phase === 'advanced');

        const completedInitial = initialQuestions.filter(q => completedQuestions.has(q._id));
        const completedEssential = essentialQuestions.filter(q => completedQuestions.has(q._id));
        const completedAdvanced = advancedQuestions.filter(q => completedQuestions.has(q._id));

        const isInitialComplete = initialQuestions.length > 0 && completedInitial.length === initialQuestions.length;
        const isEssentialComplete = essentialQuestions.length > 0 && completedEssential.length === essentialQuestions.length;
        const isAdvancedComplete = advancedQuestions.length > 0 && completedAdvanced.length === advancedQuestions.length;
 
        const isGoodPhaseUnlocked = hasUploadedDocument || false;

        return {
            brief: true,
            analysis: isInitialComplete,
            fullSwot: isEssentialComplete,
            goodPhase: isGoodPhaseUnlocked, // Based on document upload
            advancedPhase: isAdvancedComplete
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
                // Check document status from API response and update parent state
                if (data.document_info) {
                    const hasDocument = data.document_info.has_document;  
                    if (setHasUploadedDocument) {
                        setHasUploadedDocument(hasDocument);
                    }
                    if (onDocumentInfoLoad) {
                        onDocumentInfoLoad(data.document_info);
                    }
                }

                if (data.conversations && data.conversations.length > 0) {
                    const { completedSet, answersMap } = loadCompletedQuestionsFromAPI(data.conversations);
                    onCompletedQuestionsUpdate(completedSet, answersMap);

                    const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
                    const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL && q.severity === "mandatory");
                    const goodQuestions = questions.filter(q => q.phase === PHASES.GOOD);
                    const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);

                    const completedInitialQuestions = initialQuestions.filter(q => completedSet.has(q._id));
                    const completedEssentialQuestions = essentialQuestions.filter(q => completedSet.has(q._id));
                    const completedGoodQuestions = goodQuestions.filter(q => completedSet.has(q._id));
                    const completedAdvancedQuestions = advancedQuestions.filter(q => completedSet.has(q._id));

                    const newCompletedPhases = new Set();

                    if (completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0) {
                        newCompletedPhases.add('initial');
                    }

                    if (essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length) {
                        newCompletedPhases.add('essential');
                    }

                    // Good phase completion is now based on document upload, not questions
                    if (data.document_info?.has_document) {
                        newCompletedPhases.add('good');
                    }

                    if (advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length) {
                        newCompletedPhases.add('advanced');
                    }

                    setCompletedPhases(newCompletedPhases);
                    onCompletedPhasesUpdate(newCompletedPhases);
                }

                if (data.phase_analysis && typeof data.phase_analysis === 'object') {
                    const analysisArray = [];
                    Object.values(data.phase_analysis).forEach(phaseData => {
                        if (phaseData.analyses && Array.isArray(phaseData.analyses)) {
                            analysisArray.push(...phaseData.analyses);
                        }
                    });

                    if (onAnalysisDataLoad && analysisArray.length > 0) { 
                        onAnalysisDataLoad(analysisArray);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading existing analysis:', error);
        }
    };
    // Simplified phase completion using API service
    const handleSimplifiedPhaseCompletion = async (phase, newCompletedSet) => {
        if (isRegeneratingRef.current) return;

        try {
            isRegeneratingRef.current = true;

            if (apiService && stateSetters && showToastMessage) {
                await apiService.handlePhaseCompletion(
                    phase,
                    questions,
                    userAnswers,
                    selectedBusinessId,
                    stateSetters,
                    showToastMessage
                );
            } else {
                // Fallback to original handlers if API service not available
                if (phase === 'initial') {
                    await onAnalysisGeneration(newCompletedSet);
                } else if (phase === 'essential') {
                    await onFullSwotGeneration(newCompletedSet);
                } else if (phase === 'good') {
                    if (onGoodPhaseGeneration) {
                        await onGoodPhaseGeneration(newCompletedSet);
                    }
                } else if (phase === 'advanced') {
                    if (onAdvancedPhaseGeneration) {
                        await onAdvancedPhaseGeneration(newCompletedSet);
                    }
                }
            }
        } catch (error) {
            console.error(`Error in simplified phase completion for ${phase}:`, error);
        } finally {
            isRegeneratingRef.current = false;
        }
    };

    // FIXED: Determine which phase the completed question belongs to
    const getQuestionPhase = (questionId) => {
        const question = questions.find(q => q._id === questionId);
        return question ? question.phase : null;
    };

    // FIXED: Handle question completion - only trigger the specific phase that was just completed
    const handleQuestionCompleted = async (questionId) => {
        const newCompletedSet = new Set([...completedQuestions, questionId]);

        // Get the phase of the question that was just completed
        const questionPhase = getQuestionPhase(questionId);

        if (!questionPhase) {
            console.warn('Could not determine phase for question:', questionId);
            return newCompletedSet;
        }

        // Only check if the specific phase that the question belongs to is now complete
        let phaseToTrigger = null;

        if (questionPhase === 'initial') {
            const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
            const completedInitialQuestions = initialQuestions.filter(q => newCompletedSet.has(q._id));
            const isInitialCompleted = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;

            if (isInitialCompleted && !completedPhases.has('initial')) {
                phaseToTrigger = 'initial';
            }
        } else if (questionPhase === 'essential') {
            const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL);
            const completedEssentialQuestions = essentialQuestions.filter(q => newCompletedSet.has(q._id));
            const isEssentialCompleted = essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;

            if (isEssentialCompleted && !completedPhases.has('essential')) {
                phaseToTrigger = 'essential';
            }
        } else if (questionPhase === 'good') {
            const goodQuestions = questions.filter(q => q.phase === PHASES.GOOD);
            const completedGoodQuestions = goodQuestions.filter(q => newCompletedSet.has(q._id));
            const isGoodCompleted = goodQuestions.length > 0 && completedGoodQuestions.length === goodQuestions.length;

            if (isGoodCompleted && !completedPhases.has('good')) {
                phaseToTrigger = 'good';
            }
        } else if (questionPhase === 'advanced') {
            const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);
            const completedAdvancedQuestions = advancedQuestions.filter(q => newCompletedSet.has(q._id));
            const isAdvancedCompleted = advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length;

            if (isAdvancedCompleted && !completedPhases.has('advanced')) {
                phaseToTrigger = 'advanced';
            }
        }

        // Only trigger the phase that was actually completed
        if (phaseToTrigger) {
            const newPhases = new Set([...completedPhases, phaseToTrigger]);
            setCompletedPhases(newPhases);
            onCompletedPhasesUpdate(newPhases);
            await handleSimplifiedPhaseCompletion(phaseToTrigger, newCompletedSet);
        }

        return newCompletedSet;
    };

    // Handle phase completion (kept for backward compatibility)
    const handlePhaseCompleted = async (phase, updatedCompletedSet) => {
        await handleSimplifiedPhaseCompletion(phase, updatedCompletedSet);
    };

    // Check if current phase allows analysis regeneration
    const canRegenerateAnalysis = () => {
        const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
        const completedInitialQuestions = initialQuestions.filter(q => completedQuestions.has(q._id));
        return completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
    };

    // Check if full SWOT can be generated
    const canGenerateFullSwot = () => {
        const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL);
        const completedEssentialQuestions = essentialQuestions.filter(q => completedQuestions.has(q._id));
        return essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
    };

    // Check if Good phase analysis can be generated
    const canGenerateGoodPhase = () => {
        const goodQuestions = questions.filter(q => q.phase === PHASES.GOOD);
        const completedGoodQuestions = goodQuestions.filter(q => completedQuestions.has(q._id));
        return goodQuestions.length > 0 && completedGoodQuestions.length === goodQuestions.length;
    };

    // Check if Advanced phase analysis can be generated
    const canGenerateAdvancedPhase = () => {
        const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);
        const completedAdvancedQuestions = advancedQuestions.filter(q => completedQuestions.has(q._id));
        return advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length;
    };

    // Simplified regeneration handler for entire phase
    const regeneratePhase = async (phase) => {
        if (isRegeneratingRef.current) return;

        try {
            isRegeneratingRef.current = true;

            if (apiService && stateSetters && showToastMessage) {
                await apiService.handlePhaseCompletion(
                    phase,
                    questions,
                    userAnswers,
                    selectedBusinessId,
                    stateSetters,
                    showToastMessage
                );
            }
        } catch (error) {
            console.error(`Error regenerating ${phase} phase:`, error);
            if (showToastMessage) {
                showToastMessage(`Failed to regenerate ${phase} phase.`, "error");
            }
        } finally {
            isRegeneratingRef.current = false;
        }
    };

    // Create simple regeneration handler for individual analysis
    const createSimpleRegenerationHandler = (analysisType) => {
        if (apiService && stateSetters && showToastMessage) {
            return apiService.createSimpleRegenerationHandler(
                analysisType,
                questions,
                userAnswers,
                selectedBusinessId,
                stateSetters,
                showToastMessage
            );
        }
        return null;
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
        canGenerateGoodPhase,
        canGenerateAdvancedPhase,
        loadExistingAnalysis,

        // Simplified functions
        regeneratePhase,
        createSimpleRegenerationHandler,

        // Refs
        isRegeneratingRef
    };
};

export default PhaseManager;