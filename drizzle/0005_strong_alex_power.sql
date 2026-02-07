PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rewards` (
	`id` integer PRIMARY KEY NOT NULL,
	`rewardNumber` integer NOT NULL,
	`rewardedAt` integer NOT NULL,
	`redeemedAt` integer,
	`task_id` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_rewards`("id", "rewardNumber", "rewardedAt", "redeemedAt", "task_id") SELECT "id", "rewardNumber", "rewardedAt", "redeemedAt", "task_id" FROM `rewards`;--> statement-breakpoint
DROP TABLE `rewards`;--> statement-breakpoint
ALTER TABLE `__new_rewards` RENAME TO `rewards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;