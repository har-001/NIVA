// ============================================
// NIVA — Mobile Authentication & Session Context
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession } from '../types/mobile';
import { mobileApiClient } from '../services/apiClient';
import { mobileStorage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverOnline: boolean;
  serverHost: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateServerHost: (host: string) => Promise<void>;
  checkServerConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [serverHost, setServerHost] = useState<string>('localhost');

  const checkServerConnection = async (): Promise<boolean> => {
    const health = await mobileApiClient.checkHealth();
    setServerOnline(health.online);
    return health.online;
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const savedHost = await mobileStorage.getItem('niva_mobile_host');
        if (savedHost) {
          setServerHost(savedHost);
          mobileApiClient.setHost(savedHost);
        }

        const savedToken = await mobileStorage.getItem('niva_mobile_token');
        const savedUserJson = await mobileStorage.getItem('niva_mobile_user');

        if (savedToken && savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson);
          setToken(savedToken);
          setUser(parsedUser);
          mobileApiClient.setToken(savedToken);
        } else {
          // Default guest session for instant mobile access
          const guestUser: User = { id: 'usr-guest', email: 'guest@niva.local', name: 'NIVA User' };
          setUser(guestUser);
          setToken('guest-session-token');
          mobileApiClient.setToken('guest-session-token');
        }

        await checkServerConnection();
      } catch (err) {
        console.warn('[MobileAuth] Session load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const res = await mobileApiClient.login(email, password);
    setIsLoading(false);
    if (res.success && res.session) {
      setUser(res.session.user);
      setToken(res.session.token);
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setToken(null);
    mobileApiClient.setToken(null);
    await mobileStorage.removeItem('niva_mobile_token');
    await mobileStorage.removeItem('niva_mobile_user');
  };

  const updateServerHost = async (host: string): Promise<void> => {
    setServerHost(host);
    mobileApiClient.setHost(host);
    await mobileStorage.setItem('niva_mobile_host', host);
    await checkServerConnection();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        serverOnline,
        serverHost,
        login,
        logout,
        updateServerHost,
        checkServerConnection,
      }}
    >
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
