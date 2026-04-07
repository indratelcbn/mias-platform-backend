-- CreateEnum
CREATE TYPE "KategoriGaleri" AS ENUM ('RAMADHAN', 'SHOLAT_IED');

-- CreateTable
CREATE TABLE "galeri" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "kategori" "KategoriGaleri" NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galeri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaming" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "deskripsi" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_pkey" PRIMARY KEY ("id")
);
