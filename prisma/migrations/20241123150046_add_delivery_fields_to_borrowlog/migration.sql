-- AlterTable
ALTER TABLE `borrow_log` ADD COLUMN `delivery_address` VARCHAR(191) NULL,
    ADD COLUMN `delivery_method` VARCHAR(191) NOT NULL DEFAULT 'self';
