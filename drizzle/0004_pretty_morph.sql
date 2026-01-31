CREATE TABLE `rewards` (
	`id` integer PRIMARY KEY NOT NULL,
	`rewardNumber` integer NOT NULL,
	`rewardedAt` integer,
	`task_id` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `completedAt` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `type` text DEFAULT 'daily';--> statement-breakpoint
ALTER TABLE `tasks` ADD `reward` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `tasks` ADD `hasReward` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tasks` ADD `rewardWhen` text DEFAULT 'never' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `maxRewards` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tasks` ADD `frequency` integer DEFAULT 1;