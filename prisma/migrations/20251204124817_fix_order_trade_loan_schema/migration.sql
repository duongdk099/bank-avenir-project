/*
  Warnings:

  - You are about to drop the column `application_date` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `order_type` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `trades` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `trades` table. All the data in the column will be lost.
  - You are about to drop the column `trade_type` on the `trades` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remaining_quantity` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buy_account_id` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buy_order_id` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sell_account_id` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sell_order_id` to the `trades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "trades" DROP CONSTRAINT "trades_order_id_fkey";

-- AlterTable
ALTER TABLE "loans" DROP COLUMN "application_date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "order_type",
ADD COLUMN     "executed_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_quantity" INTEGER NOT NULL,
ADD COLUMN     "type" "TradeType" NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "trades" DROP COLUMN "order_id",
DROP COLUMN "total_amount",
DROP COLUMN "trade_type",
ADD COLUMN     "buy_account_id" TEXT NOT NULL,
ADD COLUMN     "buy_order_id" TEXT NOT NULL,
ADD COLUMN     "sell_account_id" TEXT NOT NULL,
ADD COLUMN     "sell_order_id" TEXT NOT NULL,
ALTER COLUMN "commission" SET DEFAULT 1.00;
