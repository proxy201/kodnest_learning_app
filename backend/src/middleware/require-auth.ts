import type { NextFunction, Request, Response } from "express";

import { findUserById } from "../features/auth/auth.repository.js";
import { verifyAccessToken } from "../lib/auth.js";

export const requireAuth = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({
      message: "Authorization header is required."
    });
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const tokenUser = verifyAccessToken(token);
    const user = await findUserById(tokenUser.id);

    if (!user) {
      response.status(401).json({
        message: "Session is no longer valid."
      });
      return;
    }

    response.locals.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch {
    response.status(401).json({
      message: "Invalid or expired access token."
    });
  }
};
