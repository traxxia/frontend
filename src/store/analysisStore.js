import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { AnalysisApiService, PHASE_API_CONFIG } from '../services/analysisApiService';
import { useUIStore } from './uiStore';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL;
const initialState = {
  questions: [],
  questionsLoaded: false,
  userAnswers: {},
  answersDetails: {},
  completedQuestions: [],
  swotAnalysis: null,
  portersData: null,
  pestelData: null,
  fullSwotData: null,
  competitiveAdvantage: null,
  strategicData: null,
  expandedCapability: null,
  strategicRadar: null,
  productivityData: null,
  maturityData: null,
  competitiveLandscape: null,
  coreAdjacency: null,
  profitabilityData: null,
  growthTrackerData: null,
  liquidityEfficiencyData: null,
  investmentPerformanceData: null,
  leverageRiskData: null,
  financialBalanceData: null,
  costEfficiencyData: null,
  operationalEfficiencyData: null,
  financialPerformanceData: null,
  channelEffectivenessData: null,
  channelHeatmapData: null,
  customerSegmentationData: null,
  cultureProfileData: null,
  strategicGoalsData: null,
  kickstartData: null,
  isInitialLoading: false,
  isAnalysisLoading: false,
  lastFetchedBusinessId: null,
  lastSkipFinancial: false,
  lastSkipQuestions: false,
};

const getApiService = () => {
  const token = useAuthStore.getState().token;
  const setStoreLoading = useUIStore.getState().setLoading;
  return new AnalysisApiService(
    ML_API_BASE_URL,
    API_BASE_URL,
    () => token,
    setStoreLoading
  );
};

