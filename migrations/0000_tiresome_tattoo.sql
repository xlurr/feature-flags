CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flag_id` integer,
	`actor_id` integer,
	`environment_id` integer,
	`event_type` text NOT NULL,
	`diff_payload` text DEFAULT '{}',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`env_key` text NOT NULL,
	`name` text NOT NULL,
	`client_api_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`author_id` integer,
	`flag_key` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`is_permanent` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flag_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flag_id` integer NOT NULL,
	`environment_id` integer NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`targeting_rules` text DEFAULT '[]',
	`rollout_weight` integer DEFAULT 100,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_key` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_project_key_unique` ON `projects` (`project_key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'developer' NOT NULL,
	`full_name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);