/*
  Warnings:

  - The primary key for the `borrows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `borrow_id` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `borrow_name` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `is_borrow_restricted` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `borrows` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `borrows` table. All the data in the column will be lost.
  - The primary key for the `requisitions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `is_borro_restricted` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `requisition_id` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `requisition_name` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `reserved_quantity` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the `type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `borrowedQuantity` to the `borrows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `borrows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `borrows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `borrows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `approvedQuantity` to the `requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedQuantity` to the `requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockAfterRequisition` to the `requisitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `requisitions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `borrows` DROP PRIMARY KEY,
    DROP COLUMN `borrow_id`,
    DROP COLUMN `borrow_name`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `description`,
    DROP COLUMN `is_borrow_restricted`,
    DROP COLUMN `quantity`,
    DROP COLUMN `type_id`,
    DROP COLUMN `unit`,
    ADD COLUMN `approvedByAdminId` INTEGER NULL,
    ADD COLUMN `borrowDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `borrowedQuantity` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `productId` INTEGER NOT NULL,
    ADD COLUMN `returnDueDate` DATETIME(3) NULL,
    ADD COLUMN `returnedQuantity` INTEGER NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `requisitions` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `description`,
    DROP COLUMN `is_borro_restricted`,
    DROP COLUMN `quantity`,
    DROP COLUMN `requisition_id`,
    DROP COLUMN `requisition_name`,
    DROP COLUMN `reserved_quantity`,
    DROP COLUMN `type_id`,
    DROP COLUMN `unit`,
    ADD COLUMN `approvedByAdminId` INTEGER NULL,
    ADD COLUMN `approvedQuantity` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `productId` INTEGER NOT NULL,
    ADD COLUMN `requestedQuantity` INTEGER NOT NULL,
    ADD COLUMN `requisitionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `stockAfterRequisition` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `type`;

-- CreateTable
CREATE TABLE `types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(255) NOT NULL,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `affectedQuantity` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `borrow_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(255) NOT NULL,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `affectedQuantity` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
