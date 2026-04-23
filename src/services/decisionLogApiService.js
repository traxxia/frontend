import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/decision-logs`;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const decisionLogApiService = {
  // Get decision logs for a specific business (all projects within the business)
  getBusinessLogs: async (businessId, options = {}) => {
    const token = getToken();
    if (!token || !businessId) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.project_id) params.append('project_id', options.project_id);
    if (options.log_type) params.append('log_type', options.log_type);
    if (options.execution_state) params.append('execution_state', options.execution_state);
    if (options.status) params.append('status', options.status);
    if (options.from) params.append('from', options.from);
    if (options.to) params.append('to', options.to);
    if (options.sort_order) params.append('sort_order', options.sort_order);

    try {
      const response = await fetch(`${API_BASE_URL}/api/decision-logs/business/${businessId}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
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
