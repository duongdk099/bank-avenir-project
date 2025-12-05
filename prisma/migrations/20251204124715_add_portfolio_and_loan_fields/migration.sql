/*
  Warnings:

  - You are about to drop the column `insurance_payment` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `interest_payment` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `principal_payment` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_balance` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `total_payment` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `current_month` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_balance` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `executed_quantity` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `trades` table. All the data in the column will be lost.
  - Added the required column `due_date` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `installment_number` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interest_amount` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principal_amount` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "loan_schedules_loan_id_month_key";

-- AlterTable
ALTER TABLE "loan_schedules" DROP COLUMN "insurance_payment",
DROP COLUMN "interest_payment",
DROP COLUMN "month",
DROP COLUMN "paid_at",
DROP COLUMN "principal_payment",
DROP COLUMN "remaining_balance",
DROP COLUMN "total_payment",
ADD COLUMN     "due_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "installment_number" INTEGER NOT NULL,
ADD COLUMN     "insurance_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "interest_amount" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "paid_date" TIMESTAMP(3),
ADD COLUMN     "principal_amount" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "loans" DROP COLUMN "current_month",
DROP COLUMN "remaining_balance",
ALTER COLUMN "insurance_rate" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "executed_quantity";

-- AlterTable
ALTER TABLE "trades" DROP COLUMN "fee",
ADD COLUMN     "commission" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "security_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avg_purchase_price" DECIMAL(15,4) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_account_id_security_id_key" ON "portfolios"("account_id", "security_id");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_security_id_fkey" FOREIGN KEY ("security_id") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
