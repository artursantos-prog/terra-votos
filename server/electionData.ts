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
  vinculoChapaIndisponivel?: boolean;
  propostaGovernoUrl?: string;
  pesquisa: string;
};

export type ElectionSnapshot = {
  geradoEm: string;
  fonte: string;
  filtro: string;
  totalOriginal: number;
  totalElegivel: number;
  totalComRedes: number;
  totalComProposta?: number;
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

function cargoTitular(cargo: string) {
  if (cargo === "VICE-PRESIDENTE") return "PRESIDENTE";
  if (cargo === "VICE-GOVERNADOR") return "GOVERNADOR";
  return cargo.includes("SUPLENTE") ? "SENADOR" : null;
}

function normalizeOffice(value: unknown) {
  return normalize(String(value ?? ""));
}

type TSEDetail = {
  vices?: Array<{ sq_CANDIDATO?: string | number; id?: string | number; nm_URNA?: string; nomeUrna?: string; nome?: string; ds_CARGO?: string; cargo?: string }>;
  arquivos?: Array<{ idArquivo?: string | number; codTipo?: string | number }>;
};

async function fetchCandidateDetail(candidate: PublicCandidate): Promise<TSEDetail> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${candidate.uf}/${ELECTION_ID}/candidato/${candidate.id}`, {
      headers: { accept: "application/json", "user-agent": "TerraEleicoesDataBot/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.ok) return response.json() as Promise<TSEDetail>;
    lastStatus = response.status;
    if (response.status !== 403 && response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  throw new Error(`Detalhe oficial indisponível para ${candidate.id} (HTTP ${lastStatus})`);
}

async function tryFetchCandidateDetail(candidate: PublicCandidate): Promise<TSEDetail | undefined> {
  try {
    const response = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${candidate.uf}/${ELECTION_ID}/candidato/${candidate.id}`, {
      headers: { accept: "application/json", "user-agent": "TerraEleicoesDataBot/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    return response.ok ? response.json() as Promise<TSEDetail> : undefined;
  } catch {
    return undefined;
  }
}

async function collectInBatches<T>(items: T[], operation: (item: T) => Promise<void>, concurrency = 16) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await operation(item);
    }
  }));
}

/**
 * Completa o snapshot apenas com relações explicitamente presentes no detalhe
 * público do DivulgaCandContas. O número de urna e o partido não são usados
 * para deduzir vínculos de chapa.
 */
export async function enrichOfficialCandidateMetadata(snapshot: ElectionSnapshot): Promise<ElectionSnapshot> {
  const candidates = snapshot.candidaturas;
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const ticketMembers = candidates.filter((candidate) => cargoTitular(candidate.cargo));
  const proposalCandidates = candidates.filter((candidate) => candidate.cargo === "PRESIDENTE" || candidate.cargo === "GOVERNADOR");
  const ticketDetails = new Map<string, TSEDetail>();
  const proposalDetails = new Map<string, TSEDetail>();

  await collectInBatches(ticketMembers, async (candidate) => {
    ticketDetails.set(candidate.id, await fetchCandidateDetail(candidate));
  });
  await collectInBatches(proposalCandidates, async (candidate) => {
    const detail = await tryFetchCandidateDetail(candidate);
    if (detail) proposalDetails.set(candidate.id, detail);
  }, 4);

  const details = new Map<string, TSEDetail>();
  ticketDetails.forEach((detail, id) => details.set(id, detail));
  proposalDetails.forEach((detail, id) => details.set(id, detail));

  const candidaturas = candidates.map((candidate) => {
    const detail = details.get(candidate.id);
    const titularOffice = cargoTitular(candidate.cargo);
    const officialOptions = titularOffice
      ? (detail?.vices ?? []).filter((item) => {
        const id = String(item.sq_CANDIDATO ?? item.id ?? "");
        return id !== candidate.id && normalizeOffice(item.ds_CARGO ?? item.cargo) === titularOffice;
      })
      : [];
    const linkedId = officialOptions.length === 1 ? String(officialOptions[0].sq_CANDIDATO ?? officialOptions[0].id) : undefined;
    const titular = linkedId ? candidateById.get(linkedId) : undefined;
    const proposalFile = (detail?.arquivos ?? []).find((file) => String(file.codTipo) === "5" && file.idArquivo);
    return {
      ...candidate,
      ...(titular ? { titular: { id: titular.id, nome: titular.nome, cargo: titular.cargo } } : {}),
      ...(titularOffice && !titular ? { vinculoChapaIndisponivel: true } : {}),
      ...(proposalFile ? { propostaGovernoUrl: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/${proposalFile.idArquivo}` } : {}),
    };
  });

  return {
    ...snapshot,
    totalComProposta: candidaturas.filter((candidate) => Boolean(candidate.propostaGovernoUrl)).length,
    candidaturas,
  };
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
  const candidaturas = withMetadata.sort((first, second) =>
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
