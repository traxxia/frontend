import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const DEFAULTS = {
  pmfFlow: 'gpt-4o-mini',
  enrichment: 'gpt-4o-mini',
  documentQa: 'gpt-oss-120b',
  simpleSwot: 'gpt-oss-120b',
  purchaseCriteria: 'gpt-4o',
  loyaltyNps: 'gpt-4o',
  expandedCapability: 'gpt-4o',
  strategicRadar: 'gpt-4o',
  maturityScoring: 'gpt-4o',
  competitiveAdvantage: 'gpt-4o',
  strategicPositioning: 'gpt-oss-120b',
  productivityMetrics: 'gpt-oss-120b',
  coreAdjacency: 'gpt-oss-120b',
};

export const useModelSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,
  loading: false,
  error: null,

  loadSettings: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          set({
            pmfFlow: data.data.pmfFlow || DEFAULTS.pmfFlow,
            enrichment: data.data.enrichment || DEFAULTS.enrichment,
            documentQa: data.data.documentQa || DEFAULTS.documentQa,
            simpleSwot: data.data.simpleSwot || DEFAULTS.simpleSwot,
            purchaseCriteria: data.data.purchaseCriteria || DEFAULTS.purchaseCriteria,
            loyaltyNps: data.data.loyaltyNps || DEFAULTS.loyaltyNps,
            expandedCapability: data.data.expandedCapability || DEFAULTS.expandedCapability,
            strategicRadar: data.data.strategicRadar || DEFAULTS.strategicRadar,
            maturityScoring: data.data.maturityScoring || DEFAULTS.maturityScoring,
            competitiveAdvantage: data.data.competitiveAdvantage || DEFAULTS.competitiveAdvantage,
            strategicPositioning: data.data.strategicPositioning || DEFAULTS.strategicPositioning,
            productivityMetrics: data.data.productivityMetrics || DEFAULTS.productivityMetrics,
            coreAdjacency: data.data.coreAdjacency || DEFAULTS.coreAdjacency,
            isLoaded: true,
            loading: false,
            error: null
          });
        } else {
          set({ loading: false, error: 'Failed to parse model settings' });
        }
      } else {
        set({ loading: false, error: 'Failed to load model settings' });
      }
    } catch (err) {
      console.error('Error loading model settings:', err);
      set({ loading: false, error: err.message });
    }
  },

  saveSettings: async (settings) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          set({
            ...settings,
            isLoaded: true,
            loading: false,
            error: null
          });
        } else {
          throw new Error(data.error || 'Failed to save settings');
        }
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.error('Error saving model settings:', err);
      set({ loading: false, error: err.message });
      throw err;
    }
  }
}));
