import { useState, useEffect, useRef } from 'react';
import { AnalysisService } from '../services/analysisService';

const checkHas = (collection, id) => {
    if (!collection) return false;
    if (typeof collection.has === 'function') return collection.has(id);
    if (typeof collection.includes === 'function') return collection.includes(id);
    return false;
};

const PHASES = {
    INITIAL: "initial",
    ESSENTIAL: "essential",
    ADVANCED: "advanced",
};

const isPhaseCompleted = (phase, questions, userAnswers, completedQuestions) => {
    const mandatoryQuestions = questions.filter(
        (q) => q.phase === phase && q.severity === "mandatory"
    );

    if (mandatoryQuestions.length === 0) return false;

    return mandatoryQuestions.every((q) => {
        const questionId = q._id;
        return (userAnswers[questionId] && userAnswers[questionId].trim()) ||
            checkHas(completedQuestions, questionId);
    });
};

const getUnlockedFeatures = (questions, userAnswers, completedQuestions, hasUploadedDocument) => {
    if (!questions || !questions.length) return {
        advanced: true,
        analysis: false,
        initialPhase: false,
        essentialPhase: false,
        advancedPhase: false,
        hasDocument: false
    };

    const hasAnswer = (qId) => {
        const answered = (userAnswers[qId] && String(userAnswers[qId]).trim().length > 0) || checkHas(completedQuestions, qId);
        if (!answered && typeof qId === 'number') return checkHas(completedQuestions, String(qId));
        if (!answered && typeof qId === 'string') {
            const numId = Number(qId);
            if (!isNaN(numId)) return checkHas(completedQuestions, numId);
        }
        return !!answered;
    };

    const checkPhase = (phaseName) => {
        const lowerPhase = phaseName.toLowerCase();
        return questions.some(q => {
            const qPhase = (q.phase || 'initial').toLowerCase();
            return qPhase === lowerPhase && hasAnswer(q._id);
        });
    };

    const hasAnyInitial = checkPhase('initial');
    const hasAnyEssential = checkPhase('essential');
    const hasAnyAdvanced = checkPhase('advanced');
    const hasDoc = !!hasUploadedDocument;

    return {
        advanced: true,
        analysis: hasAnyInitial || hasAnyEssential || hasAnyAdvanced || hasDoc,
        initialPhase: hasAnyInitial,
        essentialPhase: hasAnyEssential,
        advancedPhase: hasAnyAdvanced,
        hasDocument: hasDoc
    };
};

