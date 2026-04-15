-- CreateTable
CREATE TABLE IF NOT EXISTS "hero_banner" (
    "id" TEXT NOT NULL,
    "gambar" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banner_pkey" PRIMARY KEY ("id")
);
