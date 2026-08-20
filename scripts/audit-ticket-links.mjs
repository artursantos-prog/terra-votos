import fs from "node:fs";
import path from "node:path";

const inputPath = process.env.SNAPSHOT_PATH ?? "/home/ubuntu/webdev-static-assets/candidatos-eleicoes-2026.json";
const outputPath = process.env.OUTPUT_PATH ?? "/home/ubuntu/webdev-static-assets/auditoria-vinculos-chapa-2026.json";
const electionId = "20322002026";
const concurrency = Number(process.env.CONCURRENCY ?? 12);

function normalize(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function expectedTitularOffice(cargo) {
  if (cargo === "VICE-PRESIDENTE") return "PRESIDENTE";
  if (cargo === "VICE-GOVERNADOR") return "GOVERNADOR";
  if (cargo.includes("SUPLENTE")) return "SENADOR";
  return null;
}

async function detailFor(candidate) {
  const response = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${candidate.uf}/${electionId}/candidato/${candidate.id}`, {
    headers: { accept: "application/json", "user-agent": "TerraEleicoesAudit/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

const snapshot = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const candidates = snapshot.candidaturas ?? snapshot.candidatos ?? [];
const ticketMembers = candidates.filter((candidate) => expectedTitularOffice(candidate.cargo));
const audit = await runPool(ticketMembers, async (candidate) => {
  const titularOffice = expectedTitularOffice(candidate.cargo);
  try {
    const detail = await detailFor(candidate);
    const options = (detail.vices ?? []).filter((item) =>
      String(item.sq_CANDIDATO ?? item.id ?? "") !== candidate.id
      && normalize(item.ds_CARGO ?? item.cargo ?? "") === titularOffice,
    );
    if (options.length !== 1) {
      return { candidateId: candidate.id, cargo: candidate.cargo, status: "unconfirmed", reason: options.length ? "multiple_official_options" : "no_official_link", officialOptions: options.map((item) => String(item.sq_CANDIDATO ?? item.id ?? "")) };
    }
    const titular = options[0];
    return { candidateId: candidate.id, cargo: candidate.cargo, status: "confirmed", titularId: String(titular.sq_CANDIDATO ?? titular.id), titularNome: titular.nm_URNA ?? titular.nomeUrna ?? titular.nome, titularCargo: titular.ds_CARGO ?? titular.cargo };
  } catch (error) {
    return { candidateId: candidate.id, cargo: candidate.cargo, status: "unavailable", reason: error instanceof Error ? error.message : "request_failed" };
  }
});

const summary = {
  generatedAt: new Date().toISOString(),
  source: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/{ano}/{uf}/{eleicao}/candidato/{SQ_CANDIDATO}",
  candidatesAudited: audit.length,
  confirmed: audit.filter((entry) => entry.status === "confirmed").length,
  unconfirmed: audit.filter((entry) => entry.status === "unconfirmed").length,
  unavailable: audit.filter((entry) => entry.status === "unavailable").length,
  links: audit,
};

fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ outputPath, ...summary, links: undefined }, null, 2));
