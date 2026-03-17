"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  loginWithEmail,
  logoutSession,
  refreshSession,
  registerWithEmail
} from "@/lib/auth";
import { ApiError } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  accessToken: string | null;
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  ready: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  restore: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const applySessionState = (
  setStatus: (value: AuthStatus) => void,
  setUser: (value: AuthUser | null) => void,
  setAccessToken: (value: string | null) => void,
  setError: (value: string | null) => void,
  response: AuthResponse | null
) => {
  startTransition(() => {
    if (!response) {
      setStatus("anonymous");
      setUser(null);
      setAccessToken(null);
      setError(null);
      return;
    }

    setStatus("authenticated");
    setUser(response.user);
    setAccessToken(response.accessToken);
    setError(null);
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    try {
      const response = await refreshSession();
      applySessionState(
        setStatus,
        setUser,
        setAccessToken,
        setError,
        response
      );
      return response;
    } catch (requestError) {
      applySessionState(setStatus, setUser, setAccessToken, setError, null);
      if (
        requestError instanceof ApiError &&
        requestError.status !== 401
      ) {
        setError(requestError.message);
      }
      return null;
    }
  };

  useEffect(() => {
    void restore();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await loginWithEmail(payload);
    applySessionState(setStatus, setUser, setAccessToken, setError, response);
    return response;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await registerWithEmail(payload);
    applySessionState(setStatus, setUser, setAccessToken, setError, response);
    return response;
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      applySessionState(setStatus, setUser, setAccessToken, setError, null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      status,
      user,
      error,
      ready: status !== "loading",
      login,
      register,
      restore,
      logout,
      clearError: () => setError(null)
    }),
    [accessToken, error, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
};

