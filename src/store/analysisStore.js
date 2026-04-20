import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { AnalysisApiService, PHASE_API_CONFIG } from '../services/analysisApiService';
import { useUIStore } from './uiStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;

// Initial state for resetting
const initialState = {
  questions: [],
  questionsLoaded: false,
  userAnswers: {},
  completedQuestions: [],
  swotAnalysis: null,
  purchaseCriteria: null,
  loyaltyNPS: null,
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
  completedQuestions: [],

  swotAnalysis: null,
  purchaseCriteria: null,
  loyaltyNPS: null,
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

  setQuestions: (questions) => set({ questions }),
  setQuestionsLoaded: (loaded) => set({ questionsLoaded: loaded }),

  setUserAnswer: (questionId, answer) => set((state) => ({
    userAnswers: { ...state.userAnswers, [questionId]: answer },
    completedQuestions: answer
      ? [...new Set([...state.completedQuestions, questionId])]
      : state.completedQuestions.filter(id => id !== questionId),
  })),

  initializeBusinessData: ({ questions, userAnswers, completedQuestions, analysisUpdates = {}, questionsLoaded = true }) => 
    set((state) => ({
      questions: questions !== undefined ? questions : state.questions,
      userAnswers: userAnswers !== undefined ? userAnswers : state.userAnswers,
      completedQuestions: completedQuestions !== undefined ? completedQuestions : state.completedQuestions,
      ...analysisUpdates,
      questionsLoaded
    })),

  setAnalysisData: (type, data) => {
    const keyMap = {
      swot: 'swotAnalysis', purchaseCriteria: 'purchaseCriteria', loyaltyNPS: 'loyaltyNPS',
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

  fetchAnalysisData: async (businessId, skipLoadingFlag = false, forceRefresh = false) => {
    if (!businessId) return;
    const { token } = useAuthStore.getState();
    if (!token) return;

    if (!skipLoadingFlag) set({ questionsLoaded: false });
    
    // Always reset the analysis-related state when fetching for a potentially different business
    // or when forcing a refresh. This prevents data "bleeding" between different business contexts.
    const resetData = {
      swotAnalysis: null, purchaseCriteria: null, loyaltyNPS: null,
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
        swot: 'swotAnalysis', purchaseCriteria: 'purchaseCriteria', loyaltyNPS: 'loyaltyNPS',
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

      set({ ...updates });
      if (!skipLoadingFlag) set({ questionsLoaded: true });
      return updates;
    } catch (err) {
      console.error('Failed to fetch analysis data:', err);
      set({ questionsLoaded: true });
    }
  },

  regeneratePhase: async (phase, questions, userAnswers, businessId, onToast) => {
    if (!businessId || !phase) return;

    // Set both the phase and all its constituent analysis types as regenerating
    const phaseTypes = PHASE_API_CONFIG[phase] || [];
    const regenerationUpdates = { [phase]: true };
    phaseTypes.forEach(type => { regenerationUpdates[type] = true; });

    set((state) => ({ 
      regenerating: { ...state.regenerating, ...regenerationUpdates }
    }));

    try {
      const apiService = getApiService();
      const stateSetters = {};
      // Create transient setters for the service to call for all analysis types
      const analysisTypes = [
        'swot', 'purchaseCriteria', 'loyaltyNPS', 'porters', 'pestel', 
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
      
      // Include uploaded file if available in the arguments or global context
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

  regenerateIndividualAnalysis: async (type, questions, userAnswers, businessId, onToast, uploadedFile = null) => {
    if (!businessId || !type) return;
    set((state) => ({ regenerating: { ...state.regenerating, [type]: true } }));
    try {
      const apiService = getApiService();
      
      // Prepare stateSetters for the individual analysis
      const stateSetters = {};
      const setterName = apiService.getStateSetterName(type);
      if (setterName) {
        stateSetters[setterName] = (data) => get().setAnalysisData(type, data);
      }
      
      // Include uploaded file if available
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

