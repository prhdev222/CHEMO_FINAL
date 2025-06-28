-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'DOCTOR', 'NURSE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hn` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `lineId` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `diagnosis` VARCHAR(191) NULL,
    `diagnosisDate` DATETIME(3) NULL,
    `stage` VARCHAR(191) NULL,
    `prognosis` VARCHAR(191) NULL,
    `attachments` JSON NULL,
    `treatmentPlan` JSON NOT NULL,
    `followUp` JSON NULL,
    `progression` JSON NULL,
    `palliative` JSON NULL,
    `deathDate` DATETIME(3) NULL,
    `deathCause` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DECEASED') NOT NULL DEFAULT 'ACTIVE',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Patient_hn_key`(`hn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `chemoRegimen` VARCHAR(191) NOT NULL,
    `admitStatus` VARCHAR(191) NOT NULL,
    `admitDate` DATETIME(3) NULL,
    `dischargeDate` DATETIME(3) NULL,
    `referHospital` VARCHAR(191) NULL,
    `referDate` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RescheduleHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointmentId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `newDate` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExternalLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RescheduleHistory` ADD CONSTRAINT `RescheduleHistory_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
