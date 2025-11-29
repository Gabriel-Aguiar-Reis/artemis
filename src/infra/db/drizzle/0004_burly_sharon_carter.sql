ALTER TABLE `work_order_items` RENAME TO `work_order_item`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_work_order_item` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_snapshot` real NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_work_order_item`("id", "work_order_id", "product_id", "quantity", "price_snapshot") SELECT "id", "work_order_id", "product_id", "quantity", "price_snapshot" FROM `work_order_item`;--> statement-breakpoint
DROP TABLE `work_order_item`;--> statement-breakpoint
ALTER TABLE `__new_work_order_item` RENAME TO `work_order_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;