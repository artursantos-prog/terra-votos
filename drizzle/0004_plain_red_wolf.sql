CREATE TABLE `site_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mensagem` text NOT NULL,
	`email_contato` varchar(320),
	`status` enum('pendente','verificado','resolvido') NOT NULL DEFAULT 'pendente',
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `site_feedback_status_idx` ON `site_feedback` (`status`);