-- Remove linkUrl from PromoBanner
ALTER TABLE "PromoBanner" DROP COLUMN IF EXISTS "linkUrl";

-- Add discountPercent to PromoBanner
ALTER TABLE "PromoBanner" ADD COLUMN "discountPercent" DOUBLE PRECISION;

-- Add bannerId and bannerDiscount to Order
ALTER TABLE "Order" ADD COLUMN "bannerId" UUID;
ALTER TABLE "Order" ADD COLUMN "bannerDiscount" DECIMAL(12,2);

-- Create implicit many-to-many join table (Prisma naming convention)
CREATE TABLE "_PromoBannerToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);
CREATE UNIQUE INDEX "_PromoBannerToProduct_AB_unique" ON "_PromoBannerToProduct"("A", "B");
CREATE INDEX "_PromoBannerToProduct_B_index" ON "_PromoBannerToProduct"("B");
ALTER TABLE "_PromoBannerToProduct" ADD CONSTRAINT "_PromoBannerToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PromoBannerToProduct" ADD CONSTRAINT "_PromoBannerToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