const loadCompletedQuestionsFromAPI = (conversations) => {
    const completedSet = new Set();
    const answersMap = {};

    conversations.forEach(conversation => {
        const questionId = conversation.question_id;

        if (conversation.completion_status === 'complete' || conversation.completion_status === 'skipped') {
            completedSet.add(questionId);
        }

        const allAnswers = Array.isArray(conversation.conversation_flow)
            ? conversation.conversation_flow
                .filter(item => item && String(item.type).toLowerCase() === 'answer' && item.text !== undefined && item.text !== null)
                .map(a => String(a.text).trim())
                .filter(text => text.length > 0 && text !== '[Question Skipped]')
            : [];


        if (allAnswers.length > 0) {
            answersMap[questionId] = allAnswers.join('\n\n'); 
        } else {
            if (conversation.completion_status === 'skipped' || conversation.is_skipped) {
                answersMap[questionId] = '[Question Skipped]';
            } else if (conversation.completion_status === 'complete') {
                answersMap[questionId] = ''; 
            }
        }
    });

    return { completedSet, answersMap };
};

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
    const [unlockedPhase, setUnlockedPhase] = useState(null);
    const [showUnlockToast, setShowUnlockToast] = useState(false);
    const allPhasesCelebratedRef = useRef(false);



    const loadExistingAnalysis = async () => {
        try {
            const token = getAuthToken();

                    const initialQuestions = questions.filter(q => q.phase === PHASES.INITIAL && q.severity === "mandatory");
                    const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL && q.severity === "mandatory");
                    const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);

            const completedInitialQuestions = initialQuestions.filter(q => checkHas(completedQuestions, q._id));
            const completedEssentialQuestions = essentialQuestions.filter(q => checkHas(completedQuestions, q._id));
            const completedAdvancedQuestions = advancedQuestions.filter(q => checkHas(completedQuestions, q._id));

                    const newCompletedPhases = new Set();

                    if (completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0) {
                        newCompletedPhases.add('initial');
                    }

                    if (essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length) {
                        newCompletedPhases.add('essential');
                    }

                    if (advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length) {
                        newCompletedPhases.add('advanced');
                    }

            setCompletedPhases(newCompletedPhases);
            if (onCompletedPhasesUpdate) {
                onCompletedPhasesUpdate(newCompletedPhases);
            }

            const analysisArray = [];
            
            try {
                // Use the centralized apiService which has common promise-caching logic
                const newAnalysisData = await apiService.fetchAnalysisDataThroughBackend(selectedBusinessId);
                if (newAnalysisData && Array.isArray(newAnalysisData)) {
                    analysisArray.push(...newAnalysisData);
                }
            } catch (analysisErr) {
                console.warn("Failed to load from Analysis API", analysisErr);
            }

            if (onAnalysisDataLoad && analysisArray.length > 0) {
                onAnalysisDataLoad(analysisArray);
            }
        } catch (error) {
            console.error('Error loading existing analysis:', error);
        }
    };
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
                if (phase === 'initial') {
                    await onAnalysisGeneration(newCompletedSet);
                } else if (phase === 'essential') {
                    await onFullSwotGeneration(newCompletedSet);
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

    const getQuestionPhase = (questionId) => {
        const question = questions.find(q => q._id === questionId);
        return question ? question.phase : null;
    };

    const handleQuestionCompleted = async (questionId) => {
        const newCompletedSet = new Set([...completedQuestions, questionId]);

        const questionPhase = getQuestionPhase(questionId);

        if (!questionPhase) {
            console.warn('Could not determine phase for question:', questionId);
            return newCompletedSet;
        }

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
        } else if (questionPhase === 'advanced') {
            const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);
            const completedAdvancedQuestions = advancedQuestions.filter(q => newCompletedSet.has(q._id));
            const isAdvancedCompleted = advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length;

            if (isAdvancedCompleted && !completedPhases.has('advanced')) {
                phaseToTrigger = 'advanced';
            }
        }

        if (phaseToTrigger) {
            const newPhases = new Set([...completedPhases, phaseToTrigger]);
            setCompletedPhases(newPhases);
            onCompletedPhasesUpdate(newPhases);
            const nextPhaseMap = {
                initial: "essential",
                essential: "advanced",
            };
            const nextPhase = nextPhaseMap[phaseToTrigger];

            if (nextPhase) {
                setUnlockedPhase(nextPhase);
                setShowUnlockToast(true);
            } else {
                showToastMessage?.("🎉 All phases completed!", "success");
            }
            await handleSimplifiedPhaseCompletion(phaseToTrigger, newCompletedSet);
        }

        return newCompletedSet;
    };

    useEffect(() => {
        const phaseList = ['initial', 'essential', 'advanced'];
        const allDone = phaseList.every(p => completedPhases.has(p));
        if (allDone && !allPhasesCelebratedRef.current && completedPhases.size > 0) {
            allPhasesCelebratedRef.current = true;
            showToastMessage?.('🎉 All phases completed! You have unlocked all analyses.', 'success');
        }
    }, [completedPhases, showToastMessage]);


    const canRegenerateAnalysis = () => {
        return Object.values(userAnswers).some(answer => answer && String(answer).trim().length > 0);
    };

    const canGenerateFullSwot = () => {
        const essentialQuestions = questions.filter(q => q.phase === PHASES.ESSENTIAL);
        const completedEssentialQuestions = essentialQuestions.filter(q => checkHas(completedQuestions, q._id));
        return essentialQuestions.length > 0 && completedEssentialQuestions.length === essentialQuestions.length;
    };

    const canGenerateAdvancedPhase = () => {
        const advancedQuestions = questions.filter(q => q.phase === PHASES.ADVANCED);
        const completedAdvancedQuestions = advancedQuestions.filter(q => checkHas(completedQuestions, q._id));
        return advancedQuestions.length > 0 && completedAdvancedQuestions.length === advancedQuestions.length;
    };

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

    const loadAnalysisByPhase = async (phase) => {
        /*
        try {
            const token = getAuthToken();
            const data = await AnalysisService.getAnalysisByPhase(API_BASE_URL, token, selectedBusinessId, phase);
            return data;
        } catch (error) {
            console.error(`Error loading analysis for phase ${phase}:`, error);
            return [];
        }
        */
        return [];
    };

    const loadAnalysisByFilter = async (filter) => {
        /*
        try {
            const token = getAuthToken();
            const data = await AnalysisService.getAnalysisByFilter(API_BASE_URL, token, selectedBusinessId, filter);
            return data;
        } catch (error) {
            console.error(`Error loading analysis by filter:`, error);
            return [];
        }
        */
        return [];
    };
    return {
        completedPhases,
        PHASES,
        isPhaseCompleted: (phase) => isPhaseCompleted(phase, questions, userAnswers, completedQuestions),
        getUnlockedFeatures: () => getUnlockedFeatures(questions, userAnswers, completedQuestions, hasUploadedDocument),
        handleQuestionCompleted,
        canRegenerateAnalysis,
        canGenerateFullSwot,
        canGenerateAdvancedPhase,
        loadExistingAnalysis,
        regeneratePhase,
        createSimpleRegenerationHandler,
        loadAnalysisByPhase,
        loadAnalysisByFilter,
        isRegeneratingRef,
        unlockedPhase,
        showUnlockToast,
        setShowUnlockToast,
        loadCompletedQuestionsFromAPI // Adding to return object if needed elsewhere
    };
};

export default PhaseManager;

