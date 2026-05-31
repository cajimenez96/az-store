/*
  Warnings:

  - You are about to drop the column `promoCodeId` on the `Order` table. All the data in the column will be lost.
  - Made the column `orderId` on table `PromoCodeUsage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "PromoCodeUsage_promoCodeId_userId_usedAt_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "promoCodeId",
ALTER COLUMN "discountPrice" DROP NOT NULL,
ALTER COLUMN "discountPrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PromoCode" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PromoCodeUsage" ALTER COLUMN "orderId" SET NOT NULL;
