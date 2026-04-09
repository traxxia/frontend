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
  accessControl: { hasRerankAccess: false, hasProjectEditAccess: false },
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
      set({ projects: response.data.projects || [], isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  createProject: async (businessId, projectData) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.post(API_BASE_URL + '/api/projects', { ...projectData, business_id: businessId }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set((state) => ({ projects: [...state.projects, response.data.project], isLoading: false }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  updateProject: async (projectId, projectData) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await axios.put(API_BASE_URL + '/api/projects/' + projectId, projectData, {
        headers: { Authorization: 'Bearer ' + token }
      });
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId || p.id === projectId ? response.data.project : p),
        selectedProject: state.selectedProject?._id === projectId ? response.data.project : state.selectedProject,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
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
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  fetchTeamRankings: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects/rankings', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      set({ teamRankings: response.data.rankings || [] });
    } catch (err) { console.error('Error fetching team rankings:', err); }
  },

  checkAccess: async (businessId) => {
    const token = useAuthStore.getState().token;
    if (!token || !businessId) return;
    try {
      const response = await axios.get(API_BASE_URL + '/api/projects/access', {
        headers: { Authorization: 'Bearer ' + token },
        params: { business_id: businessId }
      });
      set({
        accessControl: {
          hasRerankAccess: response.data.rerank_access || false,
          hasProjectEditAccess: response.data.project_edit_access || false,
        }
      });
    } catch (err) { console.error('Error checking project access:', err); }
  },

  selectProject: (project) => set({ selectedProject: project }),
  clearProjects: () => set({ projects: [], selectedProject: null, teamRankings: [], aiRankings: [] }),
  projectCount: () => get().projects.length,
  getProjectById: (id) => get().projects.find(p => p._id === id || p.id === id),
}));
