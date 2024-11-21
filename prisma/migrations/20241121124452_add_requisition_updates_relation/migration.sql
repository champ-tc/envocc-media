-- CreateTable
CREATE TABLE `requisition_updates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisitionId` INTEGER NOT NULL,
    `addedQuantity` INTEGER NOT NULL,
    `updateType` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requisition_updates` ADD CONSTRAINT `requisition_updates_requisitionId_fkey` FOREIGN KEY (`requisitionId`) REFERENCES `Requisition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
