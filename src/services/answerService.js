import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const answerService = {
    /**
     * Creates a new answer for a business and question.
     * @param {string} business_id 
     * @param {string} question_id 
     * @param {string} answer 
     */
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

    /**
     * Gets a specific answer by its ID.
     * @param {string} id 
     */
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

    /**
     * Retrieves all answers for a specific business.
     * @param {string} business_id 
     */
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

    /**
     * Updates an existing answer.
     * @param {string} id 
     * @param {string} answer 
     */
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
    }
};
