/*
  Warnings:

  - Added the required column `usageReason` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `customUsageReason` VARCHAR(191) NULL,
    ADD COLUMN `usageReason` VARCHAR(191) NOT NULL;
