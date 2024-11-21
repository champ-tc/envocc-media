-- AlterTable
ALTER TABLE `borrow_log` ADD COLUMN `delivery_address` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `requisition_log` ADD COLUMN `delivery_address` VARCHAR(191) NULL;
