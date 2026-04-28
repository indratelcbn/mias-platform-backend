-- AlterTable artikel: add kategori, tanggal_publish, is_highlight, meta_title, meta_description
ALTER TABLE "artikel" ADD COLUMN "kategori" TEXT;
ALTER TABLE "artikel" ADD COLUMN "tanggal_publish" TIMESTAMP(3);
ALTER TABLE "artikel" ADD COLUMN "is_highlight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "artikel" ADD COLUMN "meta_title" TEXT;
ALTER TABLE "artikel" ADD COLUMN "meta_description" TEXT;

-- Backfill tanggal_publish dari created_at supaya urutan tetap konsisten
UPDATE "artikel" SET "tanggal_publish" = "created_at" WHERE "tanggal_publish" IS NULL;

-- Indexes
CREATE INDEX "artikel_is_published_tanggal_publish_idx" ON "artikel"("is_published", "tanggal_publish");
CREATE INDEX "artikel_kategori_idx" ON "artikel"("kategori");
