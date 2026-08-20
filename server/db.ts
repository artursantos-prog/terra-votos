import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { candidateReports, electionSyncConfig, electionSyncRuns, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPublishedElectionSnapshot() {
  const db = await getDb();
  if (!db) return undefined;
  const config = await db.select().from(electionSyncConfig).where(eq(electionSyncConfig.configKey, "primary")).limit(1);
  if (!config[0]?.activeSyncRunId) return undefined;
  const run = await db.select().from(electionSyncRuns).where(eq(electionSyncRuns.id, config[0].activeSyncRunId)).limit(1);
  return run[0];
}

export async function getElectionSyncConfigByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const config = await db.select().from(electionSyncConfig)
    .where(eq(electionSyncConfig.scheduleCronTaskUid, taskUid)).limit(1);
  return config[0];
}

export async function listElectionSyncRuns(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(electionSyncRuns).orderBy(desc(electionSyncRuns.createdAt)).limit(limit);
}

export async function startElectionSync(sourceName: string, sourceUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para sincronização.");
  const result = await db.insert(electionSyncRuns).values({ sourceName, sourceUrl, status: "running" });
  return Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
}

export async function completeElectionSync(input: {
  runId: number;
  dataUrl: string;
  candidateCount: number;
  eligibleCount: number;
  socialProfileCount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para publicação.");
  const completedAt = new Date();
  await db.update(electionSyncRuns).set({ ...input, status: "succeeded", completedAt }).where(eq(electionSyncRuns.id, input.runId));
  await db.insert(electionSyncConfig).values({
    configKey: "primary",
    activeSyncRunId: input.runId,
    lastSuccessfulAt: completedAt,
  }).onDuplicateKeyUpdate({
    set: { activeSyncRunId: input.runId, lastSuccessfulAt: completedAt },
  });
}

export async function failElectionSync(runId: number, errorMessage: string) {
  const db = await getDb();
  if (!db || !runId) return;
  await db.update(electionSyncRuns).set({ status: "failed", errorMessage: errorMessage.slice(0, 5000), completedAt: new Date() }).where(eq(electionSyncRuns.id, runId));
}

export async function createCandidateReport(input: {
  candidateId: string;
  candidateName: string;
  candidateNumber?: string;
  candidateUf?: string;
  candidateOffice?: string;
  category: string;
  message: string;
  contactEmail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para receber o apontamento.");
  await db.insert(candidateReports).values(input);
}

export async function listCandidateReports(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(candidateReports).orderBy(desc(candidateReports.createdAt)).limit(limit);
}

export async function reviewCandidateReport(input: {
  id: number;
  status: "new" | "in_review" | "resolved";
  reviewNote?: string;
  reviewerId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para revisar o apontamento.");
  await db.update(candidateReports).set({
    status: input.status,
    reviewNote: input.reviewNote ?? null,
    reviewedByUserId: input.reviewerId,
  }).where(eq(candidateReports.id, input.id));
}
