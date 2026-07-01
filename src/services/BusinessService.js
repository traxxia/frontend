import { BaseApiService } from './BaseApiService';

const businessCache = new Map();

export class BusinessService extends BaseApiService {
  constructor(baseUrl) {
    super(baseUrl);
  }

  async getBusiness(businessId, forceRefresh = false) {
    if (!businessId) return null;
    const cacheKey = `business-${businessId}`;
    if (!forceRefresh && businessCache.has(cacheKey)) return businessCache.get(cacheKey);

    const promise = this.request(`/api/businesses/${businessId}`).catch(err => {
      businessCache.delete(cacheKey);
      throw err;
    });
    businessCache.set(cacheKey, promise);
    return promise;
  }

  async getEligibleOwners(businessId) {
    try {
      return await this.request(`/api/businesses/${businessId}/eligible-owners`);
    } catch (error) {
      console.error('Error fetching eligible owners:', error);
      return { eligible_owners: [] };
    }
  }

  async updatePmfStage(businessId, pmfStage) {
    if (!businessId || !pmfStage) return null;
    const cacheKey = `business-${businessId}`;
    businessCache.delete(cacheKey); // invalidate cache
    return await this.request(`/api/businesses/${businessId}/pmf-stage`, {
      method: 'PATCH',
      body: JSON.stringify({ pmf_stage: pmfStage })
    });
  }
}
