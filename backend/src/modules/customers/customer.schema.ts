import { z } from "zod";
import { optionalEmailSchema, optionalPhoneSchema } from "../../utils/validation";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  address: z.string().trim().max(180).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
