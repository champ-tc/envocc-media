/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `types` will be added. If there are existing duplicate values, this will fail.
  - Made the column `department` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `firstName` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `position` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tel` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `currentToken` VARCHAR(191) NULL,
    MODIFY `department` VARCHAR(191) NOT NULL,
    MODIFY `firstName` VARCHAR(191) NOT NULL,
    MODIFY `lastName` VARCHAR(191) NOT NULL,
    MODIFY `position` VARCHAR(191) NOT NULL,
    MODIFY `tel` VARCHAR(191) NOT NULL,
    MODIFY `title` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `types_name_key` ON `types`(`name`);
