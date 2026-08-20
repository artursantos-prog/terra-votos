import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const inputDirectory = process.env.CANDIDATES_SOURCE_DIR ?? "/home/ubuntu/upload";
const complementaryDirectory = process.env.COMPLEMENTARY_SOURCE_DIR ?? inputDirectory;
const outputDirectory = "/home/ubuntu/webdev-static-assets";
const outputPath = path.join(outputDirectory, "candidatos-eleicoes-2026.json");
const summaryPath = path.join(outputDirectory, "candidatos-eleicoes-2026-resumo.json");
const electionId = "20322002026";
const eligibleStatuses = new Set(["DEFERIDO", "AGUARDANDO JULGAMENTO"]);
const portalStatusPaths = (process.env.PORTAL_STATUS_FILES ?? process.env.PORTAL_STATUS_FILE ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const socialZipPath = process.env.SOCIAL_SOURCE_ZIP;

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ";" && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

const fileNames = fs.readdirSync(inputDirectory)
  .filter((fileName) => /^consulta_cand_2026_(?:[A-Z]{2}|BRASIL)\.csv$/.test(fileName))
  .sort();
const complementaryFileNames = fs.readdirSync(complementaryDirectory)
  .filter((fileName) => /^consulta_cand_complementar_2026_(?:[A-Z]{2}|BR)\.csv$/.test(fileName))
  .sort();

if (!fileNames.length) throw new Error("Nenhum CSV principal de candidatos foi localizado.");

const candidatesById = new Map();
const judgementByCandidate = new Map();
const socialByCandidate = new Map();

for (const fileName of complementaryFileNames) {
  const rows = fs.readFileSync(path.join(complementaryDirectory, fileName), "latin1").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0]);
  const indexes = new Map(headers.map((header, index) => [header, index]));
  for (const row of rows.slice(1)) {
    const fields = parseCsvLine(row);
    const id = fields[indexes.get("SQ_CANDIDATO")]?.trim();
    const situation = fields[indexes.get("DS_SITUACAO_JULGAMENTO")]?.trim();
    if (id && situation) judgementByCandidate.set(id, situation);
  }
}

for (const portalStatusPath of portalStatusPaths) {
  if (!fs.existsSync(portalStatusPath)) continue;
  for (const entry of JSON.parse(fs.readFileSync(portalStatusPath, "utf8"))) {
    if (entry?.id && entry?.situacao) judgementByCandidate.set(String(entry.id), String(entry.situacao));
  }
}

if (socialZipPath && fs.existsSync(socialZipPath)) {
  const rows = execFileSync("unzip", ["-p", socialZipPath], { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 }).toString("latin1").split(/\r?\n/).filter(Boolean);
  if (rows.length > 1) {
    const headers = parseCsvLine(rows[0]);
    const indexes = new Map(headers.map((header, index) => [header, index]));
    for (const row of rows.slice(1)) {
      const fields = parseCsvLine(row);
      const id = fields[indexes.get("SQ_CANDIDATO")]?.trim();
      const url = fields[indexes.get("DS_URL")]?.trim();
      if (!id || !url || !/^https?:\/\//i.test(url)) continue;
      const links = socialByCandidate.get(id) ?? [];
      if (!links.includes(url)) links.push(url);
      socialByCandidate.set(id, links);
    }
  }
}

for (const fileName of fileNames) {
  const rows = fs.readFileSync(path.join(inputDirectory, fileName), "latin1").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0]);
  const indexes = new Map(headers.map((header, index) => [header, index]));
  for (const row of rows.slice(1)) {
    const fields = parseCsvLine(row);
    const candidateId = fields[indexes.get("SQ_CANDIDATO")]?.trim();
    const ballotNumber = fields[indexes.get("NR_CANDIDATO")]?.trim();
    const ballotName = fields[indexes.get("NM_URNA_CANDIDATO")]?.trim();
    const partyAcronym = fields[indexes.get("SG_PARTIDO")]?.trim();
    const state = fields[indexes.get("SG_UF")]?.trim();
    const office = fields[indexes.get("DS_CARGO")]?.trim();
    const electoralUnit = fields[indexes.get("SG_UE")]?.trim() || state;
    const situation = judgementByCandidate.get(candidateId) || fields[indexes.get("DS_SITUACAO_CANDIDATURA")]?.trim() || "Não informado";
    if (!candidateId || !ballotNumber || !ballotName || ballotName === "#NULO" || !partyAcronym || !state || !office || !eligibleStatuses.has(normalize(situation))) continue;
    candidatesById.set(candidateId, {
      id: candidateId,
      nome: ballotName,
      nomeCompleto: fields[indexes.get("NM_CANDIDATO")]?.trim() || ballotName,
      numero: ballotNumber,
      partido: partyAcronym,
      partidoNome: fields[indexes.get("NM_PARTIDO")]?.trim() || partyAcronym,
      uf: state,
      cargo: office,
      codigoCargo: Number(fields[indexes.get("CD_CARGO")]?.trim() || 0),
      unidadeEleitoral: electoralUnit,
      situacao: situation,
      fotoUrl: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${electionId}/${candidateId}/${electoralUnit}`,
      redesSociais: socialByCandidate.get(candidateId) ?? [],
      pesquisa: normalize([ballotName, fields[indexes.get("NM_CANDIDATO")]?.trim(), ballotNumber, partyAcronym, state, office].filter(Boolean).join(" ")),
    });
  }
}

const principalCandidates = new Map();
for (const candidate of candidatesById.values()) {
  if (["PRESIDENTE", "GOVERNADOR", "SENADOR"].includes(candidate.cargo)) {
    const key = `${candidate.uf}|${candidate.numero}|${candidate.cargo}`;
    principalCandidates.set(key, [...(principalCandidates.get(key) ?? []), candidate]);
  }
}

const candidates = [...candidatesById.values()].map((candidate) => {
  const principalOffice = candidate.cargo === "VICE-PRESIDENTE" ? "PRESIDENTE"
    : candidate.cargo === "VICE-GOVERNADOR" ? "GOVERNADOR"
      : candidate.cargo.includes("SUPLENTE") ? "SENADOR" : null;
  const options = principalOffice ? principalCandidates.get(`${candidate.uf}|${candidate.numero}|${principalOffice}`) ?? [] : [];
  const titular = options.length === 1 ? options[0] : undefined;
  return titular
    ? { ...candidate, titular: { id: titular.id, nome: titular.nome, cargo: titular.cargo } }
    : principalOffice ? { ...candidate, vinculoChapaIndisponivel: true } : candidate;
}).sort((first, second) => first.uf.localeCompare(second.uf, "pt-BR") || first.cargo.localeCompare(second.cargo, "pt-BR") || first.nome.localeCompare(second.nome, "pt-BR"));

const summary = {
  arquivosProcessados: fileNames.length + complementaryFileNames.length,
  candidatos: candidates.length,
  estados: [...new Set(candidates.map((candidate) => candidate.uf))].sort(),
  partidos: [...new Set(candidates.map((candidate) => candidate.partido))].sort(),
  cargos: [...new Set(candidates.map((candidate) => candidate.cargo))].sort(),
  perfisComRedes: candidates.filter((candidate) => candidate.redesSociais.length > 0).length,
  fonte: "Dados públicos de candidaturas do TSE, consolidados a partir dos CSVs oficiais",
  filtro: "Situação da candidatura: Deferido ou Aguardando julgamento",
  fotos: "URL pública de foto do DivulgaCandContas por SQ_CANDIDATO",
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ candidatos: candidates }, null, 0));
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ outputPath, summaryPath, ...summary }, null, 2));
