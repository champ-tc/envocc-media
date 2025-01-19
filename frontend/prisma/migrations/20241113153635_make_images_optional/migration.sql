/*
  Warnings:

  - You are about to alter the column `borrow_name` on the `borrow` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `requisition_name` on the `requisition` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `name` on the `types` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `borrow` ADD COLUMN `borrow_images` VARCHAR(191) NULL,
    MODIFY `borrow_name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requisition` ADD COLUMN `requisition_images` VARCHAR(191) NULL,
    MODIFY `requisition_name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `types` MODIFY `name` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `requisition` ADD CONSTRAINT `requisition_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow` ADD CONSTRAINT `borrow_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_requisition_id_fkey` FOREIGN KEY (`requisition_id`) REFERENCES `requisition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_approved_by_admin_id_fkey` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_borrow_id_fkey` FOREIGN KEY (`borrow_id`) REFERENCES `borrow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_approved_by_admin_id_fkey` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