export const useAnalysisStore = create((set, get) => ({
  questions: [],
  questionsLoaded: false,
  userAnswers: {},
  answersDetails: {},
  completedQuestions: [],

  swotAnalysis: null,
  portersData: null,
  pestelData: null,
  fullSwotData: null,
  competitiveAdvantage: null,
  strategicData: null,
  expandedCapability: null,
  strategicRadar: null,
  productivityData: null,
  maturityData: null,
  competitiveLandscape: null,
  coreAdjacency: null,

  profitabilityData: null,
  growthTrackerData: null,
  liquidityEfficiencyData: null,
  investmentPerformanceData: null,
  leverageRiskData: null,
  financialBalanceData: null,
  costEfficiencyData: null,
  operationalEfficiencyData: null,
  financialPerformanceData: null,
  channelEffectivenessData: null,
  channelHeatmapData: null,
  customerSegmentationData: null,
  cultureProfileData: null,
  strategicGoalsData: null,
  kickstartData: null,

  regenerating: {},
  streamingText: {},
  isStreaming: {},
  isInitialLoading: false,
  isAnalysisLoading: false,
  lastFetchedBusinessId: null,

  setQuestions: (questions) => set({ questions }),
  setQuestionsLoaded: (loaded) => set({ questionsLoaded: loaded }),

  setUserAnswer: (questionId, answer) => set((state) => {
    const newDetails = { ...state.answersDetails };
    const currentDetail = newDetails[questionId] || {};
    const oldAnswer = state.userAnswers[questionId] || null;

    const newPreviousAnswer = answer === oldAnswer
      ? (currentDetail.previous_answer !== undefined ? currentDetail.previous_answer : null)
      : oldAnswer;

    const newUserAnswer = answer === oldAnswer
      ? (currentDetail.user_answer !== undefined ? currentDetail.user_answer : null)
      : answer;

    newDetails[questionId] = {
      ...currentDetail,
      ai_answer: currentDetail.ai_answer !== undefined && currentDetail.ai_answer !== null && currentDetail.ai_answer !== ''
        ? currentDetail.ai_answer
        : (oldAnswer || ''),
      previous_answer: newPreviousAnswer,
      user_answer: newUserAnswer
    };

    return {
      userAnswers: { ...state.userAnswers, [questionId]: answer },
      answersDetails: newDetails,
      completedQuestions: answer
        ? [...new Set([...state.completedQuestions, questionId])]
        : state.completedQuestions.filter(id => id !== questionId),
    };
  }),

  initializeBusinessData: ({ questions, userAnswers, completedQuestions, answersDetails, analysisUpdates = {}, questionsLoaded = true }) =>
    set((state) => ({
      questions: questions !== undefined ? questions : state.questions,
      userAnswers: userAnswers !== undefined ? userAnswers : state.userAnswers,
      answersDetails: answersDetails !== undefined ? answersDetails : state.answersDetails,
      completedQuestions: completedQuestions !== undefined ? completedQuestions : state.completedQuestions,
      ...analysisUpdates,
      questionsLoaded
    })),

  setAnalysisData: (type, data) => {
    const keyMap = {
      swot: 'swotAnalysis',
      porters: 'portersData', pestel: 'pestelData', fullSwot: 'fullSwotData',
      competitiveAdvantage: 'competitiveAdvantage', strategic: 'strategicData',
      expandedCapability: 'expandedCapability', strategicRadar: 'strategicRadar',
      productivityMetrics: 'productivityData', maturityScore: 'maturityData',
      competitiveLandscape: 'competitiveLandscape', coreAdjacency: 'coreAdjacency',
      profitabilityAnalysis: 'profitabilityData', growthTracker: 'growthTrackerData',
      liquidityEfficiency: 'liquidityEfficiencyData', investmentPerformance: 'investmentPerformanceData',
      leverageRisk: 'leverageRiskData',
      financialBalance: 'financialBalanceData',
      costEfficiency: 'costEfficiencyData',
      operationalEfficiency: 'operationalEfficiencyData',
      financialPerformance: 'financialPerformanceData',
      channelEffectiveness: 'channelEffectivenessData',
      channelHeatmap: 'channelHeatmapData',
      customerSegmentation: 'customerSegmentationData',
      cultureProfile: 'cultureProfileData',
      strategicGoals: 'strategicGoalsData',
    };
    const key = keyMap[type];
    if (key) set({ [key]: data });
  },

  setRegenerating: (type, isRegenerating) => set((state) => ({
    regenerating: { ...state.regenerating, [type]: isRegenerating }
  })),

  setStreaming: (type, text, isStreaming) => set((state) => ({
    streamingText: { ...state.streamingText, [type]: text },
    isStreaming: { ...state.isStreaming, [type]: isStreaming }
  })),

  resetAnalysis: () => set(initialState),

  fetchAnalysisData: async (businessId, skipLoadingFlag = false, forceRefresh = false, skipReset = false) => {
    if (!businessId) return;
    
    // Guard against duplicate concurrent requests or redundant fetches
    const state = get();
    if (state.lastFetchedBusinessId === businessId && !forceRefresh) {
      // If we already have some data and questions are loaded, skip
      if (state.questionsLoaded && (state.swotAnalysis || state.portersData || state.strategicData)) {
        return;
      }
    }

    if (state.isAnalysisLoading && state.lastFetchedBusinessId === businessId && !forceRefresh) {
      return;
    }

    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ isAnalysisLoading: true, lastFetchedBusinessId: businessId });
    if (!skipLoadingFlag) set({ questionsLoaded: false });
    if (!skipReset) {
      const resetData = {
        swotAnalysis: null,
        portersData: null, pestelData: null, fullSwotData: null,
        competitiveAdvantage: null, strategicData: null,
        expandedCapability: null, strategicRadar: null,
        productivityData: null, maturityData: null,
        competitiveLandscape: null, coreAdjacency: null,
        profitabilityData: null, growthTrackerData: null,
        liquidityEfficiencyData: null, investmentPerformanceData: null,
        leverageRiskData: null,
        financialBalanceData: null, costEfficiencyData: null,
        operationalEfficiencyData: null, financialPerformanceData: null,
        channelEffectivenessData: null, channelHeatmapData: null,
        customerSegmentationData: null, cultureProfileData: null,
        strategicGoalsData: null,
      };
      set(resetData);
    }

    try {
      const apiService = getApiService();
      const newsAnalysisData = await apiService.fetchAnalysisDataThroughBackend(businessId, forceRefresh);

      const latestAnalysisByType = {};
      newsAnalysisData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach(analysis => {
          if (!latestAnalysisByType[analysis.analysis_type]) {
            latestAnalysisByType[analysis.analysis_type] = analysis;
          }
        });

      const updates = {};
      const keyMap = {
        swot: 'swotAnalysis',
        porters: 'portersData', pestel: 'pestelData', fullSwot: 'fullSwotData',
        competitiveAdvantage: 'competitiveAdvantage', strategic: 'strategicData',
        expandedCapability: 'expandedCapability', strategicRadar: 'strategicRadar',
        productivityMetrics: 'productivityData', maturityScore: 'maturityData',
        competitiveLandscape: 'competitiveLandscape', coreAdjacency: 'coreAdjacency',
        profitabilityAnalysis: 'profitabilityData', growthTracker: 'growthTrackerData',
        liquidityEfficiency: 'liquidityEfficiencyData', investmentPerformance: 'investmentPerformanceData',
        leverageRisk: 'leverageRiskData',
        financialBalance: 'financialBalanceData', costEfficiency: 'costEfficiencyData',
        operationalEfficiency: 'operationalEfficiencyData', financialPerformance: 'financialPerformanceData',
        channelEffectiveness: 'channelEffectivenessData', channelHeatmap: 'channelHeatmapData',
        customerSegmentation: 'customerSegmentationData', cultureProfile: 'cultureProfileData',
        strategicGoals: 'strategicGoalsData',
      };

      Object.entries(latestAnalysisByType).forEach(([type, analysis]) => {
        let dataKey = keyMap[type];
        if (!dataKey) {
          try {
            const key = apiService.getStateSetterName(type).replace('set', '');
            dataKey = key.charAt(0).toLowerCase() + key.slice(1);
          } catch(e) {
            dataKey = type;
          }
        }

        updates[dataKey] = type === 'swot'
          ? (typeof analysis.analysis_data === 'string' ? analysis.analysis_data : JSON.stringify(analysis.analysis_data))
          : analysis.analysis_data;
      });

      set({ ...updates, isAnalysisLoading: false });
      if (!skipLoadingFlag) set({ questionsLoaded: true });
      return updates;
    } catch (err) {
      console.error('Failed to fetch analysis data:', err);
      set({ questionsLoaded: true, isAnalysisLoading: false });
    }
  },

  fetchInitialSetupData: async (businessId, options = {}) => {
    if (!businessId) return;
    
    const { isInitialLoading, lastFetchedBusinessId, lastSkipFinancial, lastSkipQuestions, questions, questionsLoaded } = get();
    
    // Only skip if we are already loading the same business with compatible skip options
    // OR if we already have the data and aren't forcing a refresh
    if (lastFetchedBusinessId === businessId && !options.forceRefresh) {
      const hasQuestions = questions.length > 0 || questionsLoaded;
      const hasAnswers = Object.keys(get().userAnswers).length > 0;
      
      if (hasQuestions && hasAnswers) {
        // If we also need financial and already have it (or it's skipped), we can skip
        if (options.skipFinancial || get().documentInfo) {
          return;
        }
      }

      if (isInitialLoading) {
        const financialCompatible = lastSkipFinancial === options.skipFinancial || (!lastSkipFinancial && options.skipFinancial);
        const questionsCompatible = lastSkipQuestions === options.skipQuestions || (!lastSkipQuestions && options.skipQuestions);
        
        if (financialCompatible && questionsCompatible) {
          return;
        }
      }
    }

    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ 
      isInitialLoading: true, 
      lastFetchedBusinessId: businessId,
      lastSkipFinancial: !!options.skipFinancial,
      lastSkipQuestions: !!options.skipQuestions
    });

    try {
      const apiService = getApiService();
      
      // Fetch questions if not already loaded AND not skipping
      if (get().questions.length === 0 && !options.skipQuestions) {
        const questionsResponse = await fetch(`${API_BASE_URL}/api/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const questionsData = await questionsResponse.json();
        set({ questions: questionsData.questions || [] });
      }

      // Fetch answers and optionally document info in parallel
      const tasks = [apiService.getFreshAnswersData(businessId)];
      if (!options.skipFinancial) {
        tasks.push(apiService.fetchFinancialDocument(businessId));
      }

      const results = await Promise.all(tasks);
      const answersResult = results[0];
      const docInfo = options.skipFinancial ? null : results[1];

      set({ 
        userAnswers: answersResult.freshAnswers || {},
        answersDetails: answersResult.freshAnswersDetails || {},
        completedQuestions: Array.from(answersResult.freshCompletedSet || []),
        questionsLoaded: true,
        isInitialLoading: false
      });

      return { answersResult, docInfo };
    } catch (err) {
      console.error('Failed to fetch initial setup data:', err);
      set({ questionsLoaded: true, isInitialLoading: false });
    }
  },

  regeneratePhase: async (phase, questions, userAnswers, businessId, onToast) => {
    if (!businessId || !phase) return;
    const phaseTypes = PHASE_API_CONFIG[phase] || [];
    const regenerationUpdates = { [phase]: true };
    phaseTypes.forEach(type => { regenerationUpdates[type] = true; });

    set((state) => ({
      regenerating: { ...state.regenerating, ...regenerationUpdates }
    }));

    try {
      const apiService = getApiService();
      const stateSetters = {};
      const analysisTypes = [
        'swot', 'porters', 'pestel',
        'fullSwot', 'competitiveAdvantage', 'strategic', 'expandedCapability',
        'strategicRadar', 'productivityMetrics', 'maturityScore', 'competitiveLandscape',
        'coreAdjacency', 'profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency',
        'investmentPerformance', 'leverageRisk'
      ];

      analysisTypes.forEach(type => {
        const setterName = apiService.getStateSetterName(type);
        if (setterName) {
          stateSetters[setterName] = (data) => get().setAnalysisData(type, data);
        }
      });

      stateSetters.setRegenerating = (type, isRegenerating) => get().setRegenerating(type, isRegenerating);
      if (userAnswers && userAnswers.uploadedFile) {
        stateSetters.uploadedFile = userAnswers.uploadedFile;
      }

      await apiService.handlePhaseCompletion(
        phase,
        questions,
        userAnswers,
        businessId,
        stateSetters,
        onToast
      );
    } catch (err) {
      console.error(`Failed to regenerate phase ${phase}:`, err);
      onToast?.(`Failed to regenerate ${phase} phase.`, "error");
    } finally {
      const phaseTypes = PHASE_API_CONFIG[phase] || [];
      const completionUpdates = { [phase]: false };
      phaseTypes.forEach(type => { completionUpdates[type] = false; });

      set((state) => ({
        regenerating: { ...state.regenerating, ...completionUpdates }
      }));
    }
  },

  regenerateCustomTypes: async (types, questions, userAnswers, businessId, onToast) => {
    if (!businessId || !types || types.length === 0) return;
    
    const regenerationUpdates = {};
    types.forEach(type => { regenerationUpdates[type] = true; });

    set((state) => ({
      regenerating: { ...state.regenerating, ...regenerationUpdates }
    }));

    try {
      const apiService = getApiService();
      const stateSetters = {};
      const allPossibleTypes = [
        'swot', 'porters', 'pestel',
        'fullSwot', 'competitiveAdvantage', 'strategic', 'expandedCapability',
        'strategicRadar', 'productivityMetrics', 'maturityScore', 'competitiveLandscape',
        'coreAdjacency', 'profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency',
        'investmentPerformance', 'leverageRisk'
      ];

      allPossibleTypes.forEach(type => {
        const setterName = apiService.getStateSetterName(type);
        if (setterName) {
          stateSetters[setterName] = (data) => get().setAnalysisData(type, data);
        }
      });

      stateSetters.setRegenerating = (type, isRegenerating) => get().setRegenerating(type, isRegenerating);

      await apiService.handleCustomTypesCompletion(
        types,
        questions,
        userAnswers,
        businessId,
        stateSetters,
        onToast
      );
    } catch (err) {
      console.error(`Failed to regenerate custom types:`, err);
      onToast?.(`Failed to regenerate insights.`, "error");
    } finally {
      const completionUpdates = {};
      types.forEach(type => { completionUpdates[type] = false; });

      set((state) => ({
        regenerating: { ...state.regenerating, ...completionUpdates }
      }));
    }
  },

  regenerateIndividualAnalysis: async (type, questions, userAnswers, businessId, onToast, uploadedFile = null) => {
    if (!businessId || !type) return;
    set((state) => ({ regenerating: { ...state.regenerating, [type]: true } }));
    try {
      const apiService = getApiService();
      const stateSetters = {};
      const setterName = apiService.getStateSetterName(type);
      if (setterName) {
        stateSetters[setterName] = (data) => get().setAnalysisData(type, data);
      }
      if (uploadedFile) {
        stateSetters.uploadedFile = uploadedFile;
      } else if (userAnswers && userAnswers.uploadedFile) {
        stateSetters.uploadedFile = userAnswers.uploadedFile;
      }

      const payload = {
        questions,
        userAnswers,
        selectedBusinessId: businessId,
        stateSetters
      };

      const result = await apiService.callAnalysisEndpoint(type, payload);
      get().setAnalysisData(type, result.data);
      await apiService.saveAnalysisToBackend(result.data, type, businessId);
      onToast?.(`${type} regenerated successfully!`, "success");
    } catch (err) {
      console.error(`Failed to regenerate ${type}:`, err);
      onToast?.(`Failed to regenerate ${type}.`, "error");
    } finally {
      set((state) => ({ regenerating: { ...state.regenerating, [type]: false } }));
    }
  },

  fetchKickstartData: async (businessId, forceRefresh = false) => {
    if (!businessId) return;
    try {
      const apiService = getApiService();
      const data = await apiService.getKickstartData(businessId, forceRefresh);
      set({ kickstartData: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch kickstart data:', err);
      throw err;
    }
  },

  kickstartProject: async (payload) => {
    try {
      const apiService = getApiService();
      const result = await apiService.kickstartProject(payload);
      return result;
    } catch (err) {
      console.error('Failed to kickstart project:', err);
      throw err;
    }
  },

  answeredCount: () => Object.keys(get().userAnswers).length,
  isRegenerating: (type) => get().regenerating[type] || false,
  isStreamingType: (type) => get().isStreaming[type] || false,
  getStreamingText: (type) => get().streamingText[type] || '',
}));
