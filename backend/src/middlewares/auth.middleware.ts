import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Authentication token is required", 401);
  }

  const token = authHeader.split(" ")[1];
  let payload;

  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError("Invalid authentication token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid authentication token", 401);
  }

  req.user = {
    id: user.id,
    role: user.role,
  };

  next();
}
