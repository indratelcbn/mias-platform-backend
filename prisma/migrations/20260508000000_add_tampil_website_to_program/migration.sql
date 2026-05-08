-- Add tampil_website column to control public website visibility independently from is_active
ALTER TABLE "program_donasi" ADD COLUMN IF NOT EXISTS "tampil_website" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "program_wakaf"  ADD COLUMN IF NOT EXISTS "tampil_website" BOOLEAN NOT NULL DEFAULT true;
