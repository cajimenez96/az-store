-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "discountPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "promoCodeId" UUID;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "promoCode" TEXT,
ADD COLUMN     "promoCodeId" UUID;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsesPerUser" INTEGER,
    "startsAt" TIMESTAMP(6),
    "endsAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeProduct" (
    "promoCodeId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "PromoCodeProduct_pkey" PRIMARY KEY ("promoCodeId","productId")
);

-- CreateTable
CREATE TABLE "PromoCodeCategory" (
    "promoCodeId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "PromoCodeCategory_pkey" PRIMARY KEY ("promoCodeId","categoryId")
);

-- CreateTable
CREATE TABLE "PromoCodeSubCategory" (
    "promoCodeId" UUID NOT NULL,
    "subCategoryId" UUID NOT NULL,

    CONSTRAINT "PromoCodeSubCategory_pkey" PRIMARY KEY ("promoCodeId","subCategoryId")
);

-- CreateTable
CREATE TABLE "PromoCodeSize" (
    "promoCodeId" UUID NOT NULL,
    "sizeId" UUID NOT NULL,

    CONSTRAINT "PromoCodeSize_pkey" PRIMARY KEY ("promoCodeId","sizeId")
);

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promoCodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "usedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" UUID,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeUsage_promoCodeId_userId_usedAt_key" ON "PromoCodeUsage"("promoCodeId", "userId", "usedAt");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeProduct" ADD CONSTRAINT "PromoCodeProduct_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeProduct" ADD CONSTRAINT "PromoCodeProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeCategory" ADD CONSTRAINT "PromoCodeCategory_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeCategory" ADD CONSTRAINT "PromoCodeCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeSubCategory" ADD CONSTRAINT "PromoCodeSubCategory_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeSubCategory" ADD CONSTRAINT "PromoCodeSubCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeSize" ADD CONSTRAINT "PromoCodeSize_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeSize" ADD CONSTRAINT "PromoCodeSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
