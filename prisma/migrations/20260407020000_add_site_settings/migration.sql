-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "facebook" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "whatsapp" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "site_settings" ("id", "facebook", "instagram", "youtube", "whatsapp", "updated_at")
VALUES (1, NULL, NULL, NULL, NULL, NOW())
ON CONFLICT ("id") DO NOTHING;
