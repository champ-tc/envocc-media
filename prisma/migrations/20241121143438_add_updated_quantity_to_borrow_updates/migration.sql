/*
  Warnings:

  - You are about to drop the column `addedQuantity` on the `borrow_updates` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `borrow_updates` table. All the data in the column will be lost.
  - Added the required column `updatedQuantity` to the `borrow_updates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `borrow_updates` DROP FOREIGN KEY `Borrow_updates_borrowId_fkey`;

-- AlterTable
ALTER TABLE `borrow_updates` DROP COLUMN `addedQuantity`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedQuantity` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `borrow_updates` ADD CONSTRAINT `borrow_updates_borrowId_fkey` FOREIGN KEY (`borrowId`) REFERENCES `borrow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
