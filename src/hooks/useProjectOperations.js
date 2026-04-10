import { useCallback } from "react";
import { useProjectStore } from "../store";

export const useProjectOperations = (selectedBusinessId, onProjectCountChange) => {
  const {
    fetchProjects: fetchProjectsStore,
    deleteProject: deleteProjectStore,
    createProject: createProjectStore,
    updateProject: updateProjectStore,
    launchProjects: launchProjectsStore
  } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    const data = await fetchProjectsStore(selectedBusinessId);
    if (data && onProjectCountChange) {
      onProjectCountChange(data.projects?.length || 0);
    }
    if (!data) return null;
    return {
      projects: data.projects || [],
      businessStatus: data.business_status,
      businessAccessMode: data.business_access_mode,
      lockSummary: data.ranking_lock_summary,
    };
  }, [selectedBusinessId, onProjectCountChange, fetchProjectsStore]);

  const deleteProject = useCallback(async (projectId) => {
    return await deleteProjectStore(projectId);
  }, [deleteProjectStore]);

  const createProject = useCallback(async (payload) => {
    return await createProjectStore(payload);
  }, [createProjectStore]);

  const updateProject = useCallback(async (projectId, payload) => {
    return await updateProjectStore(projectId, payload);
  }, [updateProjectStore]);

  const launchProjects = useCallback(async (projectIds) => {
    return await launchProjectsStore(projectIds);
  }, [launchProjectsStore]);

  return {
    fetchProjects,
    deleteProject,
    createProject,
    updateProject,
    launchProjects,
  };
};