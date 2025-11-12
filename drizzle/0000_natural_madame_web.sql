CREATE TABLE `completions` (
	`id` integer PRIMARY KEY NOT NULL,
	`task_id` integer NOT NULL,
	`completedAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
