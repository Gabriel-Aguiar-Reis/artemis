PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customer` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`store_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`phone_number` text,
	`phone_is_whatsapp` integer,
	`landline_number` text,
	`landline_is_whatsapp` integer,
	`address_street_name` text NOT NULL,
	`address_street_number` text NOT NULL,
	`address_neighborhood` text NOT NULL,
	`address_city` text NOT NULL,
	`address_state` text NOT NULL,
	`address_zip_code` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customer`("id", "store_name", "contact_name", "phone_number", "phone_is_whatsapp", "landline_number", "landline_is_whatsapp", "address_street_name", "address_street_number", "address_neighborhood", "address_city", "address_state", "address_zip_code") SELECT "id", "store_name", "contact_name", "phone_number", "phone_is_whatsapp", "landline_number", "landline_is_whatsapp", "address_street_name", "address_street_number", "address_neighborhood", "address_city", "address_state", "address_zip_code" FROM `customer`;--> statement-breakpoint
DROP TABLE `customer`;--> statement-breakpoint
ALTER TABLE `__new_customer` RENAME TO `customer`;--> statement-breakpoint
PRAGMA foreign_keys=ON;