import { BaseApiService } from './BaseApiService';

const pmfCache = new Map();

export class PmfService extends BaseApiService {
  constructor(baseUrl) {
    super(baseUrl);
  }

  async savePMFOnboardingData(businessId, onboardingData) {
    pmfCache.delete(`pmf-${businessId}`);
    pmfCache.delete(`exec-${businessId}`);
    
    return await this.request('/api/pmf-analysis/onboarding', {
      method: 'POST',
      body: JSON.stringify({ businessId, onboardingData })
    });
  }

  async getPMFAnalysis(businessId, force = false) {
    if (!businessId) return null;
    const cacheKey = `pmf-${businessId}`;
    if (!force && pmfCache.has(cacheKey)) return pmfCache.get(cacheKey);

    const fetchPromise = (async () => {
      try {
        return await this.request(`/api/pmf-analysis/${businessId}`);
      } catch (error) {
        pmfCache.delete(cacheKey);
        if (error.status === 404) return null;
        throw error;
      }
    })();

    pmfCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async savePMFExecutiveSummary(businessId, summary) {
    pmfCache.delete(`exec-${businessId}`);
    return await this.request(`/api/pmf-analysis/${businessId}/executive-summary`, {
      method: 'POST',
      body: JSON.stringify({ summary })
    });
  }

  async updatePriorityName(businessId, priorityIndex, newTitle) {
    pmfCache.delete(`exec-${businessId}`);
    return await this.request(`/api/pmf-analysis/${businessId}/executive-summary/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priorityIndex, newTitle })
    });
  }

  async getPMFExecutiveSummary(businessId, force = false) {
    if (!businessId) return null;
    const cacheKey = `exec-${businessId}`;
    if (!force && pmfCache.has(cacheKey)) return pmfCache.get(cacheKey);

    const fetchPromise = (async () => {
      try {
        return await this.request(`/api/pmf-analysis/${businessId}/executive-summary`);
      } catch (error) {
        pmfCache.delete(cacheKey);
        if (error.status === 404) return null;
        throw error;
      }
    })();

    pmfCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async savePMFInsights(businessId, insights) {
    pmfCache.delete(`pmf-${businessId}`);
    const insightsData = insights?.insights || insights;
    return await this.request(`/api/pmf-analysis/${businessId}/insights`, {
      method: 'POST',
      body: JSON.stringify({ insights: insightsData })
    });
  }
}
