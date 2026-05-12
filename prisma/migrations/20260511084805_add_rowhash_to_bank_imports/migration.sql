/*
  Warnings:

  - A unique constraint covering the columns `[account_id,row_hash]` on the table `finance_bank_import_details` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `row_hash` to the `finance_bank_import_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "finance_bank_import_details" ADD COLUMN     "divisi_id" TEXT,
ADD COLUMN     "divisi_nama" TEXT,
ADD COLUMN     "program_id" TEXT,
ADD COLUMN     "program_name" TEXT,
ADD COLUMN     "program_type" TEXT,
ADD COLUMN     "row_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "finance_bank_import_details_account_id_row_hash_key" ON "finance_bank_import_details"("account_id", "row_hash");
