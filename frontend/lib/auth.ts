import { apiFetch } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
};

export const registerWithEmail = (payload: RegisterPayload) =>
  apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginWithEmail = (payload: LoginPayload) =>
  apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const refreshSession = () =>
  apiFetch<AuthResponse>("/api/auth/refresh", {
    method: "POST"
  });

export const logoutSession = () =>
  apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST"
  });

export const fetchCurrentUser = (accessToken: string) =>
  apiFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

