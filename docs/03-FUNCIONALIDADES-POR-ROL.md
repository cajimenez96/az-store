# 03 — Funcionalidades por Rol

> Ingeniería de Sistemas — AZ Store v2.1.0
> Última actualización: 2026-06-15

---

## Roles del Sistema

El sistema maneja cuatro niveles de acceso, controlados por el campo `User.role` (`String`):

| Rol | Valor en DB | Descripción |
|---|---|---|
| Visitante anónimo | — (sin sesión) | Navega el storefront sin cuenta |
| Cliente | `"user"` | Comprador registrado con historial de pedidos |
| Vendedor | `"seller"` | Opera el POS del local físico |
| Administrador | `"admin"` | Control total del sistema |

La asignación de rol `seller` y `admin` es manual — solo el administrador puede cambiar roles desde `/admin/users`.

---

## Visitante Anónimo

El visitante tiene acceso completo al storefront de lectura y puede iniciar el proceso de compra. No puede finalizar una orden.

### Acceso

| Ruta | Descripción |
|---|---|
| `/` | Homepage con banners promocionales y productos destacados |
| `/product/[slug]` | Product Detail Page (PDP) con galería, precios y selector de variantes |
| `/search` | Búsqueda y filtrado del catálogo por categoría, marca y talle |
| `/cart` | Carrito de compras (persiste en cookie de sesión anónima) |
| `/sign-in` | Formulario de login |
| `/sign-up` | Formulario de registro |
| `/forgot-password` | Solicitud de recuperación de contraseña |
| `/reset-password` | Formulario de nueva contraseña (requiere token válido en URL) |

### Capacidades

- Navegar el catálogo completo de productos con imágenes, descripción y variantes disponibles.
- Ver el precio diferenciado por método de pago (CASH vs MercadoPago) según la selección del usuario.
- Agregar productos al carrito. Los ítems persisten en una cookie de sesión anónima.
- Modificar cantidades y eliminar ítems del carrito.
- Ver el resumen del carrito con precios, impuestos y costo de envío.

### Límites

- No puede acceder a `/shipping-address`, `/payment-method`, `/place-order` ni a `/order/[id]` sin sesión. El middleware redirige a `/sign-in`.
- Si inicia sesión después de agregar productos al carrito, el carrito anónimo se **fusiona automáticamente** con el carrito del usuario registrado. Los ítems duplicados suman cantidades; los nuevos se agregan.

---

## Cliente Registrado (role: `"user"`)

El cliente tiene todas las capacidades del visitante más acceso al flujo completo de compra y su historial.

### Acceso

Hereda todas las rutas del visitante anónimo, más:

| Ruta | Descripción |
|---|---|
| `/shipping-address` | Formulario de dirección de envío |
| `/payment-method` | Selección de método de pago (MercadoPago o Transferencia Bancaria) |
| `/place-order` | Confirmación y creación de la orden |
| `/order/[id]` | Detalle de su orden: estado, datos bancarios, carga de comprobante |
| `/user/orders` | Historial completo de pedidos |
| `/user/profile` | Datos personales (nombre, email, dirección guardada) |

### Flujo de Compra con Mercado Pago

1. Agrega productos al carrito y selecciona variantes (talle, color).
2. Ingresa dirección de envío (o usa la guardada en el perfil).
3. Selecciona Mercado Pago como método de pago.
4. Confirma el pedido en `/place-order`. El sistema crea la orden con `isPaid: false` y **no descuenta stock**.
5. Es redirigido al Checkout Pro de Mercado Pago.
6. Mercado Pago notifica el pago vía webhook asíncrono. El sistema valida la firma HMAC, verifica idempotencia y descuenta el stock atómicamente.
7. La orden pasa a `isPaid: true`. El cliente recibe un email de confirmación.

**Nota sobre precios:** El sistema aplica el precio `MERCADOPAGO` al crear la orden. Este precio queda registrado en `OrderItem.priceUsed` con `paymentMethod: MERCADOPAGO`.

### Flujo de Compra con Transferencia Bancaria

1. Mismo flujo hasta seleccionar Transferencia Bancaria en `/payment-method`.
2. Al confirmar en `/place-order`, el sistema crea la orden con `isPaid: false`, **descuenta el stock inmediatamente** y fija `expiresAt = now() + 24 horas`.
3. El cliente es redirigido a `/order/[id]` donde ve los datos bancarios (CBU, alias, CUIT, titular).
4. Sube la captura de pantalla del comprobante desde la misma vista. El archivo se almacena en Uploadthing.
5. Espera la aprobación del administrador o vendedor.
6. Si no se aprueba en 24 horas, un cron cancela la orden y restaura el stock automáticamente.

**Nota sobre precios:** El sistema aplica el precio `CASH` al crear la orden. Queda registrado en `OrderItem.priceUsed` con `paymentMethod: CASH`.

