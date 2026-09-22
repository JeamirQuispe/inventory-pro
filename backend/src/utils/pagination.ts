import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).default(""),
  categoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
export const paging = (query: ListQuery) => ({
  skip: (query.page - 1) * query.pageSize,
  take: query.pageSize,
});
export async function paginate<T>(
  query: ListQuery,
  rows: Prisma.PrismaPromise<T[]>,
  count: Prisma.PrismaPromise<number>,
) {
  const [data, total] = await prisma.$transaction([rows, count], {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
  return {
    data,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}
