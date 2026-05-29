/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext();
const guestUser = {
  id: 'guest',
  name: 'Gast',
  email: 'gast@nexttask.local',
  role: 'DEVELOPER',
  department: 'Development',
  isGuest: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : guestUser;
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(guestUser);
  };

  const updateUser = useCallback((userData) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
