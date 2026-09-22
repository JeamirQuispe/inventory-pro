import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminOnly, canManageCustomers } from "../../middlewares/permissions.middleware";
import * as customerController from "./customer.controller";

export const customerRoutes = Router();

customerRoutes.use(asyncHandler(authMiddleware));

customerRoutes.get("/", asyncHandler(customerController.findAll));
customerRoutes.get("/:id", asyncHandler(customerController.findById));
customerRoutes.post("/", canManageCustomers, asyncHandler(customerController.create));
customerRoutes.put("/:id", canManageCustomers, asyncHandler(customerController.update));
customerRoutes.delete("/:id", adminOnly, asyncHandler(customerController.remove));
