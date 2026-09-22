# Documentación de InventoryPro

Esta documentación describe la implementación del repositorio, no una arquitectura futura. El alcance es un MVP de inventario para un negocio, un almacén lógico y moneda PEN. Las funciones aún no implementadas se identifican como límites, no como capacidades disponibles.

## Elige un recorrido

| Quieres...                       | Lectura recomendada                                                                                     | Resultado                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Probar el proyecto sin conocerlo | [Primer recorrido](GETTING_STARTED.md)                                                                  | Instalar, iniciar sesión y comprobar una compra y venta     |
| Aprender cómo se conecta todo    | [Arquitectura](ARCHITECTURE.md) y [validaciones](VALIDATION_AND_FEEDBACK.md)                            | Relacionar pantallas, HTTP, permisos, servicios y tablas    |
| Integrar otro cliente            | [Contrato API](API.md) y [OpenAPI](openapi.json)                                                        | Conocer cuerpos, respuestas, permisos y errores             |
| Modificar código                 | [Backend](../backend/README.md), [frontend](../frontend/README.md) y [contribución](../CONTRIBUTING.md) | Ubicar cambios y probarlos sin duplicar mecanismos          |
| Evaluar decisiones técnicas      | [Arquitectura](ARCHITECTURE.md), [seguridad](SECURITY.md) y [verificación](VERIFICATION.md)             | Revisar garantías, compromisos y evidencia reproducible     |
| Preparar un entorno público      | [Despliegue](DEPLOYMENT.md) y [seguridad](SECURITY.md)                                                  | Identificar configuración y controles operativos pendientes |
| Reproducir resultados            | [Pruebas](TESTING.md)                                                                                   | Ejecutar las suites en una base aislada                     |

## Fuentes de verdad

- La estructura persistida se define en [schema.prisma](../backend/prisma/schema.prisma) y las migraciones versionadas.
- Las reglas de entrada están en los schemas de los módulos y [validation.ts](../backend/src/utils/validation.ts).
- Los permisos definitivos están en los routers y middleware del backend. Los permisos del frontend mejoran la experiencia, no la seguridad del servidor.
- El contrato HTTP se documenta en OpenAPI y API.md; debe actualizarse junto al código. OpenAPI es mantenido manualmente, no generado automáticamente desde Zod.
- Las pruebas muestran comportamientos comprobados. [VERIFICATION.md](VERIFICATION.md) distingue resultados ejecutados de tareas pendientes.

Si cambias una regla, actualiza código, prueba y documento en la misma contribución. Evita que varias guías definan límites contradictorios: API.md conserva los contratos, Arquitectura explica las decisiones y las guías prácticas los aplican.

## Glosario breve

| Término          | Significado en el proyecto                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Endpoint         | Una combinación de verbo y ruta, como `POST /api/sales`                                    |
| Middleware       | Función que interviene antes del controller o maneja un error HTTP                         |
| Autenticación    | Identificar al usuario y comprobar que su sesión sigue siendo válida                       |
| Autorización     | Decidir si ese usuario puede realizar una operación                                        |
| Schema           | Contrato de datos que Zod verifica durante la ejecución                                    |
| ORM              | Cliente que relaciona modelos del código con tablas; aquí, Prisma                          |
| Migración        | Cambio versionado de la estructura de la base de datos                                     |
| Seed             | Datos iniciales de demostración, no una migración                                          |
| Query / mutation | Lectura / solicitud de cambio en TanStack Query                                            |
| Transacción      | Grupo de escrituras que se confirman juntas o se revierten juntas                          |
| Baja lógica      | Desactivar un registro sin borrar su fila ni el historial                                  |
| Idempotencia     | Poder repetir una petición sin duplicar su efecto; aún no implementada para compras/ventas |
| Toast            | Aviso temporal de una operación, presentado mediante Sonner                                |
