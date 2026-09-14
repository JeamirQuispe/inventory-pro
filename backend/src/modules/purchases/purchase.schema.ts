import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().positive(),
});

export const createPurchaseSchema = z
  .object({
    supplierId: z.string().uuid(),
    notes: z.string().trim().max(255).optional(),
    items: z.array(purchaseItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const productIds = new Set<string>();

    for (const item of data.items) {
      if (productIds.has(item.productId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Purchase items cannot repeat products",
        });
      }

      productIds.add(item.productId);
    }
  });

export const purchaseParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
