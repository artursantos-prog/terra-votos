ALTER TABLE `error_reports` ADD `evidencia_oficial_url` text;--> statement-breakpoint
ALTER TABLE `error_reports` ADD `situacao_oficial_verificada` varchar(255);--> statement-breakpoint
ALTER TABLE `error_reports` ADD `evidencia_verificada_em` timestamp;--> statement-breakpoint
ALTER TABLE `error_reports` ADD `decisao` enum('aprovado','recusado');--> statement-breakpoint
ALTER TABLE `error_reports` ADD `nota_decisao` text;--> statement-breakpoint
ALTER TABLE `error_reports` ADD `decisao_aplicada_em` timestamp;