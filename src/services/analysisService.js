
export const AnalysisService = {
    /**
     * Upsert analysis data (Create or Update)
     * @param {string} apiBaseUrl - Backend API base URL
     * @param {string} token - Auth token
     * @param {object} data - Analysis data { business_id, phase, analysis_type, analysis_name, analysis_data }
     * @returns {Promise<object>} - Response data
     */
    async upsertAnalysis(apiBaseUrl, token, data) {
        const response = await fetch(`${apiBaseUrl}/api/analysis`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(error.error || `Failed to upsert analysis: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Get all analysis for a business
     * @param {string} apiBaseUrl 
     * @param {string} token 
     * @param {string} businessId 
     * @returns {Promise<Array>}
     */
    /*
    async getAnalysis(apiBaseUrl, token, businessId) {
        const response = await fetch(`${apiBaseUrl}/api/analysis/business/${businessId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch analysis: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];
    },
    */

    /**
     * Get analysis by phase
     * @param {string} apiBaseUrl 
     * @param {string} token 
     * @param {string} businessId 
     * @param {string} phase 
     * @returns {Promise<Array>}
     */
    /*
    async getAnalysisByPhase(apiBaseUrl, token, businessId, phase) {
        const response = await fetch(`${apiBaseUrl}/api/analysis/business/${businessId}/phase/${phase}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch analysis by phase: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];
    },
    */

    /**
     * Get analysis by filter
     * @param {string} apiBaseUrl 
     * @param {string} token 
     * @param {string} businessId 
     * @param {object} filter - { type, name }
     * @returns {Promise<Array>}
     */
    /*
    async getAnalysisByFilter(apiBaseUrl, token, businessId, filter) {
        const queryParams = new URLSearchParams(filter).toString();
        const response = await fetch(`${apiBaseUrl}/api/analysis/business/${businessId}/filter?${queryParams}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch analysis by filter: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];
    }
    */
};
