import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const saveAIRankings = async (businessId, aiRankings, modelVersion, metadata) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/projects/ai-rankings`,
      {
        business_id: businessId,
        ai_rankings: aiRankings,
        model_version: modelVersion || "mock-v1.0",
        metadata: metadata || {}
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to save AI rankings:", error);
    throw error;
  }
};

export const fetchAIRankings = async (businessId) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/projects/ai-rankings?business_id=${businessId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch AI rankings:", error);
    throw error;
  }
};

export const clearAIRankings = async (businessId) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.delete(
      `${API_URL}/api/projects/ai-rankings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          business_id: businessId
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to clear AI rankings:", error);
    throw error;
  }
};
export const callMLRankingAPI = async (projects) => {
  try {
    const projectList = projects.map(project => ({
      name: project.project_name,
      id:project._id
    }));

    const response = await axios.post(
      'https://traxxia-backend-ml.onrender.com/rerank',
      {
        projects: projectList
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    return {
      success: true,
      rankings: response.data.rankings.map((item, index) => ({
        project_id: item.id,
        rank: item.rank,
        score: parseFloat((1.0 - (item.rank - 1) / projects.length).toFixed(4)),
        severity: item.severity,
      }))
    };
  } catch (error) {
    throw new Error('ML ranking service temporarily unavailable');
  }
};

