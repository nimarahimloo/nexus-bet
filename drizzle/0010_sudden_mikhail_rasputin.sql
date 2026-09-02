ALTER TABLE `walletTransactions` ADD `provider` varchar(32);--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `providerEventId` varchar(160);--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `providerStatus` varchar(32);--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `providerPayloadJson` text;--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD CONSTRAINT `walletTransactions_provider_event_unique` UNIQUE(`provider`,`providerEventId`);