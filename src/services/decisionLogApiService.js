// Force reload
import axios from "axios";
import { useAuthStore } from "../store";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/decision-logs`;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const decisionLogApiService = {
  getBusinessLogs: async (businessId, options = {}) => {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    try {
      const response = await axios.get(`${API_BASE}/business/${businessId}`, {
        headers: getAuthHeaders(),
        params: options,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching business decision logs:', error);
      throw error;
    }
  },
  async createDecisionLog(projectId, payload) {
    const response = await axios.post(`${API_BASE}/${projectId}/logs`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getProjectLogs(projectId, params = {}) {
    const response = await axios.get(`${API_BASE}/${projectId}/logs`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  async getProjectTimeline(projectId, params = {}) {
    const response = await axios.get(`${API_BASE}/${projectId}/timeline`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  async getDecisionDetails(decisionLogId) {
    const response = await axios.get(`${API_BASE}/${decisionLogId}/details`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateDecisionStatus(decisionLogId, status) {
    const response = await axios.patch(
      `${API_BASE}/${decisionLogId}`,
      { status },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  async getAllLogs(params = {}) {
    const response = await axios.get(API_BASE, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },
};
