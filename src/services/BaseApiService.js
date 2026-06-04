import { useAuthStore } from '../store/authStore';

export class BaseApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getAuthToken() {
    return useAuthStore.getState().token;
  }

  getCommonHeaders(extraHeaders = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...extraHeaders
    };

    // Observatory headers logic
    try {
      const authState = JSON.parse(
        sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage') || '{}'
      );
      const isObservatory = authState?.state?.isObservatory === true;
      headers['x-is-observatory'] = isObservatory ? 'true' : 'false';

      // Note: x-business-id and x-stage should be added by sub-services if needed
    } catch (_) {
      // Ignore sessionStorage errors
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const baseUrl = (this.baseUrl && this.baseUrl !== 'undefined') ? this.baseUrl : (import.meta.env.VITE_BACKEND_URL || '');
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers = this.getCommonHeaders(options.headers);
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      error.status = response.status;
      error.response = { data: errorData };
      throw error;
    }

    if (options.raw) return response;
    return await response.json();
  }
}
