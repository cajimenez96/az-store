-- Rename join table to match Prisma's alphabetical naming convention
-- Prisma orders by model name alphabetically: Product (P-r-o-d) < PromoBanner (P-r-o-m)
ALTER TABLE "_PromoBannerToProduct" RENAME TO "_ProductToPromoBanner";
