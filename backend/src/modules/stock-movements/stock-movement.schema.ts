import { z } from "zod";
import { stockSchema } from "../../utils/validation";
import { listQuerySchema } from "../../utils/pagination";

export const stockMovementQuerySchema = listQuerySchema;

export const createStockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  newStock: stockSchema,
  reason: z.string().trim().min(3).max(255),
});

export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;
export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>;
