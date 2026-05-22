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

    async analyzeDocuments(business_id, files) {
        try {
            const formData = new FormData();
            if (Array.isArray(files)) {
                files.forEach(file => {
                    formData.append('files', file);
                });
            } else {
                formData.append('files', files);
            }
            
            const mlUrl = import.meta.env.VITE_ML_BACKEND_URL || 'https://trax-qa1-ml-b4e6gmc4hjdncdg2.centralus-01.azurewebsites.net';
            
            const response = await axios.post(`${mlUrl}/document-qa`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing documents:', error);
            throw error;
        }
    },

    async createAnswer(business_id, question_id, answer) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/answers`, {
                business_id,
                question_id,
                answer
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

    async updateAnswer(id, answer) {
        try {
            const response = await axios.put(`${API_BASE_URL}/api/answers/${id}`, {
                answer
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
