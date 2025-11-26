CREATE TABLE `category` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`store_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`phone_number` text NOT NULL,
	`phone_is_whatsapp` integer DEFAULT false NOT NULL,
	`landline_number` text,
	`landline_is_whatsapp` integer,
	`address_street_name` text NOT NULL,
	`address_street_number` integer NOT NULL,
	`address_neighborhood` text NOT NULL,
	`address_city` text NOT NULL,
	`address_state` text NOT NULL,
	`address_zip_code` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `itinerary_work_orders` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`itinerary_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`position` integer NOT NULL,
	`is_late` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itinerary`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `itinerary` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`initial_itinerary_date` text NOT NULL,
	`final_itinerary_date` text NOT NULL,
	`is_finished` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_order` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`method` text NOT NULL,
	`total_value` real NOT NULL,
	`installments` integer DEFAULT 1 NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`paid_installments` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`sale_price` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`expiration` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_items` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`work_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_snapshot` real NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_result_items` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE `work_order_result` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`total_value` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_order` (
	`id` text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	`customer_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`scheduled_date` text NOT NULL,
	`visit_date` text,
	`payment_order_id` text,
	`status` text NOT NULL,
	`result_id` text,
	`notes` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`result_id`) REFERENCES `work_order_result`(`id`) ON UPDATE no action ON DELETE no action
);
