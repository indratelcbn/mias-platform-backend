-- CreateEnum (safe: skip if already exists)
DO $$ BEGIN
  CREATE TYPE "StatusUjian" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusPeserta" AS ENUM ('AKTIF', 'SELESAI', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE "ujian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "kode_ujian" TEXT NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "durasi" INTEGER NOT NULL,
    "passing_grade" INTEGER NOT NULL DEFAULT 70,
    "max_percobaan" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusUjian" NOT NULL DEFAULT 'DRAFT',
    "petunjuk" TEXT,
    "tampil_nilai" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal_ujian" (
    "id" TEXT NOT NULL,
    "ujian_id" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "pilihan_a" TEXT NOT NULL,
    "pilihan_b" TEXT NOT NULL,
    "pilihan_c" TEXT NOT NULL,
    "pilihan_d" TEXT NOT NULL,
    "kunci_jawaban" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peserta_ujian" (
    "id" TEXT NOT NULL,
    "ujian_id" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "identitas" TEXT NOT NULL,
    "percobaan" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "is_passed" BOOLEAN,
    "status" "StatusPeserta" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peserta_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_ujian" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "soal_id" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jawaban_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ujian_kode_ujian_key" ON "ujian"("kode_ujian");

-- CreateIndex
CREATE INDEX "ujian_status_idx" ON "ujian"("status");

-- CreateIndex
CREATE INDEX "ujian_kode_ujian_idx" ON "ujian"("kode_ujian");

-- CreateIndex
CREATE INDEX "soal_ujian_ujian_id_idx" ON "soal_ujian"("ujian_id");

-- CreateIndex
CREATE INDEX "peserta_ujian_ujian_id_idx" ON "peserta_ujian"("ujian_id");

-- CreateIndex
CREATE INDEX "peserta_ujian_status_idx" ON "peserta_ujian"("status");

-- CreateIndex
CREATE INDEX "jawaban_ujian_peserta_id_idx" ON "jawaban_ujian"("peserta_id");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_ujian_peserta_id_soal_id_key" ON "jawaban_ujian"("peserta_id", "soal_id");

-- AddForeignKey
ALTER TABLE "soal_ujian" ADD CONSTRAINT "soal_ujian_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peserta_ujian" ADD CONSTRAINT "peserta_ujian_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_ujian" ADD CONSTRAINT "jawaban_ujian_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta_ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_ujian" ADD CONSTRAINT "jawaban_ujian_soal_id_fkey" FOREIGN KEY ("soal_id") REFERENCES "soal_ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
