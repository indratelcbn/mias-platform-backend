-- CreateEnum
CREATE TYPE "KategoriPendidikan" AS ENUM ('TAHSIN_IKHWAN', 'TAHSIN_AKHWAT', 'BAHASA_ARAB_IKHWAN', 'BAHASA_ARAB_AKHWAT', 'TPQ');

-- CreateTable
CREATE TABLE "pendidikan_info" (
    "id" TEXT NOT NULL,
    "kategori" "KategoriPendidikan" NOT NULL,
    "pengajar" TEXT NOT NULL,
    "jumlah_penuntut_ilmu" INTEGER NOT NULL DEFAULT 0,
    "kitab" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendidikan_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendidikan_foto" (
    "id" TEXT NOT NULL,
    "kategori" "KategoriPendidikan" NOT NULL,
    "judul" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "keterangan" TEXT,
    "tahun" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendidikan_foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pendidikan_info_kategori_key" ON "pendidikan_info"("kategori");
