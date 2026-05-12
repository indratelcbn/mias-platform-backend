-- Add transaction code to finance_transactions
ALTER TABLE "finance_transactions"
ADD COLUMN "transaction_code" TEXT;

CREATE INDEX "finance_transactions_transaction_code_idx" ON "finance_transactions" ("transaction_code");
