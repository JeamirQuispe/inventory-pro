import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { hashPassword } from "../src/utils/password";

export async function prepareTestDatabase() {
  const url = new URL(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL!);
  if (!process.env.TEST_DATABASE_URL) url.pathname = "/inventory_pro_test";
  const name = url.pathname.slice(1);
  if (!/^[a-z0-9_]+_test$/.test(name)) throw new Error("Test database name must end in _test");
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const exists = await admin.$queryRaw<
      { exists: boolean }[]
    >`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${name})`;
    // The identifier is restricted above; PostgreSQL does not bind database identifiers.
    if (!exists[0].exists) await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.$disconnect();
  }
  process.env.DATABASE_URL = url.toString();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "inventory-pro-test-secret-only";
  const migration = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: process.env, encoding: "utf8" },
  );
  if (migration.status !== 0) throw new Error(migration.stderr || migration.stdout);
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  await db.$executeRawUnsafe(
    'TRUNCATE "stock_movements", "sale_items", "purchase_items", "sales", "purchases", "products", "categories", "suppliers", "customers", "users" CASCADE',
  );
  const password = await hashPassword("TestAdmin123*");
  const user = await db.user.create({
    data: { name: "Demo Admin", email: "admin@test.local", password, role: "ADMIN" },
  });
  const category = await db.category.create({
    data: { name: "Bebidas", description: "Bebidas para el negocio" },
  });
  await db.category.create({
    data: { name: "Abarrotes", description: "Productos de primera necesidad" },
  });
  await db.supplier.create({
    data: { name: "Distribuidora Central", email: "ventas@example.com" },
  });
  await db.customer.create({ data: { name: "María Torres", email: "maria@example.com" } });
  for (const [name, sku, price, stock] of [
    ["Agua mineral 625 ml", "BEB-AGUA", 2.5, 24],
    ["Gaseosa 500 ml", "BEB-GAS", 3.5, 3],
    ["Jugo de naranja 1 L", "BEB-JUG", 6.9, 0],
  ] as const) {
    await db.product.create({
      data: {
        name,
        sku,
        price,
        stock,
        minStock: 5,
        categoryId: category.id,
        ...(stock
          ? {
              stockMovements: {
                create: {
                  createdById: user.id,
                  type: "ADJUSTMENT",
                  previousStock: 0,
                  newStock: stock,
                  quantity: stock,
                  reason: "Apertura de prueba",
                },
              },
            }
          : {}),
      },
    });
  }
  return { db, user };
}
