// src/store/projectStore.js
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  teamRankings: [],
  aiRankings: [],
  accessControl: { hasRerankAccess: false, projectsEditAccess: {} },
  lockSummary: { locked_users_count: 0, total_users: 0, locked_users: [] },
  businessStatus: 'draft',
  isLoading: false,
  error: null,

  fetchProjects: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      
      const projects = response.data.projects || [];
      set({ 
        projects, 
        businessStatus: response.data.business_status || 'draft',
        isLoading: false 
      });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  checkAllAccess: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects/check-all-access', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      set({
        accessControl: {
          hasRerankAccess: response.data.has_rerank_access || false,
          projectsEditAccess: response.data.projects_edit_access || {},
        }
      });
      return response.data;
    } catch (err) {
      console.error('Error checking project access:', err);
    }
  },

  fetchTeamRankings: async (businessId) => {
    const token = useAuthStore.getState().token;
    const userId = useAuthStore.getState().userId;
    if (!token || !businessId || !userId) return;
    try {
      const response = await axios.get(API_BASE_URL + `/api/projects/rank/${userId}`, {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      set({ 
        projects: response.data.projects || [],
        businessStatus: response.data.business_status,
        lockSummary: response.data.ranking_lock_summary || { locked_users_count: 0, total_users: 0, locked_users: [] },
      });
      return response.data;
    } catch (err) {
      console.error('Error fetching team rankings:', err);
    }
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

  selectProject: (project) => set({ selectedProject: project }),
  clearProjects: () => set({ projects: [], selectedProject: null, teamRankings: [], aiRankings: [] }),
  projectCount: () => get().projects.length,
  getProjectById: (id) => get().projects.find(p => p._id === id || p.id === id),
}));
