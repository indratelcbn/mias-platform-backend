-- CreateEnum
CREATE TYPE "KategoriSosial" AS ENUM ('SANTUNAN_ANAK_YATIM', 'AIR_GALON_GRATIS', 'LAYANAN_KESEHATAN_IBU_ANAK', 'ARMALAH_AL_MISKIN', 'BANTUAN_PENGOBATAN', 'ZAKAT_MAAL');

-- CreateTable
CREATE TABLE "sosial_foto" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "kategori" "KategoriSosial" NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sosial_foto_pkey" PRIMARY KEY ("id")
);
