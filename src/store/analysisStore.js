// src/store/analysisStore.js
import { create } from 'zustand';

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

  resetAnalysis: () => set({
    questions: [], questionsLoaded: false, userAnswers: {}, completedQuestions: [],
    swotAnalysis: null, purchaseCriteria: null, loyaltyNPS: null, portersData: null,
    pestelData: null, fullSwotData: null, competitiveAdvantage: null, strategicData: null,
    expandedCapability: null, strategicRadar: null, productivityData: null, maturityData: null,
    competitiveLandscape: null, coreAdjacency: null, profitabilityData: null,
    growthTrackerData: null, liquidityEfficiencyData: null, investmentPerformanceData: null,
    leverageRiskData: null, regenerating: {}, streamingText: {}, isStreaming: {},
  }),

  answeredCount: () => Object.keys(get().userAnswers).length,
  isRegenerating: (type) => get().regenerating[type] || false,
  isStreamingType: (type) => get().isStreaming[type] || false,
  getStreamingText: (type) => get().streamingText[type] || '',
}));
