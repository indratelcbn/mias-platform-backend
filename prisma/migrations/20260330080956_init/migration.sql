-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "StatusDonasi" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kajian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "ustadz" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "waktu" TEXT NOT NULL,
    "lokasi" TEXT,
    "deskripsi" TEXT,
    "thumbnail" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "kajian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artikel" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "ringkasan" TEXT,
    "thumbnail" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "artikel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donasi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT,
    "telepon" TEXT,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "pesan" TEXT,
    "bukti_transfer" TEXT,
    "status" "StatusDonasi" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rekening" (
    "id" TEXT NOT NULL,
    "nama_bank" TEXT NOT NULL,
    "no_rekening" TEXT NOT NULL,
    "atas_nama" TEXT NOT NULL,
    "keterangan" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rekening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subjek" TEXT,
    "pesan" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "artikel_slug_key" ON "artikel"("slug");

-- AddForeignKey
ALTER TABLE "kajian" ADD CONSTRAINT "kajian_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artikel" ADD CONSTRAINT "artikel_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
