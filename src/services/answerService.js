import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

const answersCache = new Map();

const clearAnswersCache = (business_id) => {
    if (business_id) {
        answersCache.delete(business_id);
    } else {
        answersCache.clear();
    }
};

export const answerService = {

    async analyzeStrategicDocumentsBackend(business_id, answers) {
        try {
            clearAnswersCache(business_id);
            const response = await axios.post(`${API_BASE_URL}/api/businesses/${business_id}/strategic-document/analyze`, { answers }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error saving strategic documents analysis on backend:', error);
            throw error;
        }
    },

    async createAnswer(business_id, question_id, answer, extraFields = {}) {
        try {
            clearAnswersCache(business_id);
            const response = await axios.post(`${API_BASE_URL}/api/answers`, {
                business_id,
                question_id,
                answer,
                ...extraFields
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    },

    async getAnswerById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/answers/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching answer:', error);
            throw error;
        }
    },

    async getAnswersByBusiness(business_id) {
        if (!business_id) return null;
        let answersPromise = answersCache.get(business_id);
        if (!answersPromise) {
            answersPromise = axios.get(`${API_BASE_URL}/api/answers/business/${business_id}`, {
                headers: getAuthHeaders()
            }).then(response => response.data).catch(error => {
                answersCache.delete(business_id);
                throw error;
            });
            answersCache.set(business_id, answersPromise);
        }
        return answersPromise;
    },

    async updateAnswer(id, answer, extraFields = {}) {
        try {
            clearAnswersCache();
            const response = await axios.put(`${API_BASE_URL}/api/answers/${id}`, {
                answer,
                ...extraFields
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error updating answer:', error);
            throw error;
        }
    },

    async bulkCreateAnswers(business_id, answers) {
        try {
            clearAnswersCache(business_id);
            const response = await axios.post(`${API_BASE_URL}/api/answers/bulk`, {
                business_id,
                answers
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error bulk creating answers:', error);
            throw error;
        }
    },

    async bulkUpdateAnswers(business_id, answers) {
        try {
            clearAnswersCache(business_id);
            const response = await axios.put(`${API_BASE_URL}/api/answers/bulk`, {
                business_id,
                answers
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error bulk updating answers:', error);
            throw error;
        }
    },

    async downloadStrategicDocument(business_id, filename) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/businesses/${business_id}/strategic-document/${filename}/download`, {
                headers: getAuthHeaders(),
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading strategic document:', error);
            throw error;
        }
    },

    async analyzeStrategicDocumentsML(files) {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file, file.name);
            });

            const mlUrl = import.meta.env.VITE_ML_BACKEND_URL || 'https://trax-qa1-ml-b4e6gmc4hjdncdg2.centralus-01.azurewebsites.net';
            const response = await axios.post(`${mlUrl}/document-qa`, formData, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error in analyzeStrategicDocumentsML:', error);
            throw error;
        }
    },

    async getConfigLimits() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/config/limits`);
            return response.data;
        } catch (error) {
            console.error('Error fetching config limits:', error);
            throw error;
        }
    },

    async getSessionByBusiness(business_id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sessions/business/${business_id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching session:', error);
            throw error;
        }
    },

    async extractFinancialSummary(formData) {
        try {
            const mlUrl = import.meta.env.VITE_ML_BACKEND_URL || 'https://trax-qa1-ml-b4e6gmc4hjdncdg2.centralus-01.azurewebsites.net';
            const response = await axios.post(`${mlUrl}/financial-summary-extract`, formData, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error extracting financial summary:', error);
            throw error;
        }
    },

    async saveRawSession(businessId, status, financialMetrics) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/sessions/save-raw`, {
                businessId,
                status,
                strategicAnswers: [],
                financialMetrics
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error saving raw session:', error);
            throw error;
        }
    },

    async syncFinancial(business_id) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/sessions/business/${business_id}/sync-financial`, {}, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error syncing financial data:', error);
            throw error;
        }
    },

    async updateSession(business_id, financialMetrics) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/sessions/business/${business_id}/update-session`, {
                financialMetrics
            }, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error updating session:', error);
            throw error;
        }
    },

    async getStrategicDocuments(business_id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/businesses/${business_id}/strategic-documents`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching strategic documents:', error);
            throw error;
        }
    },

    async uploadStrategicDocument(business_id, file) {
        try {
            const formData = new FormData();
            formData.append('document', file);
            const response = await axios.put(`${API_BASE_URL}/api/businesses/${business_id}/strategic-document`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading strategic document:', error);
            throw error;
        }
    },

    async deleteStrategicDocument(business_id, filename) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/businesses/${business_id}/strategic-document/${filename}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting strategic document:', error);
            throw error;
        }
    }
};
