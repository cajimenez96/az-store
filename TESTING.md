# Guía de Verificación Funcional y Control de Calidad (MVP)

Esta guía detalla el paso a paso para probar los flujos mínimos del e-commerce. Sirve para asegurar que los cambios de interfaz, base de datos y la pasarela de pagos cumplan con las reglas de negocio del MVP antes de pasar a producción.

---

## 🚀 Camino Rápido: Flujo Completo de Compra (Happy Path)

Seguí esta secuencia para validar la integración de punta a punta del túnel de conversión:

1. **Visita Anónima:** Entrá al sitio en modo incógnito, agregá 2 productos al carrito y andá a `/cart`.
2. **Registro:** Hacé clic en "Proceder al pago". Cuando te redirija a iniciar sesión, seleccioná **Registrate** y creá un nuevo usuario.
3. **Fusión:** Tras registrarte, verificá que los 2 productos que habías elegido sigan estando en tu carrito (fusión anónima a usuario).
4. **Perfil:** Completá tu dirección predeterminada de envío en `/user/profile` y guardala.
5. **Checkout Rápido:** Volvé al carrito, avanzá a `/shipping-address` y comprobá que tus datos de envío estén precargados. Continuá.
6. **Pago (Transferencia):** Seleccioná **Transferencia Bancaria** y realizá el pedido. Subí un comprobante en la página de detalles del pedido.
7. **Consola del Admin:** Iniciá sesión como Administrador (`admin@example.com`), andá a la orden creada y aprobala.
8. **Validación:** Comprobá que el stock del producto disminuyó correctamente en la base de datos y la orden quedó marcada como "Pagada".

---

## 🛠️ Detalles de los Flujos de Prueba

A continuación, se detalla la metodología técnica para auditar cada parte del sistema:

### 1. Sesión Anónima y Carrito Temporal

| Qué probar | Cómo probar en Navegador | Qué buscar en la Base de Datos | Comportamiento Esperado |
|---|---|---|---|
| **Cookie de sesión** | F12 -> Aplicación -> Cookies. Buscar `sessionCartId`. | Ejecutar en consola o Prisma Studio:<br>`prisma.cart.findMany()` | Debe existir un registro de carrito con el UUID de la cookie y `userId: null`. |
| **Límite de stock en inputs** | Ir a la ficha del producto y tratar de subir la cantidad más allá del stock disponible. | `prisma.product.findUnique({ where: { id: ... } })` | El botón de "Agregar al carrito" se bloquea o el selector de cantidad no permite superar el límite. |
| **Persistencia anónima** | Cerrar y volver a abrir la ventana del navegador. | Validar que el registro en `Cart` y sus items sigan existiendo. | El carrito temporal se mantiene activo ya que la cookie tiene persistencia. |

### 2. Autenticación y Fusión de Carritos (Merge)

| Qué probar | Cómo probar en Navegador | Qué buscar en la Base de Datos | Comportamiento Esperado |
|---|---|---|---|
| **Redirección de flujo** | Entrar al carrito de forma anónima, hacer clic en checkout y validar que se guarde la `callbackUrl`. | N/A | Tras el login exitoso, debe redirigirte de vuelta a `/shipping-address`, no al Home. |
| **Fusión de carritos** | Tener items en sesión anónima, loguearse con un usuario que ya tenía items previos en su carrito. | `prisma.cart.findUnique({ where: { userId: ... } })` | Los items se unifican. Si un item existía en ambos, se suman sus cantidades. |
| **Límite de Stock en Merge** | Agregar 3 unidades de un producto con stock total de 4. Loguearse con un usuario que ya tenía 2 unidades de ese producto en su carrito. | `prisma.cart.findUnique()` | La cantidad final del producto en el carrito se debe topar automáticamente a 4 (el stock disponible). |
| **Preservación en Logout** | Cerrar sesión del usuario. | `prisma.cart.findMany({ where: { sessionCartId: ... } })` | El carrito del usuario NO se destruye al desloguearse (para evitar pérdida de carritos). El nuevo carrito anónimo empieza en blanco con un nuevo UUID. |

### 3. Domicilios, Checkout y Stock

