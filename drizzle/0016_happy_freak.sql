ALTER TABLE `gameCatalog` ADD `vertical` varchar(32) DEFAULT 'casino' NOT NULL;--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `category` varchar(48) DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `mode` enum('demo','real') DEFAULT 'real' NOT NULL;--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `thumbnailUrl` varchar(320);--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `isFeatured` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `isNew` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `minStake` decimal(20,6);--> statement-breakpoint
ALTER TABLE `gameCatalog` ADD `maxStake` decimal(20,6);