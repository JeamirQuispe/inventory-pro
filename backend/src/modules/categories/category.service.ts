import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.schema";

export async function findAll() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
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
  await findById(id);

  const productsCount = await prisma.product.count({
    where: {
      categoryId: id,
      isActive: true,
    },
  });

  if (productsCount > 0) {
    throw new AppError("Category has active products", 409);
  }

  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}
