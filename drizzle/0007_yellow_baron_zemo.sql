CREATE TABLE `candidate_identity_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sq_candidato` varchar(32) NOT NULL,
	`chave_pessoa` varchar(64) NOT NULL,
	CONSTRAINT `candidate_identity_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_identity_candidate_unique` UNIQUE(`sq_candidato`)
);
--> statement-breakpoint
CREATE INDEX `candidate_identity_person_key_idx` ON `candidate_identity_keys` (`chave_pessoa`);