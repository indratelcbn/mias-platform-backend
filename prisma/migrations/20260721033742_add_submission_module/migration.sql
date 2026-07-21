-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'KETUA_DKM';
ALTER TYPE "Role" ADD VALUE 'WAKIL_DKM';

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "nomor" TEXT,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "metode_pencairan" TEXT,
    "rekening_id" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by_id" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_note" TEXT,
    "disbursed_by_id" TEXT,
    "disbursed_at" TIMESTAMP(3),
    "disbursement_ref" TEXT,
    "bukti_pencairan" TEXT,
    "notes" TEXT,
    "attachment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_items" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "nama_barang" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "harga_satuan" DECIMAL(15,2) NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_approval_logs" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rekening_pencairan" (
    "id" TEXT NOT NULL,
    "nama_bank" TEXT NOT NULL,
    "no_rekening" TEXT NOT NULL,
    "atas_nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rekening_pencairan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submissions_nomor_key" ON "submissions"("nomor");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_submitted_by_id_idx" ON "submissions"("submitted_by_id");

-- CreateIndex
CREATE INDEX "submissions_approved_by_id_idx" ON "submissions"("approved_by_id");

-- CreateIndex
CREATE INDEX "submissions_created_at_idx" ON "submissions"("created_at");

-- CreateIndex
CREATE INDEX "submission_items_submission_id_idx" ON "submission_items"("submission_id");

-- CreateIndex
CREATE INDEX "submission_approval_logs_submission_id_idx" ON "submission_approval_logs"("submission_id");

-- CreateIndex
CREATE INDEX "submission_approval_logs_user_id_idx" ON "submission_approval_logs"("user_id");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_disbursed_by_id_fkey" FOREIGN KEY ("disbursed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_rekening_id_fkey" FOREIGN KEY ("rekening_id") REFERENCES "rekening_pencairan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_items" ADD CONSTRAINT "submission_items_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_approval_logs" ADD CONSTRAINT "submission_approval_logs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_approval_logs" ADD CONSTRAINT "submission_approval_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
