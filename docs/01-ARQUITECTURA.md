# 01 — Arquitectura del Proyecto

> Tech Lead & Arquitecto — AZ Store v2.1.0
> Última actualización: 2026-06-15

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 | Full-stack: storefront + panel admin + API |
| Runtime | React | ^19.0.0 | Renderizado de UI |
| Lenguaje | TypeScript | ^5 | Tipado estricto end-to-end |
| Estilos | Tailwind CSS | ^3.4.1 | Sistema de diseño responsive |
| Componentes UI | Shadcn UI + Radix UI | — | Interfaz accesible y componentes primitivos |
| Carrusel | Embla Carousel | ^8.5.1 | Galería de imágenes en PDP y homepage |
| ORM | Prisma | 6.5.0 | Acceso y mapeo relacional |
| Base de datos | PostgreSQL (Neon) | — | Base de datos relacional serverless |
| Autenticación | NextAuth v5 | ^5.0.0-beta.25 | Sesiones con credentials provider |
| Almacenamiento | Uploadthing | ^7.4.0 | Imágenes de catálogo y comprobantes |
| Emails | Resend + React Email | ^4.0.1 / ^3.0.7 | Correos transaccionales con templates JSX |
| Pagos | Mercado Pago SDK | ^3.0.0 | Checkout Pro online + Webhooks IPN |
| Rate Limiting | Upstash Redis + Ratelimit | ^1.38.0 / ^2.0.8 | Protección brute force en login |
| Validación | Zod | ^3.23.8 | Contratos en formularios y Server Actions |
| Gráficos | Recharts | ^2.14.1 | Dashboard de métricas administrativo |
| Theming | next-themes | ^0.4.3 | Dark/Light mode con CSS variables |
| Testing unitario | Jest + ts-jest | ^29 | Suite de tests unitarios |
| Testing integración | Jest (DB real) | ^29 | Tests de integración con PostgreSQL |
| Testing E2E | Playwright | ^1.60.0 | Tests end-to-end (pendientes) |

---

## Estructura del Directorio

