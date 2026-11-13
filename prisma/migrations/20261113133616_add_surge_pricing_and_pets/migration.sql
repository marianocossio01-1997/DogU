-- AlterTable
ALTER TABLE `client_requests` ADD COLUMN `is_night_fare` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_rain_fare` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pet_count` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `pricing_configs` ADD COLUMN `night_surge_rate` DOUBLE NOT NULL DEFAULT 0.15,
    ADD COLUMN `rain_surge_rate` DOUBLE NOT NULL DEFAULT 0.25,
    ADD COLUMN `two_pets_surge_rate` DOUBLE NOT NULL DEFAULT 0.20;
