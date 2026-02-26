// Authentication and user context

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, UserRole } from '../types/entities';
import { AuthAPI, UsersAPI } from '../services/odataClient';
import { getDefaultRouteForRole } from './roleRouting';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { getDefaultRouteForRole } from './roleRouting';

const SESSION_STORAGE_KEY = 'currentUserId';
const DIRECT_LOGIN_ENABLED = import.meta.env.VITE_ALLOW_DIRECT_LOGIN === 'true';

const readStoredUserId = (): string | null => {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistStoredUserId = (userId: string): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, userId);
  } catch {
    // no-op: storage write failure should not block session state
  }
};

const clearStoredUserId = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
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
      const storedUserId = readStoredUserId();
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

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      throw new Error('Invalid credentials');
    }

    const user = await AuthAPI.authenticate(normalizedEmail, password);
    if (!user?.active) {
      throw new Error('Invalid credentials');
    }

    setCurrentUser(user);
    persistStoredUserId(user.id);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearStoredUserId();
  }, []);

  const directLogin = useCallback((role: UserRole) => {
    if (!DIRECT_LOGIN_ENABLED) {
      throw new Error('Direct login is disabled');
    }

    const fakeId = `direct-${role}`;
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
    persistStoredUserId(fakeId);
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    const user = await UsersAPI.getById(userId);
    if (user?.active) {
      setCurrentUser(user);
      persistStoredUserId(user.id);
      return;
    }

    setCurrentUser(null);
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
