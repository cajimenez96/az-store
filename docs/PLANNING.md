# Backlog y Plan de Trabajo — AZ Store (v2.2.0)

Este documento centraliza el análisis técnico, los hallazgos de seguridad y el roadmap de implementación para la adopción del nuevo sistema de diseño editorial ([DESIGN.md](file:///Users/carlosjimenez/Documents/AZ-Marketing/az-ecommerce/az-store/docs/DESIGN.md)) y la consolidación de la robustez del backend.

---

## Estado General de Ejecución

- **Fase 1 (Seguridad & Backend):** 100% Completada (`[SEC-01]`, `[SEC-02]`, `[SEC-03]`) ✅
- **Fase 2 (Sistema de Diseño & Tokens):** 100% Completada (`[DES-01]`, `[DES-02]`) ✅
- **Fase 3 (Storefront & Experiencia de Compra):** 100% Completada (`[UI-01]`, `[UI-02]`, `[UI-03]`, `[UI-04]`) ✅
- **Fase 4 (Testing & QA):** 100% Tests Unitarios/Integración en verde (8 suites, 51 tests) ✅

---

## 🔒 Fase 1: Seguridad, RBAC y Robustez Backend

### `[SEC-01]` Estandarización de RBAC y Control de Excepciones en Server Actions — **[COMPLETADO ✅]**
- **Implementación:**
  - `lib/auth-guard.ts`: Creadas las funciones `assertAdmin()`, `assertSeller()`, `assertAdminOrSeller()` con clase `UnauthorizedError`.
  - En Server Actions (`user.actions.ts`, `product.actions.ts`, `order.actions.ts`, `brand.actions.ts`, `category.actions.ts`, `color.actions.ts`, `promo-code.actions.ts`, `promo-banner.actions.ts`, `settings.actions.ts`), se migraron las comprobaciones para no lanzar `redirect('/unauthorized')` dentro de bloques `try / catch`.
  - `lib/utils.ts`: `formatError` adaptado para respetar `isRedirectError` y manejar de forma limpia excepciones de autorización.

### `[SEC-02]` Validación de Integridad y Rate Limiting en Endpoints Críticos — **[COMPLETADO ✅]**
- **Implementación:**
  - `lib/rate-limiter.ts`: Exportado `promoLimiter` con ventana deslizante de 10 peticiones/min.
  - `app/api/validate-promo/route.ts`: Integrado `promoLimiter` para mitigar ataques de fuerza bruta en cupones.
  - `app/api/cron/detect-abandoned-carts/route.ts`: Validación de `CRON_SECRET` mediante comparación en tiempo constante `crypto.timingSafeEqual`.

### `[SEC-03]` Completar Flujo Transaccional de Carritos Abandonados — **[COMPLETADO ✅]**
- **Implementación:**
  - `lib/email-templates.ts`: Diseñada plantilla HTML `abandonedCartTemplate` con estética editorial y CTA de recuperación.
  - `app/api/send-email/route.ts`: Añadido manejador `abandoned-cart`.
  - `lib/email.ts`: Exportada función `sendAbandonedCartEmail`.
  - `app/api/cron/detect-abandoned-carts/route.ts`: Despacho automático de correo transaccional para cada carrito abandonado detectado.

---

## 🎨 Fase 2: Sistema de Diseño y Tokens (`DESIGN.md`)

### `[DES-01]` Normalización de Tokens y Configuración de Tailwind — **[COMPLETADO ✅]**
- **Implementación:**
  - `tailwind.config.ts`: Incorporada paleta `nike-ink` (#111111), `nike-canvas` (#ffffff), `nike-soft-cloud` (#f5f5f5), `nike-hairline` (#cacacb), `nike-hairline-soft` (#e5e5e5), `nike-sale` (#d30005) y tipografías `font-marder-display` (Cormorant Garamond) y `font-marder-body` (Inter).
  - `app/layout.tsx`: Configurada carga optimizada con `next/font/google`.

### `[DES-02]` Refactorización de Componentes Base (Pill Buttons, Badges, Search Input) — **[COMPLETADO ✅]**
- **Implementación:**
  - Botones y CTAs con geometría píldora (`rounded-full`) de 48px de altura en flujos críticos.
  - Search Pill en header con placeholder editorial y animaciones suaves.

---

## 🛍️ Fase 3: Storefront Editorial & Experiencia de Compra

### `[UI-01]` Rediseño del Header y Navegación Principal — **[COMPLETADO ✅]**
- **Implementación:** Header sticky minimalista con navegación superior en `caption-md`, buscador pill, contadores circulares e integración con carrito.

### `[UI-02]` Homepage Editorial: Hero Campaign & Grilla de Productos — **[COMPLETADO ✅]**
- **Implementación:**
  - Hero Campaign con tipografía editorial `font-marder-display`, full bleed y CTAs contrastantes.
  - Cards de producto con relación de aspecto 1:1 plana sobre stage `#f5f5f5`, swatches de colores interactivos y tipografía de precios limpia.

### `[UI-03]` Product Detail Page (PDP) Editorial — **[COMPLETADO ✅]**
- **Implementación:** Galería de imágenes en cuadrícula/carrusel responsivo, selector de variantes por talles/colores interactivos, indicador de stock y botón de compra primario `rounded-full`.

### `[UI-04]` Carrito y Checkout Flow — **[COMPLETADO ✅]**
- **Implementación:**
  - `cart/cart-table.tsx`: Tabla de carrito minimalista con cálculo transparente de totales.
  - `shipping-address-form.tsx` & `payment-method-form.tsx`: Formularios estilizados con inputs píldora y selectores claros.
  - `place-order-content.tsx` & `promo-code-input.tsx`: Resumen de orden, aplicación de cupones y confirmación.
  - `order/[id]/order-details-table.tsx`: Vista de seguimiento de orden, subida de comprobantes y acciones administrativas.

---

## 🧪 Fase 4: Testing y QA

### `[QA-01]` Suite de Pruebas Automatizadas — **[COMPLETADO ✅]**
- **Resultados:**
  - TypeScript: `bun x tsc --noEmit` -> 0 errores.
  - Jest: 8/8 suites pasando (51/51 tests unitarios e integraciones).

