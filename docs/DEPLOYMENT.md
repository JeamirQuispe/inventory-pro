# Despliegue

Esta entrega funciona localmente. No incluye cuentas de hosting, dominio ni una publicación automática.

## Backend

1. Provisiona PostgreSQL y una base exclusiva para la aplicación. Usa un usuario de aplicación con permisos acotados; separa el usuario de migraciones cuando el entorno lo permita.
2. Configura `NODE_ENV=production`, `DATABASE_URL`, un `JWT_SECRET` aleatorio de al menos 32 caracteres, `JWT_EXPIRES_IN` y `CORS_ORIGIN` con el origen HTTPS real.
3. Ejecuta `npm ci`, `npm run prisma:generate`, `npm run prisma:deploy` y `npm run build` dentro de `backend/`.
4. Inicia con `npm start` bajo el gestor de procesos del proveedor. El proceso escucha `PORT` y cierra conexiones ante SIGTERM/SIGINT.
5. Sirve el tráfico mediante HTTPS. El health endpoint es `GET /api/health`; confirma que el proceso está vivo, no que PostgreSQL esté disponible.

El seed de demostración se bloquea en producción. Para el primer administrador, utiliza un procedimiento de aprovisionamiento privado con contraseña única y el mismo hash bcrypt que `src/utils/password.ts`; no publiques credenciales de demostración. No expongas una ruta pública de registro de administradores.

Si hay proxy inverso, configura `trust proxy` en Express según el número o las direcciones reales de proxies confiables. No habilites confianza universal sin conocer la red. El límite de acceso usa memoria del proceso; múltiples réplicas requieren un almacén compartido para conservar un límite común.

## Frontend

1. Ejecuta `npm ci` y `npm run build` en `frontend/`.
2. Publica `frontend/dist` con un servidor estático y HTTPS.
3. Configura `/api` para el backend, o define `VITE_API_URL` antes de compilar. Es configuración pública.
4. Redirige rutas de la SPA como `/products` a `index.html`, preservando `/api` para la API. Así una recarga directa no devuelve 404.

El servidor de Vite es para desarrollo; no es el servidor de producción. Si cambias `VITE_API_URL`, debes recompilar.

## Operación

Haz copias de seguridad de PostgreSQL y prueba su restauración. Revisa logs, expiración de credenciales, dependencias y espacio de disco. No ejecutes pruebas con datos de negocio. No registres tokens ni contraseñas en logs.

La sesión usa Bearer y `sessionStorage`: exige controles contra XSS y una política CSP adecuada en el servidor del frontend. La migración que añade `tokenVersion` invalida tokens antiguos sin esa propiedad; los usuarios deben iniciar sesión de nuevo.
