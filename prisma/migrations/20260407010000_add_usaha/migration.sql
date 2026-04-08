-- CreateTable
CREATE TABLE "umroh_program" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "flyer" TEXT NOT NULL,
    "deskripsi" TEXT,
    "harga" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "umroh_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mias_mart_produk" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "harga" DECIMAL(15,2) NOT NULL,
    "deskripsi" TEXT,
    "link_beli" TEXT,
    "stok" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mias_mart_produk_pkey" PRIMARY KEY ("id")
);
