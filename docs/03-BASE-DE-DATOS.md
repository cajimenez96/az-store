# 03 — Base de Datos: Schema de Prisma

## Schema Actual (prostore base)

> Archivo: `prisma/schema.prisma`

El proyecto ya usa **PostgreSQL** de fábrica. No se requiere migración de motor.

### Modelos existentes y su estado

| Modelo | Estado | Observaciones |
|---|---|---|
| `Product` | ✅ Sin cambios | Ya tiene campo `stock: Int` |
| `User` | ✅ Sin cambios | Roles `admin`/`user` ya configurados |
| `Order` | 🔧 Modificar | Agregar `receiptUrl` y `expiresAt` |
| `OrderItem` | ✅ Sin cambios | Relación con Product y Order |
| `Cart` | ✅ Sin cambios | Items como JSON array |
| `Review` | ✅ Sin cambios | Ratings de productos |
| `Account` / `Session` | ✅ Sin cambios | Parte del adaptador NextAuth |

---

## Cambios Requeridos en `Order`

Agregar estos dos campos al modelo `Order`:

```prisma
model Order {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String      @db.Uuid
  shippingAddress Json        @db.Json
  paymentMethod   String
  paymentResult   Json?       @db.Json
  itemsPrice      Decimal     @db.Decimal(12, 2)
  shippingPrice   Decimal     @db.Decimal(12, 2)
  taxPrice        Decimal     @db.Decimal(12, 2)
  totalPrice      Decimal     @db.Decimal(12, 2)
  isPaid          Boolean     @default(false)
  paidAt          DateTime?   @db.Timestamp(6)
  isDelivered     Boolean     @default(false)
  deliveredAt     DateTime?   @db.Timestamp(6)
  createdAt       DateTime    @default(now()) @db.Timestamp(6)

  // 🆕 Campos nuevos para Transferencia Bancaria
  receiptUrl      String?     // URL del comprobante subido por el cliente a Uploadthing
  expiresAt       DateTime?   @db.Timestamp(6) // Fecha límite para aprobar (createdAt + 24hs)

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderitems      OrderItem[]
}
```

### Comando para aplicar los cambios

```bash
# Crear y aplicar la migración
npx prisma migrate dev --name "add-receipt-url-and-expires-at-to-order"

# Verificar en Prisma Studio
npx prisma studio
```

---

## Schema Completo Resultante

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  slug        String      @unique(map: "product_slug_idx")
  category    String
  images      String[]
  brand       String
  description String
  stock       Int
  price       Decimal     @default(0) @db.Decimal(12, 2)
  rating      Decimal     @default(0) @db.Decimal(3, 2)
  numReviews  Int         @default(0)
  isFeatured  Boolean     @default(false)
  banner      String?
  createdAt   DateTime    @default(now()) @db.Timestamp(6)
  OrderItem   OrderItem[]
  Review      Review[]
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String    @default("NO_NAME")
  email         String    @unique(map: "user_email_idx")
  emailVerified DateTime? @db.Timestamp(6)
  image         String?
  password      String?
  role          String    @default("user")
  address       Json?     @db.Json
  paymentMethod String?
  createdAt     DateTime  @default(now()) @db.Timestamp(6)
  updatedAt     DateTime  @updatedAt
  account       Account[]
  session       Session[]
  Cart          Cart[]
  Order         Order[]
  Review        Review[]
}

model Order {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String      @db.Uuid
  shippingAddress Json        @db.Json
  paymentMethod   String
  paymentResult   Json?       @db.Json
  itemsPrice      Decimal     @db.Decimal(12, 2)
  shippingPrice   Decimal     @db.Decimal(12, 2)
  taxPrice        Decimal     @db.Decimal(12, 2)
  totalPrice      Decimal     @db.Decimal(12, 2)
  isPaid          Boolean     @default(false)
  paidAt          DateTime?   @db.Timestamp(6)
  isDelivered     Boolean     @default(false)
  deliveredAt     DateTime?   @db.Timestamp(6)
  createdAt       DateTime    @default(now()) @db.Timestamp(6)
  receiptUrl      String?
  expiresAt       DateTime?   @db.Timestamp(6)
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderitems      OrderItem[]
}

model OrderItem {
  orderId   String  @db.Uuid
  productId String  @db.Uuid
  qty       Int
  price     Decimal @db.Decimal(12, 2)
  name      String
  slug      String
  image     String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([orderId, productId], map: "orderitems_orderId_productId_pk")
}

model Cart {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String?  @db.Uuid
  sessionCartId String
  items         Json[]   @default([]) @db.Json
  itemsPrice    Decimal  @db.Decimal(12, 2)
  totalPrice    Decimal  @db.Decimal(12, 2)
  shippingPrice Decimal  @db.Decimal(12, 2)
  taxPrice      Decimal  @db.Decimal(12, 2)
  createdAt     DateTime @default(now()) @db.Timestamp(6)
  user          User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Review {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String   @db.Uuid
  productId          String   @db.Uuid
  rating             Int
  title              String
  description        String
  isVerifiedPurchase Boolean  @default(true)
  createdAt          DateTime @default(now()) @db.Timestamp(6)
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  userId            String  @db.Uuid
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
```

---

## Relaciones Clave

```
User ──┬── Order ── OrderItem ── Product
       ├── Cart
       ├── Review ─────────────── Product
       └── Account / Session  (NextAuth)
```

---

## Seed de Datos de Prueba

```bash
npx tsx ./db/seed
```

El archivo `db/sample-data.ts` contiene productos de ejemplo. Modificarlo con
productos reales antes del lanzamiento.
