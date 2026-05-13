import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { usePlanDetails, useAdminUsers, useCompanies, useBusinesses, useCompanyCollaborators, useProjects } from "@/hooks/useQueries";
import { useAuthStore, useProjectStore } from "@/store";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { token, userRole } = useAuthStore();
  
  const { data: usageData, isLoading: loadingPlans } = usePlanDetails();
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const { data: businessesRaw, isLoading: loadingBusinesses } = useBusinesses();
  
  // Project Access specific states
  const [accessBusinessId, setAccessBusinessId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
  const [accessType, setAccessType] = useState("reRanking");

  const { data: collaboratorData = [], isLoading: loadingCollaborators } = useCompanyCollaborators(accessBusinessId);
  const { data: projectData = [], isLoading: loadingProjects } = useProjects(accessBusinessId);

  const businessData = useMemo(() => [
    ...(businessesRaw?.businesses || []), 
    ...(businessesRaw?.collaborating_businesses || [])
  ], [businessesRaw]);

  // Derived specialized business lists
  const allBusinesses = useMemo(() => 
    businessData.filter(b => {
      const s = (b.status || "").toLowerCase().trim();
      const am = (b.access_mode || "").toLowerCase().trim();
      const isDeleted = s === "deleted" || am === "deleted";
      const isArchived = s === "archived" || am === "archived";
      const isInactive = s === "inactive" || am === "inactive" || am === "hidden";
      return !isDeleted && !isArchived && !isInactive;
    }), 
    [businessData]
  );

  const launchedBusinesses = useMemo(() =>
    businessData.filter(b => {
      const s = (b.status || "").toLowerCase().trim();
      const am = (b.access_mode || "").toLowerCase().trim();
      const isDeleted = s === "deleted" || am === "deleted";
      const isArchived = s === "archived" || am === "archived";
      const isInactive = s === "inactive" || am === "inactive" || am === "hidden";
      const isLaunched = s === "launched" || b.has_launched_projects === true;
      return !isDeleted && !isArchived && !isInactive && isLaunched;
    }),
    [businessData]
  );

  const projects = useMemo(() => {
    return (projectData || []).filter(p => {
      const s = (p.status || "").toLowerCase().trim().replace(/[-_\s]/g, "");
      const isArchivedOrDeleted = s === "deleted" || s === "archived" || p.access_mode === "archived" || p.access_mode === "hidden";
      return (s === "active" || s === "atrisk" || s === "paused") && !isArchivedOrDeleted;
    });
  }, [projectData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleUpdate = useCallback(async (userId, role) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });
      queryClient.invalidateQueries({ queryKey: ["accessControl"] });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Failed to update role" };
    }
  }, [token, queryClient]);

  const addUser = useCallback(async (payload) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/admin/users`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Failed to add user" };
    } finally {
      setIsSubmitting(false);
    }
  }, [token, queryClient]);

  const handleAssign = useCallback(async (businessId, userId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/businesses/${businessId}/collaborators`, { user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["collaborators", businessId] });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Failed to assign user" };
    }
  }, [token, queryClient]);

  const handleGiveProjectAccess = useCallback(async () => {
    const { setBusinessAccessMode, grantProjectEditAccess, grantRankingAccess } = useProjectStore.getState();
    const tasks = [];
    if (accessType === "reRanking") {
      tasks.push(setBusinessAccessMode(accessBusinessId, "reRanking"));
      tasks.push(grantRankingAccess(accessBusinessId, selectedCollaboratorIds));
    } else if (accessType === "projectEdit") {
      tasks.push(grantProjectEditAccess(accessBusinessId, selectedProjectId, selectedCollaboratorIds));
    }

    try {
      await Promise.all(tasks);
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["projects", accessBusinessId] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.error || "Failed to give access" };
    }
  }, [accessType, accessBusinessId, selectedCollaboratorIds, selectedProjectId, queryClient]);

  return {
    users,
    companies,
    businessData,
    allBusinesses,
    launchedBusinesses,
    projects,
    collaborators: collaboratorData,
    usage: usageData?.usage,
    loading: loadingUsers || loadingPlans || loadingCompanies || loadingBusinesses,
    loadingCollaborators,
    loadingProjects,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    isSubmitting,
    handleRoleUpdate,
    addUser,
    handleAssign,
    handleGiveProjectAccess,
    userRole,
    // Access states
    accessBusinessId, setAccessBusinessId,
    selectedProjectId, setSelectedProjectId,
    selectedCollaboratorIds, setSelectedCollaboratorIds,
    accessType, setAccessType
  };
};
