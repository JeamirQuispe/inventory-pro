import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.schema";

export async function findAll() {
  return prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
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
  await findById(id);

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function remove(id: string) {
  await findById(id);

  const salesCount = await prisma.sale.count({
    where: { customerId: id },
  });

  if (salesCount > 0) {
    throw new AppError("Customer has sales registered", 409);
  }

  return prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}
