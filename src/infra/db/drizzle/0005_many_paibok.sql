ALTER TABLE `itinerary_work_orders` RENAME TO `itinerary_work_order`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_itinerary_work_order` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`itinerary_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`position` integer NOT NULL,
	`is_late` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itinerary`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_itinerary_work_order`("id", "itinerary_id", "work_order_id", "position", "is_late") SELECT "id", "itinerary_id", "work_order_id", "position", "is_late" FROM `itinerary_work_order`;--> statement-breakpoint
DROP TABLE `itinerary_work_order`;--> statement-breakpoint
ALTER TABLE `__new_itinerary_work_order` RENAME TO `itinerary_work_order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;