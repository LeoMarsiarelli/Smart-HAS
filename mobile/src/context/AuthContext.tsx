import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_TOKEN_STORAGE_KEY, getApiErrorMessage } from '../api/client';
import * as authApi from '../api/auth';
import { LoginPayload, RegisterPayload, User } from '../types';

const USER_STORAGE_KEY = '@smart_has:auth_user';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** True while restoring a persisted session on app startup. */
  isBootstrapping: boolean;
  /** True while a login/register request is in flight. */
  isSubmitting: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore a persisted session (token + cached user) on cold start.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
        }
      } catch {
        // Corrupt/unavailable storage — fall back to a logged-out state.
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (nextToken: string, nextUser: User) => {
    await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await authApi.login(payload);
        await persistSession(response.token, response.user);
      } catch (err) {
        setError(getApiErrorMessage(err));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await authApi.register(payload);
        await persistSession(response.token, response.user);
      } catch (err) {
        setError(getApiErrorMessage(err));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeMany([AUTH_TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      isSubmitting,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, token, isBootstrapping, isSubmitting, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
