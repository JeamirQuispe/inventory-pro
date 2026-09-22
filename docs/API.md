# Contrato de la API

Base local: `http://localhost:4000/api`. El cuerpo es JSON con `Content-Type: application/json`. Importa [openapi.json](openapi.json) en un cliente compatible para explorar los endpoints.

## Autenticación en Thunder Client

1. Crea una petición POST a `/api/auth/login` con el cuerpo siguiente.
2. Copia el valor de `token` de la respuesta, sin las comillas del JSON.
3. En una petición GET a `/api/auth/me`, usa Auth → Bearer e introduce solo el token. Alternativamente añade el encabezado `Authorization: Bearer TOKEN`.
4. La respuesta de `/me` identifica al usuario. Un 401 indica token inválido/expirado o cuenta revocada; un 403 indica que el rol no permite la acción.

```json
{ "email": "admin@inventorypro.com", "password": "Admin123*" }
```

Respuesta de login: `{ "token": "...", "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" } }`. Ninguna respuesta de usuario incluye contraseña ni hash.

## Rutas y permisos

Todas las rutas, excepto health y login, requieren autenticación. A = ADMIN, W = WAREHOUSE, S = SELLER.

| Recurso       | GET lista / detalle | POST    | PUT `/:id` | DELETE `/:id` |
| ------------- | ------------------- | ------- | ---------- | ------------- |
| `/categories` | A, W, S             | A, W    | A, W       | A             |
| `/products`   | A, W, S             | A, W    | A, W       | A             |
| `/suppliers`  | A, W                | A, W    | A, W       | A             |
| `/customers`  | A, W, S             | A, W, S | A, W, S    | A             |
| `/users`      | A                   | A       | A          | A             |
| `/purchases`  | A, W                | A, W    | No existe  | No existe     |
| `/sales`      | A, S                | A, S    | No existe  | No existe     |

| Ruta                                | Permiso / resultado                                          |
| ----------------------------------- | ------------------------------------------------------------ |
| `GET /health`                       | Público; estado del proceso                                  |
| `POST /auth/login`                  | Público; máximo 20 intentos fallidos por IP en 15 minutos    |
| `GET /auth/me`                      | Cualquier usuario autenticado                                |
| `GET /stock-movements`              | A, W; lista paginada                                         |
| `POST /stock-movements/adjustments` | A, W; ajuste auditado                                        |
| `GET /reports/dashboard`            | A, W; resumen                                                |
| `GET /reports/low-stock`            | A, W; productos con stock menor o igual al mínimo, paginados |

## Paginación y filtros

Las listas devuelven un objeto, **no un array directo**. Este contrato reemplaza la lista sin paginación de la primera versión.

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

`page` empieza en 1; `pageSize` admite 1–100 y vale 20 por defecto. `q` busca nombres sin distinguir mayúsculas. En productos también busca SKU; en compras/ventas busca el contacto y las notas; en movimientos, el nombre del producto. Usuarios incluye activos e inactivos; los demás catálogos solo activos.

Ejemplos:

```http
GET /api/products?page=1&pageSize=20&q=arroz
GET /api/products?categoryId=UUID&lowStock=true
GET /api/stock-movements?productId=UUID&page=1
GET /api/reports/dashboard?from=2026-09-01T00:00:00-05:00&to=2026-09-30T23:59:59.999-05:00
```

Los límites temporales son inclusivos. Usa fecha/hora ISO con zona; el frontend convierte sus fechas locales a instantes ISO. Productos y stock del dashboard representan el estado actual, aunque se filtre el período de compras/ventas. `recentMovements` devuelve hasta diez registros del período; `lowStockCount` cuenta todos los productos afectados aunque `lowStockProducts` muestre hasta diez.

## Cuerpos

Categoría:

```json
{ "name": "Bebidas", "description": "Gaseosas y agua" }
```

Producto, siempre creado con stock cero:

```json
{
  "name": "Agua 625 ml",
  "sku": "AGUA-625",
  "price": 2.5,
  "minStock": 5,
  "categoryId": "UUID_DE_CATEGORIA"
}
```

