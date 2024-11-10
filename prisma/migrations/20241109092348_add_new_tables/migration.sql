-- CreateTable
CREATE TABLE `Type` (
    `type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_name` VARCHAR(255) NOT NULL,
    `type_description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisitions` (
    `requisition_id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reserved_quantity` INTEGER NOT NULL,
    `is_borro_restricted` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`requisition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrows` (
    `borrow_id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `is_borrow_restricted` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`borrow_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
