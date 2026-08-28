import type { Request, Response } from "express";
import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { candidates } from "../drizzle/schema";
import {
  type CandidateImportRecord,
  type CandidateSocialImportRecord,
  type CandidateStatusImportRecord,
  type CandidateTicketMemberImportRecord,
  type GovernmentPlanImportRecord,
  chooseOfficialPhotoUrl,
  getDb,
  getElectionSyncSnapshot,
  isDirectlyVotedOffice,
  isTerminalCandidateStatus,
  recordElectionSyncFailure,
  recordElectionSyncSuccess,
  replaceCandidates,
  replaceCandidateSocialProfiles,
  replaceCandidateTicketMembers,
  replaceGovernmentPlans,
  updateCandidateOfficialStatuses,
  upsertCandidateTicketMembers,
  upsertGovernmentPlans,
} from "./db";
import { sdk } from "./_core/sdk";
import { sendOwnerEmail } from "./ownerEmail";
import { publishGithubFallbackSnapshot } from "./githubFallback";
import { fetchOfficialTseSupplement } from "./officialTseDetails";

const syncPayloadSchema = z.object({
  candidatesUrl: z.string().url(),
  complementaryUrl: z.string().url(),
  socialUrl: z.string().url(),
}).strict();

const TSE_ELECTION_ID_2026 = "20322002026";
const TSE_CANDIDATE_PHOTO_BASE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img";
const TSE_DIVULGACAND_REST_BASE_URL = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

type TSECandidateRow = Record<string, string | undefined>;

function firstValue(row: TSECandidateRow, key: string): string {
  return (row[key] ?? "").trim();
}

/** Cria uma chave interna a partir do identificador oficial da pessoa, sem persistir nem expor o valor original. */
function buildOfficialCandidatePersonKey(row: TSECandidateRow): string | null {
  const officialPersonId = firstValue(row, "SQ_PESSOA") || firstValue(row, "NR_CPF_CANDIDATO");
  return officialPersonId
    ? createHash("sha256").update(`tse-2026-person:${officialPersonId}`).digest("hex")
    : null;
}

/** URL oficial exposta pelo DivulgaCandContas para a foto da candidatura de 2026. */
export function buildOfficialCandidatePhotoUrl(sqCandidate: string, uf: string): string | null {
  if (!sqCandidate || !uf) return null;
  return `${TSE_CANDIDATE_PHOTO_BASE_URL}/${TSE_ELECTION_ID_2026}/${sqCandidate}/${uf}`;
}

export function mapTseCandidate(row: TSECandidateRow): CandidateImportRecord | null {
  const sqCandidate = firstValue(row, "SQ_CANDIDATO");
  const candidateName = firstValue(row, "NM_CANDIDATO");
  const ballotName = firstValue(row, "NM_URNA_CANDIDATO");
  const office = firstValue(row, "DS_CARGO");
  if (!sqCandidate || !candidateName || !ballotName || !office) return null;

  const uf = firstValue(row, "SG_UF");
  const generatedDate = firstValue(row, "DT_GERACAO");
  const generatedTime = firstValue(row, "HH_GERACAO");
  return {
    sqCandidate,
    candidateName,
    ballotName,
    candidateNumber: firstValue(row, "NR_CANDIDATO") || null,
    office,
    partyAcronym: firstValue(row, "SG_PARTIDO") || null,
    partyName: firstValue(row, "NM_PARTIDO") || null,
    uf: uf || null,
    officialStatus: firstValue(row, "DS_SITUACAO_CANDIDATURA") || null,
    photoUrl: firstValue(row, "DS_URL_FOTO_CANDIDATO") || buildOfficialCandidatePhotoUrl(sqCandidate, uf),
    sourceUpdatedAt: [generatedDate, generatedTime].filter(Boolean).join(" ") || null,
    personKey: buildOfficialCandidatePersonKey(row),
  };
}

function socialLabelFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const socialNetworks = [
      { label: "Instagram", domains: ["instagram.com"] },
      { label: "Facebook", domains: ["facebook.com", "fb.com", "m.me"] },
      { label: "X", domains: ["x.com", "twitter.com"] },
      { label: "YouTube", domains: ["youtube.com", "youtu.be"] },
      { label: "TikTok", domains: ["tiktok.com"] },
      { label: "Threads", domains: ["threads.net", "threads.com"] },
      { label: "LinkedIn", domains: ["linkedin.com"] },
      { label: "Kwai", domains: ["kwai.com", "kwai-video.com"] },
      { label: "Telegram", domains: ["t.me", "telegram.me"] },
      { label: "WhatsApp", domains: ["whatsapp.com", "wa.me", "chat.whatsapp.com"] },
      { label: "Bluesky", domains: ["bsky.social", "bsky.app"] },
      { label: "Flickr", domains: ["flickr.com"] },
      { label: "Linktree", domains: ["linktr.ee"] },
    ];
    return socialNetworks.find(network => network.domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`)))?.label
      ?? hostname;
  } catch {
    return url;
  }
}

export function mapTseSocialProfile(row: TSECandidateRow): CandidateSocialImportRecord | null {
  const sqCandidate = firstValue(row, "SQ_CANDIDATO");
  const url = Object.values(row).find(value => /^https?:\/\//i.test((value ?? "").trim()))?.trim();
  if (!sqCandidate || !url) return null;
  const generatedDate = firstValue(row, "DT_GERACAO");
  const generatedTime = firstValue(row, "HH_GERACAO");
  return {
    sqCandidate,
    label: socialLabelFromUrl(url),
    url,
    sourceUpdatedAt: [generatedDate, generatedTime].filter(Boolean).join(" ") || null,
  };
}

function findGovernmentPlanUrl(row: TSECandidateRow): string | null {
  const match = Object.entries(row).find(([field, value]) => {
    const normalizedField = field.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return (normalizedField.includes("PROPOSTA") || normalizedField.includes("PLANO_GOVERNO"))
      && /^https?:\/\//i.test((value ?? "").trim());
  });
  return match?.[1]?.trim() || null;
}

export function mapTseGovernmentPlan(row: TSECandidateRow): GovernmentPlanImportRecord | null {
  const sqCandidate = firstValue(row, "SQ_CANDIDATO");
  const officialUrl = findGovernmentPlanUrl(row);
  if (!sqCandidate || !officialUrl) return null;
  const generatedDate = firstValue(row, "DT_GERACAO");
  const generatedTime = firstValue(row, "HH_GERACAO");
  return {
    sqCandidate,
    title: firstValue(row, "NM_ARQUIVO") || firstValue(row, "NM_DOCUMENTO") || "Plano de governo",
    officialUrl,
    sourceUpdatedAt: [generatedDate, generatedTime].filter(Boolean).join(" ") || null,
  };
}

function parseArchive(buffer: Buffer): TSECandidateRow[] {
  const archive = new AdmZip(buffer);
  const csvEntries = archive.getEntries().filter(entry =>
    !entry.isDirectory && entry.entryName.toLowerCase().endsWith(".csv"),
  );
  const preferredEntry = csvEntries.find(entry =>
    entry.entryName.toUpperCase().includes("_BRASIL.CSV"),
  ) ?? csvEntries[0];

  if (!preferredEntry) throw new Error("Candidate archive does not contain a CSV file");
  return parse(preferredEntry.getData().toString("latin1"), {
    columns: true,
    delimiter: ";",
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as TSECandidateRow[];
}

export function mergeCandidateComplement(
  records: CandidateImportRecord[],
  complementaryRows: TSECandidateRow[],
): CandidateImportRecord[] {
  const photoByCandidate = new Map(
    complementaryRows.flatMap(row => {
      const sqCandidate = firstValue(row, "SQ_CANDIDATO");
      const photoUrl = firstValue(row, "DS_URL_FOTO_CANDIDATO");
      return sqCandidate && photoUrl ? [[sqCandidate, photoUrl] as const] : [];
    }),
  );

  return records.map(record => ({
    ...record,
    photoUrl: chooseOfficialPhotoUrl(record.photoUrl, photoByCandidate.get(record.sqCandidate)),
  }));
}

function sourceTimestampFromCandidates(records: CandidateImportRecord[]): string | null {
  return records.map(record => record.sourceUpdatedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

type PreviousCandidate = {
  sqCandidate: string;
  candidateName: string;
  ballotName: string;
  candidateNumber: string | null;
  office: string;
  partyAcronym: string | null;
  uf: string | null;
  officialStatus: string | null;
};
type PreviousSocial = { sqCandidate: string; label: string; url: string };
type PreviousPlan = { sqCandidate: string; title: string; officialUrl: string };
type PreviousTicket = { principalSqCandidate: string; memberSqCandidate: string; memberOffice: string };

function candidateReference(candidate: Pick<CandidateImportRecord, "ballotName" | "candidateName" | "office" | "uf">) {
  return `${candidate.ballotName || candidate.candidateName} (${candidate.office}${candidate.uf ? `/${candidate.uf}` : ""})`;
}

export function buildElectionSyncChangeDetails(input: {
  previous: { candidateRows: PreviousCandidate[]; socialRows: PreviousSocial[]; planRows: PreviousPlan[]; ticketRows: PreviousTicket[] };
  candidates: CandidateImportRecord[];
  socialProfiles: CandidateSocialImportRecord[];
  plans: GovernmentPlanImportRecord[];
  ticketMembers: CandidateTicketMemberImportRecord[];
  statusUpdates: CandidateStatusImportRecord[];
}): string[] {
  const lines: string[] = [];
  const beforeCandidates = new Map(input.previous.candidateRows.map(candidate => [candidate.sqCandidate, candidate]));
  const afterCandidates = new Map(input.candidates.map(candidate => [candidate.sqCandidate, candidate]));
  const statusUpdates = new Map(input.statusUpdates.map(update => [update.sqCandidate, update.officialStatus]));
  for (const candidate of input.candidates) {
    const previous = beforeCandidates.get(candidate.sqCandidate);
    if (!previous) {
      lines.push(`Candidatura incluída: ${candidateReference(candidate)}.`);
      continue;
    }
    const effectiveStatus = statusUpdates.get(candidate.sqCandidate) ?? candidate.officialStatus;
    const fields: Array<[string, string | null | undefined, string | null | undefined]> = [
      ["nome de urna", previous.ballotName, candidate.ballotName],
      ["número", previous.candidateNumber, candidate.candidateNumber],
      ["cargo", previous.office, candidate.office],
      ["partido", previous.partyAcronym, candidate.partyAcronym],
      ["situação", previous.officialStatus, effectiveStatus],
    ];
    for (const [field, before, after] of fields) if ((before ?? "") !== (after ?? "")) {
      lines.push(`Candidatura alterada — ${candidateReference(candidate)}: ${field} “${before || "não informado"}” → “${after || "não informado"}”.`);
    }
  }
  for (const candidate of input.previous.candidateRows) if (!afterCandidates.has(candidate.sqCandidate)) {
    lines.push(`Candidatura removida do arquivo oficial: ${candidateReference(candidate)}.`);
  }

  const names = new Map(input.candidates.map(candidate => [candidate.sqCandidate, candidateReference(candidate)]));
  const compareSets = <T>(before: T[], after: T[], key: (item: T) => string, describe: (item: T) => string, kind: string) => {
    const beforeMap = new Map(before.map(item => [key(item), item]));
    const afterMap = new Map(after.map(item => [key(item), item]));
    for (const item of after) if (!beforeMap.has(key(item))) lines.push(`${kind} incluído: ${describe(item)}.`);
    for (const item of before) if (!afterMap.has(key(item))) lines.push(`${kind} removido: ${describe(item)}.`);
  };
  compareSets(input.previous.socialRows, input.socialProfiles, item => `${item.sqCandidate}|${item.url.toLowerCase()}`, item => `${names.get(item.sqCandidate) ?? item.sqCandidate} — ${item.label}: ${item.url}`, "Rede social");
  compareSets(input.previous.planRows, input.plans, item => `${item.sqCandidate}|${item.officialUrl}`, item => `${names.get(item.sqCandidate) ?? item.sqCandidate} — ${item.title}`, "Documento de proposta");
  compareSets(input.previous.ticketRows, input.ticketMembers, item => `${item.principalSqCandidate}|${item.memberSqCandidate}`, item => `${names.get(item.principalSqCandidate) ?? item.principalSqCandidate} — integrante ${names.get(item.memberSqCandidate) ?? item.memberSqCandidate} (${item.memberOffice})`, "Vínculo de vice");
  return lines;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      output[currentIndex] = await mapper(items[currentIndex]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return output;
}

type OfficialOffice = { codigo?: string | number | null };
type OfficialCandidateListItem = { id?: string | number | null; descricaoSituacao?: string | null };
type OfficialOfficeListResponse = { cargos?: OfficialOffice[] };
type OfficialCandidateListResponse = { candidatos?: OfficialCandidateListItem[] };

async function fetchOfficialJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`DivulgaCand list request failed: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

/** Reúne as situações atuais pela listagem oficial de cada UF e cargo, preservando registros sem resposta. */
export async function discoverOfficialStatuses(records: CandidateImportRecord[]): Promise<CandidateStatusImportRecord[]> {
  const expectedIds = new Set(records.map(record => record.sqCandidate));
  const units = Array.from(new Set(records.map(record => record.uf).filter((uf): uf is string => Boolean(uf))));
  const results = await mapWithConcurrency(units, 7, async uf => {
    try {
      const offices = await fetchOfficialJson<OfficialOfficeListResponse>(`${TSE_DIVULGACAND_REST_BASE_URL}/eleicao/listar/municipios/${TSE_ELECTION_ID_2026}/${uf}/cargos`);
      const lists = await mapWithConcurrency((offices.cargos ?? []).filter(office => office.codigo !== null && office.codigo !== undefined), 4, async office => {
        try {
          const payload = await fetchOfficialJson<OfficialCandidateListResponse>(`${TSE_DIVULGACAND_REST_BASE_URL}/candidatura/listar/2026/${uf}/${TSE_ELECTION_ID_2026}/${office.codigo}/candidatos`);
          return payload.candidatos ?? [];
        } catch (error) {
          console.warn(`[Election Sync] Unable to list current statuses for ${uf}, office ${office.codigo}:`, error instanceof Error ? error.message : error);
          return [];
        }
      });
      const candidatesForUf = lists.flat();
      console.log(`[Election Sync] Reconciled ${candidatesForUf.length} status records for ${uf}`);
      return candidatesForUf;
    } catch (error) {
      console.warn(`[Election Sync] Unable to list current statuses for ${uf}:`, error instanceof Error ? error.message : error);
      return [];
    }
  });
  const updates = new Map<string, CandidateStatusImportRecord>();
  for (const candidate of results.flat()) {
    const sqCandidate = String(candidate.id ?? "").trim();
    const officialStatus = candidate.descricaoSituacao?.trim();
    if (sqCandidate && officialStatus && expectedIds.has(sqCandidate)) updates.set(sqCandidate, { sqCandidate, officialStatus });
  }
  return Array.from(updates.values());
}

export async function discoverOfficialPlansAndTickets(records: CandidateImportRecord[]) {
  const principals = records.filter(record => isDirectlyVotedOffice(record.office) && ["PRESIDENTE", "GOVERNADOR", "SENADOR"].includes(record.office));
  const recordsBySqCandidate = new Map(records.map(record => [record.sqCandidate, record]));
  const supplements = await mapWithConcurrency(principals, 8, async candidate => ({
    candidate,
    supplement: await fetchOfficialTseSupplement(candidate.sqCandidate, candidate.uf ?? null),
  }));
  const fullyRead = supplements.every(item => item.supplement !== null);
  const plans: GovernmentPlanImportRecord[] = supplements.flatMap(({ candidate, supplement }) => {
    if (!supplement?.governmentProposalUrl || !["PRESIDENTE", "GOVERNADOR"].includes(candidate.office)) return [];
    return [{
      sqCandidate: candidate.sqCandidate,
      title: supplement.governmentProposalTitle || "Plano de governo",
      officialUrl: supplement.governmentProposalUrl,
      sourceUpdatedAt: candidate.sourceUpdatedAt ?? null,
    }];
  });
  const ticketMembers: CandidateTicketMemberImportRecord[] = supplements.flatMap(({ candidate, supplement }) =>
    supplement?.ticketMembers.flatMap(member => {
      const memberRecord = recordsBySqCandidate.get(member.sqCandidate);
      if (memberRecord && isTerminalCandidateStatus(memberRecord.officialStatus)) return [];
      return [{
        principalSqCandidate: candidate.sqCandidate,
        memberSqCandidate: member.sqCandidate,
        memberOffice: member.office,
      }];
    }) ?? [],
  );
  const statusUpdates: CandidateStatusImportRecord[] = supplements.flatMap(({ candidate, supplement }) =>
    supplement?.officialStatus ? [{ sqCandidate: candidate.sqCandidate, officialStatus: supplement.officialStatus }] : [],
  );
  return { fullyRead, plans, ticketMembers, statusUpdates };
}

/** Reconstitui apenas os vínculos oficiais dos suplentes de Senado já presentes no snapshot. */
export async function reconcileOfficialSenateTicketMembers() {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível para reconciliar suplentes de Senado.");
  const [senateRows, supplementaryRows] = await Promise.all([
    db.select().from(candidates).where(eq(candidates.office, "SENADOR")),
    db.select().from(candidates).where(sql`${candidates.office} IN ('1º SUPLENTE', '2º SUPLENTE')`),
  ]);
  const records: CandidateImportRecord[] = senateRows.map(candidate => ({
    sqCandidate: candidate.sqCandidate,
    candidateName: candidate.candidateName,
    ballotName: candidate.ballotName,
    office: candidate.office,
    uf: candidate.uf,
  }));
  const { ticketMembers: detailLinks } = await discoverOfficialPlansAndTickets(records);
  const senatorsByUfAndNumber = new Map<string, typeof senateRows>();
  for (const senator of senateRows) {
    if (!senator.uf || !senator.candidateNumber) continue;
    const key = `${senator.uf}|${senator.candidateNumber}`;
    senatorsByUfAndNumber.set(key, [...(senatorsByUfAndNumber.get(key) ?? []), senator]);
  }
  const numberLinks: CandidateTicketMemberImportRecord[] = supplementaryRows.flatMap(member => {
    if (!member.uf || !member.candidateNumber) return [];
    const matches = senatorsByUfAndNumber.get(`${member.uf}|${member.candidateNumber}`) ?? [];
    return matches.length === 1 ? [{
      principalSqCandidate: matches[0].sqCandidate,
      memberSqCandidate: member.sqCandidate,
      memberOffice: member.office,
    }] : [];
  });
  const links = Array.from(new Map([...detailLinks, ...numberLinks]
    .map(link => [`${link.principalSqCandidate}|${link.memberSqCandidate}`, link])).values());
  await upsertCandidateTicketMembers(links);
  return { senatorsChecked: records.length, ticketMembersLinked: links.length, linkedByOfficialDetails: detailLinks.length, linkedByUfAndNumber: numberLinks.length };
}

async function downloadArchive(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download import archive: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export function buildElectionSyncSuccessMessage(input: { imported: number; socialProfilesImported: number; governmentPlansImported: number; statusUpdatesImported?: number; changes?: string[] }) {
  return [
    "A sincronização eleitoral foi concluída com sucesso.",
    `Candidaturas importadas: ${input.imported}.`,
    `Redes sociais importadas: ${input.socialProfilesImported}.`,
    `Planos de governo importados: ${input.governmentPlansImported}.`,
    `Situações consultadas diretamente no DivulgaCand: ${input.statusUpdatesImported ?? 0}.`,
    "A base exibida no Buscador de Candidaturas foi atualizada exclusivamente com dados oficiais do TSE.",
    "",
    input.changes?.length ? "Mudanças identificadas:" : "Nenhuma alteração identificada em relação ao snapshot oficial anterior.",
    ...(input.changes ?? []),
  ].join("\n");
}

export function buildElectionSyncFailureMessage(message: string) {
  return [
    "A sincronização eleitoral não foi concluída.",
    `Motivo técnico: ${message}.`,
    "O que você pode fazer manualmente:",
    "1. Abra os três endereços oficiais do TSE em um navegador e conclua qualquer verificação solicitada pelo TSE.",
    "2. Confirme os downloads oficiais e execute novamente a sincronização.",
    "3. Se o bloqueio persistir, aguarde e tente novamente mais tarde; não use fontes alternativas.",
  ].join("\n");
}

export async function runOfficialElectionSync(payload: z.infer<typeof syncPayloadSchema>) {
    const [candidateArchive, complementaryArchive, socialArchive] = await Promise.all([
      downloadArchive(payload.candidatesUrl),
      downloadArchive(payload.complementaryUrl),
      downloadArchive(payload.socialUrl),
    ]);
    const candidateRecords = parseArchive(candidateArchive)
      .map(mapTseCandidate)
      .filter((record): record is CandidateImportRecord => record !== null);
    const records = mergeCandidateComplement(
      candidateRecords,
      parseArchive(complementaryArchive),
    );
    const socialProfiles = parseArchive(socialArchive)
      .map(mapTseSocialProfile)
      .filter((record): record is CandidateSocialImportRecord => record !== null);
    const previousSnapshot = await getElectionSyncSnapshot();
    const [officialDocuments, statusUpdates] = await Promise.all([
      discoverOfficialPlansAndTickets(records),
      discoverOfficialStatuses(records),
    ]);
    const changes = buildElectionSyncChangeDetails({
      previous: previousSnapshot,
      candidates: records,
      socialProfiles,
      plans: officialDocuments.plans,
      ticketMembers: officialDocuments.ticketMembers,
      statusUpdates,
    });
    await replaceCandidates(records);
    await replaceCandidateSocialProfiles(socialProfiles);
    if (officialDocuments.fullyRead) {
      await replaceGovernmentPlans(officialDocuments.plans);
      await replaceCandidateTicketMembers(officialDocuments.ticketMembers);
    } else {
      await upsertGovernmentPlans(officialDocuments.plans);
      await upsertCandidateTicketMembers(officialDocuments.ticketMembers);
    }
    await updateCandidateOfficialStatuses(statusUpdates);
    const result = {
      ok: true,
      imported: records.length,
      socialProfilesImported: socialProfiles.length,
      governmentPlansImported: officialDocuments.plans.length,
      ticketMembersImported: officialDocuments.ticketMembers.length,
      statusUpdatesImported: statusUpdates.length,
      changes,
    };
    await recordElectionSyncSuccess({
      sourceUpdatedAt: sourceTimestampFromCandidates(records),
      candidatesImported: result.imported,
      socialProfilesImported: result.socialProfilesImported,
      governmentPlansImported: result.governmentPlansImported,
      ticketMembersImported: result.ticketMembersImported,
    });
    const [emailAlertSent, fallback] = await Promise.all([
      sendOwnerEmail({
        subject: "Sincronização eleitoral concluída — Buscador de Candidaturas",
        text: `${buildElectionSyncSuccessMessage(result)}\n\nO espelho de contingência no GitHub está sendo atualizado no mesmo ciclo desta sincronização.`,
      }),
      publishGithubFallbackSnapshot()
        .then(result => ({ updated: true, candidates: result.candidates, error: null as string | null }))
        .catch(error => ({ updated: false, candidates: null as number | null, error: error instanceof Error ? error.message : "Falha desconhecida" })),
    ]);
    return { ...result, fallback, emailAlertSent };
}

export async function electionSyncImportHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const payload = syncPayloadSchema.parse(req.body);
    return res.json(await runOfficialElectionSync(payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error";
    console.error("[Election Sync] Import failed", message);
    await recordElectionSyncFailure(message).catch(recordError => console.error("[Election Sync] Failed to record sync failure", recordError));
    const emailAlertSent = await sendOwnerEmail({
      subject: "Falha na sincronização eleitoral — ação necessária",
      text: buildElectionSyncFailureMessage(message),
    }).catch(() => false);
    return res.status(500).json({
      error: message,
      emailAlertSent,
      context: { path: req.path, taskUid: "scheduled import" },
      timestamp: new Date().toISOString(),
    });
  }
}
