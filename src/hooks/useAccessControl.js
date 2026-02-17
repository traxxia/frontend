import { useState, useCallback } from "react";
import axios from "axios";

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
    (project, isEditor, myUserId, businessStatus, isArchived) => {
      // PROMPT: Essential users cannot edit projects (Downgrade Protocol)
      const userPlan = sessionStorage.getItem("userPlan");
      if (userPlan === 'essential' || isArchived) return false;

      if (!project) return false;

      // Admins can always edit (except truly locked launched projects)
      if (isEditor && businessStatus !== "launched") return true;

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
      // For launched projects, check if user has been granted access
      if (businessStatus === "launched") {
        return userHasProjectEditAccess[project._id] === true;
      }

      return false;
    },
    [userHasProjectEditAccess]
  );

  const isReadOnlyMode = useCallback((isArchived) => {
    const userPlan = sessionStorage.getItem("userPlan");
    return userPlan === 'essential' || isArchived;
  }, []);

  return {
    userHasRerankAccess,
    userHasProjectEditAccess,
    checkBusinessAccess,
    checkProjectsAccess,
    canEditProject,
    isReadOnlyMode,
  };
};