-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('INFAQ', 'WAKAF');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED');

-- AlterTable
ALTER TABLE "donasi" ADD COLUMN "jenis_program" TEXT,
ADD COLUMN "nama_program" TEXT;

-- AlterTable
ALTER TABLE "mustahik" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pesan" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sosial_foto" ALTER COLUMN "tahun" DROP DEFAULT;

-- CreateTable
CREATE TABLE "finance_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "account_number" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "unique_code" INTEGER,
    "actual_amount" DECIMAL(15,2),
    "program_type" "ProgramType",
    "program_id" TEXT,
    "program_name" TEXT,
    "category" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "attachment" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_bank_imports" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "inserted_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_bank_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_bank_import_details" (
    "id" TEXT NOT NULL,
    "import_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "balance" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_bank_import_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_reconciliations" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "bank_import_detail_id" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "matched_by" TEXT,
    "matched_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_audits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" TEXT,
    "new_data" TEXT,
    "description" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_transactions_account_id_idx" ON "finance_transactions"("account_id");

-- CreateIndex
CREATE INDEX "finance_transactions_transaction_date_idx" ON "finance_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "finance_transactions_type_idx" ON "finance_transactions"("type");

-- CreateIndex
CREATE INDEX "finance_transactions_program_type_program_id_idx" ON "finance_transactions"("program_type", "program_id");

-- CreateIndex
CREATE INDEX "finance_bank_imports_account_id_idx" ON "finance_bank_imports"("account_id");

-- CreateIndex
CREATE INDEX "finance_bank_imports_uploaded_at_idx" ON "finance_bank_imports"("uploaded_at");

-- CreateIndex
CREATE INDEX "finance_bank_import_details_import_id_idx" ON "finance_bank_import_details"("import_id");

-- CreateIndex
CREATE INDEX "finance_bank_import_details_account_id_idx" ON "finance_bank_import_details"("account_id");

-- CreateIndex
CREATE INDEX "finance_bank_import_details_transaction_date_idx" ON "finance_bank_import_details"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "finance_bank_import_details_transaction_id_account_id_key" ON "finance_bank_import_details"("transaction_id", "account_id");

-- CreateIndex
CREATE INDEX "finance_reconciliations_status_idx" ON "finance_reconciliations"("status");

-- CreateIndex
CREATE INDEX "finance_reconciliations_transaction_id_idx" ON "finance_reconciliations"("transaction_id");

-- CreateIndex
CREATE INDEX "finance_reconciliations_bank_import_detail_id_idx" ON "finance_reconciliations"("bank_import_detail_id");

-- CreateIndex
CREATE INDEX "finance_audits_user_id_idx" ON "finance_audits"("user_id");

-- CreateIndex
CREATE INDEX "finance_audits_entity_type_entity_id_idx" ON "finance_audits"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "finance_audits_created_at_idx" ON "finance_audits"("created_at");

-- AddForeignKey
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_bank_imports" ADD CONSTRAINT "finance_bank_imports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_bank_import_details" ADD CONSTRAINT "finance_bank_import_details_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "finance_bank_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_bank_import_details" ADD CONSTRAINT "finance_bank_import_details_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_reconciliations" ADD CONSTRAINT "finance_reconciliations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "finance_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_reconciliations" ADD CONSTRAINT "finance_reconciliations_bank_import_detail_id_fkey" FOREIGN KEY ("bank_import_detail_id") REFERENCES "finance_bank_import_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
