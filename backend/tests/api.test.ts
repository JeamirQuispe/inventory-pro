import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import { prepareTestDatabase } from "./database";

let server: Server;
let db: PrismaClient;
let base: string;
let admin: string;
let seller: string;
let warehouse: string;
let adminId: string;
let sellerId: string;
let categoryId: string;
let productId: string;
let supplierId: string;
let customerId: string;
async function request(method: string, path: string, token?: string, data?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
}
before(async () => {
  const ready = await prepareTestDatabase();
  db = ready.db;
  adminId = ready.user.id;
  const { app } = await import("../src/app");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  admin = (
    await request("POST", "/auth/login", undefined, {
      email: "admin@test.local",
      password: "TestAdmin123*",
    })
  ).body.token;
  for (const role of ["SELLER", "WAREHOUSE"] as const) {
    const created = await request("POST", "/users", admin, {
      name: role,
      email: `${role.toLowerCase()}@test.local`,
      password: "TestUser123*",
      role,
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.password, undefined);
    const token = (
      await request("POST", "/auth/login", undefined, {
        email: created.body.email,
        password: "TestUser123*",
      })
    ).body.token;
    if (role === "SELLER") {
      seller = token;
      sellerId = created.body.id;
    } else warehouse = token;
  }
  categoryId = (await request("POST", "/categories", admin, { name: "Integración" })).body.id;
  supplierId = (await request("POST", "/suppliers", warehouse, { name: "Proveedor Integración" }))
    .body.id;
  customerId = (await request("POST", "/customers", seller, { name: "Cliente Integración" })).body
    .id;
  const product = await request("POST", "/products", warehouse, {
    name: "Producto Integración",
    sku: "TEST-INTEGRATION",
    price: 0.3,
    minStock: 2,
    categoryId,
  });
  assert.equal(product.status, 201);
  assert.equal(product.body.stock, 0);
  productId = product.body.id;
});
after(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await db?.$disconnect();
  const { prisma } = await import("../src/config/prisma");
  await prisma.$disconnect();
});

