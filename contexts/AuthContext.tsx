import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { initAuthFromStore, login as loginService, logout as logoutService, subscribeToAuthChanges } from '@/services/auth';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';

interface PaymentNotification {
  purchaseId: string;
  type: 'APPROVED' | 'REJECTED';
  title: string;
  message: string;
  amount: number;
  reason?: string;
}

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  // WebSocket notifications
  isConnected: boolean;
  notifications: PaymentNotification[];
  unreadCount: number;
  markAsRead: (purchaseId: string) => void;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket notifications - conecta cuando hay usuario
  const { 
    isConnected, 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearNotifications 
  } = useWebSocketNotifications(user?.id || null);

  useEffect(() => {
    (async () => {
      const { token: t, user: u } = await initAuthFromStore();
      setToken(t);
      setUser(u);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(({ token: nextToken, user: nextUser }) => {
      setToken(nextToken);
      setUser(nextUser);
    });
    return unsubscribe;
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
      value={{ 
        token, 
        user, 
        login, 
        logout, 
        isAuthenticated: !!token, 
        isLoading,
        // WebSocket
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
