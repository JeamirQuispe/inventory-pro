# Contribuir a InventoryPro

Empieza por [la guía local](docs/GETTING_STARTED.md) y [la arquitectura](docs/ARCHITECTURE.md). Este proyecto favorece cambios pequeños, contratos explícitos y pruebas reproducibles. No cambies de framework ni introduzcas una nueva capa solo para resolver un formulario o una consulta.

## Un cambio de principio a fin

Ejemplo de aprendizaje: añadir un filtro de cliente a ventas. Es una propuesta de ejercicio, **no una función ya implementada**.

1. Define el contrato antes del código: nombre del parámetro, si es opcional, formato UUID, permisos y resultado con/sin coincidencias.
2. Revisa `sale.routes.ts` y `sale.controller.ts`. Valida el query mediante un schema apropiado y conserva los filtros/paginación existentes.
3. Extiende `sale.service.ts`: aplica el mismo filtro a la consulta de filas y al conteo. No filtres después de paginar ni descargues toda la tabla para filtrar en JavaScript.
4. En `TransactionsPage.tsx`, incorpora el filtro a la URL de petición y a la clave de consulta. Vuelve a página 1 al modificarlo y conserva el estado vacío/error.
5. Añade pruebas de UUID inválido, cliente sin ventas, paginación y permisos. En el navegador prueba seleccionar, limpiar y combinar con búsqueda.
6. Actualiza API.md, OpenAPI y la guía afectada. Ejecuta tipos, compilación, suites y formato.

Si el cambio añade datos persistentes, modifica `schema.prisma`, crea una migración de desarrollo con nombre descriptivo y revisa el SQL. Versiona la migración y prueba su aplicación. No uses un reseteo de la base de negocio como solución a una migración fallida.

## Convenciones del backend

- Routes define URL y middleware; controller adapta HTTP, ejecuta el schema y responde; service implementa reglas y persistencia.
- Utiliza los permisos de `permissions.middleware.ts`; no confíes en el menú del cliente.
- Reutiliza `utils/validation.ts`, paginación y transacciones cuando la semántica coincida. No compartas reglas de negocio distintas solo porque hoy tienen código parecido.
- Para dinero utiliza `Prisma.Decimal` en el servidor. No aceptes totales finales calculados por el cliente.
- Si una operación cambia stock, documento y auditoría, hazlo de forma atómica y prueba rollback/concurrencia.
- No envíes errores de PostgreSQL, hashes ni detalles internos al navegador. Usa `AppError` para errores de negocio previstos.
- Una edición parcial conserva los campos omitidos. Presta atención a defaults y transformaciones de schemas al construir un update.

## Convenciones del frontend

- Mantén datos remotos en TanStack Query y datos de interacción en estado local. Incluye todos los filtros en las claves de consulta.
- Usa el cliente `lib/api.ts`; no reimplementes tokens o traducción de errores en cada página.
- Todos los avisos temporales usan Sonner. No añadas otro Toaster ni banners persistentes para éxitos. Los errores de mutaciones ya se notifican globalmente; evita duplicarlos con un segundo `onError`.
- Los errores específicos se muestran junto al campo, con nombre accesible estable y `aria-describedby`. El backend vuelve a validar.
- Usa `ConfirmDialog` para bajas del catálogo y `Modal` para formularios. Evita cierres y envíos repetidos durante una petición.
- Conserva estilos compartidos, controles semánticos, foco visible, iconos Lucide y etiquetas. Verifica textos largos y móvil; las tablas se desplazan dentro de su contenedor.

## Verificación antes de entregar

Desde la raíz:

```powershell
npm run build
npm run test:backend
npm run test:e2e
npm run format:check
git diff --check
```

Instala previamente Chromium para Playwright o usa Chrome como explica [TESTING.md](docs/TESTING.md). Ejecuta las suites en secuencia porque preparan la misma base `_test`. `npm run format` aplica el formato cuando sea necesario. `npm --prefix backend audit --omit=dev` y su equivalente frontend revisan dependencias de ejecución; un resultado de cero hallazgos no constituye una auditoría de seguridad del producto.

La revisión debe comprobar comportamiento esperado y fallido, permisos, preservación de datos, errores de red, teclado, móvil y actualización de documentación. Añade pruebas proporcionadas al riesgo: una regla compartida o una transacción exige más cobertura que un cambio de texto.

## Commits y revisión

Utiliza un asunto breve, por ejemplo `fix(catalog): validate contact phones and unify feedback`. Describe en el cuerpo qué problema había, qué cambió y qué comandos pasaron. El hash que Git asigna al commit es su identificador, no parte del mensaje ni algo que deba eliminarse.

Antes de preparar el commit, revisa `git status` y `git diff`; incluye solo los archivos de tu cambio. Nunca agregues `.env`, `node_modules`, `dist`, trazas privadas ni datos reales. No fuerces un push ni reescribas historial compartido como parte de una limpieza.

En una propuesta de cambio, incluye propósito, evidencia de pruebas, captura si cambia la interfaz, impacto en API/migraciones y límites conocidos. No afirmes "sin errores" u "optimizado" sin delimitar qué se midió o comprobó.
