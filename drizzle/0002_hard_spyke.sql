CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticketCode` varchar(32) NOT NULL,
	`currency` varchar(12) NOT NULL DEFAULT 'USDT',
	`stake` decimal(20,6) NOT NULL,
	`combinedOdds` decimal(12,4) NOT NULL,
	`potentialReturn` decimal(20,6) NOT NULL,
	`selectionsJson` text NOT NULL,
	`status` enum('pending','won','lost','void') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`),
	CONSTRAINT `bets_ticketCode_unique` UNIQUE(`ticketCode`)
);
--> statement-breakpoint
ALTER TABLE `bets` ADD CONSTRAINT `bets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;