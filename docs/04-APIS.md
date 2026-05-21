# 04 — Contratos de API y Server Actions

## Patrón de Arquitectura

Este proyecto usa **Server Actions** de Next.js 15 como capa principal de acceso a datos,
no Route Handlers REST clásicos. Los Route Handlers se usan solo para:
- Webhooks externos (Mercado Pago IPN).
- Endpoints de cron (liberación de stock).
- Uploadthing (subida de archivos).

---

## Server Actions Existentes (ya funcionan)

### `lib/actions/order.actions.ts`

| Action | Descripción | Estado |
|---|---|---|
| `createOrder()` | Crea orden desde el carrito del usuario. | ✅ Existe — 🔧 Modificar para stock + expiresAt |
| `getOrderById(id)` | Obtiene una orden con sus items y usuario. | ✅ Sin cambios |
| `getMyOrders({ page })` | Lista órdenes del usuario autenticado. | ✅ Sin cambios |
| `getAllOrders({ page, query })` | Lista todas las órdenes (admin). | ✅ Sin cambios |
| `updateOrderToPaid({ orderId, paymentResult })` | Marca orden como pagada y descuenta stock en `$transaction`. | ✅ Sin cambios — reutilizar en aprobación de transferencia |
| `updateOrderToPaidCOD(orderId)` | Versión admin de marcar como pagado (COD/Transferencia). | ✅ Existe — 🔧 Adaptar para validar `receiptUrl` |
| `deliverOrder(orderId)` | Marca orden como entregada. | ✅ Sin cambios |
| `deleteOrder(id)` | Elimina una orden (admin). | ✅ Sin cambios |
| `getOrderSummary()` | Métricas para el dashboard de admin. | ✅ Sin cambios |

### `lib/actions/product.actions.ts`

| Action | Descripción | Estado |
|---|---|---|
| `getLatestProducts()` | Últimos productos para la home. | ✅ Sin cambios |
| `getProductBySlug(slug)` | Detalle de producto por slug. | ✅ Sin cambios |
| `getAllProducts({ query, page, category... })` | Lista con filtros y paginación. | ✅ Sin cambios |
| `createProduct(data)` | Crear producto (admin). | ✅ Sin cambios |
| `updateProduct(data)` | Actualizar producto (admin). | ✅ Sin cambios |
| `deleteProduct(id)` | Eliminar producto (admin). | ✅ Sin cambios |

### `lib/actions/cart.actions.ts`

| Action | Descripción | Estado |
|---|---|---|
| `addItemToCart(data)` | Agrega item al carrito. | ✅ Sin cambios |
| `removeItemFromCart(productId)` | Quita item del carrito. | ✅ Sin cambios |
| `getMyCart()` | Obtiene el carrito del usuario/sesión. | ✅ Sin cambios |

---

## Server Actions a Crear 🆕

### `approveBankTransfer(orderId: string)`

**Archivo:** `lib/actions/order.actions.ts`

**Descripción:** El administrador aprueba una transferencia bancaria.

**Lógica:**
```typescript
export async function approveBankTransfer(orderId: string) {
  // 1. Verificar que el usuario es admin (auth check)
  // 2. Obtener la orden
  // 3. Validar que paymentMethod === 'TransferenciaBancaria'
  // 4. Validar que receiptUrl no es null
  // 5. Llamar a updateOrderToPaid({ orderId }) — ya existe, maneja stock en $transaction
  // 6. revalidatePath('/admin/orders')
}
```

---

### `rejectBankTransfer(orderId: string)`

**Archivo:** `lib/actions/order.actions.ts`

**Descripción:** El administrador rechaza una transferencia bancaria y libera el stock.

**Lógica:**
```typescript
export async function rejectBankTransfer(orderId: string) {
  // 1. Verificar que el usuario es admin (auth check)
  // 2. Obtener la orden con sus orderitems
  // 3. $transaction:
  //    a. Para cada item: product.stock += item.qty (restaurar stock)
  //    b. order.isPaid = false, order cancellada (podemos agregar campo isCancelled o usar isPaid=false + paidAt=null)
  // 4. revalidatePath('/admin/orders')
}
```

---

### `createMercadoPagoOrder(orderId: string)`

**Archivo:** `lib/actions/order.actions.ts`

**Descripción:** Crea una preferencia de pago en Mercado Pago y retorna la URL de checkout.

**Lógica:**
```typescript
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function createMercadoPagoOrder(orderId: string) {
  // 1. Obtener la orden con sus items
  // 2. Crear la preferencia en MP con los items
  // 3. Guardar el preference.id en order.paymentResult (campo JSON existente)
  // 4. Retornar preference.init_point (URL de redirección al checkout)
}
```

---

## Route Handlers a Crear 🆕

### `POST /api/webhooks/mercadopago`

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

**Descripción:** Recibe las notificaciones IPN de Mercado Pago.

**Lógica:**
```typescript
export async function POST(req: Request) {
  // 1. Parsear el body (query params: type, data.id)
  // 2. Si type === 'payment':
  //    a. GET https://api.mercadopago.com/v1/payments/{data.id}
  //    b. Si payment.status === 'approved':
  //       - Buscar orden por payment.metadata.orderId o external_reference
  //       - updateOrderToPaid({ orderId, paymentResult: {...} })
  // 3. Responder 200 OK siempre (MP reintenta si recibe otro status)
}
```

**Variables necesarias:**
```
MERCADOPAGO_ACCESS_TOKEN   # Para verificar el pago en la API de MP
```

---

### `GET /api/cron/release-expired-orders`

**Archivo:** `app/api/cron/release-expired-orders/route.ts`

**Descripción:** Libera el stock de órdenes de transferencia no aprobadas en 24 horas.
Llamado por un servicio externo (cron-job.org, Vercel Cron, GitHub Actions).

**Lógica:**
```typescript
export async function GET(req: Request) {
  // 1. Verificar header Authorization: Bearer CRON_SECRET
  // 2. Buscar órdenes donde:
  //    paymentMethod === 'TransferenciaBancaria'
  //    && isPaid === false
  //    && expiresAt < now()
  // 3. Para cada orden expirada, en $transaction:
  //    a. Restaurar stock de cada orderItem
  //    b. Marcar la orden como cancelada
  // 4. Retornar { cancelled: N } con cuántas órdenes se procesaron
}
```

**Variables necesarias:**
```
CRON_SECRET   # Token secreto para autenticar el cron
```

---

## Endpoint Existente: Uploadthing

**Archivo:** `app/api/uploadthing/core.ts`

Ya funciona. Solo acepta uploads de usuarios autenticados.
Para que los clientes puedan subir comprobantes de transferencia **sin estar logueados**,
hay que agregar un segundo endpoint público:

```typescript
export const ourFileRouter = {
  // Existente — solo admins
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // 🆕 Nuevo — para comprobantes de transferencia (usuario logueado)
  receiptUploader: f({ image: { maxFileSize: '8MB' } })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async () => {}),
} satisfies FileRouter;
```
