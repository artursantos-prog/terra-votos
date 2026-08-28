import { inArray } from "drizzle-orm";
import { candidates } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { buildOfficialCandidateDetailsUrl } from "../shared/officialTseDetails.ts";

const db = await getDb();
if (!db) throw new Error("Banco indisponível");
const records = await db.select().from(candidates)
  .where(inArray(candidates.office, ["PRESIDENTE", "GOVERNADOR"]));

let next = 0;
const results = new Array(records.length);
async function worker() {
  while (next < records.length) {
    const index = next++;
    const candidate = records[index];
    const url = buildOfficialCandidateDetailsUrl(candidate.sqCandidate, candidate.uf ?? "");
    try {
      const response = url ? await fetch(url, { signal: AbortSignal.timeout(8_000) }) : null;
      const payload = response?.ok ? await response.json() : null;
      results[index] = {
        sqCandidate: candidate.sqCandidate,
        office: candidate.office,
        storedStatus: candidate.officialStatus,
        responseStatus: response?.status ?? null,
        remoteStatus: payload?.descricaoSituacao ?? null,
        proposalFiles: Array.isArray(payload?.arquivos)
          ? payload.arquivos.filter(file => String(file?.codigoTipo ?? file?.codTipo ?? "") === "5").length
          : 0,
      };
    } catch (error) {
      results[index] = {
        sqCandidate: candidate.sqCandidate,
        office: candidate.office,
        storedStatus: candidate.officialStatus,
        responseStatus: null,
        remoteStatus: null,
        proposalFiles: 0,
        error: error instanceof Error ? error.message : "Erro de leitura",
      };
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const summary = results.reduce((acc, item) => {
  const key = `${item.office}|${item.remoteStatus ?? "SEM_RESPOSTA"}`;
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
const divergent = results.filter(item => item.remoteStatus && item.remoteStatus !== "Aguardando julgamento");
console.log(JSON.stringify({ checked: results.length, summary, divergentCount: divergent.length, divergentSample: divergent.slice(0, 12), failures: results.filter(item => item.error || item.responseStatus !== 200).length }, null, 2));
