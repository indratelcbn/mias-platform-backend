-- Create divisi table
CREATE TABLE "divisi" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama" TEXT NOT NULL UNIQUE,
  "deskripsi" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
