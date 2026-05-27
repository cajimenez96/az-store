-- Add MercadoPago payment ID tracking field
ALTER TABLE "Order" ADD COLUMN "mpPaymentId" TEXT UNIQUE;
