/*
  Warnings:

  - You are about to drop the column `divisi` on the `program_donasi` table. All the data in the column will be lost.
  - You are about to drop the column `divisi` on the `program_wakaf` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "program_donasi" DROP CONSTRAINT "program_donasi_divisi_id_fkey";

-- DropForeignKey
ALTER TABLE "program_wakaf" DROP CONSTRAINT "program_wakaf_divisi_id_fkey";

-- AlterTable
ALTER TABLE "finance_bank_import_details" ADD COLUMN     "program_code" TEXT,
ALTER COLUMN "transaction_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "program_donasi" DROP COLUMN "divisi";

-- AlterTable
ALTER TABLE "program_wakaf" DROP COLUMN "divisi";

-- DropEnum
DROP TYPE "Divisi";

-- AddForeignKey
ALTER TABLE "program_donasi" ADD CONSTRAINT "program_donasi_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_wakaf" ADD CONSTRAINT "program_wakaf_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
