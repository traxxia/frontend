import { useState, useCallback } from "react";
import axios from "axios";
import { getUserLimits } from '../utils/authUtils';

export const useAccessControl = (selectedBusinessId) => {
  const [userHasRerankAccess, setUserHasRerankAccess] = useState(false);
  const [userHasProjectEditAccess, setUserHasProjectEditAccess] = useState({});

  // Check access for business level only
  const checkBusinessAccess = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      const params = {
        business_id: selectedBusinessId,
      };

      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/check-access`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      setUserHasRerankAccess(res.data.has_rerank_access);

      return res.data;
    } catch (err) {
      console.error("Failed to check business access:", err);
      return {
        has_rerank_access: false,
      };
    }
  }, [selectedBusinessId]);

  // Batch check access for multiple launched projects at once
  const checkProjectsAccess = useCallback(
    async (projectIds) => {
      if (!projectIds || projectIds.length === 0) return;

      try {
        const token = sessionStorage.getItem("token");

        // Make parallel requests for all projects
        const requests = projectIds.map((projectId) =>
          axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/projects/check-access`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                business_id: selectedBusinessId,
                project_id: String(projectId),
              },
            }
          )
        );

        const responses = await Promise.all(requests);

        // Update state with all results at once
        const accessMap = {};
        responses.forEach((res, index) => {
          accessMap[String(projectIds[index])] = res.data.has_project_edit_access;
        });

        setUserHasProjectEditAccess(accessMap);

        return accessMap;
      } catch (err) {
        console.error("Failed to batch check projects access:", err);
        return {};
      }
    },
    [selectedBusinessId]
  );

  const canEditProject = useCallback(
    (project, isEditor, myUserId, businessStatus, isArchived, isAdmin) => {
      // PROMPT: Essential users cannot edit projects (Downgrade Protocol)
      if (!getUserLimits().project || isArchived) return false;

      if (!project) return false;

      const isProjectLaunched = 
        project.launch_status?.toLowerCase() === 'launched' || 
        project.launch_status?.toLowerCase() === 'pending_launch' || 
        project.status?.toLowerCase() === 'launched';
      const isProjectActive = project.status?.toLowerCase() === 'active';

      // For launched projects, check if user has been granted access (admins always have true from backend)
      if (businessStatus === "launched" || isProjectLaunched || isProjectActive) {

        return userHasProjectEditAccess[project._id] === true;
      }

      // Admins, Collaborators, and Users can edit if project is Draft or business is not launched
      const isProjectDraft = !project.status || project.status.toLowerCase() === 'draft';
      if (isEditor && (businessStatus !== "launched" || isProjectDraft)) return true;

      // For reprioritizing projects
      if (businessStatus === "reprioritizing") {
        if (isEditor) return true;

        if (
          Array.isArray(project.allowed_collaborators) &&
          project.allowed_collaborators.includes(myUserId)
        ) {
          return true;
        }
      }

      return false;
    },
    [userHasProjectEditAccess]
  );

  const isReadOnlyMode = useCallback((isArchived) => {
    return !getUserLimits().project || isArchived;
  }, []);

  const checkAllAccess = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/check-all-access`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { business_id: selectedBusinessId },
        }
      );

      setUserHasRerankAccess(res.data.has_rerank_access);
      setUserHasProjectEditAccess(res.data.projects_edit_access || {});

      return res.data;
    } catch (err) {
      console.error("Failed to check all access:", err);
      return {
        has_rerank_access: false,
        projects_edit_access: {},
      };
    }
  }, [selectedBusinessId]);

  const canReviewProject = useCallback(
    (project, isAdmin, myUserId, isArchived) => {
      if (isArchived) return false;
      if (!project) return false;

      const isProjectLaunched = project.launch_status?.toLowerCase() === 'launched' || project.status?.toLowerCase() === 'launched';
      if (!isProjectLaunched) return false;

      if (isAdmin) return true;

      const isOwner = project.accountable_owner_id && project.accountable_owner_id.toString() === myUserId;
      return isOwner === true;
    },
    []
  );

  return {
    userHasRerankAccess,
    userHasProjectEditAccess,
    checkBusinessAccess,
    checkProjectsAccess,
    checkAllAccess,
    canEditProject,
    canReviewProject,
    isReadOnlyMode,
  };
};