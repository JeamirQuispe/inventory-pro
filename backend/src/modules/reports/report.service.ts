import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client";
import type { ListQuery } from "../../utils/pagination";
import * as productService from "../products/product.service";
import type { ReportQuery } from "./report.schema";

function buildDateFilter(query: ReportQuery) {
  return {
    gte: query.from,
    lte: query.to,
  };
}

export async function getDashboard(query: ReportQuery) {
  const createdAt = buildDateFilter(query);

  const [
    totalProducts,
    lowStockProducts,
    totalCategories,
    totalSuppliers,
    totalCustomers,
    salesSummary,
    purchasesSummary,
    recentMovements,
    lowStockCount,
  ] = await prisma.$transaction(
    [
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: prisma.product.fields.minStock },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          minStock: true,
        },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.sale.aggregate({
        where: { createdAt },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.purchase.aggregate({
        where: { createdAt },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.stockMovement.findMany({
        where: { createdAt },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.product.count({
        where: { isActive: true, stock: { lte: prisma.product.fields.minStock } },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );

  return {
    totals: {
      products: totalProducts,
      categories: totalCategories,
      suppliers: totalSuppliers,
      customers: totalCustomers,
    },
    purchases: {
      count: purchasesSummary._count.id,
      totalAmount: purchasesSummary._sum.totalAmount ?? 0,
    },
    sales: {
      count: salesSummary._count.id,
      totalAmount: salesSummary._sum.totalAmount ?? 0,
    },
    lowStockProducts,
    lowStockCount,
    recentMovements,
  };
}

export async function getLowStockProducts(query: ListQuery) {
  return productService.findAll({ ...query, lowStock: "true" });
}
