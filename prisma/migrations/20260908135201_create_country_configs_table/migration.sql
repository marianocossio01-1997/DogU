-- CreateTable
CREATE TABLE `country_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_code` VARCHAR(5) NOT NULL,
    `country_name` VARCHAR(100) NOT NULL,
    `currency_code` VARCHAR(5) NOT NULL,
    `currency_symbol` VARCHAR(5) NOT NULL DEFAULT '$',
    `exchange_rate` DOUBLE NOT NULL DEFAULT 1.0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `country_configs_country_code_key`(`country_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_country` INTEGER NOT NULL,
    `base_fare_usd` DOUBLE NOT NULL DEFAULT 1.5,
    `km_value_usd` DOUBLE NOT NULL DEFAULT 0.5,
    `min_value_usd` DOUBLE NOT NULL DEFAULT 0.1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pricing_configs` ADD CONSTRAINT `pricing_configs_id_country_fkey` FOREIGN KEY (`id_country`) REFERENCES `country_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
