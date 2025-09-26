
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (e.g., from localStorage)
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsAuthChecked(true);
  }, []);

  const login = (email, password) => {
    const defaultEmail = import.meta.env.VITE_DEFAULT_EMAIL;
    const defaultPassword = import.meta.env.VITE_DEFAULT_PASSWORD;

    if (email === defaultEmail && password === defaultPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthChecked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
