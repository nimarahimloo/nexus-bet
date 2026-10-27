CREATE TABLE `activityRewardLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityCode` varchar(48) NOT NULL,
	`activityDate` varchar(10) NOT NULL,
	`currency` varchar(12) NOT NULL DEFAULT 'USDT',
	`amount` decimal(20,6) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityRewardLedger_id` PRIMARY KEY(`id`),
	CONSTRAINT `activityRewardLedger_user_activity_day_unique` UNIQUE(`userId`,`activityCode`,`activityDate`)
);
--> statement-breakpoint
ALTER TABLE `walletTransactions` MODIFY COLUMN `type` enum('deposit','withdrawal','bet_lock','bet_settlement','wheel_reward','activity_reward','crash_settlement') NOT NULL;--> statement-breakpoint
ALTER TABLE `activityRewardLedger` ADD CONSTRAINT `activityRewardLedger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;