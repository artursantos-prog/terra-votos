import { and, asc, count, desc, eq, inArray, like, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  candidates,
  candidateIdentityKeys,
  candidateSocialProfiles,
  candidateTicketMembers,
  electionSyncState,
  type CandidateCategory,
  type InsertUser,
  type ReportDecision,
  type ReportIssueType,
  type ReportStatus,
  errorReports,
  governmentPlans,
  siteFeedback,
  type FeedbackStatus,
  users,
} from "../drizzle/schema";
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

const TERMINAL_CANDIDATE_STATUSES = new Set([
  "INDEFERIDO",
  "RENUNCIA",
  "CASSADO",
  "CANCELADO",
  "FALECIDO",
  "PEDIDO NAO CONHECIDO",
]);

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function classifyCandidateStatus(status: string | null | undefined): CandidateCategory {
  const normalizedStatus = normalizeStatus(status);
  const isTerminalStatus = TERMINAL_CANDIDATE_STATUSES.has(normalizedStatus)
    || Array.from(TERMINAL_CANDIDATE_STATUSES).some(terminalStatus => normalizedStatus.startsWith(`${terminalStatus} `));
  return isTerminalStatus
    ? "fora_da_disputa"
    : "em_disputa";
}

export function isTerminalCandidateStatus(status: string | null | undefined): boolean {
  return classifyCandidateStatus(status) === "fora_da_disputa";
}

export type CandidateImportRecord = {
  sqCandidate: string;
  candidateName: string;
  ballotName: string;
  candidateNumber?: string | null;
  office: string;
  partyAcronym?: string | null;
  partyName?: string | null;
  uf?: string | null;
  officialStatus?: string | null;
  photoUrl?: string | null;
  sourceUpdatedAt?: string | null;
  personKey?: string | null;
};

/** Mantém uma foto oficial já importada quando a nova fonte não traz imagem. */
export function chooseOfficialPhotoUrl(
  existingPhotoUrl: string | null | undefined,
  incomingPhotoUrl: string | null | undefined,
): string | null {
  return incomingPhotoUrl?.trim() || existingPhotoUrl?.trim() || null;
}

export type CandidateFilters = {
  category: CandidateCategory;
  query?: string;
  uf?: string;
  office?: string;
  party?: string;
};

export type CandidateListInput = CandidateFilters & {
  page?: number;
};

export const CANDIDATES_PER_PAGE = 12;
export const OFFICIAL_CANDIDATE_ORDER = {
  primary: "candidateName",
  secondary: "ballotName",
} as const;

export const NON_VOTED_OFFICES = ["VICE-PRESIDENTE", "VICE-GOVERNADOR", "1º SUPLENTE", "2º SUPLENTE"] as const;
export const NATIONAL_CANDIDACY_UF = "BR";

export function isDirectlyVotedOffice(office: string): boolean {
  return !NON_VOTED_OFFICES.includes(office as (typeof NON_VOTED_OFFICES)[number]);
}

export type CandidateTicketMemberImportRecord = {
  principalSqCandidate: string;
  memberSqCandidate: string;
  memberOffice: string;
};

export type CandidateStatusImportRecord = {
  sqCandidate: string;
  officialStatus: string;
};

function isAwaitingOfficialStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === "#NE" || normalized === "AGUARDANDO JULGAMENTO";
}

/** Preserva a última situação oficial mais específica se o novo ZIP ainda trouxer apenas o status provisório. */
export function preserveCurrentOfficialStatus(incomingStatus: string | null | undefined, previousStatus: string | null | undefined): string | null {
  const normalizedIncomingStatus = incomingStatus || null;
  const normalizedPreviousStatus = previousStatus || null;
  return isAwaitingOfficialStatus(normalizedIncomingStatus ?? "") && normalizedPreviousStatus && !isAwaitingOfficialStatus(normalizedPreviousStatus)
    ? normalizedPreviousStatus
    : normalizedIncomingStatus;
}

export type TicketMemberSummary = {
  sqCandidate: string;
  candidateName: string;
  ballotName: string;
  office: string;
  partyAcronym: string | null;
  photoUrl: string | null;
};

