# 02 — Descripción del Producto

> Product Owner & Product Manager — AZ Store v2.1.0
> Última actualización: 2026-06-15

---

## Qué es AZ Store

AZ Store es un **e-commerce híbrido** que unifica la venta online y la venta presencial en una sola plataforma. Está diseñado para negocios de indumentaria y calzado que operan simultáneamente en un local físico y en un canal digital, eliminando la fricción de gestionar dos sistemas separados.

El producto se posiciona como una solución integral: los clientes compran online con sus métodos habituales, y los vendedores del local cierran ventas presenciales desde la misma plataforma con el mínimo de pasos posible. El stock y el historial de órdenes son únicos y compartidos.

---

## Propuesta de Valor

| Para quién | Problema que resuelve | Cómo lo resuelve |
|---|---|---|
| Dueño del negocio | Gestionar stock en dos sistemas | Una sola DB con tres flujos de venta sincronizados |
| Cliente online | Pagar con transferencia sin fricciones | Reserva de stock inmediata + carga de comprobante desde la app |
| Vendedor de local | Registrar ventas rápido en caja | POS de pantalla única con buscador predictivo y pago en un paso |
| Administrador | Ver facturación en tiempo real | Dashboard con métricas, gráficos y alertas de stock crítico |

---

## Canales de Venta

### 1. Tienda Online (Storefront Público)

Accesible desde cualquier dispositivo. Los clientes navegan el catálogo, filtran por categoría, marca y talle, y compran con dos opciones de pago:

**Mercado Pago Checkout Pro**
- El cliente es redirigido al checkout de Mercado Pago.
- El stock **no se reserva** hasta recibir la confirmación del webhook con estado `approved`.
- La aprobación es asíncrona (webhook IPN/Webhook de MP).

**Transferencia Bancaria Manual**
- El sistema descuenta el stock inmediatamente al confirmar el pedido.
- La orden expira en 24 horas si no se aprueba manualmente.
- El cliente sube la captura del comprobante desde la vista de su orden.
- El administrador o vendedor aprueba o rechaza la transferencia en el panel.

### 2. Punto de Venta (POS Local)

Accesible desde `/admin/pos` para usuarios con rol `admin` o `seller`. Pantalla única optimizada para velocidad:
- Sin dirección de envío obligatoria (entrega inmediata).
- Buscador predictivo de productos con filtro por categoría.
- Búsqueda de clientes por DNI, nombre, email o teléfono.
- Alta rápida de nuevos clientes sin salir de la pantalla.
- Si el cliente no se registra, la venta se asocia al comodín "Consumidor Final".
- La orden se crea directamente como pagada y entregada en una sola transacción atómica.

**Métodos de pago disponibles en POS:**
- Efectivo
- Transferencia Bancaria en Local
- Código QR
- Mercado Pago (Terminal Física)

---

## Sistema de Precios Dual

Cada producto tiene **dos precios independientes**:

| Tipo | Cuándo aplica |
|---|---|
| Precio CASH | Transferencia bancaria online + todos los métodos POS |
| Precio MERCADOPAGO | Checkout Pro de Mercado Pago online |

Los precios se configuran por producto desde el panel de administración. El cliente ve el precio correspondiente al método de pago que selecciona. El precio efectivamente cobrado queda auditado en la orden.

---

## Reglas de Inventario y Estados de Orden

| Situación | Canal | Acción del Sistema | Estado Final |
|---|---|---|---|
| Compra por Transferencia | Online | Descuenta stock inmediatamente. Orden expira en 24 horas. | `isPaid: false`, envío: `Pendiente` |
| Transferencia Aprobada | Online | Preserva el descuento de stock. | `isPaid: true`, envío: `Pendiente` |
| Transferencia Rechazada | Online | Cancela y reintegra el stock. | `isPaid: false`, envío: `Cancelado` |
| Orden Expirada (Cron) | Online | Cancela el pedido y restaura el stock. | `isPaid: false`, envío: `Cancelado` |
| Compra por Mercado Pago | Online | Stock se descuenta **solo** tras recibir webhook aprobado. | `isPaid: true`, envío: `Pendiente` |
| Venta POS | Local | Descuenta stock al instante. Orden finalizada y entregada. | `isPaid: true`, `isDelivered: true`, envío: `Entregado` |

