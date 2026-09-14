import { z } from "zod";

export const stockMovementQuerySchema = z.object({
  productId: z.string().uuid().optional(),
});

export const createStockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  newStock: z.coerce.number().int().min(0),
  reason: z.string().trim().min(3).max(255),
});

export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;
export type CreateStockAdjustmentInput = z.infer<
  typeof createStockAdjustmentSchema
>;
