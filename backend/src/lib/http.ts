import type { Response } from "express";

import {
  type AuthSessionTokens,
  type AuthUserPayload,
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getClearedRefreshCookieOptions
} from "./auth.js";

export const sendAuthResponse = (
  response: Response,
  user: AuthUserPayload,
  tokens: AuthSessionTokens
) => {
  response.cookie(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    getRefreshCookieOptions()
  );

  response.status(200).json({
    user,
    accessToken: tokens.accessToken,
    accessTokenExpiresIn: tokens.accessTokenExpiresIn,
    refreshTokenExpiresIn: tokens.refreshTokenExpiresIn
  });
};

export const clearRefreshCookie = (response: Response) => {
  response.clearCookie(REFRESH_COOKIE_NAME, getClearedRefreshCookieOptions());
};
