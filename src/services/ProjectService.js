import { BaseApiService } from './BaseApiService';

const projectsCache = new Map();

export class ProjectService extends BaseApiService {
  constructor(baseUrl) {
    super(baseUrl);
  }

  async getProjects(businessId, forceRefresh = false) {
    if (!businessId) return [];
    const cacheKey = `projects-${businessId}`;
    if (!forceRefresh && projectsCache.has(cacheKey)) return projectsCache.get(cacheKey);

    try {
      const data = await this.request(`/api/projects?business_id=${businessId}`);
      const projects = data.projects || [];
      projectsCache.set(cacheKey, projects);
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async kickstartProject(payload) {
    const data = await this.request('/api/pmf/kickstart', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const businessId = payload.businessId || payload.selectedBusinessId;
    if (businessId) {
      projectsCache.delete(`projects-${businessId}`);
    }
    return data;
  }

  async saveRankings(businessId, rankingPayload) {
    return await this.request('/api/projects/rankings', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, rankings: rankingPayload })
    });
  }
}
