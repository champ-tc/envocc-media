-- AlterTable
ALTER TABLE `borrow` ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `requisition` ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;
