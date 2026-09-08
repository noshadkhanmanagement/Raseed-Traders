import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string, remember?: boolean) => boolean;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'raseed_traders_auth_session';
const APP_PASSWORD = (import.meta.env.VITE_APP_PASSWORD || '').trim();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const local = localStorage.getItem(AUTH_STORAGE_KEY);
      const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return local === 'authenticated' || session === 'authenticated';
    } catch {
      return false;
    }
  });

  const login = (password: string, remember: boolean = true): boolean => {
    if (!APP_PASSWORD) {
      console.warn('VITE_APP_PASSWORD is not set in environment variables');
      return false;
    }
    if (password.trim() === APP_PASSWORD) {
      setIsAuthenticated(true);
      try {
        if (remember) {
          localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
        }
      } catch (err) {
        console.error('Failed to save auth session', err);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear auth session', err);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
