/*
  Warnings:

  - You are about to drop the column `delivery_address` on the `requisition_log` table. All the data in the column will be lost.
  - You are about to drop the column `request_group_id` on the `requisition_log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `borrow_log` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `requisition_log` DROP COLUMN `delivery_address`,
    DROP COLUMN `request_group_id`,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    MODIFY `stock_after_requisition` INTEGER NULL;
