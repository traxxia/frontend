import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const getAuthToken = () => useAuthStore.getState().token;

export const useUserHistory = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = useCallback((term, role) => {
    let result = [...users];
    if (term) {
      result = result.filter(u => 
        u.name?.toLowerCase().includes(term.toLowerCase()) || 
        u.email?.toLowerCase().includes(term.toLowerCase())
      );
    }
    if (role !== "All Roles") {
      result = result.filter(u => (u.role_name || u.role) === role);
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users: filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm: (term) => {
      setSearchTerm(term);
      applyFilters(term, selectedRole);
    },
    selectedRole,
    setSelectedRole: (role) => {
      setSelectedRole(role);
      applyFilters(searchTerm, role);
    },
    currentPage,
    setCurrentPage,
    refresh: loadUsers
  };
};
