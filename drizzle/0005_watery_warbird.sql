CREATE TABLE `crashBets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roundId` int NOT NULL,
	`stake` decimal(20,6) NOT NULL,
	`cashoutMultiplier` decimal(12,4),
	`payout` decimal(20,6) NOT NULL DEFAULT '0',
	`status` enum('pending','won','lost') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crashBets_id` PRIMARY KEY(`id`),
	CONSTRAINT `crashBets_round_user_unique` UNIQUE(`roundId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `crashRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundCode` varchar(40) NOT NULL,
	`status` enum('running','crashed') NOT NULL DEFAULT 'running',
	`crashMultiplier` decimal(12,4) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`crashedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crashRounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `crashRounds_roundCode_unique` UNIQUE(`roundCode`)
);
--> statement-breakpoint
ALTER TABLE `crashBets` ADD CONSTRAINT `crashBets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crashBets` ADD CONSTRAINT `crashBets_roundId_crashRounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `crashRounds`(`id`) ON DELETE no action ON UPDATE no action;