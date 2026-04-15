import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Hook to fetch all businesses for the current user.
 * Replaces manual useEffect-based fetching in Dashboard and Projects components.
 */
export const useBusinesses = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If the server returns the legacy flat-array format, wrap it for backward compat
      if (Array.isArray(res.data)) {
        return { businesses: res.data, collaborating_businesses: [] };
      }

      const filterActive = (list) =>
        (list || []).filter(
          (b) =>
            (b.status || '').toLowerCase() !== 'deleted'
        );

      return {
        businesses: filterActive(res.data.businesses),
        collaborating_businesses: filterActive(res.data.collaborating_businesses),
        deleted_businesses: res.data.deleted_businesses || [],
        overall_stats: res.data.overall_stats,
      };
    },
    enabled: !!token,
    staleTime: 0, // Always fresh so collaborators see newly assigned businesses immediately
    refetchOnMount: 'always',
  });
};

/**
 * Hook to fetch subscription plan details and usage limits.
 */
export const usePlanDetails = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['planDetails'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/subscription/plan-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Auto-sync frontend auth limits so the user doesn't have to logout/login
      // to see new tabs when their subscription plan is upgraded behind the scenes
      if (res.data?.plan_limits) {
        useAuthStore.getState().updateUser({ userLimits: res.data.plan_limits });
      }
      
      return res.data;
    },
    enabled: !!token,
    staleTime: 0, // Fresh every time for admin/subscription view
  });
};

/**
 * Hook to fetch access control settings for a specific business.
 */
export const useAccessControlQuery = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['accessControl', businessId],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/access-control`, {
        params: { business_id: businessId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token && !!businessId,
    staleTime: 0, // Fresh every time for admin access control
  });
};

/**
 * Hook to fetch global questions.
 */
export const useGlobalQuestions = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['globalQuestions'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.questions || [];
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes (static content)
  });
};

/**
 * Hook to fetch conversations for a business.
 */
export const useConversations = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['conversations', businessId],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/conversations${businessId ? `?business_id=${businessId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
};


/**
 * Hook to fetch all projects for a specific business.
 */
export const useProjects = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['projects', businessId],
    queryFn: async () => {
      const { useProjectStore } = await import('../store');
      const data = await useProjectStore.getState().fetchProjects(businessId, { silent: true });
      return data.projects || [];
    },
    enabled: !!token && !!businessId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

/**
 * Hook to fetch team ranking summary (lock status) for a specific business.
 * Replaces the broken useTeamRankings that pointed to a non-existent endpoint.
 */
export const useRankingsSummary = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['rankingsSummary', businessId],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/rankings/summary`, {
        params: { business_id: businessId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token && !!businessId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

/**
 * Hook to fetch detailed team rankings for a specific business.
 * Note: Pointing to the correct backend route if needed, otherwise use useRankingsSummary for progress.
 */
export const useTeamRankings = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['teamRankings', businessId],
    queryFn: async () => {
      // If we need the full consensus analysis, this should probably call the consensus endpoint
      const res = await axios.get(`${BACKEND_URL}/api/projects/collaborator-consensus`, {
        params: { business_id: businessId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token && !!businessId,
  });
};

/**
 * Hook to fetch academy article content (markdown).
 */
export const useAcademyArticle = (articlePath) => {
  return useQuery({
    queryKey: ['academy', articlePath],
    queryFn: async () => {
      const res = await fetch(`/academy-content/${articlePath}`);
      if (!res.ok) {
        throw new Error(`Failed to load article: ${res.statusText}`);
      }
      return await res.text();
    },
    enabled: !!articlePath,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch all pricing plans.
 */
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/plans`);
      return res.data.plans || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (static)
  });
};

/**
 * Hook to fetch all companies (public list).
 */
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/companies`);
      return res.data.companies || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch all users for admin management.
 */
export const useAdminUsers = (companyId = null) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['adminUsers', companyId],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        params: companyId ? { company_id: companyId } : {},
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.users || [];
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to fetch all businesses for admin management.
 */
export const useAdminBusinesses = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['adminBusinesses'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/admin/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.businesses || [];
    },
    enabled: !!token,
    staleTime: 0,              // Always consider data stale
    refetchOnMount: 'always',  // Always refetch when component mounts
  });
};

/**
 * Hook to fetch stale projects for admin dashboard.
 */
export const useStaleProjects = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['staleProjects'],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/admin/stale-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.staleProjects || [];
    },
    enabled: !!token,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch collaborators for a specific business/project context.
 */
export const useCompanyCollaborators = (businessId) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['collaborators', businessId],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/businesses/${businessId}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.collaborators || [];
    },
    enabled: !!token && !!businessId,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch paginated audit trail data.
 */
export const useAuditTrailQuery = (page = 1, limit = 10, filters = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['auditTrail', page, limit, filters],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/admin/audit-trail`, {
        params: { page, limit, ...filters },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
};


