import { Role } from "@prisma/client";

import { roleMiddleware } from "./role.middleware";

export const adminOnly = roleMiddleware(Role.ADMIN);

export const canManageCatalog = roleMiddleware(Role.ADMIN, Role.WAREHOUSE);

export const canManagePurchases = roleMiddleware(Role.ADMIN, Role.WAREHOUSE);

export const canManageSales = roleMiddleware(Role.ADMIN, Role.SELLER);
export const canManageCustomers = roleMiddleware(Role.ADMIN, Role.SELLER, Role.WAREHOUSE);

export const canViewInventory = roleMiddleware(Role.ADMIN, Role.WAREHOUSE);
