# Frontend de InventoryPro

Aplicación React 19 + TypeScript, construida con Vite. React Router organiza las páginas; TanStack Query administra consultas y caché; Radix Dialog aporta diálogos accesibles; Lucide aporta los iconos. Tailwind 4 integra la base de estilos y `src/styles.css` concentra los estilos compartidos de la aplicación.

## Desarrollo

```powershell
npm ci
npm run dev
```

Abre `http://localhost:5173` con el backend funcionando en el puerto 4000. Vite envía `/api` al backend, por lo que no hace falta poner un token ni una URL privada dentro del código.

`VITE_API_URL` vale `/api` por defecto. Puede configurarse en `.env` para otro servidor. Esta variable es pública y se incorpora al bundle; nunca guardes secretos en variables `VITE_*`. `API_PROXY_TARGET` permite cambiar el destino del proxy local sin cambiar el contrato del cliente.

## Organización

```text
src/
  app/                    rutas, permisos de página y layout
  components/             tablas, paginación, diálogos y selección de registros
  features/
    auth/                 acceso y estado de la sesión
    catalog/              productos, categorías, proveedores, clientes y usuarios
    dashboard/            resumen e informes
    inventory/            movimientos y ajustes
    transactions/         compras y ventas
  lib/                    cliente HTTP, tipos y formatos
  main.tsx                proveedores de React y manejo de errores de renderizado
  styles.css              estilos compartidos y adaptación a móvil
tests/                    pruebas de navegador contra la API real
```

`catalog/config.ts` define los campos que se repiten en las pantallas CRUD. Las reglas específicas de las transacciones viven en su propio módulo. Compartir un formulario evita copiar el mismo manejo de carga y errores en cinco páginas; no sustituye las validaciones del backend.

`catalog/CatalogField.tsx` aplica las restricciones de los campos, feedback accesible y teclado numérico para teléfonos nacionales de 9 dígitos. `components/ConfirmDialog.tsx` centraliza las cinco confirmaciones de baja, con foco inicial en Cancelar y cierre bloqueado durante la petición. Los formularios normales conservan su propio contenido.

Todas las notificaciones transitorias usan Sonner: hay un solo `Toaster` en `main.tsx`, duración de 4,5 segundos y botón para cerrar. `MutationCache` en `lib/api.ts` notifica los errores de escritura sin repetir ese manejo en cada módulo. Los mensajes de éxito se emiten en la operación correspondiente. Los errores de campo y los estados de carga fallida con Reintentar permanecen junto al contenido; no son notificaciones transitorias. Consulta [Validación y recorrido completo](../docs/VALIDATION_AND_FEEDBACK.md).

## Sesión y consultas

El token vive en memoria y `sessionStorage`, por pestaña. Al recargar se consulta `/auth/me`; un 401 elimina la sesión y la caché. Cerrar sesión elimina la copia local, pero no revoca por sí mismo un token ya copiado: este caduca o se invalida al cambiar credenciales/rol/estado. No se ha implementado refresh token.

Las páginas se cargan bajo demanda con `React.lazy`. Las listas están paginadas en el servidor y la búsqueda espera 300 ms antes de pedir resultados. Los selectores también consultan páginas, evitando descargar todo el catálogo. Tras una escritura se invalidan las consultas para reflejar stock y reportes actualizados. Las mutaciones no se reintentan automáticamente.

La navegación oculta operaciones no permitidas, y las rutas están protegidas. La comprobación definitiva del permiso siempre ocurre en el backend.

## Comprobaciones

```powershell
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Las pruebas levantan su propia API en 4001 y Vite en 5174, contra `inventory_pro_test`. No deben ejecutarse a la vez que las pruebas de integración, porque ambas preparan esa base. Más información en [Pruebas](../docs/TESTING.md).

La interfaz incluye estados de carga, error y lista vacía; confirmaciones; navegación por teclado; foco contenido en diálogos; diseño móvil y tablas con desplazamiento horizontal. Los CSV de tablas corresponden a la página actual. El reporte exporta su resumen del período, no un balance contable.

Foto local de almacén en `public/warehouse.jpg`: [Unsplash](https://unsplash.com), recurso `photo-1586528116311-ad8dd3c8310d`, descargado para evitar depender de una petición externa al abrir la pantalla de acceso.
