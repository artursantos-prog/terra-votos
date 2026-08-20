import * as db from "./db";
import { buildElectionSnapshot, CANDIDATES_SOURCE_URL, COMPLEMENTARY_SOURCE_URL, downloadOfficialZip, enrichOfficialCandidateMetadata, SOCIAL_SOURCE_URL } from "./electionData";
import { storageGetSignedUrl, storagePut } from "./storage";

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

export async function synchronizeElectionSnapshot() {
  const runId = await db.startElectionSync("Portal de Dados Abertos do TSE", CANDIDATES_SOURCE_URL);
  try {
    const candidateZip = await downloadOfficialZip(CANDIDATES_SOURCE_URL);
    const complementaryZip = await downloadOfficialZip(COMPLEMENTARY_SOURCE_URL);
    let socialZip: Buffer | undefined;
    try {
      socialZip = await downloadOfficialZip(SOCIAL_SOURCE_URL);
    } catch (error) {
      console.warn("[Elections] Redes sociais não disponíveis nesta sincronização:", String(error));
    }
    const rawSnapshot = buildElectionSnapshot(candidateZip, complementaryZip, socialZip);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.failElectionSync(runId, message);
    throw error;
  }
}
