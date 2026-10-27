CREATE TABLE `gameCatalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`provider` varchar(96) NOT NULL,
	`launchUrl` varchar(320) NOT NULL,
	`status` enum('active','maintenance','disabled') NOT NULL DEFAULT 'disabled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameCatalog_id` PRIMARY KEY(`id`),
	CONSTRAINT `gameCatalog_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `promotionClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promotionId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('claimed','used','expired') NOT NULL DEFAULT 'claimed',
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `promotionClaims_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotionClaims_promotion_user_unique` UNIQUE(`promotionId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(48) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`terms` text NOT NULL,
	`rewardType` enum('usdt','free_bet','cashback') NOT NULL,
	`rewardAmount` decimal(20,6) NOT NULL,
	`status` enum('draft','active','expired') NOT NULL DEFAULT 'draft',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tournamentEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`userId` int NOT NULL,
	`points` decimal(20,6) NOT NULL DEFAULT '0',
	`rank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournamentEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `tournamentEntries_tournament_user_unique` UNIQUE(`tournamentId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`rules` text NOT NULL,
	`prizePool` decimal(20,6) NOT NULL,
	`currency` varchar(12) NOT NULL DEFAULT 'USDT',
	`status` enum('upcoming','live','ended') NOT NULL DEFAULT 'upcoming',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tournaments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `vipActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(48) NOT NULL,
	`points` decimal(20,6) NOT NULL,
	`referenceId` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vipActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','bet_lock','bet_settlement','wheel_reward','crash_settlement') NOT NULL,
	`status` enum('pending','confirmed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`currency` varchar(12) NOT NULL DEFAULT 'USDT',
	`amount` decimal(20,6) NOT NULL,
	`network` varchar(24),
	`address` varchar(160),
	`txHash` varchar(160),
	`referenceId` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walletTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `promotionClaims` ADD CONSTRAINT `promotionClaims_promotionId_promotions_id_fk` FOREIGN KEY (`promotionId`) REFERENCES `promotions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promotionClaims` ADD CONSTRAINT `promotionClaims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentEntries` ADD CONSTRAINT `tournamentEntries_tournamentId_tournaments_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentEntries` ADD CONSTRAINT `tournamentEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vipActivity` ADD CONSTRAINT `vipActivity_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD CONSTRAINT `walletTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;