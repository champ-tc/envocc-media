-- CreateTable
CREATE TABLE `requisition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reserved_quantity` INTEGER NULL,
    `is_borro_restricted` BOOLEAN NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requisition_images` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,

    INDEX `Requisition_type_id_fkey`(`type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_updates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisitionId` INTEGER NOT NULL,
    `addedQuantity` INTEGER NOT NULL,
    `updateType` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` VARCHAR(191) NULL,

    INDEX `requisition_updates_requisitionId_fkey`(`requisitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `is_borro_restricted` BOOLEAN NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `borrow_images` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,

    INDEX `borrow_type_id_fkey`(`type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_updates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrowId` INTEGER NOT NULL,
    `updatedQuantity` INTEGER NOT NULL,
    `updateType` VARCHAR(191) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `addedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `viewCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Image_filename_key`(`filename`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `requisitionId` INTEGER NULL,
    `borrowId` INTEGER NULL,
    `requisition_type` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Order_borrowId_fkey`(`borrowId`),
    INDEX `Order_requisitionId_fkey`(`requisitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reason` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason_name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `reason_reason_name_key`(`reason_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `requested_quantity` INTEGER NOT NULL,
    `approved_quantity` INTEGER NULL,
    `stock_after_requisition` INTEGER NULL,
    `requisition_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_by_admin_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,
    `requested_groupid` VARCHAR(191) NOT NULL,
    `delivery_address` VARCHAR(191) NULL,
    `delivery_method` VARCHAR(191) NOT NULL,
    `usageReason` INTEGER NOT NULL,
    `customUsageReason` VARCHAR(191) NULL,

    INDEX `requisition_log_approved_by_admin_id_fkey`(`approved_by_admin_id`),
    INDEX `requisition_log_requisition_id_fkey`(`requisition_id`),
    INDEX `requisition_log_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `returned_quantity` INTEGER NULL,
    `borrow_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `return_due_date` DATETIME(3) NOT NULL,
    `actual_return_date` DATETIME(3) NULL,
    `delivery_method` VARCHAR(191) NOT NULL DEFAULT 'self',
    `delivery_address` VARCHAR(191) NULL,
    `borrow_groupid` VARCHAR(191) NOT NULL,
    `approved_quantity` INTEGER NULL,
    `approved_by_admin_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `usageReason` INTEGER NOT NULL,
    `customUsageReason` VARCHAR(191) NULL,

    INDEX `borrow_log_approved_by_admin_id_fkey`(`approved_by_admin_id`),
    INDEX `borrow_log_borrow_id_fkey`(`borrow_id`),
    INDEX `borrow_log_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordresettoken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `passwordresettoken_token_key`(`token`),
    INDEX `passwordresettoken_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requisition` ADD CONSTRAINT `Requisition_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_updates` ADD CONSTRAINT `requisition_updates_requisitionId_fkey` FOREIGN KEY (`requisitionId`) REFERENCES `requisition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow` ADD CONSTRAINT `borrow_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_updates` ADD CONSTRAINT `borrow_updates_borrowId_fkey` FOREIGN KEY (`borrowId`) REFERENCES `borrow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `Order_borrowId_fkey` FOREIGN KEY (`borrowId`) REFERENCES `borrow`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `Order_requisitionId_fkey` FOREIGN KEY (`requisitionId`) REFERENCES `requisition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_approved_by_admin_id_fkey` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_requisition_id_fkey` FOREIGN KEY (`requisition_id`) REFERENCES `requisition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_log` ADD CONSTRAINT `requisition_log_usageReason_fkey` FOREIGN KEY (`usageReason`) REFERENCES `reason`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_approved_by_admin_id_fkey` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_borrow_id_fkey` FOREIGN KEY (`borrow_id`) REFERENCES `borrow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `borrow_log` ADD CONSTRAINT `borrow_log_usageReason_fkey` FOREIGN KEY (`usageReason`) REFERENCES `reason`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordresettoken` ADD CONSTRAINT `passwordresettoken_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