export type CandidateReplacementSummary = {
  sqCandidate: string;
  ballotName: string;
  office: string;
  candidateNumber: string | null;
  partyAcronym: string | null;
};

export type CandidateWithTicketMembers = typeof candidates.$inferSelect & {
  ticketMembers: TicketMemberSummary[];
  replacementCandidate?: CandidateReplacementSummary | null;
};

export function getCandidatePagination(total: number, requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(total / CANDIDATES_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  return {
    total,
    page,
    pageSize: CANDIDATES_PER_PAGE,
    pageCount,
    offset: (page - 1) * CANDIDATES_PER_PAGE,
  };
}

export async function upsertCandidates(records: CandidateImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  for (let start = 0; start < records.length; start += 500) {
    const values = records.slice(start, start + 500).map(record => ({
      ...record,
      partyAcronym: record.partyAcronym || null,
      partyName: record.partyName || null,
      candidateNumber: record.candidateNumber || null,
      uf: record.uf || null,
      officialStatus: record.officialStatus || null,
      photoUrl: chooseOfficialPhotoUrl(null, record.photoUrl),
      sourceUpdatedAt: record.sourceUpdatedAt || null,
      category: classifyCandidateStatus(record.officialStatus),
    }));

    await db.insert(candidates).values(values).onDuplicateKeyUpdate({
      set: {
        candidateName: sql`VALUES(${candidates.candidateName})`,
        ballotName: sql`VALUES(${candidates.ballotName})`,
        candidateNumber: sql`VALUES(${candidates.candidateNumber})`,
        office: sql`VALUES(${candidates.office})`,
        partyAcronym: sql`VALUES(${candidates.partyAcronym})`,
        partyName: sql`VALUES(${candidates.partyName})`,
        uf: sql`VALUES(${candidates.uf})`,
        officialStatus: sql`VALUES(${candidates.officialStatus})`,
        category: sql`VALUES(${candidates.category})`,
        photoUrl: sql`COALESCE(NULLIF(VALUES(${candidates.photoUrl}), ''), ${candidates.photoUrl})`,
        sourceUpdatedAt: sql`VALUES(${candidates.sourceUpdatedAt})`,
      },
    });
  }
}

/** Substitui a lista de candidaturas pelo snapshot oficial atual do TSE. */
export async function replaceCandidates(records: CandidateImportRecord[]): Promise<void> {
  if (records.length === 0) throw new Error("Refusing to replace candidates with an empty official snapshot");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.transaction(async tx => {
    const previousStatuses = await tx.select({
      sqCandidate: candidates.sqCandidate,
      officialStatus: candidates.officialStatus,
    }).from(candidates);
    const previousStatusByCandidate = new Map(previousStatuses.map(candidate => [candidate.sqCandidate, candidate.officialStatus]));
    await tx.delete(candidates);
    for (let start = 0; start < records.length; start += 500) {
      const values = records.slice(start, start + 500).map(record => {
        const officialStatus = preserveCurrentOfficialStatus(
          record.officialStatus,
          previousStatusByCandidate.get(record.sqCandidate),
        );
        return {
          ...record,
          partyAcronym: record.partyAcronym || null,
          partyName: record.partyName || null,
          candidateNumber: record.candidateNumber || null,
          uf: record.uf || null,
          officialStatus,
          photoUrl: record.photoUrl || null,
          sourceUpdatedAt: record.sourceUpdatedAt || null,
          category: classifyCandidateStatus(officialStatus),
        };
      });
      await tx.insert(candidates).values(values).onDuplicateKeyUpdate({
        set: {
          candidateName: sql`VALUES(${candidates.candidateName})`,
          ballotName: sql`VALUES(${candidates.ballotName})`,
          candidateNumber: sql`VALUES(${candidates.candidateNumber})`,
          office: sql`VALUES(${candidates.office})`,
          partyAcronym: sql`VALUES(${candidates.partyAcronym})`,
          partyName: sql`VALUES(${candidates.partyName})`,
          uf: sql`VALUES(${candidates.uf})`,
          officialStatus: sql`VALUES(${candidates.officialStatus})`,
          category: sql`VALUES(${candidates.category})`,
          photoUrl: sql`VALUES(${candidates.photoUrl})`,
          sourceUpdatedAt: sql`VALUES(${candidates.sourceUpdatedAt})`,
        },
      });
    }
    await tx.delete(candidateIdentityKeys);
    const identityRecords = records.flatMap(record => record.personKey ? [{
      sqCandidate: record.sqCandidate,
      personKey: record.personKey,
    }] : []);
    for (let start = 0; start < identityRecords.length; start += 500) {
      const values = identityRecords.slice(start, start + 500);
      if (values.length) await tx.insert(candidateIdentityKeys).values(values);
    }
  });
}

/** Atualiza a situação publicada no detalhe do DivulgaCand sem substituir os demais dados do snapshot oficial. */
export async function updateCandidateOfficialStatuses(records: CandidateStatusImportRecord[]): Promise<void> {
  const db = await getDb();
  const meaningfulRecords = records.filter(record => !isAwaitingOfficialStatus(record.officialStatus));
  if (!db || meaningfulRecords.length === 0) return;
  await db.transaction(async tx => {
    for (let start = 0; start < meaningfulRecords.length; start += 250) {
      const batch = meaningfulRecords.slice(start, start + 250);
      const statusCases = sql.join(batch.map(record => sql`WHEN ${record.sqCandidate} THEN ${record.officialStatus}`), sql.raw(" "));
      const categoryCases = sql.join(batch.map(record => sql`WHEN ${record.sqCandidate} THEN ${classifyCandidateStatus(record.officialStatus)}`), sql.raw(" "));
      const ids = sql.join(batch.map(record => sql`${record.sqCandidate}`), sql.raw(", "));
      await tx.update(candidates).set({
        officialStatus: sql`CASE ${candidates.sqCandidate} ${statusCases} ELSE ${candidates.officialStatus} END`,
        category: sql`CASE ${candidates.sqCandidate} ${categoryCases} ELSE ${candidates.category} END`,
      }).where(sql`${candidates.sqCandidate} IN (${ids})`);
    }
  });
}

/** Obtém o snapshot persistido para relatar, ao responsável, as diferenças da próxima sincronização oficial. */
export async function getElectionSyncSnapshot() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [candidateRows, socialRows, planRows, ticketRows] = await Promise.all([
    db.select().from(candidates),
    db.select().from(candidateSocialProfiles),
    db.select().from(governmentPlans),
    db.select().from(candidateTicketMembers),
  ]);
  return { candidateRows, socialRows, planRows, ticketRows };
}

