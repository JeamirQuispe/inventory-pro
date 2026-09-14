import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { canViewInventory } from "../../middlewares/permissions.middleware";
import * as reportController from "./report.controller";

export const reportRoutes = Router();

reportRoutes.use(asyncHandler(authMiddleware), canViewInventory);

reportRoutes.get("/dashboard", asyncHandler(reportController.dashboard));
reportRoutes.get("/low-stock", asyncHandler(reportController.lowStock));
