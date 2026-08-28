ALTER TABLE `error_reports` RENAME COLUMN `report_issue_type` TO `tipo_problema`;--> statement-breakpoint
ALTER TABLE `error_reports` RENAME COLUMN `report_status` TO `status`;--> statement-breakpoint
DROP INDEX `error_reports_status_idx` ON `error_reports`;--> statement-breakpoint
CREATE INDEX `error_reports_status_idx` ON `error_reports` (`status`);