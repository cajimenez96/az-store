# Guía de Verificación Funcional y Control de Calidad (MVP y POS)

Esta guía detalla el paso a paso para probar los flujos del e-commerce. Sirve para asegurar que los cambios de interfaz, base de datos, módulos de administración (Marcas, Categorías), Punto de Venta (POS) y la pasarela de pagos cumplan con las reglas de negocio antes de pasar a producción.

---

## 👥 Flujos por Rol (Happy Paths)

A continuación se detallan los caminos principales (Happy Paths) separados por los tres roles principales del sistema: **Usuario (Cliente)**, **Vendedor (Seller)** y **Administrador (Admin)**.

### 🛍️ 1. Rol: Usuario (Cliente) - Flujo de Compra Online

El objetivo de este flujo es verificar la navegación anónima, el registro y la compra online.

1. **Visita Anónima:** Ingresá al sitio en modo incógnito. Navegá por las categorías y agregá 2 productos al carrito.
2. **Registro/Login:** Desde el carrito, hacé clic en "Proceder al pago". Registrá una nueva cuenta o iniciá sesión como usuario cliente.
3. **Fusión de Carrito:** Verificá que los 2 productos sigan estando en tu carrito tras loguearte (fusión anónima a usuario).
4. **Checkout (Envío):** Avanzá a `/shipping-address` y completá tus datos de envío. 
5. **Checkout (Pago):** En la selección de método de pago, verificá que **SOLO** ves opciones online (Ej: Mercado Pago, Transferencia Bancaria). Seleccioná Transferencia Bancaria.
6. **Confirmación:** Finalizá el pedido. Subí el comprobante de transferencia en la vista de la orden.
7. **Verificación de Restricciones:** Tratá de ingresar a `/admin/overview` ingresando la URL manualmente. El sistema debe redirigirte o mostrar error de acceso denegado.

### 🏪 2. Rol: Vendedor (Seller) - Flujo de Punto de Venta (POS)

El objetivo de este flujo es verificar las capacidades de venta física en el local y las restricciones sobre configuraciones globales.

1. **Login como Vendedor:** Iniciá sesión con una cuenta de rol `seller`.
2. **Flujo POS (Venta en local):** Simulá una venta a una persona en la tienda. Agregá productos al carrito y procedé al pago.
3. **Checkout POS:** En el paso de Método de Pago, comprobá que ahora ves opciones de "Punto de Venta" (Efectivo, QR, Transferencia en local). Seleccioná *Punto de Venta - Efectivo*.
4. **Confirmación POS:** Finalizá la orden y verificala en `/admin/orders`.
5. **Gestión Restringida de Productos:** Andá a `/admin/products`. Comprobá que podés crear un producto, pero los campos críticos (como slug, categoría y marca) aparecen bloqueados (disabled) para evitar cambios no autorizados en la estructura.
6. **Acceso Denegado:** Verificá que en la barra de navegación del panel de control NO ves las secciones de "Usuarios", "Categorías" ni "Marcas". Tratá de entrar a `/admin/brands` mediante la URL; debés ser bloqueado.

### 👑 3. Rol: Administrador (Admin) - Gestión Total y Dashboard ERP

El objetivo de este flujo es validar el control absoluto del inventario, la respuesta a alertas críticas y la creación de la taxonomía del catálogo.

1. **Login como Admin:** Iniciá sesión con una cuenta de rol `admin`.
2. **Alertas y Dashboard:** En la barra superior de navegación, buscá la **Campana Roja** de Stock Crítico. Verificá que muestre un número. Hacé clic para ir a `/admin/products`.
3. **Dashboard ERP:** Entrá a `/admin/overview` y verificá que las nuevas tarjetas muestren los valores correctos de "Pendientes de Pago", "Pendientes de Envío" y "Stock Crítico" (por defecto, variantes con stock <= 2).
4. **ABM Marcas:** Dirigite a `/admin/brands`. Creá una marca llamada "Marca de Prueba". Validá que no puedas crear otra con el mismo nombre exacto (por validación de Slug).
5. **ABM Productos:** Dirigite a `/admin/products/create`. Creá un producto nuevo y comprobá que en el desplegable de Marcas aparece "Marca de Prueba" y podés seleccionarla con éxito.
6. **Gestión de Órdenes:** Entrá a `/admin/orders`. Aprobá la transferencia que hizo el Usuario (Cliente) en el flujo 1. Marcá como "Entregado" el pedido que el Vendedor (Seller) hizo en el flujo 2.

---

## 🛠️ Detalles de Pruebas Específicas (Edge Cases)

A continuación, se detalla la metodología técnica para auditar y romper (intentar fallar) partes clave del sistema:

