import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { AnalysisApiService } from '../services/analysisApiService';
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

  setQuestions: (questions) => set({ questions, questionsLoaded: true }),

  setUserAnswer: (questionId, answer) => set((state) => ({
    userAnswers: { ...state.userAnswers, [questionId]: answer },
    completedQuestions: answer
      ? [...new Set([...state.completedQuestions, questionId])]
      : state.completedQuestions.filter(id => id !== questionId),
  })),

  setAnalysisData: (type, data) => {
    const keyMap = {
      swot: 'swotAnalysis', purchaseCriteria: 'purchaseCriteria', loyaltyNPS: 'loyaltyNPS',
      porters: 'portersData', pestel: 'pestelData', fullSwot: 'fullSwotData',
      competitiveAdvantage: 'competitiveAdvantage', strategic: 'strategicData',
      expandedCapability: 'expandedCapability', strategicRadar: 'strategicRadar',
      productivity: 'productivityData', maturity: 'maturityData',
      competitiveLandscape: 'competitiveLandscape', coreAdjacency: 'coreAdjacency',
      profitability: 'profitabilityData', growthTracker: 'growthTrackerData',
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

  fetchAnalysisData: async (businessId) => {
    if (!businessId) return;
    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ questionsLoaded: false });
    try {
      const apiService = getApiService();
      const newsAnalysisData = await apiService.fetchAnalysisDataThroughBackend(businessId);
      
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
        productivity: 'productivityData', maturity: 'maturityData',
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

      set({ ...updates, questionsLoaded: true });
    } catch (err) {
      console.error('Failed to fetch analysis data:', err);
      set({ questionsLoaded: true });
    }
  },

  regeneratePhase: async (phase, questions, userAnswers, businessId, onToast) => {
    if (!businessId || !phase) return;
    set((state) => ({ 
      regenerating: { ...state.regenerating, [phase]: true },
      ...(phase === 'financial' ? {
        regenerating: { 
          ...state.regenerating, 
          profitability: true, growthTracker: true, liquidity: true, investment: true, leverage: true 
        }
      } : {})
    }));

    try {
      const apiService = getApiService();
      const stateSetters = {};
      // Create transient setters for the service to call
      Object.keys(apiService.getStateSetterName('swot')).forEach(type => {
        stateSetters[apiService.getStateSetterName(type)] = (data) => get().setAnalysisData(type, data);
      });

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
      set((state) => ({ 
        regenerating: { ...state.regenerating, [phase]: false }
      }));
    }
  },

  regenerateIndividualAnalysis: async (type, questions, userAnswers, businessId, onToast) => {
    if (!businessId || !type) return;
    set((state) => ({ regenerating: { ...state.regenerating, [type]: true } }));
    try {
      const apiService = getApiService();
      const result = await apiService.callAnalysisEndpoint(type, { questions, userAnswers, businessId });
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

  fetchKickstartData: async (businessId) => {
    if (!businessId) return;
    try {
      const apiService = getApiService();
      const data = await apiService.getKickstartData(businessId);
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

