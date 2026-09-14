import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  address: z.string().trim().max(180).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
