import AdmZip from "adm-zip";

export const ELECTION_ID = "20322002026";
export const CANDIDATES_SOURCE_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";
export const COMPLEMENTARY_SOURCE_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip";
export const SOCIAL_SOURCE_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip";
export const ELIGIBLE_STATUSES = new Set(["DEFERIDO", "AGUARDANDO JULGAMENTO"]);

export type PublicCandidate = {
  id: string;
  nome: string;
  nomeCompleto: string;
  numero: string;
  partido: string;
  partidoNome: string;
  uf: string;
  unidadeEleitoral: string;
  cargo: string;
  codigoCargo: number;
  situacao: string;
  fotoUrl: string;
  redesSociais: string[];
  titular?: { id: string; nome: string; cargo: string };
  pesquisa: string;
};

export type ElectionSnapshot = {
  geradoEm: string;
  fonte: string;
  filtro: string;
  totalOriginal: number;
  totalElegivel: number;
  totalComRedes: number;
  candidaturas: PublicCandidate[];
};

type RawCandidate = Omit<PublicCandidate, "redesSociais" | "titular" | "pesquisa">;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ";" && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function csvRows(buffer: Buffer) {
  return buffer.toString("latin1").split(/\r?\n/).filter(Boolean);
}

function parseCandidateFiles(zipBuffer: Buffer): RawCandidate[] {
  const zip = new AdmZip(zipBuffer);
  const candidates = new Map<string, RawCandidate>();
  for (const entry of zip.getEntries()) {
    const name = entry.entryName.split("/").pop() ?? "";
    if (!/^consulta_cand_2026_(?:[A-Z]{2}|BRASIL)\.csv$/.test(name)) continue;
    const rows = csvRows(entry.getData());
    const headers = parseCsvLine(rows[0] ?? "");
    const indexes = new Map(headers.map((header, index) => [header, index]));
    for (const row of rows.slice(1)) {
      const fields = parseCsvLine(row);
      const get = (field: string) => fields[indexes.get(field) ?? -1] ?? "";
      const id = get("SQ_CANDIDATO");
      const numero = get("NR_CANDIDATO");
      const nome = get("NM_URNA_CANDIDATO");
      const partido = get("SG_PARTIDO");
      const uf = get("SG_UF");
      const cargo = get("DS_CARGO");
      const unidadeEleitoral = get("SG_UE") || uf;
      if (!id || !numero || !nome || nome === "#NULO" || !partido || !uf || !cargo) continue;
      candidates.set(id, {
        id,
        nome,
        nomeCompleto: get("NM_CANDIDATO") || nome,
        numero,
        partido,
        partidoNome: get("NM_PARTIDO") || partido,
        uf,
        unidadeEleitoral,
        cargo,
        codigoCargo: Number(get("CD_CARGO") || 0),
        situacao: get("DS_SITUACAO_CANDIDATURA") || "Não informado",
        fotoUrl: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${ELECTION_ID}/${id}/${unidadeEleitoral}`,
      });
    }
  }
  return Array.from(candidates.values());
}

function parseJudgementFiles(zipBuffer: Buffer) {
  const zip = new AdmZip(zipBuffer);
  const judgementByCandidate = new Map<string, string>();
  for (const entry of zip.getEntries()) {
    const name = entry.entryName.split("/").pop() ?? "";
    if (!/^consulta_cand_complementar_2026_(?:[A-Z]{2}|BR)\.csv$/.test(name)) continue;
    const rows = csvRows(entry.getData());
    const headers = parseCsvLine(rows[0] ?? "");
    const indexes = new Map(headers.map((header, index) => [header, index]));
    for (const row of rows.slice(1)) {
      const fields = parseCsvLine(row);
      const id = fields[indexes.get("SQ_CANDIDATO") ?? -1] ?? "";
      const situation = fields[indexes.get("DS_SITUACAO_JULGAMENTO") ?? -1] ?? "";
      if (id && situation) judgementByCandidate.set(id, situation);
    }
  }
  return judgementByCandidate;
}

function parseSocialFiles(zipBuffer: Buffer) {
  const zip = new AdmZip(zipBuffer);
  const socialByCandidate = new Map<string, string[]>();
  for (const entry of zip.getEntries()) {
    if (!entry.entryName.toLowerCase().endsWith(".csv")) continue;
    const rows = csvRows(entry.getData());
    const headers = parseCsvLine(rows[0] ?? "");
    const idIndex = headers.findIndex((header) => header === "SQ_CANDIDATO");
    const urlIndex = headers.findIndex((header) => /URL|REDE_SOCIAL/.test(header));
    if (idIndex < 0 || urlIndex < 0) continue;
    for (const row of rows.slice(1)) {
      const fields = parseCsvLine(row);
      const id = fields[idIndex] ?? "";
      const url = fields[urlIndex] ?? "";
      if (!id || !/^https?:\/\//i.test(url)) continue;
      const urls = socialByCandidate.get(id) ?? [];
      if (!urls.includes(url)) urls.push(url);
      socialByCandidate.set(id, urls);
    }
  }
  return socialByCandidate;
}

function attachTitulares(candidates: PublicCandidate[]) {
  const titulares = new Map<string, PublicCandidate>();
  for (const candidate of candidates) {
    if (candidate.cargo === "GOVERNADOR" || candidate.cargo === "SENADOR" || candidate.cargo === "PRESIDENTE") {
      titulares.set(`${candidate.uf}|${candidate.numero}|${candidate.partido}|${candidate.cargo}`, candidate);
    }
  }
  return candidates.map((candidate) => {
    const cargoTitular = candidate.cargo === "VICE-GOVERNADOR" ? "GOVERNADOR"
      : candidate.cargo === "VICE-PRESIDENTE" ? "PRESIDENTE"
      : candidate.cargo.includes("SUPLENTE") ? "SENADOR"
      : null;
    const titular = cargoTitular ? titulares.get(`${candidate.uf}|${candidate.numero}|${candidate.partido}|${cargoTitular}`) : undefined;
    return titular ? { ...candidate, titular: { id: titular.id, nome: titular.nome, cargo: titular.cargo } } : candidate;
  });
}

export function buildElectionSnapshot(candidateZip: Buffer, complementaryZip: Buffer, socialZip?: Buffer): ElectionSnapshot {
  const rawCandidates = parseCandidateFiles(candidateZip);
  const judgementByCandidate = parseJudgementFiles(complementaryZip);
  const socialByCandidate = socialZip ? parseSocialFiles(socialZip) : new Map<string, string[]>();
  const eligibleCandidates = rawCandidates.filter((candidate) => ELIGIBLE_STATUSES.has(normalize(judgementByCandidate.get(candidate.id) ?? candidate.situacao)));
  const withMetadata = eligibleCandidates.map((candidate) => ({
    ...candidate,
    situacao: judgementByCandidate.get(candidate.id) ?? candidate.situacao,
    redesSociais: socialByCandidate.get(candidate.id) ?? [],
    pesquisa: normalize([candidate.nome, candidate.nomeCompleto, candidate.numero, candidate.partido, candidate.uf, candidate.cargo].join(" ")),
  }));
  const candidaturas = attachTitulares(withMetadata).sort((first, second) =>
    first.uf.localeCompare(second.uf, "pt-BR") || first.cargo.localeCompare(second.cargo, "pt-BR") || first.nome.localeCompare(second.nome, "pt-BR"),
  );
  return {
    geradoEm: new Date().toISOString(),
    fonte: "Portal de Dados Abertos do TSE",
    filtro: "Situação da candidatura: Deferido ou Aguardando julgamento",
    totalOriginal: rawCandidates.length,
    totalElegivel: candidaturas.length,
    totalComRedes: candidaturas.filter((candidate) => candidate.redesSociais.length > 0).length,
    candidaturas,
  };
}

export async function downloadOfficialZip(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/zip,application/octet-stream,*/*",
      "user-agent": "Mozilla/5.0 (compatible; TerraEleicoesDataBot/1.0; +https://terra.com.br)",
    },
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`Fonte oficial indisponível (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}