export async function listCandidates({ page: requestedPage = 1, ...filters }: CandidateListInput) {
  const db = await getDb();
  if (!db) return { items: [], ...getCandidatePagination(0, requestedPage) };

  const conditions: SQL[] = [
    eq(candidates.category, filters.category),
    notInArray(candidates.office, [...NON_VOTED_OFFICES]),
  ];
  if (filters.uf) conditions.push(eq(candidates.uf, filters.uf));
  if (filters.office) conditions.push(eq(candidates.office, filters.office));
  if (filters.party) conditions.push(eq(candidates.partyAcronym, filters.party));
  if (filters.query?.trim()) {
    const query = `%${filters.query.trim()}%`;
    conditions.push(or(
      like(candidates.ballotName, query),
      like(candidates.candidateName, query),
      like(candidates.sqCandidate, query),
    )!);
  }

  const totalRows = await db.select({ total: count() }).from(candidates)
    .where(and(...conditions));
  const pagination = getCandidatePagination(Number(totalRows[0]?.total ?? 0), requestedPage);
  const items = await db.select().from(candidates)
    .where(and(...conditions))
    .orderBy(
      asc(candidates[OFFICIAL_CANDIDATE_ORDER.primary]),
      asc(candidates[OFFICIAL_CANDIDATE_ORDER.secondary]),
    )
    .limit(CANDIDATES_PER_PAGE)
    .offset(pagination.offset);
  const principalIds = items.map(candidate => candidate.sqCandidate);
  const ticketRows = principalIds.length ? await db
    .select({
      principalSqCandidate: candidateTicketMembers.principalSqCandidate,
      sqCandidate: candidates.sqCandidate,
      candidateName: candidates.candidateName,
      ballotName: candidates.ballotName,
      office: candidates.office,
      partyAcronym: candidates.partyAcronym,
      photoUrl: candidates.photoUrl,
    })
    .from(candidateTicketMembers)
    .innerJoin(candidates, and(
      eq(candidateTicketMembers.memberSqCandidate, candidates.sqCandidate),
      eq(candidates.category, "em_disputa"),
    ))
    .where(inArray(candidateTicketMembers.principalSqCandidate, principalIds))
    .orderBy(asc(candidateTicketMembers.memberOffice), asc(candidates.candidateName)) : [];
  const ticketMembersByPrincipal = new Map<string, TicketMemberSummary[]>();
  for (const row of ticketRows) {
    const member: TicketMemberSummary = {
      sqCandidate: row.sqCandidate,
      candidateName: row.candidateName,
      ballotName: row.ballotName,
      office: row.office,
      partyAcronym: row.partyAcronym,
      photoUrl: row.photoUrl,
    };
    ticketMembersByPrincipal.set(row.principalSqCandidate, [
      ...(ticketMembersByPrincipal.get(row.principalSqCandidate) ?? []),
      member,
    ]);
  }
  const identityRows = filters.category === "fora_da_disputa" && principalIds.length ? await db
    .select().from(candidateIdentityKeys)
    .where(inArray(candidateIdentityKeys.sqCandidate, principalIds)) : [];
  const personKeys = Array.from(new Set(identityRows.map(row => row.personKey)));
  const replacementRows = personKeys.length ? await db
    .select({
      personKey: candidateIdentityKeys.personKey,
      sqCandidate: candidates.sqCandidate,
      ballotName: candidates.ballotName,
      office: candidates.office,
      candidateNumber: candidates.candidateNumber,
      partyAcronym: candidates.partyAcronym,
    })
    .from(candidateIdentityKeys)
    .innerJoin(candidates, and(
      eq(candidateIdentityKeys.sqCandidate, candidates.sqCandidate),
      eq(candidates.category, "em_disputa"),
    ))
    .where(inArray(candidateIdentityKeys.personKey, personKeys)) : [];
  const replacementByPersonKey = new Map<string, CandidateReplacementSummary | null>();
  for (const personKey of personKeys) {
    const matches = replacementRows.filter(row => row.personKey === personKey);
    replacementByPersonKey.set(personKey, matches.length === 1 ? {
      sqCandidate: matches[0].sqCandidate,
      ballotName: matches[0].ballotName,
      office: matches[0].office,
      candidateNumber: matches[0].candidateNumber,
      partyAcronym: matches[0].partyAcronym,
    } : null);
  }
  const replacementByPreviousSqCandidate = new Map(identityRows.map(row => [row.sqCandidate, replacementByPersonKey.get(row.personKey) ?? null]));
  return {
    items: items.map(candidate => ({
      ...candidate,
      ticketMembers: ticketMembersByPrincipal.get(candidate.sqCandidate) ?? [],
      replacementCandidate: replacementByPreviousSqCandidate.get(candidate.sqCandidate) ?? null,
    })),
    ...pagination,
  };
}

