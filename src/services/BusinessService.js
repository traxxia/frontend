import { BaseApiService } from './BaseApiService';

const businessCache = new Map();
const financialDocumentCache = new Map();

export class BusinessService extends BaseApiService {
  constructor(baseUrl) {
    super(baseUrl);
  }

  async getBusiness(businessId, forceRefresh = false) {
    if (!businessId) return null;
    const cacheKey = `business-${businessId}`;
    if (!forceRefresh && businessCache.has(cacheKey)) return businessCache.get(cacheKey);

    const business = await this.request(`/api/businesses/${businessId}`);
    businessCache.set(cacheKey, business);
    return business;
  }

  async getEligibleOwners(businessId) {
    try {
      return await this.request(`/api/businesses/${businessId}/eligible-owners`);
    } catch (error) {
      console.error('Error fetching eligible owners:', error);
      return { eligible_owners: [] };
    }
  }

  async fetchFinancialDocument(businessId) {
    if (!businessId) return null;
    const cacheKey = `doc-${businessId}`;
    if (financialDocumentCache.has(cacheKey)) return financialDocumentCache.get(cacheKey);

    try {
      const documentInfo = await this.request(`/api/businesses/${businessId}/financial-document`);
      if (!documentInfo.has_document) return null;
      financialDocumentCache.set(cacheKey, documentInfo.document);
      return documentInfo.document;
    } catch (error) {
      console.error('Error fetching financial document:', error);
      return null;
    }
  }

  async downloadFinancialDocument(businessId) {
    const response = await this.request(`/api/businesses/${businessId}/financial-document/download`, { raw: true });
    return await response.blob();
  }
}
