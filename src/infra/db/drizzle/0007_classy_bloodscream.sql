PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_itinerary_work_order` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`itinerary_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`position` integer NOT NULL,
	`is_late` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itinerary`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_itinerary_work_order`("id", "itinerary_id", "work_order_id", "position", "is_late") SELECT "id", "itinerary_id", "work_order_id", "position", "is_late" FROM `itinerary_work_order`;--> statement-breakpoint
DROP TABLE `itinerary_work_order`;--> statement-breakpoint
ALTER TABLE `__new_itinerary_work_order` RENAME TO `itinerary_work_order`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_product` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`sale_price` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`expiration` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_product`("id", "name", "category_id", "sale_price", "is_active", "expiration") SELECT "id", "name", "category_id", "sale_price", "is_active", "expiration" FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
CREATE TABLE `__new_work_order_item` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_snapshot` real NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_work_order_item`("id", "work_order_id", "product_id", "quantity", "price_snapshot") SELECT "id", "work_order_id", "product_id", "quantity", "price_snapshot" FROM `work_order_item`;--> statement-breakpoint
DROP TABLE `work_order_item`;--> statement-breakpoint
ALTER TABLE `__new_work_order_item` RENAME TO `work_order_item`;--> statement-breakpoint
CREATE TABLE `__new_work_order_result_item` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`result_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_snapshot` real NOT NULL,
	`type` text NOT NULL,
	`observation` text,
	FOREIGN KEY (`result_id`) REFERENCES `work_order_result`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_work_order_result_item`("id", "result_id", "product_id", "quantity", "price_snapshot", "type", "observation") SELECT "id", "result_id", "product_id", "quantity", "price_snapshot", "type", "observation" FROM `work_order_result_item`;--> statement-breakpoint
DROP TABLE `work_order_result_item`;--> statement-breakpoint
ALTER TABLE `__new_work_order_result_item` RENAME TO `work_order_result_item`;--> statement-breakpoint
CREATE TABLE `__new_work_order` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`scheduled_date` text NOT NULL,
	`visit_date` text,
	`payment_order_id` text,
	`status` text NOT NULL,
	`result_id` text,
	`notes` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`result_id`) REFERENCES `work_order_result`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_work_order`("id", "customer_id", "created_at", "updated_at", "scheduled_date", "visit_date", "payment_order_id", "status", "result_id", "notes") SELECT "id", "customer_id", "created_at", "updated_at", "scheduled_date", "visit_date", "payment_order_id", "status", "result_id", "notes" FROM `work_order`;--> statement-breakpoint
DROP TABLE `work_order`;--> statement-breakpoint
ALTER TABLE `__new_work_order` RENAME TO `work_order`;