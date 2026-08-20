import * as db from "./db";
import { buildElectionSnapshot, CANDIDATES_SOURCE_URL, COMPLEMENTARY_SOURCE_URL, downloadOfficialZip, enrichOfficialCandidateMetadata, SOCIAL_SOURCE_URL } from "./electionData";
import { buildElectionSnapshotFromPublicApi } from "./electionApiFallback";
import { storageGetSignedUrl, storagePut } from "./storage";

const TRUSTED_UPLOAD_HOST_SUFFIX = ".manuscdn.com";
const MAX_ARCHIVE_BYTES = 45 * 1024 * 1024;

type UploadedOfficialSources = {
  candidatesUrl: string;
  complementaryUrl: string;
  socialUrl: string;
};

async function preserveConfirmedProposalLinks(snapshot: Awaited<ReturnType<typeof enrichOfficialCandidateMetadata>>) {
  const previous = await db.getPublishedElectionSnapshot();
  if (!previous?.dataUrl?.startsWith("/manus-storage/")) return snapshot;
  try {
    const key = previous.dataUrl.replace("/manus-storage/", "");
    const response = await fetch(await storageGetSignedUrl(key));
    if (!response.ok) return snapshot;
    const priorData = await response.json() as { candidaturas?: Array<{ id: string; propostaGovernoUrl?: string }> };
    const priorPlans = new Map((priorData.candidaturas ?? []).filter((candidate) => candidate.propostaGovernoUrl).map((candidate) => [candidate.id, candidate.propostaGovernoUrl]));
    const candidaturas = snapshot.candidaturas.map((candidate) => candidate.propostaGovernoUrl || !priorPlans.get(candidate.id)
      ? candidate
      : { ...candidate, propostaGovernoUrl: priorPlans.get(candidate.id) });
    return { ...snapshot, totalComProposta: candidaturas.filter((candidate) => Boolean(candidate.propostaGovernoUrl)).length, candidaturas };
  } catch (error) {
    console.warn("[Elections] Não foi possível preservar links oficiais de proposta:", String(error));
    return snapshot;
  }
}

async function loadPublishedSnapshot() {
  try {
    const previous = await db.getPublishedElectionSnapshot();
    if (!previous?.dataUrl?.startsWith("/manus-storage/")) return undefined;
    const key = previous.dataUrl.replace("/manus-storage/", "");
    const response = await fetch(await storageGetSignedUrl(key));
    if (!response.ok) throw new Error(`Snapshot ativo indisponível (HTTP ${response.status})`);
    return response.json() as Promise<Awaited<ReturnType<typeof enrichOfficialCandidateMetadata>>>;
  } catch (error) {
    console.warn("[Elections] Não foi possível carregar o snapshot anterior:", String(error));
    return undefined;
  }
}

export function isTrustedUploadedArchiveUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(TRUSTED_UPLOAD_HOST_SUFFIX);
  } catch {
    return false;
  }
}

async function downloadUploadedOfficialArchive(url: string, label: string) {
  if (!isTrustedUploadedArchiveUrl(url)) {
    throw new Error(`Origem não autorizada para ${label}`);
  }
  const parsed = new URL(url);
  const response = await fetch(parsed, { signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`Arquivo ${label} indisponível (HTTP ${response.status})`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length && length > MAX_ARCHIVE_BYTES) throw new Error(`Arquivo ${label} excede o limite permitido`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_ARCHIVE_BYTES) throw new Error(`Arquivo ${label} inválido ou excede o limite permitido`);
  return buffer;
}

async function publishElectionSnapshot(runId: number, rawSnapshot: ReturnType<typeof buildElectionSnapshot>) {
  const enrichedSnapshot = await enrichOfficialCandidateMetadata(rawSnapshot);
  const snapshot = await preserveConfirmedProposalLinks(enrichedSnapshot);
  const key = `eleicoes-2026/candidaturas-${snapshot.geradoEm.replace(/[:.]/g, "-")}.json`;
  const stored = await storagePut(key, JSON.stringify(snapshot), "application/json; charset=utf-8");
  await db.completeElectionSync({
    runId,
    dataUrl: stored.url,
    candidateCount: snapshot.totalOriginal,
    eligibleCount: snapshot.totalElegivel,
    socialProfileCount: snapshot.totalComRedes,
  });
  return { ...snapshot, dataUrl: stored.url };
}

export async function importElectionSnapshotFromUploadedSources(sources: UploadedOfficialSources) {
  const runId = await db.startElectionSync("Arquivos oficiais do TSE obtidos por navegador", "browser-assisted-import");
  try {
    const [candidateZip, complementaryZip, socialZip] = await Promise.all([
      downloadUploadedOfficialArchive(sources.candidatesUrl, "candidaturas"),
      downloadUploadedOfficialArchive(sources.complementaryUrl, "informações complementares"),
      downloadUploadedOfficialArchive(sources.socialUrl, "redes sociais"),
    ]);
    return await publishElectionSnapshot(runId, buildElectionSnapshot(candidateZip, complementaryZip, socialZip));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.failElectionSync(runId, message);
    throw error;
  }
}

export async function synchronizeElectionSnapshot() {
  const runId = await db.startElectionSync("Portal de Dados Abertos do TSE", CANDIDATES_SOURCE_URL);
  try {
    const previous = await loadPublishedSnapshot().catch(() => undefined);
    let rawSnapshot;
    try {
      const candidateZip = await downloadOfficialZip(CANDIDATES_SOURCE_URL);
      const complementaryZip = await downloadOfficialZip(COMPLEMENTARY_SOURCE_URL);
      let socialZip: Buffer | undefined;
      try {
        socialZip = await downloadOfficialZip(SOCIAL_SOURCE_URL);
      } catch (error) {
        console.warn("[Elections] Redes sociais não disponíveis nesta sincronização:", String(error));
      }
      rawSnapshot = buildElectionSnapshot(candidateZip, complementaryZip, socialZip);
    } catch (error) {
      if (!previous) throw error;
      console.warn("[Elections] ZIP oficial indisponível; usando API pública oficial de contingência:", String(error));
      rawSnapshot = await buildElectionSnapshotFromPublicApi(previous);
    }
    return await publishElectionSnapshot(runId, rawSnapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.failElectionSync(runId, message);
    throw error;
  }
}
