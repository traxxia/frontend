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