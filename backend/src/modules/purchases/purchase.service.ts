import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import { serializable } from "../../utils/transaction";
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

export async function findAll(query: ListQuery) {
  const where: Prisma.PurchaseWhereInput = {
    ...(query.q
      ? {
          OR: [
            { notes: { contains: query.q, mode: "insensitive" } },
            { supplier: { name: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  return paginate(
    query,
    prisma.purchase.findMany({
      where,
      ...paging(query),
      include: purchaseInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.purchase.count({ where }),
  );
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
  return serializable(async (tx) => {
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

    const productsById = new Map(products.map((product) => [product.id, product]));
    const totalAmount = data.items.reduce(
      (total, item) => total.plus(new Prisma.Decimal(item.unitCost).times(item.quantity)),
      new Prisma.Decimal(0),
    );
    if (totalAmount.greaterThan("99999999.99"))
      throw new AppError("Transaction total exceeds the supported range", 400);

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
            subtotal: new Prisma.Decimal(item.unitCost).times(item.quantity),
          })),
        },
      },
    });

    for (const item of data.items) {
      const product = productsById.get(item.productId)!;
      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;
      if (newStock > 2147483647) throw new AppError("Stock exceeds the supported range", 400);

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
  });
}
