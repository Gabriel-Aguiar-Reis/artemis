CREATE TABLE `error_log` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`timestamp` integer NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`stack_trace` text,
	`context` text,
	`metadata` text
);
