/*
  Warnings:

  - Added the required column `request_group_id` to the `requisition_log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_log` ADD COLUMN `request_group_id` VARCHAR(191) NOT NULL;
