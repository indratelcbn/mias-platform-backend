-- Add divisi_id columns to program_donasi and program_wakaf
ALTER TABLE "program_donasi" ADD COLUMN IF NOT EXISTS "divisi_id" TEXT;
ALTER TABLE "program_wakaf" ADD COLUMN IF NOT EXISTS "divisi_id" TEXT;

-- Add foreign key constraints only if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'program_donasi'
      AND tc.constraint_name = 'program_donasi_divisi_id_fkey'
  ) THEN
    ALTER TABLE "program_donasi"
      ADD CONSTRAINT "program_donasi_divisi_id_fkey"
      FOREIGN KEY ("divisi_id") REFERENCES "divisi"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'program_wakaf'
      AND tc.constraint_name = 'program_wakaf_divisi_id_fkey'
  ) THEN
    ALTER TABLE "program_wakaf"
      ADD CONSTRAINT "program_wakaf_divisi_id_fkey"
      FOREIGN KEY ("divisi_id") REFERENCES "divisi"("id") ON DELETE SET NULL;
  END IF;
END$$;
