CREATE TABLE "qurban_foto" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "keterangan" TEXT,
    "tahun" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qurban_foto_pkey" PRIMARY KEY ("id")
);
