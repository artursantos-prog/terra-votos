CREATE TABLE `candidate_ticket_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato_titular` varchar(32) NOT NULL,
	`sq_candidato_membro` varchar(32) NOT NULL,
	`cargo_membro` varchar(128) NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_ticket_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_ticket_principal_member_unique` UNIQUE(`sq_candidato_titular`,`sq_candidato_membro`)
);
--> statement-breakpoint
CREATE TABLE `election_sync_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(64) NOT NULL,
	`ultima_tentativa_em` timestamp,
	`ultima_sincronizacao_bem_sucedida_em` timestamp,
	`ultima_falha_em` timestamp,
	`fonte_atualizada_em` varchar(32),
	`candidaturas_importadas` int NOT NULL DEFAULT 0,
	`redes_importadas` int NOT NULL DEFAULT 0,
	`planos_importados` int NOT NULL DEFAULT 0,
	`membros_de_chapa_importados` int NOT NULL DEFAULT 0,
	`ultimo_erro` text,
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `election_sync_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `election_sync_state_key_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE INDEX `candidate_ticket_principal_idx` ON `candidate_ticket_members` (`sq_candidato_titular`);--> statement-breakpoint
CREATE INDEX `candidate_ticket_member_idx` ON `candidate_ticket_members` (`sq_candidato_membro`);