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

/** Registro imutável de cada tentativa de sincronização da base pública eleitoral. */
export const electionSyncRuns = mysqlTable("election_sync_runs", {
  id: int("id").autoincrement().primaryKey(),
  sourceName: varchar("source_name", { length: 120 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1024 }).notNull(),
  status: mysqlEnum("status", ["running", "succeeded", "failed"]).notNull(),
  dataUrl: varchar("data_url", { length: 1024 }),
  candidateCount: int("candidate_count").notNull().default(0),
  eligibleCount: int("eligible_count").notNull().default(0),
  socialProfileCount: int("social_profile_count").notNull().default(0),
  sourceGeneratedAt: timestamp("source_generated_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("election_sync_runs_status_created_idx").on(table.status, table.createdAt),
]);

/** Configuração única da atualização automática e referência à última base publicada. */
export const electionSyncConfig = mysqlTable("election_sync_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("config_key", { length: 64 }).notNull(),
  scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
  activeSyncRunId: int("active_sync_run_id"),
  lastSuccessfulAt: timestamp("last_successful_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("election_sync_config_key_uq").on(table.configKey),
  index("election_sync_config_task_uid_idx").on(table.scheduleCronTaskUid),
]);

/** Mensagem enviada pelo público para revisão editorial privada. */
export const candidateReports = mysqlTable("candidate_reports", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: varchar("candidate_id", { length: 32 }).notNull(),
  candidateName: varchar("candidate_name", { length: 255 }).notNull(),
  candidateNumber: varchar("candidate_number", { length: 16 }),
  candidateUf: varchar("candidate_uf", { length: 4 }),
  candidateOffice: varchar("candidate_office", { length: 80 }),
  category: varchar("category", { length: 80 }).notNull(),
  message: text("message").notNull(),
  contactEmail: varchar("contact_email", { length: 320 }),
  status: mysqlEnum("status", ["new", "in_review", "resolved"]).notNull().default("new"),
  reviewNote: text("review_note"),
  reviewedByUserId: int("reviewed_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("candidate_reports_status_created_idx").on(table.status, table.createdAt),
  index("candidate_reports_candidate_idx").on(table.candidateId),
]);

export type ElectionSyncRun = typeof electionSyncRuns.$inferSelect;
export type CandidateReport = typeof candidateReports.$inferSelect;
