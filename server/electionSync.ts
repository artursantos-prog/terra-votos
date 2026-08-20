import * as db from "./db";
import { buildElectionSnapshot, CANDIDATES_SOURCE_URL, COMPLEMENTARY_SOURCE_URL, downloadOfficialZip, SOCIAL_SOURCE_URL } from "./electionData";
import { storagePut } from "./storage";

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
    const snapshot = buildElectionSnapshot(candidateZip, complementaryZip, socialZip);
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
