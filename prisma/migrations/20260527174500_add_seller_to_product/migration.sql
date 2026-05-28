-- AddForeignKey to Product for seller relationship
ALTER TABLE "Product" ADD COLUMN "sellerId" UUID;

ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