```
az-store/
├── app/
│   ├── (auth)/                   # Layout minimalista sin navbar de storefront
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/      # Solicitud de reset de contraseña
│   │   └── reset-password/       # Formulario para nueva contraseña (recibe ?token=)
│   ├── (cinematic)/              # Layout dark cinematográfico para homepage y PDP
│   │   ├── page.tsx              # Homepage principal
│   │   └── product/[slug]/       # Product Detail Page (PDP)
│   ├── (root)/                   # Storefront público (checkout flow)
│   │   ├── cart/
│   │   ├── order/[id]/           # Detalle de orden + carga de comprobante
│   │   ├── payment-method/
│   │   ├── place-order/
│   │   ├── search/
│   │   └── shipping-address/
│   ├── admin/                    # Panel ERP — requiere role 'admin'
│   │   ├── brands/               # ABM de Marcas
│   │   ├── categories/           # ABM de Categorías y Subcategorías
│   │   ├── colors/               # ABM de Colores del catálogo
│   │   ├── inventory/            # Control de stock por variante
│   │   ├── orders/               # Gestión y moderación de pedidos
│   │   ├── overview/             # Dashboard de métricas (Recharts)
│   │   ├── pos/                  # Punto de Venta para sellers
│   │   ├── products/             # ABM de Productos con variantes y precios
│   │   ├── promotions/
│   │   │   ├── banners/          # Gestión de banners promocionales
│   │   │   └── discount-codes/   # ABM de Códigos de descuento
│   │   ├── settings/             # Configuración bancaria y parámetros globales
│   │   └── users/                # Roles, comisiones y datos de usuarios
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Rutas internas de NextAuth
│   │   ├── cart-recovery/        # Endpoint para pre-cargar carrito desde email
│   │   ├── cron/
│   │   │   ├── detect-abandoned-carts/  # Cron: detecta carritos sin actividad > 1h
│   │   │   └── release-expired-orders/  # Cron: libera stock de órdenes vencidas
│   │   ├── send-email/           # Endpoint interno para despacho de emails
│   │   ├── uploadthing/          # Endpoints de subida de archivos
│   │   ├── validate-promo/       # Validación de código promocional en checkout
│   │   └── webhooks/
│   │       └── mercadopago/      # IPN Webhook de Mercado Pago (HMAC-SHA256)
│   ├── unauthorized/             # Página 403 custom
│   └── user/
│       ├── orders/               # Historial de pedidos del cliente
│       └── profile/              # Perfil y datos del cliente
├── assets/
│   └── styles/
│       └── globals.css           # CSS variables (design tokens az-), Dark/Light mode
├── auth.config.ts                # NextAuth config para Edge (callback session mínimo)
├── auth.ts                       # NextAuth config Node.js (providers, adapters)
├── components/
│   ├── admin/                    # Componentes exclusivos del panel admin
│   ├── shared/                   # Componentes compartidos (header, footer, product, etc.)
│   └── ui/                       # Componentes Shadcn UI (Button, Dialog, etc.)
├── db/
│   ├── prisma.ts                 # Cliente Prisma singleton con hot-reload guard y adapter Neon
│   ├── sample-data.ts            # Datos de prueba para seed
│   └── seed.ts                   # Script de siembra de base de datos
├── email/                        # Templates de React Email
├── hooks/                        # Custom React hooks
├── lib/
│   ├── actions/                  # Server Actions (capa principal de backend)
│   │   ├── auth.actions.ts       # Password reset (requestPasswordReset, resetPassword)
│   │   ├── brand.actions.ts      # CRUD de marcas + reassignment a sentinel
│   │   ├── cart.actions.ts       # Carrito (add, remove, update, merge)
│   │   ├── category.actions.ts   # CRUD de categorías + reassignment a sentinel
│   │   ├── color.actions.ts      # CRUD de colores
│   │   ├── email.actions.ts      # Despacho de emails transaccionales
│   │   ├── order.actions.ts      # Órdenes, POS, aprobación/rechazo transferencias
│   │   ├── product.actions.ts    # Consultas de catálogo con precios duales
│   │   ├── promo.actions.ts      # CRUD de códigos promocionales
│   │   ├── settings.actions.ts   # Lectura/escritura de configuración dinámica (Setting)
│   │   └── user.actions.ts       # Usuarios, clientes POS, comisiones
│   ├── constants/                # Constantes globales
│   ├── data/                     # Funciones de lectura de datos (sin mutaciones)
│   ├── mercadopago.ts            # Configuración e instanciación del SDK de MP
│   └── validators.ts             # Esquemas Zod compartidos
├── middleware.ts                 # NextAuth middleware (auth + role check para /admin/*)
├── prisma/
│   ├── schema.prisma             # Modelo de datos (ver sección Base de Datos)
│   └── migrations/               # Historial de migraciones SQL versionado
├── scripts/                      # Scripts utilitarios
├── tests/
│   └── e2e/                      # Tests Playwright (pendientes de implementación)
├── types/                        # Tipos TypeScript compartidos
├── utils/                        # Funciones utilitarias
└── __tests__/                    # Tests Jest (unitarios e integración)
    ├── actions/
    ├── cron/
    ├── factories/
    ├── integration/
    ├── middleware/
    └── webhooks/
```

---

## Base de Datos

### Motor y ORM

PostgreSQL gestionado con **Prisma ORM 6.5.0**. En producción usa Neon Serverless con el adaptador `@prisma/adapter-neon` (HTTP pooling). El adaptador se activa automáticamente cuando `DATABASE_URL` contiene `neon.tech`.

### Nota sobre Enums

El schema usa **un único enum de Prisma**:

```prisma
enum PaymentMethod {
  CASH       // Efectivo, transferencia bancaria, POS
  MERCADOPAGO
}
```

Este enum se usa en `Price.paymentMethod` y `OrderItem.paymentMethod`. El resto de campos de estado (`Order.shippingStatus`, `User.role`, `Order.paymentMethod`) son `String` plano por convención.

### Schema Completo

