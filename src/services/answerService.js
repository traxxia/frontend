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

export const answerService = {

    async analyzeStrategicDocumentsBackend(business_id) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/businesses/${business_id}/strategic-document/analyze`, {}, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing strategic documents on backend:', error);
            throw error;
        }
    },

    async createAnswer(business_id, question_id, answer, extraFields = {}) {
        try {
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
        try {
            const response = await axios.get(`${API_BASE_URL}/api/answers/business/${business_id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching business answers:', error);
            throw error;
        }
    },

    async updateAnswer(id, answer, extraFields = {}) {
        try {
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
    }
};
