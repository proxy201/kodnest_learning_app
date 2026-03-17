import type { NextFunction, Request, Response } from "express";

import { findUserById } from "../features/auth/auth.repository.js";
import { verifyAccessToken } from "../lib/auth.js";

export const optionalAuth = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const tokenUser = verifyAccessToken(token);
    const user = await findUserById(tokenUser.id);

    if (user) {
      response.locals.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    }
  } catch {
    // Public routes can continue without auth.
  }

  next();
};

