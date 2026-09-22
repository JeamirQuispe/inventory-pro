import type { Category, Contact, Product, Role, User } from "../../lib/types";
export type CatalogKind = "products" | "categories" | "suppliers" | "customers" | "users";
export type CatalogRecord = { id: string; name: string } & Partial<
  Product & Category & Contact & User
>;
export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  minLength?: number;
  maxLength?: number;
}
interface CatalogConfig {
  title: string;
  singular: string;
  subtitle: string;
  roles: Role[];
  fields: Field[];
}
const name: Field = { name: "name", label: "Nombre", required: true, minLength: 2, maxLength: 120 };
const contact: Field[] = [
  name,
  { name: "email", label: "Correo electrónico", type: "email" },
  { name: "phone", label: "Teléfono", type: "tel", minLength: 9, maxLength: 9 },
  { name: "address", label: "Dirección", maxLength: 180 },
];
export const catalogConfig: Record<CatalogKind, CatalogConfig> = {
  products: {
    title: "Productos",
    singular: "producto",
    subtitle: "Catálogo, precios y disponibilidad de tu inventario.",
    roles: ["ADMIN", "WAREHOUSE"],
    fields: [
      name,
      { name: "sku", label: "SKU", required: true, minLength: 3, maxLength: 40 },
      {
        name: "price",
        label: "Precio de venta (S/)",
        type: "number",
        min: 0.01,
        max: 99999999.99,
        step: "0.01",
        required: true,
      },
      {
        name: "minStock",
        label: "Stock mínimo",
        type: "number",
        min: 0,
        max: 2147483647,
        required: true,
      },
      { name: "description", label: "Descripción", maxLength: 255 },
    ],
  },
  categories: {
    title: "Categorías",
    singular: "categoría",
    subtitle: "Organiza tus productos por familias.",
    roles: ["ADMIN", "WAREHOUSE"],
    fields: [
      { ...name, maxLength: 80 },
      { name: "description", label: "Descripción", maxLength: 255 },
    ],
  },
  suppliers: {
    title: "Proveedores",
    singular: "proveedor",
    subtitle: "Contactos que abastecen tu negocio.",
    roles: ["ADMIN", "WAREHOUSE"],
    fields: contact,
  },
  customers: {
    title: "Clientes",
    singular: "cliente",
    subtitle: "La información de tus clientes, en un solo lugar.",
    roles: ["ADMIN", "WAREHOUSE", "SELLER"],
    fields: contact,
  },
  users: {
    title: "Usuarios",
    singular: "usuario",
    subtitle: "Cuentas del equipo y permisos de acceso.",
    roles: ["ADMIN"],
    fields: [
      name,
      { name: "email", label: "Correo electrónico", type: "email", required: true },
      { name: "password", label: "Contraseña", type: "password", minLength: 8, maxLength: 72 },
    ],
  },
};
