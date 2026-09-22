import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminOnly, canManageCatalog } from "../../middlewares/permissions.middleware";
import * as categoryController from "./category.controller";

export const categoryRoutes = Router();

categoryRoutes.use(asyncHandler(authMiddleware));

categoryRoutes.get("/", asyncHandler(categoryController.findAll));
categoryRoutes.get("/:id", asyncHandler(categoryController.findById));
categoryRoutes.post("/", canManageCatalog, asyncHandler(categoryController.create));
categoryRoutes.put("/:id", canManageCatalog, asyncHandler(categoryController.update));
categoryRoutes.delete("/:id", adminOnly, asyncHandler(categoryController.remove));
