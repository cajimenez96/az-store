-- Drop and recreate the join table with correct FK direction
-- Prisma convention: A -> first model alphabetically (Product), B -> second (PromoBanner)
DROP TABLE IF EXISTS "_ProductToPromoBanner";

CREATE TABLE "_ProductToPromoBanner" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);
CREATE UNIQUE INDEX "_ProductToPromoBanner_AB_unique" ON "_ProductToPromoBanner"("A", "B");
CREATE INDEX "_ProductToPromoBanner_B_index" ON "_ProductToPromoBanner"("B");
ALTER TABLE "_ProductToPromoBanner" ADD CONSTRAINT "_ProductToPromoBanner_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProductToPromoBanner" ADD CONSTRAINT "_ProductToPromoBanner_B_fkey" FOREIGN KEY ("B") REFERENCES "PromoBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
