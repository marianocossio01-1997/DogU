-- AlterTable
ALTER TABLE `client_requests` ADD COLUMN `driver_earnings` DOUBLE NULL,
    ADD COLUMN `id_card` INTEGER NULL,
    ADD COLUMN `payment_id` VARCHAR(255) NULL,
    ADD COLUMN `payment_method` ENUM('CASH', 'CARD') NOT NULL DEFAULT 'CASH',
    ADD COLUMN `payment_status` ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `platform_fee` DOUBLE NULL;

-- AlterTable
ALTER TABLE `pricing_configs` ADD COLUMN `cancellation_fee_usd` DOUBLE NOT NULL DEFAULT 0.5,
    ADD COLUMN `commission_rate` DOUBLE NOT NULL DEFAULT 0.20;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `customer_id_mp` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `driver_wallets` (
    `id_driver` INTEGER NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0.0,
    `bank_name` VARCHAR(100) NULL,
    `cbu_cvu` VARCHAR(22) NULL,
    `alias` VARCHAR(100) NULL,
    `account_holder_name` VARCHAR(100) NULL,
    `tax_id` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_driver`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_driver_wallet` INTEGER NOT NULL,
    `id_client_request` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('TRIP_COMMISSION_DEBIT', 'TRIP_EARNING_CREDIT', 'CANCELLATION_FEE', 'WITHDRAWAL') NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdrawal_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_driver_wallet` INTEGER NOT NULL,
    `id_card` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `card_holder_name` VARCHAR(100) NOT NULL,
    `last_4` VARCHAR(4) NOT NULL,
    `brand` VARCHAR(30) NOT NULL,
    `expiration_month` INTEGER NOT NULL,
    `expiration_year` INTEGER NOT NULL,
    `card_token` VARCHAR(255) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `client_requests` ADD CONSTRAINT `client_requests_id_card_fkey` FOREIGN KEY (`id_card`) REFERENCES `user_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_wallets` ADD CONSTRAINT `driver_wallets_id_driver_fkey` FOREIGN KEY (`id_driver`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_id_driver_wallet_fkey` FOREIGN KEY (`id_driver_wallet`) REFERENCES `driver_wallets`(`id_driver`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_id_client_request_fkey` FOREIGN KEY (`id_client_request`) REFERENCES `client_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_id_driver_wallet_fkey` FOREIGN KEY (`id_driver_wallet`) REFERENCES `driver_wallets`(`id_driver`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdrawal_requests` ADD CONSTRAINT `withdrawal_requests_id_card_fkey` FOREIGN KEY (`id_card`) REFERENCES `user_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_cards` ADD CONSTRAINT `user_cards_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
