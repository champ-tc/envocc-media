/*
  Warnings:

  - Added the required column `delivery_method` to the `requisition_log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_log` ADD COLUMN `delivery_address` VARCHAR(191) NULL,
    ADD COLUMN `delivery_method` VARCHAR(191) NOT NULL,
    ALTER COLUMN `status` DROP DEFAULT;
