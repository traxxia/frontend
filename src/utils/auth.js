// utils/auth.js - Simple auth helper functions

export const getAuthData = () => {
  return {
    token: sessionStorage.getItem('token'),
    userId: sessionStorage.getItem('userId'),
    userName: sessionStorage.getItem('userName'),
    userEmail: sessionStorage.getItem('userEmail'),
    userRole: sessionStorage.getItem('userRole'),
    latestVersion: sessionStorage.getItem('latestVersion'),
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
  };
};

export const isAuthenticated = () => {
  const token = sessionStorage.getItem('token');
  const userId = sessionStorage.getItem('userId');
  return !!(token && userId);
};

export const logout = () => {
  sessionStorage.clear();
  window.location.href = '/login';
};

export const redirectIfNotAuthenticated = () => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
};