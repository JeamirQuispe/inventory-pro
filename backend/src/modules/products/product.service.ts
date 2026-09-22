import { prisma } from "../../config/prisma";
import { serializable } from "../../utils/transaction";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
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

export async function findAll(query: ListQuery) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: query.categoryId,
    ...(query.lowStock === "true" ? { stock: { lte: prisma.product.fields.minStock } } : {}),
    OR: [
      { name: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ],
  };
  return paginate(
    query,
    prisma.product.findMany({
      where,
      ...paging(query),
      include: productInclude,
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.product.count({ where }),
  );
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
  return serializable(async (tx) => {
    const category = await tx.category.findFirst({
      where: {
        id: data.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const productExists = await tx.product.findUnique({
      where: { sku: data.sku },
    });

    if (productExists) {
      throw new AppError("Product SKU already exists", 409);
    }

    return tx.product.create({
      data,
      include: productInclude,
    });
  });
}

export async function update(id: string, data: UpdateProductInput) {
  return serializable(async (tx) => {
    if (data.categoryId) {
      const category = await tx.category.findFirst({
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
      const productExists = await tx.product.findUnique({
        where: { sku: data.sku },
      });

      if (productExists && productExists.id !== id) {
        throw new AppError("Product SKU already exists", 409);
      }
    }

    return tx.product.update({
      where: { id, isActive: true },
      data,
      include: productInclude,
    });
  });
}

export async function remove(id: string) {
  return serializable(async (tx) => {
    const product = await tx.product.findFirst({ where: { id, isActive: true } });
    if (!product) throw new AppError("Product not found", 404);
    if (product.stock !== 0)
      throw new AppError("Adjust stock to zero before deactivating this product", 409);

    return tx.product.update({
      where: { id },
      data: { isActive: false },
    });
  });
}
