import React, { createContext, useContext, useState, useCallback } from 'react';
import { setUserContext, clearUserContext } from '../utils/errorMonitoring';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (redirectUrl?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (redirectUrl?: string) => {
    try {
      // Redirect to LinkedIn OAuth
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
        response_type: 'code',
        client_id: process.env.REACT_APP_LINKEDIN_CLIENT_ID || '',
        redirect_uri: process.env.REACT_APP_LINKEDIN_REDIRECT_URI || '',
        state: Math.random().toString(36).substring(7),
        scope: 'r_liteprofile r_emailaddress',
      })}`;

      window.location.href = redirectUrl || linkedInAuthUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearUserContext();
    // Clear any auth tokens or state
    localStorage.removeItem('auth_token');
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 