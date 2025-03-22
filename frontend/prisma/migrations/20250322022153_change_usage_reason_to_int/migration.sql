/*
  Warnings:

  - You are about to alter the column `usageReason` on the `borrow_log` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `usageReason` on the `requisition_log` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `borrow_log` MODIFY `usageReason` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `requisition_log` MODIFY `usageReason` INTEGER NOT NULL;