export async function getCandidateBySqCandidate(sqCandidate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(candidates)
    .where(eq(candidates.sqCandidate, sqCandidate))
    .limit(1);
  return result[0];
}

export async function getCandidateDetails(sqCandidate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [candidate] = await db.select().from(candidates)
    .where(eq(candidates.sqCandidate, sqCandidate))
    .limit(1);
  if (!candidate) return undefined;

  const [socialProfiles, plans, ticketMembers] = await Promise.all([
    db.select().from(candidateSocialProfiles)
      .where(eq(candidateSocialProfiles.sqCandidate, sqCandidate))
      .orderBy(asc(candidateSocialProfiles.label)),
    db.select().from(governmentPlans)
      .where(eq(governmentPlans.sqCandidate, sqCandidate))
      .limit(1),
    db.select({
      sqCandidate: candidates.sqCandidate,
      candidateName: candidates.candidateName,
      ballotName: candidates.ballotName,
      office: candidates.office,
      partyAcronym: candidates.partyAcronym,
      photoUrl: candidates.photoUrl,
    })
      .from(candidateTicketMembers)
      .innerJoin(candidates, and(
        eq(candidateTicketMembers.memberSqCandidate, candidates.sqCandidate),
        eq(candidates.category, "em_disputa"),
      ))
      .where(eq(candidateTicketMembers.principalSqCandidate, sqCandidate))
      .orderBy(asc(candidateTicketMembers.memberOffice), asc(candidates.candidateName)),
  ]);
  return { candidate, socialProfiles, governmentPlan: plans[0] ?? null, ticketMembers };
}

