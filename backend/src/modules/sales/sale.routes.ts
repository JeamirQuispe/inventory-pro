import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { canManageSales } from "../../middlewares/permissions.middleware";
import * as saleController from "./sale.controller";

export const saleRoutes = Router();

saleRoutes.use(asyncHandler(authMiddleware), canManageSales);

saleRoutes.get("/", asyncHandler(saleController.findAll));
saleRoutes.get("/:id", asyncHandler(saleController.findById));
saleRoutes.post("/", asyncHandler(saleController.create));
