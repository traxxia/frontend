// Create this as a new file: src/services/analysisApiService.js

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthToken = () => sessionStorage.getItem('token');

class AnalysisApiService {
  
  // Save analysis result to backend
  static async saveAnalysis(sessionId, analysisType, analysisData, businessName) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          analysisType,
          analysisData,
          businessName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save ${analysisType} analysis`);
      }

      const result = await response.json();
       
      return result;
      
    } catch (error) {
      console.error(`❌ Error saving ${analysisType} analysis:`, error);
      throw error;
    }
  }

  // Get specific analysis type
  static async getAnalysis(analysisType, sessionId = null) {
    try {
      const token = getAuthToken();
      
      let url = `${API_BASE_URL}/api/analysis/${analysisType}`;
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // No analysis found - this is expected for new analyses
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to get ${analysisType} analysis`);
      }

      const result = await response.json();
       
      return result;
      
    } catch (error) {
      console.error(`❌ Error retrieving ${analysisType} analysis:`, error);
      throw error;
    }
  }

  // Get all analyses for current session
  static async getSessionAnalyses(sessionId) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/analysis/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get session analyses');
      }

      const result = await response.json();
       
      return result;
      
    } catch (error) {
      console.error('❌ Error retrieving session analyses:', error);
      throw error;
    }
  }

  // Get latest analyses for current user
  static async getLatestAnalyses() {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/analysis/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // No analyses found - return empty structure
        return {
          analyses: {},
          totalTypes: 0,
          availableTypes: []
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get latest analyses');
      }

      const result = await response.json();
       
      return result;
      
    } catch (error) {
      console.error('❌ Error retrieving latest analyses:', error);
      throw error;
    }
  }

  // Delete specific analysis
  static async deleteAnalysis(analysisType, sessionId = null) {
    try {
      const token = getAuthToken();
      
      let url = `${API_BASE_URL}/api/analysis/${analysisType}`;
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${analysisType} analysis`);
      }

      const result = await response.json();
       
      return result;
      
    } catch (error) {
      console.error(`❌ Error deleting ${analysisType} analysis:`, error);
      throw error;
    }
  }

  // Helper method to get analysis type from component name
  static getAnalysisType(componentName) {
    const typeMap = {
      'SwotAnalysis': 'swot',
      'CustomerSegmentation': 'customerSegmentation',
      'PurchaseCriteria': 'purchaseCriteria',
      'ChannelHeatmap': 'channelHeatmap',
      'LoyaltyNPS': 'loyaltyNPS',
      'CapabilityHeatmap': 'capabilityHeatmap'
    };
    return typeMap[componentName] || componentName.toLowerCase();
  }

  // Batch save multiple analyses
  static async saveMultipleAnalyses(sessionId, analysesData, businessName) {
    const results = [];
    const errors = [];

    for (const [analysisType, analysisData] of Object.entries(analysesData)) {
      try {
        const result = await this.saveAnalysis(sessionId, analysisType, analysisData, businessName);
        results.push({ analysisType, success: true, result });
      } catch (error) {
        errors.push({ analysisType, success: false, error: error.message });
      }
    }

    return { results, errors, successCount: results.length, errorCount: errors.length };
  }
}

export default AnalysisApiService;