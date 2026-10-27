CREATE TABLE `rewardLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinId` int NOT NULL,
	`currency` varchar(12) NOT NULL DEFAULT 'USDT',
	`amount` decimal(20,6) NOT NULL,
	`entryType` enum('wheel_reward') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewardLedger_id` PRIMARY KEY(`id`),
	CONSTRAINT `rewardLedger_spinId_unique` UNIQUE(`spinId`)
);
--> statement-breakpoint
CREATE TABLE `wheelSpins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinDate` varchar(10) NOT NULL,
	`rewardCode` varchar(32) NOT NULL,
	`rewardLabel` varchar(96) NOT NULL,
	`rewardType` enum('none','usdt') NOT NULL,
	`rewardAmount` decimal(20,6) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wheelSpins_id` PRIMARY KEY(`id`),
	CONSTRAINT `wheelSpins_user_day_unique` UNIQUE(`userId`,`spinDate`)
);
--> statement-breakpoint
ALTER TABLE `rewardLedger` ADD CONSTRAINT `rewardLedger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewardLedger` ADD CONSTRAINT `rewardLedger_spinId_wheelSpins_id_fk` FOREIGN KEY (`spinId`) REFERENCES `wheelSpins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wheelSpins` ADD CONSTRAINT `wheelSpins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;