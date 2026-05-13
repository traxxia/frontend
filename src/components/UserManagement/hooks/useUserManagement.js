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
  
  const businessData = useMemo(() => [
    ...(businessesRaw?.businesses || []), 
    ...(businessesRaw?.collaborating_businesses || [])
  ], [businessesRaw]);

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

  return {
    users,
    companies,
    businessData,
    usage: usageData?.usage,
    loading: loadingUsers || loadingPlans || loadingCompanies || loadingBusinesses,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    isSubmitting,
    handleRoleUpdate,
    addUser,
    userRole
  };
};
