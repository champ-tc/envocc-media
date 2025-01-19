/*
  Warnings:

  - Made the column `borrow_images` on table `borrow` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requisition_images` on table `requisition` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `borrow` MODIFY `borrow_images` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requisition` MODIFY `requisition_images` VARCHAR(191) NOT NULL;
