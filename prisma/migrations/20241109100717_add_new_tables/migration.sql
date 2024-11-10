/*
  Warnings:

  - You are about to drop the `borrow_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `borrows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requisition_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requisitions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `borrow_logs`;

-- DropTable
DROP TABLE `borrows`;

-- DropTable
DROP TABLE `requisition_logs`;

-- DropTable
DROP TABLE `requisitions`;

-- CreateTable
CREATE TABLE `requisition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reserved_quantity` INTEGER NULL,
    `is_borro_restricted` BOOLEAN NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `borrow_name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `type_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `is_borro_restricted` BOOLEAN NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `requested_quantity` INTEGER NOT NULL,
    `approved_quantity` INTEGER NULL,
    `stock_after_requisition` INTEGER NOT NULL,
    `requisition_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_by_admin_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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
    `approved_by_admin_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
