import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("Admin123*");

  const admin = await prisma.user.upsert({
    where: { email: "admin@inventorypro.com" },
    update: {
      name: "InventoryPro Admin",
      password,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      name: "InventoryPro Admin",
      email: "admin@inventorypro.com",
      password,
      role: Role.ADMIN,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Bebidas" },
      update: {},
      create: {
        name: "Bebidas",
        description: "Productos liquidos para consumo.",
      },
    }),
    prisma.category.upsert({
      where: { name: "Abarrotes" },
      update: {},
      create: {
        name: "Abarrotes",
        description: "Productos basicos para venta diaria.",
      },
    }),
    prisma.category.upsert({
      where: { name: "Limpieza" },
      update: {},
      create: {
        name: "Limpieza",
        description: "Articulos de limpieza para el hogar o negocio.",
      },
    }),
  ]);

  const existingSupplier = await prisma.supplier.findFirst({
    where: { name: "Distribuidora Norte" },
  });

  const supplierData = {
    name: "Distribuidora Norte",
    email: "ventas@distribuidoranorte.com",
    phone: "999888777",
    address: "Av. Principal 123",
  };

  const supplier = existingSupplier
    ? await prisma.supplier.update({
        where: { id: existingSupplier.id },
        data: supplierData,
      })
    : await prisma.supplier.create({
        data: supplierData,
      });

  const existingCustomer = await prisma.customer.findFirst({
    where: { name: "Cliente General" },
  });

  const customerData = {
    name: "Cliente General",
    phone: "900111222",
  };

  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: customerData,
      })
    : await prisma.customer.create({
        data: customerData,
      });

  await Promise.all([
    prisma.product.upsert({
      where: { sku: "BEB-COCA-500" },
      update: {},
      create: {
        name: "Coca Cola 500ml",
        sku: "BEB-COCA-500",
        description: "Gaseosa personal.",
        price: 3.5,
        stock: 24,
        minStock: 6,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "ABA-ARROZ-1KG" },
      update: {},
      create: {
        name: "Arroz Extra 1kg",
        sku: "ABA-ARROZ-1KG",
        description: "Bolsa de arroz de 1 kilogramo.",
        price: 4.2,
        stock: 30,
        minStock: 10,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "LIM-DETER-500" },
      update: {},
      create: {
        name: "Detergente 500g",
        sku: "LIM-DETER-500",
        description: "Detergente en polvo.",
        price: 6.9,
        stock: 12,
        minStock: 5,
        categoryId: categories[2].id,
      },
    }),
  ]);

  console.log("Seed completed");
  console.log({
    admin: admin.email,
    defaultPassword: "Admin123*",
    supplier: supplier.name,
    customer: customer.name,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
