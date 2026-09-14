import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError";

export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authenticated user not found", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission for this action", 403);
    }

    next();
  };
}
