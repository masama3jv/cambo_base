import React, { createContext, useContext, useEffect, useState } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      authService
        .verifyToken(token)
        .then((result) => {
          setUser(result.user);
          setIsAuthenticated(true);
        })
        .catch(() => {
          authService.removeToken();
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const role = response.role || 'capita';
      authService.saveToken(response.token);
      setUser({
        id: response.userId,
        email: email,
        role,
      });
      setIsAuthenticated(true);
      return role;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password, confirmPassword });
      authService.saveToken(response.token);
      setUser({
        id: response.userId,
        email: email,
        role: 'capita',
      });
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    try {
      const result = await authService.verifyToken(token);
      setUser(result.user);
      setIsAuthenticated(true);
    } catch {
      authService.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
