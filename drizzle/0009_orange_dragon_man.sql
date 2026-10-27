CREATE TABLE `supportedAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(12) NOT NULL,
	`name` varchar(64) NOT NULL,
	`symbol` varchar(12) NOT NULL,
	`decimals` int NOT NULL DEFAULT 6,
	`isBase` int NOT NULL DEFAULT 0,
	`status` enum('active','maintenance','disabled') NOT NULL DEFAULT 'maintenance',
	`networksJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportedAssets_id` PRIMARY KEY(`id`),
	CONSTRAINT `supportedAssets_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `wallets` DROP INDEX `wallets_userId_unique`;--> statement-breakpoint
ALTER TABLE `crashBets` ADD `currency` varchar(12) DEFAULT 'USDT' NOT NULL;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_currency_unique` UNIQUE(`userId`,`currency`);