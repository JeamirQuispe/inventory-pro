import { prisma } from "../../config/prisma";
import { serializable } from "../../utils/transaction";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import type { CreateCustomerInput, UpdateCustomerInput } from "./customer.schema";

export async function findAll(query: ListQuery) {
  const where: Prisma.CustomerWhereInput = {
    isActive: true,
    name: { contains: query.q, mode: "insensitive" },
  };
  return paginate(
    query,
    prisma.customer.findMany({
      where,
      ...paging(query),
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.customer.count({ where }),
  );
}

export async function findById(id: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      isActive: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return customer;
}

export async function create(data: CreateCustomerInput) {
  return prisma.customer.create({
    data,
  });
}

export async function update(id: string, data: UpdateCustomerInput) {
  return prisma.customer.update({
    where: { id, isActive: true },
    data,
  });
}

export async function remove(id: string) {
  return serializable(async (tx) => {
    const active = await tx.customer.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!active) throw new AppError("Customer not found", 404);
    const salesCount = await tx.sale.count({
      where: { customerId: id },
    });

    if (salesCount > 0) {
      throw new AppError("Customer has sales registered", 409);
    }

    return tx.customer.update({
      where: { id },
      data: { isActive: false },
    });
  });
}
