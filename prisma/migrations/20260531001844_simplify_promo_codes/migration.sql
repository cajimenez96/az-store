/*
  Warnings:

  - You are about to drop the column `discountPrice` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `promoCodeId` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the `PromoCodeCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCodeProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCodeSize` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCodeSubCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeCategory" DROP CONSTRAINT "PromoCodeCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeCategory" DROP CONSTRAINT "PromoCodeCategory_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeProduct" DROP CONSTRAINT "PromoCodeProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeProduct" DROP CONSTRAINT "PromoCodeProduct_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeSize" DROP CONSTRAINT "PromoCodeSize_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeSize" DROP CONSTRAINT "PromoCodeSize_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeSubCategory" DROP CONSTRAINT "PromoCodeSubCategory_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCodeSubCategory" DROP CONSTRAINT "PromoCodeSubCategory_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "discountPrice",
DROP COLUMN "promoCodeId";

-- DropTable
DROP TABLE "PromoCodeCategory";

-- DropTable
DROP TABLE "PromoCodeProduct";

-- DropTable
DROP TABLE "PromoCodeSize";

-- DropTable
DROP TABLE "PromoCodeSubCategory";
