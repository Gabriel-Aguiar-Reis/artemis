CREATE TABLE `license` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`unique_code` text NOT NULL,
	`expiration_date` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `license_unique_code_unique` ON `license` (`unique_code`);