### Códigos Promocionales

- El cliente puede ingresar un código de descuento durante el checkout.
- El endpoint `POST /api/validate-promo` valida el código en tiempo real y devuelve el descuento aplicable.
- El descuento es diferente según el método de pago seleccionado (`discountPercentMercadoPago` vs `discountPercentTransferencia`).
- El sistema valida: existencia, vigencia de fechas, estado activo, y que el cliente no haya superado el límite de usos por usuario.
- El código aplicado queda como snapshot en `Order.promoCode` y el monto de descuento en `Order.discountPrice`.

### Recuperación de Contraseña

1. El cliente ingresa su email en `/forgot-password`.
2. El sistema genera un token UUID único con TTL de 1 hora y lo almacena en `PasswordResetToken`.
3. Se envía un email con el link `/reset-password?token=XXX`.
4. El cliente ingresa una nueva contraseña. El sistema verifica que el token exista y no haya expirado.
5. La contraseña se hashea con bcrypt y se actualiza en `User.password`.
6. El token se invalida (uso único).

### Recuperación de Carrito Abandonado

- Si el cliente tiene un carrito con items y no completa la compra por más de 1 hora, puede recibir un email de recuperación.
- El email contiene un link personalizado que pre-carga su carrito.
- La conversión se registra en `CartRecovery.recoveredAt` cuando el cliente completa el checkout.

---

## Vendedor (role: `"seller"`)

El vendedor tiene acceso exclusivamente al Punto de Venta (POS). No tiene acceso al panel administrativo completo. Las rutas de storefront siguen accesibles en modo cliente.

### Acceso

| Ruta | Descripción |
|---|---|
| `/admin/pos` | Pantalla única del Punto de Venta |
| Todas las rutas del Cliente | Puede comprar como cliente desde el storefront |

**Acceso denegado:** Cualquier ruta `/admin/*` fuera de `/admin/pos` redirige a `/unauthorized`. El middleware bloquea el acceso a nivel de request para todas las rutas bajo `/admin` que requieren `role: 'admin'`. Las Server Actions del POS verifican `requireAdminOrSeller()` antes de ejecutar.

### POS — Flujo de Venta Presencial

#### 1. Selección de productos

- Busca productos con texto libre (nombre, código) o filtra por categoría.
- Visualiza stock disponible por variante antes de agregar.
- Selecciona talle y/o color de cada producto.
- Agrega cantidades al resumen de venta visible en tiempo real.

#### 2. Resolución del cliente

El vendedor tiene tres opciones:

| Opción | Flujo |
|---|---|
| Cliente existente | Busca por nombre, DNI, email o teléfono. Autocomplete predictivo retorna hasta 10 coincidencias. |
| Cliente nuevo | Modal de alta rápida: nombre, email, teléfono, DNI, dirección. Se crea el usuario con `role: 'user'`. |
| Sin registro | La venta se asocia al usuario "Consumidor Final" (comodín predefinido en DB). |

#### 3. Selección de método de pago

Los métodos disponibles en POS usan el precio `CASH`:
- `PuntoDeVenta_Efectivo`
- `PuntoDeVenta_Transferencia`
- `PuntoDeVenta_QR`
- `PuntoDeVenta_MercadoPago`

#### 4. Confirmación de venta

El sistema ejecuta `createPosOrder()` dentro de una `prisma.$transaction` atómica:

1. Resuelve el cliente (busca por ID/email/DNI, crea nuevo si hay datos, o usa Consumidor Final).
2. Verifica stock de cada variante **dentro de la transacción**. Si cualquier variante no tiene stock suficiente, lanza error y hace rollback completo.
3. Crea la orden con `isPaid: true`, `isDelivered: true`, `shippingStatus: 'Entregado'`.
4. Descuenta el stock de cada variante.
5. Calcula y persiste la comisión del vendedor (`commissionAmount = totalPrice × commissionRate`).

Si la transacción tiene éxito, la venta queda registrada y el stock actualizado de forma inmediata y atómica.

### Vista de Comisión

El vendedor puede ver su tasa de comisión actual en el dashboard de overview (solo lectura). No puede modificarla.

---

## Administrador (role: `"admin"`)

El administrador tiene acceso total al sistema. Además de todas las capacidades del vendedor y del cliente, gestiona el catálogo, los pedidos, los usuarios y la configuración del negocio.

### Acceso

Todas las rutas del sistema, incluido el panel administrativo completo:

