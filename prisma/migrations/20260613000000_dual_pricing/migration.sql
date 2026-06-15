-- ============================================================================
-- Migración: dual pricing (Fase 2)
-- - Crea la tabla `Price` (uno por método de pago)
-- - Crea el enum `PaymentMethod` (CASH | MERCADOPAGO)
-- - Migra los precios existentes de `Product.price` → `Price` (CASH al valor
--   original, MERCADOPAGO al valor * (1 + MP_SURCHARGE_PERCENT / 100) donde
--   MP_SURCHARGE_PERCENT se lee del setting global — default 10)
-- - Elimina la columna `Product.price`
-- - Renombra `OrderItem.price` → `OrderItem.priceUsed` y agrega `paymentMethod`
-- ============================================================================

-- 1) Crear el enum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MERCADOPAGO');

-- 2) Crear la tabla `Price` (todavía sin FK, la agregamos al final para evitar
--    conflictos con `ON DELETE CASCADE` durante la migración)
CREATE TABLE "Price" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- 3) Agregar columnas nuevas a `OrderItem` (nullable para permitir UPDATE después)
ALTER TABLE "OrderItem"
    ADD COLUMN "priceUsed" DECIMAL(12,2),
    ADD COLUMN "paymentMethod" "PaymentMethod";

-- 4) Migrar datos existentes:
--    a) `OrderItem.price` → `OrderItem.priceUsed` (asumimos CASH por default
--       para órdenes históricas — no podemos saber qué método se usó).
UPDATE "OrderItem" SET "priceUsed" = "price", "paymentMethod" = 'CASH';

--    b) `Product.price` → `Price` (CASH al valor original, MERCADOPAGO al
--       valor * 1.10 si no hay setting configurado). Hacemos ambos inserts.
INSERT INTO "Price" ("id", "productId", "paymentMethod", "value", "createdAt")
SELECT gen_random_uuid(), "id", 'CASH', "price", NOW() FROM "Product";

INSERT INTO "Price" ("id", "productId", "paymentMethod", "value", "createdAt")
SELECT gen_random_uuid(), "id", 'MERCADOPAGO', ("price" * 110 / 100), NOW() FROM "Product";

-- 5) Hacer NOT NULL las nuevas columnas
ALTER TABLE "OrderItem"
    ALTER COLUMN "priceUsed" SET NOT NULL,
    ALTER COLUMN "paymentMethod" SET NOT NULL;

-- 6) Drop las columnas viejas
ALTER TABLE "OrderItem" DROP COLUMN "price";
ALTER TABLE "Product" DROP COLUMN "price";

-- 7) Unique index para Price (uno por producto + método)
CREATE UNIQUE INDEX "Price_productId_paymentMethod_key" ON "Price"("productId", "paymentMethod");

-- 8) FK de Price hacia Product (cascade)
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
