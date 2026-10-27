CREATE TABLE `userRiskProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profile` enum('conservative','balanced','assertive') NOT NULL DEFAULT 'balanced',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userRiskProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userRiskProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `userRiskProfiles` ADD CONSTRAINT `userRiskProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;