-- Add seller management fields to Order table
ALTER TABLE "Order" ADD COLUMN "sellerId" UUID;
ALTER TABLE "Order" ADD COLUMN "commissionAmount" DECIMAL(12,2);