| Sección | Ruta | Descripción |
|---|---|---|
| Dashboard | `/admin/overview` | Métricas de facturación, gráficos, stock crítico, comisiones |
| Órdenes | `/admin/orders` | Gestión y moderación de pedidos |
| Productos | `/admin/products` | ABM de productos con variantes y precios |
| Categorías | `/admin/categories` | ABM de categorías, subcategorías y talles |
| Marcas | `/admin/brands` | ABM de marcas |
| Colores | `/admin/colors` | ABM de colores del catálogo |
| Inventario | `/admin/inventory` | Stock por variante con ajuste manual |
| POS | `/admin/pos` | Punto de Venta (mismas capacidades que seller) |
| Usuarios | `/admin/users` | Roles, comisiones y datos de usuarios |
| Promociones | `/admin/promotions/banners` | Gestión de banners promocionales |
| Descuentos | `/admin/promotions/discount-codes` | CRUD de códigos de descuento |
| Configuración | `/admin/settings` | Datos bancarios y parámetros globales |

### Dashboard (`/admin/overview`)

- **Métricas de facturación:** Total facturado en el período, cantidad de órdenes, ticket promedio.
- **Gráficos de ventas:** Visualización por período con Recharts.
- **Alertas de stock crítico:** Variantes cuyo stock es menor o igual al umbral configurable (`CRITICAL_STOCK_THRESHOLD`). El umbral por defecto se configura desde `/admin/settings`.
- **Resumen de comisiones por vendedor:** Tabla con `commissionAmount` acumulado por seller en el período.

### Gestión de Órdenes (`/admin/orders`)

| Acción | Server Action | Descripción |
|---|---|---|
| Ver órdenes | — | Listado con filtros por estado (`isPaid`, `isDelivered`), método de pago y fecha |
| Aprobar transferencia | `approveBankTransfer(orderId)` | Marca `isPaid: true`. El stock ya fue descontado al crear la orden |
| Rechazar transferencia | `rejectBankTransfer(orderId)` | Cancela la orden y restaura el stock reservado atómicamente |
| Actualizar estado de envío | `updateShippingStatus(orderId, status, notes)` | Actualiza `shippingStatus` y `shippingNotes`. Trigger de email al cliente si pasa a "Enviado" |
| Marcar como entregada | `deliverOrder(orderId)` | Actualiza `isDelivered: true` y `deliveredAt` |
| Eliminar orden | `deleteOrder(orderId)` | Eliminación permanente. Solo admin (no seller) |
| Ver comprobante | — | Accede al `receiptUrl` del comprobante subido por el cliente (Uploadthing) |

### Gestión de Productos (`/admin/products`)

| Acción | Descripción |
|---|---|
| Crear producto | Nombre, slug, categoría, subcategoría, marca, descripción, imágenes (Uploadthing), destacado |
| Configurar precios | Precio CASH y precio MERCADOPAGO por separado |
| Configurar variantes de talle | Asigna talles disponibles para la categoría del producto con stock inicial |
| Configurar variantes de color | Habilita `hasColorVariants`, asigna colores con imágenes propias por color |
| Configurar variantes combinadas | Talle + color con stock independiente por combinación |
| Editar producto | Todos los campos, imágenes y variantes |
| Eliminar producto | Requiere confirmación. Destruye variantes, precios y OrderItems históricos |
| Asignar a seller | Vincula un producto a un vendedor específico (`Product.sellerId`) |

### Gestión de Categorías (`/admin/categories`)

- CRUD de categorías con slugs únicos.
- CRUD de subcategorías vinculadas a su categoría.
- Gestión de talles por categoría (los talles de "Calzado" son distintos a los de "Indumentaria").
- **Protección al eliminar:** Si la categoría tiene productos activos, el sistema requiere reasignarlos a otra categoría antes de eliminar. El backend impide el borrado con `onDelete: Restrict`.

### Gestión de Marcas (`/admin/brands`)

- CRUD con slugs únicos.
- **Protección al eliminar:** Igual que categorías — `onDelete: Restrict` impide eliminar una marca con productos activos.

### Gestión de Colores (`/admin/colors`)

- CRUD del catálogo de colores globales con nombre único y código hex.
- Los colores se vinculan a productos desde la pantalla de edición de producto.
- **Protección al eliminar:** `onDelete: Restrict` impide borrar un color que está vinculado a un `ProductColor` activo.

### Inventario (`/admin/inventory`)

- Vista de stock por variante (filtrable por categoría, marca, producto).
- Ajuste manual de stock por variante.
- Visibilidad de variantes con stock en cero o crítico.

### Gestión de Usuarios (`/admin/users`)

| Acción | Descripción |
|---|---|
| Ver usuarios | Listado con nombre, email, rol, DNI, teléfono |
| Cambiar rol | Asigna `user`, `admin` o `seller` |
| Configurar comisión | Edita `User.commissionRate` del vendedor (diálogo en la vista de usuario) |
| Ver historial de compras | Desde el detalle del usuario, acceso a sus órdenes |

### Gestión de Promociones

#### Banners Promocionales (`/admin/promotions/banners`)

