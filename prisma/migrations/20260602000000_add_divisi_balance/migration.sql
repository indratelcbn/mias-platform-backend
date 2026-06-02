-- CreateTable
CREATE TABLE "divisi_balance" (
    "id" TEXT NOT NULL,
    "divisi_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_in" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_out" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisi_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "divisi_balance_divisi_id_idx" ON "divisi_balance"("divisi_id");

-- CreateIndex
CREATE INDEX "divisi_balance_year_month_idx" ON "divisi_balance"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "divisi_balance_divisi_id_year_month_key" ON "divisi_balance"("divisi_id", "year", "month");

-- AddForeignKey
ALTER TABLE "divisi_balance" ADD CONSTRAINT "divisi_balance_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
