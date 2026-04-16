import { useCallback } from "react";
import { useProjectStore, useAuthStore } from "../store";


export const useAccessControl = (selectedBusinessId) => {
  const { 
    accessControl, 
    checkAllAccess: checkAllAccessStore 
  } = useProjectStore();

  const getUserLimits = () => {
    return useAuthStore.getState().userLimits || { project: true };
  };

  const checkBusinessAccess = useCallback(async () => {
    return await checkAllAccessStore(selectedBusinessId);
  }, [selectedBusinessId, checkAllAccessStore]);

  const checkProjectsAccess = useCallback(
    async (projectIds) => {
      const data = await checkAllAccessStore(selectedBusinessId);
      return data?.projects_edit_access || {};
    },
    [selectedBusinessId, checkAllAccessStore]
  );

  const canEditProject = useCallback(
    (project, isEditor, myUserId, businessStatus, isArchived) => {
      const limits = getUserLimits();
      if (!limits.project || isArchived) return false;
      if (!project) return false;

      const status = project.status?.toLowerCase();
      if (['completed', 'scaled', 'killed'].includes(status)) return false;

      const isProjectLaunched = 
        project.launch_status?.toLowerCase() === 'launched' || 
        project.launch_status?.toLowerCase() === 'pending_launch' || 
        project.status?.toLowerCase() === 'launched';

      const isProjectActive = project.status?.toLowerCase() === 'active';

      if (businessStatus === "launched" || isProjectLaunched || isProjectActive) {
        return accessControl.projectsEditAccess[project._id] === true;
      }

      const isProjectDraft = !project.status || project.status.toLowerCase() === 'draft';
      if (isEditor && (businessStatus !== "launched" || isProjectDraft)) return true;

      if (businessStatus === "reprioritizing") {
        if (isEditor) return true;
        if (Array.isArray(project.allowed_collaborators) && project.allowed_collaborators.includes(myUserId)) {
          return true;
        }
      }

      return false;
    },
    [accessControl.projectsEditAccess]
  );

  const isReadOnlyMode = useCallback((isArchived) => {
    return !getUserLimits().project || isArchived;
  }, []);

  const checkAllAccess = useCallback(async () => {
    return await checkAllAccessStore(selectedBusinessId);
  }, [selectedBusinessId, checkAllAccessStore]);

  const canReviewProject = useCallback(
    (project, isAdmin, myUserId, isArchived) => {
      if (isArchived) return false;
      if (!project) return false;

      const status = project.status?.toLowerCase();
      if (['completed', 'scaled', 'killed'].includes(status)) return false;

      const isProjectLaunched = 
        project.launch_status?.toLowerCase() === 'launched' || 
        project.status?.toLowerCase() === 'launched' || 
        project.status?.toLowerCase() === 'active';
      if (!isProjectLaunched) return false;


      const isOwner = project.accountable_owner_id && project.accountable_owner_id.toString() === myUserId;
      return isOwner === true;
    },
    []
  );

  return {
    userHasRerankAccess: accessControl.hasRerankAccess,
    userHasRankingAccess: accessControl.hasRankingAccess,
    userHasProjectEditAccess: accessControl.projectsEditAccess,
    checkBusinessAccess,
    checkProjectsAccess,
    checkAllAccess,
    canEditProject,
    canReviewProject,
    isReadOnlyMode,
  };
};