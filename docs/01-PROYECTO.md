# 01 — Proyecto: Objetivo, Alcance y Reglas de Negocio

## Objetivo Principal

Diseñar y desplegar un **Marketplace E-commerce MVP** que soporte:
- Catálogo dinámico de productos con variaciones (talles, colores, imágenes múltiples).
- Carrito de compras persistente y sistema de favoritos (wishlist).
- Checkout híbrido con dos métodos de pago.
- Panel administrativo único (SuperAdmin) para gestión completa del negocio.

---

## Métodos de Pago

### Mercado Pago Checkout Pro
- El cliente es redirigido al checkout de Mercado Pago.
- La confirmación de pago llega via **webhook IPN** (asíncrono).
- Al recibir el IPN con estado `approved`, la orden pasa a `isPaid: true` y se descuenta el stock definitivamente.
- **Comisiones:** No se usa split automático (no hay OAuth por vendedor). Las comisiones se calculan y facturan de forma consolidada a fin de mes por el administrador.

### Transferencia Bancaria Manual
- Al elegir este método, el checkout muestra el **CBU/Alias** de la cuenta del negocio.
- El cliente **sube la imagen del comprobante** (captura de pantalla o foto) directamente en la plataforma.
- La imagen se guarda en Uploadthing y la URL queda registrada en `Order.receiptUrl`.
- El stock se **congela de inmediato** al crear la orden (campo `Order.expiresAt = now() + 24hs`).
- El administrador tiene 24 horas para **aprobar o rechazar** la transferencia desde el dashboard.

---

## Reglas de Inventario (Stock)

| Situación | Acción del Sistema |
|---|---|
| Cliente elige Transferencia Bancaria | Stock decrementado inmediatamente. Orden en `isPaid: false`. |
| Admin aprueba transferencia | Orden pasa a `isPaid: true`. Stock queda descontado permanentemente. |
| Admin rechaza transferencia | Orden cancelada. Stock restaurado con `$transaction` de Prisma. |
| Orden no aprobada en 24 hs | Cron job cancela la orden y restaura el stock automáticamente. |
| Cliente elige Mercado Pago | Stock NO se descuenta hasta recibir webhook de pago aprobado. |
| Webhook MP recibido con `approved` | Stock decrementado. Orden pasa a `isPaid: true`. Email enviado. |

---

## Alcance del MVP

### ✅ Incluido
- ABM de productos (nombre, precio, descripción, imágenes, stock, variaciones).
- ABM de categorías y marcas.
- Carrito persistente (sesión anónima + usuario registrado).
- Checkout multi-paso: carrito → dirección → método de pago → confirmar.
- Panel admin: gestión de órdenes, usuarios y productos.
- Dashboard con métricas de ventas mensuales (Recharts).
- Sistema de reviews y ratings de productos.
- Emails transaccionales de confirmación de compra (Resend).
- Dark/Light mode.
- Búsqueda, paginación y filtros en catálogo y admin.
- Subida de imágenes de productos y comprobantes (Uploadthing).

### ❌ Fuera del MVP
- Split automático de comisiones en tiempo real (OAuth por vendedor en Mercado Pago).
- Panel multi-vendor (cada vendedor gestiona su catálogo propio).
- Calculadora de envíos automática (integración con correo/courier).
- App móvil (Expo).

---

## Decisiones de Diseño Clave

| Decisión | Elección | Justificación |
|---|---|---|
| Arquitectura | Monolito (1 repo) | MVP más simple de deployar y mantener |
| Base de datos | PostgreSQL | Integridad transaccional para órdenes y stock |
| ORM | Prisma 6.5 | Type-safe, migraciones versionadas |
| Auth | NextAuth v5 | Open source, sin SaaS externo costoso |
| Imágenes | Uploadthing | Ya integrado en prostore, cero fricción |
| Emails | Resend | Ya integrado, plan free generoso |
| Pagos | MercadoPago + Transferencia | Dominante en LATAM |
| Comisiones | Post-pago consolidado mensual | Evita fricción de OAuth por vendedor |
