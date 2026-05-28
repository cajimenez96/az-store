# 05 — Roadmap: Tareas, Estado y Futuro del Proyecto

## Estado de Avance General (2026-05-28)

```
Fase 1: Setup e Infraestructura     ████████████████  ✓ Completa
Fase 2: Integración Mercado Pago    ████████████████  ✓ Completa
Fase 3: Interfaz Storefront         ████████████████  ✓ Completa
Fase 4: Punto de Venta (POS) Local  ████████████████  ✓ Completa
Fase 5: MVP 2 — Seguridad y Tests   ████████████████  ✓ Completa (Sprints 1-5 ✓)
Fase 5.5: Hardening de Seguridad    ████████████████  ✓ Completa (Sprint 5 crítico)
Fase 6: Web Features                ░░░░░░░░░░░░░░░░  Próxima (reviews, SEO, cupones, E2E)
Fase 7: Desacoplamiento a NestJS    ░░░░░░░░░░░░░░░░  Bloqueada — fuera del scope actual
```

> La aplicación móvil Expo fue eliminada del roadmap. El proyecto es web-only.

---

## Fases Completadas

### Fase 1: Setup e Infraestructura ✓
* **1.1** Migración de la estructura base a `az-store`.
* **1.2** Remoción completa de pasarelas obsoletas (Stripe y PayPal).
* **1.3** Normalización de base de datos a 3NF: `Brand`, `Category`, `SubCategory`, `Size`, `ProductVariant`.
* **1.4** Migración y seeding con datos de prueba estructurados.

### Fase 2: Integración Mercado Pago (Backend) ✓
* **2.1** SDK de Mercado Pago v3.
* **2.2** Webhook IPN en `/api/webhooks/mercadopago` con validación de estados y procesamiento diferido de stock.
* **2.3** Acción `createMercadoPagoOrder` para inicializar Checkout Pro dinámicamente.

### Fase 3: Interfaz Storefront (Frontend) ✓
* **3.1** Selector de medios de pago en el checkout online.
* **3.2** Panel ERP administrativo con alertas de stock crítico y métricas de facturación.
* **3.3** Flujo completo de carga de comprobantes (Uploadthing) con aprobación/rechazo administrativo.

### Fase 4: Punto de Venta (POS) Local ✓
* **4.1** Acción transaccional `createPosOrder` con descuento atómico de stock.
* **4.2** Interfaz POS en `/admin/pos` para `admin` y `seller`.
* **4.3** Buscador predictivo de clientes por DNI, Nombre, Email o Teléfono.
* **4.4** Modal de alta rápida de clientes nuevos desde caja.

---

## Fase 5: MVP 2 — Seguridad, Tests y Rediseño ✓ COMPLETADA

### Sprint 1: Seguridad ✓ (2026-05-25)
- [x] Verificación de firma X-Signature en webhook MP (HMAC-SHA256 + `timingSafeEqual`)
- [x] Idempotencia completa con columna `mpPaymentId @unique`
- [x] Guard atómico de stock en `updateOrderToPaid` (previene stock negativo)
- [x] Cron endpoint cambiado a POST con `CRON_SECRET` obligatorio
- [x] Unificación de autorización admin en todas las Server Actions
- [x] Middleware con role check para `/admin/*`
- 37 tests en 6 suites

### Sprint 2: Integridad de Datos ✓
- [x] Cascade deletes → reassignment a sentinel ("Sin categoría", "Sin marca")
- [x] Órdenes MP huérfanas con `expiresAt` y cron extendido
- [x] Prisma singleton con hot-reload guard
- [x] `shippingPrice` threshold configurable desde env
- [x] Campos de reviews inactivos ocultos en storefront
- [ ] `docs/` en `.gitignore` + rotación de credenciales ⚠ pendiente

### Sprint 3: Testing ✓
- [x] Base de datos de tests separada (`az_store_test`)
- [x] Tests de integración: webhook MP, POS, transferencia bancaria, cron, autorización, cart merge
- [x] 40 tests en 8 suites con DB real

### Sprint 4: Rediseño UI ✓ (en cierre)
- [x] Design tokens en `tailwind.config.ts` + Geist Variable Font
- [x] Homepage con layout cinético (white canvas, Meta design system)
- [x] PDP con galería, rail sticky desktop y bottom bar mobile
- [x] Cart y checkout flow completo
- [x] Admin panel y dashboard
- [x] Interfaz POS
- [x] Dark mode / Light mode (CSS variables + next-themes)
- [x] Loading screen rediseñado
- [ ] Auditoría responsive completa (4.9) ⏳

---

## Fase 5.5: Hardening de Seguridad ⏳ PRÓXIMO (v2.1.0)

### Sprint 5: Security Hardening — Critical Fixes

**5.1 Rate Limiting en Autenticación** (CRÍTICA — 2h)
- Implementar `Ratelimit` de Upstash en `/sign-in`
- 5 intentos / 15 minutos por email
- Bloqueo temporal tras exceso
- Tests de brute force prevention

