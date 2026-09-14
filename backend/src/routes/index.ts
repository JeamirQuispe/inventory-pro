import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";
import { categoryRoutes } from "../modules/categories/category.routes";
import { customerRoutes } from "../modules/customers/customer.routes";
import { productRoutes } from "../modules/products/product.routes";
import { purchaseRoutes } from "../modules/purchases/purchase.routes";
import { reportRoutes } from "../modules/reports/report.routes";
import { saleRoutes } from "../modules/sales/sale.routes";
import { stockMovementRoutes } from "../modules/stock-movements/stock-movement.routes";
import { supplierRoutes } from "../modules/suppliers/supplier.routes";
import { userRoutes } from "../modules/users/user.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "InventoryPro API",
  });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/reports", reportRoutes);
router.use("/sales", saleRoutes);
router.use("/stock-movements", stockMovementRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/users", userRoutes);
