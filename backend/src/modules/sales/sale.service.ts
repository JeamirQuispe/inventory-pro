import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "../../config/prisma";
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

export async function findAll() {
  return prisma.sale.findMany({
    include: saleInclude,
    orderBy: { createdAt: "desc" },
  });
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
  return prisma.$transaction(
    async (tx) => {
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

      for (const item of data.items) {
        const product = products.find((entry) => entry.id === item.productId)!;

        if (product.stock < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 409);
        }
      }

      const totalAmount = data.items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0,
      );

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
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      for (const item of data.items) {
        const product = products.find((entry) => entry.id === item.productId)!;
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
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
