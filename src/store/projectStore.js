// src/store/projectStore.js
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const checkAllAccessCache = new Map();
const teamRankingsCache = new Map();

export const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  teamRankings: [],
  aiRankings: [],
  accessControl: { hasRerankAccess: false, hasRankingAccess: false, projectsEditAccess: {} },
  lockSummary: { locked_users_count: 0, total_users: 0, locked_users: [] },
  businessStatus: 'draft',
  viewMode: 'projects', // 'projects' or 'ranking'
  isLoading: false,
  error: null,

  fetchProjects: async (businessId, options = {}) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    if (!options.silent) set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      
      const projects = response.data.projects || [];
      set({ 
        projects, 
        businessStatus: response.data.business_status || 'draft',
        lockSummary: response.data.ranking_lock_summary || { total_users: 0, locked_users_count: 0, locked_users: [] },
        isLoading: false 
      });
      return response.data;
    } catch (err) {
      if (!options.silent) set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  checkAllAccess: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;

    const cacheKey = `access-${businessId}`;
    if (checkAllAccessCache.has(cacheKey)) {
      return await checkAllAccessCache.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        set({ isLoading: true });
        const response = await axios.get(API_BASE_URL + '/api/projects/check-all-access', {
          headers: { Authorization: 'Bearer ' + token },
          params: { business_id: businessId }
        });
        set({
          accessControl: {
            hasRerankAccess: response.data.has_rerank_access || false,
            hasRankingAccess: response.data.has_ranking_access || false,
            projectsEditAccess: response.data.projects_edit_access || {},
          },
          isLoading: false
        });
        return response.data;
      } catch (err) {
        checkAllAccessCache.delete(cacheKey);
        set({ isLoading: false });
        console.error('Error checking project access:', err);
        throw err;
      }
    })();

    checkAllAccessCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  fetchTeamRankings: async (businessId, options = {}) => {
    const token = useAuthStore.getState().token;
    const userId = useAuthStore.getState().userId;
    if (!token || !businessId || !userId) return;

    const cacheKey = `rank-${businessId}-${userId}`;
    if (teamRankingsCache.has(cacheKey)) {
      const cachedData = await teamRankingsCache.get(cacheKey);
      set({ 
        projects: cachedData?.projects || [],
        businessStatus: cachedData?.business_status,
        lockSummary: cachedData?.ranking_lock_summary || { locked_users_count: 0, total_users: 0, locked_users: [] }
      });
      return cachedData;
    }

    const fetchPromise = (async () => {
      try {
        if (!options.silent) set({ isLoading: true });
        const response = await axios.get(API_BASE_URL + `/api/projects/rank/${userId}`, {
          headers: { Authorization: 'Bearer ' + token },
          params: { business_id: businessId }
        });
        set({ 
          projects: response.data.projects || [],
          businessStatus: response.data.business_status,
          lockSummary: response.data.ranking_lock_summary || { locked_users_count: 0, total_users: 0, locked_users: [] },
          ...(options.silent ? {} : { isLoading: false })
        });
        return response.data;
      } catch (err) {
        teamRankingsCache.delete(cacheKey);
        if (!options.silent) set({ isLoading: false });
        console.error('Error fetching team rankings:', err);
        throw err;
      }
    })();

    teamRankingsCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  checkAccess: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects/access', {
        headers: { Authorization: `Bearer ${token}` },
        params: { business_id: businessId }
      });
      set({
        accessControl: {
          hasRerankAccess: response.data.rerank_access || false,
          projectsEditAccess: response.data.projects_edit_access || {},
        }
      });
    } catch (err) { console.error('Error checking project access:', err); }
  },

  createProject: async (payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(API_BASE_URL + '/api/projects', payload, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set((state) => ({ projects: [...state.projects, response.data.project], isLoading: false }));
      return { success: true, project: response.data.project };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  updateProject: async (projectId, payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.patch(API_BASE_URL + '/api/projects/' + projectId, payload, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId || p.id === projectId ? response.data.project : p),
        selectedProject: state.selectedProject?._id === projectId ? response.data.project : state.selectedProject,
        isLoading: false,
      }));
      return { success: true, project: response.data.project };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  deleteProject: async (projectId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      await axios.delete(API_BASE_URL + '/api/projects/' + projectId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set((state) => ({
        projects: state.projects.filter(p => p._id !== projectId && p.id !== projectId),
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  launchProjects: async (projectIds) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(API_BASE_URL + '/api/projects/launch', { project_ids: projectIds }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchAdminRankings: async (businessId, adminUserId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects/admin-rank', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId, admin_user_id: adminUserId }
      });
      set({ aiRankings: response.data.projects || [] });
      return response.data.projects || [];
    } catch (err) {
      console.error('Error fetching admin rankings:', err);
      return [];
    }
  },

  saveRankings: async (businessId, rankings) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    set({ isLoading: true });
    try {
      const response = await axios.put(`${API_BASE_URL}/api/projects/rank`, {
        business_id: businessId,
        projects: rankings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  saveAIRankings: async (businessId, aiRankings) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/projects/ai-rankings`, {
        business_id: businessId,
        ai_rankings: aiRankings,
        model_version: "v1.0"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map aiRankings to the expected format for the store if needed
      const persistedRankings = aiRankings.map(r => ({
        project_id: r.project_id,
        rank: r.rank
      }));
      set({ aiRankings: response.data.projects || persistedRankings, isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  lockRanking: async (projectId) => {
    const token = useAuthStore.getState().token;
    if (!token || !projectId) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects/lock-rank`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { project_id: projectId },
        }
      );
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  reviewProject: async (projectId, data) => {
    const token = useAuthStore.getState().token;
    if (!token || !projectId) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/projects/${projectId}/review`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId || p.id === projectId ? response.data.project : p),
        isLoading: false
      }));
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  adhocUpdateProject: async (projectId, data) => {
    const token = useAuthStore.getState().token;
    if (!token || !projectId) return;
    set({ isLoading: true });
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/projects/${projectId}/adhoc-update`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId || p.id === projectId ? response.data.project : p),
        isLoading: false
      }));
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchGrantedAccess: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/granted-access`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { business_id: businessId },
      });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  revokeAccess: async (businessId, userId, accessType) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId || !userId) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/projects/revoke-access`, {
        business_id: businessId,
        user_id: userId,
        access_type: accessType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  setBusinessAccessMode: async (businessId, scope) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/api/projects/edit-access`, 
        { scope, business_id: businessId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  grantProjectEditAccess: async (businessId, projectId, collaboratorIds) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId || !projectId) return;
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/businesses/${businessId}/project/${projectId}/allowed-collaborators`, 
        { collaborator_ids: collaboratorIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  grantRankingAccess: async (businessId, collaboratorIds) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/businesses/${businessId}/allowed-ranking-collaborators`, 
        { collaborator_ids: collaboratorIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchConsensusAnalysis: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/consensus-analysis`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { business_id: businessId },
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchCollaboratorConsensus: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects/collaborator-consensus`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { business_id: businessId },
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  clearAIRankings: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/projects/ai-rankings`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { business_id: businessId }
      });
      set({ aiRankings: [] });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  callMLRankingAPI: async (projects) => {
    const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
    try {
      const projectList = projects.map(project => ({
        name: project.project_name,
        id: project._id
      }));

      const response = await axios.post(`${ML_API_BASE_URL}/rerank`, { projects: projectList });
      const processedRankings = response.data.rankings.map((item) => {
        let projectId = item.id;
        if (!projectId || !projects.find(p => p._id === projectId)) {
          const matchedProject = projects.find(p => p.project_name === item.name);
          if (matchedProject) projectId = matchedProject._id;
        }

        return {
          project_id: projectId,
          rank: item.rank,
          score: parseFloat((1.0 - (item.rank - 1) / projects.length).toFixed(4)),
          severity: item.severity,
        };
      }).filter(r => r.project_id);

      return { success: true, rankings: processedRankings };
    } catch (error) {
      return { success: false, error: 'ML ranking service temporarily unavailable' };
    }
  },

  selectProject: (project) => set({ selectedProject: project }),
  setViewMode: (mode) => set({ viewMode: mode }),
  clearProjects: () => set({ projects: [], selectedProject: null, teamRankings: [], aiRankings: [] }),
  projectCount: () => get().projects.length,
  getProjectById: (id) => get().projects.find(p => p._id === id || p.id === id),

  // Clears all module-level API caches so the next load fetches fresh data.
  // Call this before navigating to the Projects page after a kickstart.
  clearCache: (businessId) => {
    if (businessId) {
      checkAllAccessCache.delete(`access-${businessId}`);
      const userId = useAuthStore.getState().userId;
      if (userId) {
        teamRankingsCache.delete(`rank-${businessId}-${userId}`);
      }
    } else {
      checkAllAccessCache.clear();
      teamRankingsCache.clear();
    }
  },
}));
