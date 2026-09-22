import { z } from "zod";
import { emailSchema } from "../../utils/validation";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