---

## Catálogo de Productos

### Taxonomía
- **Categoría** (ej: Calzado, Indumentaria)
- **Subcategoría** (ej: Zapatillas, Buzos)
- **Marca**
- **Talles** vinculados por categoría (talles de calzado diferentes a talles de ropa)

### Variantes
Cada producto puede tener variantes por:
- **Talle** (con stock independiente por variante)
- **Color** (con galería de imágenes propia por color)
- **Talle + Color combinados**

### Imágenes
Las imágenes de catálogo se suben y alojan en Uploadthing. Cada color de producto puede tener su propio set de imágenes.

---

## Funcionalidades Implementadas

### Storefront

| Funcionalidad | Descripción |
|---|---|
| Homepage | Layout cinematográfico con banners promocionales, productos destacados y en oferta |
| Catálogo y búsqueda | Listado con filtros por categoría, marca, talle. Paginación configurable |
| Product Detail Page | Galería de imágenes, selector de variante (talle + color) con stock visible, precio según método de pago |
| Carrito persistente | Fusión automática del carrito anónimo con el del usuario tras el login |
| Checkout online | Dirección de envío → método de pago → confirmación de orden |
| Detalle de orden | Vista de estado, datos bancarios para transferencia, carga de comprobante |
| Historial de pedidos | Vista de todas las órdenes del cliente autenticado |
| Perfil de usuario | Datos personales del cliente |

### Autenticación

| Funcionalidad | Descripción |
|---|---|
| Registro de cuenta | Email + contraseña con validación |
| Login | Credenciales locales con NextAuth v5 |
| Recuperación de contraseña | Flujo completo: solicitud → email con token → nueva contraseña (token expira en 1 hora) |
| Protección de rutas | Middleware bloquea acceso a /admin sin rol admin y al checkout sin sesión |

### Panel Administrativo (ERP)

| Sección | Funcionalidades |
|---|---|
| Overview / Dashboard | Métricas de facturación, gráficos de ventas por período (Recharts), alertas de stock crítico (variantes con stock ≤ umbral configurable), resumen de comisiones por vendedor |
| Gestión de Órdenes | Listado con filtros, aprobación/rechazo de transferencias, actualización de estado de envío con notas, descarga de comprobantes |
| Gestión de Productos | CRUD completo con imágenes (Uploadthing), variantes por talle y color, configuración de precios dual (CASH / MercadoPago), estado de destacado |
| Gestión de Categorías | CRUD de categorías, subcategorías y talles vinculados |
| Gestión de Marcas | CRUD con slugs únicos. Protección contra eliminación con productos activos |
| Gestión de Colores | CRUD del catálogo de colores con código hex |
| Inventario | Vista de stock por variante con filtros, ajuste de stock manual |
| Usuarios | Listado, asignación de roles (user/admin/seller), edición de tasa de comisión por vendedor, datos de DNI y teléfono |
| Punto de Venta | POS de pantalla única para ventas presenciales |
| Promociones | Gestión de banners promocionales con fechas de vigencia y productos vinculados. CRUD de códigos de descuento con descuentos diferenciados por método de pago |
| Configuración | Datos bancarios (CBU, alias, CUIT, titular, banco), parámetros de envío (precio, umbral de envío gratis), umbral de stock crítico |

### Emails Transaccionales

| Trigger | Destinatario |
|---|---|
| Orden creada (TransferenciaBancaria) | Cliente |
| Comprobante subido | Administrador |
| Transferencia aprobada | Cliente |
| Transferencia rechazada | Cliente |
| Pago MP aprobado (webhook) | Cliente |
| Orden creada (MP, pre-pago) | Cliente |
| Orden marcada como enviada | Cliente |
| Solicitud de reset de contraseña | Usuario |

### Sistema de Recuperación de Carritos