test("authentication rejects missing, malformed and incorrect credentials", async () => {
  assert.equal((await request("GET", "/auth/me")).status, 401);
  assert.equal((await request("GET", "/auth/me", '"invalid"')).status, 401);
  assert.equal(
    (
      await request("POST", "/auth/login", undefined, {
        email: "admin@test.local",
        password: "wrong",
      })
    ).status,
    401,
  );
  const me = await request("GET", "/auth/me", admin);
  assert.equal(me.status, 200);
  assert.equal(me.body.password, undefined);
});
test("roles protect every restricted module and allow seller customer management", async () => {
  for (const path of ["/users", "/purchases", "/reports/dashboard", "/stock-movements"])
    assert.equal((await request("GET", path, seller)).status, 403, path);
  for (const path of ["/sales", "/users"])
    assert.equal((await request("GET", path, warehouse)).status, 403, path);
  for (const path of ["/products", "/categories", "/suppliers"])
    assert.equal((await request("POST", path, seller, {})).status, 403, path);
  assert.equal((await request("DELETE", `/products/${productId}`, warehouse)).status, 403);
  assert.equal((await request("GET", `/customers/${customerId}`, seller)).status, 200);
});
test("validation rejects unaudited stock, invalid money, duplicate lines and bad pagination", async () => {
  assert.equal((await request("PUT", `/products/${productId}`, admin, { stock: 999 })).status, 400);
  assert.equal(
    (await request("PUT", `/products/${productId}`, admin, { price: 1.001 })).status,
    400,
  );
  assert.equal((await request("GET", "/products?pageSize=1000", admin)).status, 400);
  assert.equal((await request("GET", "/products/not-a-uuid", admin)).status, 400);
  const line = { productId, quantity: 1, unitPrice: 0.3 };
  assert.equal((await request("POST", "/sales", seller, { items: [line, line] })).status, 400);
  assert.equal(
    (await request("GET", "/reports/dashboard?from=2026-10-10&to=2026-01-01", admin)).status,
    400,
  );
});
test("purchase commits exact money, stock and its audit movement together", async () => {
  const purchase = await request("POST", "/purchases", warehouse, {
    supplierId,
    items: [{ productId, quantity: 10, unitCost: 0.1 }],
  });
  assert.equal(purchase.status, 201);
  assert.equal(purchase.body.totalAmount, "1");
  assert.equal(purchase.body.items[0].subtotal, "1");
  assert.equal((await request("GET", `/products/${productId}`, admin)).body.stock, 10);
  const movements = await request("GET", `/stock-movements?productId=${productId}`, admin);
  assert.equal(movements.body.data[0].newStock, 10);
  assert.equal(movements.body.data[0].previousStock, 0);
  assert.equal((await request("GET", `/purchases/${purchase.body.id}`, warehouse)).status, 200);
});
test("concurrent sales cannot oversell and failed sale leaves no partial records", async () => {
  const payload = { customerId, items: [{ productId, quantity: 7, unitPrice: 0.3 }] };
  const responses = await Promise.all([
    request("POST", "/sales", seller, payload),
    request("POST", "/sales", seller, payload),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal((await request("GET", `/products/${productId}`, admin)).body.stock, 3);
  const sale = responses.find((response) => response.status === 201)!;
  assert.equal(sale.body.totalAmount, "2.1");
  const records = await db.saleItem.count({ where: { productId } });
  assert.equal(records, 1);
  assert.equal((await request("GET", `/sales/${sale.body.id}`, seller)).status, 200);
});
test("adjustments audit differences and reject no-op; deletion preserves relationships", async () => {
  assert.equal((await request("DELETE", `/products/${productId}`, admin)).status, 409);
  assert.equal((await request("DELETE", `/categories/${categoryId}`, admin)).status, 409);
  assert.equal((await request("DELETE", `/suppliers/${supplierId}`, admin)).status, 409);
  assert.equal((await request("DELETE", `/customers/${customerId}`, admin)).status, 409);
  const adjustment = await request("POST", "/stock-movements/adjustments", warehouse, {
    productId,
    newStock: 0,
    reason: "Conteo de prueba",
  });
  assert.equal(adjustment.status, 201);
  assert.equal(adjustment.body.quantity, -3);
  assert.equal(
    (
      await request("POST", "/stock-movements/adjustments", warehouse, {
        productId,
        newStock: 0,
        reason: "Sin cambios",
      })
    ).status,
    409,
  );
  assert.equal((await request("DELETE", `/products/${productId}`, admin)).status, 204);
  assert.equal((await request("GET", `/products/${productId}`, admin)).status, 404);
  assert.equal((await request("DELETE", `/categories/${categoryId}`, admin)).status, 204);
  assert.equal(await db.stockMovement.count({ where: { productId } }), 3);
});
test("collections paginate, search and report real totals", async () => {
  const result = await request("GET", "/products?pageSize=1&q=BEB", admin);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.total, 3);
  assert.equal(result.body.totalPages, 3);
  const dashboard = await request("GET", "/reports/dashboard", admin);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.lowStockCount, 2);
  assert.equal(dashboard.body.sales.totalAmount, "2.1");
  assert.equal((await request("GET", "/reports/low-stock", warehouse)).status, 200);
});
test("CRUD handles optional fields, duplicate values and missing resources", async () => {
  for (const path of ["suppliers", "customers"]) {
    const created = await request("POST", `/${path}`, admin, {
      name: "Temporal",
      email: "valid@example.com",
      phone: "987654321",
    });
    assert.equal(created.status, 201);
    const edited = await request("PUT", `/${path}/${created.body.id}`, admin, {
      email: "",
      phone: "",
      name: "Actualizado",
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.email, null);
    assert.equal(edited.body.phone, null);
    assert.equal((await request("DELETE", `/${path}/${created.body.id}`, admin)).status, 204);
  }
  assert.equal((await request("POST", "/categories", admin, { name: "Bebidas" })).status, 409);
  assert.equal((await request("GET", "/not-found", admin)).status, 404);
  const malformed = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
});

test("partial edits preserve defaults and password changes revoke previous tokens", async () => {
  const product = (await request("GET", "/products?pageSize=1", admin)).body.data[0];
  await request("PUT", `/products/${product.id}`, admin, { minStock: 8 });
  const edited = await request("PUT", `/products/${product.id}`, admin, { name: "Renombrado" });
  assert.equal(edited.body.minStock, 8);
  const profile = await request("PUT", `/users/${adminId}`, admin, { name: "Admin Renombrado" });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.role, "ADMIN");
  assert.equal((await request("GET", "/auth/me", admin)).status, 200);
  await request("PUT", `/users/${sellerId}`, admin, { password: "ChangedPass123*" });
  assert.equal((await request("GET", "/auth/me", seller)).status, 401);
  seller = (
    await request("POST", "/auth/login", undefined, {
      email: "seller@test.local",
      password: "ChangedPass123*",
    })
  ).body.token;
  assert.ok(seller);
});
test("deactivated users lose access immediately and admin cannot lock themselves out", async () => {
  assert.equal((await request("DELETE", `/users/${adminId}`, admin)).status, 409);
  assert.equal((await request("PUT", `/users/${adminId}`, admin, { role: "SELLER" })).status, 409);
  assert.equal((await request("DELETE", `/users/${sellerId}`, admin)).status, 204);
  assert.equal((await request("GET", "/auth/me", seller)).status, 401);
});

test("contact phones require nine digits on create and update without corrupting saved data", async () => {
  for (const resource of ["customers", "suppliers"]) {
    const created = await request("POST", `/${resource}`, admin, {
      name: "Phone validation",
      phone: "987654321",
    });
    assert.equal(created.status, 201);
    const id = created.body.id;
    const beforeCount = (await request("GET", `/${resource}`, admin)).body.total;
    for (const phone of [
      "12345678",
      "1234567890",
      "abcdefghi",
      "98765a321",
      "+51987654321",
      " 987654321 ",
      987654321,
    ]) {
      for (const method of ["POST", "PUT"]) {
        const response = await request(
          method,
          `/${resource}${method === "PUT" ? `/${id}` : ""}`,
          admin,
          { name: "Invalid phone", phone },
        );
        assert.equal(response.status, 400);
        assert.ok(response.body.errors.phone);
      }
    }
    assert.equal((await request("GET", `/${resource}`, admin)).body.total, beforeCount);
    const unchanged = await request("PUT", `/${resource}/${id}`, admin, {
      name: "Phone preserved",
    });
    assert.equal(unchanged.body.phone, "987654321");
    for (const phone of ["", null]) {
      const cleared = await request("PUT", `/${resource}/${id}`, admin, { phone });
      assert.equal(cleared.status, 200);
      assert.equal(cleared.body.phone, null);
    }
    assert.equal((await request("POST", `/${resource}`, admin, { name: "   " })).status, 400);
  }
});

test("login rate limit rejects repeated failed attempts", async () => {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 21; attempt++) {
    lastStatus = (
      await request("POST", "/auth/login", undefined, {
        email: "unknown@test.local",
        password: "incorrect",
      })
    ).status;
  }
  assert.equal(lastStatus, 429);
});
