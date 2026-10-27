CREATE TABLE `rateLimits` (
	`bucketKey` varchar(191) NOT NULL,
	`windowStart` timestamp NOT NULL,
	`hits` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rateLimits_bucketKey` PRIMARY KEY(`bucketKey`)
);
--> statement-breakpoint
CREATE TABLE `sportsMarkets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fixtureId` varchar(64) NOT NULL,
	`code` varchar(8) NOT NULL,
	`name` varchar(96) NOT NULL,
	`price` decimal(8,4) NOT NULL,
	`sport` varchar(32) NOT NULL DEFAULT 'football',
	`league` varchar(96),
	`home` varchar(96),
	`away` varchar(96),
	`startsAt` timestamp,
	`matchStatus` varchar(24),
	`capturedAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sportsMarkets_id` PRIMARY KEY(`id`),
	CONSTRAINT `sportsMarkets_fixture_code_unique` UNIQUE(`fixtureId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `passwordResetTokens` ADD `attempts` int DEFAULT 0 NOT NULL;