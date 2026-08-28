import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const candidateCategoryValues = ["em_disputa", "fora_da_disputa"] as const;

export const reportIssueTypeValues = ["nao_esta_concorrendo", "informacao_incorreta"] as const;

export const reportStatusValues = ["pendente", "verificado", "resolvido"] as const;

export const reportDecisionValues = ["aprovado", "recusado"] as const;

export const feedbackStatusValues = ["pendente", "verificado", "resolvido"] as const;

export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  sqCandidate: varchar("sq_candidato", { length: 32 }).notNull(),
  candidateName: varchar("nm_candidato", { length: 255 }).notNull(),
  ballotName: varchar("nm_urna_candidato", { length: 255 }).notNull(),
  candidateNumber: varchar("nr_candidato", { length: 32 }),
  office: varchar("ds_cargo", { length: 128 }).notNull(),
  partyAcronym: varchar("sg_partido", { length: 32 }),
  partyName: varchar("nm_partido", { length: 255 }),
  uf: varchar("sg_uf", { length: 2 }),
  officialStatus: varchar("ds_situacao_candidatura", { length: 255 }),
  category: mysqlEnum("candidate_category", candidateCategoryValues).notNull().default("em_disputa"),
  photoUrl: text("foto_url"),
  sourceUpdatedAt: varchar("fonte_atualizada_em", { length: 32 }),
  createdAt: timestamp("criado_em").defaultNow().notNull(),
  updatedAt: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("candidates_sq_candidate_unique").on(table.sqCandidate),
  index("candidates_category_idx").on(table.category),
  index("candidates_uf_idx").on(table.uf),
  index("candidates_office_idx").on(table.office),
]);

/** Vínculo interno pseudonimizado entre registros oficiais da mesma pessoa, sem exposição na API pública. */
export const candidateIdentityKeys = mysqlTable("candidate_identity_keys", {
  id: int("id").autoincrement().primaryKey(),
  sqCandidate: varchar("sq_candidato", { length: 32 }).notNull(),
  personKey: varchar("chave_pessoa", { length: 64 }).notNull(),
}, table => [
  uniqueIndex("candidate_identity_candidate_unique").on(table.sqCandidate),
  index("candidate_identity_person_key_idx").on(table.personKey),
]);

export const candidateSocialProfiles = mysqlTable("candidate_social_profiles", {
  id: int("id").autoincrement().primaryKey(),
  sqCandidate: varchar("sq_candidato", { length: 32 }).notNull(),
  label: varchar("rede", { length: 128 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  sourceUpdatedAt: varchar("fonte_atualizada_em", { length: 32 }),
}, table => [
  uniqueIndex("candidate_social_url_unique").on(table.sqCandidate, table.url),
  index("candidate_social_candidate_idx").on(table.sqCandidate),
]);

export const governmentPlans = mysqlTable("government_plans", {
  id: int("id").autoincrement().primaryKey(),
  sqCandidate: varchar("sq_candidato", { length: 32 }).notNull(),
  title: varchar("titulo", { length: 255 }).notNull(),
  officialUrl: text("url_oficial").notNull(),
  sourceUpdatedAt: varchar("fonte_atualizada_em", { length: 32 }),
}, table => [
  uniqueIndex("government_plan_candidate_unique").on(table.sqCandidate),
  index("government_plan_candidate_idx").on(table.sqCandidate),
]);

export const candidateTicketMembers = mysqlTable("candidate_ticket_members", {
  id: int("id").autoincrement().primaryKey(),
  principalSqCandidate: varchar("sq_candidato_titular", { length: 32 }).notNull(),
  memberSqCandidate: varchar("sq_candidato_membro", { length: 32 }).notNull(),
  memberOffice: varchar("cargo_membro", { length: 128 }).notNull(),
  createdAt: timestamp("criado_em").defaultNow().notNull(),
  updatedAt: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("candidate_ticket_principal_member_unique").on(table.principalSqCandidate, table.memberSqCandidate),
  index("candidate_ticket_principal_idx").on(table.principalSqCandidate),
  index("candidate_ticket_member_idx").on(table.memberSqCandidate),
]);

export const electionSyncState = mysqlTable("election_sync_state", {
  id: int("id").autoincrement().primaryKey(),
  syncKey: varchar("chave", { length: 64 }).notNull(),
  lastAttemptAt: timestamp("ultima_tentativa_em"),
  lastSuccessAt: timestamp("ultima_sincronizacao_bem_sucedida_em"),
  lastFailureAt: timestamp("ultima_falha_em"),
  sourceUpdatedAt: varchar("fonte_atualizada_em", { length: 32 }),
  candidatesImported: int("candidaturas_importadas").notNull().default(0),
  socialProfilesImported: int("redes_importadas").notNull().default(0),
  governmentPlansImported: int("planos_importados").notNull().default(0),
  ticketMembersImported: int("membros_de_chapa_importados").notNull().default(0),
  lastError: text("ultimo_erro"),
  updatedAt: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("election_sync_state_key_unique").on(table.syncKey),
]);

export const errorReports = mysqlTable("error_reports", {
  id: int("id").autoincrement().primaryKey(),
  sqCandidate: varchar("sq_candidato", { length: 32 }).notNull(),
  candidateName: varchar("nm_candidato", { length: 255 }).notNull(),
  issueType: mysqlEnum("tipo_problema", reportIssueTypeValues).notNull(),
  description: text("descricao"),
  contactEmail: varchar("email_contato", { length: 320 }),
  status: mysqlEnum("status", reportStatusValues).notNull().default("pendente"),
  officialEvidenceUrl: text("evidencia_oficial_url"),
  officialEvidenceStatus: varchar("situacao_oficial_verificada", { length: 255 }),
  officialEvidenceCheckedAt: timestamp("evidencia_verificada_em"),
  decision: mysqlEnum("decisao", reportDecisionValues),
  decisionNote: text("nota_decisao"),
  decisionAppliedAt: timestamp("decisao_aplicada_em"),
  createdAt: timestamp("criado_em").defaultNow().notNull(),
}, table => [
  index("error_reports_status_idx").on(table.status),
  index("error_reports_candidate_idx").on(table.sqCandidate),
]);

export const siteFeedback = mysqlTable("site_feedback", {
  id: int("id").autoincrement().primaryKey(),
  message: text("mensagem").notNull(),
  contactEmail: varchar("email_contato", { length: 320 }),
  status: mysqlEnum("status", feedbackStatusValues).notNull().default("pendente"),
  createdAt: timestamp("criado_em").defaultNow().notNull(),
}, table => [
  index("site_feedback_status_idx").on(table.status),
]);

export type Candidate = typeof candidates.$inferSelect;
export type CandidateSocialProfile = typeof candidateSocialProfiles.$inferSelect;
export type GovernmentPlan = typeof governmentPlans.$inferSelect;
export type CandidateTicketMember = typeof candidateTicketMembers.$inferSelect;
export type CandidateIdentityKey = typeof candidateIdentityKeys.$inferSelect;
export type ElectionSyncState = typeof electionSyncState.$inferSelect;
export type ErrorReport = typeof errorReports.$inferSelect;
export type SiteFeedback = typeof siteFeedback.$inferSelect;
export type CandidateCategory = (typeof candidateCategoryValues)[number];
export type ReportIssueType = (typeof reportIssueTypeValues)[number];
export type ReportStatus = (typeof reportStatusValues)[number];
export type ReportDecision = (typeof reportDecisionValues)[number];
export type FeedbackStatus = (typeof feedbackStatusValues)[number];
