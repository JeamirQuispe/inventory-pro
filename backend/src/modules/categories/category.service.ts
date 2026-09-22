import { prisma } from "../../config/prisma";
import { serializable } from "../../utils/transaction";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema";

export async function findAll(query: ListQuery) {
  const where: Prisma.CategoryWhereInput = {
    isActive: true,
    name: { contains: query.q, mode: "insensitive" },
  };
  return paginate(
    query,
    prisma.category.findMany({
      where,
      ...paging(query),
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.category.count({ where }),
  );
}

export async function findById(id: string) {
  const category = await prisma.category.findFirst({
    where: {
      id,
      isActive: true,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

export async function create(data: CreateCategoryInput) {
  const categoryExists = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (categoryExists) {
    throw new AppError("Category name already exists", 409);
  }

  return prisma.category.create({
    data,
  });
}

export async function update(id: string, data: UpdateCategoryInput) {
  await findById(id);

  if (data.name) {
    const categoryExists = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (categoryExists && categoryExists.id !== id) {
      throw new AppError("Category name already exists", 409);
    }
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function remove(id: string) {
  return serializable(async (tx) => {
    const category = await tx.category.findFirst({ where: { id, isActive: true } });
    if (!category) throw new AppError("Category not found", 404);
    const productsCount = await tx.product.count({
      where: {
        categoryId: id,
        isActive: true,
      },
    });

    if (productsCount > 0) {
      throw new AppError("Category has active products", 409);
    }

    return tx.category.update({
      where: { id },
      data: { isActive: false },
    });
  });
}
