import { prisma } from "../../config/prisma";
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

export async function findAll() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
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
  await findById(id);

  if (data.email) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists && userExists.id !== id) {
      throw new AppError("User email already exists", 409);
    }
  }

  const password = data.password ? await hashPassword(data.password) : undefined;

  return prisma.user.update({
    where: { id },
    data: {
      ...data,
      password,
    },
    select: userSelect,
  });
}

export async function remove(id: string) {
  await findById(id);

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userSelect,
  });
}
