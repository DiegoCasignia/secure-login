import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (data: any, faceDescriptor: number[]) => Promise<void>;
  refreshToken: () => Promise<void>;
  uploadUser: (newUser: User) => Promise<void>;
  uploadAccessToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            await refreshToken();
          } else {
            setAccessToken(token);
            const userData = localStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await authService.refreshToken(refreshToken);
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (error) {
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async (data: any, faceDescriptor: number[]) => {
    setIsLoading(true);
    try {
      const response = await authService.completeRegistration(data, faceDescriptor);
      setUser(response.user);
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const uploadUser = async (newUser: User) => {
    setUser(newUser);
  };

  const uploadAccessToken = async (token: string) => {
    setAccessToken(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        completeRegistration,
        refreshToken,
        uploadUser,
        uploadAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};