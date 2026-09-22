import { prisma } from "../../config/prisma";
import { serializable } from "../../utils/transaction";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import type { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

export async function findAll(query: ListQuery) {
  const where: Prisma.SupplierWhereInput = {
    isActive: true,
    name: { contains: query.q, mode: "insensitive" },
  };
  return paginate(
    query,
    prisma.supplier.findMany({
      where,
      ...paging(query),
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.supplier.count({ where }),
  );
}

export async function findById(id: string) {
  const supplier = await prisma.supplier.findFirst({
    where: {
      id,
      isActive: true,
    },
  });

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  return supplier;
}

export async function create(data: CreateSupplierInput) {
  return prisma.supplier.create({
    data,
  });
}

export async function update(id: string, data: UpdateSupplierInput) {
  return prisma.supplier.update({
    where: { id, isActive: true },
    data,
  });
}

export async function remove(id: string) {
  return serializable(async (tx) => {
    const active = await tx.supplier.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!active) throw new AppError("Supplier not found", 404);
    const purchasesCount = await tx.purchase.count({
      where: { supplierId: id },
    });

    if (purchasesCount > 0) {
      throw new AppError("Supplier has purchases registered", 409);
    }

    return tx.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  });
}