| Qué probar | Cómo probar en Navegador | Qué buscar en la Base de Datos | Comportamiento Esperado |
|---|---|---|---|
| **Persistencia de domicilio** | Ir a `/user/profile`, completar la sección de dirección y guardar el perfil. | `prisma.user.findUnique({ where: { email: ... } })` | El campo `address` (JSON) del usuario debe contener los datos estructurados en formato plano. |
| **Precarga de checkout** | Avanzar en el checkout de un carrito hasta `/shipping-address`. | N/A | Los inputs deben aparecer precargados con la dirección del perfil automáticamente. |
| **Sincronización en compra** | Modificar la dirección durante el proceso en `/shipping-address` y concretar la compra. | `prisma.order.findUnique()` y `prisma.user.findUnique()` | La orden debe crearse con la nueva dirección Y el perfil del usuario debe actualizarse con estos nuevos datos para la próxima compra. |
| **Reserva inmediata de stock** | Crear un pedido con método **Transferencia Bancaria**. | `prisma.product.findUnique()` | El stock se reduce inmediatamente en la base de datos tras confirmar el pedido. |
| **Expiración de orden** | Esperar 24 horas o forzar la fecha de expiración de una orden no pagada en la DB. | Cambiar en DB `expiresAt` a una fecha pasada y llamar a `/api/cron/release-expired-orders` (con cabecera de autenticación). | La orden se cancela (`isCanceled: true`) y el stock reservado vuelve a sumarse a los productos del inventario. |

### 4. Pagos Híbridos y Panel de Administración

| Qué probar | Cómo probar en Navegador | Qué buscar en la Base de Datos | Comportamiento Esperado |
|---|---|---|---|
| **Subida de Comprobante** | En la vista de detalles del pedido `/order/[id]`, usar el control de subida de archivos (Uploadthing) para enviar una foto/PDF del pago. | `prisma.order.findUnique()` | El campo `paymentReceiptUrl` de la orden se actualiza con la URL de Uploadthing. |
| **Aprobación del Admin** | Loguearse como administrador, ir al panel, entrar al detalle del pedido y presionar "Confirmar pago". | `prisma.order.findUnique()` | La orden cambia a `isPaid: true`, `paidAt` se registra, y el stock del producto NO se descuenta por segunda vez. |
| **Rechazo del Admin** | Loguearse como administrador y rechazar el pago del pedido con transferencia bancaria. | `prisma.order.findUnique()` y `prisma.product.findUnique()` | La orden cambia a `isCanceled: true` (o se anula el pago) y el stock reservado se reintegra de forma atómica a los productos. |
| **Reserva diferida (Mercado Pago)** | Crear un pedido utilizando **Mercado Pago** y llegar a la redirección de la pasarela. | `prisma.product.findUnique()` | El stock del producto **no** debe alterarse hasta que se confirme la transacción. |
| **Webhook IPN (Mercado Pago)** | Simular el webhook de confirmación enviando una petición POST con firma válida a `/api/webhooks/mercadopago`. | `prisma.order` y `prisma.product` | Al confirmarse el pago mediante IPN, la orden se marca como paga (`isPaid: true`) y el stock del producto recién en ese momento se reduce. |

---

## 📋 Checklist de Control de Calidad

Usá este checklist para marcar las validaciones realizadas antes de cada entrega:

- [ ] **Estilos y Contraste:** Las páginas transaccionales (`/sign-in`, `/sign-up`, `/cart`, `/shipping-address`, `/user/profile`) tienen fondo claro `#fbfbf5` o `#ffffff` y textos legibles en negro `#000000`, sin importar el modo oscuro del sistema operativo.
- [ ] **Acciones de Botón:** Los botones en las páginas claras son píldoras negras (`button-primary-pill`) y reaccionan correctamente en hover (`bg-shade-70`).
- [ ] **Flujo de Sesiones:** El paso de carrito anónimo a carrito de usuario no duplica productos ni supera los stocks físicos del catálogo.
- [ ] **Gestión de Stock:** Las compras por transferencia reservan stock al instante; las de Mercado Pago esperan la confirmación del webhook.
- [ ] **Reintegro de Stock:** El rechazo del pago por parte de un administrador devuelve de manera atómica el stock al inventario.
- [ ] **Pruebas Estáticas:** El comando `bun run build` compila el bundle de producción sin advertencias de tipos ni fallos.

---

## 🚀 Próximo Paso

Una vez que completes las pruebas manuales correspondientes a cada tarea en desarrollo, recordá documentar los resultados en el archivo `walkthrough.md` antes de enviar la confirmación de la entrega.
