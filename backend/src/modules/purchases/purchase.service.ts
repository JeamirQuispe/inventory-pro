import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreatePurchaseInput } from "./purchase.schema";

const purchaseInclude = {
  supplier: {
    select: {
      id: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  },
};

export async function findAll() {
  return prisma.purchase.findMany({
    include: purchaseInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw new AppError("Purchase not found", 404);
  }

  return purchase;
}

export async function create(data: CreatePurchaseInput, createdById: string) {
  return prisma.$transaction(
    async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: {
          id: data.supplierId,
          isActive: true,
        },
      });

      if (!supplier) {
        throw new AppError("Supplier not found", 404);
      }

      const productIds = data.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new AppError("One or more products were not found", 404);
      }

      const totalAmount = data.items.reduce(
        (total, item) => total + item.quantity * item.unitCost,
        0,
      );

      const purchase = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          createdById,
          notes: data.notes,
          totalAmount,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.quantity * item.unitCost,
            })),
          },
        },
      });

      for (const item of data.items) {
        const product = products.find((entry) => entry.id === item.productId)!;
        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            createdById,
            type: StockMovementType.PURCHASE,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Purchase ${purchase.id}`,
          },
        });
      }

      return tx.purchase.findUniqueOrThrow({
        where: { id: purchase.id },
        include: purchaseInclude,
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
