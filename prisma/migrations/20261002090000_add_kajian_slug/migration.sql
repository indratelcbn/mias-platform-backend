ALTER TABLE "kajian" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "kajian_slug_key" ON "kajian"("slug") WHERE "slug" IS NOT NULL;
