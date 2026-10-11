-- AlterTable
ALTER TABLE `client_requests` ADD COLUMN `cancellation_fee` DOUBLE NULL,
    ADD COLUMN `cancellation_reason` VARCHAR(255) NULL,
    ADD COLUMN `cancelled_by` ENUM('CLIENT', 'DRIVER') NULL;

-- AlterTable
ALTER TABLE `pricing_configs` ADD COLUMN `cancellation_fee_rate` DOUBLE NOT NULL DEFAULT 0.15;
