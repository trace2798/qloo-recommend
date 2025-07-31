CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_message_userid_createdat` ON `message` (`user_id`,`created_at`);