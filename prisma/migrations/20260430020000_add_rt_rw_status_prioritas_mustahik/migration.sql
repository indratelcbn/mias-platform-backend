-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusMustahik" AS ENUM ('JAMAAH', 'WARGA', 'WARGA_LUAR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PrioritasMustahik" AS ENUM ('PRIORITAS_1', 'PRIORITAS_2', 'PRIORITAS_3');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "rt" TEXT;
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "rw" TEXT;
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "status" "StatusMustahik";
ALTER TABLE "mustahik" ADD COLUMN IF NOT EXISTS "prioritas" "PrioritasMustahik";
