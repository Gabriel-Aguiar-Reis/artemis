ALTER TABLE `work_order_result_items` RENAME TO `work_order_result_item`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_work_order_result_item` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`result_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_snapshot` real NOT NULL,
	`type` text NOT NULL,
	`observation` text,
	FOREIGN KEY (`result_id`) REFERENCES `work_order_result`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_work_order_result_item`("id", "result_id", "product_id", "quantity", "price_snapshot", "type", "observation") SELECT "id", "result_id", "product_id", "quantity", "price_snapshot", "type", "observation" FROM `work_order_result_item`;--> statement-breakpoint
DROP TABLE `work_order_result_item`;--> statement-breakpoint
ALTER TABLE `__new_work_order_result_item` RENAME TO `work_order_result_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;