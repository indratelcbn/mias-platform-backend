-- CreateEnum
CREATE TYPE "JenisPemateri" AS ENUM ('RUTIN', 'TEMATIK');

-- CreateTable profil_sejarah
CREATE TABLE "profil_sejarah" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "konten" TEXT,
    "foto" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profil_sejarah_pkey" PRIMARY KEY ("id")
);

-- CreateTable profil_visi_misi
CREATE TABLE "profil_visi_misi" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "visi" TEXT,
    "misi" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profil_visi_misi_pkey" PRIMARY KEY ("id")
);

-- CreateTable profil_fasilitas
CREATE TABLE "profil_fasilitas" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profil_fasilitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable profil_fasilitas_foto
CREATE TABLE "profil_fasilitas_foto" (
    "id" TEXT NOT NULL,
    "fasilitas_id" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "caption" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profil_fasilitas_foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable profil_struktur
CREATE TABLE "profil_struktur" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "foto" TEXT,
    "keterangan" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profil_struktur_pkey" PRIMARY KEY ("id")
);

-- CreateTable profil_pemateri
CREATE TABLE "profil_pemateri" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "foto" TEXT,
    "kitab" TEXT,
    "jenis" "JenisPemateri" NOT NULL DEFAULT 'RUTIN',
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profil_pemateri_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profil_fasilitas_foto" ADD CONSTRAINT "profil_fasilitas_foto_fasilitas_id_fkey"
    FOREIGN KEY ("fasilitas_id") REFERENCES "profil_fasilitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed singleton rows
INSERT INTO "profil_sejarah"  ("id", "updated_at") VALUES (1, NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "profil_visi_misi" ("id", "updated_at") VALUES (1, NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "profil_struktur"  ("id", "updated_at") VALUES (1, NOW()) ON CONFLICT ("id") DO NOTHING;