**5.2 Security Headers en next.config.js** (CRÍTICA — 1h)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Strict-Transport-Security (HSTS)
- Content-Security-Policy
- X-XSS-Protection

**5.3 Input Validation & Sanitización** (CRÍTICA — 1 día)
- Esquema Zod completo para updateShippingStatus
- Password strength validator (12 chars + mayúscula + minúscula + número + especial)
- Escapado de HTML en todos los inputs de texto
- Pruebas de XSS/injection

**5.4 Session Timeout & Security Config** (ALTA — 2h)
- NextAuth `maxAge: 24h`
- Refresh token rotation
- Secure flag en cookies (httpOnly, sameSite=strict)

**5.5 Audit Logging** (ALTA — 1 día)
- Tabla `AuditLog` en Prisma schema
- Log de: rechaza pago, aprueba TB, crea usuario, elimina producto
- Timestamps + userId + action + target + details
- UI en `/admin/audit` para admin solo

**5.6 Sanitización de Logs & Error Handling** (ALTA — 4h)
- Logger util que sanitiza sensitive data
- No exponer mpAccessToken, emails, montos en production logs
- Error boundaries en componentes críticos

---

## Fase 6: Web Features

### 6.1 Gestión de comisiones de vendedores ✓ COMPLETADO
`commissionRate Float?` en `User` + `sellerId / commissionAmount` en `Order`. Solo admin edita la tasa (dialog en overview). `createPosOrder` calcula y persiste comisión al confirmar venta POS. Seller ve su tasa en overview (read-only).

### 6.2 Configuración de datos bancarios desde admin ✓ COMPLETADO
`BANK_TRANSFER_INFO` eliminado de constants. Los 5 campos bancarios viven en modelo `Setting` con fallback a `.env`. Página `/admin/settings` solo para admin. Orden de checkout lee datos dinámicos.

### 6.3 Emails transaccionales + Password reset ✓ COMPLETADO (v2.0.0)
Resend v4 + React Email v3 instalados. Implementar cobertura completa:
- **E1-E4**: flujo TransferenciaBancaria (orden creada, comprobante subido, aprobada, rechazada) ✓
- **E5-E7**: actualizar plantillas MP a español + az- design + agregar email de envío ✓
- **E8**: password reset — `PasswordResetToken` en DB + páginas `/forgot-password` y `/reset-password` ✓

### 6.4 SEO y metadata (v2.2 — PRÓXIMO)
`generateMetadata()` dinámico en PDP, `sitemap.xml` generado desde DB, `robots.txt`, structured data JSON-LD para productos, canonical URLs.

### 6.5 Reseñas y Ratings (v2.4 — POSPUESTO)
Implementar en v2.4. Reseñas y ratings pospuestas a favor de SEO, carrito abandonado, cupones, E2E tests.

### 6.6 Cupones y Descuentos (v2.3)
- Tabla `Coupon` (código, tipo: %, monto; validez fechas, stock, usesMax)
- Input en checkout para aplicar cupón
- Cálculo en `calcPrice()` antes de tax y shipping
- Admin CRUD: crear, editar, ver historial de uso
- Validación: código existe, no expirado, stock disponible, usuario no lo usó

### 6.7 Carrito Abandonado (v2.2)
- Cron job cada 1h: detecta carritos sin actividad > 1h
- Email automático con recovery link
- Link pre-carga carrito + cupón de reactivación (-10%)
- Tracking: cart recovery metrics en overview

### 6.8 ISR + Performance (v2.3)
- ISR en PDPs: revalidate cada 1h (stock changes, review updates)
- Code splitting dinámico para Recharts, QR code generator
- Image optimization con Next Image
- Bundle audit: target < 400KB main bundle

### 6.9 Búsqueda Avanzada (v2.3)
- Full-text search con Postgres FTS5 (no Algolia)
- Filtros combinables: precio, categoria, marca, rating, talle disponible
- Autocomplete en buscador (top 5 matches)
- Búsqueda por SKU

### 6.10 Banner promocional configurable (v2.4)
- Tabla `Promotion` (título, descripción, imagen, validez, orden de display)
- CRUD en `/admin/settings/promotions`
- Homepage lee promociones activas
- Soporte para múltiples banners en rotación

### 6.11 Tests E2E con Playwright (v2.4)
- Checkout completo (TB + MP)
- Flujo POS: cliente, agregar producto, pago
- Admin: aprobar transferencia, rechazar pago
- Carrito: merge en login, actualizar cantidades
- Performance: LCP, FID metrics

---

## Fase 7: Desacoplamiento a NestJS (futura, fuera de scope actual)

**Bloqueada hasta:** Fase 6 completa.
* Monorepo (Nx o Turborepo).
* App NestJS (`apps/api`) con Prisma y lógica de negocio.
* Autenticación JWT.
* Reemplazar Server Actions de Next.js por fetch tipado al backend NestJS.