- Un cron detecta carritos con items sin actividad por más de 1 hora.
- Genera un link personalizado y envía un email al cliente.
- El link pre-carga el carrito y puede incluir un cupón de recuperación.
- Se registra la conversión cuando el cliente completa el checkout.

### Sistema de Cupones y Descuentos

Los códigos promocionales (`PromoCode`) soportan:
- Descuentos diferenciados por método de pago (MercadoPago vs Transferencia/CASH)
- Fecha de inicio y fin de vigencia
- Límite de usos por usuario
- Validación en tiempo real desde el checkout
- Historial de uso por usuario y orden

### Sistema de Comisiones

- Cada vendedor tiene una `commissionRate` configurable (ej: `0.10` = 10%).
- Al registrar una venta POS, se calcula y persiste `commissionAmount` en la orden.
- El administrador ve el resumen de comisiones por vendedor en el dashboard.
- El vendedor puede ver su propia tasa en el overview (solo lectura).

### Configuración Dinámica

Los parámetros del negocio se almacenan en base de datos (tabla `Setting`) y pueden editarse desde el panel sin modificar variables de entorno:

| Parámetro | Descripción |
|---|---|
| `BANK_NAME` | Nombre del banco |
| `BANK_HOLDER` | Titular de la cuenta |
| `BANK_CBU` | CBU |
| `BANK_ALIAS` | Alias |
| `BANK_CUIT` | CUIT del titular |
| `FREE_SHIPPING_THRESHOLD` | Mínimo de compra para envío gratis |
| `SHIPPING_PRICE` | Costo de envío cuando no aplica el umbral |
| `CRITICAL_STOCK_THRESHOLD` | Stock mínimo para generar alerta en dashboard |

---

## Estado del Roadmap (2026-06-15)

### Completado

| Fase | Estado |
|---|---|
| Setup e Infraestructura | ✅ Completo |
| Integración Mercado Pago (webhook, Checkout Pro) | ✅ Completo |
| Storefront completo (homepage, PDP, cart, checkout) | ✅ Completo |
| Punto de Venta (POS) | ✅ Completo |
| Seguridad crítica (HMAC webhook, stock atómico, idempotencia, cron protegido) | ✅ Completo |
| Integridad de datos (cascade → restrict, expiración MP, hot-reload guard) | ✅ Completo |
| Suite de tests de integración (40 tests, DB real) | ✅ Completo |
| Rediseño UI (design tokens, dark/light mode, responsive) | ✅ Completo |
| Comisiones de vendedores | ✅ Completo |
| Configuración bancaria dinámica | ✅ Completo |
| Emails transaccionales completos | ✅ Completo |
| Recuperación de contraseña | ✅ Completo |
| Sistema de precios dual | ✅ Completo |
| Variantes por color | ✅ Completo |
| Sistema de cupones y descuentos | ✅ Completo |
| Recuperación de carritos abandonados | ✅ Completo |
| Banners promocionales configurables | ✅ Completo |

### Pendiente

| Funcionalidad | Prioridad |
|---|---|
| Auditoría responsive completa | Alta |
| SEO: `generateMetadata()` dinámico, sitemap, structured data JSON-LD | Alta |
| Tests E2E con Playwright | Media |
| Hardening de seguridad: rate limiting login (Upstash ya instalado), security headers, session timeout | Alta |
| Audit logging (tabla de acciones sensibles) | Media |
| Búsqueda avanzada full-text con filtros combinables | Media |
| ISR en PDPs y optimización de bundle | Baja |

---

## Problemas Conocidos

| Problema | Impacto | Estado |
|---|---|---|
| Restauración de stock falla si se renombra un talle | Bajo | Pendiente — el cron busca variante por nombre |
| `Cart.items` sin FK a productos | Medio | Pendiente — datos pueden quedar huérfanos |
| Credenciales expuestas en historial git | Alto | Pendiente — rotar credenciales y agregar `docs/` a `.gitignore` |
| Eliminar producto destruye historial de `OrderItem` | Alto | Comportamiento conocido, sin soft-delete implementado |
