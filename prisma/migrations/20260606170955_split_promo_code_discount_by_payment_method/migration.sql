-- AlterTable
-- Split the single `discountPercent` field into two payment-method-specific
-- columns so the same code can offer different discounts for MercadoPago
-- versus TransferenciaBancaria. POS methods do not use these codes.
ALTER TABLE "PromoCode" ADD COLUMN     "discountPercentMercadoPago" DECIMAL(5,2),
ADD COLUMN     "discountPercentTransferencia" DECIMAL(5,2);

-- Backfill: copy the existing single percent into both new columns so the
-- historical behavior is preserved. The admin can then edit codes to set
-- method-specific values.
UPDATE "PromoCode"
SET
  "discountPercentMercadoPago" = "discountPercent",
  "discountPercentTransferencia" = "discountPercent";

-- Drop the legacy column now that data has been migrated.
ALTER TABLE "PromoCode" DROP COLUMN "discountPercent";
