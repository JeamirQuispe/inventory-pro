# Primer recorrido

## Antes de empezar

Necesitas Node.js 24, npm y PostgreSQL 16 funcionando. Comprueba `node --version` y `npm --version`. La estructura raíz contiene `backend/`, `frontend/` y `package.json`. Ejecuta los comandos desde la carpeta indicada: un error ENOENT buscando `package.json` suele significar que estás en otra carpeta.

No necesitas instalar Prisma globalmente. Los scripts de npm ejecutan la versión local del proyecto. Evita aceptar la instalación de una versión distinta sugerida por `npx` fuera de `backend/`.

## Preparar aplicaciones y base

Desde la raíz del repositorio:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
```

Si ya existe `.env`, consérvalo y revisa sus valores en vez de sobrescribirlo. Crea `inventory_pro` desde pgAdmin o con `createdb -U postgres inventory_pro`. Configura en `backend/.env` las credenciales de tu PostgreSQL y un secreto JWT propio:

```dotenv
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/inventory_pro?schema=public"
JWT_SECRET="REEMPLAZA_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES"
PORT=4000
```

El ejemplo contiene marcadores, no credenciales utilizables. Codifica caracteres reservados de la contraseña cuando construyas una URL. No publiques `.env`, tokens ni credenciales reales. Para generar un secreto local puedes ejecutar `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

```powershell
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:deploy
npm --prefix backend run prisma:seed
```

`generate` construye el cliente Prisma a partir del modelo; no crea tablas. `deploy` aplica las migraciones existentes a PostgreSQL. `seed` añade datos de demostración y una cuenta inicial. Repetir el seed no restablece la contraseña ni el stock existente. No lo uses en producción.

## Arrancar y comprobar

En una terminal de la raíz ejecuta `npm run dev:backend`; en otra, `npm run dev:frontend`. Abre [la aplicación](http://localhost:5173) y comprueba [health](http://localhost:4000/api/health).

La cuenta local de demostración es `admin@inventorypro.com` / `Admin123*`. Si ya cambiaste su contraseña, utiliza la nueva. Health indica que Express está vivo; iniciar sesión y consultar productos comprueba también la interacción con PostgreSQL.

Vite redirige las peticiones `/api` al backend local. La ruta del navegador `/products` muestra una página; `GET /api/products` consulta datos JSON. Son rutas distintas con propósitos distintos.

## Ejercicio verificable

Usa nombres y SKU nuevos para no colisionar con los datos del seed:

1. Crea una categoría `Demo Bebidas`.
2. Crea `Demo Agua`, SKU `DEMO-AGUA-01`, precio S/ 2,50, stock mínimo 5 y esa categoría. Debe aparecer con stock 0.
3. Crea `Demo Distribuidor`, teléfono `987654321`. Puedes dejar el teléfono vacío, pero no incompleto.
4. Registra una compra de 10 unidades a S/ 1,20. Revisa el resumen y confirma una sola vez. Debes ver un toast de éxito, total S/ 12,00 y stock 10.
5. Registra una venta de 3 unidades a S/ 2,50, sin cliente o con uno nuevo. Debes obtener total S/ 7,50 y stock 7.
6. Consulta Movimientos. La compra pasa de 0 a 10; la venta, de 10 a 7. Los responsables y fechas se registran desde el servidor.
7. Intenta desactivar el producto: debe rechazarse por tener stock. Cancela el diálogo. No inventes un ajuste para eliminar existencias reales.

El ejercicio modifica la base local de desarrollo. Las pruebas automáticas se ejecutan en otra base. Si registras operaciones reales, no uses este ejercicio sobre ellas.

## Probar la API sin la pantalla

En Thunder Client crea `POST http://localhost:4000/api/auth/login` con JSON de la cuenta demo. Copia el valor del token **sin las comillas**. En `GET /api/auth/me` usa Auth → Bearer con ese valor. Si introduces el encabezado manualmente, debe ser `Authorization: Bearer TOKEN`.

Con el mismo token, envía `POST /api/customers`:

```json
{ "name": "Prueba inválida", "phone": "98765a321" }
```

Debe responder 400 con `errors.phone` y no crear el cliente. Cambia a `987654321` para recibir 201. Esta comprobación demuestra que la regla no depende del navegador. Más ejemplos y permisos en [API.md](API.md).

## Diagnóstico frecuente

| Síntoma                                              | Qué revisar                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ENOENT de package.json                               | Carpeta actual y uso de `npm --prefix backend` o `frontend`                                       |
| Prisma no reconoce generate                          | Dependencias instaladas y script `npm --prefix backend run prisma:generate`, sin CLI global ajena |
| Error de conexión a PostgreSQL                       | Servicio, puerto, usuario, contraseña y nombre de base en `.env`                                  |
| Error de autenticación de PostgreSQL                 | La contraseña es la de tu servidor, no la de la cuenta demo de la aplicación                      |
| Puerto ocupado                                       | Identifica el proceso antes de detenerlo; no termines procesos desconocidos                       |
| 401 en la API                                        | Token sin comillas, Bearer correcto, expiración o revocación; vuelve a iniciar sesión             |
| 403                                                  | El token es válido pero el rol no tiene permiso para esa acción                                   |
| 400                                                  | Revisa `errors` y el contrato del campo, no cambies los tipos a ciegas                            |
| 409 al desactivar                                    | Una regla de integridad protege stock, relaciones o cuenta de administrador                       |
| Respuesta perdida al confirmar venta/compra          | Revisa el historial antes de repetir: no hay idempotencia HTTP                                    |
| Cambiaste el backend compilado y ves reglas antiguas | `npm start` sirve `dist`; recompila y reinicia. `npm run dev` usa el código fuente con recarga    |

Para avanzar desde este ejercicio: [Arquitectura](ARCHITECTURE.md) explica las capas y [CONTRIBUTING.md](../CONTRIBUTING.md) muestra cómo introducir un cambio verificable.
