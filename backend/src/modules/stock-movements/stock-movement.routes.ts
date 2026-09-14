import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { canViewInventory } from "../../middlewares/permissions.middleware";
import * as stockMovementController from "./stock-movement.controller";

export const stockMovementRoutes = Router();

stockMovementRoutes.use(asyncHandler(authMiddleware), canViewInventory);

stockMovementRoutes.get("/", asyncHandler(stockMovementController.findAll));
stockMovementRoutes.post(
  "/adjustments",
  asyncHandler(stockMovementController.createAdjustment),
);