| Campo | Descripción |
|---|---|
| `image` | Imagen del banner (Uploadthing) |
| `title` | Título visible |
| `subtitle` | Texto secundario (opcional) |
| `linkLabel` | Texto del CTA (opcional) |
| `discountPercent` | Descuento visual que muestra el banner (opcional) |
| `order` | Orden de aparición |
| `isActive` | Activa/desactiva el banner |
| `startsAt` / `endsAt` | Período de vigencia (opcional) |
| `products` | Productos vinculados al banner |

Al crear una orden con un banner activo, se registra `Order.bannerId` y `Order.bannerDiscount`.

#### Códigos de Descuento (`/admin/promotions/discount-codes`)

| Campo | Descripción |
|---|---|
| `code` | Código único (ej: "VERANO20") |
| `description` | Descripción interna para el admin |
| `discountPercentMercadoPago` | Porcentaje de descuento para pagos con MP |
| `discountPercentTransferencia` | Porcentaje de descuento para pagos con CASH |
| `isActive` | Activa/desactiva el código |
| `startsAt` / `endsAt` | Período de vigencia (opcional) |
| `maxUsesPerUser` | Límite de usos por usuario (opcional) |

El historial de uso queda en `PromoCodeUsage` (promoCodeId + userId + orderId + usedAt).

### Configuración del Negocio (`/admin/settings`)

Permite editar sin modificar variables de entorno:

| Parámetro | Descripción |
|---|---|
| Datos bancarios | Banco, titular, CBU, alias, CUIT — mostrados al cliente en el checkout de transferencia |
| Precio de envío | Costo aplicado cuando no se alcanza el umbral de envío gratis |
| Umbral de envío gratis | Monto mínimo de compra para envío sin costo |
| Umbral de stock crítico | Stock mínimo para alertas en el dashboard |

Los valores se leen desde `Setting` en DB con fallback a variables de entorno.

---

## Resumen de Permisos por Funcionalidad

| Funcionalidad | Anónimo | Cliente | Seller | Admin |
|---|---|---|---|---|
| Ver catálogo y productos | ✅ | ✅ | ✅ | ✅ |
| Agregar al carrito | ✅ | ✅ | ✅ | ✅ |
| Checkout online | ❌ | ✅ | ✅ | ✅ |
| Ver historial de órdenes | ❌ | ✅ (propias) | ✅ (propias) | ✅ (todas) |
| Subir comprobante de transferencia | ❌ | ✅ (propia) | ❌ | ✅ |
| Recuperar contraseña | ✅ | ✅ | ✅ | ✅ |
| POS — crear venta presencial | ❌ | ❌ | ✅ | ✅ |
| POS — buscar/crear clientes | ❌ | ❌ | ✅ | ✅ |
| Ver tasa de comisión propia | ❌ | ❌ | ✅ (solo lectura) | ✅ |
| Aprobar/rechazar transferencia | ❌ | ❌ | ✅ | ✅ |
| Actualizar estado de envío | ❌ | ❌ | ✅ | ✅ |
| Marcar orden como entregada | ❌ | ❌ | ✅ | ✅ |
| Eliminar orden | ❌ | ❌ | ❌ | ✅ |
| Dashboard y métricas | ❌ | ❌ | ❌ | ✅ |
| CRUD productos | ❌ | ❌ | ❌ | ✅ |
| CRUD categorías, marcas, colores | ❌ | ❌ | ❌ | ✅ |
| Ajuste de inventario | ❌ | ❌ | ❌ | ✅ |
| Gestión de usuarios y roles | ❌ | ❌ | ❌ | ✅ |
| Configurar comisión de sellers | ❌ | ❌ | ❌ | ✅ |
| CRUD cupones y banners | ❌ | ❌ | ❌ | ✅ |
| Configuración bancaria y parámetros | ❌ | ❌ | ❌ | ✅ |

---

## Enforcement de Autorización

La autorización se aplica en dos capas:

### Capa 1 — Middleware (Edge, antes del request)

`middleware.ts` verifica autenticación y rol antes de que el request llegue a cualquier página o Server Action:

- Rutas sin sesión → redirige a `/sign-in`
- `/admin/*` con `role !== 'admin'` → redirige a `/unauthorized`

### Capa 2 — Server Action Guards (Node.js, en la lógica de negocio)

Todas las operaciones mutantes verifican rol con guards explícitos:

```typescript
// Solo admin
await requireAdmin()          // deleteOrder

// Admin o seller
await requireAdminOrSeller()  // createPosOrder, deliverOrder,
                              // approveBankTransfer, rejectBankTransfer,
                              // updateShippingStatus
```

Ambos guards redirigen a `/unauthorized` y retornan `{ success: false }` si el rol no aplica. La verificación doble garantiza que un bug en el middleware no sea suficiente para comprometer una operación sensible.
