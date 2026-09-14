import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateStockAdjustmentInput,
  StockMovementQuery,
} from "./stock-movement.schema";

const stockMovementInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

export async function findAll(query: StockMovementQuery) {
  return prisma.stockMovement.findMany({
    where: {
      productId: query.productId,
    },
    include: stockMovementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createAdjustment(
  data: CreateStockAdjustmentInput,
  createdById: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: data.productId,
          isActive: true,
        },
      });

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      const previousStock = product.stock;
      const quantity = data.newStock - previousStock;

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: data.newStock },
      });

      return tx.stockMovement.create({
        data: {
          productId: data.productId,
          createdById,
          type: StockMovementType.ADJUSTMENT,
          quantity,
          previousStock,
          newStock: data.newStock,
          reason: data.reason,
        },
        include: stockMovementInclude,
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
