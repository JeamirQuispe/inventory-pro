import { prisma } from "../../config/prisma";
import { serializable } from "../../utils/transaction";
import { paginate, paging, type ListQuery } from "../../utils/pagination";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function findAll(query: ListQuery) {
  const where: Prisma.UserWhereInput = { name: { contains: query.q, mode: "insensitive" } };
  return paginate(
    query,
    prisma.user.findMany({
      where,
      ...paging(query),
      select: userSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.user.count({ where }),
  );
}

export async function findById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function create(data: CreateUserInput) {
  const userExists = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (userExists) {
    throw new AppError("User email already exists", 409);
  }

  const password = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      ...data,
      password,
    },
    select: userSelect,
  });
}

export async function update(id: string, data: UpdateUserInput) {
  const password = data.password ? await hashPassword(data.password) : undefined;
  return serializable(async (tx) => {
    const current = await tx.user.findUnique({ where: { id } });
    if (!current) throw new AppError("User not found", 404);
    if (
      current.role === "ADMIN" &&
      current.isActive &&
      (data.isActive === false || (data.role && data.role !== "ADMIN"))
    ) {
      const remaining = await tx.user.count({
        where: { role: "ADMIN", isActive: true, id: { not: id } },
      });
      if (remaining === 0) throw new AppError("At least one active administrator is required", 409);
    }

    if (data.email) {
      const userExists = await tx.user.findUnique({
        where: { email: data.email },
      });

      if (userExists && userExists.id !== id) {
        throw new AppError("User email already exists", 409);
      }
    }

    return tx.user.update({
      where: { id },
      data: {
        ...data,
        password,
        ...(password ||
        (data.isActive !== undefined && data.isActive !== current.isActive) ||
        (data.role !== undefined && data.role !== current.role)
          ? { tokenVersion: { increment: 1 } }
          : {}),
      },
      select: userSelect,
    });
  });
}

export async function remove(id: string) {
  return update(id, { isActive: false });
}
