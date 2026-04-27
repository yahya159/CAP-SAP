// Authentication and user context

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, UserRole, USER_ROLE_LABELS } from '../types/entities';import { AuthAPI } from '../services/odata/authApi';
import { getODataAuthToken, setODataAuthToken, onAuthExpired, isTokenExpired } from '../services/odata/core';
import { UsersAPI } from '../services/odata/usersApi';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  directLogin: (role: UserRole) => void;
  isDirectLoginEnabled: boolean;
}

// Persist context reference across Vite HMR reloads so the Provider and
// lazy-loaded consumers always share the same React context object.
const AuthContext: React.Context<AuthContextType | undefined> =
  import.meta.hot?.data?.authContext ??
  createContext<AuthContextType | undefined>(undefined);
if (import.meta.hot) {
  import.meta.hot.data.authContext = AuthContext;
}

const SESSION_STORAGE_KEY = 'auth.session.v1';
const LEGACY_USER_STORAGE_KEY = 'currentUserId';
const DIRECT_LOGIN_ENABLED = import.meta.env.VITE_ALLOW_DIRECT_LOGIN === 'true';

interface StoredAuthSession {
  token: string;
  expiresAt?: string;
  user: User;
}

const readStoredSession = (): StoredAuthSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (!parsed?.token || !parsed?.user?.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    const token = String(parsed.token).trim();
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    const expiresAt = typeof parsed.expiresAt === 'string' ? parsed.expiresAt : undefined;
    if (expiresAt) {
      const expiresAtEpoch = Date.parse(expiresAt);
      if (Number.isFinite(expiresAtEpoch) && expiresAtEpoch <= Date.now()) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    }

    return { token, expiresAt, user: parsed.user as User };
  } catch {
    return null;
  }
};

const readLegacyStoredUserId = (): string | null => {
  try {
    return localStorage.getItem(LEGACY_USER_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistStoredSession = (session: StoredAuthSession): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Legacy key is only read for backward-compat migration; no need to write it
  } catch {
    // no-op: storage write failure should not block session state
  }
};

const clearStoredUserId = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  } catch {
    // no-op: storage cleanup failure should not block session state
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedSession = readStoredSession();
      if (storedSession) {
        setODataAuthToken(storedSession.token);
        setCurrentUser(storedSession.user);
        if (isMounted) setIsAuthLoading(false);
        return;
      }
      setODataAuthToken(null);

      const storedUserId = readLegacyStoredUserId();
      if (!storedUserId) {
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      try {
        if (storedUserId.startsWith('direct-')) {
          if (!DIRECT_LOGIN_ENABLED) {
            setCurrentUser(null);
            clearStoredUserId();
            if (isMounted) setIsAuthLoading(false);
            return;
          }

          const role = storedUserId.replace('direct-', '') as UserRole;
          if (!(role in USER_ROLE_LABELS)) {
            setCurrentUser(null);
            clearStoredUserId();
            if (isMounted) setIsAuthLoading(false);
            return;
          }
          setCurrentUser({
            id: storedUserId,
            name: `Direct ${role}`,
            email: `direct@${role}.local`,
            role,
            active: true,
            skills: [],
            certifications: [],
            availabilityPercent: 100,
          });
          if (isMounted) setIsAuthLoading(false);
          return;
        }

        const user = await UsersAPI.getById(storedUserId);
        if (!isMounted) return;

        if (user?.active) {
          const token = getODataAuthToken();
          if (token) {
            persistStoredSession({ token, user });
          }
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          clearStoredUserId();
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          clearStoredUserId();
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-logout when the backend returns 401 (expired/invalid token)
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      setCurrentUser(null);
      setODataAuthToken(null);
      clearStoredUserId();
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      throw new Error('Invalid credentials');
    }

    const session = await AuthAPI.authenticate(normalizedEmail, password);
    if (!session.user?.active) {
      throw new Error('Invalid credentials');
    }

    setODataAuthToken(session.token);
    setCurrentUser(session.user);
    persistStoredSession({ token: session.token, expiresAt: session.expiresAt, user: session.user });
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setODataAuthToken(null);
    clearStoredUserId();
  }, []);

  const directLogin = useCallback((role: UserRole) => {
    if (!DIRECT_LOGIN_ENABLED) {
      throw new Error('Direct login is disabled');
    }

    const fakeId = `direct-${role}`;
    setODataAuthToken(null);
    setCurrentUser({
      id: fakeId,
      name: `Direct ${role}`,
      email: `direct@${role}.local`,
      role,
      active: true,
      skills: [],
      certifications: [],
      availabilityPercent: 100,
    });
    try {
      localStorage.setItem(LEGACY_USER_STORAGE_KEY, fakeId);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // no-op
    }
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    const user = await UsersAPI.getById(userId);
    if (user?.active) {
      setCurrentUser(user);
      const token = getODataAuthToken();
      if (token) {
        persistStoredSession({ token, user });
      } else {
        try {
          localStorage.setItem(LEGACY_USER_STORAGE_KEY, user.id);
        } catch {
          // no-op
        }
      }
      return;
    }

    setCurrentUser(null);
    setODataAuthToken(null);
    clearStoredUserId();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      login,
      logout,
      switchUser,
      isAuthenticated: Boolean(currentUser),
      isAuthLoading,
      directLogin,
      isDirectLoginEnabled: DIRECT_LOGIN_ENABLED,
    }),
    [currentUser, isAuthLoading, login, logout, switchUser, directLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
