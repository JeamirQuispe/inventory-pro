import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminOnly } from "../../middlewares/permissions.middleware";
import * as userController from "./user.controller";

export const userRoutes = Router();

userRoutes.use(asyncHandler(authMiddleware), adminOnly);

userRoutes.get("/", asyncHandler(userController.findAll));
userRoutes.get("/:id", asyncHandler(userController.findById));
userRoutes.post("/", asyncHandler(userController.create));
userRoutes.put("/:id", asyncHandler(userController.update));
userRoutes.delete("/:id", asyncHandler(userController.remove));
