-- AlterTable kajian: add kitab text and kitab_file PDF path
ALTER TABLE "kajian" ADD COLUMN "kitab" TEXT;
ALTER TABLE "kajian" ADD COLUMN "kitab_file" TEXT;