export async function getCandidateStats() {
  const db = await getDb();
  if (!db) return { emDisputa: 0, foraDaDisputa: 0, total: 0, sourceUpdatedAt: null, lastSuccessfulSyncAt: null, lastSyncFailedAt: null };
  const [grouped, latestSource, syncState] = await Promise.all([
    db.select({ category: candidates.category, total: count() })
      .from(candidates)
      .where(notInArray(candidates.office, [...NON_VOTED_OFFICES]))
      .groupBy(candidates.category),
    db.select({ sourceUpdatedAt: sql<string | null>`MAX(${candidates.sourceUpdatedAt})` }).from(candidates),
    db.select().from(electionSyncState).where(eq(electionSyncState.syncKey, "official-tse-2026")).limit(1),
  ]);
  const emDisputa = grouped.find(row => row.category === "em_disputa")?.total ?? 0;
  const foraDaDisputa = grouped.find(row => row.category === "fora_da_disputa")?.total ?? 0;
  return {
    emDisputa,
    foraDaDisputa,
    total: emDisputa + foraDaDisputa,
    sourceUpdatedAt: syncState[0]?.sourceUpdatedAt ?? latestSource[0]?.sourceUpdatedAt ?? null,
    lastSuccessfulSyncAt: syncState[0]?.lastSuccessAt ?? null,
    lastSyncFailedAt: syncState[0]?.lastFailureAt ?? null,
  };
}

export async function getCandidateFilterOptions(category: CandidateCategory) {
  const db = await getDb();
  if (!db) return { ufs: [], offices: [], parties: [] };

  const [ufs, offices, parties] = await Promise.all([
    db.selectDistinct({ value: candidates.uf }).from(candidates)
      .where(and(
        eq(candidates.category, category),
        notInArray(candidates.office, [...NON_VOTED_OFFICES]),
        ne(candidates.uf, NATIONAL_CANDIDACY_UF),
      )).orderBy(asc(candidates.uf)),
    db.selectDistinct({ value: candidates.office }).from(candidates)
      .where(and(eq(candidates.category, category), notInArray(candidates.office, [...NON_VOTED_OFFICES]))).orderBy(asc(candidates.office)),
    db.selectDistinct({ value: candidates.partyAcronym }).from(candidates)
      .where(and(eq(candidates.category, category), notInArray(candidates.office, [...NON_VOTED_OFFICES]))).orderBy(asc(candidates.partyAcronym)),
  ]);

  return {
    ufs: ufs.flatMap(row => row.value ? [row.value] : []),
    offices: offices.flatMap(row => row.value ? [row.value] : []),
    parties: parties.flatMap(row => row.value ? [row.value] : []),
  };
}

export type CandidateSocialImportRecord = {
  sqCandidate: string;
  label: string;
  url: string;
  sourceUpdatedAt?: string | null;
};

export type GovernmentPlanImportRecord = {
  sqCandidate: string;
  title: string;
  officialUrl: string;
  sourceUpdatedAt?: string | null;
};

