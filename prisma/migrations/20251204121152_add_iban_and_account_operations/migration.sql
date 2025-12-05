/*
  Warnings:

  - You are about to drop the column `account_number` on the `bank_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `bank_accounts` table. All the data in the column will be lost.
  - You are about to drop the `operations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[iban]` on the table `bank_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `iban` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_account_id_fkey";

-- DropIndex
DROP INDEX "bank_accounts_account_number_key";

-- AlterTable
ALTER TABLE "bank_accounts" DROP COLUMN "account_number",
DROP COLUMN "is_active",
ADD COLUMN     "iban" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "operations";

-- CreateTable
CREATE TABLE "account_operations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "sender_iban" TEXT,
    "recipient_iban" TEXT,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_iban_key" ON "bank_accounts"("iban");

-- AddForeignKey
ALTER TABLE "account_operations" ADD CONSTRAINT "account_operations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
