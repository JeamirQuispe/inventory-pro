import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import * as authController from "./auth.controller";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Too many login attempts. Try again in 15 minutes" },
  }),
  asyncHandler(authController.login),
);
authRoutes.get("/me", asyncHandler(authMiddleware), asyncHandler(authController.me));
