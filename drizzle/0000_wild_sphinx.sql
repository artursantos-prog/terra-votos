CREATE TABLE `candidate_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidate_id` varchar(32) NOT NULL,
	`candidate_name` varchar(255) NOT NULL,
	`candidate_number` varchar(16),
	`candidate_uf` varchar(4),
	`candidate_office` varchar(80),
	`category` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`contact_email` varchar(320),
	`status` enum('new','in_review','resolved') NOT NULL DEFAULT 'new',
	`review_note` text,
	`reviewed_by_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_sync_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(64) NOT NULL,
	`schedule_cron_task_uid` varchar(65),
	`active_sync_run_id` int,
	`last_successful_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `election_sync_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_sync_config_key_uq` UNIQUE(`config_key`)
);
--> statement-breakpoint
CREATE TABLE `election_sync_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_name` varchar(120) NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`status` enum('running','succeeded','failed') NOT NULL,
	`data_url` varchar(1024),
	`candidate_count` int NOT NULL DEFAULT 0,
	`eligible_count` int NOT NULL DEFAULT 0,
	`social_profile_count` int NOT NULL DEFAULT 0,
	`source_generated_at` timestamp,
	`completed_at` timestamp,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_sync_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `candidate_reports_status_created_idx` ON `candidate_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `candidate_reports_candidate_idx` ON `candidate_reports` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `election_sync_config_task_uid_idx` ON `election_sync_config` (`schedule_cron_task_uid`);--> statement-breakpoint
CREATE INDEX `election_sync_runs_status_created_idx` ON `election_sync_runs` (`status`,`created_at`);