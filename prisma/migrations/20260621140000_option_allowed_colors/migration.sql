-- CreateTable
CREATE TABLE "_ProductOptionColors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductOptionColors_AB_unique" ON "_ProductOptionColors"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductOptionColors_B_index" ON "_ProductOptionColors"("B");

-- AddForeignKey
ALTER TABLE "_ProductOptionColors" ADD CONSTRAINT "_ProductOptionColors_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductOptionColors" ADD CONSTRAINT "_ProductOptionColors_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