### 1. Panel de Control, Marcas y POS

| Qué probar | Cómo probar en Navegador | Qué buscar en DB / Resultado | Comportamiento Esperado |
|---|---|---|---|
| **Ocultamiento de POS** | Ir al checkout como `user` normal. | N/A | Las opciones "Punto de Venta" NO deben existir en el formulario. |
| **Campana de Alertas** | Modificar un producto para que una variante quede con stock = 2. Recargar como Admin. | `prisma.productVariant` | La campanita en el Header debe aparecer o incrementar su número. Loguearse como Seller no debe mostrar la campana (vendedor mantiene carrito). |
| **Restricciones de Vendedor** | En `/admin/products/create` como Vendedor intentar cambiar el `slug` o `marca`. | N/A | Los inputs principales estructurales deben estar `disabled`. |
| **Duplicación de Marcas** | Crear Marca "Nike", luego intentar crear otra Marca "Nike" o "nike". | `prisma.brand.findUnique()` | Error controlado: "Una marca con este slug ya existe". |

### 2. Autenticación y Fusión de Carritos (Merge)

| Qué probar | Cómo probar en Navegador | Qué buscar en DB / Resultado | Comportamiento Esperado |
|---|---|---|---|
| **Fusión de carritos** | Tener items en sesión anónima, loguearse con un usuario que ya tenía items previos. | `prisma.cart.findUnique()` | Los items se unifican sumando cantidades sin superar el stock disponible real. |
| **Preservación en Logout** | Cerrar sesión del usuario. | `prisma.cart` | El carrito del usuario NO se destruye. El nuevo carrito anónimo empieza en blanco con nuevo UUID. |
| **Bloqueo de Cambio de Rol** | Como Admin en `/admin/users/[id]`, intentar cambiar tu propio rol a "user". | N/A | El Select de roles para tu propio usuario debe estar deshabilitado o arrojar error. |

### 3. Domicilios, Checkout y Stock

| Qué probar | Cómo probar en Navegador | Qué buscar en DB / Resultado | Comportamiento Esperado |
|---|---|---|---|
| **Precarga de checkout** | Avanzar en el checkout hasta `/shipping-address`. | N/A | Los inputs deben aparecer precargados con la dirección del perfil de usuario. |
| **Reserva inmediata de stock** | Crear pedido con **Transferencia Bancaria**. | `prisma.productVariant` | El stock se reduce inmediatamente en la base de datos de la variante seleccionada tras confirmar pedido. |
| **Expiración de orden** | Cambiar en DB `expiresAt` de una orden no pagada a ayer y llamar `/api/cron/release-expired-orders`. | `prisma.order` | La orden se cancela (`isCanceled: true`) y el stock reservado vuelve a sumarse a las variantes. |

### 4. Flujos de Pago Híbridos

| Qué probar | Cómo probar en Navegador | Qué buscar en DB / Resultado | Comportamiento Esperado |
|---|---|---|---|
| **Subida de Comprobante** | En `/order/[id]`, subir foto de pago de transferencia. | `prisma.order` | El campo `receiptUrl` se actualiza. La orden ahora suma al contador "Pendientes de Pago" en el dashboard. |
| **Aprobación del Admin** | En el detalle del pedido como Admin presionar "Confirmar pago". | `prisma.order` | La orden cambia a `isPaid: true`. El stock NO se descuenta por segunda vez. |
| **Rechazo del Admin** | Como administrador, rechazar el pago del pedido con transferencia. | `prisma.productVariant` | La orden se anula y el stock reservado se reintegra atómicamente a las variantes. |
| **Reserva diferida (Mercado Pago)** | Crear un pedido con Mercado Pago y llegar a la pasarela (sin pagar aún). | `prisma.productVariant` | El stock **no** debe alterarse hasta confirmación. |
| **Webhook IPN (MP)** | Simular el webhook enviando un payload válido a `/api/webhooks/mercadopago`. | `prisma.order` y `prisma.productVariant` | La orden se marca como paga y **recién en ese momento** el stock disminuye. |

---

## 📋 Checklist General de Regresión

- [ ] Las métricas del dashboard (`/admin/overview`) coinciden con las sumas reales en la DB de órdenes y variantes de productos.
- [ ] La campana de "Stock Crítico" suma correctamente los *Talles* (ProductVariants) y no los productos globales.
- [ ] La marca seleccionada al crear un producto persiste y se muestra correctamente en el catálogo público (`/search`).
- [ ] El cambio de rol del usuario respeta la seguridad impidiendo que un admin se auto-remueva privilegios.
- [ ] La consola del navegador y el proceso de build (`bun run build`) no arrojan advertencias de tipos o componentes React inválidos.
