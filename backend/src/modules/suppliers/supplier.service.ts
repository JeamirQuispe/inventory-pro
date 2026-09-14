import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from "./supplier.schema";

export async function findAll() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
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
  await findById(id);

  return prisma.supplier.update({
    where: { id },
    data,
  });
}

export async function remove(id: string) {
  await findById(id);

  const purchasesCount = await prisma.purchase.count({
    where: { supplierId: id },
  });

  if (purchasesCount > 0) {
    throw new AppError("Supplier has purchases registered", 409);
  }

  return prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });
}