```prisma
model Category {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String
  slug          String        @unique
  createdAt     DateTime      @default(now()) @db.Timestamp(6)
  subCategories SubCategory[]
  sizes         Size[]
  products      Product[]
}

model SubCategory {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String
  slug       String    @unique
  categoryId String    @db.Uuid
  createdAt  DateTime  @default(now()) @db.Timestamp(6)
  category   Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  products   Product[]
}

model Size {
  id         String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String
  categoryId String           @db.Uuid
  category   Category         @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  variants   ProductVariant[]
}

model Brand {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  slug      String    @unique
  createdAt DateTime  @default(now()) @db.Timestamp(6)
  products  Product[]
}

model Color {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String         @unique
  hex           String
  createdAt     DateTime       @default(now()) @db.Timestamp(6)
  productColors ProductColor[]
}

model Product {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String
  slug            String           @unique(map: "product_slug_idx")
  categoryId      String           @db.Uuid
  category        Category         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  subCategoryId   String?          @db.Uuid
  subCategory     SubCategory?     @relation(fields: [subCategoryId], references: [id], onDelete: SetNull)
  images          String[]
  brandId         String           @db.Uuid
  brand           Brand            @relation(fields: [brandId], references: [id], onDelete: Restrict)
  sellerId        String?          @db.Uuid
  seller          User?            @relation(fields: [sellerId], references: [id], onDelete: SetNull)
  description     String
  rating          Decimal          @default(0) @db.Decimal(3, 2)   -- INACTIVO: no se sincroniza con Review
  numReviews      Int              @default(0)                      -- INACTIVO: no se sincroniza con Review
  isFeatured      Boolean          @default(false)
  banner          String?
  hasColorVariants Boolean         @default(false)
  createdAt       DateTime         @default(now()) @db.Timestamp(6)
  OrderItem       OrderItem[]
  Review          Review[]
  variants        ProductVariant[]
  colors          ProductColor[]
  prices          Price[]
  promoBanners    PromoBanner[]
}

-- Sistema de precios dual: cada producto tiene un precio para CASH y otro para MERCADOPAGO
model Price {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId     String        @db.Uuid
  paymentMethod PaymentMethod -- enum: CASH | MERCADOPAGO
  value         Decimal       @db.Decimal(12, 2)
  createdAt     DateTime      @default(now()) @db.Timestamp(6)
  product       Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([productId, paymentMethod])
}

model ProductColor {
  id        String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId String           @db.Uuid
  colorId   String           @db.Uuid
  images    String[]         @default([])
  order     Int              @default(0)
  createdAt DateTime         @default(now()) @db.Timestamp(6)
  product   Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  color     Color            @relation(fields: [colorId], references: [id], onDelete: Restrict)
  variants  ProductVariant[]
  @@unique([productId, colorId], map: "productcolor_product_color_idx")
}

-- Variante puede ser: solo talle, solo color, o talle+color (sizeId y colorId son opcionales)
model ProductVariant {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId    String        @db.Uuid
  sizeId       String?       @db.Uuid
  colorId      String?       @db.Uuid
  stock        Int           @default(0)
  product      Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  size         Size?         @relation(fields: [sizeId], references: [id], onDelete: Restrict)
  productColor ProductColor? @relation(fields: [colorId], references: [id], onDelete: Restrict)
  @@unique([productId, sizeId, colorId], map: "productvariant_product_size_color_idx")
}

model User {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String           @default("NO_NAME")
  email          String           @unique(map: "user_email_idx")
  emailVerified  DateTime?        @db.Timestamp(6)
  image          String?
  password       String?
  role           String           @default("user")   -- string: 'user' | 'admin' | 'seller'
  address        Json?            @db.Json
  paymentMethod  String?
  dni            String?          @unique(map: "user_dni_idx")
  phone          String?
  commissionRate Float?           -- porcentaje de comisión del seller (ej: 0.10 = 10%)
  createdAt      DateTime         @default(now()) @db.Timestamp(6)
  updatedAt      DateTime         @updatedAt
  account        Account[]
  session        Session[]
  Cart           Cart[]
  Order          Order[]
  Review         Review[]
  products       Product[]        -- productos donde el user es seller
  PromoCodeUsage PromoCodeUsage[]
}

model Account {
  userId            String   @db.Uuid
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  createdAt         DateTime @default(now()) @db.Timestamp(6)
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @id
  userId       String   @db.Uuid
  expires      DateTime @db.Timestamp(6)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now()) @db.Timestamp(6)
  updatedAt    DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime
  @@id([identifier, token])
}

model PasswordResetToken {
  token     String   @id @unique
  email     String
  expiresAt DateTime @db.Timestamp(6)
  createdAt DateTime @default(now()) @db.Timestamp(6)
}

model Cart {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String?  @db.Uuid
  sessionCartId String
  items         Json[]   @default([]) @db.Json   -- array de CartItem sin FK a Product
  itemsPrice    Decimal  @db.Decimal(12, 2)
  totalPrice    Decimal  @db.Decimal(12, 2)
  shippingPrice Decimal  @db.Decimal(12, 2)
  taxPrice      Decimal  @db.Decimal(12, 2)
  createdAt     DateTime @default(now()) @db.Timestamp(6)
  updatedAt     DateTime @updatedAt               -- usado por detect-abandoned-carts cron
  user          User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model CartRecovery {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cartId      String    @db.Uuid
  email       String
  token       String    @unique
  sentAt      DateTime  @default(now()) @db.Timestamp(6)
  recoveredAt DateTime? @db.Timestamp(6)
  createdAt   DateTime  @default(now()) @db.Timestamp(6)
}

model PromoBanner {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  image           String
  title           String
  subtitle        String?
  linkLabel       String?
  discountPercent Float?
  order           Int       @default(0)
  isActive        Boolean   @default(true)
  startsAt        DateTime? @db.Timestamp(6)
  endsAt          DateTime? @db.Timestamp(6)
  createdAt       DateTime  @default(now()) @db.Timestamp(6)
  products        Product[]
}

model Order {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String      @db.Uuid
  shippingAddress  Json        @db.Json
  paymentMethod    String      -- string: 'MercadoPago' | 'TransferenciaBancaria' | 'PuntoDeVenta_*'
  paymentResult    Json?       @db.Json
  itemsPrice       Decimal     @db.Decimal(12, 2)
  shippingPrice    Decimal     @db.Decimal(12, 2)
  taxPrice         Decimal     @db.Decimal(12, 2)
  totalPrice       Decimal     @db.Decimal(12, 2)
  promoCode        String?     -- snapshot del código aplicado
  discountPrice    Decimal?    @db.Decimal(12, 2)
  bannerId         String?     @db.Uuid
  bannerDiscount   Decimal?    @db.Decimal(12, 2)
  isPaid           Boolean     @default(false)
  paidAt           DateTime?   @db.Timestamp(6)
  isDelivered      Boolean     @default(false)
  deliveredAt      DateTime?   @db.Timestamp(6)
  shippingStatus   String?     @default("Pendiente")  -- 'Pendiente'|'Enviado'|'Entregado'|'Cancelado'
  shippingNotes    String?
  createdAt        DateTime    @default(now()) @db.Timestamp(6)
  receiptUrl       String?     -- URL del comprobante subido (Uploadthing)
  mpPaymentId      String?     @unique   -- ID de pago de MP; @unique previene replay
  expiresAt        DateTime?   @db.Timestamp(6)
  sellerId         String?     @db.Uuid
  commissionAmount Decimal?    @db.Decimal(12, 2)
  user             User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderitems       OrderItem[]
}

model OrderItem {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId        String        @db.Uuid
  productId      String        @db.Uuid
  size           String?       -- snapshot del nombre del talle (no FK; preserva historial)
  qty            Int
  priceUsed      Decimal       @db.Decimal(12, 2)  -- precio efectivamente cobrado
  paymentMethod  PaymentMethod -- enum CASH | MERCADOPAGO (audit trail del precio usado)
  name           String
  slug           String
  image          String
  productColorId String?       -- snapshot del color elegido
  colorName      String?       -- snapshot del nombre del color
  colorHex       String?       -- snapshot del hex del color
  order          Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product        Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([orderId, productId, size, productColorId], map: "orderitems_order_product_size_idx")
}

model Review {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String   @db.Uuid
  productId          String   @db.Uuid
  rating             Int
  title              String
  description        String
  isVerifiedPurchase Boolean  @default(true)  -- INACTIVO: default true sin validación real
  createdAt          DateTime @default(now()) @db.Timestamp(6)
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Setting {
  key   String @id
  value String
}

model PromoCode {
  id                           String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code                         String           @unique
  description                  String?
  discountPercentMercadoPago   Decimal?         @db.Decimal(5, 2)
  discountPercentTransferencia Decimal?         @db.Decimal(5, 2)
  isActive                     Boolean          @default(true)
  startsAt                     DateTime?        @db.Timestamp(6)
  endsAt                       DateTime?        @db.Timestamp(6)
  maxUsesPerUser               Int?
  createdAt                    DateTime         @default(now()) @db.Timestamp(6)
  updatedAt                    DateTime         @updatedAt
  usageHistory                 PromoCodeUsage[]
}

model PromoCodeUsage {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  promoCodeId String    @db.Uuid
  userId      String    @db.Uuid
  orderId     String    @db.Uuid
  usedAt      DateTime  @default(now()) @db.Timestamp(6)
  promoCode   PromoCode @relation(fields: [promoCodeId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Políticas de Cascade Delete (estado actual)

| Relación | Política | Nota |
|---|---|---|
| Brand → Product | `Restrict` | Requiere reassignment manual antes de eliminar |
| Category → SubCategory | `Cascade` | Eliminar categoría borra sus subcategorías |
| Category → Size | `Cascade` | Eliminar categoría borra sus talles |
| Category → Product | `Restrict` | Requiere reassignment manual antes de eliminar |
| SubCategory → Product | `SetNull` | El producto queda sin subcategoría |
| Product → ProductVariant | `Cascade` | Se borran todas las variantes |
| Product → OrderItem | `Cascade` | ⚠ Destruye historial de ventas |
| Product → Price | `Cascade` | Se borran los precios |
| Product → ProductColor | `Cascade` | Se borran los colores del producto |
| Color → ProductColor | `Restrict` | No se puede borrar un color en uso |
| Size → ProductVariant | `Restrict` | No se puede borrar un talle en uso |
| User → Cart | `Cascade` | |
| User → Order | `Cascade` | ⚠ Destruye historial de compras si se borra el user |

### Campos Inactivos

- `Product.rating` y `Product.numReviews`: no se sincronizan con los datos reales de `Review`. Ocultos en storefront.
- `Review.isVerifiedPurchase`: valor fijo `true`, sin validación real de compra.

---

## Sistema de Precios Dual

El modelo de precios soporta dos valores por producto según el método de pago:

| PaymentMethod | Cuándo aplica |
|---|---|
| `CASH` | Transferencia bancaria online, todos los métodos POS (efectivo, QR, transferencia, MP físico) |
| `MERCADOPAGO` | Checkout Pro de Mercado Pago online |

El precio que ve el cliente depende del método de pago seleccionado. `OrderItem.priceUsed` + `OrderItem.paymentMethod` forman el audit trail del precio efectivamente cobrado.

---

## Sistema de Variantes

`ProductVariant` soporta tres combinaciones:

| Variante | sizeId | colorId |
|---|---|---|
| Solo talle | UUID | null |
| Solo color | null | UUID |
| Talle + Color | UUID | UUID |

`Product.hasColorVariants` indica si el producto tiene variantes de color activas. `ProductColor` vincula un producto a un color y tiene sus propias imágenes (la galería del producto cambia al seleccionar color).

---

## Grupos de Rutas (Route Groups)

### `(cinematic)/`
Homepage y PDP. Layout con tema oscuro y estética cinematográfica. Separado de `(root)/` para aplicar tratamiento visual diferente.

### `(root)/`
Flujo de compra online: carrito → dirección → método de pago → confirmación → detalle de orden. Layout de storefront estándar.

### `(auth)/`
Sign-in, sign-up, forgot-password, reset-password. Layout minimalista sin navbar de storefront.

### `admin/`
Panel ERP completo. El middleware bloquea acceso a usuarios sin `role === 'admin'`. El rol `seller` tiene acceso solo al POS mediante Server Action guard.

### `user/`
Historial de pedidos y perfil del cliente autenticado.

---

## Middleware y Autorización

### `middleware.ts`

Delega en `auth` exportada desde `auth.config.ts`. Protege las siguientes rutas:

```
/shipping-address, /payment-method, /place-order, /profile
/user/(.*)
/order/(.*)
/admin
```

**Role check en `/admin/*`:** Un usuario con `role !== 'admin'` es redirigido a `/unauthorized`. Sin sesión → redirige a `/sign-in`.

**Detalle NextAuth v5 split config:** Se agregó un callback `session` mínimo en `auth.config.ts` para exponer `token.role → session.user.role` al contexto de Edge middleware. Sin este callback, `session.user.role` es `undefined` en el middleware.

### Autorización en Server Actions

Dos guards con patrón redirect-based:

| Guard | Acciones protegidas |
|---|---|
| `requireAdmin()` | `deleteOrder`, operaciones destructivas |
| `requireAdminOrSeller()` | `createPosOrder`, `deliverOrder`, `approveBankTransfer`, `rejectBankTransfer`, `updateShippingStatus` |

Ambos guards redirigen a `/unauthorized` en lugar de lanzar excepciones.

---

## Singleton de Prisma (`db/prisma.ts`)

Implementa el patrón `globalForPrisma` para evitar agotamiento de conexiones en desarrollo por hot-reload:

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient(...)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

El adaptador Neon se activa automáticamente cuando `DATABASE_URL` contiene `neon.tech`.

---

## Server Actions (capa principal de backend)

Las Server Actions son el mecanismo principal de comunicación frontend-backend. No requieren endpoints REST para la interfaz web. Los Route Handlers se reservan para:
- Integraciones y webhooks externos (Mercado Pago)
- Tareas cron desatendidas
- Endpoints de upload (Uploadthing)
- APIs que necesitan ser llamadas desde fuera (validate-promo, cart-recovery)

### Módulo de Órdenes y POS (`lib/actions/order.actions.ts`)

| Función | Rol | Guard | Descripción |
|---|---|---|---|
| `createOrder()` | user | auth | Crea orden desde carrito. Si TB: descuenta stock + expiresAt 24h. Si MP: no toca stock. |
| `createPosOrder(data)` | admin/seller | requireAdminOrSeller | Transacción atómica: crea orden pagada+entregada, descuenta stock con pre-check. |
| `createMercadoPagoOrder(orderId)` | user | auth | Genera preferencia de pago en MP → URL de Checkout Pro. |
| `updateOrderToPaid(params)` | interno | — | Marca orden como pagada. Para no-TB: guard atómico de stock con `$executeRaw`. Doble barrera idempotencia: mpPaymentId + isPaid. |
| `approveBankTransfer(orderId)` | admin/seller | requireAdminOrSeller | Aprueba transferencia manual (stock ya descontado, solo actualiza isPaid). |
| `rejectBankTransfer(orderId)` | admin/seller | requireAdminOrSeller | Rechaza transferencia y reintegra stock reservado. |
| `deliverOrder(orderId)` | admin/seller | requireAdminOrSeller | Marca orden como entregada. |
| `deleteOrder(orderId)` | admin | requireAdmin | Elimina orden permanentemente. |

---

## Route Handlers (API Endpoints)

### POST /api/webhooks/mercadopago

Recibe notificaciones IPN asíncronas de Mercado Pago.

**Seguridad:**
- Verifica firma `X-Signature` (HMAC-SHA256 + `timingSafeEqual`) antes de procesar.
- `MERCADOPAGO_WEBHOOK_SECRET` obligatorio — retorna 500 si no está definido.
- Si firma inválida → 401.

**Idempotencia (doble barrera):**
1. Verifica que `mpPaymentId` no exista en otra orden antes de escribir.
2. Verifica `order.isPaid` como segunda barrera.
3. Constraint `@unique` en DB como última defensa.

**Soporta dos formatos:**
- Webhook: `dataId` de `body.data.id`
- IPN: `dataId` de query param `?id=`

**Emails:** `sendPurchaseReceipt` y `sendNewSaleNotification` se llaman **después** de `prisma.$transaction` (fire-and-forget).

### POST /api/cron/release-expired-orders

Libera stock de órdenes expiradas. Autenticado con `Authorization: Bearer <CRON_SECRET>`.

Cancela:
- Órdenes `TransferenciaBancaria` con `isPaid: false` y `expiresAt < now()`
- Órdenes `MercadoPago` con `isPaid: false` y `expiresAt < now()`

Restaura stock solo en transferencias (MP no reserva stock).

**Problema conocido:** Restauración de stock para TransferenciaBancaria busca variante por `size: { name: item.size }`. Si el talle fue renombrado después de la compra, el lookup falla silenciosamente.

### POST /api/cron/detect-abandoned-carts

Detecta carritos con items y sin actividad > 1 hora. Genera token en `CartRecovery` y envía email de recuperación con link `/cart/recover?token=XXX`.

### POST /api/validate-promo

Valida un código promocional antes de aplicarlo en checkout. Retorna los porcentajes de descuento por método de pago.

### POST /api/cart-recovery

Pre-carga el carrito desde el token recibido en el email de recuperación.

---

## Flujos de Stock

| Flujo | Momento del decremento | Guard de stock | Race condition |
|---|---|---|---|
| Mercado Pago | Al recibir webhook aprobado | `$executeRaw WHERE stock >= qty` | No (guard atómico) |
| Transferencia | Al crear orden | No guard (reserva anticipada) | No aplica |
| POS | Al confirmar venta | `throw` dentro de `$transaction` | No |

---

## Testing

### Tests Unitarios (Jest)

```
jest
```

### Tests de Integración (Jest + DB real)

Requiere base de datos `az_store_test` local.

```
jest --config jest.integration.config.ts
```

Cobertura:
- Webhook MP: firma válida/inválida, idempotencia, stock atómico
- `createPosOrder`: flujo completo, rollback por stock insuficiente, Consumidor Final
- Transferencia bancaria: crear, aprobar, rechazar, cron expiry
- Cron: libera expiradas, restaura stock, no toca activas ni pagadas
- Autorización: admin/seller/user/anon — 8 casos por rol
- Cart merge en login

### Tests E2E (Playwright)

Pendiente de implementación.

---

## Deuda Técnica Activa

| Item | Impacto | Descripción |
|---|---|---|
| Restauración de stock por nombre de talle | Bajo | `cron` falla silenciosamente si el talle fue renombrado. Solución: agregar `productVariantId` a `OrderItem`. |
| `Cart.items` como `Json[]` | Medio | Sin FK a `Product`. Datos huérfanos si se borra un producto. Migración a tabla `CartItem` con FK pendiente. |
| `Product.rating` / `numReviews` inactivos | Bajo | No se sincronizan. Ocultos en UI pero presentes en schema. |
| `Review.isVerifiedPurchase` inactivo | Bajo | Siempre `true`. Sin validación de compra real. |
| Audit Logging | Medio | No hay registro de acciones sensibles (aprobaciones, rechazos, eliminaciones). |
| Sanitización de logs | Medio | Logs pueden exponer tokens y datos bancarios en producción. |
| Índices de DB faltantes | Medio | Faltan índices en `orders(is_paid, is_delivered)`, `orders(created_at DESC)`, `products(category_id)`, etc. |
| Credenciales en historial git | Alto | `docs/06-ENV.md` tuvo credenciales reales. Pendiente: rotar credenciales y agregar `docs/` a `.gitignore`. |

---

## Variables de Entorno Requeridas

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | PostgreSQL connection string |
| `AUTH_SECRET` | Sí | Clave de firma de NextAuth (32 bytes) |
| `NEXTAUTH_URL` | Sí | URL base de la aplicación |
| `UPLOADTHING_TOKEN` | Sí | Token de Uploadthing |
| `RESEND_API_KEY` | Sí | API Key de Resend |
| `SENDER_EMAIL` | Sí | Email remitente |
| `MERCADOPAGO_ACCESS_TOKEN` | Sí | Access Token de MP |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Sí | Public Key de MP (expuesta al cliente) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Sí | Secreto HMAC para verificar webhooks de MP |
| `CRON_SECRET` | Sí | Secret para autenticar los endpoints de cron |
| `UPSTASH_REDIS_REST_URL` | Sí | URL de Upstash Redis (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token de Upstash Redis |
| `NEXT_PUBLIC_APP_NAME` | No | Nombre de la tienda |
| `NEXT_PUBLIC_SERVER_URL` | No | URL base pública |
| `PAGE_SIZE` | No | Productos por página (default: 12) |
| `ORDER_EXPIRATION_HOURS` | No | Horas de expiración de Transferencia (default: 24) |
| `FREE_SHIPPING_THRESHOLD` | No | Mínimo para envío gratis (default desde Setting) |
| `SHIPPING_PRICE` | No | Costo de envío (default desde Setting) |
