-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "securities" ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true;
