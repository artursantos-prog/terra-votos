CREATE TABLE `candidate_social_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato` varchar(32) NOT NULL,
	`rede` varchar(128) NOT NULL,
	`url` varchar(512) NOT NULL,
	`fonte_atualizada_em` varchar(32),
	CONSTRAINT `candidate_social_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_social_url_unique` UNIQUE(`sq_candidato`,`url`)
);
--> statement-breakpoint
CREATE TABLE `government_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato` varchar(32) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`url_oficial` text NOT NULL,
	`fonte_atualizada_em` varchar(32),
	CONSTRAINT `government_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `government_plan_candidate_unique` UNIQUE(`sq_candidato`)
);
--> statement-breakpoint
ALTER TABLE `candidates` ADD `nr_candidato` varchar(32);--> statement-breakpoint
CREATE INDEX `candidate_social_candidate_idx` ON `candidate_social_profiles` (`sq_candidato`);--> statement-breakpoint
CREATE INDEX `government_plan_candidate_idx` ON `government_plans` (`sq_candidato`);