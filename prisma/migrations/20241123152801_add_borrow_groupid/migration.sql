/*
  Warnings:

  - Added the required column `borrow_groupid` to the `borrow_log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `borrow_log` ADD COLUMN `borrow_groupid` VARCHAR(191) NOT NULL;
