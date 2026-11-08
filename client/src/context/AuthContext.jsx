import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('campushire_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('campushire_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
        localStorage.removeItem('campushire_token');
      }
    } catch (err) {
      console.warn('Failed to fetch user session:', err.response?.data?.message || err.message);
      // Only invalidate token if server explicitly returned 401 Unauthorized
      if (err.response && err.response.status === 401) {
        setUser(null);
        localStorage.removeItem('campushire_token');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const getApiError = (err, fallback) => {
    if (err.response) {
      if (typeof err.response.data === 'object' && err.response.data?.message) {
        return err.response.data.message;
      }
      if (err.response.status === 503) {
        return err.response.data?.message || 'Database service is warming up. Please retry in a few moments.';
      }
      if (err.response.status === 504) {
        return 'Server request timed out. Please retry.';
      }
      if (err.response.status === 404) {
        return 'Backend API service is not reachable (404 Not Found). The backend service may still be deploying on Render.';
      }
      if (err.response.status >= 500) {
        return `Backend server error (${err.response.status}). Please check database connectivity.`;
      }
      return `Request failed with HTTP status ${err.response.status}.`;
    }
    if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      return 'Network Error: Cannot connect to backend server. Render service may be waking from cold sleep.';
    }
    return fallback || err.message || 'An unexpected authentication error occurred.';
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;
        localStorage.setItem('campushire_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        toast.success(`Welcome back, ${receivedUser.name}!`);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      const msg = getApiError(err, 'Invalid email or password.');
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (registrationData) => {
    try {
      const response = await api.post('/auth/register', registrationData);
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;
        localStorage.setItem('campushire_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        toast.success('Registration completed successfully! Welcome to CampusHire.');
        return { success: true, user: receivedUser };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      const msg = getApiError(err, 'Registration failed. Please check your details.');
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('campushire_token');
    setToken(null);
    setUser(null);
    toast.info('You have logged out successfully.');
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isStudent = user?.role === 'STUDENT';
  const isRecruiter = user?.role === 'RECRUITER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isStudent,
        isRecruiter,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
