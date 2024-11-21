/*
  Warnings:

  - You are about to drop the column `delivery_address` on the `borrow_log` table. All the data in the column will be lost.
  - Added the required column `requested_groupid` to the `requisition_log` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `borrow` DROP FOREIGN KEY `Borrow_type_id_fkey`;

-- AlterTable
ALTER TABLE `borrow_log` DROP COLUMN `delivery_address`,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `order` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requisition_log` ADD COLUMN `requested_groupid` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE `borrow` ADD CONSTRAINT `borrow_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
