# InventoryPro

Sistema de inventario y ventas construido con Express, TypeScript, PostgreSQL y Prisma.

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Antes de migrar, revisa `backend/.env` y ajusta `DATABASE_URL` con tu usuario y contrasena de PostgreSQL.

Servidor local:

```txt
http://localhost:4000/api
```

Usuario inicial:

```txt
Email: admin@inventorypro.com
Password: Admin123*
```

## Modulos API

```txt
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/purchases
GET    /api/purchases/:id
POST   /api/purchases

GET    /api/sales
GET    /api/sales/:id
POST   /api/sales

GET    /api/stock-movements
POST   /api/stock-movements/adjustments

GET    /api/reports/dashboard
GET    /api/reports/low-stock
```

La mayoria de endpoints requieren:

```txt
Authorization: Bearer TU_TOKEN
```

## Roles

```txt
ADMIN      Gestion completa, usuarios y eliminaciones logicas.
WAREHOUSE  Catalogo, compras, ajustes y consulta de inventario.
SELLER     Ventas y consulta de productos permitida por rutas habilitadas.
```
