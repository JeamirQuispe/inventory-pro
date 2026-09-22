import { z } from "zod";
import { moneySchema, stockSchema } from "../../utils/validation";

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    sku: z.string().trim().min(3).max(40),
    description: z.string().trim().max(255).optional(),
    price: moneySchema,
    minStock: stockSchema.default(5),
    categoryId: z.string().uuid(),
  })
  .strict();

export const updateProductSchema = createProductSchema
  .omit({ minStock: true })
  .partial()
  .extend({ minStock: stockSchema.optional() });

export const productParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
