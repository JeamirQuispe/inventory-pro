import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { signToken } from "../../utils/jwt";
import { comparePassword } from "../../utils/password";
import type { LoginInput } from "./auth.schema";

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.isActive) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