export async function upsertCandidateSocialProfiles(records: CandidateSocialImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db || records.length === 0) return;
  for (let start = 0; start < records.length; start += 500) {
    const values = records.slice(start, start + 500).map(record => ({
      ...record,
      sourceUpdatedAt: record.sourceUpdatedAt || null,
    }));
    await db.insert(candidateSocialProfiles).values(values).onDuplicateKeyUpdate({
      set: {
        label: sql`VALUES(${candidateSocialProfiles.label})`,
        sourceUpdatedAt: sql`VALUES(${candidateSocialProfiles.sourceUpdatedAt})`,
      },
    });
  }
}

/** Substitui o conjunto de perfis pelo snapshot oficial atual, removendo URLs que o TSE deixou de publicar. */
export async function replaceCandidateSocialProfiles(records: CandidateSocialImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.transaction(async tx => {
    await tx.delete(candidateSocialProfiles);
    for (let start = 0; start < records.length; start += 500) {
      const values = records.slice(start, start + 500).map(record => ({
        ...record,
        sourceUpdatedAt: record.sourceUpdatedAt || null,
      }));
      await tx.insert(candidateSocialProfiles).values(values).onDuplicateKeyUpdate({
        set: {
          label: sql`VALUES(${candidateSocialProfiles.label})`,
          sourceUpdatedAt: sql`VALUES(${candidateSocialProfiles.sourceUpdatedAt})`,
        },
      });
    }
  });
}

