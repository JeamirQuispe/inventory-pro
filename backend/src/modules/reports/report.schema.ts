import { z } from "zod";

export const reportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must not be after end date",
    path: ["to"],
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;
