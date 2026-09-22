# Seguridad y límites de confianza

Este documento describe controles implementados y riesgos pendientes. No sustituye una auditoría independiente ni acredita que el sistema esté listo para manejar información sensible en producción.

## Fronteras de confianza

El navegador no es confiable: puede cambiar JSON, llamar rutas ocultas y repetir peticiones. La API es responsable de autenticar, autorizar, validar y aplicar reglas. PostgreSQL mantiene relaciones y unicidad, pero un acceso directo con privilegios puede omitir reglas de la API. El control de credenciales y permisos de base es parte de la operación.

## Controles implementados

| Riesgo                              | Control en el código                                                           | Evidencia                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Petición anónima o token manipulado | Verificación JWT y consulta de cuenta activa                                   | `auth.middleware.ts`; prueba de token ausente e inválido             |
| Permisos obsoletos en un JWT        | El rol se lee del usuario actual y se compara `tokenVersion`                   | Pruebas de revocación por contraseña y cuenta desactivada            |
| Acceso a una acción de otro rol     | Permisos en routers mediante middleware compartido                             | Suite de permisos ADMIN, WAREHOUSE y SELLER                          |
| Contraseñas expuestas               | Hash bcrypt y selección de campos de respuesta sin contraseña                  | Servicios de autenticación/usuarios y utilidades de contraseña       |
| Intentos repetidos de login         | Límite de 20 fallos por IP en 15 minutos                                       | Prueba que obtiene 429                                               |
| Datos malformados                   | Zod en controladores y tamaño máximo JSON de 100 KB                            | Pruebas de entradas, cantidades, importes, teléfonos y JSON inválido |
| Sobreventa concurrente              | Transacción Serializable y reintento completo de conflictos                    | Dos ventas por encima del stock conjunto: una 201, otra 409          |
| Historial inconsistente             | Documento, líneas, stock y movimiento dentro de la misma transacción           | Pruebas de rollback e integridad de bajas                            |
| Bloqueo administrativo accidental   | Restricciones a autodesactivación, cambio de rol propio y último administrador | Servicios de usuarios y pruebas de cuenta propia                     |
| Exposición de errores internos      | Middleware central con respuestas públicas controladas                         | `error.middleware.ts`                                                |

Helmet y CORS se configuran en `app.ts`. CORS regula qué páginas pueden leer respuestas desde un navegador; no es una barrera para Thunder Client ni sustituye la autorización. Los logs del servidor requieren acceso restringido.

## Ciclo de sesión

1. Login válido devuelve token firmado y perfil público.
2. El frontend lo conserva en memoria y `sessionStorage` de la pestaña; cada petición lo envía como Bearer.
3. La API valida firma/expiración y consulta si la cuenta sigue activa y tiene la misma versión.
4. Cambiar contraseña, rol o estado incrementa `tokenVersion`. Los tokens anteriores dejan de servir.
5. Un 401 durante una sesión borra el estado local y muestra un aviso para iniciar sesión de nuevo.
6. Cerrar sesión borra la copia local y la caché. No revoca un token que alguien haya copiado anteriormente; este expira o es revocado por cambio de cuenta.

No se implementan refresh tokens, MFA, recuperación por correo ni lista de sesiones individuales. Un script malicioso ejecutado en el origen podría leer `sessionStorage`: HTTPS, CSP del frontend, higiene de dependencias y prevención de XSS siguen siendo necesarios. No deben introducirse HTML sin sanear ni secretos en variables `VITE_*`.

## Preparación antes de publicar

- Usa credenciales únicas y un secreto JWT aleatorio; no aprovisiones cuentas demo en producción.
- Mantén HTTPS y una configuración CORS limitada a los orígenes reales.
- Configura proxies confiables explícitamente. No habilites `trust proxy` universal sin conocer la red.
- En varias réplicas, sustituye el almacén de rate limit en memoria por uno compartido y probado.
- Separa datos/pruebas y permisos de aplicación/migración; protege copias de seguridad y comprueba restauración.
- Añade observabilidad apropiada sin registrar tokens, contraseñas ni cuerpos con datos personales.
- Define retención de clientes/proveedores, acceso operativo y procedimiento de incidentes conforme al contexto del despliegue.
- Evalúa idempotencia antes de automatizar reintentos de compras/ventas; una respuesta perdida no demuestra que la operación haya fallado.

Consulta [Despliegue](DEPLOYMENT.md) para los comandos y [Verificación](VERIFICATION.md) para el alcance ejecutado. No se han realizado pruebas de carga, pentest ni evaluación completa con tecnologías asistivas.

## Reportar un problema

No publiques credenciales, datos reales ni instrucciones de explotación contra un servicio público en una incidencia abierta. Comunica el problema al responsable del repositorio por un canal privado disponible, con versión del código, alcance, pasos mínimos en una base de prueba e impacto observado. El repositorio aún no define un canal privado dedicado ni un SLA de respuesta.
