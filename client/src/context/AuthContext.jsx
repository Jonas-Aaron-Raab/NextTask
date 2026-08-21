/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { clearStoredTaskMarkers, loadTaskMarkersFromApi } from '../utils/taskMarkers';

const AuthContext = createContext();

function readStoredUser() {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (!token || !savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearStoredTaskMarkers();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());

  const login = (token, userData) => {
    clearStoredTaskMarkers();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearStoredTaskMarkers();
    setUser(null);
  };

  useEffect(() => {
    if (!user || !localStorage.getItem('token')) return;

    loadTaskMarkersFromApi().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled || !data?.user) return;
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          clearStoredTaskMarkers();
          setUser(null);
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((currentUser) => {
      const nextUser = { ...(currentUser || {}), ...userData };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user && localStorage.getItem('token')), login, logout, updateUser }),
    [user, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
