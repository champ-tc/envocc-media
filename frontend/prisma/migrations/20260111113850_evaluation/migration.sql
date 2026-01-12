-- CreateTable
CREATE TABLE `Evaluation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `transactionGroupId` VARCHAR(191) NOT NULL,
    `satisfaction` INTEGER NOT NULL,
    `convenience` INTEGER NOT NULL,
    `reuseIntention` VARCHAR(191) NOT NULL,
    `recommend` VARCHAR(191) NOT NULL,
    `suggestion` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Evaluation_userId_idx`(`userId`),
    INDEX `Evaluation_transactionGroupId_idx`(`transactionGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Evaluation` ADD CONSTRAINT `Evaluation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
