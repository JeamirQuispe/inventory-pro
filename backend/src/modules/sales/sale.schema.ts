import { z } from "zod";
import { moneySchema, quantitySchema } from "../../utils/validation";

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: quantitySchema,
  unitPrice: moneySchema,
});

export const createSaleSchema = z
  .object({
    customerId: z.string().uuid().optional(),
    notes: z.string().trim().max(255).optional(),
    items: z.array(saleItemSchema).min(1).max(100),
  })
  .superRefine((data, ctx) => {
    const productIds = new Set<string>();

    for (const item of data.items) {
      if (productIds.has(item.productId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Sale items cannot repeat products",
        });
      }

      productIds.add(item.productId);
    }
  });

export const saleParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
