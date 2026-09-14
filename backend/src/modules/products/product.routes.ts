import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  adminOnly,
  canManageCatalog,
} from "../../middlewares/permissions.middleware";
import * as productController from "./product.controller";

export const productRoutes = Router();

productRoutes.use(asyncHandler(authMiddleware));

productRoutes.get("/", asyncHandler(productController.findAll));
productRoutes.get("/:id", asyncHandler(productController.findById));
productRoutes.post(
  "/",
  canManageCatalog,
  asyncHandler(productController.create),
);
productRoutes.put(
  "/:id",
  canManageCatalog,
  asyncHandler(productController.update),
);
productRoutes.delete(
  "/:id",
  adminOnly,
  asyncHandler(productController.remove),
);
