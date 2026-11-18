CREATE INDEX `idx_itinerary_work_order_itinerary_position` ON `itinerary_work_order` (`itinerary_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_itinerary_work_order_work_order_id` ON `itinerary_work_order` (`work_order_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_item_work_order_id` ON `work_order_item` (`work_order_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_item_product_id` ON `work_order_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_result_item_result_id` ON `work_order_result_item` (`result_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_result_item_product_id` ON `work_order_result_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_result_id` ON `work_order` (`result_id`);--> statement-breakpoint
CREATE INDEX `idx_work_order_payment_order_id` ON `work_order` (`payment_order_id`);--> statement-breakpoint
UPDATE `work_order` SET `status` = upper(`status`) WHERE `status` <> upper(`status`);