`stock` no se acepta ni al crear ni al editar productos. `price` es positivo, con máximo dos decimales y máximo `99999999.99`; `minStock` es entero entre 0 y 2147483647. Nombre: 2–120 caracteres; SKU: 3–40; descripción opcional: hasta 255. La categoría debe estar activa.

Proveedor o cliente:

```json
{
  "name": "María Torres",
  "email": "maria@example.com",
  "phone": "999888777",
  "address": "Av. Central 123"
}
```

Email, teléfono y dirección son opcionales. Para vaciar email o teléfono se admite `""` o `null`; se almacena `null`. Teléfono no vacío: exactamente 9 dígitos ASCII, como `999888777`, sin espacios, letras ni código de país. Esta es una regla del negocio para números nacionales, no una comprobación de que el número exista. Dirección: hasta 180.

Usuario:

```json
{
  "name": "Vendedor",
  "email": "vendedor@example.com",
  "password": "UnaClaveUnica123*",
  "role": "SELLER"
}
```

Rol por defecto: SELLER. La contraseña tiene mínimo 8 caracteres y máximo 72 bytes UTF-8. Email se normaliza a minúsculas. En una actualización puede omitirse la contraseña para conservarla y puede enviarse `isActive`. Un administrador no puede desactivarse a sí mismo ni cambiar su propio rol; debe conservarse al menos un administrador activo.

Compra:

```json
{
  "supplierId": "UUID_DE_PROVEEDOR",
  "notes": "Reposición semanal",
  "items": [{ "productId": "UUID_DE_PRODUCTO", "quantity": 10, "unitCost": 1.2 }]
}
```

Venta:

```json
{
  "customerId": "UUID_DE_CLIENTE",
  "notes": "Venta en mostrador",
  "items": [{ "productId": "UUID_DE_PRODUCTO", "quantity": 2, "unitPrice": 2.5 }]
}
```

`customerId` es opcional; omítelo para una venta sin cliente. Compras requieren proveedor. Ambas admiten de 1 a 100 productos sin repetir; cantidad entera de 1 a 1000000. Notas: hasta 255 caracteres. Los precios unitarios siguen los límites monetarios del producto. El servidor calcula y valida subtotales/total; devuelve importes decimales como cadenas, por ejemplo `"5"` o `"2.5"`, sin garantizar ceros finales. Detalles incluyen productos y la persona que registró la operación.

Ajuste:

```json
{ "productId": "UUID_DE_PRODUCTO", "newStock": 12, "reason": "Conteo físico de cierre" }
```

`newStock` es el stock final, no la diferencia. El motivo tiene 3–255 caracteres. En movimientos de compra/venta, `quantity` es positiva; en ajustes es la diferencia con signo. Para obtener la variación de cualquier movimiento utiliza `newStock - previousStock`.

## Actualización y errores

PUT acepta los campos modificados; los omitidos se conservan. Los IDs de rutas y relaciones son UUID. Los DELETE exitosos devuelven 204 sin cuerpo y desactivan registros.

| Código | Significado                                                                         |
| ------ | ----------------------------------------------------------------------------------- |
| 200    | Consulta o actualización correcta                                                   |
| 201    | Registro creado                                                                     |
| 204    | Baja lógica completada                                                              |
| 400    | Datos, UUID, JSON o parámetros inválidos                                            |
| 401    | Credenciales o token inválidos                                                      |
| 403    | Rol sin permiso                                                                     |
| 404    | Ruta o registro no encontrado                                                       |
| 409    | Duplicado, stock insuficiente, relación que impide una baja o conflicto concurrente |
| 413    | Cuerpo superior a 100 KB                                                            |
| 429    | Límite de intentos de acceso                                                        |
| 500    | Error inesperado; el cliente no recibe detalles internos                            |

Errores: `{ "message": "..." }`. Las validaciones agregan `errors`, un mapa de campos a mensajes. La interfaz traduce los errores habituales del backend al español; algunas validaciones, como teléfono, ya incluyen un mensaje en español.

Ante una respuesta perdida al registrar una compra o venta, revisa primero el historial: no se implementa idempotencia de peticiones. Un ajuste de inventario no sustituye una devolución o anulación contable.