export async function upsertGovernmentPlans(records: GovernmentPlanImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db || records.length === 0) return;
  for (let start = 0; start < records.length; start += 500) {
    const values = records.slice(start, start + 500).map(record => ({
      ...record,
      sourceUpdatedAt: record.sourceUpdatedAt || null,
    }));
    await db.insert(governmentPlans).values(values).onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(${governmentPlans.title})`,
        officialUrl: sql`VALUES(${governmentPlans.officialUrl})`,
        sourceUpdatedAt: sql`VALUES(${governmentPlans.sourceUpdatedAt})`,
      },
    });
  }
}

/** Substitui os planos de governo pelo conjunto presente no arquivo complementar oficial. */
export async function replaceGovernmentPlans(records: GovernmentPlanImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.transaction(async tx => {
    await tx.delete(governmentPlans);
    for (let start = 0; start < records.length; start += 500) {
      const values = records.slice(start, start + 500).map(record => ({
        ...record,
        sourceUpdatedAt: record.sourceUpdatedAt || null,
      }));
      await tx.insert(governmentPlans).values(values).onDuplicateKeyUpdate({
        set: {
          title: sql`VALUES(${governmentPlans.title})`,
          officialUrl: sql`VALUES(${governmentPlans.officialUrl})`,
          sourceUpdatedAt: sql`VALUES(${governmentPlans.sourceUpdatedAt})`,
        },
      });
    }
  });
}

/** Substitui a composição de chapas oficial, mantendo os vices exclusivamente vinculados aos titulares. */
export async function replaceCandidateTicketMembers(records: CandidateTicketMemberImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.transaction(async tx => {
    await tx.delete(candidateTicketMembers);
    for (let start = 0; start < records.length; start += 500) {
      const values = records.slice(start, start + 500);
      if (values.length) await tx.insert(candidateTicketMembers).values(values);
    }
  });
}

/** Atualiza vínculos recuperados sem apagar a última composição válida quando a fonte oficial responde parcialmente. */
export async function upsertCandidateTicketMembers(records: CandidateTicketMemberImportRecord[]): Promise<void> {
  const db = await getDb();
  if (!db || records.length === 0) return;
  for (let start = 0; start < records.length; start += 500) {
    const values = records.slice(start, start + 500);
    await db.insert(candidateTicketMembers).values(values).onDuplicateKeyUpdate({
      set: { memberOffice: sql`VALUES(${candidateTicketMembers.memberOffice})` },
    });
  }
}

export async function recordElectionSyncSuccess(input: {
  sourceUpdatedAt: string | null;
  candidatesImported: number;
  socialProfilesImported: number;
  governmentPlansImported: number;
  ticketMembersImported: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = new Date();
  const values = {
    syncKey: "official-tse-2026",
    lastAttemptAt: now,
    lastSuccessAt: now,
    lastFailureAt: null,
    sourceUpdatedAt: input.sourceUpdatedAt,
    candidatesImported: input.candidatesImported,
    socialProfilesImported: input.socialProfilesImported,
    governmentPlansImported: input.governmentPlansImported,
    ticketMembersImported: input.ticketMembersImported,
    lastError: null,
  };
  await db.insert(electionSyncState).values(values).onDuplicateKeyUpdate({ set: values });
}

export async function recordElectionSyncFailure(message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const now = new Date();
  const values = {
    syncKey: "official-tse-2026",
    lastAttemptAt: now,
    lastFailureAt: now,
    lastError: message.slice(0, 4000),
  };
  await db.insert(electionSyncState).values(values).onDuplicateKeyUpdate({ set: values });
}

export async function createErrorReport(input: {
  sqCandidate: string;
  candidateName: string;
  issueType: ReportIssueType;
  description?: string | null;
  contactEmail?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(errorReports).values({
    sqCandidate: input.sqCandidate,
    candidateName: input.candidateName,
    issueType: input.issueType,
    description: input.description || null,
    contactEmail: input.contactEmail || null,
  });
}

export async function listErrorReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(errorReports).orderBy(desc(errorReports.createdAt));
}

export async function updateErrorReportStatus(id: number, status: ReportStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(errorReports).set({ status }).where(eq(errorReports.id, id));
}

/** Exclui um reporte administrativo sem modificar a candidatura oficial. */
export async function deleteErrorReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(errorReports).where(eq(errorReports.id, id));
}

export async function getErrorReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [report] = await db.select().from(errorReports).where(eq(errorReports.id, id)).limit(1);
  return report;
}

export async function recordOfficialReportEvidence(input: {
  id: number;
  evidenceUrl: string | null;
  officialStatus: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(errorReports).set({
    officialEvidenceUrl: input.evidenceUrl,
    officialEvidenceStatus: input.officialStatus,
    officialEvidenceCheckedAt: new Date(),
    status: "verificado",
  }).where(eq(errorReports.id, input.id));
}

export async function decideErrorReport(input: {
  id: number;
  decision: ReportDecision;
  note?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [report] = await db.select().from(errorReports).where(eq(errorReports.id, input.id)).limit(1);
  if (!report) throw new Error("Reporte não encontrado.");
  if (!report.officialEvidenceCheckedAt) throw new Error("Consulte primeiro a evidência oficial do TSE.");

  const now = new Date();
  await db.transaction(async tx => {
    await tx.update(errorReports).set({
      decision: input.decision,
      decisionNote: input.note?.trim() || null,
      decisionAppliedAt: now,
      status: "resolvido",
    }).where(eq(errorReports.id, input.id));

    if (input.decision === "aprovado" && report.officialEvidenceStatus) {
      await tx.update(candidates).set({
        officialStatus: report.officialEvidenceStatus,
        category: classifyCandidateStatus(report.officialEvidenceStatus),
      }).where(eq(candidates.sqCandidate, report.sqCandidate));
    }
  });

  return { appliedOfficialStatus: input.decision === "aprovado" ? report.officialEvidenceStatus : null };
}

export async function createSiteFeedback(input: { message: string; contactEmail?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(siteFeedback).values({
    message: input.message,
    contactEmail: input.contactEmail || null,
  });
}

export async function listSiteFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteFeedback).orderBy(desc(siteFeedback.createdAt));
}

export async function updateSiteFeedbackStatus(id: number, status: FeedbackStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(siteFeedback).set({ status }).where(eq(siteFeedback.id, id));
}

/** Exclui uma sugestão administrativa sem alterar dados eleitorais. */
export async function deleteSiteFeedback(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(siteFeedback).where(eq(siteFeedback.id, id));
}
