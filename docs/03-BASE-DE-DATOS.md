# 03 — Base de Datos: Schema y Normalización Relacional

El proyecto utiliza **PostgreSQL** (Neon en producción, Local en desarrollo) gestionado mediante **Prisma ORM**. Para soportar la complejidad de un catálogo real con talles, subcategorías y ventas presenciales, el esquema de base de datos fue normalizado a **Tercera Forma Normal (3NF)**.

---

## Normalización de la Base de Datos

### 1. Desacoplamiento de Taxonomías (Marcas y Categorías)
* **Antes:** En el esquema original (`prostore` base), los campos `category` y `brand` en el modelo `Product` eran strings planos (`String`). Esto provocaba inconsistencia de datos, redundancia de texto y dificultades para armar filtros fiables.
* **Ahora (Normalización):** 
  * Se crearon los modelos `Brand`, `Category` y `SubCategory` con claves primarias independientes (`Uuid`) y slugs únicos indexados.
  * El modelo `Product` se conecta con claves foráneas (`brandId`, `categoryId`, `subCategoryId`) que garantizan la integridad referencial.

### 2. Normalización de Variantes y Stock (Talles)
* **Antes:** `Product` tenía un único campo `stock` y no soportaba talles. Poner talles como strings en el carrito rompía la consistencia del inventario real.
* **Ahora (Normalización - 3NF):**
  * **Talles:** Se creó la tabla `Size` vinculada a una categoría (los talles de calzado son distintos a los de ropa).
  * **Variantes de Inventario:** Se creó la tabla pivot `ProductVariant` que asocia `productId` con `sizeId` y almacena el `stock` específico de esa combinación. El stock de una variante depende directamente de la tupla (Producto, Talle), eliminando la dependencia transitiva sobre el Producto.
  * **Unicidad:** Se configuró un índice compuesto `@unique([productId, sizeId])` para evitar registros duplicados de stock.

### 3. Normalización en Compras (OrderItem)
* **Antes:** La clave primaria de `OrderItem` era un índice compuesto `@@id([orderId, productId])`.
* **Ahora:** Al permitir que un cliente compre el mismo producto en distintos talles (por ejemplo, una Remera Polo en talle M y otra en L), la clave compuesta anterior colisionaría. Se reestructuró la tabla agregando un ID autogenerado único (`id String @id`) como surrogate primary key, y definiendo una clave compuesta de negocio `@@unique([orderId, productId, size])` para registrar ítems diferenciados sin violar restricciones.

### 4. Datos del Consumidor (DNI y Teléfono)
* Para cumplir con las normativas comerciales de facturación de Argentina y facilitar la búsqueda rápida en el POS físico, se agregaron las columnas `dni` y `phone` al modelo `User`. El DNI cuenta con un índice único `user_dni_idx` para evitar duplicaciones de clientes en la base de datos.

---

## Schema de Prisma Completo (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  slug           String        @unique
  createdAt      DateTime      @default(now()) @db.Timestamp(6)
  subCategories  SubCategory[]
  sizes          Size[]
  products       Product[]
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

model Product {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String
  slug            String           @unique(map: "product_slug_idx")
  categoryId      String           @db.Uuid
  category        Category         @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  subCategoryId   String?          @db.Uuid
  subCategory     SubCategory?     @relation(fields: [subCategoryId], references: [id], onDelete: SetNull)
  images          String[]
  brandId         String           @db.Uuid
  brand           Brand            @relation(fields: [brandId], references: [id], onDelete: Cascade)
  description     String
  price           Decimal          @default(0) @db.Decimal(12, 2)
  rating          Decimal          @default(0) @db.Decimal(3, 2)
  numReviews      Int              @default(0)
  isFeatured      Boolean          @default(false)
  banner          String?
  createdAt       DateTime         @default(now()) @db.Timestamp(6)
  OrderItem       OrderItem[]
  Review          Review[]
  variants        ProductVariant[]
}

model ProductVariant {
  id        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId String @db.Uuid
  sizeId    String @db.Uuid
  stock     Int    @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  size    Size    @relation(fields: [sizeId], references: [id], onDelete: Cascade)

  @@unique([productId, sizeId], map: "product_size_unique_idx")
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
  dni           String?   @unique(map: "user_dni_idx")
  phone         String?
  createdAt     DateTime  @default(now()) @db.Timestamp(6)
  updatedAt     DateTime  @updatedAt
  account       Account[]
  session       Session[]
  Cart          Cart[]
  Order         Order[]
  Review        Review[]
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

  createdAt DateTime @default(now()) @db.Timestamp(6)
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @id
  userId       String   @db.Uuid
  expires      DateTime @db.Timestamp(6)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @db.Timestamp(6)
  updatedAt DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
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
  shippingStatus  String?     @default("Pendiente")
  shippingNotes   String?
  createdAt       DateTime    @default(now()) @db.Timestamp(6)
  receiptUrl      String?
  expiresAt       DateTime?   @db.Timestamp(6)
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderitems      OrderItem[]
}

model OrderItem {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId   String  @db.Uuid
  productId String  @db.Uuid
  size      String?
  qty       Int
  price     Decimal @db.Decimal(12, 2)
  name      String
  slug      String
  image     String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([orderId, productId, size], map: "orderitems_order_product_size_idx")
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
```

---

## Relaciones del Esquema

```
     Category ── SubCategory 
        │
      Size ── ProductVariant ── Product ── Brand
                 │
              OrderItem ── Order ── User ── Account / Session
                                     │
                                    Cart
```
