-- CreateTable
CREATE TABLE `Borrow_updates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrowId` INTEGER NOT NULL,
    `addedQuantity` INTEGER NOT NULL,
    `updateType` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Borrow_updates` ADD CONSTRAINT `Borrow_updates_borrowId_fkey` FOREIGN KEY (`borrowId`) REFERENCES `borrow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
