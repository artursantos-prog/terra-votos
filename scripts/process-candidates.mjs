import fs from "node:fs";
import path from "node:path";

const inputDirectory = process.env.CANDIDATES_SOURCE_DIR ?? "/home/ubuntu/upload";
const outputDirectory = "/home/ubuntu/webdev-static-assets";
const outputPath = path.join(outputDirectory, "candidatos-eleicoes-2026.json");
const summaryPath = path.join(outputDirectory, "candidatos-eleicoes-2026-resumo.json");
const electionId = "20322002026";

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
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

const fileNames = fs
  .readdirSync(inputDirectory)
  .filter((fileName) => /^consulta_cand_2026_(?:[A-Z]{2}|BRASIL)\.csv$/.test(fileName))
  .sort();

if (fileNames.length === 0) {
  throw new Error("Nenhum CSV principal de candidatos foi localizado.");
}

const candidatesById = new Map();

for (const fileName of fileNames) {
  const filePath = path.join(inputDirectory, fileName);
  const rows = fs.readFileSync(filePath, "latin1").split(/\r?\n/).filter(Boolean);
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

    if (!candidateId || !ballotNumber || !ballotName || ballotName === "#NULO" || !partyAcronym || !state || !office) {
      continue;
    }

    candidatesById.set(candidateId, {
      id: candidateId,
      nome: ballotName,
      nomeCompleto: fields[indexes.get("NM_CANDIDATO")]?.trim() || ballotName,
      numero: ballotNumber,
      partido: partyAcronym,
      partidoNome: fields[indexes.get("NM_PARTIDO")]?.trim() || partyAcronym,
      uf: state,
      cargo: office,
      situacao: fields[indexes.get("DS_SITUACAO_CANDIDATURA")]?.trim() || "Não informado",
      fotoUrl: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${electionId}/${candidateId}/${electoralUnit}`,
      pesquisa: normalize([ballotName, fields[indexes.get("NM_CANDIDATO")]?.trim(), ballotNumber, partyAcronym, state, office].filter(Boolean).join(" ")),
    });
  }
}

const candidates = [...candidatesById.values()].sort((first, second) =>
  first.uf.localeCompare(second.uf, "pt-BR") ||
  first.cargo.localeCompare(second.cargo, "pt-BR") ||
  first.nome.localeCompare(second.nome, "pt-BR"),
);

const summary = {
  arquivosProcessados: fileNames.length,
  candidatos: candidates.length,
  estados: [...new Set(candidates.map((candidate) => candidate.uf))].sort(),
  partidos: [...new Set(candidates.map((candidate) => candidate.partido))].sort(),
  cargos: [...new Set(candidates.map((candidate) => candidate.cargo))].sort(),
  fonte: "Dados públicos de candidaturas do TSE, consolidados a partir dos CSVs oficiais",
  fotos: "URL pública de foto do DivulgaCandContas por SQ_CANDIDATO",
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ candidatos: candidates }, null, 0));
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(JSON.stringify({ outputPath, summaryPath, ...summary }, null, 2));
