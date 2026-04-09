-- AlterTable
ALTER TABLE "galeri" ADD COLUMN "urutan" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing year values from upload timestamp for old records that only received the default year
UPDATE "galeri"
SET "tahun" = EXTRACT(YEAR FROM "created_at")::INTEGER
WHERE "tahun" = 2026;

-- Initialize display order per category and year, preserving previous newest-first ordering
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "kategori", "tahun"
      ORDER BY "created_at" DESC, "id" DESC
    ) - 1 AS urutan_baru
  FROM "galeri"
)
UPDATE "galeri" AS g
SET "urutan" = ranked.urutan_baru
FROM ranked
WHERE g."id" = ranked."id";