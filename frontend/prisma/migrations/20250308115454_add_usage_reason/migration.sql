/*
  Warnings:

  - You are about to drop the column `customUsageReason` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `usageReason` on the `order` table. All the data in the column will be lost.
  - Added the required column `usageReason` to the `borrow_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageReason` to the `requisition_log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `borrow_log` ADD COLUMN `customUsageReason` VARCHAR(191) NULL,
    ADD COLUMN `usageReason` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `customUsageReason`,
    DROP COLUMN `usageReason`;

-- AlterTable
ALTER TABLE `requisition_log` ADD COLUMN `customUsageReason` VARCHAR(191) NULL,
    ADD COLUMN `usageReason` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `reason` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason_name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `reason_reason_name_key`(`reason_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
