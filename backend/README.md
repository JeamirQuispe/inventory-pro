# Backend de InventoryPro

API REST en Express 5 y TypeScript, con PostgreSQL 16 y Prisma 6. Cada módulo mantiene rutas, controlador, validaciones y servicio juntos.

## Preparación

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env
```

Configura `DATABASE_URL` con una base PostgreSQL dedicada llamada `inventory_pro`. Crea esa base en pgAdmin o con `createdb inventory_pro`. Ajusta `JWT_SECRET`; no publiques el archivo `.env`.

```powershell
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

La API escucha en `http://localhost:4000/api`. El seed es exclusivamente de demostración: crea `admin@inventorypro.com` con contraseña `Admin123*` si la cuenta no existe. Volver a ejecutarlo no restablece la contraseña ni el stock de productos existentes. Las altas nuevas del seed incluyen su movimiento de apertura; no se inventan movimientos para datos históricos existentes.

## Comandos

| Comando                                   | Propósito                                                  |
| ----------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                             | API con recarga durante el desarrollo                      |
| `npm run typecheck`                       | Verifica tipos sin generar archivos                        |
| `npm run build`                           | Compila en `dist/`                                         |
| `npm start`                               | Ejecuta el código compilado                                |
| `npm run prisma:migrate -- --name nombre` | Crea una migración al cambiar el modelo durante desarrollo |
| `npm run prisma:deploy`                   | Aplica migraciones existentes sin crear otras              |
| `npm test`                                | Integración contra una base cuyo nombre termina en `_test` |

`npm test` prepara y vacía exclusivamente la base de pruebas. Nunca apuntes `TEST_DATABASE_URL` a datos que quieras conservar. Consulta [Pruebas](../docs/TESTING.md) antes de ejecutarlo en un entorno compartido.

## Configuración

| Variable            | Valor / comportamiento                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`      | URL PostgreSQL; requerida                                                   |
| `PORT`              | `4000` por defecto                                                          |
| `NODE_ENV`          | `development`, `test` o `production`                                        |
| `JWT_SECRET`        | Mínimo 12 caracteres; en producción, mínimo 32 y generado aleatoriamente    |
| `JWT_EXPIRES_IN`    | `1d` por defecto; ejemplos admitidos: `15m`, `2h`                           |
| `CORS_ORIGIN`       | Orígenes separados por coma; defecto `http://localhost:5173`                |
| `TEST_DATABASE_URL` | Opcional; si falta, se deriva `inventory_pro_test` del servidor configurado |

## Reglas de negocio

- Clientes y proveedores admiten teléfono opcional de exactamente 9 dígitos ASCII, sin código de país. La regla se comparte en `src/utils/validation.ts`; se comprueba tanto al crear como al editar. `""` y `null` vacían el campo; omitirlo conserva el valor previo.
- Un producto pertenece a una categoría activa. La API lo crea con stock cero.
- Compras y ajustes corresponden a ADMIN/WAREHOUSE; ventas a ADMIN/SELLER.
- El precio de una venta se guarda en sus líneas. Cambiar el precio del catálogo no cambia ventas anteriores. El vendedor puede indicar un precio positivo distinto del catálogo.
- Cada compra, venta y ajuste modifica el stock y registra su movimiento en una sola transacción serializable. Los conflictos de escritura tienen hasta tres reintentos adicionales.
- Los importes se calculan con `Prisma.Decimal`. Se admiten dos decimales; el total máximo es `99,999,999.99`.
- No se puede modificar el stock mediante `PUT /products/:id`. Los ajustes requieren un motivo y una cantidad distinta de la actual.
- Las bajas son lógicas. No se desactiva un producto con stock, una categoría con productos activos ni un contacto con compras/ventas asociadas.
- Las compras, ventas y movimientos son registros históricos: no hay endpoints para borrarlos o editarlos.
- Los tokens se validan contra el usuario activo en cada petición. Un cambio de contraseña, rol o estado incrementa `tokenVersion` y revoca tokens anteriores. Debe quedar al menos un administrador activo.

Contratos y ejemplos: [API](../docs/API.md). Decisiones: [Arquitectura](../docs/ARCHITECTURE.md). Producción: [Despliegue](../docs/DEPLOYMENT.md).
