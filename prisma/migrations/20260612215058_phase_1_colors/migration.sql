-- ============================================================================
-- Phase 1 — Colores y variantes
-- ============================================================================
-- Cambios:
--   1. Crear tabla `Color` (paleta global: name + hex)
--   2. Crear tabla pivot `ProductColor` (producto ↔ color con imágenes)
--   3. Agregar `Product.hasColorVariants` (opt-in)
--   4. Agregar `ProductColor.colorId` con FK a `Color` (RESTRICT)
--   5. Hacer opcional `ProductVariant.sizeId` (NULL = "sin talle")
--   6. Agregar `ProductVariant.colorId` (NULL = "sin color", FK a ProductColor)
--   7. Migrar la unique constraint de `ProductVariant` a (productId, sizeId, colorId)
-- ============================================================================

-- 1) Tabla Color -------------------------------------------------------------
CREATE TABLE "Color" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

-- 2) Tabla ProductColor ------------------------------------------------------
CREATE TABLE "ProductColor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "colorId" UUID NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("id")
);

-- 3) Product.hasColorVariants -----------------------------------------------
ALTER TABLE "Product" ADD COLUMN "hasColorVariants" BOOLEAN NOT NULL DEFAULT false;

-- 4) FKs de ProductColor ----------------------------------------------------
CREATE UNIQUE INDEX "productcolor_product_color_idx"
    ON "ProductColor"("productId", "colorId");

ALTER TABLE "ProductColor"
    ADD CONSTRAINT "ProductColor_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductColor"
    ADD CONSTRAINT "ProductColor_colorId_fkey"
    FOREIGN KEY ("colorId") REFERENCES "Color"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) ProductVariant.sizeId opcional -----------------------------------------
ALTER TABLE "ProductVariant" ALTER COLUMN "sizeId" DROP NOT NULL;

-- 6) ProductVariant.colorId nuevo (opcional, FK a ProductColor) -------------
ALTER TABLE "ProductVariant" ADD COLUMN "colorId" UUID;

ALTER TABLE "ProductVariant"
    ADD CONSTRAINT "ProductVariant_colorId_fkey"
    FOREIGN KEY ("colorId") REFERENCES "ProductColor"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7) Migrar unique constraint de ProductVariant ----------------------------
--    Antes era (productId, sizeId); ahora es (productId, sizeId, colorId).
--    Como Prisma trata NULLs como distintos en unique, esto permite múltiples
--    rows con sizeId=NULL (sin talle) o colorId=NULL (sin color) por producto.
--    Prisma genera esto como UNIQUE INDEX (no constraint), por eso DROP INDEX.
DROP INDEX IF EXISTS "product_size_unique_idx";

CREATE UNIQUE INDEX "productvariant_product_size_color_idx"
    ON "ProductVariant"("productId", "sizeId", "colorId");

-- 8) OrderItem: agregar snapshot del color ---------------------------------
ALTER TABLE "OrderItem"
    ADD COLUMN "productColorId" TEXT,
    ADD COLUMN "colorName"      TEXT,
    ADD COLUMN "colorHex"       TEXT;

-- 9) OrderItem: migrar unique constraint para incluir productColorId -------
--    Permite múltiples OrderItems con el mismo (order, product, size) si son
--    colores distintos (ej: remera azul T40 + remera roja T40).
DROP INDEX IF EXISTS "orderitems_order_product_size_idx";

CREATE UNIQUE INDEX "orderitems_order_product_size_idx"
    ON "OrderItem"("orderId", "productId", "size", "productColorId");
