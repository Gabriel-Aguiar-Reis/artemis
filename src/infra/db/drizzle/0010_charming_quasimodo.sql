CREATE INDEX `idx_category_name` ON `category` (`name`);--> statement-breakpoint
CREATE INDEX `idx_customer_store_name` ON `customer` (`store_name`);--> statement-breakpoint
CREATE INDEX `idx_customer_contact_name` ON `customer` (`contact_name`);--> statement-breakpoint
CREATE INDEX `idx_customer_phone_number` ON `customer` (`phone_number`);--> statement-breakpoint
CREATE INDEX `idx_customer_landline_number` ON `customer` (`landline_number`);--> statement-breakpoint
CREATE INDEX `idx_product_name` ON `product` (`name`);--> statement-breakpoint
CREATE INDEX `idx_product_sale_price` ON `product` (`sale_price`);--> statement-breakpoint
CREATE INDEX `idx_product_category_id` ON `product` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_scheduled_date` ON `work_order` (`scheduled_date`);--> statement-breakpoint
CREATE INDEX `idx_work_order_visit_date` ON `work_order` (`visit_date`);--> statement-breakpoint
CREATE INDEX `idx_work_order_status` ON `work_order` (`status`);--> statement-breakpoint
CREATE INDEX `idx_work_order_customer_id` ON `work_order` (`customer_id`);