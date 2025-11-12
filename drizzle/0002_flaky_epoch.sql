PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_completions` (
	`id` integer PRIMARY KEY NOT NULL,
	`task_id` integer NOT NULL,
	`completedAt` integer DEFAULT current_timestamp,
	`updatedAt` integer DEFAULT current_timestamp,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_completions`("id", "task_id", "completedAt", "updatedAt") SELECT "id", "task_id", "completedAt", "updatedAt" FROM `completions`;--> statement-breakpoint
DROP TABLE `completions`;--> statement-breakpoint
ALTER TABLE `__new_completions` RENAME TO `completions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer DEFAULT current_timestamp,
	`updatedAt` integer DEFAULT current_timestamp
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "createdAt", "updatedAt") SELECT "id", "title", "createdAt", "updatedAt" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;