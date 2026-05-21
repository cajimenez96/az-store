-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expiresAt" TIMESTAMP(6),
ADD COLUMN     "receiptUrl" TEXT;
