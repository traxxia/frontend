import { useState, useCallback } from "react";
import axios from "axios";

export const useProjectOperations = (selectedBusinessId, onProjectCountChange) => {
  const getToken = () => sessionStorage.getItem("token");

  const fetchProjects = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        console.error("No token found");
        return null;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { business_id: selectedBusinessId },
        }
      );

      const fetched = res.data?.projects || [];
      if (onProjectCountChange) {
        onProjectCountChange(fetched.length);
      }

      return {
        projects: fetched,
        businessStatus: res.data?.business_status, // NEW: business-level status
        businessAccessMode: res.data?.business_access_mode,
        lockSummary: res.data?.ranking_lock_summary, // Now includes locked_users array
      };
    } catch (err) {
      console.error("Error fetching projects:", err);
      return null;
    }
  }, [selectedBusinessId, onProjectCountChange]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      const token = getToken();
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { success: true };
    } catch (err) {
      console.error("DELETE FAILED:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Failed to kill project."
      };
    }
  }, []);

  const createProject = useCallback(async (payload) => {
    try {
      const token = getToken();
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { success: true };
    } catch (err) {
      console.error("Project creation failed:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Project creation failed."
      };
    }
  }, []);

  const updateProject = useCallback(async (projectId, payload) => {
    try {
      const token = getToken();
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating project:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Error updating project."
      };
    }
  }, []);

  const launchProjects = useCallback(async (projectIds) => {
    try {
      const token = getToken();
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/launch`,
        { project_ids: projectIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Launch failed:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Failed to launch projects."
      };
    }
  }, []);

  return {
    fetchProjects,
    deleteProject,
    createProject,
    updateProject,
    launchProjects,
  };
};