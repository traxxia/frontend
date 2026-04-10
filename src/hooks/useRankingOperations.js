import { useCallback } from "react";
import axios from "axios";
import { useProjectStore, useAuthStore } from "../store";

export const useRankingOperations = (selectedBusinessId, companyAdminIds) => {
  const {
    fetchTeamRankings: fetchTeamRankingsStore,
    fetchAdminRankings: fetchAdminRankingsStore
  } = useProjectStore();
  const token = useAuthStore(state => state.token);

  const fetchTeamRankings = useCallback(async () => {
    const data = await fetchTeamRankingsStore(selectedBusinessId);
    if (!data) return null;
    return {
      rankings: data.projects || [],
      businessStatus: data.business_status,
      businessAccessMode: data.business_access_mode,
      lockSummary: data.ranking_lock_summary,
    };
  }, [selectedBusinessId, fetchTeamRankingsStore]);

  const fetchAdminRankings = useCallback(async () => {
    const adminUserId = companyAdminIds?.[0];
    if (!adminUserId) return [];
    return await fetchAdminRankingsStore(selectedBusinessId, adminUserId);
  }, [selectedBusinessId, companyAdminIds, fetchAdminRankingsStore]);

  const lockRanking = useCallback(async (projectId) => {
    try {
      if (!token) return { success: false, error: "No token found" };
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/lock-rank`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { project_id: projectId },
        }
      );
      return { success: true };
    } catch (err) {
      console.error("Failed to lock ranking", err);
      return {
        success: false,
        error: err.response?.data?.error || "Failed to lock ranking"
      };
    }
  }, [token]);

  return {
    fetchTeamRankings,
    fetchAdminRankings,
    lockRanking,
  };
};