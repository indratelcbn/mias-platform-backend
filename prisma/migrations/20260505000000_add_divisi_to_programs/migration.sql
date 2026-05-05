-- CreateEnum: Divisi
DO $$ BEGIN
  CREATE TYPE "Divisi" AS ENUM ('DAKWAH', 'SOSIAL', 'PENDIDIKAN', 'USAHA', 'MULTIMEDIA', 'OPERASIONAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: program_donasi add divisi
ALTER TABLE "program_donasi" ADD COLUMN IF NOT EXISTS "divisi" "Divisi";

-- AlterTable: program_wakaf add divisi
ALTER TABLE "program_wakaf" ADD COLUMN IF NOT EXISTS "divisi" "Divisi";
