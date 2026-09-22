import { StockMovementType } from "@prisma/client";
import { serializable } from "../../utils/transaction";

import { prisma } from "../../config/prisma";
import { paginate, paging } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import type { CreateStockAdjustmentInput, StockMovementQuery } from "./stock-movement.schema";

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
  const where: Prisma.StockMovementWhereInput = {
    productId: query.productId,
    product: { name: { contains: query.q, mode: "insensitive" } },
  };
  return paginate(
    query,
    prisma.stockMovement.findMany({
      where,
      ...paging(query),
      include: stockMovementInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.stockMovement.count({ where }),
  );
}

export async function createAdjustment(data: CreateStockAdjustmentInput, createdById: string) {
  return serializable(async (tx) => {
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
    if (quantity === 0) throw new AppError("Stock is already at the requested quantity", 409);

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
  });
}
