import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";

import {
  type AuthUserPayload,
  REFRESH_COOKIE_NAME,
  createAuthSessionTokens,
  getRefreshTokenExpiryDate,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyRefreshToken
} from "../lib/auth.js";
import { clearRefreshCookie, sendAuthResponse } from "../lib/http.js";
import {
  createRefreshToken,
  createUser,
  findActiveRefreshToken,
  findUserByEmail,
  findUserById,
  revokeAllUserRefreshTokens,
  revokeRefreshTokenByHash
} from "../features/auth/auth.repository.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema
} from "../features/auth/auth.schema.js";
import { requireAuth } from "../middleware/require-auth.js";

const authRouter = Router();

const toAuthUser = (user: {
  id: number;
  email: string;
  name: string;
  role: string;
}): AuthUserPayload => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
});

const getRefreshTokenFromRequest = (request: Request) => {
  const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME];
  const parsedBody = refreshSchema.safeParse(request.body ?? {});

  return cookieToken ?? (parsedBody.success ? parsedBody.data.refreshToken : undefined);
};

const handleValidationError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation failed.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });

    return true;
  }

  return false;
};

authRouter.post("/register", async (request, response) => {
  try {
    const input = registerSchema.parse(request.body);
    const existingUser = await findUserByEmail(input.email);

    if (existingUser) {
      response.status(409).json({
        message: "An account with this email already exists."
      });
      return;
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    if (!user) {
      throw new Error("User creation failed.");
    }

    const authUser = toAuthUser(user);
    const tokens = createAuthSessionTokens(authUser);

    await revokeAllUserRefreshTokens(user.id);
    await createRefreshToken({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      refreshTokenExpiresAt: getRefreshTokenExpiryDate()
    });

    sendAuthResponse(response, authUser, tokens);
  } catch (error) {
    if (handleValidationError(error, response)) {
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : "Registration failed."
    });
  }
});

authRouter.post("/login", async (request, response) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await findUserByEmail(input.email);

    if (!user) {
      response.status(401).json({
        message: "Invalid email or password."
      });
      return;
    }

    const isMatch = await verifyPassword(input.password, user.password_hash);

    if (!isMatch) {
      response.status(401).json({
        message: "Invalid email or password."
      });
      return;
    }

    const authUser = toAuthUser(user);
    const tokens = createAuthSessionTokens(authUser);

    await revokeAllUserRefreshTokens(user.id);
    await createRefreshToken({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      refreshTokenExpiresAt: getRefreshTokenExpiryDate()
    });

    sendAuthResponse(response, authUser, tokens);
  } catch (error) {
    if (handleValidationError(error, response)) {
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : "Login failed."
    });
  }
});

authRouter.post("/refresh", async (request, response) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);

    if (!refreshToken) {
      response.status(401).json({
        message: "Refresh token is required."
      });
      return;
    }

    const { userId } = verifyRefreshToken(refreshToken);
    const user = await findUserById(userId);
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const activeToken = await findActiveRefreshToken(userId, refreshTokenHash);

    if (
      !user ||
      !activeToken ||
      new Date(activeToken.expires_at).getTime() <= Date.now()
    ) {
      clearRefreshCookie(response);
      response.status(401).json({
        message: "Refresh token is invalid or expired."
      });
      return;
    }

    const authUser = toAuthUser(user);
    const tokens = createAuthSessionTokens(authUser);

    await revokeRefreshTokenByHash(refreshTokenHash);
    await createRefreshToken({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      refreshTokenExpiresAt: getRefreshTokenExpiryDate()
    });

    sendAuthResponse(response, authUser, tokens);
  } catch (_error) {
    clearRefreshCookie(response);
    response.status(401).json({
      message: "Unable to refresh session."
    });
  }
});

authRouter.post("/logout", async (request, response) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);

    if (refreshToken) {
      await revokeRefreshTokenByHash(hashRefreshToken(refreshToken));
    }

    clearRefreshCookie(response);
    response.status(200).json({
      message: "Logged out successfully."
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Logout failed."
    });
  }
});

authRouter.get("/me", requireAuth, (request, response) => {
  void request;

  response.status(200).json({
    user: response.locals.user
  });
});

export { authRouter };
