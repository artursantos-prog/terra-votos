CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato` varchar(32) NOT NULL,
	`nm_candidato` varchar(255) NOT NULL,
	`nm_urna_candidato` varchar(255) NOT NULL,
	`ds_cargo` varchar(128) NOT NULL,
	`sg_partido` varchar(32),
	`nm_partido` varchar(255),
	`sg_uf` varchar(2),
	`ds_situacao_candidatura` varchar(255),
	`candidate_category` enum('em_disputa','fora_da_disputa') NOT NULL DEFAULT 'em_disputa',
	`foto_url` text,
	`fonte_atualizada_em` varchar(32),
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_sq_candidate_unique` UNIQUE(`sq_candidato`)
);
--> statement-breakpoint
CREATE TABLE `error_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato` varchar(32) NOT NULL,
	`nm_candidato` varchar(255) NOT NULL,
	`report_issue_type` enum('nao_esta_concorrendo','informacao_incorreta') NOT NULL,
	`descricao` text,
	`email_contato` varchar(320),
	`report_status` enum('pendente','verificado','resolvido') NOT NULL DEFAULT 'pendente',
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `candidates_category_idx` ON `candidates` (`candidate_category`);--> statement-breakpoint
CREATE INDEX `candidates_uf_idx` ON `candidates` (`sg_uf`);--> statement-breakpoint
CREATE INDEX `candidates_office_idx` ON `candidates` (`ds_cargo`);--> statement-breakpoint
CREATE INDEX `error_reports_status_idx` ON `error_reports` (`report_status`);--> statement-breakpoint
CREATE INDEX `error_reports_candidate_idx` ON `error_reports` (`sq_candidato`);