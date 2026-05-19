const analysisRequestCache = new Map();

export const AnalysisService = {

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

    async getAnalysis(apiBaseUrl, token, businessId, forceRefresh = false) {
        if (!businessId) return [];

        const cacheKey = `analysis-${businessId}`;
        if (!forceRefresh && analysisRequestCache.has(cacheKey)) {
            return await analysisRequestCache.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
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
            } catch (error) {
                analysisRequestCache.delete(cacheKey);
                console.error('Error fetching analysis data:', error);
                throw error;
            }
        })();

        analysisRequestCache.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

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
};
