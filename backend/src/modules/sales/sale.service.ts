import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import { serializable } from "../../utils/transaction";
import { AppError } from "../../utils/AppError";
import type { CreateSaleInput } from "./sale.schema";

const saleInclude = {
  customer: {
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
  const where: Prisma.SaleWhereInput = {
    ...(query.q
      ? {
          OR: [
            { notes: { contains: query.q, mode: "insensitive" } },
            { customer: { name: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  return paginate(
    query,
    prisma.sale.findMany({
      where,
      ...paging(query),
      include: saleInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.sale.count({ where }),
  );
}

export async function findById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: saleInclude,
  });

  if (!sale) {
    throw new AppError("Sale not found", 404);
  }

  return sale;
}

export async function create(data: CreateSaleInput, createdById: string) {
  return serializable(async (tx) => {
    if (data.customerId) {
      const customer = await tx.customer.findFirst({
        where: {
          id: data.customerId,
          isActive: true,
        },
      });

      if (!customer) {
        throw new AppError("Customer not found", 404);
      }
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
    for (const item of data.items) {
      const product = productsById.get(item.productId)!;

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 409);
      }
    }

    const totalAmount = data.items.reduce(
      (total, item) => total.plus(new Prisma.Decimal(item.unitPrice).times(item.quantity)),
      new Prisma.Decimal(0),
    );
    if (totalAmount.greaterThan("99999999.99"))
      throw new AppError("Transaction total exceeds the supported range", 400);

    const sale = await tx.sale.create({
      data: {
        customerId: data.customerId,
        createdById,
        notes: data.notes,
        totalAmount,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: new Prisma.Decimal(item.unitPrice).times(item.quantity),
          })),
        },
      },
    });

    for (const item of data.items) {
      const product = productsById.get(item.productId)!;
      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          createdById,
          type: StockMovementType.SALE,
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Sale ${sale.id}`,
        },
      });
    }

    return tx.sale.findUniqueOrThrow({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
}
