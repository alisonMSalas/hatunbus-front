import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { initAuthFromStore, login as loginService, logout as logoutService } from '@/services/auth';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { token: t, user: u } = await initAuthFromStore();
      setToken(t);
      setUser(u);
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginService(email, password);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await logoutService();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
