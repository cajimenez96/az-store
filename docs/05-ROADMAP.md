# 05 — Roadmap: Tareas y Estado de Avance

## Estado General

```
Fase 1: Setup e Infraestructura     ████████████░░  80%
Fase 2: Integración MercadoPago     ░░░░░░░░░░░░░░   0%
Fase 3: Interfaz Storefront         ░░░░░░░░░░░░░░   0%
Fase 4: Verificación y Testing      ░░░░░░░░░░░░░░   0%
```

---

## Fase 1: Setup e Infraestructura

- [x] **1.1** Evaluar y elegir prostore como base del proyecto (reemplaza dupla GersonRocha9).
- [x] **1.2** Copiar prostore a `az-ecommerce/az-store`.
- [x] **1.3** Eliminar dependencias de Stripe y PayPal (`package.json`).
- [x] **1.4** Actualizar `lib/constants/index.ts`:
  `PAYMENT_METHODS` → `['MercadoPago', 'TransferenciaBancaria']`
- [x] **1.5** Limpiar `order/[id]/page.tsx` y `order-details-table.tsx` de referencias a Stripe/PayPal.
- [x] **1.6** Eliminar archivos obsoletos: `stripe-payment.tsx`, `stripe-payment-success/`,
  `app/api/webhooks/stripe/`, `lib/paypal.ts`, `tests/paypal.test.ts`.
- [x] **1.7** Crear documentación técnica completa en `docs/`.
- [ ] **1.8** Configurar `.env` con todas las variables (ver `docs/06-ENV.md`).
- [ ] **1.9** Correr `npm install` para registrar cambios de `package.json`.
- [ ] **1.10** Agregar campos `receiptUrl` y `expiresAt` al modelo `Order` en `prisma/schema.prisma`.
- [ ] **1.11** Correr `npx prisma migrate dev --name "add-receipt-url-and-expires-at-to-order"`.
- [ ] **1.12** Verificar que el proyecto levanta en dev sin errores: `npm run dev`.

---

## Fase 2: Integración MercadoPago (Backend)

- [ ] **2.1** Instalar SDK de MercadoPago: `npm install mercadopago`.
- [ ] **2.2** Crear `lib/mercadopago.ts` con el cliente singleton del SDK.
- [ ] **2.3** Agregar `MERCADOPAGO_ACCESS_TOKEN` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` al `.env`.
- [ ] **2.4** Crear `app/api/webhooks/mercadopago/route.ts` para manejar IPN de pagos.
- [ ] **2.5** Agregar Server Action `createMercadoPagoOrder(orderId)` en `order.actions.ts`:
  crea la preferencia MP y retorna la URL de Checkout Pro.
- [ ] **2.6** Modificar `createOrder()` en `order.actions.ts`:
  - Si `paymentMethod === 'TransferenciaBancaria'`: decrementar stock inmediatamente y
    setear `expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)`.
  - Si `paymentMethod === 'MercadoPago'`: no tocar stock (esperar webhook).
- [ ] **2.7** Crear Server Action `approveBankTransfer(orderId)`:
  valida `receiptUrl`, llama a `updateOrderToPaid()`.
- [ ] **2.8** Crear Server Action `rejectBankTransfer(orderId)`:
  restaura stock de cada item en `$transaction` y cancela la orden.
- [ ] **2.9** Crear `app/api/cron/release-expired-orders/route.ts`:
  cancela órdenes expiradas y restaura stock. Protegido con `CRON_SECRET`.
- [ ] **2.10** Agregar endpoint `receiptUploader` en `app/api/uploadthing/core.ts` para comprobantes.

---

## Fase 3: Interfaz Storefront (Frontend)

- [ ] **3.1** Actualizar `app/(root)/payment-method/payment-method-form.tsx`:
  mostrar logos y descripciones de MercadoPago y TransferenciaBancaria.
- [ ] **3.2** Actualizar `app/(root)/order/[id]/order-details-table.tsx`:
  - Si `paymentMethod === 'MercadoPago'` y `!isPaid`: botón "Pagar con Mercado Pago"
    que llama a `createMercadoPagoOrder()` y redirige.
  - Si `paymentMethod === 'TransferenciaBancaria'` y `!isPaid` y `!receiptUrl`:
    mostrar CBU/Alias del negocio + `UploadDropzone` para subir el comprobante.
  - Si `paymentMethod === 'TransferenciaBancaria'` y `!isPaid` y `receiptUrl`:
    mostrar mensaje "Comprobante enviado, esperando aprobación".
- [ ] **3.3** Actualizar vista admin de orden (`app/admin/orders/[id]`):
  mostrar previsualización del comprobante y botones Aprobar/Rechazar.
- [ ] **3.4** Conectar botones Aprobar/Rechazar a `approveBankTransfer()` y `rejectBankTransfer()`.
- [ ] **3.5** Actualizar `order-details-table.tsx`:
  mostrar badge de estado diferenciado para `TransferenciaBancaria` no aprobada.

---

## Fase 4: Verificación y Testing Manual

- [ ] **4.1** Verificar flow MercadoPago Sandbox:
  checkout → redirección MP → pago aprobado en sandbox → webhook IPN recibido →
  orden `isPaid: true` en DB → email de confirmación enviado.
- [ ] **4.2** Verificar que el stock NO se descuenta hasta recibir webhook de MP aprobado.
- [ ] **4.3** Verificar flow TransferenciaBancaria:
  checkout → orden creada → stock decrementado → pantalla muestra CBU y uploader.
- [ ] **4.4** Verificar subida de comprobante a Uploadthing y guardado de `receiptUrl` en la orden.
- [ ] **4.5** Verificar aprobación admin:
  admin ve comprobante → hace click en "Aprobar" → orden `isPaid: true` → email enviado.
- [ ] **4.6** Verificar rechazo admin:
  admin rechaza → stock restaurado en DB → cliente puede comprar de nuevo.
- [ ] **4.7** Verificar cron de expiración:
  crear orden de transferencia → modificar `expiresAt` a hace 1 hora en DB →
  llamar manualmente al endpoint de cron → verificar que stock se restauró.
- [ ] **4.8** Verificar permisos: usuario no-admin no puede acceder a `/admin/*`.
- [ ] **4.9** Verificar Dark/Light mode funciona en todas las pantallas críticas.

---

## Referencia Rápida de Archivos Clave

| Archivo | Qué hace | Acción |
|---|---|---|
| `lib/actions/order.actions.ts` | Toda la lógica de órdenes | 🔧 Modificar + agregar nuevas actions |
| `lib/mercadopago.ts` | Cliente SDK de MP | 🆕 Crear |
| `app/api/webhooks/mercadopago/route.ts` | IPN de pagos MP | 🆕 Crear |
| `app/api/cron/release-expired-orders/route.ts` | Liberar stock expirado | 🆕 Crear |
| `app/api/uploadthing/core.ts` | Uploader de archivos | 🔧 Agregar `receiptUploader` |
| `app/(root)/order/[id]/order-details-table.tsx` | Vista de detalle de orden | 🔧 Agregar uploader comprobante y botón MP |
| `app/(root)/payment-method/` | Selección de método de pago | 🔧 Actualizar UI con logos |
| `prisma/schema.prisma` | Schema de BD | 🔧 Agregar `receiptUrl` y `expiresAt` |
| `lib/constants/index.ts` | Constantes globales | ✅ Ya actualizado |
