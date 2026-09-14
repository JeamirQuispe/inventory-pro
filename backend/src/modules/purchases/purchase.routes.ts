import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { canManagePurchases } from "../../middlewares/permissions.middleware";
import * as purchaseController from "./purchase.controller";

export const purchaseRoutes = Router();

purchaseRoutes.use(asyncHandler(authMiddleware), canManagePurchases);

purchaseRoutes.get("/", asyncHandler(purchaseController.findAll));
purchaseRoutes.get("/:id", asyncHandler(purchaseController.findById));
purchaseRoutes.post("/", asyncHandler(purchaseController.create));
