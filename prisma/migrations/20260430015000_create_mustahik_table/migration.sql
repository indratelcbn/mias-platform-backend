-- Idempotent: jika tabel/enum sudah dibuat (misal via dump/db push), perintah ini no-op.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "KategoriMustahik" AS ENUM ('YATIM', 'JANDA', 'FAKIR', 'MISKIN', 'GHARIM', 'FII_SABILILLAH', 'MUSAFIR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "HakMustahik" AS ENUM ('PENERIMA_ZAKAT_MAL', 'PENERIMA_ZAKAT_FITRI', 'PENERIMA_BANTUAN_MIAS', 'SEMUA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusMustahik" AS ENUM ('JAMAAH', 'WARGA', 'WARGA_LUAR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PrioritasMustahik" AS ENUM ('PRIORITAS_1', 'PRIORITAS_2', 'PRIORITAS_3');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "mustahik" (
    "id"         TEXT NOT NULL,
    "nama"       TEXT NOT NULL,
    "alamat"     TEXT,
    "rt"         TEXT,
    "rw"         TEXT,
    "kab_kota"   TEXT,
    "provinsi"   TEXT,
    "telepon"    TEXT,
    "kategori"   "KategoriMustahik" NOT NULL,
    "berhak"     "HakMustahik" NOT NULL DEFAULT 'SEMUA',
    "status"     "StatusMustahik",
    "prioritas"  "PrioritasMustahik",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mustahik_pkey" PRIMARY KEY ("id")
);

-- Pastikan kolom-kolom baru tetap ada walau tabel sudah pernah dibuat tanpa kolom ini
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "rt"        TEXT;
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "rw"        TEXT;
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "status"    "StatusMustahik";
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "prioritas" "PrioritasMustahik";
