import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

import { buildAuthCookieOptions, buildClearedAuthCookieOptions } from "../config/cookies.js";
import { env } from "../config/env.js";
import { durationToMilliseconds } from "./duration.js";

export const REFRESH_COOKIE_NAME = "lms_refresh_token";

export type AuthUserPayload = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

export type AuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);

export const signAccessToken = (user: AuthUserPayload) =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      type: "access"
    } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"]
    } satisfies SignOptions
  );

export const signRefreshToken = (userId: number) =>
  jwt.sign(
    {
      sub: String(userId),
      type: "refresh"
    } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"]
    } satisfies SignOptions
  );

export const verifyAccessToken = (token: string): AuthUserPayload => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (
    typeof payload !== "object" ||
    payload.type !== "access" ||
    !payload.sub ||
    !payload.email ||
    !payload.name ||
    !payload.role
  ) {
    throw new Error("Invalid access token.");
  }

  return {
    id: Number(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
    role: String(payload.role)
  };
};

export const createAuthSessionTokens = (user: AuthUserPayload): AuthSessionTokens => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user.id),
  accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES,
  refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES
});

export const verifyRefreshToken = (token: string) => {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

  if (typeof payload !== "object" || payload.type !== "refresh" || !payload.sub) {
    throw new Error("Invalid refresh token.");
  }

  return {
    userId: Number(payload.sub)
  };
};

export const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getRefreshTokenExpiryDate = () =>
  new Date(Date.now() + durationToMilliseconds(env.JWT_REFRESH_EXPIRES));

export const getRefreshCookieOptions = () =>
  buildAuthCookieOptions(durationToMilliseconds(env.JWT_REFRESH_EXPIRES));

export const getClearedRefreshCookieOptions = () => buildClearedAuthCookieOptions();
