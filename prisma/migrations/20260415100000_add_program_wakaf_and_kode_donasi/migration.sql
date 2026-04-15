-- AlterTable: add kode column to program_donasi (skip if already exists)
ALTER TABLE "program_donasi" ADD COLUMN IF NOT EXISTS "kode" TEXT;

-- CreateTable (skip if already exists)
CREATE TABLE IF NOT EXISTS "program_wakaf" (
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "kegiatan" TEXT NOT NULL,
    "deskripsi" TEXT,
    "target" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "terkumpul" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_wakaf_pkey" PRIMARY KEY ("id")
);
