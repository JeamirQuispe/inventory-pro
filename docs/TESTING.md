# Pruebas y verificación

Las pruebas usan PostgreSQL real. No se sustituyen con mocks las consultas que modifican inventario.

## Aislamiento

`backend/tests/database.ts` toma `TEST_DATABASE_URL` o deriva `inventory_pro_test` de `DATABASE_URL`. Rechaza nombres que no terminen en `_test`, aplica migraciones y vacía las tablas de esa base antes de crear datos conocidos. Nunca se ejecuta `TRUNCATE` contra `inventory_pro`.

La cuenta de PostgreSQL debe poder crear la base de pruebas si no existe. En CI se crea mediante el servicio PostgreSQL. Las pruebas de API y de navegador deben ejecutarse en secuencia, porque comparten la base de pruebas.

## Backend

Desde la raíz:

```powershell
npm run test:backend
```

La suite cubre autenticación, roles, validación, paginación, importes exactos, compra, ventas concurrentes, rollback, ajustes, restricciones de bajas, edición parcial y revocación de tokens. Levanta Express en un puerto libre y lo cierra al finalizar.

El caso de teléfonos prueba clientes y proveedores al crear y editar: letras, 8/10 dígitos, código de país, espacios y tipo numérico en vez de cadena. Comprueba que un rechazo no agregue filas ni cambie el teléfono guardado y que omitir/vaciar el campo respete el contrato.

## Navegador

```powershell
cd frontend
npx playwright install chromium
npm test
```

También puede usarse Chrome instalado en Windows:

```powershell
$env:PW_CHANNEL = "chrome"
npm test
```

Playwright levanta una API en 4001 y Vite en 5174; ambos se cierran al finalizar. Deja esos puertos libres. Las pruebas usan `admin@test.local` / `TestAdmin123*`, solo en la base de pruebas. Las credenciales de la demostración local son diferentes.

Se comprueban acceso, restauración de sesión, CRUD de categorías, productos, ajustes, edición de perfil, permisos del vendedor, compras y ventas reales, navegación y ausencia de desbordamiento horizontal de la página en escritorio y móvil. Las tablas pueden desplazarse horizontalmente dentro de su contenedor.

También se prueban el borde único del campo enfocado, rechazo de letras y pegados inválidos, validación de nombres vacíos, las cinco confirmaciones de baja, foco inicial en Cancelar, Escape y ausencia del cuerpo vacío. Sonner se verifica con cierre manual, expiración y cierre de un error mientras el diálogo permanece abierto. Las pruebas de confirmaciones realizan altas y bajas solo en datos de prueba.

Para iterar sobre este cambio sin ejecutar toda la suite: `npm test -- --grep "contact validation|compact confirmations"` desde `frontend/`. Antes de entregar, ejecuta la suite completa para detectar efectos sobre el resto del sistema.

Capturas y trazas se escriben en `frontend/test-results/`, ignorado por Git. Los fallos conservan una traza que puede abrirse con `npx playwright show-trace ruta/al/trace.zip`.

## Compilación y formato

```powershell
npm run build
npm run format:check
```

`build` comprueba tipos antes de generar el frontend y compila el backend. `format` aplica Prettier. El workflow `.github/workflows/ci.yml` ejecuta estas comprobaciones y ambas suites con PostgreSQL 16 y Node 24.

Las pruebas no constituyen una garantía de ausencia absoluta de errores. No se han realizado pruebas de carga, auditoría externa, evaluación completa con lectores de pantalla ni despliegue público. Los resultados concretos de esta entrega se registran en [Verificación](VERIFICATION.md).
