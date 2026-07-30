-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "jenis" TEXT NOT NULL DEFAULT 'UMUM';

-- AlterTable
ALTER TABLE "submission_items" ADD COLUMN "sub_judul" TEXT,
ADD COLUMN "urutan" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "submission_item_names" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_item_names_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submission_item_names_nama_key" ON "submission_item_names"("nama");
