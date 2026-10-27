CREATE TABLE `sportAlertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`watchlistId` int NOT NULL,
	`alertType` enum('kickoff','odds_change','result') NOT NULL,
	`threshold` decimal(12,4),
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sportAlertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `sportAlertPreferences_user_watch_alert_unique` UNIQUE(`userId`,`watchlistId`,`alertType`)
);
--> statement-breakpoint
CREATE TABLE `sportWatchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` varchar(96) NOT NULL,
	`sport` varchar(48) NOT NULL,
	`league` varchar(160) NOT NULL,
	`home` varchar(160) NOT NULL,
	`away` varchar(160) NOT NULL,
	`eventTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sportWatchlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `sportWatchlist_user_event_unique` UNIQUE(`userId`,`eventId`)
);
--> statement-breakpoint
ALTER TABLE `sportAlertPreferences` ADD CONSTRAINT `sportAlertPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sportAlertPreferences` ADD CONSTRAINT `sportAlertPreferences_watchlistId_sportWatchlist_id_fk` FOREIGN KEY (`watchlistId`) REFERENCES `sportWatchlist`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sportWatchlist` ADD CONSTRAINT `sportWatchlist_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;