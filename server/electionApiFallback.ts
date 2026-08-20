import { ELECTION_ID, ELIGIBLE_STATUSES, type ElectionSnapshot, type PublicCandidate } from "./electionData";

const STATE_UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
const API_OFFICES = [
  { uf: "BR", code: 1, cargo: "PRESIDENTE" },
  { uf: "BR", code: 2, cargo: "VICE-PRESIDENTE" },
  ...STATE_UFS.flatMap((uf) => [
    { uf, code: 3, cargo: "GOVERNADOR" },
    { uf, code: 4, cargo: "VICE-GOVERNADOR" },
    { uf, code: 5, cargo: "SENADOR" },
    { uf, code: 6, cargo: "DEPUTADO FEDERAL" },
    { uf, code: 7, cargo: "DEPUTADO ESTADUAL" },
    { uf, code: 9, cargo: "1º SUPLENTE" },
    { uf, code: 10, cargo: "2º SUPLENTE" },
  ]),
];

type TSEListCandidate = {
  id?: string | number;
  nomeUrna?: string;
  nomeCompleto?: string;
  numero?: string | number;
  descricaoSituacao?: string;
  partido?: { sigla?: string; nome?: string };
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

async function collectInBatches<T>(items: T[], operation: (item: T) => Promise<void>, concurrency = 2) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) await operation(items[cursor++]);
  }));
}

async function fetchPublicList(uf: string, code: number) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2026/${uf}/${ELECTION_ID}/${code}/candidatos`, {
      headers: {
        accept: "application/json",
        "accept-language": "pt-BR,pt;q=0.9",
        "user-agent": "Mozilla/5.0 (compatible; TerraEleicoesDataBot/1.0)",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.ok) return response.json() as Promise<TSEListCandidate[] | { candidatos?: TSEListCandidate[] }>;
    lastStatus = response.status;
    if (![403, 429, 500, 502, 503, 504].includes(response.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 1_000 * (attempt + 1)));
  }
  throw new Error(`API pública do TSE indisponível para ${uf}/${code} (HTTP ${lastStatus})`);
}

/** Fonte de contingência oficial: listagem pública por UF e cargo do TSE. */
export async function buildElectionSnapshotFromPublicApi(previous?: ElectionSnapshot): Promise<ElectionSnapshot> {
  const previousById = new Map((previous?.candidaturas ?? []).map((candidate) => [candidate.id, candidate]));
  const candidates: PublicCandidate[] = [];
  await collectInBatches(API_OFFICES, async ({ uf, code, cargo }) => {
    const data = await fetchPublicList(uf, code);
    const items = Array.isArray(data) ? data : data.candidatos ?? [];
    for (const item of items) {
      const id = String(item.id ?? "");
      const numero = String(item.numero ?? "");
      const nome = String(item.nomeUrna ?? "");
      const partido = String(item.partido?.sigla ?? "");
      if (!id || !numero || !nome || !partido) continue;
      const situacao = String(item.descricaoSituacao ?? "Não informado");
      if (!ELIGIBLE_STATUSES.has(normalize(situacao))) continue;
      const prior = previousById.get(id);
      candidates.push({
        id,
        nome,
        nomeCompleto: String(item.nomeCompleto ?? nome),
        numero,
        partido,
        partidoNome: String(item.partido?.nome ?? partido),
        uf,
        unidadeEleitoral: uf,
        cargo,
        codigoCargo: code,
        situacao,
        fotoUrl: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${ELECTION_ID}/${id}/${uf}`,
        redesSociais: prior?.redesSociais ?? [],
        ...(prior?.propostaGovernoUrl ? { propostaGovernoUrl: prior.propostaGovernoUrl } : {}),
        pesquisa: normalize([nome, item.nomeCompleto ?? nome, numero, partido, uf, cargo].join(" ")),
      });
    }
  });
  const candidaturas = Array.from(new Map(candidates.map((candidate) => [candidate.id, candidate])).values())
    .sort((first, second) => first.uf.localeCompare(second.uf, "pt-BR") || first.cargo.localeCompare(second.cargo, "pt-BR") || first.nome.localeCompare(second.nome, "pt-BR"));
  return {
    geradoEm: new Date().toISOString(),
    fonte: "DivulgaCandContas — API pública do TSE (contingência)",
    filtro: "Situação da candidatura: Deferido ou Aguardando julgamento",
    totalOriginal: candidates.length,
    totalElegivel: candidaturas.length,
    totalComRedes: candidaturas.filter((candidate) => candidate.redesSociais.length > 0).length,
    totalComProposta: candidaturas.filter((candidate) => Boolean(candidate.propostaGovernoUrl)).length,
    candidaturas,
  };
}
