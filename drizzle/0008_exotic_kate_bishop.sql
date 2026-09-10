CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(128) NOT NULL,
	`habilitado` boolean NOT NULL DEFAULT false,
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`chave`)
);
