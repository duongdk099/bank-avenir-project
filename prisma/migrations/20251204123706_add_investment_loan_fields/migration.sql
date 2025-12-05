/*
  Warnings:

  - You are about to drop the column `due_date` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `installment_number` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `interest_amount` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `paid_date` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `principal_amount` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `loan_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `commission` on the `trades` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[loan_id,month]` on the table `loan_schedules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `insurance_payment` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interest_payment` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principal_payment` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remaining_balance` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_payment` to the `loan_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurance_rate` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remaining_balance` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "loan_schedules" DROP COLUMN "due_date",
DROP COLUMN "installment_number",
DROP COLUMN "interest_amount",
DROP COLUMN "paid_date",
DROP COLUMN "principal_amount",
DROP COLUMN "total_amount",
ADD COLUMN     "insurance_payment" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "interest_payment" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "principal_payment" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "remaining_balance" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "total_payment" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "current_month" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "insurance_rate" DECIMAL(5,4) NOT NULL,
ADD COLUMN     "remaining_balance" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "executed_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "trades" DROP COLUMN "commission",
ADD COLUMN     "fee" DECIMAL(15,2) NOT NULL DEFAULT 1.00;

-- CreateIndex
CREATE UNIQUE INDEX "loan_schedules_loan_id_month_key" ON "loan_schedules"("loan_id", "month");
