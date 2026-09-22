import { Role } from "@prisma/client";
import { z } from "zod";
import { emailSchema, passwordSchema } from "../../utils/validation";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.nativeEnum(Role).default(Role.SELLER),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true, role: true })
  .partial()
  .extend({
    role: z.nativeEnum(Role).optional(),
    password: passwordSchema.optional(),
    isActive: z.boolean().optional(),
  });

export const userParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
