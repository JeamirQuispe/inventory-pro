# Validación, avisos y recorrido del sistema

## Por qué validamos en ambos lados

El frontend ayuda a corregir datos antes de enviarlos. El backend decide si puede aceptarlos: cualquier persona puede saltarse la pantalla y enviar una petición con Thunder Client. La base de datos mantiene las relaciones, la unicidad y la atomicidad de las escrituras.

No es duplicación innecesaria: son responsabilidades distintas. Dentro de cada capa sí reutilizamos las reglas. Clientes y proveedores usan `optionalPhoneSchema` en el backend y la misma configuración de campo y `CatalogField` en React.

| Dato                  | Frontend                                                                                           | Backend                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Teléfono opcional     | Teclado numérico, máximo 9 dígitos; rechaza letras y pegados inválidos; feedback al salir o enviar | Acepta exactamente 9 dígitos ASCII o un valor vacío; rechaza incluso peticiones directas inválidas con 400 |
| Nombre                | Obligatorio y longitud mínima, sin contar espacios alrededor                                       | Zod recorta espacios y verifica los límites de cada módulo                                                 |
| Correo                | Comprobación del formato del campo email                                                           | Valida el formato y normaliza a minúsculas                                                                 |
| Contraseña            | Mínimo 8 caracteres, máximo 72 bytes UTF-8                                                         | Comprueba el límite real antes de bcrypt; nunca devuelve el hash                                           |
| Cantidades e importes | Límites, enteros o pasos de 0,01; revisión antes de confirmar                                      | Valida importes y cantidades, calcula totales y comprueba stock en una transacción                         |
| Permisos              | Oculta controles y protege páginas según el rol                                                    | Verifica token, cuenta activa y autorización en cada ruta protegida                                        |

La regla de 9 dígitos corresponde al alcance nacional solicitado; no verifica titularidad ni existencia del teléfono. No acepta `+51`, espacios ni guiones. Vaciar el teléfono guarda `null`; omitirlo en una edición conserva el anterior. Los teléfonos antiguos no se modifican automáticamente: al editar un contacto con un número incompatible, corrígelo o vacía el campo.

## Avisos y confirmaciones

Sonner muestra todos los avisos transitorios de éxito y de error de operación. Se cierran a los 4,5 segundos o mediante el botón Cerrar notificación; la interacción con un toast puede pausar su temporizador. Un solo `Toaster` y un manejador global de errores de mutaciones evitan implementar la misma notificación en cada formulario.

Los errores específicos permanecen debajo del campo y están asociados mediante `aria-describedby` y `aria-invalid`. Un problema al cargar una tabla mantiene su estado Reintentar. No se convierten en toast porque es necesario conservar ese contexto para corregir o recuperar la pantalla.

Los campos enfocados cambian el color de su único borde, sin anillo separado. Los botones conservan un indicador de foco para navegación por teclado. Las cinco bajas usan un diálogo compacto, sin cuerpo vacío ni separadores duplicados. Cancelar recibe el foco inicial; Escape cancela. Mientras se envía la petición no se puede repetir la operación ni cerrar la confirmación.

## Ejemplo de principio a fin

1. Inicia sesión como administrador. React obtiene el token en `POST /api/auth/login`; lo adjunta como Bearer a las peticiones siguientes.
2. Crea la categoría **Bebidas** y después el producto **Agua**, SKU `AGUA-DEMO`, precio S/ 2,50 y stock mínimo 5. La pantalla envía el ID de la categoría, no su nombre. El producto nace con stock 0.
3. Crea un proveedor y, opcionalmente, un cliente. El teléfono `987654321` es válido; `98765432` o `98765a321` no lo son. Si envías un teléfono inválido directamente a la API, responde 400 y no guarda el registro.
4. Registra una compra de 10 aguas a S/ 1,20. Revisa y confirma. El total es S/ 12,00. En una misma transacción se guardan compra, detalle, stock 10 y movimiento de entrada.
5. Registra una venta de 3 aguas a S/ 2,50. El total es S/ 7,50; el stock queda en 7. Venta, detalle y movimiento de salida se guardan juntos. Una venta por encima del stock se rechaza sin dejar registros parciales.
6. Revisa Movimientos y Reportes. Verás quién hizo cada operación y el stock anterior y nuevo. React invalida las consultas después de guardar para mostrar datos actualizados.
7. Intenta desactivar Agua. Como conserva stock, el servidor rechaza la baja y Sonner explica el motivo. No se borra el historial. Solo registra un ajuste si corresponde a un cambio real del inventario, no para eludir esta protección.

El recorrido técnico de cada escritura es: formulario → cliente HTTP → autenticación → autorización → schema de validación → controller → service → Prisma/PostgreSQL → respuesta → actualización de consultas y toast. El orden exacto de los middleware de cada módulo está definido en su archivo de rutas.

## Pruebas reproducibles

Sigue [TESTING.md](TESTING.md). Las suites usan exclusivamente `inventory_pro_test`. Cubren teléfonos inválidos al crear y editar ambos contactos, conservación de campos omitidos, foco, las cinco confirmaciones, errores de bajas con stock y notificaciones cerrables/temporizadas en escritorio y móvil.
