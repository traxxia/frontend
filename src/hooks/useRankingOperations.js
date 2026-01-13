import { useCallback } from "react";
import axios from "axios";

export const useRankingOperations = (selectedBusinessId, companyAdminIds) => {
  const getToken = () => sessionStorage.getItem("token");

  const fetchTeamRankings = useCallback(async () => {
    try {
      const token = getToken();
      const userId = sessionStorage.getItem("userId");

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/rank/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { business_id: selectedBusinessId },
        }
      );

      return {
        rankings: res.data.projects || [],
        lockSummary: res.data?.ranking_lock_summary,
      };
    } catch (err) {
      console.error("Failed to fetch team rankings", err);
      return null;
    }
  }, [selectedBusinessId]);

  const fetchAdminRankings = useCallback(async () => {
    try {
      const token = getToken();
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/admin-rank`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            business_id: selectedBusinessId,
            admin_user_id: companyAdminIds[0],
          },
        }
      ); 
      return res.data.projects || [];
    } catch (err) {
      console.error("Failed to fetch admin rankings", err);
      return [];
    }
  }, [selectedBusinessId, companyAdminIds]);

  const lockRanking = useCallback(async (projectId) => {
    try {
      const token = getToken();
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/lock-rank`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { project_id: projectId },
        }
      );
      return true;
    } catch (err) {
      console.error("Failed to lock ranking", err);
      return false;
    }
  }, []);

  return {
    fetchTeamRankings,
    fetchAdminRankings,
    lockRanking,
  };
};