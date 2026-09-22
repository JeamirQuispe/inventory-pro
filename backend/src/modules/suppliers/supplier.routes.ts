import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminOnly, canManageCatalog } from "../../middlewares/permissions.middleware";
import * as supplierController from "./supplier.controller";

export const supplierRoutes = Router();

supplierRoutes.use(asyncHandler(authMiddleware), canManageCatalog);

supplierRoutes.get("/", asyncHandler(supplierController.findAll));
supplierRoutes.get("/:id", asyncHandler(supplierController.findById));
supplierRoutes.post("/", canManageCatalog, asyncHandler(supplierController.create));
supplierRoutes.put("/:id", canManageCatalog, asyncHandler(supplierController.update));
supplierRoutes.delete("/:id", adminOnly, asyncHandler(supplierController.remove));
