import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/features/auth/sessionStore';
import { fetchBalance } from '@/features/wallet/walletApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function decodeUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const { token, username, hydrate, clearSession, isTelegramApp } = useSessionStore();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isTelegramApp) {
      setHydrated(true);
      return;
    }
    void hydrate().finally(() => setHydrated(true));
  }, [hydrate, isTelegramApp]);

  const loggedIn = Boolean(token && username);
  const userId = token ? decodeUserIdFromToken(token) : null;

  const walletQ = useQuery({
    queryKey: ['wallet', 'keno'],
    queryFn: () => fetchBalance(useSessionStore.getState().getAuthHeader()),
    enabled: loggedIn,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const onWallet = () => {
      void walletQ.refetch();
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    };
    window.addEventListener('superbet:wallet-changed', onWallet);
    return () => window.removeEventListener('superbet:wallet-changed', onWallet);
  }, [walletQ, queryClient]);

  const currentUser = useMemo(() => {
    if (!loggedIn || !userId) return null;
    return {
      uid: userId,
      displayName: username,
      email: null,
    };
  }, [loggedIn, userId, username]);

  const refreshBalance = useCallback(async () => {
    await walletQ.refetch();
  }, [walletQ]);

  const login = async () => {
    window.location.href = '/profile';
  };

  const signup = async () => {
    window.location.href = '/profile?tab=signup';
  };

  const logout = async () => {
    clearSession();
    window.dispatchEvent(new Event('superbet:wallet-changed'));
  };

  const resetPassword = async () => {
    window.location.href = '/profile';
  };

  const value = {
    currentUser,
    userBalance: walletQ.data?.status === 'live' ? Number(walletQ.data.balance ?? 0) : 0,
    signup,
    login,
    logout,
    resetPassword,
    refreshBalance,
    loading: !hydrated,
  };

  if (!hydrated) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
