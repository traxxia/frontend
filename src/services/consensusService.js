import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const fetchConsensusAnalysis = async (businessId) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/projects/consensus-analysis?business_id=${businessId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch consensus analysis:", error);
    throw error;
  }
};

export const fetchCollaboratorConsensus = async (businessId) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/projects/collaborator-consensus?business_id=${businessId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch collaborator consensus:", error);
    throw error;
  }
};