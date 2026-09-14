import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
};

export async function findAll() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: { name: "asc" },
  });
}

export async function findById(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: productInclude,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}

export async function create(data: CreateProductInput) {
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const productExists = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (productExists) {
    throw new AppError("Product SKU already exists", 409);
  }

  return prisma.product.create({
    data,
    include: productInclude,
  });
}

export async function update(id: string, data: UpdateProductInput) {
  await findById(id);

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  if (data.sku) {
    const productExists = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (productExists && productExists.id !== id) {
      throw new AppError("Product SKU already exists", 409);
    }
  }

  return prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });
}

export async function remove(id: string) {
  await findById(id);

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}
