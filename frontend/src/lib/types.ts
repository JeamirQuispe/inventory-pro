export type Role = "ADMIN" | "WAREHOUSE" | "SELLER";
export interface Entity {
  id: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
}
export interface User extends Entity {
  email: string;
  role: Role;
}
export interface Category extends Entity {
  description?: string | null;
}
export interface Contact extends Entity {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}
export interface Product extends Entity {
  sku: string;
  description?: string | null;
  price: string;
  stock: number;
  minStock: number;
  categoryId: string;
  category: Pick<Category, "id" | "name">;
}
export interface Movement {
  id: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
  product: Pick<Product, "id" | "name" | "sku">;
  createdBy: Pick<User, "id" | "name" | "role">;
}
export interface Transaction {
  id: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  supplier?: Pick<Contact, "id" | "name">;
  customer?: Pick<Contact, "id" | "name"> | null;
  createdBy: Pick<User, "id" | "name" | "role">;
  items: {
    id: string;
    product: Pick<Product, "id" | "name" | "sku">;
    quantity: number;
    unitCost?: string;
    unitPrice?: string;
    subtotal: string;
  }[];
}
export interface Page<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Dashboard {
  totals: { products: number; categories: number; suppliers: number; customers: number };
  sales: { count: number; totalAmount: string | number };
  purchases: { count: number; totalAmount: string | number };
  lowStockCount: number;
  lowStockProducts: Pick<Product, "id" | "name" | "sku" | "stock" | "minStock">[];
  recentMovements: Movement[];
}
